// Enhanced wallet detection for Telegram and mobile browsers
export function detectWalletProvider() {
  if (typeof window === "undefined") return null
  
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
    ]
    
    for (const provider of possibleProviders) {
      if (provider) {
        console.log("🔍 [WALLET] Found provider in Telegram:", provider)
        return provider
      }
    }
  }
  
  return null
}

export async function waitForWalletProvider(timeout = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const checkProvider = () => {
      const provider = detectWalletProvider()
      if (provider) {
        resolve(provider)
        return
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error("Wallet provider not found within timeout"))
        return
      }
      
      // Check again in 100ms
      setTimeout(checkProvider, 100)
    }
    
    checkProvider()
  })
}
