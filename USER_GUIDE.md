# Compound Mini App - User Guide

Welcome to **Compound Mini App**! This guide will walk you through everything you need to know to get started with lending and borrowing on Compound Protocol directly from Telegram.

## 📱 Getting Started

### Step 1: Find the App on Telegram

1. Open the **Telegram** app on your mobile device or desktop
2. In the search bar, type **`@compoundminiapp`**
3. Tap on the **Compound Mini App** bot
4. Tap **Start** or send `/start` to begin

### Step 2: Launch the Mini App

1. Once you've started the bot, you'll see a menu button
2. Tap the **Menu** button (or the app icon if available)
3. Tap **"Open App"** or the app button to launch the Mini App
4. The app will open in Telegram's built-in browser

🎉 **Congratulations!** You're now in the Compound Mini App.

---

## 🎮 First Time Experience

### Welcome Screen

When you first open the app, you'll see a welcome modal with:
- An overview of what you can do
- An **Enter** button to get started

Tap **Enter** to proceed to the main app.

### Guest Mode vs. Wallet Connection

You have two options to explore the app:

**Option 1: Tour as Guest** (Recommended for first-time users)
- Explore the app without connecting a wallet
- View all features and interface
- No transactions possible (view-only mode)
- Perfect for learning how the app works

**Option 2: Connect Wallet**
- Full functionality with real transactions
- Supply assets, borrow, and manage positions
- Requires a wallet with Sepolia testnet ETH

For this guide, we'll connect a wallet to test all features.

---

## 🔐 Setting Up Your Wallet

### Step 1: Get a Wallet

You'll need a Web3 wallet that supports Ethereum. Popular options include:
- **MetaMask** (Mobile app or browser extension)
- **Trust Wallet** (Mobile app)
- **Rainbow Wallet** (Mobile app)
- **Coinbase Wallet** (Mobile app)

**For this guide, we'll use MetaMask as an example.**

### Step 2: Install MetaMask

1. **On Mobile:**
   - Download **MetaMask** from the App Store (iOS) or Google Play (Android)
   - Open the app and create a new wallet or import an existing one
   - **Important:** Save your seed phrase securely!

