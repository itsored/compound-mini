"use client"

import { createPublicClient, defineChain, formatUnits, http, parseUnits, type PublicClient } from "viem"
import cometAbi from "./abis/comet.json"
import {
  getActiveSelection,
  getChainConfig,
  getMarketConfig,
  getRpcCandidates,
  getRpcUrl,
  type ActiveSelection,
  type ChainKey,
} from "./network-config"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const

function buildChain(chainKey: ChainKey) {
  const chainConfig = getChainConfig(chainKey)
  const rpcCandidates = getRpcCandidates(chainKey)
  const primaryRpc = getRpcUrl(chainKey)
  const nativeCurrency =
    chainKey === "ronin"
      ? { name: "Ronin", symbol: "RON", decimals: 18 }
      : { name: "Ether", symbol: "ETH", decimals: 18 }

  return defineChain({
    id: chainConfig.chainId,
    name: chainConfig.name,
    nativeCurrency,
    rpcUrls: {
      default: { http: rpcCandidates.length > 0 ? rpcCandidates : [primaryRpc] },
      public: { http: rpcCandidates.length > 0 ? rpcCandidates : [primaryRpc] },
    },
    blockExplorers: {
      default: { name: "Explorer", url: chainConfig.explorerUrl },
    },
    testnet: chainConfig.isTestnet,
  })
}

const publicClientCache = new Map<ChainKey, PublicClient>()

export function getPublicClient(chainKey?: ChainKey): PublicClient {
  const resolvedChain = chainKey || getActiveSelection().chainKey
  const existing = publicClientCache.get(resolvedChain)
  if (existing) return existing

  const client = createPublicClient({
    chain: buildChain(resolvedChain),
    transport: http(getRpcUrl(resolvedChain)),
  })

  publicClientCache.set(resolvedChain, client)
  return client
}

export let ACTIVE_SELECTION = getActiveSelection()
export let ACTIVE_CHAIN = getChainConfig(ACTIVE_SELECTION.chainKey)
export let ACTIVE_MARKET = getMarketConfig(ACTIVE_SELECTION.chainKey, ACTIVE_SELECTION.marketKey)
export let ACTIVE_COLLATERAL =
  ACTIVE_MARKET.collaterals[ACTIVE_SELECTION.collateralSymbol] ||
  ACTIVE_MARKET.collaterals[ACTIVE_MARKET.defaultCollateralSymbol]

export let publicClient = getPublicClient(ACTIVE_SELECTION.chainKey)

export let COMET_ADDRESS = ACTIVE_MARKET.cometAddress
export let BASE_TOKEN_ADDRESS = ACTIVE_MARKET.baseToken.address
export let BASE_TOKEN_SYMBOL = ACTIVE_MARKET.baseToken.symbol
export let BASE_TOKEN_DECIMALS = ACTIVE_MARKET.baseToken.decimals

export let COLLATERAL_ADDRESS = ACTIVE_COLLATERAL.address
export let COLLATERAL_SYMBOL = ACTIVE_COLLATERAL.symbol
export let COLLATERAL_DECIMALS = ACTIVE_COLLATERAL.decimals

export let COLLATERAL_PRICE_FEED =
  (ACTIVE_COLLATERAL.priceFeed || ACTIVE_MARKET.baseToken.priceFeed || ZERO_ADDRESS) as `0x${string}`

// Backward compatibility exports for existing components.
export let USDC_ADDRESS = BASE_TOKEN_ADDRESS
export let WETH_ADDRESS = COLLATERAL_ADDRESS
export let CHAINLINK_ETH_USD_FEED = COLLATERAL_PRICE_FEED

