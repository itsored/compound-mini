"use client"

import { useEffect, useRef, useState } from "react"

type LogEntry = { level: "log" | "warn" | "error" | "info" | "debug"; message: any[]; time: string }

export default function DebugConsole() {
  // Enable if env is true, or URL has ?debug=1, or localStorage has DEBUG_UI=1
  const computeShouldEnable = () => {
    const envEnabled = process.env.NEXT_PUBLIC_DEBUG_UI === "true"
    if (typeof window === 'undefined') return envEnabled
    try {
      const params = new URLSearchParams(window.location.search)
      const urlEnabled = params.get('debug') === '1'
      const stored = window.localStorage.getItem('DEBUG_UI') === '1'
      if (urlEnabled) {
        window.localStorage.setItem('DEBUG_UI', '1')
      }
      return envEnabled || urlEnabled || stored
    } catch {
      return envEnabled
    }
  }

  const [enabled, setEnabled] = useState(computeShouldEnable())
  const [open, setOpen] = useState(true) // Start open by default
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const original = useRef<{ log: any; warn: any; error: any; info: any; debug: any } | null>(null)

  useEffect(() => {
    // Recompute on mount in case of client-only signals
    setEnabled(computeShouldEnable())
  }, [])

  useEffect(() => {
    if (!enabled) return
    if (original.current) return
    
    original.current = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    }
    
    const add = (level: LogEntry["level"], args: any[]) => {
      const time = new Date().toLocaleTimeString()
      setLogs((prev) => {
        const newLogs = [...prev, { level, message: args, time }]
        // Keep last 500 logs instead of 200
        return newLogs.slice(-500)
      })
    }
    
    console.log = (...args: any[]) => {
      add("log", args)
      original.current?.log(...args)
    }
    console.warn = (...args: any[]) => {
      add("warn", args)
      original.current?.warn(...args)
    }
    console.error = (...args: any[]) => {
      add("error", args)
      original.current?.error(...args)
    }
    console.info = (...args: any[]) => {
      add("info", args)
      original.current?.info(...args)
    }
    console.debug = (...args: any[]) => {
      add("debug", args)
      original.current?.debug(...args)
    }
    
    return () => {
      if (original.current) {
        console.log = original.current.log
        console.warn = original.current.warn
        console.error = original.current.error
        console.info = original.current.info
        console.debug = original.current.debug
        original.current = null
      }
    }
  }, [enabled])

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const copyLogs = async () => {
    const logText = logs.map(l => 
      `[${l.time}] ${l.level.toUpperCase()}: ${l.message.map(m => 
        typeof m === "string" ? m : JSON.stringify(m, null, 2)
      ).join(" ")}`
    ).join("\n")
    
    try {
      await navigator.clipboard.writeText(logText)
      console.log("📋 Logs copied to clipboard!")
    } catch (err) {
      console.error("Failed to copy logs:", err)
    }
  }

  const clearLogs = () => {
    setLogs([])
    console.log("🧹 Logs cleared")
  }

  if (!enabled) return null

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, top: 0, zIndex: 2147483647, pointerEvents: "none" }}>
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60vh",
            background: "rgba(0,0,0,0.95)",
            color: "#e5e7eb",
            border: "2px solid #374151",
            borderBottom: "none",
            borderLeft: "none",
            borderRight: "none",
            padding: 0,
            overflow: "hidden",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
            fontSize: 11,
            pointerEvents: "auto",
          }}
        >
          {/* Header with controls */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            padding: "8px 12px", 
            background: "#1f2937", 
            borderBottom: "1px solid #374151",
            fontSize: 12
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: "bold" }}>Debug Console</span>
              <span style={{ opacity: 0.6 }}>({logs.length} logs)</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                style={{
                  background: autoScroll ? "#22c55e" : "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 10,
                  cursor: "pointer"
                }}
              >
                Auto
              </button>
              <button
                onClick={copyLogs}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 10,
                  cursor: "pointer"
                }}
              >
                Copy
              </button>
              <button
                onClick={clearLogs}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 10,
                  cursor: "pointer"
                }}
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 10,
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>
          </div>
          
          {/* Logs container */}
          <div
            ref={logContainerRef}
            style={{
              height: "calc(100% - 40px)",
              overflow: "auto",
              padding: 8,
            }}
          >
            {logs.length === 0 ? (
              <div style={{ opacity: 0.6, textAlign: "center", marginTop: 20 }}>No logs yet…</div>
            ) : (
              logs.map((l, i) => (
                <div 
                  key={i} 
                  style={{ 
                    whiteSpace: "pre-wrap", 
                    wordBreak: "break-word",
                    marginBottom: 2,
                    padding: "2px 0",
                    borderBottom: "1px solid rgba(55, 65, 81, 0.3)"
                  }}
                >
                  <span style={{ opacity: 0.6, fontSize: 10 }}>{l.time}</span>{" "}
                  <strong
                    style={{
                      color: l.level === "error" ? "#f87171" : 
                             l.level === "warn" ? "#fbbf24" : 
                             l.level === "info" ? "#60a5fa" :
                             l.level === "debug" ? "#a78bfa" : "#93c5fd",
                      fontSize: 10
                    }}
                  >
                    {l.level.toUpperCase()}
                  </strong>
                  : {l.message.map((m, idx) => (
                    <span key={idx}>
                      {typeof m === "string" ? m : JSON.stringify(m, null, 2)}
                      {idx < l.message.length - 1 ? " " : ""}
                    </span>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Floating toggle button when closed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            background: "#22c55e",
            color: "white",
            borderRadius: 999,
            padding: "10px 14px",
            fontSize: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            border: "none",
            cursor: "pointer",
            pointerEvents: "auto"
          }}
        >
          📋 Debug ({logs.length})
        </button>
      )}
    </div>
  )
}


