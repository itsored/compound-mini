"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function WelcomeMessage() {
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    const hasVisited = localStorage.getItem("compound_has_visited")
    if (!hasVisited) {
      setShowWelcome(true)
      localStorage.setItem("compound_has_visited", "true")
    }
  }, [])

  if (!showWelcome) return null

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWelcome(false)} />
      <Card className="relative w-full max-w-md brand-card overflow-hidden">
        <div className="pointer-events-none absolute -top-48 -right-48 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <CardHeader className="relative">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-glow">Welcome to Compound Mini</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowWelcome(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-text-tertiary">Lend, borrow, and manage your position.</CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="rounded-lg border border-border-primary bg-bg-tertiary/50 p-3">
            <div className="text-sm font-medium mb-2">Quick start</div>
            <ul className="text-sm space-y-1 list-disc pl-4 text-text-secondary">
              <li>Connect your wallet (MetaMask/WalletConnect)</li>
              <li>Supply WETH as collateral</li>
              <li>Borrow USDC against your collateral</li>
              <li>Track health factor and interest in Dashboard</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border-primary bg-bg-secondary/70 p-3">
              <div className="text-xs text-text-tertiary mb-1">APY updates</div>
              <div className="text-sm">Rates update per block</div>
            </div>
            <div className="rounded-lg border border-border-primary bg-bg-secondary/70 p-3">
              <div className="text-xs text-text-tertiary mb-1">Security</div>
              <div className="text-sm">Tx simulation on fork RPC</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="gap-3">
          <Button className="flex-1 brand-button-primary" onClick={() => setShowWelcome(false)}>
            Get Started
          </Button>
          <Button variant="outline" className="flex-1 brand-button-secondary border-border-primary" onClick={() => setShowWelcome(false)}>
            Maybe later
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
