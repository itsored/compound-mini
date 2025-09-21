// Mobile-specific RPC configuration for better Telegram compatibility

export interface MobileRPCConfig {
  rpcUrl: string
  chainId: number
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  blockExplorerUrls: string[]
}

export function getMobileRPCConfig(): MobileRPCConfig {
  const rpcUrl = process.env.NEXT_PUBLIC_ETH_RPC_URL || process.env.ETH_RPC_URL || 'https://ethereum.publicnode.com'
  
  return {
    rpcUrl,
    chainId: 1, // Ethereum mainnet
    chainName: 'Ethereum Mainnet (Tenderly Fork)',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorerUrls: ['https://etherscan.io']
  }
}

export async function ensureCorrectNetwork(provider: any): Promise<boolean> {
  if (!provider) return false
  
  try {
    const config = getMobileRPCConfig()
    const currentChainId = await provider.request({ method: 'eth_chainId' })
    const expectedChainId = `0x${config.chainId.toString(16)}`
    
    console.log("🔍 [MOBILE] Current chain ID:", currentChainId)
    console.log("🔍 [MOBILE] Expected chain ID:", expectedChainId)
    
    if (currentChainId === expectedChainId) {
      console.log("🔍 [MOBILE] Network is correct")
      return true
    }
    
    console.log("🔍 [MOBILE] Attempting to switch network...")
    
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: expectedChainId }],
      })
      console.log("🔍 [MOBILE] Network switched successfully")
      return true
    } catch (switchError: any) {
      console.log("🔍 [MOBILE] Switch failed, attempting to add network:", switchError.message)
      
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: expectedChainId,
              chainName: config.chainName,
              nativeCurrency: config.nativeCurrency,
              rpcUrls: [config.rpcUrl],
              blockExplorerUrls: config.blockExplorerUrls
            }],
          })
          console.log("🔍 [MOBILE] Network added successfully")
          return true
        } catch (addError) {
          console.error("🔍 [MOBILE] Failed to add network:", addError)
          return false
        }
      }
      
      console.error("🔍 [MOBILE] Network switch error:", switchError)
      return false
    }
  } catch (error) {
    console.error("🔍 [MOBILE] Network check error:", error)
    return false
  }
}
