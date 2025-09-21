"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  PiggyBank, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  Shield,
  Zap
} from "lucide-react"
import { useFeedback } from "@/lib/feedback-provider"
import { useAccount } from "wagmi"
import Image from "next/image"
import { motion } from "framer-motion"
import { publicClient, WETH_ADDRESS, COMET_ADDRESS, USDC_ADDRESS, approve as viemApprove, supply as viemSupply, waitForTelegramTransaction } from "@/lib/comet-onchain"
import { parseUnits } from "viem"
import erc20Abi from "@/lib/abis/erc20.json"
import cometAbi from "@/lib/abis/comet.json"

export function SupplyForm() {
  const { showSuccess, showError, showLoading, hideLoading } = useFeedback()
  const { address, isConnected } = useAccount()

  const [amount, setAmount] = useState("")
  const [wethBalance, setWethBalance] = useState(0)
  const [collateralBalance, setCollateralBalance] = useState(0)
  const [supplyApy, setSupplyApy] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [supplySuccess, setSupplySuccess] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isConnected && address) {
      loadWethBalance()
      loadCollateral()
      loadSupplyApy()
    }
  }, [isConnected, address])

  const loadWethBalance = async () => {
    if (!address) return
    try {
      const balance = await publicClient.readContract({
        address: WETH_ADDRESS as `0x${string}`,
        abi: erc20Abi as any,
        functionName: "balanceOf",
        args: [address as `0x${string}`]
      })
      setWethBalance(Number(balance) / 1e18)
    } catch (error) {
      console.error("Error loading WETH balance:", error)
    }
  }

  const loadCollateral = async () => {
    if (!address) return
    try {
      const balance = await publicClient.readContract({
        address: COMET_ADDRESS as `0x${string}`,
        abi: cometAbi as any,
        functionName: "collateralBalanceOf",
        args: [address as `0x${string}`, WETH_ADDRESS as `0x${string}`]
      })
      setCollateralBalance(Number(balance) / 1e18)
    } catch (error) {
      console.error("Error loading collateral balance:", error)
    }
  }

  const loadSupplyApy = async () => {
    try {
      const rate = await publicClient.readContract({
        address: COMET_ADDRESS as `0x${string}`,
        abi: cometAbi as any,
        functionName: "getSupplyRate",
        args: [WETH_ADDRESS as `0x${string}`]
      })
      setSupplyApy(Number(rate) / 1e18 * 100)
    } catch (error) {
      console.error("Error loading supply APY:", error)
    }
  }

  const handleSupply = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      showError("Invalid Amount", "Please enter a valid amount to supply")
      return
    }

    if (Number.parseFloat(amount) > wethBalance) {
      showError("Insufficient Balance", "You don't have enough WETH in your wallet")
      return
    }

    try {
      setIsSubmitting(true)
      showLoading(`Supplying ${amount} WETH...`)

      if (!address) throw new Error("No wallet address")
      console.log("🔍 [DEBUG] Supply transaction - address:", address)
      console.log("🔍 [DEBUG] Supply transaction - WETH_ADDRESS:", WETH_ADDRESS)
      console.log("🔍 [DEBUG] Supply transaction - COMET_ADDRESS:", COMET_ADDRESS)
      const value = parseUnits(amount, 18)

      // Check allowance via readContract
      const currentAllowance = (await publicClient.readContract({
        address: WETH_ADDRESS as `0x${string}`,
        abi: erc20Abi as any,
        functionName: "allowance",
        args: [address as `0x${string}`, COMET_ADDRESS as `0x${string}`]
      })) as bigint

      if (currentAllowance < value) {
        showLoading("Approving WETH...")
        console.log("🔍 [DEBUG] About to approve with wallet client")
        const approveHash = await viemApprove(WETH_ADDRESS as `0x${string}`, address as `0x${string}`, COMET_ADDRESS as `0x${string}`, value)
        console.log("🔍 [DEBUG] Approve hash:", approveHash)
        
        // Use Telegram-specific transaction waiting
        await waitForTelegramTransaction(approveHash as `0x${string}`)
        console.log("🔍 [DEBUG] Approval transaction confirmed")
        showSuccess("Approval successful", "WETH approved for Compound Mini.")
      }

      showLoading("Supplying WETH...")
      const supplyHash = await viemSupply(WETH_ADDRESS as `0x${string}`, address as `0x${string}`, value)
      console.log("🔍 [DEBUG] Supply hash:", supplyHash)
      
      // Use Telegram-specific transaction waiting
      await waitForTelegramTransaction(supplyHash as `0x${string}`)
      console.log("🔍 [DEBUG] Supply transaction confirmed")

      console.log("🔍 [DEBUG] Transaction confirmed, updating local state...")
      await Promise.all([loadWethBalance(), loadCollateral()])
      
      // Add a small delay to ensure blockchain state has propagated
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log("🔍 [DEBUG] Dispatching onchain:updated event...")
      try {
        const evt = new Event('onchain:updated')
        window.dispatchEvent(evt)
        console.log("🔍 [DEBUG] Event dispatched successfully")
      } catch (error) {
        console.error("🔍 [DEBUG] Error dispatching event:", error)
      }

      hideLoading()
      setSupplySuccess(true)
    } catch (error: any) {
      hideLoading()
      const details = error?.cause?.shortMessage || error?.shortMessage || error?.cause?.message || error?.message
      const fallback = "Transaction failed. If you rejected the request, try again."
      const msg = details || fallback
      showError("Supply Failed", msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const projectedEarnings = Number(amount) * (supplyApy / 100)

  // Success state
  if (supplySuccess) {
    return (
      <div className="p-4 pb-24">
        <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/20 text-white">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-green-400 mb-3">Supply Successful!</h2>
            <p className="text-xl text-white mb-2">
              You have supplied <span className="font-bold text-green-400">{amount} WETH</span>
            </p>
            <p className="text-gray-400 mb-6">
              You're now earning interest on your supplied assets.
            </p>
            <Button className="w-full h-12" onClick={() => setSupplySuccess(false)}>
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 pb-24 space-y-4"
    >
      {/* WETH Balance Card */}
      <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/20 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Image 
                  src="/weth-icon.png" 
                  alt="WETH" 
                  width={24} 
                  height={24} 
                  className="rounded-full"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">WETH</h3>
                <p className="text-sm text-gray-400">Wallet balance and supplied</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-2xl font-bold text-green-400">
                {wethBalance.toFixed(4)} WETH
              </div>
              <div className="text-sm text-gray-400">Wallet</div>
              <div className="text-lg font-semibold text-blue-300">
                {collateralBalance.toFixed(4)} WETH
              </div>
              <div className="text-sm text-gray-400">Supplied</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supply Form */}
      <Card className="bg-[#1a1d26] border-[#2a2d36] text-white">
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Supply WETH</h2>
            <p className="text-gray-400">Earn interest on your WETH assets</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount to Supply
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-[#2a2d36] border-[#3a3d46] text-white placeholder-gray-500 pr-20"
                  disabled={isSubmitting}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    WETH
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Available:</span>
              <span className="text-white">{wethBalance.toFixed(4)} WETH</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmount(wethBalance.toString())}
              className="w-full border-[#3a3d46] text-gray-300 hover:bg-[#3a3d46]"
              disabled={isSubmitting}
            >
              Use Max
            </Button>
          </div>

          {/* Projected Earnings */}
          {amount && Number(amount) > 0 && (
            <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">Projected Annual Earnings</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-400">
                      {projectedEarnings.toFixed(4)} WETH
                    </div>
                    <div className="text-xs text-gray-400">
                      {supplyApy.toFixed(2)}% APY
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supply Button */}
          <Button
            onClick={handleSupply}
            disabled={!amount || Number.parseFloat(amount) <= 0 || isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Supplying...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Supply WETH
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Security</span>
                </div>
                <p className="text-xs text-gray-400">
                  Your assets are secured by Compound's battle-tested smart contracts.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-green-300">Instant</span>
                </div>
                <p className="text-xs text-gray-400">
                  Start earning interest immediately after supplying.
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
