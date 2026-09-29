# 🟢 LidexSwap - Green DEX

**Logo:** Green circular arrows (2 arrows forming a circle) on black background  
**Brand Colors:** `#22c55e` (primary green), `#4ade80` (bright), `#84cc16` (lime), `#050a06` (dark)

LidexSwap is a React/Vite DEX frontend and Solidity contract set inspired by PancakeSwap. The frontend reads live BSC balances, but trading is disabled until a deployed and reviewed router is configured.

**Live Preview:** Running on port 5173 - https://5173-il7fm30taoa1kpqpwj04q.e2b.app

![LidexSwap Logo](/public/logo.png)

## ✨ Features

### 🔄 Swap (AMM)
- Constant Product Formula (x*y=k) with 0.25% Green Fee in the contracts
- Real-time price, price impact, slippage (0.1%/0.5%/1%)
- Token selector: LIDEX (native), BNB, USDT, USDC, ETH, BTCB, WBNB, CAKE
- Live chart with green theme
- Swap UI fails closed when no deployed router is configured

### 💧 Liquidity
- View LP positions (LIDEX-BNB, LIDEX-USDT)
- Add liquidity with auto ratio
- Remove/Add

### 🌾 Earn
- Farms: Stake LP to earn LIDEX (124% APR for LIDEX-BNB)
- Pools: Stake LIDEX

### 🎨 UI - LidexSwap Green Theme
- Background `#050a06`, Cards `#111a12`, Border `#1f3a22`
- Primary green `#22c55e` with glow, lime `#84cc16`
- Kanit font, rounded 24px, logo everywhere

## 🛠️ Tech Stack
- React 18 + Vite + Tailwind
- Recharts, Lucide Icons
- Solidity contracts: LidexFactory, LidexPair, LidexRouter, LidexMasterChef

## 📁 Structure
```
/src
  App.jsx          # LidexSwap DEX - green theme
  assets/logo.png  # Green circular arrows logo
/public
  logo.png         # Logo
/contracts
  LidexFactory.sol
  LidexPair.sol
  LidexRouter.sol
  LidexMasterChef.sol # Farms
```

## 🚀 Quick Start
```bash
npm install
npm run dev   # http://localhost:5173
npm run build
```

## BSC Mainnet Contracts

The deployed contract addresses are centralized in `src/config/contracts.js`:

| Contract | Address |
|----------|---------|
| LidexRouter | `0xDF543c5BD29E3BE477DFC4eEdcB9EAac92c9b340` |
| Factory | `0x5775902D61439662Bd578D54543bb0AE3383c7Ae` |
| WBNB | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` |
| MasterChef | `0xeFf96cCD0c91804Ee8be8893fb7c90D07cC5B4E` |
| LidexSwap Pair | `0x50DA1Cfa1a7395116Bb572017008A1489E45c327` |

`VITE_LIDEX_ROUTER_ADDRESS` can optionally override the configured router for another deployment. The frontend requests an on-chain quote, asks for an exact ERC-20 allowance when needed, then submits `swapExactTokensForTokens` with the selected slippage limit and a 20-minute deadline. Swaps use direct pairs only. The router accepts ERC-20 tokens, so use WBNB rather than native BNB; native wrapping is not implemented in the frontend.

## 🔧 Contracts Deployment

```bash
# BSC Testnet (development only)
1. Deploy LidexFactory
2. Deploy LidexRouter (factory + WBNB)
3. Deploy LidexMasterChef (existing LIDEX token address + emission rate)
4. Create pairs & add to farms
```

See `/contracts/README.md` for details.

## 📄 License
MIT - LidexSwap Green DEX
