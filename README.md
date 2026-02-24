# Compound Mini App

A **Telegram Mini App** for decentralized lending and borrowing, integrating with Compound Protocol for on-chain DeFi operations. Built with Next.js and optimized for Telegram's WebApp environment.

## 🎯 What is This?

This is a **Telegram Mini App** (not a traditional web application) that allows users to:
- Supply the selected collateral asset to earn interest
- Borrow the selected market base token against supplied collateral
- Monitor portfolio health and positions
- Manage DeFi positions directly from Telegram

The app is designed to run inside Telegram's WebApp environment, providing a native mobile experience with seamless wallet integration.

## ✨ Features

- 🏦 **Supply Assets**: Deposit the selected collateral token into Compound Protocol
- 💰 **Borrow Assets**: Borrow the selected base token against supplied collateral
- 📊 **Portfolio Analytics**: Real-time tracking of lending positions and health factor
- 🔄 **Live Rates**: Dynamic interest rates and market data from Compound
- 🎯 **Health Factor Monitoring**: Automated risk management and position tracking
- 🌐 **Multichain Support**: Mainnet chains + Sepolia testnet + local mainnet fork
- 📱 **Telegram Native**: Optimized for Telegram's WebApp environment with native UI integration
- 🔐 **Wallet Integration**: Seamless wallet connection via WalletConnect and injected wallets
- 👤 **Guest Mode**: Explore the app without connecting a wallet

## 📋 Requirements

- **Node.js** version ≥ 18.18.0
- **npm** or **pnpm** package manager
- **Git**
- **Telegram Bot Token** (for testing as a miniapp)
- **Alchemy or Infura API Key** (for blockchain RPC access)
- **Reown AppKit Project ID** (for wallet connections)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/itsored/compound-mini.git
cd compound-mini
```

### 2. Install Dependencies

```bash
# Install main app dependencies
npm install

# Install onchain dependencies (for local development)
cd onchain
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Default selection
NEXT_PUBLIC_DEFAULT_CHAIN=mainnet
NEXT_PUBLIC_DEFAULT_MARKET=usdc

# Reown AppKit Project ID (required)
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id

# RPC URLs (set the chains you plan to use)
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

# Only retained testnet
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com
```

**Get your Reown Project ID:**
1. Visit [cloud.reown.com](https://cloud.reown.com)
2. Create a new project
3. Copy your Project ID

### 4. Network Configuration

The app supports:
- Mainnet chains (mainnet, arbitrum, base, optimism, polygon, scroll, linea, unichain, ronin, mantle)
- Sepolia as the only testnet
- Local mainnet fork for development

#### Option A: Mainnet chain (example: Base)

```bash
cat > .env.local <<'EOF'
NEXT_PUBLIC_DEFAULT_CHAIN=base
NEXT_PUBLIC_DEFAULT_MARKET=usdc
NEXT_PUBLIC_BASE_RPC_URL=https://base-rpc.publicnode.com
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
EOF
```

#### Option B: Sepolia Testnet (only testnet path)

```bash
cat > .env.local <<'EOF'
NEXT_PUBLIC_DEFAULT_CHAIN=sepolia
NEXT_PUBLIC_DEFAULT_MARKET=usdc
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
EOF
```

#### Option C: Local Mainnet Fork (Development Only)

For local development with a mainnet fork:

```bash
cat > .env.local <<'EOF'
NEXT_PUBLIC_DEFAULT_CHAIN=local
NEXT_PUBLIC_DEFAULT_MARKET=mainnet-usdc-fork
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
EOF

# Configure mainnet fork (in onchain directory)
cd onchain
echo 'ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY' > .env
echo 'FORK_BLOCK=23378885' >> .env
cd ..
```

📖 **See [NETWORK_CONFIG.md](./NETWORK_CONFIG.md) for detailed network configuration guide**

#### Quick Network Switching

```bash
# Switch to local mainnet fork
npm run switch:local

# Switch to Sepolia testnet  
npm run switch:sepolia

# Switch to any chain (optional market override)
node scripts/switch-network.js base usdc
node scripts/switch-network.js ronin wron

# Test Sepolia connection
npm run test:sepolia
```

### 5. Start Development Server

```bash
npm run dev
```

If you ever see a blank app due stale local Next processes/cache:

```bash
npm run dev:reset
```

The app will be available at [http://localhost:3000](http://localhost:3000)

**Note**: When running locally, the app will use a mock Telegram WebApp implementation for development. To test as a real Telegram Mini App, you need to deploy and configure it with a Telegram bot (see below).

## 📱 Testing as a Telegram Mini App

### Prerequisites

1. **Telegram Bot**: Create a bot via [@BotFather](https://t.me/BotFather) on Telegram
2. **Deployed Application**: The app must be accessible via HTTPS (required by Telegram)
3. **Bot Configuration**: Configure your bot's Web App URL

### Step 1: Deploy the Application

Deploy your application to a hosting service that provides HTTPS:

**Option A: Vercel (Recommended)**

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy

**Option B: Other Hosting Services**

Any hosting service that provides HTTPS will work (Netlify, Railway, etc.)

### Step 2: Configure Telegram Bot

1. Open [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow instructions to create your bot
3. Send `/newapp` to create a new Mini App
4. Select your bot
5. Provide a title for your Mini App
6. Provide a short description
7. Upload an icon (optional)
8. **Provide your deployed app URL** (e.g., `https://your-app.vercel.app`)
9. Optionally provide a short name for the app

