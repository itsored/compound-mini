"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

interface GuestContextValue {
  guest: boolean
  enterGuest: () => void
  exitGuest: () => void
}

const GuestContext = createContext<GuestContextValue | undefined>(undefined)

const STORAGE_KEY = "compound_guest_mode"

export function GuestModeProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === "true") {
        setGuest(true)
      }
    } catch {}
  }, [])

  const enterGuest = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true")
    } catch {}
    setGuest(true)
  }

  const exitGuest = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    setGuest(false)
  }

  const value = useMemo(() => ({ guest, enterGuest, exitGuest }), [guest])

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>
}

export function useGuestMode() {
  const ctx = useContext(GuestContext)
  if (!ctx) throw new Error("useGuestMode must be used within GuestModeProvider")
  return ctx
}
