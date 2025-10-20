"use client"

import { ReactNode } from "react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { getCurrentNetworkConfig } from "./network-config"
import { createAppKit } from "@reown/appkit/react"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { cookieToInitialState, type Config } from "wagmi"

// Resolve network and AppKit project
const networkConfig = getCurrentNetworkConfig()
const projectId = (process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || process.env.NEXT_PUBLIC_WC_PROJECT_ID) as string | undefined
if (!projectId) {
  // Soft guard: AppKit requires a project id, but allow app to render
  // You can set NEXT_PUBLIC_REOWN_PROJECT_ID in .env.local
}

// Build Wagmi adapter with the current network id
const wagmiAdapter = new WagmiAdapter({
  projectId: projectId as string,
  networks: [
    {
      id: networkConfig.chainId,
      name: networkConfig.name,
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [networkConfig.rpcUrl] },
      },
      blockExplorers: {
        default: { name: 'Explorer', url: networkConfig.explorerUrl },
      },
    } as any,
  ],
  ssr: true,
})

// Initialize AppKit (modal + deep-link flows)
createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId as string,
  networks: wagmiAdapter.networks as any,
  metadata: {
    name: 'Compound Mini',
    description: 'DeFi lending and borrowing',
    url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    icons: [typeof window !== 'undefined' ? `${window.location.origin}/complogo.png` : 'http://localhost:3000/complogo.png'],
  },
  // In WebViews like Telegram, AppKit avoids QR; we keep deep link fallbacks in our button
  features: { analytics: false },
})

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: (failureCount, error: any) => {
				// Don't retry wallet-related errors
				if (error?.message?.includes('wallet') || error?.code === 4001) {
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
