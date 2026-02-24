"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Network, WifiOff, CheckCircle, AlertCircle, ChevronDown } from "lucide-react"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import {
  getAvailableChains,
  getAvailableCollaterals,
  getAvailableMarkets,
  getChainConfig,
  getChainKeyByChainId,
  getNetworkConfig,
  getMarketConfig,
  type ChainKey,
} from "@/lib/network-config"
import { useActiveSelectionState } from "@/lib/active-selection-provider"
import { motion } from "framer-motion"

interface NetworkSwitcherProps {
  className?: string
  variant?: "full" | "compact"
}

export function NetworkSwitcher({ className = "", variant = "full" }: NetworkSwitcherProps) {
  const { isConnected, chainId: accountChainId } = useAccount()
  const configChainId = useChainId()
  const walletChainId = accountChainId ?? configChainId
  const { switchChainAsync } = useSwitchChain()
  const [mounted, setMounted] = useState(false)
  const { selection, applySelection } = useActiveSelectionState()

  const [chainKey, setChainKey] = useState<ChainKey>(selection.chainKey)
  const [marketKey, setMarketKey] = useState<string>(selection.marketKey)
  const [collateralSymbol, setCollateralSymbol] = useState<string>(selection.collateralSymbol)
  const [isApplying, setIsApplying] = useState(false)
  const [isSwitchingWallet, setIsSwitchingWallet] = useState(false)
  const [pendingWalletSwitchChainId, setPendingWalletSwitchChainId] = useState<number | null>(null)
  const [switchError, setSwitchError] = useState<string | null>(null)
  const [isCompactOpen, setIsCompactOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setChainKey(selection.chainKey)
    setMarketKey(selection.marketKey)
    setCollateralSymbol(selection.collateralSymbol)
  }, [selection.chainKey, selection.marketKey, selection.collateralSymbol])

  const selectedChain = getChainConfig(chainKey)
  const selectedMarket = getMarketConfig(chainKey, marketKey)
  const selectedConfig = getNetworkConfig(chainKey, marketKey, collateralSymbol)

  const availableChains = useMemo(() => getAvailableChains(), [])
  const availableMarkets = useMemo(() => getAvailableMarkets(chainKey), [chainKey])
  const availableCollaterals = useMemo(() => getAvailableCollaterals(chainKey, marketKey), [chainKey, marketKey])

  const isCorrectNetwork = walletChainId === selectedChain.chainId
  const isDirty =
    chainKey !== selection.chainKey ||
    marketKey !== selection.marketKey ||
    collateralSymbol !== selection.collateralSymbol

  useEffect(() => {
    if (!availableMarkets.includes(marketKey)) {
      const fallbackMarket = selectedChain.defaultMarket
      setMarketKey(fallbackMarket)
      setCollateralSymbol(getMarketConfig(chainKey, fallbackMarket).defaultCollateralSymbol)
    }
  }, [availableMarkets, marketKey, selectedChain.defaultMarket, chainKey])

  useEffect(() => {
    if (!availableCollaterals.includes(collateralSymbol)) {
      setCollateralSymbol(selectedMarket.defaultCollateralSymbol)
    }
  }, [availableCollaterals, collateralSymbol, selectedMarket.defaultCollateralSymbol])

  useEffect(() => {
    if (pendingWalletSwitchChainId == null) return
    if (walletChainId === pendingWalletSwitchChainId) {
      setPendingWalletSwitchChainId(null)
      setSwitchError(null)
    }
  }, [walletChainId, pendingWalletSwitchChainId])

  useEffect(() => {
    if (!isConnected || walletChainId == null) return
    if (pendingWalletSwitchChainId != null) return
    const walletChainKey = getChainKeyByChainId(walletChainId)
    if (!walletChainKey || walletChainKey === selection.chainKey) return

    const walletChainConfig = getChainConfig(walletChainKey)
    const nextMarket = selection.marketKey in walletChainConfig.markets ? selection.marketKey : walletChainConfig.defaultMarket
    const nextCollateral = getMarketConfig(walletChainKey, nextMarket).defaultCollateralSymbol

    applySelection({
      chainKey: walletChainKey,
      marketKey: nextMarket,
      collateralSymbol: nextCollateral,
    })
    setSwitchError(null)
  }, [isConnected, walletChainId, selection.chainKey, selection.marketKey, applySelection, pendingWalletSwitchChainId])

  useEffect(() => {
    if (variant !== "compact") return
    if (isDirty || (!!isConnected && !isCorrectNetwork) || !!switchError) {
      setIsCompactOpen(true)
    }
  }, [variant, isDirty, isConnected, isCorrectNetwork, switchError])

  const onApplySelection = async () => {
    if (!isDirty) return
    setSwitchError(null)
    setIsApplying(true)
    const previousSelection = selection
    try {
      applySelection({ chainKey, marketKey, collateralSymbol })

      if (isConnected && walletChainId != null && walletChainId !== selectedChain.chainId) {
        try {
          setPendingWalletSwitchChainId(selectedChain.chainId)
          await switchChainAsync({ chainId: selectedChain.chainId })
        } catch (error: any) {
          setPendingWalletSwitchChainId(null)
          applySelection(previousSelection)
          const message =
            error?.shortMessage ||
            error?.cause?.shortMessage ||
            error?.message ||
            "Could not switch wallet network."
          setSwitchError(message)
        }
      }
    } finally {
      setIsApplying(false)
    }
  }

  const onSwitchWallet = async () => {
    if (!isConnected) return
    setSwitchError(null)
    setIsSwitchingWallet(true)
    try {
      setPendingWalletSwitchChainId(selectedChain.chainId)
      await switchChainAsync({ chainId: selectedChain.chainId })
      try {
        window.dispatchEvent(new Event("onchain:updated"))
      } catch {}
    } catch (error: any) {
      setPendingWalletSwitchChainId(null)
      const message =
        error?.shortMessage ||
        error?.cause?.shortMessage ||
        error?.message ||
        "Could not switch wallet network."
      setSwitchError(message)
    } finally {
      setIsSwitchingWallet(false)
    }
  }

  const status = (() => {
    if (!isConnected) {
      return {
        icon: WifiOff,
        color: "text-text-muted",
        bgColor: "bg-bg-tertiary",
        message: "Wallet not connected",
      }
    }

    if (!isCorrectNetwork) {
      return {
        icon: AlertCircle,
        color: "text-compound-warning-400",
        bgColor: "bg-compound-warning-900/20",
        message: `Switch wallet to ${selectedChain.name}`,
      }
    }

    return {
      icon: CheckCircle,
      color: "text-compound-success-400",
      bgColor: "bg-compound-success-900/20",
      message: "Wallet on selected chain",
    }
  })()

  const StatusIcon = status.icon

  if (!mounted) return null

  if (variant === "compact") {
    return (
      <Card className={`compound-card ${className}`}>
        <CardContent className="p-3">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2"
            onClick={() => setIsCompactOpen((prev) => !prev)}
            aria-expanded={isCompactOpen}
            aria-label="Toggle network settings"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Network className="h-4 w-4 text-text-tertiary" />
              <span className="text-sm font-medium text-text-primary">Network</span>
              <span className="truncate text-xs text-text-muted">
                {selectedChain.name} / {marketKey.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={selectedConfig.isTestnet ? "text-yellow-300 border-yellow-700" : "text-green-300 border-green-700"}>
                {selectedConfig.isTestnet ? "Testnet" : "Mainnet"}
              </Badge>
              <ChevronDown className={`h-4 w-4 text-text-tertiary transition-transform ${isCompactOpen ? "rotate-180" : ""}`} />
            </div>
          </button>

          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            <div className={`truncate ${status.color}`}>{status.message}</div>
            {isDirty && <span className="text-[11px] text-compound-warning-400">Unsaved</span>}
          </div>

          <div className={`overflow-hidden transition-all duration-200 ${isCompactOpen ? "mt-3 max-h-[1200px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-[11px] text-text-muted">Chain</div>
                <select
                  className="w-full rounded-md bg-bg-tertiary border border-border-primary p-2 text-xs"
                  value={chainKey}
                  onChange={(e) => {
                    const nextChain = e.target.value as ChainKey
                    const nextDefaultMarket = getChainConfig(nextChain).defaultMarket
                    const nextDefaultCollateral = getMarketConfig(nextChain, nextDefaultMarket).defaultCollateralSymbol
                    setChainKey(nextChain)
                    setMarketKey(nextDefaultMarket)
                    setCollateralSymbol(nextDefaultCollateral)
                  }}
                >
                  {availableChains.map((key) => {
                    const chain = getChainConfig(key)
                    return (
                      <option key={key} value={key}>
                        {chain.name}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="mb-1 text-[11px] text-text-muted">Market</div>
                  <select
                    className="w-full rounded-md bg-bg-tertiary border border-border-primary p-2 text-xs"
                    value={marketKey}
                    onChange={(e) => {
                      const nextMarket = e.target.value
                      setMarketKey(nextMarket)
                      setCollateralSymbol(getMarketConfig(chainKey, nextMarket).defaultCollateralSymbol)
                    }}
                  >
                    {availableMarkets.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-1 text-[11px] text-text-muted">Collateral</div>
                  <select
                    className="w-full rounded-md bg-bg-tertiary border border-border-primary p-2 text-xs"
                    value={collateralSymbol}
                    onChange={(e) => setCollateralSymbol(e.target.value)}
                  >
                    {availableCollaterals.map((symbol) => (
                      <option key={symbol} value={symbol}>
                        {symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className={`text-xs leading-snug break-words ${status.color}`}>{status.message}</div>
                <Button size="sm" className="w-full sm:w-auto" onClick={onApplySelection} disabled={isApplying || !isDirty}>
                  {isApplying ? "Applying..." : isDirty ? "Apply" : "Applied"}
                </Button>
              </div>

              {!isCorrectNetwork && isConnected && (
                <div className="bg-compound-warning-900/20 border border-compound-warning-700/30 p-2 rounded-lg text-xs text-text-tertiary">
                  <div className="mb-2 break-words">Wallet chain: {walletChainId ?? "unknown"} • Selected: {selectedChain.chainId}</div>
                  <Button size="sm" variant="outline" className="h-7 w-full text-xs sm:w-auto" onClick={onSwitchWallet} disabled={isSwitchingWallet}>
                    {isSwitchingWallet ? "Switching..." : `Switch Wallet to ${selectedChain.name}`}
                  </Button>
                  {switchError && <div className="mt-2 text-[11px] text-red-300">{switchError}</div>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="compound-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-text-tertiary" />
              <CardTitle className="text-lg">Chain & Market</CardTitle>
            </div>
            <Badge variant="outline" className={selectedConfig.isTestnet ? "text-yellow-300 border-yellow-700" : "text-green-300 border-green-700"}>
              {selectedConfig.isTestnet ? "Testnet" : "Mainnet"}
            </Badge>
          </div>
          <CardDescription className="text-text-tertiary">
            Select chain, market, and collateral profile.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className={`${status.bgColor} p-3 rounded-lg border border-current/20`}>
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon className={`h-4 w-4 ${status.color}`} />
              <span className={`text-sm font-medium ${status.color}`}>{status.message}</span>
            </div>
            <div className="text-xs text-text-tertiary">
              Selected: {selectedChain.name} (Chain ID: {selectedChain.chainId})
              {isConnected && <span className="ml-2">• Wallet: {walletChainId ?? "unknown"}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <label className="text-xs text-text-tertiary">
              Chain
              <select
                className="mt-1 w-full rounded-md bg-bg-tertiary border border-border-primary p-2 text-sm"
                value={chainKey}
                onChange={(e) => {
                  const nextChain = e.target.value as ChainKey
                  const nextDefaultMarket = getChainConfig(nextChain).defaultMarket
                  const nextDefaultCollateral = getMarketConfig(nextChain, nextDefaultMarket).defaultCollateralSymbol
                  setChainKey(nextChain)
                  setMarketKey(nextDefaultMarket)
                  setCollateralSymbol(nextDefaultCollateral)
                }}
              >
                {availableChains.map((key) => {
                  const chain = getChainConfig(key)
                  return (
                    <option key={key} value={key}>
                      {chain.name} ({chain.chainId})
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="text-xs text-text-tertiary">
              Market
              <select
                className="mt-1 w-full rounded-md bg-bg-tertiary border border-border-primary p-2 text-sm"
                value={marketKey}
                onChange={(e) => {
                  const nextMarket = e.target.value
                  setMarketKey(nextMarket)
                  setCollateralSymbol(getMarketConfig(chainKey, nextMarket).defaultCollateralSymbol)
                }}
              >
                {availableMarkets.map((key) => {
                  const market = getMarketConfig(chainKey, key)
                  return (
                    <option key={key} value={key}>
                      {key} ({market.symbol})
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="text-xs text-text-tertiary">
              Collateral
              <select
                className="mt-1 w-full rounded-md bg-bg-tertiary border border-border-primary p-2 text-sm"
                value={collateralSymbol}
                onChange={(e) => setCollateralSymbol(e.target.value)}
              >
                {availableCollaterals.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Button className="w-full" onClick={onApplySelection} disabled={isApplying || !isDirty}>
            {isApplying ? "Applying..." : isDirty ? "Apply Selection" : "Selection Applied"}
          </Button>

          <div className="bg-bg-tertiary p-3 rounded-lg text-xs text-text-tertiary space-y-1">
            <div>Comet: {selectedMarket.cometAddress}</div>
            <div>Base: {selectedMarket.baseToken.symbol} ({selectedMarket.baseToken.address})</div>
            <div>
              Collateral: {collateralSymbol} ({selectedMarket.collaterals[collateralSymbol]?.address || "N/A"})
            </div>
            <div>RPC: {selectedConfig.rpcUrl}</div>
            <div>Explorer: {selectedChain.explorerUrl}</div>
          </div>

          {!isCorrectNetwork && isConnected && (
            <div className="bg-compound-warning-900/20 border border-compound-warning-700/30 p-3 rounded-lg text-xs text-text-tertiary">
              <div className="mb-2">
                Wallet chain mismatch: switch wallet network to <strong>{selectedChain.name}</strong> (ID {selectedChain.chainId}) before sending transactions.
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onSwitchWallet} disabled={isSwitchingWallet}>
                {isSwitchingWallet ? "Switching..." : `Switch Wallet to ${selectedChain.name}`}
              </Button>
              {switchError && <div className="mt-2 text-[11px] text-red-300">{switchError}</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
