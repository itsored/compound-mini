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
    
    console.log("🔍 [MOBILE] Current chain ID:", currentChainId)
    console.log("🔍 [MOBILE] Expected chain ID:", `0x${config.chainId.toString(16)}`)
    
    if (currentChainId !== `0x${config.chainId.toString(16)}`) {
      console.log("🔍 [MOBILE] Switching to correct network...")
      
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${config.chainId.toString(16)}` }],
        })
        console.log("🔍 [MOBILE] Successfully switched network")
        return true
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          console.log("🔍 [MOBILE] Adding new network...")
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${config.chainId.toString(16)}`,
                  chainName: config.chainName,
                  nativeCurrency: config.nativeCurrency,
                  rpcUrls: [config.rpcUrl],
                  blockExplorerUrls: config.blockExplorerUrls,
                },
              ],
            })
            console.log("🔍 [MOBILE] Successfully added and switched to network")
            return true
          } catch (addError) {
            console.error("🔍 [MOBILE] Failed to add network:", addError)
            return false
          }
        } else {
          console.error("🔍 [MOBILE] Failed to switch network:", switchError)
          return false
        }
      }
    }
    
    console.log("🔍 [MOBILE] Network is already correct")
    return true
  } catch (error) {
    console.error("🔍 [MOBILE] Error checking network:", error)
    return false
  }
}
