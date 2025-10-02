"use client"

import { useEffect, useRef } from "react"

// Lazy import to avoid bundling on server
let MetaMaskSDKCtor: any = null

function isTelegramEnv() {
  try {
    return typeof window !== "undefined" && !!(window as any).Telegram?.WebApp
  } catch {
    return false
  }
}

function isIOS() {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function MetaMaskSdkBoot() {
  const initializedRef = useRef(false)

  useEffect(() => {
    const enabled = process.env.NEXT_PUBLIC_USE_MMSDK === "true"
    if (!enabled) return
    if (!isTelegramEnv()) return
    if (!isIOS()) return
    if (initializedRef.current) return

    let cancelled = false
    ;(async () => {
      try {
        if (!MetaMaskSDKCtor) {
          const mod = await import("@metamask/sdk")
          MetaMaskSDKCtor = mod?.MetaMaskSDK ?? (mod as any).default
        }
        if (!MetaMaskSDKCtor) return

        const sdk = new MetaMaskSDKCtor({
          dappMetadata: {
            name: "Compound Mini",
            url: typeof window !== "undefined" ? window.location.origin : "https://compound-mini",
          },
          logging: { developerMode: false },
          storage: { enabled: false },
          communicationLayerPreference: "webrtc",
          checkInstallationImmediately: false,
          enableDebug: false,
          useDeeplink: true,
          modals: { install: false, otp: false },
        })

        const provider = sdk.getProvider()
        if (!provider) return

        // Expose for wagmi injected connector
        ;(window as any).ethereum = provider
        ;(window as any).MM_SDK = sdk

        initializedRef.current = true
      } catch {
        // noop
      }
    })()

    return () => {
      cancelled = true
      void cancelled
    }
  }, [])

  return null
}

export default MetaMaskSdkBoot


