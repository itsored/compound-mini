import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  createPublicClient,
  decodeEventLog,
  decodeFunctionData,
  http,
  isAddressEqual,
} from "viem"

import { CHAIN_CONFIGS } from "../lib/comet-market-registry.ts"

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_DAYS = 10
const TARGET_TOTAL = 150
const BUFFER_PER_CHAIN = 8

const CHAIN_QUOTAS = [
  ["sepolia", 33],
  ["base", 28],
  ["arbitrum", 26],
  ["optimism", 22],
  ["polygon", 18],
  ["scroll", 10],
  ["linea", 7],
  ["unichain", 6],
  ["mainnet", 12],
]

const requestedChainKeys = process.env.CHAIN_KEYS
  ? process.env.CHAIN_KEYS.split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  : CHAIN_QUOTAS.map(([chainKey]) => chainKey)

const requestedQuotas = CHAIN_QUOTAS.filter(([chainKey]) => requestedChainKeys.includes(chainKey))

if (requestedQuotas.length === 0) {
  console.error("No valid chain keys requested.")
  process.exit(1)
}

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

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "..")

const endedAt = new Date()
const startedAt = new Date(endedAt.getTime() - WINDOW_DAYS * DAY_MS)
const outputDir = path.join(
  repoRoot,
  "reports",
  `comet-wallet-sample-${formatDateSlug(startedAt)}_to_${formatDateSlug(endedAt)}`,
)

function formatDateSlug(date) {
  return date.toISOString().slice(0, 10)
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
    case "sepolia":
    case "polygon":
      return 2_000n
    case "base":
    case "arbitrum":
    case "optimism":
      return 12_000n
    case "scroll":
    case "linea":
    case "unichain":
      return 8_000n
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
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
      console.warn(`${label} failed on attempt ${attempt}/${attempts}: ${error?.shortMessage || error?.message || error}`)
    }
  }
  throw lastError
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const index = nextIndex
      nextIndex += 1
      if (index >= items.length) return
      results[index] = await mapper(items[index], index)
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

  return { latestBlock: latest.number, startBlock: low }
}

function buildMarketPhases(chainConfig) {
  const allMarkets = Object.values(chainConfig.markets)
  const defaultMarket = chainConfig.markets[chainConfig.defaultMarket]
  const remainingMarkets = allMarkets.filter((market) => market.key !== chainConfig.defaultMarket)
  const phases = []
  if (defaultMarket) phases.push([defaultMarket])
  if (remainingMarkets.length > 0) phases.push(remainingMarkets)
  return phases
}

function decodeCometFunction(tx, marketByComet) {
  if (!tx.to) return null
  const market = marketByComet.get(tx.to.toLowerCase())
  if (!market || tx.input === "0x") return null

  try {
    const decoded = decodeFunctionData({
      abi: COMET_FUNCTION_ABI,
      data: tx.input,
    })
    const [asset] = decoded.args
    let assetSymbol = "UNKNOWN"
    if (isAddressEqual(asset, market.baseToken.address)) {
      assetSymbol = market.baseToken.symbol
    } else {
      const token = Object.values(market.collaterals).find((candidate) => isAddressEqual(candidate.address, asset))
      if (token) assetSymbol = token.symbol
    }

    return {
      functionName: decoded.functionName,
      assetAddress: asset,
      assetSymbol,
    }
  } catch {
    return null
  }
}

function addActor(existing, address, role, eventName) {
  const lower = address.toLowerCase()
  const next =
    existing.get(lower) ||
    {
      address,
      roles: new Set(),
      eventNames: new Set(),
    }
  next.roles.add(role)
  next.eventNames.add(eventName)
  existing.set(lower, next)
}

