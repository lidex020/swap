# 🟢 LidexSwap Contracts

Green DEX smart contracts - Logo: green circular arrows on black background.

## Contracts

| Contract | File | Description |
|----------|------|-------------|
| **LidexFactory** | `LidexFactory.sol` | Creates trading pairs (CREATE2) |
| **LidexPair** | `LidexPair.sol` | LP token, holds reserves, x*y=k AMM with 0.25% fee |
| **LidexRouter** | `LidexRouter.sol` | User router - add/remove liquidity, swapExactTokensForTokens |
| **LidexMasterChef** | `LidexMasterChef.sol` | Farms - stake LP to earn LIDEX |

## Branding

- **Name:** LidexSwap
- **Symbol:** LIDEX
- **Logo:** Green circular arrows (2 arrows forming circle) - represents swap
- **Colors:** 
  - Primary green accent: `#13895c`
  - Bright green accent: `#32a875`
  - Background: `#f7f9f8`
- **Fee:** 0.25% (9975/10000) - Green sustainable fee

## Deployment (BSC Testnet)

Use the already deployed LIDEX token address when deploying MasterChef; this source folder does not include a token implementation or test-token mocks.

```bash
# Install
npm install --save-dev hardhat @openzeppelin/contracts

# Deploy order:
1. LidexFactory
2. LidexRouter (factory + WBNB address)
3. LidexMasterChef (deployed LIDEX token address + 10 LIDEX/block)
4. Create pairs: LIDEX/BNB, LIDEX/USDT
5. Add pools to MasterChef
```

## Frontend Integration

Update `src/App.jsx`:

```js
const TOKENS = [
  { symbol: 'LIDEX', address: '0xYourLidexTokenAddress', logo: '/lidex-token-logo.jpg' },
  ...
]
```

Router address in wagmi:

```js
const LIDEX_ROUTER = "0xYourRouterAddress"
```

## License

MIT - LidexSwap Green DEX
