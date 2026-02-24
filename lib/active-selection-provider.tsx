"use client"

import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  getActiveSelection,
  getChainConfig,
  getMarketConfig,
  getNetworkConfig,
  setActiveSelection,
  type ActiveSelection,
} from "@/lib/network-config"
import { syncCometOnchainSelection } from "@/lib/comet-onchain"

interface ActiveSelectionContextValue {
  selection: ActiveSelection
  selectionKey: string
  chainName: string
  marketSymbol: string
  applySelection: (partial: Partial<ActiveSelection>) => ActiveSelection
  refreshSelection: () => void
}

const ActiveSelectionContext = createContext<ActiveSelectionContextValue | null>(null)

export function ActiveSelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<ActiveSelection>(() => getActiveSelection())
  const [selectionVersion, setSelectionVersion] = useState(0)

  const refreshSelection = useCallback(() => {
    const next = getActiveSelection()
    syncCometOnchainSelection(next)
    setSelection(next)
    setSelectionVersion((prev) => prev + 1)
  }, [])

  const applySelection = useCallback((partial: Partial<ActiveSelection>) => {
    const next = setActiveSelection(partial)
    syncCometOnchainSelection(next)
    setSelection(next)
    setSelectionVersion((prev) => prev + 1)

    try {
      window.dispatchEvent(new CustomEvent("compound:selection-changed", { detail: next }))
      window.dispatchEvent(new Event("onchain:updated"))
    } catch {}

    return next
  }, [])

  useEffect(() => {
    syncCometOnchainSelection(selection)

    const onStorage = () => refreshSelection()
    const onPopState = () => refreshSelection()

    window.addEventListener("storage", onStorage)
    window.addEventListener("popstate", onPopState)

    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("popstate", onPopState)
    }
  }, [selection, refreshSelection])

  const chain = getChainConfig(selection.chainKey)
  const market = getMarketConfig(selection.chainKey, selection.marketKey)
  const networkConfig = getNetworkConfig(selection.chainKey, selection.marketKey, selection.collateralSymbol)
  const selectionKey = `${selection.chainKey}:${selection.marketKey}:${selection.collateralSymbol}:${selectionVersion}`

  const contextValue = useMemo<ActiveSelectionContextValue>(
    () => ({
      selection,
      selectionKey,
      chainName: chain.name,
      marketSymbol: market.symbol,
      applySelection,
      refreshSelection,
    }),
    [selection, selectionKey, chain.name, market.symbol, applySelection, refreshSelection],
  )

  return (
    <ActiveSelectionContext.Provider value={contextValue}>
      <Fragment key={`${selectionKey}:${networkConfig.chainId}`}>{children}</Fragment>
    </ActiveSelectionContext.Provider>
  )
}

export function useActiveSelectionState(): ActiveSelectionContextValue {
  const ctx = useContext(ActiveSelectionContext)
  if (!ctx) {
    throw new Error("useActiveSelectionState must be used within ActiveSelectionProvider")
  }
  return ctx
}
