"use client"

import { ReactNode } from "react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createAppKit } from "@reown/appkit/react"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { type Config } from "wagmi"
import { getActiveSelection, getAllChainConfigs, getRpcCandidates } from "./network-config"

const selection = getActiveSelection()
const projectId = (process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || process.env.NEXT_PUBLIC_WC_PROJECT_ID) as string | undefined

if (!projectId) {
  throw new Error(
    "Reown AppKit project ID is missing. Set NEXT_PUBLIC_REOWN_PROJECT_ID or NEXT_PUBLIC_WC_PROJECT_ID in your environment.",
  )
}

const allChains = getAllChainConfigs()
const sortedChains = [
  ...allChains.filter((chain) => chain.key === selection.chainKey),
  ...allChains.filter((chain) => chain.key !== selection.chainKey),
]

const wagmiNetworks = sortedChains.map((chain) => {
  const rpcCandidates = getRpcCandidates(chain.key)
  const nativeCurrency =
    chain.key === "ronin"
      ? { name: "Ronin", symbol: "RON", decimals: 18 }
      : { name: "Ether", symbol: "ETH", decimals: 18 }

  return {
    id: chain.chainId,
    name: chain.name,
    nativeCurrency,
    rpcUrls: {
      default: { http: rpcCandidates },
      public: { http: rpcCandidates },
    },
    blockExplorers: {
      default: { name: "Explorer", url: chain.explorerUrl },
    },
    testnet: chain.isTestnet,
  }
})

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: wagmiNetworks as any,
  ssr: true,
})

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: wagmiAdapter.networks as any,
  metadata: {
    name: "Compound Mini",
    description: "DeFi lending and borrowing",
    url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    icons: [typeof window !== "undefined" ? `${window.location.origin}/complogo.png` : "http://localhost:3000/complogo.png"],
  },
  features: { analytics: false },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.message?.includes("wallet") || error?.code === 4001) {
          return false
        }
        return failureCount < 3
      },
    },
  },
})

export function AppWagmiProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
