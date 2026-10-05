# 🟢 Lidex (LDX) - Real Token Listing Guide

Your token is already deployed on BNB Smart Chain but not yet listed for trading!

## 📊 Real Token Info (from BscScan)

- **Name:** Lidex
- **Symbol:** LDX (previously shown as Lidex)
- **Address:** `0x567A4F63f6838005e104C053fc24a3510b0432E1`
- **BscScan:** https://bscscan.com/token/0x567A4F63f6838005e104C053fc24a3510b0432E1
- **Decimals:** 18
- **Max Supply:** 500,000,000 LDX
- **Holders:** 4
- **Transfers:** 5
- **Creator:** 0x06DAe90659b2e436fddFA77C7Df27b03a514B568
- **Deployed:** 331 days ago (2024-10-14) - Block 64623788
- **Locked:** 
  - 60,000,000 LDX in PinkLock V2
  - 160,000,000 LDX in PinkLock V2
  - Total Locked: 220M (44%)

## ✅ What I've Done - Integrated Real LDX into LidexSwap DEX

1. **Updated Frontend** `src/App.jsx`:
   - Token list now uses real address `0x567A4F63...432E1`
   - Symbol updated to `LDX` (real symbol)
   - Price set to $0.0085 (placeholder - will be set by market)
   - Added verified badge, BscScan link
   - Balance: 50,000 LDX for demo

2. **Token List** `src/tokenlist.json`:
   - Official LidexSwap token list with real LDX

3. **DEX shows "Not Listed" status**:
   - Farms show "Not Listed" for LDX pairs
   - Pools show 0 staked
   - Chart shows LDX/BNB with not listed warning

## 🚀 How to List LDX for Trading (Next Steps)

### Step 1: Create Liquidity Pool on LidexSwap (Your DEX)

```solidity
// In your LidexRouter (once deployed)
// Add liquidity LDX/BNB

// Approve router to spend LDX
LDX.approve(LidexRouter, amount)

// Add liquidity
LidexRouter.addLiquidity(
  LDX_ADDRESS, // 0x567A4F63f6838005e104C053fc24a3510b0432E1
  WBNB,        // 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
  100000 * 1e18, // 100k LDX
  1 * 1e18,      // 1 BNB
  0, 0,
  yourAddress,
  deadline
)
```

### Step 2: Deploy LidexSwap Factory & Router

You have contracts ready in `/contracts/`:
- `LidexFactory.sol`
- `LidexRouter.sol`

Deploy to BSC Mainnet:

```bash
# Using Hardhat
npx hardhat run scripts/deploy.js --network bscMainnet
```

### Step 3: Verify Contract on BscScan

Your token is already verified (Exact Match). Verify Factory & Router too.

### Step 4: List on PancakeSwap (for visibility)

Even though you have your own DEX, list on PancakeSwap too for initial liquidity:

```js
// PancakeSwap Router: 0x10ED43C718714eb63d5aA57B78B54704E256024E
// Add same liquidity as Step 1
```

### Step 5: Update Token Info on BscScan

- Go to https://bscscan.com/token/0x567A4F63f6838005e104C053fc24a3510b0432E1
- Click "Update Token Info"
- Upload your green logo
- Add socials, website: LidexSwap
- Add description

### Step 6: Create Initial Price

Since supply is 500M, if you add:
- 100k LDX + 1 BNB (~$716) = Price ~$0.00716 per LDX
- Market cap ~$3.58M (500M * 0.00716)

Adjust liquidity to set desired initial price.

## 🔗 Important Links

- Token: https://bscscan.com/token/0x567A4F63f6838005e104C053fc24a3510b0432E1
- Contract: https://bscscan.com/address/0x567A4F63f6838005e104C053fc24a3510b0432E1
- Creator: https://bscscan.com/address/0x06DAe90659b2e436fddFA77C7Df27b03a514B568
- PinkLock: https://www.pinksale.finance/pinklock/bsc

## 📝 Frontend Integration (Already Done)

```js
// Real LDX token
const LDX = {
  address: "0x567A4F63f6838005e104C053fc24a3510b0432E1",
  symbol: "LDX",
  name: "Lidex",
  decimals: 18,
  logo: "/lidex-token-logo.jpg",
  bscscan: "https://bscscan.com/token/0x567A4F63f6838005e104C053fc24a3510b0432E1"
}
```

Your DEX at https://5173-il7fm30taoa1kpqpwj04q.e2b.app now shows real LDX!

## ⚠️ Note: Not Listed Warning

I added "Not Listed" badges because on-chain there is no LDX/BNB pair yet (no liquidity). Once you add liquidity via LidexRouter or PancakeRouter, the DEX will automatically show real price and remove the warning.

Need help deploying liquidity? I can write the deploy script!
