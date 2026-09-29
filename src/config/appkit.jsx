import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bsc, bscTestnet, mainnet } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'

export const projectId = 'd7719d74fdd4d2ea309eb12d6eddb430'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

const metadata = {
  name: 'LidexSwap',
  description: 'LidexSwap - General DEX Permissionless - Trade any BEP-20 at real market prices. Green DEX with LDX token 0x567A4F63f6838005e104C053fc24a3510b0432E1 - BSC Mainnet - Reown AppKit - Secure',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://lidexswap.com',
  icons: ['/logo.png', '/lidex-token-logo.png']
}

export const networks = [bsc, bscTestnet, mainnet]

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
})

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  defaultNetwork: bsc,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#22c55e',
    '--w3m-border-radius-master': '16px',
  },
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'x', 'github', 'discord', 'apple'],
    onramp: true,
  },
  allWallets: 'SHOW',
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da86ea',
  ],
})
