import { TransactionHistory } from "@/components/transaction-history"
import { Navigation } from "@/components/navigation"
import { NetworkSwitcher } from "@/components/network-switcher"
import { WalletConnect } from "@/components/wallet-connect"

export default function HistoryPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-[#0d0f14]">
      <div className="w-full max-w-md space-y-3">
        <div className="pt-4 space-y-2 px-4">
          <div className="rounded-xl border border-border-primary bg-bg-secondary/70 backdrop-blur supports-[backdrop-filter]:bg-bg-secondary/60 shadow-sm px-3 py-2 flex justify-end">
            <WalletConnect />
          </div>
          <NetworkSwitcher variant="compact" />
        </div>
        <TransactionHistory />
        <Navigation />
      </div>
    </main>
  )
}
