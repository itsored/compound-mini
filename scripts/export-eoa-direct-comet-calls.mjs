import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { CHAIN_CONFIGS } from "../lib/comet-market-registry.ts"

const ETHERSCAN_CHAIN_KEYS = [
  "sepolia",
  "mainnet",
  "arbitrum",
  "base",
  "optimism",
  "polygon",
  "scroll",
  "linea",
]

const requestedChainKeys = process.env.CHAIN_KEYS
  ? process.env.CHAIN_KEYS.split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  : ETHERSCAN_CHAIN_KEYS

const WINDOW_DAYS = 10
const PAGE_SIZE = 1_000
const REQUEST_INTERVAL_MS = 400

const apiKey = process.env.ETHERSCAN_API_KEY
if (!apiKey) {
  console.error("Set ETHERSCAN_API_KEY in the environment before running this script.")
  process.exit(1)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "..")

const endedAt = new Date()
const startedAt = new Date(endedAt.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000)
const outputSuffix = process.env.OUTPUT_SUFFIX
  ? `-${process.env.OUTPUT_SUFFIX.replace(/[^a-z0-9_-]+/gi, "-")}`
  : ""
const outputDir = path.join(
  repoRoot,
  "reports",
  `eoa-direct-comet-calls${outputSuffix}-${startedAt.toISOString().slice(0, 10)}_to_${endedAt.toISOString().slice(0, 10)}`,
)

let nextRequestAt = 0

function csvEscape(value) {
  const text = value == null ? "" : String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll(`"`, `""`)}"`
  }
  return text
}

function buildExplorerTxUrl(chainConfig, hash) {
  return `${chainConfig.explorerUrl.replace(/\/$/, "")}/tx/${hash}`
}

function etherscanUrl(chainId, params) {
  const url = new URL("https://api.etherscan.io/v2/api")
  url.searchParams.set("chainid", String(chainId))
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }
  url.searchParams.set("apikey", apiKey)
  return url.toString()
}

async function retry(label, fn, attempts = 4) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === attempts) break
      const message = error?.message || String(error)
      const isRateLimit = /rate limit/i.test(message)
      const delayMs = isRateLimit ? 1_500 * attempt : 500 * attempt
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      console.warn(`${label} failed on attempt ${attempt}/${attempts}: ${error?.message || error}`)
    }
  }
  throw lastError
}

async function fetchJson(url) {
  const now = Date.now()
  const waitMs = Math.max(0, nextRequestAt - now)
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }
  nextRequestAt = Math.max(now, nextRequestAt) + REQUEST_INTERVAL_MS

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }

  const payload = await response.json()
  const errorFields = [payload?.result, payload?.message, payload?.error?.message]
    .filter((value) => typeof value === "string")
    .join(" ")
  if (/rate limit/i.test(errorFields)) {
    throw new Error(errorFields)
  }

  return payload
}

async function getStartBlock(chainId, timestampSeconds) {
  const payload = await retry(`get start block ${chainId}`, () =>
    fetchJson(
      etherscanUrl(chainId, {
        module: "block",
        action: "getblocknobytime",
        timestamp: timestampSeconds,
        closest: "after",
      }),
    ),
  )

  if (payload.status !== "1") {
    throw new Error(payload.result || payload.message || "Unable to resolve start block")
  }

  return Number(payload.result)
}

async function getCode(chainId, address, cache) {
  const key = `${chainId}:${address.toLowerCase()}`
  if (cache.has(key)) return cache.get(key)

  const payload = await retry(`get code ${chainId}:${address}`, () =>
    fetchJson(
      etherscanUrl(chainId, {
        module: "proxy",
        action: "eth_getCode",
        address,
        tag: "latest",
      }),
    ),
  )

  const code = payload.result || "0x"
  cache.set(key, code)
  return code
}

function buildTargetMap(chainConfig) {
  const targets = new Map()

  for (const market of Object.values(chainConfig.markets)) {
    const cometKey = market.cometAddress.toLowerCase()
    const existingComet =
      targets.get(cometKey) ||
      {
        address: market.cometAddress,
        target_type: "comet",
        market_keys: new Set(),
        market_names: new Set(),
      }
    existingComet.market_keys.add(market.key)
    existingComet.market_names.add(market.name)
    targets.set(cometKey, existingComet)

    if (!market.bulkerAddress) continue

    const bulkerKey = market.bulkerAddress.toLowerCase()
    const existingBulker =
      targets.get(bulkerKey) ||
      {
        address: market.bulkerAddress,
        target_type: "bulker",
        market_keys: new Set(),
        market_names: new Set(),
      }
    existingBulker.market_keys.add(market.key)
    existingBulker.market_names.add(market.name)
    targets.set(bulkerKey, existingBulker)
  }

  return Array.from(targets.values())
}

