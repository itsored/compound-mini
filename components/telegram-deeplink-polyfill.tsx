"use client"

import { useEffect } from "react"

export default function TelegramDeeplinkPolyfill() {
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const w: any = window as any
      const tg = w?.Telegram?.WebApp

      if (!tg) return

      // Intercept window.open to route wallet deep links via Telegram
      const originalOpen = window.open
      window.open = function (url?: string | URL, target?: string, features?: string) {
        try {
          const href = typeof url === "string" ? url : (url as URL | undefined)?.toString() || ""
          if (href.startsWith("metamask://") || href.startsWith("wc:") || href.includes("walletconnect")) {
            const universal = href.startsWith("metamask://")
              ? href.replace("metamask://wc?uri=", "https://metamask.app.link/wc?uri=")
              : href
            tg.openLink?.(universal, { try_instant_view: false })
            return null as any
          }
        } catch {}
        return originalOpen.apply(window, [url as any, target as any, features as any])
      }

      // Also intercept location.assign for deep links during WalletConnect flows
      const originalAssign = window.location.assign.bind(window.location)
      ;(window.location as any).assign = (href: string | URL) => {
        try {
          const s = typeof href === "string" ? href : href.toString()
          if (s.startsWith("metamask://") || s.startsWith("wc:")) {
            const universal = s.startsWith("metamask://")
              ? s.replace("metamask://wc?uri=", "https://metamask.app.link/wc?uri=")
              : s
            tg.openLink?.(universal, { try_instant_view: false })
            return
          }
        } catch {}
        return originalAssign(href as any)
      }
    } catch {}
  }, [])

  return null
}
