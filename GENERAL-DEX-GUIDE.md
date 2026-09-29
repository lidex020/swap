# 🟢 LidexSwap - General DEX (Like PancakeSwap/Uniswap)

Now **anyone can list any token** - permissionless!

## 🌟 What Changed - General DEX Mode

### Before: LDX-only DEX
- Only LDX, BNB, USDT etc hardcoded

### Now: General DEX Like PancakeSwap
- **Anyone can paste any BEP-20 address** (0x...)
- **Anyone can create any pair** by adding liquidity
- **No approval needed** - Factory.createPair() permissionless
- **Custom tokens** - Imported tokens saved locally
- **DYOR warnings** for custom tokens

## 🔧 How It Works (Same as PancakeSwap/Uniswap)

### For Traders:
1. Go to Swap
2. Click token selector
3. Search or paste any token address (e.g., your token `0x123...`)
4. If not in list → Click "Import Custom Token"
5. Swap any token for any token - works like PancakeSwap!

### For Token Creators (How to List Your Token):

**This is how your LDX token (0x567A4F63...432E1) gets listed, and how ANYONE can list theirs:**

```
Step 1: Deploy BEP-20 token on BNB Chain
  - You already did: LDX at 0x567A4F63f6838005e104C053fc24a3510b0432E1
  - Anyone else: Deploy their own token

Step 2: Go to LidexSwap → Liquidity → Add Liquidity
  - Token A: Paste your token address (e.g., 0x567A4F63...)
  - Token B: Select BNB or USDT (0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c for WBNB)

Step 3: Enter amounts
  - Example: 100,000 LDX + 1 BNB
  - This sets initial price: 1 LDX = 0.00001 BNB = ~$0.00716
  - With 500M supply, market cap = ~$3.58M

Step 4: Click "Create Pair & Add Liquidity"
  - Behind the scenes:
    LidexFactory.createPair(LDX, WBNB) -> creates pair
    LidexPair.mint() -> mints LP tokens to you
  - Pair created automatically!

Step 5: Done!
  - Your token is now tradable on LidexSwap
  - Anyone can swap BNB → LDX or LDX → BNB
  - Appears in token list for all users
  - Same as PancakeSwap/Uniswap - permissionless!
```

## 📁 Frontend Features Added

### Token Selector (General):
- Search by name, symbol, or address
- Paste any `0x...` address (42 chars)
- If address not in list → Shows "Import custom token?" card
- Import warning: "Anyone can create fake tokens - DYOR! Verify on BscScan"
- Custom tokens saved in local state, show "CUSTOM" badge
- Remove custom tokens, clear all

### Liquidity (General):
- Select any two tokens (including custom pasted ones)
- Shows token addresses under selector
- Detects if pair exists or not:
  - Exists: "Add to existing pool"
  - Doesn't exist: "No pool found - First liquidity provider! You will create pair and set initial price"
- Button: "Create Pair & Add Liquidity - List Token" for new pairs
- Anyone can create LDX/BNB, MYTOKEN/USDT, etc.

### Banner:
- Top banner: "Permissionless - Anyone can list any BEP-20 token • No approval needed • Just add liquidity"
- Shows count of custom tokens imported

### List Token Modal:
- Dedicated modal: "List Your Token - General DEX"
- Explains 4 steps like PancakeSwap
- Input: Paste BEP-20 address
- Validates address
- Button: "Import & List Token - Add Liquidity"

## 🔗 Smart Contracts - Already General

Your contracts in `/contracts/` are already general (like PancakeSwap):

```solidity
// LidexFactory - anyone can call createPair
function createPair(address tokenA, address tokenB) external returns (address pair)

// LidexRouter - anyone can add liquidity for any pair
function addLiquidity(address tokenA, address tokenB, ...) external

// LidexPair - holds any two tokens
```

So frontend now exposes this permissionless nature!

## 🪙 Your Real LDX Token

- Address: `0x567A4F63f6838005e104C053fc24a3510b0432E1`
- Still featured as native token with green logo
- But now it's **one of many** - anyone can list theirs too
- Needs liquidity to be tradable (currently no pair)

## 🚀 Try It Now:

1. Open DEX: https://5173-il7fm30taoa1kpqpwj04q.e2b.app
2. Click token selector → Paste any address like `0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c` (BTCB)
3. Import it → Now tradable
4. Go to Liquidity → Add Liquidity → Select LDX + BNB → Add 100k LDX + 1 BNB → You just listed LDX!

This is exactly how PancakeSwap/Uniswap work - general DEX!

## 📄 Files Updated

- `src/App.jsx` - General DEX with custom token import
- `src/tokenlist.json` - Includes real LDX
- `contracts/LidexFactory.sol` - General factory
- `contracts/LidexRouter.sol` - General router
- `GENERAL-DEX-GUIDE.md` - This guide

Your DEX is now a true general DEX where everyone can list from wallet by adding pairs!
