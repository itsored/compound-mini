"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function WelcomeMessage() {
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = localStorage.getItem("compound_has_visited")
    if (!hasVisited) {
      setShowWelcome(true)
      localStorage.setItem("compound_has_visited", "true")
    }
  }, [])

  if (!showWelcome) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="bg-[#1a1d26] border-[#2a2d36] text-white max-w-md w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Welcome to Compound Finance</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowWelcome(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-gray-400">DeFi Lending & Borrowing Simulation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            This is a simulation of the Compound Finance protocol. You can supply assets, borrow against your
            collateral, withdraw your supplied assets, and repay your borrowed assets.
          </p>
          <p>
            Your wallet has been pre-loaded with 10,000 USDC and other assets for you to experiment with. All data is
            stored locally in your browser and persists between sessions.
          </p>
          <div className="bg-[#252836] p-3 rounded-lg space-y-2">
            <div className="text-sm font-medium">Simulation Features:</div>
            <ul className="text-sm space-y-1 list-disc pl-4">
              <li>Supply assets to earn interest</li>
              <li>Borrow assets against your collateral</li>
              <li>Withdraw your supplied assets</li>
              <li>Repay your borrowed assets</li>
              <li>View your transaction history</li>
              <li>Refill your wallet anytime</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="compound" className="w-full" onClick={() => setShowWelcome(false)}>
            Start Exploring
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