2. **On Desktop:**
   - Install the MetaMask browser extension from [metamask.io](https://metamask.io)
   - Create a new wallet or import an existing one
   - Save your seed phrase securely

### Step 3: Add Sepolia Testnet

Since we're testing on Sepolia testnet, you need to add it to your wallet:

1. Open MetaMask
2. Tap/click the network dropdown (usually shows "Ethereum Mainnet")
3. Scroll down and tap **"Add Network"** or **"Add a network manually"**
4. Enter the following details:
   - **Network Name:** Sepolia
   - **RPC URL:** `https://sepolia.infura.io/v3/YOUR_INFURA_KEY` or `https://sepolia.publicnode.com`
   - **Chain ID:** 11155111
   - **Currency Symbol:** ETH
   - **Block Explorer URL:** `https://sepolia.etherscan.io`
5. Tap **Save**

You should now see "Sepolia" as your selected network.

---

## 💧 Getting Test ETH from a Faucet

You'll need Sepolia ETH to pay for gas fees and to wrap into WETH. Here's how to get it:

### Step 1: Find a Sepolia Faucet

Popular Sepolia testnet faucets:
- **Alchemy Sepolia Faucet:** [sepoliafaucet.com](https://sepoliafaucet.com)
- **Infura Sepolia Faucet:** [infura.io/faucet/sepolia](https://www.infura.io/faucet/sepolia)
- **PoW Faucet:** [sepolia-faucet.pk910.de](https://sepolia-faucet.pk910.de)
- **QuickNode Faucet:** [faucet.quicknode.com/ethereum/sepolia](https://faucet.quicknode.com/ethereum/sepolia)

### Step 2: Request Test ETH

1. Open one of the faucet websites in your browser
2. Connect your MetaMask wallet (if required)
3. Enter your wallet address:
   - Open MetaMask
   - Tap/click on your account name at the top
   - Tap **"Copy address to clipboard"**
   - Paste it into the faucet form
4. Complete any required verification (CAPTCHA, social media follow, etc.)
5. Tap **"Send Me ETH"** or **"Request ETH"**
6. Wait a few moments for the transaction to complete

**Note:** Most faucets have rate limits (e.g., once per 24 hours). You typically receive 0.1-0.5 Sepolia ETH per request.

### Step 3: Verify You Received ETH

1. Open MetaMask
2. Make sure you're on the **Sepolia** network
3. Check your balance - you should see your test ETH
4. You can also check on [Sepolia Etherscan](https://sepolia.etherscan.io) by searching for your address

---

## 🔄 Wrapping ETH to WETH

The Compound Mini App uses **WETH (Wrapped ETH)** for supply and borrow operations. You need to wrap your Sepolia ETH into WETH first.

### Step 1: Go to SepoliaScan

1. Open your browser and go to [Sepolia Etherscan](https://sepolia.etherscan.io)
2. Make sure you're on the Sepolia testnet (check the network indicator)

### Step 2: Find the WETH Contract

1. In the search bar, enter the WETH contract address:
   ```
   0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9
   ```
2. Press Enter or tap Search
3. You'll be taken to the WETH contract page

### Step 3: Connect Your Wallet

1. On the WETH contract page, look for the **"Contract"** tab
2. Click on the **"Contract"** tab
3. You'll see a **"Connect to Web3"** button - click it
4. Select **MetaMask** from the wallet options
5. Approve the connection in MetaMask

### Step 4: Deposit ETH (Wrap to WETH)

1. Scroll down to find the **"Write Contract"** section
2. Look for the **"deposit"** function
3. Click **"Write"** or **"deposit"** button
4. A MetaMask popup will appear
5. Review the transaction:
   - **Amount:** Enter how much ETH you want to wrap (e.g., 0.1 ETH)
   - **Gas fee:** Review the estimated gas cost
6. Click **"Confirm"** in MetaMask
7. Wait for the transaction to be confirmed (usually 10-30 seconds)

**What's happening:** The `deposit` function wraps your ETH into WETH. For every 1 ETH you deposit, you receive 1 WETH.

### Step 5: Verify Your WETH Balance

1. Go back to the WETH contract page on SepoliaScan
2. Click the **"Read Contract"** tab
3. Find the **"balanceOf"** function
4. Enter your wallet address in the address field
5. Click **"Query"**
6. You should see your WETH balance (it will be in wei, so divide by 10^18 to see the actual amount)

**Alternative:** You can also check your WETH balance in MetaMask:
1. Open MetaMask
2. Tap **"Import tokens"** at the bottom
3. Enter the WETH contract address: `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9`
4. Tap **"Add Custom Token"**
5. Your WETH balance will now appear in MetaMask

---

## 🏦 Using the Compound Mini App

Now that you have WETH, let's explore the app features!

### Step 1: Connect Your Wallet

1. In the Compound Mini App (still open in Telegram)
2. Look at the top right corner - you'll see **"Tour as guest"** and **"Connect Wallet"** buttons
3. Tap **"Connect Wallet"**
4. A wallet connection modal will appear
5. Choose your wallet:
   - **WalletConnect:** Scan QR code with MetaMask mobile app
   - **Injected:** If using MetaMask browser extension, it will appear automatically
6. Approve the connection in MetaMask
7. Select the Sepolia network if prompted

**Success!** Your wallet is now connected. You'll see your wallet address in the header.

### Step 2: Explore the Dashboard

1. Tap the **Dashboard** icon in the bottom navigation
2. You'll see:
   - Your net worth
   - Health factor (if you have positions)
   - Current positions
   - Supply and borrow balances

### Step 3: Supply WETH (Earn Interest)

1. Tap the **Supply** icon in the bottom navigation (or from the home page)
2. You'll see:
   - Your WETH wallet balance
   - Your current supplied WETH
   - Supply APY (Annual Percentage Yield)
3. Enter the amount of WETH you want to supply:
   - Type the amount in the input field
   - Or tap **"MAX"** to supply all your WETH
4. Review the supply preview:
   - Supply APY
   - Projected annual earnings
   - USD value
5. Tap **"Supply [amount] WETH"** button
6. MetaMask will pop up - review and confirm the transaction
7. Wait for confirmation (this may take 10-30 seconds)
8. **Success!** You'll see a success screen with a **"Go to Dashboard"** button

**What's happening:** You're depositing WETH into Compound Protocol, which will start earning interest immediately.

### Step 4: View Your Position

1. After supplying, tap **"Go to Dashboard"** from the success screen
2. Or navigate to Dashboard from the bottom menu
3. You'll now see:
   - Your supplied WETH amount
   - Your net worth updated
   - Health factor (should be very high since you haven't borrowed yet)

### Step 5: Borrow USDC (Optional)

Now that you have collateral (supplied WETH), you can borrow USDC:

1. Tap the **Borrow** icon in the bottom navigation
2. You'll see:
   - Your collateral balance (supplied WETH)
   - Current health factor
   - Borrow APY
   - Maximum borrowable amount
3. Enter the amount of USDC you want to borrow
4. Review the borrow preview:
   - Borrow APY
   - New health factor (make sure it stays above 1.5 for safety!)
   - Total borrowed amount
5. Tap **"Borrow [amount] USDC"** button
6. MetaMask will pop up - review and confirm
7. Wait for confirmation
8. **Success!** You'll see a success screen

**Important Notes:**
- You can only borrow up to a certain percentage of your collateral (typically 85%)
- Your health factor will decrease when you borrow
- Keep your health factor above 1.5 to avoid liquidation risk

### Step 6: Withdraw WETH

If you want to withdraw some of your supplied WETH:

1. Tap the **Withdraw** icon in the bottom navigation
2. You'll see:
   - Your current supplied WETH
   - Available to withdraw
   - Supply APY
3. Enter the amount you want to withdraw
4. Review the preview:
   - Interest lost annually
   - New health factor (if you have borrows)
   - Remaining collateral
5. Tap **"Withdraw [amount] WETH"** button
6. Confirm in MetaMask
7. Wait for confirmation

**Note:** You can only withdraw if your health factor remains safe after withdrawal.

### Step 7: Repay Borrowed USDC

To reduce your debt and improve your health factor:

1. Tap the **Repay** icon in the bottom navigation
2. You'll see:
   - Your current borrow balance
   - Borrow APY
   - Your USDC wallet balance
3. Enter the amount of USDC you want to repay
4. Review the preview:
   - Interest saved annually
   - New health factor
   - Remaining debt
5. Tap **"Repay [amount] USDC"** button
6. Confirm in MetaMask
7. Wait for confirmation

**Note:** You'll need USDC in your wallet to repay. You can get test USDC from faucets or by borrowing it first.

### Step 8: View Transaction History

1. Tap the **History** icon in the bottom navigation (if available)
2. Or navigate to the History page
3. You'll see all your transactions:
   - Supplies
   - Withdrawals
   - Borrows
   - Repayments

---

## 💡 Tips and Best Practices

### Health Factor Management

- **Health Factor > 2.0:** Very safe, you can borrow more
- **Health Factor 1.5 - 2.0:** Safe, but monitor closely
- **Health Factor < 1.5:** Risky! Consider repaying debt or adding collateral
- **Health Factor < 1.0:** At risk of liquidation

### Gas Fees

- All transactions on Sepolia require gas fees (paid in ETH)
- Keep some ETH in your wallet for gas, don't wrap everything
- Gas fees on testnets are usually very low

### Interest Rates

- Supply APY: The interest you earn on supplied assets
- Borrow APY: The interest you pay on borrowed assets
- Rates are variable and change based on market conditions

### Guest Mode

- Use guest mode to explore the app without connecting a wallet
- Perfect for learning the interface
- No real transactions possible in guest mode

---

## ❓ Troubleshooting

### "Insufficient Balance" Error

- **Problem:** You don't have enough WETH or ETH
- **Solution:** 
  - Check your wallet balance
  - Make sure you've wrapped ETH to WETH for supply operations
  - Keep some ETH for gas fees

### "Transaction Failed" Error

- **Problem:** Transaction was rejected or failed
- **Solutions:**
  - Check you have enough ETH for gas
  - Make sure you're on Sepolia testnet
  - Try increasing gas limit in MetaMask
  - Wait a moment and try again

### "Network Mismatch" Error

- **Problem:** Your wallet is on the wrong network
- **Solution:** Switch MetaMask to Sepolia testnet

### Can't Connect Wallet

- **Problem:** Wallet connection not working
- **Solutions:**
  - Make sure MetaMask is unlocked
  - Try refreshing the app
  - Use WalletConnect if browser extension isn't working
  - Check that you've approved the connection

### WETH Balance Not Showing

- **Problem:** WETH not visible in MetaMask
- **Solution:** 
  - Import WETH as a custom token in MetaMask
  - Use contract address: `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9`
  - Check your balance on SepoliaScan

---

## 🎓 Learning Resources

- **Compound Protocol Docs:** [docs.compound.finance](https://docs.compound.finance)
- **Sepolia Testnet Info:** [sepolia.dev](https://sepolia.dev)
- **MetaMask Guide:** [metamask.io/learn](https://metamask.io/learn)

---

## 🆘 Need Help?

If you encounter any issues:
1. Check this guide's troubleshooting section
2. Make sure you're on Sepolia testnet
3. Verify you have sufficient balances
4. Try refreshing the app
5. Contact support through the Telegram bot

---

## 🎉 You're All Set!

You now know how to:
- ✅ Find and launch the Compound Mini App
- ✅ Get test ETH from faucets
- ✅ Wrap ETH to WETH
- ✅ Supply assets to earn interest
- ✅ Borrow against your collateral
- ✅ Manage your DeFi positions

Happy lending and borrowing! 🚀

---

**Remember:** This is a testnet application. All assets are test tokens with no real value. Always do your own research and understand the risks before using mainnet DeFi protocols.

