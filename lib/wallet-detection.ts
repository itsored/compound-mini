// Enhanced wallet detection for Telegram and mobile browsers
export function detectWalletProvider() {
  if (typeof window === "undefined") return null
  
  console.log("🔍 [WALLET] Detecting wallet provider...")
  
  // Primary detection: window.ethereum
  if ((window as any).ethereum) {
    console.log("🔍 [WALLET] Found window.ethereum")
    return (window as any).ethereum
  }
  
  // Secondary detection: web3.currentProvider
  if ((window as any).web3?.currentProvider) {
    console.log("🔍 [WALLET] Found web3.currentProvider")
    return (window as any).web3.currentProvider
  }
  
  // Telegram-specific detection
  if ((window as any).Telegram?.WebApp) {
    console.log("🔍 [WALLET] In Telegram environment")
    
    // Try to find wallet in various locations
    const possibleProviders = [
      (window as any).ethereum,
      (window as any).web3?.currentProvider,
      (window as any).wallet?.ethereum,
      (window as any).metaMask,
      (window as any).Telegram?.WebApp?.ethereum,
      (window as any).Telegram?.WebApp?.wallet?.ethereum,
    ]
    
    for (const provider of possibleProviders) {
      if (provider) {
        console.log("🔍 [WALLET] Found provider in Telegram:", provider)
        return provider
      }
    }
    
    // Check if wallet is injected after a delay
    console.log("🔍 [WALLET] No immediate provider found in Telegram")
  }
  
  console.log("🔍 [WALLET] No wallet provider detected yet.")
  return null
}

export async function waitForWalletProvider(timeout = 15000, interval = 500): Promise<any> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const checkProvider = () => {
      const provider = detectWalletProvider()
      if (provider) {
        console.log("🔍 [WALLET] Wallet provider detected after waiting.")
        resolve(provider)
        return
      }
      
      if (Date.now() - startTime > timeout) {
        console.warn("⚠️ [WALLET] Wallet provider not detected within timeout.")
        reject(new Error("Wallet provider not found within timeout"))
        return
      }
      
      // Check again after interval
      setTimeout(checkProvider, interval)
    }
    
    checkProvider()
  })
}

// Enhanced provider validation
export function validateWalletProvider(provider: any): boolean {
  if (!provider) return false
  
  // Check if provider has required methods
  const requiredMethods = ['request', 'on', 'removeListener']
  const hasRequiredMethods = requiredMethods.every(method => typeof provider[method] === 'function')
  
  if (!hasRequiredMethods) {
    console.log("🔍 [WALLET] Provider missing required methods")
    return false
  }
  
  // Check if provider is responsive
  try {
    // This is a lightweight check
    if (typeof provider.isMetaMask !== 'undefined' || 
        typeof provider.isRabby !== 'undefined' ||
        typeof provider.isCoinbaseWallet !== 'undefined') {
      console.log("🔍 [WALLET] Provider appears to be a known wallet")
      return true
    }
    
    // Generic provider check
    console.log("🔍 [WALLET] Provider appears to be valid")
    return true
  } catch (error) {
    console.log("🔍 [WALLET] Provider validation error:", error)
    return false
  }
}
