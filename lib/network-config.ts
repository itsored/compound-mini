import {
  CHAIN_CONFIGS,
  CHAIN_ORDER,
  type ActiveSelection,
  type ChainKey,
  type MarketConfig,
  type TokenConfig,
  getAllChainConfigs,
  getChainConfig,
  getMarketConfig,
  getMarketsForChain,
  isValidChainKey,
} from './comet-market-registry'

export type NetworkType = ChainKey

export interface NetworkConfig {
  name: string
  chainKey: ChainKey
  marketKey: string
  chainId: number
  rpcUrl: string
  explorerUrl: string
  cometAddress: `0x${string}`
  wethAddress: `0x${string}`
  usdcAddress: `0x${string}`
  chainlinkEthUsdFeed: `0x${string}`
  isTestnet: boolean
  description: string
  baseTokenSymbol: string
  baseTokenDecimals: number
  collateralSymbol: string
  collateralDecimals: number
  availableMarkets: string[]
}

const DEFAULT_CHAIN_STORAGE_KEY = 'compound.activeSelection.v1'
const QUERY_CHAIN_KEY = 'chain'
const QUERY_MARKET_KEY = 'market'
const QUERY_COLLATERAL_KEY = 'collateral'

function resolveLegacyNetwork(raw?: string | null): ChainKey | null {
  if (!raw) return null
  const normalized = raw.trim().toLowerCase()
  if (isValidChainKey(normalized)) return normalized
  if (normalized === 'custom') return 'mainnet'
  return null
}

function getEnvDefaultChain(): ChainKey {
  const envChain =
    resolveLegacyNetwork(process.env.NEXT_PUBLIC_DEFAULT_CHAIN) ||
    resolveLegacyNetwork(process.env.NEXT_PUBLIC_NETWORK)

  return envChain || 'mainnet'
}

function getEnvDefaultMarket(chainKey: ChainKey): string {
  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_MARKET
  const chainConfig = getChainConfig(chainKey)
  return fromEnv && fromEnv in chainConfig.markets ? fromEnv : chainConfig.defaultMarket
}

function readSelectionFromStorage(): Partial<ActiveSelection> | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(DEFAULT_CHAIN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ActiveSelection>
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function readSelectionFromQuery(): Partial<ActiveSelection> | null {
  if (typeof window === 'undefined') return null

  try {
    const params = new URLSearchParams(window.location.search)
    const chainKey = params.get(QUERY_CHAIN_KEY) || undefined
    const marketKey = params.get(QUERY_MARKET_KEY) || undefined
    const collateralSymbol = params.get(QUERY_COLLATERAL_KEY) || undefined

    if (!chainKey && !marketKey && !collateralSymbol) return null

    return {
      chainKey: chainKey as ChainKey,
      marketKey,
      collateralSymbol,
    }
  } catch {
    return null
  }
}

function normalizeSelection(partial: Partial<ActiveSelection>): ActiveSelection {
  const fallbackChain = getEnvDefaultChain()
  const resolvedChain = partial.chainKey && isValidChainKey(partial.chainKey) ? partial.chainKey : fallbackChain

  const chainConfig = getChainConfig(resolvedChain)
  const resolvedMarket = partial.marketKey && partial.marketKey in chainConfig.markets ? partial.marketKey : getEnvDefaultMarket(resolvedChain)

  const marketConfig = getMarketConfig(resolvedChain, resolvedMarket)
  const resolvedCollateral =
    partial.collateralSymbol && partial.collateralSymbol in marketConfig.collaterals
      ? partial.collateralSymbol
      : marketConfig.defaultCollateralSymbol

  return {
    chainKey: resolvedChain,
    marketKey: resolvedMarket,
    collateralSymbol: resolvedCollateral,
  }
}

export function getActiveSelection(): ActiveSelection {
  const envDefaults = normalizeSelection({ chainKey: getEnvDefaultChain(), marketKey: getEnvDefaultMarket(getEnvDefaultChain()) })

  if (typeof window === 'undefined') {
    return envDefaults
  }

  const storageSelection = readSelectionFromStorage() || {}
  const querySelection = readSelectionFromQuery() || {}

  // Priority: URL query > local storage > env defaults
  return normalizeSelection({
    ...envDefaults,
    ...storageSelection,
    ...querySelection,
  })
}

export function setActiveSelection(selection: Partial<ActiveSelection>): ActiveSelection {
  const current = getActiveSelection()
  const normalized = normalizeSelection({ ...current, ...selection })

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(DEFAULT_CHAIN_STORAGE_KEY, JSON.stringify(normalized))
    } catch {}

    try {
      const url = new URL(window.location.href)
      url.searchParams.set(QUERY_CHAIN_KEY, normalized.chainKey)
      url.searchParams.set(QUERY_MARKET_KEY, normalized.marketKey)
      url.searchParams.set(QUERY_COLLATERAL_KEY, normalized.collateralSymbol)
      window.history.replaceState({}, '', url.toString())
    } catch {}
  }

  return normalized
}

