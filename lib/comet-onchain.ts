"use client"

import { createPublicClient, createWalletClient, http, parseUnits, defineChain, custom } from "viem"
import { hardhat, sepolia } from "viem/chains"
import cometAbi from "./abis/comet.json"
import erc20Abi from "./abis/erc20.json"
import { getCurrentNetworkConfig, getRpcUrl } from "./network-config"
import { detectWalletProvider, waitForWalletProvider, validateWalletProvider } from "./wallet-detection"
import { ensureCorrectNetwork, validateTelegramNetwork } from "./mobile-rpc-config"

// Get current network configuration
const networkConfig = getCurrentNetworkConfig()
console.log("🔍 [DEBUG] Network config loaded:", JSON.stringify(networkConfig, null, 2))
const rpcUrl = getRpcUrl()
console.log("🔍 [DEBUG] Using RPC URL:", rpcUrl)

// Create chain configuration based on current network
const chain = networkConfig.chainId === 31337 
  ? hardhat 
  : networkConfig.chainId === 11155111 
    ? sepolia 
    : defineChain({
        id: networkConfig.chainId,
        name: networkConfig.name,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
          default: { http: [rpcUrl] },
          public: { http: [rpcUrl] }
        },
        blockExplorers: {
          default: { name: 'Explorer', url: networkConfig.explorerUrl }
        }
      })

export const publicClient = createPublicClient({ chain, transport: http(rpcUrl) })

export async function getWalletClient() {
	console.log("🔍 [DEBUG] Creating wallet client for chain:", chain.id)
	console.log("🔍 [DEBUG] Chain name:", chain.name)
	console.log("🔍 [DEBUG] RPC URL:", rpcUrl)
	
	if (typeof window === "undefined") throw new Error("wallet client only available in browser")
	
	// Try to detect wallet provider immediately
	let provider = detectWalletProvider()
	
	// If not found and we're in Telegram, wait for it
	if (!provider && (window as any).Telegram?.WebApp) {
		console.log("🔍 [DEBUG] Waiting for wallet provider in Telegram...")
		try {
			provider = await waitForWalletProvider(15000) // Wait up to 15 seconds for Telegram
		} catch (error) {
			console.log("🔍 [DEBUG] Wallet provider not found within timeout")
			throw new Error("Wallet not available in Telegram. Please ensure your wallet is connected and try again.")
		}
	}
	
	if (!provider) {
		throw new Error("No wallet detected. Please install or enable a wallet (e.g. MetaMask)")
	}
	
	// Validate the provider
	if (!validateWalletProvider(provider)) {
		throw new Error("Invalid wallet provider detected. Please try reconnecting your wallet.")
	}
	
	console.log("🔍 [DEBUG] Using wallet provider:", provider)
	
	// For Telegram environments, validate network connectivity
	if ((window as any).Telegram?.WebApp) {
		console.log("🔍 [DEBUG] Validating Telegram network...")
		const networkValid = await validateTelegramNetwork(provider)
		if (!networkValid) {
			console.warn("⚠️ [DEBUG] Telegram network validation failed, but continuing...")
		}
	} else {
		// Ensure the wallet is on the correct network (especially important for mobile)
		const networkCorrect = await ensureCorrectNetwork(provider)
		if (!networkCorrect) {
			console.warn("⚠️ [DEBUG] Network might not be correct, but continuing...")
		}
	}
	
	// Create wallet client with custom transport
	const walletClient = createWalletClient({ 
		chain, 
		transport: custom(provider)
	})
	
	return walletClient
}

export function getWalletPublicClient() {
	console.log("🔍 [DEBUG] Creating wallet-backed public client for chain:", chain.id)
	console.log("🔍 [DEBUG] Chain name:", chain.name)
	console.log("🔍 [DEBUG] RPC URL:", rpcUrl)
	
	if (typeof window === 'undefined') {
		console.log("🔍 [DEBUG] Server-side, returning null for wallet public client")
		return null
	}
	
	try {
		const provider = detectWalletProvider()
		if (!provider) {
			console.log("🔍 [DEBUG] No wallet provider detected, returning null")
			return null
		}
		
		// For Telegram, use the wallet provider transport
		if ((window as any).Telegram?.WebApp) {
			console.log("🔍 [DEBUG] Using wallet provider transport for Telegram")
			return createPublicClient({ chain, transport: custom(provider) })
		}
		
		// For regular browsers, prefer the direct RPC
		console.log("�� [DEBUG] Using direct RPC transport for browser")
		return createPublicClient({ chain, transport: http(rpcUrl) })
	} catch (error) {
		console.log("�� [DEBUG] Error creating wallet public client:", error)
		return null
	}
}

