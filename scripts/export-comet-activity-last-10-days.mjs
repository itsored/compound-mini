import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  createPublicClient,
  decodeEventLog,
  decodeFunctionData,
  formatUnits,
  http,
  isAddressEqual,
} from "viem"

import { CHAIN_CONFIGS, CHAIN_ORDER } from "../lib/comet-market-registry.ts"

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_WINDOW_DAYS = 10
const DEFAULT_CHAIN_KEYS = CHAIN_ORDER.filter((key) => key !== "local")

const COMET_EVENT_ABI = [
  {
    type: "event",
    name: "Supply",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "dst", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SupplyCollateral",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "dst", type: "address", indexed: true },
      { name: "asset", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Withdraw",
    inputs: [
      { name: "src", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WithdrawCollateral",
    inputs: [
      { name: "src", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "asset", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
]

const COMET_FUNCTION_ABI = [
  {
    type: "function",
    name: "supply",
    stateMutability: "nonpayable",
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
]

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "..")

const windowDays = Number.parseInt(process.argv[2] || `${DEFAULT_WINDOW_DAYS}`, 10)
if (!Number.isFinite(windowDays) || windowDays <= 0) {
  console.error("Window must be a positive integer number of days.")
  process.exit(1)
}

const requestedChainKeys = process.env.CHAIN_KEYS
  ? process.env.CHAIN_KEYS.split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  : DEFAULT_CHAIN_KEYS

const invalidChainKeys = requestedChainKeys.filter((key) => !DEFAULT_CHAIN_KEYS.includes(key))
if (invalidChainKeys.length > 0) {
  console.error(`Invalid CHAIN_KEYS entries: ${invalidChainKeys.join(", ")}`)
  process.exit(1)
}

const endedAt = new Date()
const startedAt = new Date(endedAt.getTime() - windowDays * DAY_MS)
const outputDir = path.join(
  repoRoot,
  "reports",
  `comet-activity-${formatDateSlug(startedAt)}_to_${formatDateSlug(endedAt)}`,
)

function formatDateSlug(date) {
  return date.toISOString().slice(0, 10)
}

function formatTimestampUtc(value) {
  return new Date(value).toISOString()
}

function csvEscape(value) {
  const text = value == null ? "" : String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll(`"`, `""`)}"`
  }
  return text
}

function safeSelector(input) {
  return typeof input === "string" && input.length >= 10 ? input.slice(0, 10) : ""
}

function getRpcUrl(chainConfig) {
  if (chainConfig.rpcEnvVar && process.env[chainConfig.rpcEnvVar]) {
    return process.env[chainConfig.rpcEnvVar]
  }
  return chainConfig.defaultRpcUrl
}

function buildExplorerTxUrl(chainConfig, hash) {
  return `${chainConfig.explorerUrl.replace(/\/$/, "")}/tx/${hash}`
}

function getChunkSize(chainConfig) {
  switch (chainConfig.key) {
    case "mainnet":
    case "sepolia":
    case "polygon":
      return 2_000n
    case "arbitrum":
    case "optimism":
    case "base":
      return 20_000n
    case "scroll":
    case "linea":
    case "unichain":
      return 10_000n
    case "ronin":
    case "mantle":
      return 5_000n
    default:
      return 5_000n
  }
}

async function retry(label, fn, attempts = 4) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === attempts) break
      const delay = 500 * attempt
      console.warn(`${label} failed on attempt ${attempt}/${attempts}: ${error?.shortMessage || error?.message || error}`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const currentIndex = nextIndex
      nextIndex += 1
      if (currentIndex >= items.length) return
      results[currentIndex] = await mapper(items[currentIndex], currentIndex)
    }
  }

  const workerCount = Math.min(limit, items.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}

async function findStartBlock(client, targetTimestampSeconds) {
  const latest = await retry("get latest block", () => client.getBlock())
  let low = 0n
  let high = latest.number

  while (low < high) {
    const mid = low + (high - low) / 2n
    const block = await retry(`get block ${mid}`, () => client.getBlock({ blockNumber: mid }))
    if (Number(block.timestamp) >= targetTimestampSeconds) {
      high = mid
    } else {
      low = mid + 1n
    }
  }

  return { latestBlock: latest.number, startBlock: low, latestTimestamp: Number(latest.timestamp) }
}

function buildMarketLookups(chainConfig) {
  const markets = Object.values(chainConfig.markets)
  const cometAddresses = markets.map((market) => market.cometAddress)
  const marketByComet = new Map(
    markets.map((market) => [market.cometAddress.toLowerCase(), market]),
  )

  return { markets, cometAddresses, marketByComet }
}

function resolveTokenInfo(market, eventName, args) {
  if (eventName === "Supply" || eventName === "Withdraw") {
    return {
      symbol: market.baseToken.symbol,
      address: market.baseToken.address,
      decimals: market.baseToken.decimals,
      amountRaw: args.amount.toString(),
      amountFormatted: formatUnits(args.amount, market.baseToken.decimals),
    }
  }

  const assetAddress = args.asset
  const collateral = Object.values(market.collaterals).find((token) =>
    isAddressEqual(token.address, assetAddress),
  )

  return {
    symbol: collateral?.symbol || "UNKNOWN",
    address: assetAddress,
    decimals: collateral?.decimals ?? 18,
    amountRaw: args.amount.toString(),
    amountFormatted: formatUnits(args.amount, collateral?.decimals ?? 18),
  }
}

function summarizeEvent(event) {
  return `${event.eventName}:${event.assetSymbol}:${event.amountFormatted}`
}

function decodeCometInput(tx, marketsByComet) {
  if (!tx.to) return null
  const market = marketsByComet.get(tx.to.toLowerCase())
  if (!market || !tx.input || tx.input === "0x") return null

  try {
    const decoded = decodeFunctionData({
      abi: COMET_FUNCTION_ABI,
      data: tx.input,
    })

    const [asset, amount] = decoded.args
    let token = null
    if (isAddressEqual(asset, market.baseToken.address)) {
      token = market.baseToken
    } else {
      token =
        Object.values(market.collaterals).find((candidate) => isAddressEqual(candidate.address, asset)) ||
        null
    }

    return {
      functionName: decoded.functionName,
      assetAddress: asset,
      assetSymbol: token?.symbol || "UNKNOWN",
      amountRaw: amount.toString(),
      amountFormatted: formatUnits(amount, token?.decimals ?? 18),
    }
  } catch {
    return null
  }
}

async function scanChain(chainKey) {
  const chainConfig = CHAIN_CONFIGS[chainKey]
  const rpcUrl = getRpcUrl(chainConfig)
  const client = createPublicClient({ transport: http(rpcUrl, { timeout: 30_000 }) })
  const { markets, cometAddresses, marketByComet } = buildMarketLookups(chainConfig)
  const targetTimestampSeconds = Math.floor(startedAt.getTime() / 1000)
  const { latestBlock, startBlock } = await findStartBlock(client, targetTimestampSeconds)
  const chunkSize = getChunkSize(chainConfig)
  const txMap = new Map()

  console.log(
    `[${chainConfig.name}] scanning ${markets.length} markets from block ${startBlock} to ${latestBlock} via ${rpcUrl}`,
  )

  for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += chunkSize) {
    const toBlock = fromBlock + chunkSize - 1n > latestBlock ? latestBlock : fromBlock + chunkSize - 1n
    const logs = await retry(
      `[${chainConfig.key}] getLogs ${fromBlock}-${toBlock}`,
      () =>
        client.getLogs({
          address: cometAddresses,
          fromBlock,
          toBlock,
        }),
    )

    for (const log of logs) {
      const market = marketByComet.get(log.address.toLowerCase())
      if (!market) continue

      let decoded
      try {
        decoded = decodeEventLog({
          abi: COMET_EVENT_ABI,
          data: log.data,
          topics: log.topics,
        })
      } catch {
        continue
      }

      const tokenInfo = resolveTokenInfo(market, decoded.eventName, decoded.args)
      const key = `${chainKey}:${log.transactionHash.toLowerCase()}`
      const existing =
        txMap.get(key) ||
        {
          chainKey,
          chainId: chainConfig.chainId,
          chainName: chainConfig.name,
          isTestnet: chainConfig.isTestnet,
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          explorerUrl: buildExplorerTxUrl(chainConfig, log.transactionHash),
          marketsTouched: new Map(),
          events: [],
        }

      existing.marketsTouched.set(market.key, {
        marketKey: market.key,
        marketName: market.name,
        cometAddress: market.cometAddress,
        baseTokenSymbol: market.baseToken.symbol,
      })

      existing.events.push({
        eventName: decoded.eventName,
        marketKey: market.key,
        marketName: market.name,
        cometAddress: market.cometAddress,
        assetSymbol: tokenInfo.symbol,
        assetAddress: tokenInfo.address,
        amountRaw: tokenInfo.amountRaw,
        amountFormatted: tokenInfo.amountFormatted,
        actors:
          decoded.eventName === "Supply" || decoded.eventName === "SupplyCollateral"
            ? {
                from: decoded.args.from,
                to: decoded.args.dst,
              }
            : {
                from: decoded.args.src,
                to: decoded.args.to,
              },
      })

      txMap.set(key, existing)
    }
  }

  const txEntries = Array.from(txMap.values()).sort((a, b) => a.blockNumber - b.blockNumber)
  const blockCache = new Map()
  const codeCache = new Map()

  const enriched = await mapWithConcurrency(txEntries, 6, async (entry) => {
    const tx = await retry(`[${chainConfig.key}] getTransaction ${entry.txHash}`, () =>
      client.getTransaction({ hash: entry.txHash }),
    )

    let block = blockCache.get(tx.blockNumber?.toString())
    if (!block) {
      block = await retry(`[${chainConfig.key}] getBlock ${tx.blockNumber}`, () =>
        client.getBlock({ blockNumber: tx.blockNumber }),
      )
      blockCache.set(tx.blockNumber.toString(), block)
    }

    let code = codeCache.get(tx.from.toLowerCase())
    if (code == null) {
      code = await retry(`[${chainConfig.key}] getCode ${tx.from}`, () => client.getCode({ address: tx.from }))
      codeCache.set(tx.from.toLowerCase(), code)
    }

    const decodedInput = decodeCometInput(tx, marketByComet)
    const marketsTouched = Array.from(entry.marketsTouched.values())

    return {
      chain_key: entry.chainKey,
      chain_id: entry.chainId,
      chain_name: entry.chainName,
      is_testnet: entry.isTestnet,
      tx_hash: entry.txHash,
      block_number: entry.blockNumber,
      timestamp_unix: Number(block.timestamp),
      timestamp_utc: new Date(Number(block.timestamp) * 1000).toISOString(),
      wallet: tx.from,
      wallet_is_contract: code !== "0x",
      tx_to: tx.to || "",
      tx_input_selector: safeSelector(tx.input),
      direct_to_comet:
        Boolean(tx.to) && marketsTouched.some((market) => isAddressEqual(market.cometAddress, tx.to)),
      decoded_comet_function: decodedInput?.functionName || "",
      decoded_comet_asset_symbol: decodedInput?.assetSymbol || "",
      decoded_comet_asset_address: decodedInput?.assetAddress || "",
      decoded_comet_amount_raw: decodedInput?.amountRaw || "",
      decoded_comet_amount_formatted: decodedInput?.amountFormatted || "",
      market_keys: marketsTouched.map((market) => market.marketKey),
      market_names: marketsTouched.map((market) => market.marketName),
      comet_addresses: marketsTouched.map((market) => market.cometAddress),
      event_count: entry.events.length,
      event_summaries: entry.events.map(summarizeEvent),
      events: entry.events,
      explorer_url: entry.explorerUrl,
    }
  })

  return {
    chainKey,
    chainName: chainConfig.name,
    chainId: chainConfig.chainId,
    isTestnet: chainConfig.isTestnet,
    rpcUrl,
    startBlock: startBlock.toString(),
    latestBlock: latestBlock.toString(),
    transactionCount: enriched.length,
    uniqueWalletCount: new Set(enriched.map((item) => item.wallet.toLowerCase())).size,
    transactions: enriched,
  }
}

function buildWalletRows(transactions) {
  const walletMap = new Map()

  for (const tx of transactions) {
    const key = tx.wallet.toLowerCase()
    const existing =
      walletMap.get(key) ||
      {
        wallet: tx.wallet,
        wallet_is_contract: tx.wallet_is_contract,
        first_seen_unix: tx.timestamp_unix,
        last_seen_unix: tx.timestamp_unix,
        tx_count: 0,
        chains: new Set(),
        chain_market_pairs: new Set(),
        transaction_hashes: [],
        explorer_urls: [],
      }

    existing.first_seen_unix = Math.min(existing.first_seen_unix, tx.timestamp_unix)
    existing.last_seen_unix = Math.max(existing.last_seen_unix, tx.timestamp_unix)
    existing.tx_count += 1
    existing.chains.add(tx.chain_key)
    for (const marketKey of tx.market_keys) {
      existing.chain_market_pairs.add(`${tx.chain_key}:${marketKey}`)
    }
    existing.transaction_hashes.push(tx.tx_hash)
    existing.explorer_urls.push(tx.explorer_url)

    walletMap.set(key, existing)
  }

  return Array.from(walletMap.values())
    .sort((a, b) => a.first_seen_unix - b.first_seen_unix || a.wallet.localeCompare(b.wallet))
    .map((wallet, index) => ({
      rank_first_seen: index + 1,
      wallet: wallet.wallet,
      wallet_is_contract: wallet.wallet_is_contract,
      first_seen_unix: wallet.first_seen_unix,
      first_seen_utc: new Date(wallet.first_seen_unix * 1000).toISOString(),
      last_seen_unix: wallet.last_seen_unix,
      last_seen_utc: new Date(wallet.last_seen_unix * 1000).toISOString(),
      tx_count: wallet.tx_count,
      chain_count: wallet.chains.size,
      chains: Array.from(wallet.chains).sort(),
      chain_market_pairs: Array.from(wallet.chain_market_pairs).sort(),
      transaction_hashes: wallet.transaction_hashes,
      explorer_urls: wallet.explorer_urls,
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

  console.log(`Window start: ${formatTimestampUtc(startedAt.getTime())}`)
  console.log(`Window end:   ${formatTimestampUtc(endedAt.getTime())}`)
  console.log(`Output dir:   ${outputDir}`)

  const chainResults = []
  const failures = []

  for (const chainKey of requestedChainKeys) {
    try {
      const result = await scanChain(chainKey)
      chainResults.push(result)
      console.log(
        `[${result.chainName}] complete: ${result.transactionCount} txs, ${result.uniqueWalletCount} unique wallets`,
      )
    } catch (error) {
      const chainConfig = CHAIN_CONFIGS[chainKey]
      const message = error?.shortMessage || error?.message || String(error)
      failures.push({
        chainKey,
        chainName: chainConfig.name,
        message,
      })
      console.error(`[${chainConfig.name}] failed: ${message}`)
    }
  }

  const transactions = chainResults
    .flatMap((result) => result.transactions)
    .sort((a, b) => a.timestamp_unix - b.timestamp_unix || a.tx_hash.localeCompare(b.tx_hash))

  const wallets = buildWalletRows(transactions)
  const top100Wallets = wallets.slice(0, 100)
  const eoaWallets = wallets.filter((wallet) => !wallet.wallet_is_contract)
  const top100EoaWallets = eoaWallets.slice(0, 100)

  const transactionCsvRows = transactions.map((tx) => ({
    chain_key: tx.chain_key,
    chain_name: tx.chain_name,
    chain_id: tx.chain_id,
    is_testnet: tx.is_testnet,
    timestamp_utc: tx.timestamp_utc,
    block_number: tx.block_number,
    wallet: tx.wallet,
    wallet_is_contract: tx.wallet_is_contract,
    tx_hash: tx.tx_hash,
    tx_to: tx.tx_to,
    tx_input_selector: tx.tx_input_selector,
    direct_to_comet: tx.direct_to_comet,
    decoded_comet_function: tx.decoded_comet_function,
    decoded_comet_asset_symbol: tx.decoded_comet_asset_symbol,
    decoded_comet_asset_address: tx.decoded_comet_asset_address,
    decoded_comet_amount_raw: tx.decoded_comet_amount_raw,
    decoded_comet_amount_formatted: tx.decoded_comet_amount_formatted,
    market_keys: tx.market_keys.join("|"),
    market_names: tx.market_names.join("|"),
    comet_addresses: tx.comet_addresses.join("|"),
    event_count: tx.event_count,
    event_summaries: tx.event_summaries.join("|"),
    explorer_url: tx.explorer_url,
  }))

  const walletCsvRows = wallets.map((wallet) => ({
    rank_first_seen: wallet.rank_first_seen,
    wallet: wallet.wallet,
    wallet_is_contract: wallet.wallet_is_contract,
    first_seen_utc: wallet.first_seen_utc,
    last_seen_utc: wallet.last_seen_utc,
    tx_count: wallet.tx_count,
    chain_count: wallet.chain_count,
    chains: wallet.chains.join("|"),
    chain_market_pairs: wallet.chain_market_pairs.join("|"),
    transaction_hashes: wallet.transaction_hashes.join("|"),
  }))

  const top100WalletCsvRows = top100Wallets.map((wallet) => ({
    rank_first_seen: wallet.rank_first_seen,
    wallet: wallet.wallet,
    wallet_is_contract: wallet.wallet_is_contract,
    first_seen_utc: wallet.first_seen_utc,
    last_seen_utc: wallet.last_seen_utc,
    tx_count: wallet.tx_count,
    chain_count: wallet.chain_count,
    chains: wallet.chains.join("|"),
    chain_market_pairs: wallet.chain_market_pairs.join("|"),
    transaction_hashes: wallet.transaction_hashes.join("|"),
  }))

  const eoaWalletCsvRows = eoaWallets.map((wallet) => ({
    rank_first_seen: wallet.rank_first_seen,
    wallet: wallet.wallet,
    wallet_is_contract: wallet.wallet_is_contract,
    first_seen_utc: wallet.first_seen_utc,
    last_seen_utc: wallet.last_seen_utc,
    tx_count: wallet.tx_count,
    chain_count: wallet.chain_count,
    chains: wallet.chains.join("|"),
    chain_market_pairs: wallet.chain_market_pairs.join("|"),
    transaction_hashes: wallet.transaction_hashes.join("|"),
  }))

  const top100EoaWalletCsvRows = top100EoaWallets.map((wallet) => ({
    rank_first_seen: wallet.rank_first_seen,
    wallet: wallet.wallet,
    wallet_is_contract: wallet.wallet_is_contract,
    first_seen_utc: wallet.first_seen_utc,
    last_seen_utc: wallet.last_seen_utc,
    tx_count: wallet.tx_count,
    chain_count: wallet.chain_count,
    chains: wallet.chains.join("|"),
    chain_market_pairs: wallet.chain_market_pairs.join("|"),
    transaction_hashes: wallet.transaction_hashes.join("|"),
  }))

  const summary = {
    generated_at_utc: new Date().toISOString(),
    window_days: windowDays,
    window_start_utc: startedAt.toISOString(),
    window_end_utc: endedAt.toISOString(),
    included_chain_keys: chainResults.map((result) => result.chainKey),
    failed_chains: failures,
    total_transactions: transactions.length,
    total_unique_wallets: wallets.length,
    top100_wallet_count: top100Wallets.length,
    total_eoa_wallets: eoaWallets.length,
    top100_eoa_wallet_count: top100EoaWallets.length,
    chain_summaries: chainResults.map((result) => ({
      chain_key: result.chainKey,
      chain_name: result.chainName,
      chain_id: result.chainId,
      is_testnet: result.isTestnet,
      rpc_url: result.rpcUrl,
      start_block: result.startBlock,
      latest_block: result.latestBlock,
      transaction_count: result.transactionCount,
      unique_wallet_count: result.uniqueWalletCount,
    })),
  }

  await Promise.all([
    writeCsv(path.join(outputDir, "transactions.csv"), transactionCsvRows, [
      "chain_key",
      "chain_name",
      "chain_id",
      "is_testnet",
      "timestamp_utc",
      "block_number",
      "wallet",
      "wallet_is_contract",
      "tx_hash",
      "tx_to",
      "tx_input_selector",
      "direct_to_comet",
      "decoded_comet_function",
      "decoded_comet_asset_symbol",
      "decoded_comet_asset_address",
      "decoded_comet_amount_raw",
      "decoded_comet_amount_formatted",
      "market_keys",
      "market_names",
      "comet_addresses",
      "event_count",
      "event_summaries",
      "explorer_url",
    ]),
    writeCsv(path.join(outputDir, "wallets.csv"), walletCsvRows, [
      "rank_first_seen",
      "wallet",
      "wallet_is_contract",
      "first_seen_utc",
      "last_seen_utc",
      "tx_count",
      "chain_count",
      "chains",
      "chain_market_pairs",
      "transaction_hashes",
    ]),
    writeCsv(path.join(outputDir, "wallets_top100_first_seen.csv"), top100WalletCsvRows, [
      "rank_first_seen",
      "wallet",
      "wallet_is_contract",
      "first_seen_utc",
      "last_seen_utc",
      "tx_count",
      "chain_count",
      "chains",
      "chain_market_pairs",
      "transaction_hashes",
    ]),
    writeCsv(path.join(outputDir, "wallets_eoa.csv"), eoaWalletCsvRows, [
      "rank_first_seen",
      "wallet",
      "wallet_is_contract",
      "first_seen_utc",
      "last_seen_utc",
      "tx_count",
      "chain_count",
      "chains",
      "chain_market_pairs",
      "transaction_hashes",
    ]),
    writeCsv(path.join(outputDir, "wallets_eoa_top100_first_seen.csv"), top100EoaWalletCsvRows, [
      "rank_first_seen",
      "wallet",
      "wallet_is_contract",
      "first_seen_utc",
      "last_seen_utc",
      "tx_count",
      "chain_count",
      "chains",
      "chain_market_pairs",
      "transaction_hashes",
    ]),
    fs.writeFile(
      path.join(outputDir, "transactions.json"),
      JSON.stringify(transactions, null, 2),
      "utf8",
    ),
    fs.writeFile(
      path.join(outputDir, "wallets.json"),
      JSON.stringify(wallets, null, 2),
      "utf8",
    ),
    fs.writeFile(
      path.join(outputDir, "wallets_eoa.json"),
      JSON.stringify(eoaWallets, null, 2),
      "utf8",
    ),
    fs.writeFile(
      path.join(outputDir, "summary.json"),
      JSON.stringify(summary, null, 2),
      "utf8",
    ),
  ])

  console.log("")
  console.log(`Transactions: ${transactions.length}`)
  console.log(`Unique wallets: ${wallets.length}`)
  console.log(`Top-100 wallet file count: ${top100Wallets.length}`)
  console.log(`EOA wallets: ${eoaWallets.length}`)
  console.log(`Top-100 EOA wallet file count: ${top100EoaWallets.length}`)
  if (failures.length > 0) {
    console.log(`Failed chains: ${failures.map((failure) => failure.chainKey).join(", ")}`)
  }
  console.log(`Wrote: ${outputDir}`)
}

await main()
