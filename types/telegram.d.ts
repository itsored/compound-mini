// Add TypeScript declarations for Telegram WebApp and Reown AppKit
declare global {
  interface Window {
    Telegram: {
      WebApp: any
    }
  }
  
  // Reown AppKit web components
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': any
      'appkit-network-button': any
    }
  }
}

export {}
