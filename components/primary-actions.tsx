"use client"

import { useAccount } from "wagmi"
import { useGuestMode } from "@/lib/guest-mode"
import { Card, CardContent } from "@/components/ui/card"
import { 
  PiggyBank, 
  ArrowDownRight, 
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight
} from "lucide-react"
import { useState, useEffect } from "react"
import {
  publicClient,
  COMET_ADDRESS,
  WETH_ADDRESS,
  BASE_TOKEN_SYMBOL,
  COLLATERAL_SYMBOL,
  toBaseUnits,
  toCollateralUnits,
} from "@/lib/comet-onchain"
import cometAbi from "@/lib/abis/comet.json"
import erc20Abi from "@/lib/abis/erc20.json"

interface ActionState {
  canSupply: boolean
  canBorrow: boolean
  canWithdraw: boolean
  canRepay: boolean
  hasPosition: boolean
  collateralWalletBalance: number
  collateralValue: number
  borrowValue: number
}

export function PrimaryActions() {
  const { address, isConnected } = useAccount()
  const { guest } = useGuestMode()
  const [actionState, setActionState] = useState<ActionState | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isConnected && address) {
      loadActionState()
    }
  }, [isConnected, address])

  const loadActionState = async () => {
    if (!address) return
    
    setLoading(true)
    try {
      const [wethBalance, collateralBalance, borrowBalance] = await Promise.all([
        publicClient.readContract({ 
          address: WETH_ADDRESS, 
          abi: erc20Abi as any, 
          functionName: "balanceOf", 
          args: [address] 
        }) as Promise<bigint>,
        publicClient.readContract({ 
          address: COMET_ADDRESS, 
          abi: cometAbi as any, 
          functionName: "collateralBalanceOf", 
          args: [address, WETH_ADDRESS] 
        }) as Promise<bigint>,
        publicClient.readContract({ 
          address: COMET_ADDRESS, 
          abi: cometAbi as any, 
          functionName: "borrowBalanceOf", 
          args: [address] 
        }) as Promise<bigint>
      ])

      const collateralWalletBalance = toCollateralUnits(wethBalance)
      const collateralBal = toCollateralUnits(collateralBalance)
      const borrowBal = toBaseUnits(borrowBalance)
      const hasPosition = collateralBal > 0 || borrowBal > 0

      setActionState({
        canSupply: collateralWalletBalance > 0,
        canBorrow: hasPosition && collateralBal > 0,
        canWithdraw: hasPosition && collateralBal > 0,
        canRepay: hasPosition && borrowBal > 0,
        hasPosition,
        collateralWalletBalance,
        collateralValue: collateralBal,
        borrowValue: borrowBal
      })
    } catch (error) {
      console.error("Error loading action state:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return null // Don't show actions if not connected
  }

  if (loading) {
    return (
        <div className="w-full max-w-md mx-auto px-4 pb-6">
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-compound-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-tertiary text-sm">Loading actions...</p>
          </div>
        </div>
    )
  }

  if (!actionState) {
    return null
  }

  return (
        <div className="w-full max-w-md mx-auto px-4 pb-24">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-text-primary mb-1">Quick Actions</h2>
            <p className="text-sm text-text-tertiary">Essential DeFi operations</p>
          </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Supply Action */}
        <Card 
          className={`compound-card transition-all duration-200 ${
            actionState.canSupply 
              ? 'hover:bg-bg-tertiary hover:border-border-accent cursor-pointer' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          onClick={actionState.canSupply ? () => window.location.href = "/supply" : undefined}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  actionState.canSupply ? 'bg-compound-primary-500/20' : 'bg-compound-neutral-600/20'
                }`}>
                  <PiggyBank className="h-6 w-6 text-compound-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Supply Assets</h3>
                  <p className="text-sm text-text-tertiary">
                    {actionState.canSupply 
                      ? `${actionState.collateralWalletBalance.toFixed(4)} ${COLLATERAL_SYMBOL} available`
                      : `No ${COLLATERAL_SYMBOL} to supply`
                    }
                  </p>
                </div>
              </div>
              {actionState.canSupply && (
                <ArrowRight className="h-5 w-5 text-text-tertiary" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Borrow Action */}
        <Card 
          className={`compound-card transition-all duration-200 ${
            actionState.canBorrow 
              ? 'hover:bg-bg-tertiary hover:border-border-accent cursor-pointer' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          onClick={actionState.canBorrow ? () => window.location.href = "/borrow" : undefined}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  actionState.canBorrow ? 'bg-compound-warning-500/20' : 'bg-compound-neutral-600/20'
                }`}>
                  <ArrowDownRight className="h-6 w-6 text-compound-warning-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Borrow {BASE_TOKEN_SYMBOL}</h3>
                  <p className="text-sm text-text-tertiary">
                    {actionState.canBorrow 
                      ? "Borrow against your collateral"
                      : "Supply collateral first"
                    }
                  </p>
                </div>
              </div>
              {actionState.canBorrow && (
                <ArrowRight className="h-5 w-5 text-text-tertiary" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Withdraw Action */}
            {actionState.canWithdraw && (
              <Card 
                className="compound-card hover:bg-bg-tertiary hover:border-border-accent cursor-pointer transition-all duration-200"
                onClick={() => window.location.href = "/withdraw"}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-compound-secondary-500/20">
                        <ArrowUpRight className="h-6 w-6 text-compound-secondary-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Withdraw Collateral</h3>
                        <p className="text-sm text-text-tertiary">
                          {actionState.collateralValue.toFixed(4)} {COLLATERAL_SYMBOL} available
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-text-tertiary" />
                  </div>
                </CardContent>
              </Card>
            )}

        {/* Repay Action */}
        {actionState.canRepay && (
          <Card 
            className="compound-card hover:bg-bg-tertiary hover:border-border-accent cursor-pointer transition-all duration-200"
            onClick={() => window.location.href = "/repay"}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-compound-error-500/20">
                    <ArrowDownLeft className="h-6 w-6 text-compound-error-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Repay Debt</h3>
                    <p className="text-sm text-text-tertiary">
                      ${actionState.borrowValue.toFixed(2)} {BASE_TOKEN_SYMBOL} borrowed
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-text-tertiary" />
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 compound-card rounded-lg">
        <p className="text-xs text-text-tertiary text-center">
          {!actionState.hasPosition 
            ? `Start by supplying ${COLLATERAL_SYMBOL} as collateral to earn interest and unlock borrowing ${BASE_TOKEN_SYMBOL}`
            : "Manage your position, add more collateral, or borrow additional funds"
          }
        </p>
      </div>
    </div>
  )
}