export function syncCometOnchainSelection(selection?: ActiveSelection): void {
  const nextSelection = selection || getActiveSelection()
  const nextChain = getChainConfig(nextSelection.chainKey)
  const nextMarket = getMarketConfig(nextSelection.chainKey, nextSelection.marketKey)
  const nextCollateral =
    nextMarket.collaterals[nextSelection.collateralSymbol] ||
    nextMarket.collaterals[nextMarket.defaultCollateralSymbol]

  ACTIVE_SELECTION = {
    chainKey: nextSelection.chainKey,
    marketKey: nextMarket.key,
    collateralSymbol: nextCollateral.symbol,
  }
  ACTIVE_CHAIN = nextChain
  ACTIVE_MARKET = nextMarket
  ACTIVE_COLLATERAL = nextCollateral

  publicClient = getPublicClient(nextSelection.chainKey)

  COMET_ADDRESS = ACTIVE_MARKET.cometAddress
  BASE_TOKEN_ADDRESS = ACTIVE_MARKET.baseToken.address
  BASE_TOKEN_SYMBOL = ACTIVE_MARKET.baseToken.symbol
  BASE_TOKEN_DECIMALS = ACTIVE_MARKET.baseToken.decimals

  COLLATERAL_ADDRESS = ACTIVE_COLLATERAL.address
  COLLATERAL_SYMBOL = ACTIVE_COLLATERAL.symbol
  COLLATERAL_DECIMALS = ACTIVE_COLLATERAL.decimals

  COLLATERAL_PRICE_FEED =
    (ACTIVE_COLLATERAL.priceFeed || ACTIVE_MARKET.baseToken.priceFeed || ZERO_ADDRESS) as `0x${string}`

  USDC_ADDRESS = BASE_TOKEN_ADDRESS
  WETH_ADDRESS = COLLATERAL_ADDRESS
  CHAINLINK_ETH_USD_FEED = COLLATERAL_PRICE_FEED
}

syncCometOnchainSelection(ACTIVE_SELECTION)

if (typeof window !== "undefined") {
  window.addEventListener("compound:selection-changed", () => {
    syncCometOnchainSelection()
  })
}

export function toBaseUnits(value: bigint): number {
  return Number(formatUnits(value, BASE_TOKEN_DECIMALS))
}

export function toCollateralUnits(value: bigint): number {
  return Number(formatUnits(value, COLLATERAL_DECIMALS))
}

export function parseBaseAmount(value: string): bigint {
  return parseUnits(value, BASE_TOKEN_DECIMALS)
}

export function parseCollateralAmount(value: string): bigint {
  return parseUnits(value, COLLATERAL_DECIMALS)
}

export function toAnnualizedPercent(ratePerSecond: bigint): number {
  return (Number(ratePerSecond) / 1e18) * 31536000 * 100
}

export function getActiveMarketContext() {
  return {
    selection: ACTIVE_SELECTION,
    chain: ACTIVE_CHAIN,
    market: ACTIVE_MARKET,
    collateral: ACTIVE_COLLATERAL,
    addresses: {
      comet: COMET_ADDRESS,
      baseToken: BASE_TOKEN_ADDRESS,
      collateral: COLLATERAL_ADDRESS,
      collateralPriceFeed: COLLATERAL_PRICE_FEED,
    },
    symbols: {
      base: BASE_TOKEN_SYMBOL,
      collateral: COLLATERAL_SYMBOL,
    },
    decimals: {
      base: BASE_TOKEN_DECIMALS,
      collateral: COLLATERAL_DECIMALS,
    },
  }
}

export async function getBaseBalances(account: `0x${string}`) {
  const [supplied, borrowed] = await Promise.all([
    publicClient.readContract({ address: COMET_ADDRESS, abi: cometAbi, functionName: "balanceOf", args: [account] }),
    publicClient.readContract({ address: COMET_ADDRESS, abi: cometAbi, functionName: "borrowBalanceOf", args: [account] }),
  ])

  return {
    supplied: BigInt(supplied as any),
    borrowed: BigInt(borrowed as any),
  }
}

export async function getRates() {
  const util = (await publicClient.readContract({
    address: COMET_ADDRESS,
    abi: cometAbi,
    functionName: "getUtilization",
  })) as bigint

  const [supplyRate, borrowRate] = (await Promise.all([
    publicClient.readContract({ address: COMET_ADDRESS, abi: cometAbi, functionName: "getSupplyRate", args: [util] }),
    publicClient.readContract({ address: COMET_ADDRESS, abi: cometAbi, functionName: "getBorrowRate", args: [util] }),
  ])) as [bigint, bigint]

  return { utilization: util, supplyRate, borrowRate }
}