async function enrichCandidates(client, chainConfig, candidates, marketByComet, blockCache, codeCache) {
  return mapWithConcurrency(candidates, 8, async (candidate) => {
    const tx = await retry(`[${chainConfig.key}] getTransaction ${candidate.txHash}`, () =>
      client.getTransaction({ hash: candidate.txHash }),
    )

    let block = blockCache.get(tx.blockNumber.toString())
    if (!block) {
      block = await retry(`[${chainConfig.key}] getBlock ${tx.blockNumber}`, () =>
        client.getBlock({ blockNumber: tx.blockNumber }),
      )
      blockCache.set(tx.blockNumber.toString(), block)
    }

    const decoded = decodeCometFunction(tx, marketByComet)
    const participantWallets = []

    for (const actor of candidate.actors.values()) {
      if (actor.address.toLowerCase() === ZERO_ADDRESS) continue

      let code = codeCache.get(actor.address.toLowerCase())
      if (code == null) {
        code = await retry(`[${chainConfig.key}] getCode ${actor.address}`, () =>
          client.getCode({ address: actor.address }),
        )
        codeCache.set(actor.address.toLowerCase(), code)
      }

      if (code !== "0x") continue

      participantWallets.push({
        wallet: actor.address,
        wallet_roles: Array.from(actor.roles).sort(),
        actor_event_names: Array.from(actor.eventNames).sort(),
      })
    }

    return {
      chain_key: chainConfig.key,
      chain_name: chainConfig.name,
      chain_id: chainConfig.chainId,
      is_testnet: chainConfig.isTestnet,
      tx_hash: candidate.txHash,
      block_number: candidate.blockNumber,
      timestamp_unix: Number(block.timestamp),
      timestamp_utc: new Date(Number(block.timestamp) * 1000).toISOString(),
      tx_to: tx.to || "",
      tx_input_selector: safeSelector(tx.input),
      direct_to_comet:
        Boolean(tx.to) && Array.from(candidate.cometAddresses).some((address) => isAddressEqual(address, tx.to)),
      decoded_comet_function: decoded?.functionName || "",
      decoded_comet_asset_symbol: decoded?.assetSymbol || "",
      decoded_comet_asset_address: decoded?.assetAddress || "",
      market_keys: Array.from(candidate.marketKeys).sort(),
      market_names: Array.from(candidate.marketNames).sort(),
      comet_addresses: Array.from(candidate.cometAddresses),
      event_names: Array.from(candidate.eventNames).sort(),
      explorer_url: buildExplorerTxUrl(chainConfig, candidate.txHash),
      participant_wallets: participantWallets,
    }
  })
}

