#!/usr/bin/env node

/**
 * Network + market switcher script
 *
 * Usage:
 *   node scripts/switch-network.js <chain>
 *   node scripts/switch-network.js <chain> <market>
 */

const fs = require("fs")
const path = require("path")

const CHAIN_CONFIG = {
  local: {
    label: "Local mainnet fork",
    defaultMarket: "mainnet-usdc-fork",
    markets: ["mainnet-usdc-fork"],
    rpcEnvVar: "http://127.0.0.1:8545",
    note: "Run the local Hardhat fork in ./onchain before using this target.",
  },
  sepolia: {
    label: "Sepolia testnet",
    defaultMarket: "usdc",
    markets: ["usdc", "weth"],
    rpcEnvVar: "NEXT_PUBLIC_SEPOLIA_RPC_URL or SEPOLIA_RPC_URL",
    note: "Sepolia is the only testnet path retained.",
  },
  mainnet: {
    label: "Ethereum mainnet",
    defaultMarket: "usdc",
    markets: ["usdc", "usds", "usdt", "wbtc", "weth", "wsteth"],
    rpcEnvVar: "NEXT_PUBLIC_MAINNET_RPC_URL",
  },
  arbitrum: {
    label: "Arbitrum One",
    defaultMarket: "usdc",
    markets: ["usdc", "usdc.e", "usdt", "weth"],
    rpcEnvVar: "NEXT_PUBLIC_ARBITRUM_RPC_URL",
  },
  base: {
    label: "Base",
    defaultMarket: "usdc",
    markets: ["aero", "usdbc", "usdc", "usds", "weth"],
    rpcEnvVar: "NEXT_PUBLIC_BASE_RPC_URL",
  },
  optimism: {
    label: "Optimism",
    defaultMarket: "usdc",
    markets: ["usdc", "usdt", "weth"],
    rpcEnvVar: "NEXT_PUBLIC_OPTIMISM_RPC_URL",
  },
  polygon: {
    label: "Polygon",
    defaultMarket: "usdc",
    markets: ["usdc", "usdt"],
    rpcEnvVar: "NEXT_PUBLIC_POLYGON_RPC_URL",
  },
  scroll: {
    label: "Scroll",
    defaultMarket: "usdc",
    markets: ["usdc"],
    rpcEnvVar: "NEXT_PUBLIC_SCROLL_RPC_URL",
  },
  linea: {
    label: "Linea",
    defaultMarket: "usdc",
    markets: ["usdc", "weth"],
    rpcEnvVar: "NEXT_PUBLIC_LINEA_RPC_URL",
  },
  unichain: {
    label: "Unichain",
    defaultMarket: "usdc",
    markets: ["usdc", "weth"],
    rpcEnvVar: "NEXT_PUBLIC_UNICHAIN_RPC_URL",
  },
  ronin: {
    label: "Ronin",
    defaultMarket: "wron",
    markets: ["weth", "wron"],
    rpcEnvVar: "NEXT_PUBLIC_RONIN_RPC_URL",
  },
  mantle: {
    label: "Mantle",
    defaultMarket: "usde",
    markets: ["usde"],
    rpcEnvVar: "NEXT_PUBLIC_MANTLE_RPC_URL",
  },
}

const validChains = Object.keys(CHAIN_CONFIG)

function stripVar(content, key) {
  return content
    .split("\n")
    .filter((line) => !line.startsWith(`${key}=`))
    .join("\n")
}

function upsertVar(content, key, value) {
  const stripped = stripVar(content, key).trimEnd()
  return `${stripped}\n${key}=${value}\n`
}

function showUsage() {
  console.log(`
🌐 Network Switcher for Compound Mini

Usage:
  node scripts/switch-network.js <chain>
  node scripts/switch-network.js <chain> <market>

Chains:
${validChains
  .map((chainKey) => {
    const cfg = CHAIN_CONFIG[chainKey]
    return `  ${chainKey.padEnd(9)} - ${cfg.label} (default: ${cfg.defaultMarket}; markets: ${cfg.markets.join(", ")})`
  })
  .join("\n")}

Examples:
  node scripts/switch-network.js local
  node scripts/switch-network.js sepolia
  node scripts/switch-network.js mainnet usdc
  node scripts/switch-network.js ronin wron
  node scripts/switch-network.js mantle usde
`);
}

function switchNetwork(chain, marketArg) {
  if (!validChains.includes(chain)) {
    console.error(`❌ Invalid chain: ${chain}`)
    showUsage()
    process.exit(1)
  }

  const chainConfig = CHAIN_CONFIG[chain]
  const market = marketArg || chainConfig.defaultMarket
  if (!chainConfig.markets.includes(market)) {
    console.error(
      `❌ Invalid market "${market}" for chain "${chain}". Supported markets: ${chainConfig.markets.join(", ")}`,
    )
    process.exit(1)
  }
  const envPath = path.join(process.cwd(), ".env.local")

  try {
    let envContent = ""
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8")
    }

    envContent = stripVar(envContent, "NEXT_PUBLIC_NETWORK")
    envContent = stripVar(envContent, "NEXT_PUBLIC_DEFAULT_CHAIN")
    envContent = stripVar(envContent, "NEXT_PUBLIC_DEFAULT_MARKET")

    envContent = upsertVar(envContent, "NEXT_PUBLIC_NETWORK", chain)
    envContent = upsertVar(envContent, "NEXT_PUBLIC_DEFAULT_CHAIN", chain)
    envContent = upsertVar(envContent, "NEXT_PUBLIC_DEFAULT_MARKET", market)

    fs.writeFileSync(envPath, envContent.trim() + "\n")

    console.log(`✅ Switched to chain=${chain}, market=${market}`)
    console.log(`📝 Updated ${envPath}`)
    console.log(`🔌 RPC env var: ${chainConfig.rpcEnvVar}`)
    if (chainConfig.note) {
      console.log(`ℹ️  ${chainConfig.note}`)
    }
  } catch (error) {
    console.error(`❌ Error switching network: ${error.message}`)
    process.exit(1)
  }
}

// Main execution
const chain = process.argv[2]
const market = process.argv[3]

if (!chain) {
  showUsage()
  process.exit(1)
}

switchNetwork(chain, market)