export function clearActiveSelection(): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(DEFAULT_CHAIN_STORAGE_KEY)
  } catch {}

  try {
    const url = new URL(window.location.href)
    url.searchParams.delete(QUERY_CHAIN_KEY)
    url.searchParams.delete(QUERY_MARKET_KEY)
    url.searchParams.delete(QUERY_COLLATERAL_KEY)
    window.history.replaceState({}, '', url.toString())
  } catch {}
}

export function getCurrentNetwork(): NetworkType {
  return getActiveSelection().chainKey
}

function resolveSepoliaRpcUrl(): string {
  const sepoliaRpcPublic = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
  const sepoliaRpc = process.env.SEPOLIA_RPC_URL
  const infuraKey = process.env.NEXT_PUBLIC_INFURA_KEY
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY
  const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
  const resolvedAlchemyKey = alchemyKey || alchemyApiKey

  if (sepoliaRpcPublic) return sepoliaRpcPublic
  if (sepoliaRpc) return sepoliaRpc
  if (infuraKey) return `https://sepolia.infura.io/v3/${infuraKey}`
  if (resolvedAlchemyKey) return `https://eth-sepolia.g.alchemy.com/v2/${resolvedAlchemyKey}`

  return CHAIN_CONFIGS.sepolia.defaultRpcUrl
}

function getTokenOrFallback(token: TokenConfig | undefined, fallback: TokenConfig): TokenConfig {
  return token || fallback
}

function resolveChainRpcUrl(chainKey: ChainKey): string {
  if (chainKey === 'local') {
    return CHAIN_CONFIGS.local.defaultRpcUrl
  }

  if (chainKey === 'sepolia') {
    return resolveSepoliaRpcUrl()
  }

  const chainConfig = getChainConfig(chainKey)

  if (chainConfig.rpcEnvVar) {
    const envVal = process.env[chainConfig.rpcEnvVar]
    if (envVal && envVal.trim()) return envVal.trim()
  }

  // Server-side fallback for scripts where NEXT_PUBLIC_ may not be injected
  const serverFallbackVar = chainConfig.rpcEnvVar?.replace('NEXT_PUBLIC_', '')
  if (serverFallbackVar) {
    const envVal = process.env[serverFallbackVar]
    if (envVal && envVal.trim()) return envVal.trim()
  }

  return chainConfig.defaultRpcUrl
}

export function getRpcUrl(chainKey?: ChainKey): string {
  const resolvedChain = chainKey || getActiveSelection().chainKey
  return resolveChainRpcUrl(resolvedChain)
}

export function getRpcCandidates(chainKey?: ChainKey): string[] {
  const resolvedChain = chainKey || getActiveSelection().chainKey
  const chainConfig = getChainConfig(resolvedChain)
  const primary = getRpcUrl(resolvedChain)

  const candidates = new Set<string>()
  if (primary) candidates.add(primary)
  if (chainConfig.defaultRpcUrl) candidates.add(chainConfig.defaultRpcUrl)

  // Keep previous resilient Sepolia fallbacks.
  if (resolvedChain === 'sepolia') {
    candidates.add('https://ethereum-sepolia.publicnode.com')
    candidates.add('https://sepolia.publicnode.com')
  }

  return Array.from(candidates)
}

