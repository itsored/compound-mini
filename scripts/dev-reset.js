#!/usr/bin/env node

const { execSync, spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

function killPort(port) {
  try {
    const output = execSync(`lsof -ti tcp:${port}`, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim()
    if (!output) return
    const pids = output.split(/\s+/).filter(Boolean)
    if (pids.length > 0) {
      execSync(`kill -9 ${pids.join(" ")}`, { stdio: "ignore" })
      console.log(`Killed process(es) on port ${port}: ${pids.join(", ")}`)
    }
  } catch {
    // no listeners on this port
  }
}

function cleanNextCache() {
  const nextDir = path.join(process.cwd(), ".next")
  try {
    fs.rmSync(nextDir, { recursive: true, force: true })
    console.log("Cleaned .next cache")
  } catch (error) {
    console.warn("Could not clean .next cache:", error?.message || error)
  }
}

function startDev() {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm"
  const child = spawn(npmCmd, ["run", "dev"], {
    stdio: "inherit",
    env: process.env,
  })

  child.on("exit", (code) => process.exit(code ?? 0))
}

killPort(3000)
killPort(3001)
cleanNextCache()
startDev()
