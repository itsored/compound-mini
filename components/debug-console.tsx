"use client"

import { useEffect, useRef, useState } from "react"

type LogEntry = { level: "log" | "warn" | "error"; message: any[]; time: string }

export default function DebugConsole() {
  const enabled = process.env.NEXT_PUBLIC_DEBUG_UI === "true"
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const original = useRef<{ log: any; warn: any; error: any } | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (original.current) return
    original.current = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    }
    const add = (level: LogEntry["level"], args: any[]) => {
      const time = new Date().toLocaleTimeString()
      setLogs((prev) => [...prev.slice(-200), { level, message: args, time }])
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
    return () => {
      if (original.current) {
        console.log = original.current.log
        console.warn = original.current.warn
        console.error = original.current.error
        original.current = null
      }
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div style={{ position: "fixed", bottom: 12, right: 12, zIndex: 99999 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: open ? "#ef4444" : "#22c55e",
          color: "white",
          borderRadius: 999,
          padding: "10px 14px",
          fontSize: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        {open ? "Close Logs" : "Open Logs"}
      </button>
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 56,
            right: 12,
            width: "92vw",
            maxWidth: 480,
            height: "45vh",
            background: "rgba(15,15,20,0.95)",
            color: "#e5e7eb",
            border: "1px solid #374151",
            borderRadius: 8,
            padding: 10,
            overflow: "auto",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
            fontSize: 12,
          }}
        >
          {logs.length === 0 ? (
            <div style={{ opacity: 0.6 }}>No logs yet…</div>
          ) : (
            logs.map((l, i) => (
              <div key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                <span style={{ opacity: 0.6 }}>{l.time}</span>{" "}
                <strong
                  style={{
                    color: l.level === "error" ? "#f87171" : l.level === "warn" ? "#fbbf24" : "#93c5fd",
                  }}
                >
                  {l.level.toUpperCase()}
                </strong>
                : {l.message.map((m, idx) => (idx ? " " : ""))}
                {l.message.map((m, idx) => (
                  <span key={idx}>{typeof m === "string" ? m : JSON.stringify(m)}</span>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}