### Step 3: Test in Telegram

1. Open your bot in Telegram
2. Click the "Menu" button (or send `/start`)
3. Click on your Mini App button
4. The app will open in Telegram's WebView

### Step 4: Connect Wallet

When testing in Telegram:

1. **In Telegram WebView**: The app automatically detects the Telegram environment
2. **Wallet Connection**: 
   - Click "Connect Wallet" or "Tour as guest"
   - For WalletConnect: A QR code or deep link will appear
   - For injected wallets: Your Telegram browser's wallet extension will be used
3. **Guest Mode**: You can explore the app without connecting a wallet

### Development vs Production Testing

**Local Development (Browser)**:
- App runs at `http://localhost:3000`
- Uses mock Telegram WebApp API
- Full functionality available for development
- Wallet connections work normally

**Telegram Mini App (Production)**:
- App must be deployed with HTTPS
- Uses real Telegram WebApp API
- Native Telegram UI integration
- Wallet connections optimized for mobile

## 🔧 Local Development with Mainnet Fork

For comprehensive testing with real Compound Protocol contracts:

### Setting Up a Local Mainnet Fork

#### 1. Create Environment File

Create a `.env` file in the `onchain` directory:

```bash
cd onchain
echo 'ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY' > .env
echo 'FORK_BLOCK=23378885' >> .env
```

**Required Environment Variables:**
- `ETH_RPC_URL`: Your Alchemy or Infura mainnet RPC endpoint
- `FORK_BLOCK`: The block number to fork from (optional, defaults to latest)

#### 2. Start Hardhat Node with Mainnet Fork

```bash
cd onchain
npm run node
```

This starts a local Ethereum node forked from mainnet at `http://localhost:8545`

#### 3. Verify Mainnet Fork is Working

Test that you have real mainnet data:

```bash
# Check block number (should be your fork block)
curl -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://127.0.0.1:8545

# Check real contract (USDC should exist)
curl -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "latest"],"id":1}' \
  http://127.0.0.1:8545
```

#### 4. Test Account Information

The Hardhat node provides 20 test accounts with 10,000 ETH each:

**Account #0 (Primary Test Account):**
- **Address**: `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`
- **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Balance**: 10,000 ETH

> Default Hardhat mnemonic (for MetaMask import):
> `test test test test test test test test test test test junk`

#### 5. MetaMask Configuration

Add the local network to MetaMask:
- **Network Name**: Hardhat Local
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: 31337
- **Currency Symbol**: ETH

#### 6. Wrap ETH to WETH

To test DeFi functionality, you'll need WETH (Wrapped ETH). The application requires WETH for supply and borrow operations.

**Wrap ETH for a single account:**
```bash
cd onchain
npx hardhat run scripts/wrap-eth-simple.ts --network hardhat
```

**Wrap ETH for multiple accounts (2 ETH each):**
```bash
npx hardhat run scripts/wrap-multiple.ts --network hardhat
```

**Wrap half of your ETH:**
```bash
npx hardhat run scripts/wrap-half.ts --network hardhat
```

**Expected Results:**
- Accounts funded with the requested WETH
- Each account retains ample ETH for gas fees

**Why WETH is needed:**
- The Compound Protocol (Comet) requires WETH for supply operations
- WETH is the wrapped version of ETH that can be used in DeFi protocols
- Your test accounts start with 10,000 ETH but need WETH for lending/borrowing

### Available Scripts

#### ETH Wrapping Scripts

**Wrap ETH to WETH (Simple)**
```bash
cd onchain
npx hardhat run scripts/wrap-eth-simple.ts --network hardhat
```

**Wrap Half of Your ETH**
```bash
npx hardhat run scripts/wrap-half.ts --network hardhat
```

**Wrap Multiple Amounts**
```bash
npx hardhat run scripts/wrap-multiple.ts --network hardhat
```

#### Other Utility Scripts

**Check Comet Protocol Status**
```bash
npx hardhat run scripts/check-comet.ts --network hardhat
```

**Get WETH Price**
```bash
npx hardhat run scripts/get-weth-price.ts --network hardhat
```

**Test User Positions**
```bash
npx hardhat run scripts/test-positions.ts --network hardhat
```

**Seed Test Data**
```bash
npx hardhat run scripts/seed.ts --network hardhat
```