export function getNetworkConfig(
  chainKey: ChainKey,
  marketKey?: string,
  collateralSymbol?: string,
): NetworkConfig {
  const chainConfig = getChainConfig(chainKey)
  const selectedMarket = getMarketConfig(chainKey, marketKey)

  const defaultCollateral = selectedMarket.collaterals[selectedMarket.defaultCollateralSymbol]
  const selectedCollateral = getTokenOrFallback(
    collateralSymbol ? selectedMarket.collaterals[collateralSymbol] : undefined,
    defaultCollateral,
  )

  const fallbackBaseToken = selectedMarket.baseToken
  const fallbackCollateralToken = selectedCollateral

  return {
    name: chainConfig.name,
    chainKey,
    marketKey: selectedMarket.key,
    chainId: chainConfig.chainId,
    rpcUrl: getRpcUrl(chainKey),
    explorerUrl: chainConfig.explorerUrl,
    cometAddress: selectedMarket.cometAddress,
    wethAddress: fallbackCollateralToken.address,
    usdcAddress: fallbackBaseToken.address,
    chainlinkEthUsdFeed: (fallbackCollateralToken.priceFeed || fallbackBaseToken.priceFeed || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    isTestnet: chainConfig.isTestnet,
    description: chainConfig.description,
    baseTokenSymbol: fallbackBaseToken.symbol,
    baseTokenDecimals: fallbackBaseToken.decimals,
    collateralSymbol: fallbackCollateralToken.symbol,
    collateralDecimals: fallbackCollateralToken.decimals,
    availableMarkets: Object.keys(getMarketsForChain(chainKey)),
  }
}

export function getCurrentNetworkConfig(): NetworkConfig {
  const selection = getActiveSelection()
  return getNetworkConfig(selection.chainKey, selection.marketKey, selection.collateralSymbol)
}

export function getAvailableChains(): ChainKey[] {
  return CHAIN_ORDER
}

export function getChainKeyByChainId(chainId: number): ChainKey | null {
  for (const chainKey of CHAIN_ORDER) {
    if (CHAIN_CONFIGS[chainKey].chainId === chainId) return chainKey
  }
  return null
}

export function getAvailableMarkets(chainKey: ChainKey): string[] {
  return Object.keys(getMarketsForChain(chainKey))
}

export function getAvailableCollaterals(chainKey: ChainKey, marketKey?: string): string[] {
  const market = getMarketConfig(chainKey, marketKey)
  return Object.keys(market.collaterals)
}

export const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = CHAIN_ORDER.reduce((acc, chainKey) => {
  const chainConfig = getChainConfig(chainKey)
  acc[chainKey] = getNetworkConfig(chainKey, chainConfig.defaultMarket)
  return acc
}, {} as Record<NetworkType, NetworkConfig>)

export const NETWORK_ENV_VARS: Record<string, Record<string, string>> = {
  local: {
    RPC_URL: 'ETH_RPC_URL',
    FORK_BLOCK: 'FORK_BLOCK',
  },
  sepolia: {
    RPC_URL: 'SEPOLIA_RPC_URL',
    PUBLIC_RPC_URL: 'NEXT_PUBLIC_SEPOLIA_RPC_URL',
    INFURA_KEY: 'NEXT_PUBLIC_INFURA_KEY',
    ALCHEMY_KEY: 'NEXT_PUBLIC_ALCHEMY_KEY',
    ALCHEMY_API_KEY: 'NEXT_PUBLIC_ALCHEMY_API_KEY',
  },
  mainnet: {
    RPC_URL: 'NEXT_PUBLIC_MAINNET_RPC_URL',
  },
  arbitrum: {
    RPC_URL: 'NEXT_PUBLIC_ARBITRUM_RPC_URL',
  },
  base: {
    RPC_URL: 'NEXT_PUBLIC_BASE_RPC_URL',
  },
  optimism: {
    RPC_URL: 'NEXT_PUBLIC_OPTIMISM_RPC_URL',
  },
  polygon: {
    RPC_URL: 'NEXT_PUBLIC_POLYGON_RPC_URL',
  },
  scroll: {
    RPC_URL: 'NEXT_PUBLIC_SCROLL_RPC_URL',
  },
  linea: {
    RPC_URL: 'NEXT_PUBLIC_LINEA_RPC_URL',
  },
  unichain: {
    RPC_URL: 'NEXT_PUBLIC_UNICHAIN_RPC_URL',
  },
  ronin: {
    RPC_URL: 'NEXT_PUBLIC_RONIN_RPC_URL',
  },
  mantle: {
    RPC_URL: 'NEXT_PUBLIC_MANTLE_RPC_URL',
  },
}

export { getAllChainConfigs, getChainConfig, getMarketConfig, getMarketsForChain }
export type { ActiveSelection, ChainKey, MarketConfig }
