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
    
    // First, try to get the current chain ID
    let currentChainId: string
    try {
      currentChainId = await provider.request({ method: 'eth_chainId' })
    } catch (error) {
      console.log("🔍 [MOBILE] Could not get current chain ID, assuming wrong network")
      currentChainId = '0x0' // Force network switch
    }
    
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
        
        // Wait a bit for the network switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        return true
      } catch (switchError: any) {
        console.log("🔍 [MOBILE] Switch failed, error code:", switchError.code)
        
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902 || switchError.code === -32603) {
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
            
            // Wait a bit for the network addition to complete
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            return true
          } catch (addError: any) {
            console.error("🔍 [MOBILE] Failed to add network:", addError)
            
            // If adding fails, try to continue anyway - the wallet might already have the network
            console.log("🔍 [MOBILE] Continuing despite network add failure...")
            return true
          }
        } else {
          console.error("🔍 [MOBILE] Failed to switch network:", switchError)
          
          // For other errors, try to continue anyway
          console.log("🔍 [MOBILE] Continuing despite network switch failure...")
          return true
        }
      }
    }
    
    console.log("🔍 [MOBILE] Network is already correct")
    return true
  } catch (error) {
    console.error("🔍 [MOBILE] Error checking network:", error)
    
    // If network checking fails completely, try to continue anyway
    console.log("🔍 [MOBILE] Continuing despite network check failure...")
    return true
  }
}

// Enhanced network validation specifically for Telegram
export async function validateTelegramNetwork(provider: any): Promise<boolean> {
  if (!provider) return false
  
  try {
    const config = getMobileRPCConfig()
    
    // Test if we can make a simple RPC call
    try {
      const blockNumber = await provider.request({ 
        method: 'eth_blockNumber',
        params: []
      })
      console.log("🔍 [TELEGRAM] Network test successful, block:", blockNumber)
      return true
    } catch (rpcError) {
      console.log("🔍 [TELEGRAM] RPC test failed:", rpcError)
      
      // Try to switch networks and test again
      const networkOk = await ensureCorrectNetwork(provider)
      if (networkOk) {
        try {
          const blockNumber = await provider.request({ 
            method: 'eth_blockNumber',
            params: []
          })
          console.log("🔍 [TELEGRAM] Network test successful after switch, block:", blockNumber)
          return true
        } catch (retryError) {
          console.log("🔍 [TELEGRAM] RPC test still failed after network switch:", retryError)
          return false
        }
      }
      
      return false
    }
  } catch (error) {
    console.error("🔍 [TELEGRAM] Network validation error:", error)
    return false
  }
}
