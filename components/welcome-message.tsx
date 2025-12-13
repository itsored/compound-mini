"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function WelcomeMessage() {
  const [showWelcome, setShowWelcome] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = localStorage.getItem("compound_has_visited")
    if (!hasVisited) {
      setShowWelcome(true)
      localStorage.setItem("compound_has_visited", "true")
    }
  }, [])

  const handleEnter = () => {
    setShowWelcome(false)
    router.push("/")
  }

  if (!showWelcome) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md text-text-primary border border-compound-success-500/30 bg-gradient-to-br from-bg-secondary/90 via-bg-secondary/80 to-compound-success-950/40 shadow-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-compound-success-900/50 px-3 py-1 text-xs font-semibold text-compound-success-200 border border-compound-success-700/40">
                <span className="h-2 w-2 rounded-full bg-compound-success-400 animate-pulse" />
                Welcome aboard
              </div>
              <CardTitle className="mt-3 text-2xl font-bold text-compound-success-100">
                Compound Mini
              </CardTitle>
              <CardDescription className="mt-1 text-text-tertiary">
                 Supply, borrow, and track health with ease.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="text-text-tertiary hover:text-text-primary" onClick={() => setShowWelcome(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-border-primary/40 bg-bg-tertiary/50 p-3">
            <div className="text-sm font-semibold text-text-primary">What you can do</div>
            <ul className="text-sm space-y-2 text-text-secondary list-disc pl-4">
              <li>Supply, borrow, track APY, and grow your collateral</li>
              <li>Borrow against your health factor</li>
              <li>Withdraw or repay anytime to rebalance risk</li>
              <li>Watch portfolio and metrics update live</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full gap-3">
            <Button
              className="w-full bg-compound-success-500 hover:bg-compound-success-400 text-slate-950 font-semibold"
              onClick={handleEnter}
            >
              Enter
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