async function getTxListForTarget(chainConfig, targetAddress, startBlock) {
  const rows = []
  let page = 1

  while (true) {
    const payload = await retry(`[${chainConfig.key}] txlist ${targetAddress} page ${page}`, () =>
      fetchJson(
        etherscanUrl(chainConfig.chainId, {
          module: "account",
          action: "txlist",
          address: targetAddress,
          startblock: startBlock,
          endblock: 99_999_999,
          page,
          offset: PAGE_SIZE,
          sort: "asc",
        }),
      ),
    )

    if (payload.status === "0" && payload.result === "No transactions found") {
      break
    }

    if (payload.status !== "1") {
      throw new Error(
        payload.result || payload.message || JSON.stringify(payload) || "txlist failed",
      )
    }

    rows.push(...payload.result)
    if (payload.result.length < PAGE_SIZE) break
    page += 1
  }

  return rows
}

function buildWalletRows(transactions) {
  const walletMap = new Map()

  for (const tx of transactions) {
    const key = tx.wallet.toLowerCase()
    const existing =
      walletMap.get(key) ||
      {
        wallet: tx.wallet,
        first_seen_unix: tx.timestamp_unix,
        last_seen_unix: tx.timestamp_unix,
        tx_count: 0,
        chains: new Set(),
        target_types: new Set(),
        market_keys: new Set(),
        tx_hashes: [],
      }

    existing.first_seen_unix = Math.min(existing.first_seen_unix, tx.timestamp_unix)
    existing.last_seen_unix = Math.max(existing.last_seen_unix, tx.timestamp_unix)
    existing.tx_count += 1
    existing.chains.add(tx.chain_key)
    tx.target_types.forEach((targetType) => existing.target_types.add(targetType))
    tx.market_keys.forEach((marketKey) => existing.market_keys.add(marketKey))
    existing.tx_hashes.push(tx.tx_hash)
    walletMap.set(key, existing)
  }

  return Array.from(walletMap.values())
    .sort((a, b) => a.first_seen_unix - b.first_seen_unix || a.wallet.localeCompare(b.wallet))
    .map((wallet, index) => ({
      rank_first_seen: index + 1,
      wallet: wallet.wallet,
      first_seen_utc: new Date(wallet.first_seen_unix * 1000).toISOString(),
      last_seen_utc: new Date(wallet.last_seen_unix * 1000).toISOString(),
      tx_count: wallet.tx_count,
      chains: Array.from(wallet.chains).sort(),
      target_types: Array.from(wallet.target_types).sort(),
      market_keys: Array.from(wallet.market_keys).sort(),
      tx_hashes: wallet.tx_hashes,
    }))
}

