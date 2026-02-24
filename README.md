# Compound Mini

Compound Mini is a Telegram Mini App for interacting with Compound v3 markets.  
It provides supply, borrow, repay, withdraw, and portfolio monitoring workflows in a mobile-first interface designed for Telegram WebView and standard browsers.

## Core Features

- Supply supported collateral assets to Compound v3 markets
- Borrow base assets against supplied collateral
- Repay debt and withdraw collateral
- Monitor portfolio health and utilization in near real time
- Switch chain/market context with persisted user selection
- Run in guest mode for non-custodial product walkthroughs

## Technology Stack

- Next.js 15, React 19, TypeScript
- Wagmi, Viem, Ethers
- Reown AppKit for wallet connectivity
- Tailwind CSS and Radix UI
- Hardhat workspace for local mainnet-fork testing

## Repository Structure

```text
compound-mini/
├── app/                  # Next.js routes
├── components/           # UI and feature components
├── lib/                  # Protocol, network, and app providers
├── scripts/              # Network switch and utility scripts
├── onchain/              # Hardhat workspace for local fork testing
├── public/               # Static assets
└── README.md
```

## Prerequisites

- Node.js 18.18+ (or newer)
- npm
- Reown AppKit project ID
- RPC endpoints for the networks you plan to use

## Installation

```bash
git clone https://github.com/itsored/compound-mini.git
cd compound-mini
npm install
cd onchain && npm install && cd ..
```

## Environment Configuration

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_DEFAULT_CHAIN=mainnet
NEXT_PUBLIC_DEFAULT_MARKET=usdc
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id

# Set only what you need for enabled networks
NEXT_PUBLIC_MAINNET_RPC_URL=https://ethereum.publicnode.com
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arbitrum-one-rpc.publicnode.com
NEXT_PUBLIC_BASE_RPC_URL=https://base-rpc.publicnode.com
NEXT_PUBLIC_OPTIMISM_RPC_URL=https://optimism-rpc.publicnode.com
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-bor-rpc.publicnode.com
NEXT_PUBLIC_SCROLL_RPC_URL=https://rpc.scroll.io
NEXT_PUBLIC_LINEA_RPC_URL=https://rpc.linea.build
NEXT_PUBLIC_UNICHAIN_RPC_URL=https://mainnet.unichain.org
NEXT_PUBLIC_RONIN_RPC_URL=https://api.roninchain.com/rpc
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.mantle.xyz
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com
```

For local mainnet-fork workflows, create `onchain/.env`:

```bash
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/<YOUR_KEY>
FORK_BLOCK=23378885
```

## Run Locally

```bash
npm run dev
```

The app starts at `http://localhost:3000`.

If the local Next.js state becomes stale:

```bash
npm run dev:reset
```

## Network and Market Switching

Use built-in scripts to update `.env.local` defaults:

```bash
npm run switch:local
npm run switch:sepolia
node scripts/switch-network.js <chain> [market]
```

Supported chain keys:

- `local`
- `sepolia`
- `mainnet`
- `arbitrum`
- `base`
- `optimism`
- `polygon`
- `scroll`
- `linea`
- `unichain`
- `ronin`
- `mantle`

See [NETWORK_CONFIG.md](./NETWORK_CONFIG.md) for detailed network and market configuration.

## Available Commands

Root workspace:

- `npm run dev` - start development server
- `npm run dev:reset` - clear stale dev state and restart
- `npm run build` - production build
- `npm run start` - start production server
- `npm run lint` - lint checks
- `npm run switch:local` - set defaults for local fork
- `npm run switch:sepolia` - set defaults for Sepolia

Onchain workspace (`onchain/`):

- `npm run node` - start Hardhat local node
- `npm run compile` - compile contracts/tasks
- `npm run test` - run Hardhat tests
- `npm run seed` - run seed script on local node

## Deployment

For Telegram Mini App usage, deploy over HTTPS (for example, Vercel), configure environment variables in the hosting platform, and register the deployment URL with your Telegram bot via BotFather (`/newapp` or bot menu configuration).

## Security Guidance

- Do not commit `.env`, `.env.local`, or secret tokens
- Keep RPC and wallet provider credentials scoped and rotated
- Avoid embedding private keys or bot tokens in client code
- Use least-privilege API keys where supported