// Use network configuration for contract addresses
export const COMET_ADDRESS = networkConfig.cometAddress
export const USDC_ADDRESS = networkConfig.usdcAddress
export const WETH_ADDRESS = networkConfig.wethAddress
export const CHAINLINK_ETH_USD_FEED = networkConfig.chainlinkEthUsdFeed

export async function getBaseBalances(account: `0x${string}`) {
	const [supplied, borrowed] = await Promise.all([
		publicClient.readContract({ address: COMET_ADDRESS, abi: cometAbi, functionName: "balanceOf", args: [account] }),
		publicClient.readContract({ address: COMET_ADDRESS, abi: cometAbi, functionName: "borrowBalanceOf", args: [account] }),
	])
	return { supplied: BigInt(supplied as any), borrowed: BigInt(borrowed as any) }
}

export async function getRates() {
	const util = (await publicClient.readContract({ address: COMET_ADDRESS, abi: cometAbi, functionName: "getUtilization" })) as bigint
	const [supplyRate, borrowRate] = (await Promise.all([
		publicClient.readContract({ address: COMET_ADDRESS, abi: cometAbi, functionName: "getSupplyRate", args: [util] }),
		publicClient.readContract({ address: COMET_ADDRESS, abi: cometAbi, functionName: "getBorrowRate", args: [util] }),
	])) as [bigint, bigint]
	return { utilization: util, supplyRate, borrowRate }
}

export async function getEthUsdPrice() {
	const data = (await publicClient.readContract({
		address: CHAINLINK_ETH_USD_FEED,
		abi: [
			{
				inputs: [],
				name: "latestRoundData",
				outputs: [
					{ internalType: "uint80", name: "roundId", type: "uint80" },
					{ internalType: "int256", name: "answer", type: "int256" },
					{ internalType: "uint256", name: "startedAt", type: "uint256" },
					{ internalType: "uint256", name: "updatedAt", type: "uint256" },
					{ internalType: "uint80", name: "answeredInRound", type: "uint80" },
				],
				stateMutability: "view",
				type: "function",
			},
		],
		functionName: "latestRoundData",
	})) as any
	return BigInt(data[1]) // price is the second element
}

export async function approve(tokenAddress: `0x${string}`, owner: `0x${string}`, spender: `0x${string}`, amount: bigint) {
  console.log("🔍 [DEBUG] Approving token:", tokenAddress, "for amount:", amount)
  const walletClient = await getWalletClient()
  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, amount],
    account: owner,
  })
  console.log("🔍 [DEBUG] Approve transaction hash:", hash)
  return hash
}

export async function supply(asset: `0x${string}`, from: `0x${string}`, amount: bigint) {
  console.log("🔍 [DEBUG] Supplying asset:", asset, "from:", from, "amount:", amount)
  const walletClient = await getWalletClient()
  const hash = await walletClient.writeContract({
    address: COMET_ADDRESS as `0x${string}`,
    abi: cometAbi,
    functionName: "supply",
    args: [asset, amount],
    account: from,
  })
  console.log("🔍 [DEBUG] Supply transaction hash:", hash)
  return hash
}

export async function borrow(asset: `0x${string}`, from: `0x${string}`, amount: bigint) {
  console.log("🔍 [DEBUG] Borrowing asset:", asset, "from:", from, "amount:", amount)
  const walletClient = await getWalletClient()
  const hash = await walletClient.writeContract({
    address: COMET_ADDRESS as `0x${string}`,
    abi: cometAbi,
    functionName: "borrow",
    args: [asset, amount],
    account: from,
  })
  console.log("🔍 [DEBUG] Borrow transaction hash:", hash)
  return hash
}

export async function withdraw(asset: `0x${string}`, to: `0x${string}`, amount: bigint) {
  console.log("🔍 [DEBUG] Withdrawing asset:", asset, "to:", to, "amount:", amount)
  const walletClient = await getWalletClient()
  const hash = await walletClient.writeContract({
    address: COMET_ADDRESS as `0x${string}`,
    abi: cometAbi,
    functionName: "withdraw",
    args: [asset, amount],
    account: to,
  })
  console.log("🔍 [DEBUG] Withdraw transaction hash:", hash)
  return hash
}

export async function repay(asset: `0x${string}`, to: `0x${string}`, amount: bigint) {
  console.log("🔍 [DEBUG] Repaying asset:", asset, "to:", to, "amount:", amount)
  const walletClient = await getWalletClient()
  const hash = await walletClient.writeContract({
    address: COMET_ADDRESS as `0x${string}`,
    abi: cometAbi,
    functionName: "repay",
    args: [asset, amount],
    account: to,
  })
  console.log("🔍 [DEBUG] Repay transaction hash:", hash)
  return hash
}