async function scanChainSample(chainKey, quota) {
  const chainConfig = CHAIN_CONFIGS[chainKey]
  const rpcUrl = getRpcUrl(chainConfig)
  const client = createPublicClient({ transport: http(rpcUrl, { timeout: 30_000 }) })
  const { latestBlock, startBlock } = await findStartBlock(client, Math.floor(startedAt.getTime() / 1000))
  const chunkSize = getChunkSize(chainConfig)
  const phases = buildMarketPhases(chainConfig)
  const captureLimit = quota + BUFFER_PER_CHAIN

  const wallets = new Map()
  const transactions = []
  const seenTxHashes = new Set()
  const blockCache = new Map()
  const codeCache = new Map()
  const usedMarkets = new Set()

  console.log(`[${chainConfig.name}] target ${quota} wallets (+${BUFFER_PER_CHAIN} buffer), scanning from block ${startBlock}`)

  for (const markets of phases) {
    if (wallets.size >= captureLimit) break

    const marketByComet = new Map(markets.map((market) => [market.cometAddress.toLowerCase(), market]))
    const addresses = markets.map((market) => market.cometAddress)
    markets.forEach((market) => usedMarkets.add(market.key))

    for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += chunkSize) {
      const toBlock = fromBlock + chunkSize - 1n > latestBlock ? latestBlock : fromBlock + chunkSize - 1n
      const logs = await retry(
        `[${chainConfig.key}] getLogs ${fromBlock}-${toBlock}`,
        () =>
          client.getLogs({
            address: addresses,
            fromBlock,
            toBlock,
          }),
      )

      const candidatesByTx = new Map()

      for (const log of logs) {
        if (seenTxHashes.has(log.transactionHash.toLowerCase())) continue

        const market = marketByComet.get(log.address.toLowerCase())
        if (!market) continue

        const key = log.transactionHash.toLowerCase()
        const existing =
          candidatesByTx.get(key) ||
          {
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
            marketKeys: new Set(),
            marketNames: new Set(),
            cometAddresses: new Set(),
            eventNames: new Set(),
            actors: new Map(),
          }

        existing.marketKeys.add(market.key)
        existing.marketNames.add(market.name)
        existing.cometAddresses.add(market.cometAddress)

        try {
          const decoded = decodeEventLog({
            abi: COMET_EVENT_ABI,
            data: log.data,
            topics: log.topics,
          })
          existing.eventNames.add(decoded.eventName)

          if (decoded.eventName === "Supply" || decoded.eventName === "SupplyCollateral") {
            addActor(existing.actors, decoded.args.from, "from", decoded.eventName)
            addActor(existing.actors, decoded.args.dst, "dst", decoded.eventName)
          }

          if (decoded.eventName === "Withdraw" || decoded.eventName === "WithdrawCollateral") {
            addActor(existing.actors, decoded.args.src, "src", decoded.eventName)
            addActor(existing.actors, decoded.args.to, "to", decoded.eventName)
          }
        } catch {
          existing.eventNames.add("Unknown")
        }

        candidatesByTx.set(key, existing)
      }

      const candidates = Array.from(candidatesByTx.values()).sort((a, b) => a.blockNumber - b.blockNumber)
      const enriched = await enrichCandidates(client, chainConfig, candidates, marketByComet, blockCache, codeCache)

      for (const tx of enriched) {
        seenTxHashes.add(tx.tx_hash.toLowerCase())
        if (tx.participant_wallets.length === 0) continue

        for (const participant of tx.participant_wallets) {
          const walletKey = participant.wallet.toLowerCase()
          const selectedWallet = wallets.get(walletKey)
          const canAddWallet = wallets.size < captureLimit

          if (!selectedWallet && !canAddWallet) {
            continue
          }

          if (!selectedWallet) {
            wallets.set(walletKey, {
              wallet: participant.wallet,
              wallet_is_contract: false,
              first_seen_unix: tx.timestamp_unix,
              first_seen_utc: tx.timestamp_utc,
              representative_tx_hash: tx.tx_hash,
              representative_explorer_url: tx.explorer_url,
              chains: new Set([tx.chain_key]),
              market_keys: new Set(tx.market_keys),
              tx_hashes: [tx.tx_hash],
              wallet_roles: new Set(participant.wallet_roles),
            })
          } else {
            selectedWallet.tx_hashes.push(tx.tx_hash)
            tx.market_keys.forEach((marketKey) => selectedWallet.market_keys.add(marketKey))
            participant.wallet_roles.forEach((role) => selectedWallet.wallet_roles.add(role))
          }

          transactions.push({
            ...tx,
            wallet: participant.wallet,
            wallet_is_contract: false,
            wallet_roles: participant.wallet_roles,
            actor_event_names: participant.actor_event_names,
          })
        }
      }

      if (wallets.size >= captureLimit) break
    }
  }

  const walletRows = Array.from(wallets.values())
    .sort((a, b) => a.first_seen_unix - b.first_seen_unix || a.wallet.localeCompare(b.wallet))
    .map((wallet, index) => ({
      chain_key: chainConfig.key,
      chain_name: chainConfig.name,
      rank_within_chain: index + 1,
      wallet: wallet.wallet,
      wallet_is_contract: wallet.wallet_is_contract,
      first_seen_utc: wallet.first_seen_utc,
      tx_count_in_chain_sample: wallet.tx_hashes.length,
      representative_tx_hash: wallet.representative_tx_hash,
      representative_explorer_url: wallet.representative_explorer_url,
      wallet_roles: Array.from(wallet.wallet_roles).sort(),
      market_keys: Array.from(wallet.market_keys).sort(),
      tx_hashes: wallet.tx_hashes,
    }))

  return {
    chainKey: chainConfig.key,
    chainName: chainConfig.name,
    quota,
    scannedMarketKeys: Array.from(usedMarkets),
    rpcUrl,
    walletRows,
    transactions,
  }
}