async function writeCsv(filePath, rows, columns) {
  const lines = [columns.join(",")]
  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column])).join(","))
  }
  await fs.writeFile(filePath, `${lines.join("\n")}\n`, "utf8")
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true })

  console.log(`Window start: ${startedAt.toISOString()}`)
  console.log(`Window end:   ${endedAt.toISOString()}`)
  console.log(`Output dir:   ${outputDir}`)

  const startTimestamp = Math.floor(startedAt.getTime() / 1000)
  const codeCache = new Map()
  const txMap = new Map()
  const failures = []

  for (const chainKey of requestedChainKeys) {
    const chainConfig = CHAIN_CONFIGS[chainKey]

    try {
      const startBlock = await getStartBlock(chainConfig.chainId, startTimestamp)
      const targets = buildTargetMap(chainConfig)
      console.log(`[${chainConfig.name}] start block ${startBlock}, scanning ${targets.length} target addresses`)

      for (const target of targets) {
        const txs = await getTxListForTarget(chainConfig, target.address, startBlock)

        for (const tx of txs) {
          if ((tx.txreceipt_status && tx.txreceipt_status !== "1") || tx.isError === "1") continue
          if (!tx.to || tx.to.toLowerCase() !== target.address.toLowerCase()) continue

          const code = await getCode(chainConfig.chainId, tx.from, codeCache)
          if (code !== "0x") continue

          const key = `${chainKey}:${tx.hash.toLowerCase()}`
          const existing =
            txMap.get(key) ||
            {
              chain_key: chainKey,
              chain_name: chainConfig.name,
              chain_id: chainConfig.chainId,
              is_testnet: chainConfig.isTestnet,
              wallet: tx.from,
              timestamp_unix: Number(tx.timeStamp),
              timestamp_utc: new Date(Number(tx.timeStamp) * 1000).toISOString(),
              tx_hash: tx.hash,
              nonce: tx.nonce,
              block_number: Number(tx.blockNumber),
              tx_to: tx.to,
              target_types: new Set(),
              market_keys: new Set(),
              market_names: new Set(),
              function_names: new Set(),
              method_ids: new Set(),
              explorer_url: buildExplorerTxUrl(chainConfig, tx.hash),
            }

          existing.target_types.add(target.target_type)
          target.market_keys.forEach((marketKey) => existing.market_keys.add(marketKey))
          target.market_names.forEach((marketName) => existing.market_names.add(marketName))
          if (tx.functionName) existing.function_names.add(tx.functionName)
          if (tx.methodId) existing.method_ids.add(tx.methodId)
          txMap.set(key, existing)
        }
      }
    } catch (error) {
      failures.push({
        chain_key: chainKey,
        chain_name: chainConfig.name,
        message: error?.message || String(error),
      })
      console.error(`[${chainConfig.name}] skipped: ${error?.message || error}`)
    }
  }

  const transactions = Array.from(txMap.values())
    .sort((a, b) => a.timestamp_unix - b.timestamp_unix || a.tx_hash.localeCompare(b.tx_hash))
    .map((tx) => ({
      ...tx,
      target_types: Array.from(tx.target_types).sort(),
      market_keys: Array.from(tx.market_keys).sort(),
      market_names: Array.from(tx.market_names).sort(),
      function_names: Array.from(tx.function_names).sort(),
      method_ids: Array.from(tx.method_ids).sort(),
    }))

  const wallets = buildWalletRows(transactions)

  const summary = {
    generated_at_utc: new Date().toISOString(),
    window_start_utc: startedAt.toISOString(),
    window_end_utc: endedAt.toISOString(),
    total_eoa_wallets: wallets.length,
    total_transactions: transactions.length,
    wallets_by_chain: transactions.reduce((acc, tx) => {
      acc[tx.chain_key] = acc[tx.chain_key] || new Set()
      acc[tx.chain_key].add(tx.wallet.toLowerCase())
      return acc
    }, {}),
    failures,
  }

  const summaryForWrite = {
    ...summary,
    wallets_by_chain: Object.fromEntries(
      Object.entries(summary.wallets_by_chain).map(([chainKey, set]) => [chainKey, set.size]),
    ),
  }

  const walletCsvRows = wallets.map((wallet) => ({
    rank_first_seen: wallet.rank_first_seen,
    wallet: wallet.wallet,
    first_seen_utc: wallet.first_seen_utc,
    last_seen_utc: wallet.last_seen_utc,
    tx_count: wallet.tx_count,
    chains: wallet.chains.join("|"),
    target_types: wallet.target_types.join("|"),
    market_keys: wallet.market_keys.join("|"),
    tx_hashes: wallet.tx_hashes.join("|"),
  }))

  const txCsvRows = transactions.map((tx) => ({
    chain_key: tx.chain_key,
    chain_name: tx.chain_name,
    chain_id: tx.chain_id,
    is_testnet: tx.is_testnet,
    wallet: tx.wallet,
    timestamp_utc: tx.timestamp_utc,
    block_number: tx.block_number,
    tx_hash: tx.tx_hash,
    tx_to: tx.tx_to,
    target_types: tx.target_types.join("|"),
    market_keys: tx.market_keys.join("|"),
    market_names: tx.market_names.join("|"),
    function_names: tx.function_names.join("|"),
    method_ids: tx.method_ids.join("|"),
    explorer_url: tx.explorer_url,
  }))

  await Promise.all([
    writeCsv(path.join(outputDir, "eoa_wallets.csv"), walletCsvRows, [
      "rank_first_seen",
      "wallet",
      "first_seen_utc",
      "last_seen_utc",
      "tx_count",
      "chains",
      "target_types",
      "market_keys",
      "tx_hashes",
    ]),
    writeCsv(path.join(outputDir, "eoa_transactions.csv"), txCsvRows, [
      "chain_key",
      "chain_name",
      "chain_id",
      "is_testnet",
      "wallet",
      "timestamp_utc",
      "block_number",
      "tx_hash",
      "tx_to",
      "target_types",
      "market_keys",
      "market_names",
      "function_names",
      "method_ids",
      "explorer_url",
    ]),
    fs.writeFile(path.join(outputDir, "eoa_wallets.json"), JSON.stringify(wallets, null, 2), "utf8"),
    fs.writeFile(path.join(outputDir, "eoa_transactions.json"), JSON.stringify(transactions, null, 2), "utf8"),
    fs.writeFile(path.join(outputDir, "summary.json"), JSON.stringify(summaryForWrite, null, 2), "utf8"),
  ])

  console.log(`EOA wallets: ${wallets.length}`)
  console.log(`Transactions: ${transactions.length}`)
  console.log(`Wrote: ${outputDir}`)
}

await main()