**Demo Supply & Borrow**
```bash
npx hardhat run scripts/demo-supply-borrow.ts --network hardhat
```

### Compile Contracts

```bash
cd onchain
npm run compile
```

## 🏗️ Project Structure

```
compound-mini/
├── app/                    # Next.js app directory
│   ├── borrow/            # Borrow page
│   ├── supply/            # Supply page
│   ├── withdraw/          # Withdraw page
│   ├── repay/             # Repay page
│   ├── dashboard/         # Dashboard page
│   └── history/           # Transaction history
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard.tsx     # Main dashboard
│   ├── supply-form.tsx   # Supply form component
│   ├── borrow-form.tsx   # Borrow form component
│   ├── wallet-connect.tsx # Wallet connection UI
│   └── ...               # Other components
├── lib/                  # Utility libraries
│   ├── comet-onchain.ts  # Compound Protocol integration
│   ├── wagmi-provider.tsx # Web3 provider configuration
│   ├── telegram-provider.tsx # Telegram WebApp integration
│   ├── guest-mode.tsx    # Guest mode functionality
│   └── utils.ts          # Helper functions
├── onchain/              # Hardhat project
│   ├── scripts/          # Deployment & utility scripts
│   ├── abis/            # Contract ABIs
│   └── hardhat.config.ts # Hardhat configuration
├── types/                # TypeScript type definitions
│   └── telegram.d.ts     # Telegram WebApp types
└── public/               # Static assets
```

## 🛠️ Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Web3**: Wagmi, Viem, Ethers.js
- **Wallet Integration**: Reown AppKit (WalletConnect), Injected Wallets
- **Blockchain**: Hardhat, Ethereum
- **DeFi**: Compound Protocol (Comet)
- **State Management**: TanStack Query
- **Forms**: React Hook Form, Zod validation
- **Telegram**: Telegram WebApp SDK
- **Animations**: Framer Motion

## 🔄 Development Workflow

### For Telegram Mini App Testing

1. **Set up environment**: Configure `.env.local` with network and API keys
2. **Start development server**: `npm run dev`
3. **Test locally**: Open `http://localhost:3000` in browser (uses mock Telegram API)
4. **Deploy to production**: Push to GitHub and deploy via Vercel
5. **Configure Telegram Bot**: Set Web App URL in BotFather
6. **Test in Telegram**: Open your bot and launch the Mini App

### For Local Development with Mainnet Fork

1. **Set up environment**: Create `.env` file in `onchain/` with your RPC URL
2. **Start the local blockchain**: `cd onchain && npm run node`
3. **Verify fork**: Check that you have real mainnet data
4. **Wrap ETH to WETH**: Use the wrapping scripts to get WETH for testing
   - Single account: `npx hardhat run scripts/wrap-eth-simple.ts --network hardhat`
   - Multiple accounts: `npx hardhat run scripts/wrap-multiple.ts --network hardhat`
5. **Start the frontend**: `npm run dev`
6. **Connect wallet**: Use MetaMask to connect to localhost:8545
7. **Test features**: Supply, borrow, and manage positions with real contracts

## 🚢 Deployment

### Vercel (Recommended for Telegram Mini Apps)

1. **Push your changes** to GitHub
2. **Connect your GitHub repository** to Vercel
3. **Configure environment variables** in Vercel dashboard:
   - `NEXT_PUBLIC_DEFAULT_CHAIN`
   - `NEXT_PUBLIC_DEFAULT_MARKET`
   - `NEXT_PUBLIC_REOWN_PROJECT_ID`
   - Chain RPC vars for enabled networks (for example `NEXT_PUBLIC_MAINNET_RPC_URL`, `NEXT_PUBLIC_BASE_RPC_URL`)
   - `NEXT_PUBLIC_SEPOLIA_RPC_URL` only if using Sepolia
4. **Deploy** from the main branch
5. **Update Telegram Bot**: Set the Web App URL in BotFather to your Vercel URL

### Manual Deployment

```bash
npm run build
npm run start
```

**Important**: For Telegram Mini Apps, your deployment must:
- Be accessible via HTTPS
- Have proper CORS headers configured
- Be publicly accessible (no authentication required)

## 🔐 Security Notes

- **Never commit** `.env.local` or `.env` files to version control
- **Use environment variables** for all sensitive keys and API tokens
- **Reown AppKit Project ID** should be kept secure
- **RPC API keys** should have rate limits and access restrictions
- **Telegram Bot Token** should never be exposed in client-side code

## 📖 Additional Resources

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [Compound Protocol Documentation](https://docs.compound.finance/)
- [WalletConnect Documentation](https://docs.reown.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 💬 Support

For questions or support, please open an issue on GitHub or contact the development team.

---

**Note**: This is a Telegram Mini App. While it can be tested in a browser during development, it is designed to run within Telegram's WebApp environment. For the best experience, test it as a deployed Telegram Mini App.