function combineSamples(chainSamples) {
  const selectedWalletKeys = new Set()
  const selectedWallets = []
  const selectedTransactions = []
  const selectedWalletsByChain = new Map()
  const countsByChain = new Map()
  const preferredLargestChain = chainSamples.some((sample) => sample.chainKey === "sepolia")
    ? "sepolia"
    : chainSamples[0]?.chainKey
  const preferredLargestQuota =
    chainSamples.find((sample) => sample.chainKey === preferredLargestChain)?.quota ?? Number.POSITIVE_INFINITY
  const maxOtherChainCount = Number.isFinite(preferredLargestQuota)
    ? Math.max(preferredLargestQuota - 1, 0)
    : Number.POSITIVE_INFINITY

  for (const sample of chainSamples) {
    let takenForChain = 0
    for (const wallet of sample.walletRows) {
      if (takenForChain >= sample.quota) break
      const key = wallet.wallet.toLowerCase()
      if (selectedWalletKeys.has(key)) continue

      selectedWalletKeys.add(key)
      selectedWallets.push({
        primary_chain_key: sample.chainKey,
        primary_chain_name: sample.chainName,
        ...wallet,
      })
      selectedWalletsByChain.set(key, sample.chainKey)
      countsByChain.set(sample.chainKey, (countsByChain.get(sample.chainKey) || 0) + 1)
      takenForChain += 1
    }
  }

  if (selectedWallets.length < TARGET_TOTAL) {
    for (const sample of chainSamples) {
      for (const wallet of sample.walletRows) {
        if (selectedWallets.length >= TARGET_TOTAL) break
        const key = wallet.wallet.toLowerCase()
        if (selectedWalletKeys.has(key)) continue
        if (
          sample.chainKey !== preferredLargestChain &&
          (countsByChain.get(sample.chainKey) || 0) >= maxOtherChainCount
        ) {
          continue
        }

        selectedWalletKeys.add(key)
        selectedWallets.push({
          primary_chain_key: sample.chainKey,
          primary_chain_name: sample.chainName,
          ...wallet,
        })
        selectedWalletsByChain.set(key, sample.chainKey)
        countsByChain.set(sample.chainKey, (countsByChain.get(sample.chainKey) || 0) + 1)
      }
    }
  }

  for (const sample of chainSamples) {
    for (const tx of sample.transactions) {
      const key = tx.wallet.toLowerCase()
      if (!selectedWalletKeys.has(key)) continue
      if (selectedWalletsByChain.get(key) !== sample.chainKey) continue
      selectedTransactions.push(tx)
    }
  }

  selectedWallets.sort(
    (a, b) =>
      a.rank_within_chain - b.rank_within_chain ||
      a.primary_chain_key.localeCompare(b.primary_chain_key) ||
      a.wallet.localeCompare(b.wallet),
  )
  selectedTransactions.sort(
    (a, b) => a.timestamp_unix - b.timestamp_unix || a.tx_hash.localeCompare(b.tx_hash),
  )

  return { selectedWallets, selectedTransactions }
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

  const chainSamples = []
  const failures = []
  for (const [chainKey, quota] of requestedQuotas) {
    try {
      const sample = await scanChainSample(chainKey, quota)
      chainSamples.push(sample)
      console.log(`[${sample.chainName}] captured ${sample.walletRows.length} wallet candidates`)
    } catch (error) {
      const chainConfig = CHAIN_CONFIGS[chainKey]
      const message = error?.shortMessage || error?.message || String(error)
      failures.push({
        chain_key: chainKey,
        chain_name: chainConfig.name,
        message,
      })
      console.error(`[${chainConfig.name}] skipped: ${message}`)
    }
  }

  const { selectedWallets, selectedTransactions } = combineSamples(chainSamples)

  const walletCsvRows = selectedWallets.map((wallet) => ({
    primary_chain_key: wallet.primary_chain_key,
    primary_chain_name: wallet.primary_chain_name,
    rank_within_chain: wallet.rank_within_chain,
    wallet: wallet.wallet,
    wallet_is_contract: wallet.wallet_is_contract,
    first_seen_utc: wallet.first_seen_utc,
    tx_count_in_chain_sample: wallet.tx_count_in_chain_sample,
    representative_tx_hash: wallet.representative_tx_hash,
    representative_explorer_url: wallet.representative_explorer_url,
    wallet_roles: wallet.wallet_roles.join("|"),
    market_keys: wallet.market_keys.join("|"),
    tx_hashes: wallet.tx_hashes.join("|"),
  }))

  const txCsvRows = selectedTransactions.map((tx) => ({
    chain_key: tx.chain_key,
    chain_name: tx.chain_name,
    chain_id: tx.chain_id,
    is_testnet: tx.is_testnet,
    timestamp_utc: tx.timestamp_utc,
    block_number: tx.block_number,
    wallet: tx.wallet,
    wallet_is_contract: tx.wallet_is_contract,
    wallet_roles: tx.wallet_roles.join("|"),
    tx_hash: tx.tx_hash,
    tx_to: tx.tx_to,
    tx_input_selector: tx.tx_input_selector,
    direct_to_comet: tx.direct_to_comet,
    decoded_comet_function: tx.decoded_comet_function,
    decoded_comet_asset_symbol: tx.decoded_comet_asset_symbol,
    decoded_comet_asset_address: tx.decoded_comet_asset_address,
    market_keys: tx.market_keys.join("|"),
    market_names: tx.market_names.join("|"),
    comet_addresses: tx.comet_addresses.join("|"),
    event_names: tx.event_names.join("|"),
    actor_event_names: tx.actor_event_names.join("|"),
    explorer_url: tx.explorer_url,
  }))

  const chainCounts = selectedWallets.reduce((acc, wallet) => {
    acc[wallet.primary_chain_key] = (acc[wallet.primary_chain_key] || 0) + 1
    return acc
  }, {})

  const summary = {
    generated_at_utc: new Date().toISOString(),
    window_start_utc: startedAt.toISOString(),
    window_end_utc: endedAt.toISOString(),
    target_total_wallets: TARGET_TOTAL,
    selected_wallet_count: selectedWallets.length,
    selected_transaction_count: selectedTransactions.length,
    selected_wallets_by_chain: chainCounts,
    quotas: Object.fromEntries(requestedQuotas),
    chain_candidate_counts: Object.fromEntries(
      chainSamples.map((sample) => [sample.chainKey, sample.walletRows.length]),
    ),
    failures,
  }

  await Promise.all([
    writeCsv(path.join(outputDir, "sampled_wallets.csv"), walletCsvRows, [
      "primary_chain_key",
      "primary_chain_name",
      "rank_within_chain",
      "wallet",
      "wallet_is_contract",
      "first_seen_utc",
      "tx_count_in_chain_sample",
      "representative_tx_hash",
      "representative_explorer_url",
      "wallet_roles",
      "market_keys",
      "tx_hashes",
    ]),
    writeCsv(path.join(outputDir, "sampled_transactions.csv"), txCsvRows, [
      "chain_key",
      "chain_name",
      "chain_id",
      "is_testnet",
      "timestamp_utc",
      "block_number",
      "wallet",
      "wallet_is_contract",
      "wallet_roles",
      "tx_hash",
      "tx_to",
      "tx_input_selector",
      "direct_to_comet",
      "decoded_comet_function",
      "decoded_comet_asset_symbol",
      "decoded_comet_asset_address",
      "market_keys",
      "market_names",
      "comet_addresses",
      "event_names",
      "actor_event_names",
      "explorer_url",
    ]),
    fs.writeFile(path.join(outputDir, "sampled_wallets.json"), JSON.stringify(selectedWallets, null, 2), "utf8"),
    fs.writeFile(path.join(outputDir, "sampled_transactions.json"), JSON.stringify(selectedTransactions, null, 2), "utf8"),
    fs.writeFile(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2), "utf8"),
  ])

  console.log(`Selected wallets: ${selectedWallets.length}`)
  console.log(`Selected transactions: ${selectedTransactions.length}`)
  console.log(`Wrote: ${outputDir}`)
}

await main()
