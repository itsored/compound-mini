# Network Configuration Guide

This app now supports multichain + multimarket selection for all Comet v3 deployments:
- Mainnet chains only.
- Sepolia retained as the only testnet.
- Local mainnet fork retained for development.

Selection is controlled by:
- `NEXT_PUBLIC_DEFAULT_CHAIN`
- `NEXT_PUBLIC_DEFAULT_MARKET`

Backward-compatible env support is still available via:
- `NEXT_PUBLIC_NETWORK`

## Selection Resolution Order

The active chain/market/collateral is resolved in this order:
1. URL query params (`chain`, `market`, `collateral`)
2. Local storage (`compound.activeSelection.v1`)
3. Env defaults (`NEXT_PUBLIC_DEFAULT_CHAIN`, `NEXT_PUBLIC_DEFAULT_MARKET`, fallback `NEXT_PUBLIC_NETWORK`)

## Supported Chains

| chainKey | chainId | explorer | RPC env var |
|---|---:|---|---|
| `mainnet` | 1 | `https://etherscan.io` | `NEXT_PUBLIC_MAINNET_RPC_URL` |
| `arbitrum` | 42161 | `https://arbiscan.io` | `NEXT_PUBLIC_ARBITRUM_RPC_URL` |
| `base` | 8453 | `https://basescan.org` | `NEXT_PUBLIC_BASE_RPC_URL` |
| `optimism` | 10 | `https://optimistic.etherscan.io` | `NEXT_PUBLIC_OPTIMISM_RPC_URL` |
| `polygon` | 137 | `https://polygonscan.com` | `NEXT_PUBLIC_POLYGON_RPC_URL` |
| `scroll` | 534352 | `https://scrollscan.com` | `NEXT_PUBLIC_SCROLL_RPC_URL` |
| `linea` | 59144 | `https://lineascan.build` | `NEXT_PUBLIC_LINEA_RPC_URL` |
| `unichain` | 130 | `https://unichain.blockscout.com` | `NEXT_PUBLIC_UNICHAIN_RPC_URL` |
| `ronin` | 2020 | `https://app.roninchain.com` | `NEXT_PUBLIC_RONIN_RPC_URL` |
| `mantle` | 5000 | `https://explorer.mantle.xyz` | `NEXT_PUBLIC_MANTLE_RPC_URL` |
| `sepolia` | 11155111 | `https://sepolia.etherscan.io` | `NEXT_PUBLIC_SEPOLIA_RPC_URL` / `SEPOLIA_RPC_URL` |
| `local` | 31337 | local | `http://127.0.0.1:8545` |

## Supported Markets

| chainKey | markets |
|---|---|
| `mainnet` | `usdc`, `usds`, `usdt`, `wbtc`, `weth`, `wsteth` |
| `arbitrum` | `usdc`, `usdc.e`, `usdt`, `weth` |
| `base` | `aero`, `usdbc`, `usdc`, `usds`, `weth` |
| `optimism` | `usdc`, `usdt`, `weth` |
| `polygon` | `usdc`, `usdt` |
| `scroll` | `usdc` |
| `linea` | `usdc`, `weth` |
| `unichain` | `usdc`, `weth` |
| `ronin` | `weth`, `wron` |
| `mantle` | `usde` |
| `sepolia` | `usdc`, `weth` |
| `local` | `mainnet-usdc-fork` |

Collateral/token support for each market is defined in [`/Users/Shared/Nash/compound-mini/lib/comet-market-registry.ts`](/Users/Shared/Nash/compound-mini/lib/comet-market-registry.ts), sourced from `deployments/<network>/<market>/configuration.json` and `roots.json` (with Sepolia fallback overrides where deployment assets omit addresses).

## Quick Setup

### Mainnet chain example (Base)

```bash
cat > .env.local <<'EOF'
NEXT_PUBLIC_DEFAULT_CHAIN=base
NEXT_PUBLIC_DEFAULT_MARKET=usdc
NEXT_PUBLIC_BASE_RPC_URL=https://base-rpc.publicnode.com
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
EOF
```

### Sepolia testnet (only testnet path)

```bash
cat > .env.local <<'EOF'
NEXT_PUBLIC_DEFAULT_CHAIN=sepolia
NEXT_PUBLIC_DEFAULT_MARKET=usdc
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
EOF
```

### Local mainnet fork

```bash
cat > .env.local <<'EOF'
NEXT_PUBLIC_DEFAULT_CHAIN=local
NEXT_PUBLIC_DEFAULT_MARKET=mainnet-usdc-fork
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
EOF

cd onchain
cat > .env <<'EOF'
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
FORK_BLOCK=23378885
EOF
npm run node
```

## Switcher Script

Use:

```bash
node scripts/switch-network.js <chain>
node scripts/switch-network.js <chain> <market>
```

Examples:

```bash
node scripts/switch-network.js local
node scripts/switch-network.js sepolia
node scripts/switch-network.js mainnet usdc
node scripts/switch-network.js ronin wron
node scripts/switch-network.js mantle usde
```

The script updates:
- `NEXT_PUBLIC_NETWORK` (legacy compatibility)
- `NEXT_PUBLIC_DEFAULT_CHAIN`
- `NEXT_PUBLIC_DEFAULT_MARKET`
