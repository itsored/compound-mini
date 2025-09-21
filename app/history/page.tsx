import { TransactionHistory } from "@/components/transaction-history"
import { Navigation } from "@/components/navigation"

export default function HistoryPage() {
  return (
    <main className="flex min-h-screen flex-col items-center brand-gradient text-text-primary">
      <div className="w-full max-w-md">
        <TransactionHistory />
        <Navigation />
      </div>
    </main>
  )
}
