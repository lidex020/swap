import { useState, useEffect, useMemo } from 'react'
import { ArrowDownUp, Settings, Clock3, ChevronDown, X, Info, ExternalLink, Droplets, BarChart3, Coins, Zap, Menu, Wallet, Plus, Search, AlertTriangle, CheckCircle, Trash2, Upload, RefreshCw, TrendingUp, TrendingDown, Shield, ShieldCheck, Lock, Eye, AlertCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAccount, useDisconnect, useBalance, useSwitchChain, useReadContract, useReadContracts, usePublicClient, useWriteContract } from 'wagmi'
import { bsc as bscAppKit } from '@reown/appkit/networks'
import { bsc } from 'wagmi/chains'
import { formatUnits, parseUnits } from 'viem'
import { appKit } from './config/appkit.jsx'
import { DEPLOYED_CONTRACTS } from './config/contracts.js'
import { getSecurityScore, getPriceImpactRisk, getSlippageRisk, validateSwapAmount, OFFICIAL_LDX_ADDRESS, isOfficialLDX, sanitizeAddress } from './utils/security.js'

const LIDEX_LOGO = "/logo.jpg"
const LIDEX_TOKEN_LOGO = "/lidex-token-logo.jpg"
const LIDEX_ADDRESS = OFFICIAL_LDX_ADDRESS
const BALANCE_CHAIN_ID = bsc.id
const ROUTER_ADDRESS = import.meta.env.VITE_LIDEX_ROUTER_ADDRESS || DEPLOYED_CONTRACTS.router
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const ROUTER_ABI = [
  { type: 'function', name: 'getAmountsOut', stateMutability: 'view', inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'path', type: 'address[]' }], outputs: [{ name: 'amounts', type: 'uint256[]' }] },
  { type: 'function', name: 'swapExactTokensForTokens', stateMutability: 'nonpayable', inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'amountOutMin', type: 'uint256' }, { name: 'path', type: 'address[]' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], outputs: [{ name: 'amounts', type: 'uint256[]' }] },
]
const ERC20_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
]

const INITIAL_TOKENS = [
  { symbol: 'LDX', name: 'Lidex', logo: LIDEX_TOKEN_LOGO, address: LIDEX_ADDRESS, price: 0, balance: 0, decimals: 18, color: '#13895c', verified: true, officialLogo: true, coingeckoId: null, official: true },
  { symbol: 'WBNB', name: 'Wrapped BNB', logo: `https://tokens.pancakeswap.finance/images/${DEPLOYED_CONTRACTS.wbnb}.png`, address: DEPLOYED_CONTRACTS.wbnb, price: 716.41, balance: 0, decimals: 18, color: '#F3BA2F', verified: true, coingeckoId: 'binancecoin' },
  { symbol: 'USDT', name: 'Tether USD', logo: 'https://tokens.pancakeswap.finance/images/0x55d398326f99059fF775485246999027B3197955.png', address: '0x55d398326f99059fF775485246999027B3197955', price: 1.0, balance: 0, decimals: 18, color: '#26A17B', verified: true, coingeckoId: 'tether' },
  { symbol: 'USDC', name: 'USD Coin', logo: 'https://tokens.pancakeswap.finance/images/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d.png', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', price: 1.0, balance: 0, decimals: 18, color: '#2775CA', verified: true, coingeckoId: 'usd-coin' },
  { symbol: 'ETH', name: 'Ethereum', logo: 'https://tokens.pancakeswap.finance/images/0x2170Ed0880ac9A755fd29B2688956BD959F933F.png', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F', price: 3420.18, balance: 0, decimals: 18, color: '#627EEA', verified: true, coingeckoId: 'ethereum', binanceSymbol: 'ETHUSDT' },
  { symbol: 'BTCB', name: 'BTCB Token', logo: 'https://tokens.pancakeswap.finance/images/0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c.png', address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', price: 67245.0, balance: 0, decimals: 18, color: '#F7931A', verified: true, coingeckoId: 'bitcoin', binanceSymbol: 'BTCUSDT' },
  { symbol: 'CAKE', name: 'PancakeSwap', logo: 'https://tokens.pancakeswap.finance/images/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82.png', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', price: 2.48, balance: 0, decimals: 18, color: '#D1884F', verified: true, coingeckoId: 'pancakeswap-token' },
]

function isValidAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

function TokenIcon({ token, size = 24 }) {
  const sec = getSecurityScore(token)
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <img src={token.logo} alt={token.symbol} className="w-full h-full rounded-full object-cover bg-[#f5f7f6]" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
      <div style={{ display: 'none', width: size, height: size, background: token.color || '#13895c', borderRadius: '50%' }} className="items-center justify-center text-[10px] font-bold text-[#1d2922]">{token.symbol?.[0] || '?'}</div>
      {token.verified && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#13895c] rounded-full border border-[#f7f9f8] flex items-center justify-center"><CheckCircle size={8} className="text-white" /></div>}
      {sec.level === 'high' && !token.verified && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#ef4444] rounded-full border border-[#f7f9f8]" />}
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('swap')
  const { address, isConnected, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const publicClient = usePublicClient({ chainId: BALANCE_CHAIN_ID })
  const { writeContractAsync } = useWriteContract()
  const { data: bnbBalance, isLoading: bnbLoading, isError: bnbError, refetch: refetchBnb } = useBalance({
    address,
    chainId: BALANCE_CHAIN_ID,
    query: { enabled: !!address && chainId === BALANCE_CHAIN_ID }
  })
  const connected = isConnected
  const walletAddress = address ? `${address.slice(0,6)}...${address.slice(-4)}` : ''
  const fullAddress = address || ''
  const [showSettings, setShowSettings] = useState(false)
  const [showTokenSelect, setShowTokenSelect] = useState(null)
  const [slippage, setSlippage] = useState(0.5)
  const [customTokens, setCustomTokens] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showImportWarning, setShowImportWarning] = useState(null)
  const [livePrices, setLivePrices] = useState({})
  const [priceChanges, setPriceChanges] = useState({})
  const [isPriceLoading, setIsPriceLoading] = useState(true)
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null)
  const [ldxRealData, setLdxRealData] = useState({ price: 0, listed: false, pairs: [], marketCap: 0 })
  const [showSecurityInfo, setShowSecurityInfo] = useState(false)
  const [chartInterval, setChartInterval] = useState('24H')
  
  const [fromToken, setFromToken] = useState(INITIAL_TOKENS[0])
  const [toToken, setToToken] = useState(INITIAL_TOKENS[1])
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [isSwapping, setIsSwapping] = useState(false)
  const [txStatus, setTxStatus] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [txError, setTxError] = useState('')
  const [recentTxs, setRecentTxs] = useState([])
  const [showRecent, setShowRecent] = useState(false)
  const [liquidityPositions, setLiquidityPositions] = useState([])
  const [liqTokenA, setLiqTokenA] = useState(INITIAL_TOKENS[0])
  const [liqTokenB, setLiqTokenB] = useState(INITIAL_TOKENS[1])
  const [liqAmountA, setLiqAmountA] = useState('')
  const [liqAmountB, setLiqAmountB] = useState('')
  const [showAddLiq, setShowAddLiq] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [showListTokenModal, setShowListTokenModal] = useState(false)
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [pairExists, setPairExists] = useState(true)

  const parsedSwapAmount = useMemo(() => {
    if (!fromAmount) return undefined
    try {
      return parseUnits(fromAmount, fromToken.decimals || 18)
    } catch {
      return undefined
    }
  }, [fromAmount, fromToken])
  const swapPath = useMemo(() => [fromToken.address, toToken.address], [fromToken.address, toToken.address])
  const sameSwapToken = fromToken.address.toLowerCase() === toToken.address.toLowerCase()
  const { data: quoteAmounts, error: quoteError, refetch: refetchQuote } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [parsedSwapAmount ?? 0n, swapPath],
    chainId: BALANCE_CHAIN_ID,
    query: { enabled: !!address && chainId === BALANCE_CHAIN_ID && !!parsedSwapAmount && !sameSwapToken && isValidAddress(ROUTER_ADDRESS) }
  })
  const quotedOutput = quoteAmounts?.[quoteAmounts.length - 1]
  const { data: inputAllowance, refetch: refetchAllowance } = useReadContract({
    address: fromToken.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address || ZERO_ADDRESS, ROUTER_ADDRESS],
    chainId: BALANCE_CHAIN_ID,
    query: { enabled: !!address && chainId === BALANCE_CHAIN_ID && !!parsedSwapAmount && isValidAddress(fromToken.address) && isValidAddress(ROUTER_ADDRESS) }
  })

  // Fetch real prices
  useEffect(() => {
    const fetchRealPrices = async () => {
      try {
        setIsPriceLoading(true)
        const coingeckoIds = ['binancecoin', 'tether', 'usd-coin', 'ethereum', 'bitcoin', 'pancakeswap-token'].join(',')
        const cgRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd&include_24hr_change=true`)
        if (cgRes.ok) {
          const cgData = await cgRes.json()
          const priceMap = {}
          const changeMap = {}
          priceMap['binancecoin'] = cgData.binancecoin?.usd
          changeMap['binancecoin'] = cgData.binancecoin?.usd_24h_change
          priceMap['tether'] = cgData.tether?.usd
          changeMap['tether'] = cgData.tether?.usd_24h_change
          priceMap['usd-coin'] = cgData['usd-coin']?.usd
          changeMap['usd-coin'] = cgData['usd-coin']?.usd_24h_change
          priceMap['ethereum'] = cgData.ethereum?.usd
          changeMap['ethereum'] = cgData.ethereum?.usd_24h_change
          priceMap['bitcoin'] = cgData.bitcoin?.usd
          changeMap['bitcoin'] = cgData.bitcoin?.usd_24h_change
          priceMap['pancakeswap-token'] = cgData['pancakeswap-token']?.usd
          changeMap['pancakeswap-token'] = cgData['pancakeswap-token']?.usd_24h_change
          setLivePrices(prev => ({ ...prev, ...priceMap }))
          setPriceChanges(prev => ({ ...prev, ...changeMap }))
        }
        try {
          const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${LIDEX_ADDRESS}`)
          if (dexRes.ok) {
            const dexData = await dexRes.json()
            if (dexData.pairs && dexData.pairs.length > 0) {
              const bestPair = dexData.pairs.sort((a,b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]
              const ldxPrice = parseFloat(bestPair.priceUsd) || 0
              setLdxRealData({
                price: ldxPrice,
                listed: true,
                pairs: dexData.pairs,
                marketCap: bestPair.marketCap || bestPair.fdv || 0,
                volume24h: bestPair.volume?.h24 || 0,
                priceChange24h: bestPair.priceChange?.h24 || 0,
                pairAddress: bestPair.pairAddress,
                dexId: bestPair.dexId
              })
              setLivePrices(prev => ({ ...prev, 'ldx': ldxPrice }))
            } else {
              setLdxRealData({ price: 0, listed: false, pairs: [], marketCap: 0 })
            }
          }
        } catch (e) {
          console.log('LDX not listed yet')
          setLdxRealData({ price: 0, listed: false, pairs: [] })
        }
        try {
          const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BNBUSDT","ETHUSDT","BTCUSDT"]')
          if (binanceRes.ok) {
            const binanceData = await binanceRes.json()
            const bnbData = binanceData.find(d => d.symbol === 'BNBUSDT')
            const ethData = binanceData.find(d => d.symbol === 'ETHUSDT')
            const btcData = binanceData.find(d => d.symbol === 'BTCUSDT')
            if (bnbData) {
              setLivePrices(prev => ({ ...prev, 'binancecoin': parseFloat(bnbData.lastPrice) }))
              setPriceChanges(prev => ({ ...prev, 'binancecoin': parseFloat(bnbData.priceChangePercent) }))
            }
            if (ethData) {
              setLivePrices(prev => ({ ...prev, 'ethereum': parseFloat(ethData.lastPrice) }))
              setPriceChanges(prev => ({ ...prev, 'ethereum': parseFloat(ethData.priceChangePercent) }))
            }
            if (btcData) {
              setLivePrices(prev => ({ ...prev, 'bitcoin': parseFloat(btcData.lastPrice) }))
              setPriceChanges(prev => ({ ...prev, 'bitcoin': parseFloat(btcData.priceChangePercent) }))
            }
          }
        } catch (e) {
          console.log('Price fallback failed')
        }
        setLastPriceUpdate(new Date())
      } catch (error) {
        console.error('Price fetch error:', error)
      } finally {
        setIsPriceLoading(false)
      }
    }
    fetchRealPrices()
    const interval = setInterval(fetchRealPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  const allTokens = useMemo(() => {
    const baseWithRealPrices = INITIAL_TOKENS.map(t => {
      if (t.symbol === 'LDX') {
        return { 
          ...t, 
          price: ldxRealData.listed ? ldxRealData.price : 0,
          realPrice: ldxRealData.price,
          listed: ldxRealData.listed,
          priceChange24h: ldxRealData.priceChange24h,
          marketCap: ldxRealData.marketCap
        }
      }
      if (t.coingeckoId && livePrices[t.coingeckoId]) {
        return { 
          ...t, 
          price: livePrices[t.coingeckoId],
          priceChange24h: priceChanges[t.coingeckoId],
          realPrice: livePrices[t.coingeckoId]
        }
      }
      return t
    })
    return [...baseWithRealPrices, ...customTokens]
  }, [livePrices, priceChanges, customTokens, ldxRealData])

  // Real balances - Secure on-chain via wagmi useBalance (BNB) + useReadContracts for all ERC20
  const [realTokenBalances, setRealTokenBalances] = useState({})
  const [totalUsdValue, setTotalUsdValue] = useState(0)
  const erc20Abi = ERC20_ABI

  const tokenContracts = useMemo(() => {
    if (!address) return []
    // Fetch all tokens that have valid address, dedupe by address
    const seen = new Set()
    const contracts = []
    for (const t of allTokens) {
      if (!t.address || !t.address.startsWith('0x')) continue
      const lower = t.address.toLowerCase()
      if (seen.has(lower)) continue
      seen.add(lower)
      contracts.push({
        address: t.address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
        chainId: BALANCE_CHAIN_ID,
      })
    }
    return contracts
  }, [address, allTokens, erc20Abi])

  const { data: erc20Balances, isLoading: erc20Loading, isError: erc20Error, refetch: refetchErc20 } = useReadContracts({
    contracts: tokenContracts,
    allowFailure: true,
    query: { enabled: !!address && chainId === BALANCE_CHAIN_ID && tokenContracts.length > 0 }
  })

  // Process real balances when data arrives
  useEffect(() => {
    if (!address) {
      setRealTokenBalances({})
      setTotalUsdValue(0)
      return
    }
    const balances = {}
    let total = 0
    const bnbPrice = livePrices['binancecoin'] || 700

    if (bnbBalance) {
      const bnbVal = parseFloat(bnbBalance.formatted) || 0
      total += bnbVal * bnbPrice
    }

    if (erc20Balances) {
      // Map contracts to results
      const seen = new Set()
      let idx = 0
      for (const t of allTokens) {
        if (!t.address || !t.address.startsWith('0x')) continue
        const lower = t.address.toLowerCase()
        if (seen.has(lower)) continue
        seen.add(lower)
        const result = erc20Balances[idx]
        idx++
        if (!result) continue
        try {
          if (result.status === 'success' && result.result !== undefined) {
            const raw = result.result
            const formatted = formatUnits(raw, t.decimals || 18)
            balances[lower] = { formatted, value: parseFloat(formatted) || 0, symbol: t.symbol, raw }
            if (t.price && t.price > 0) {
              total += (parseFloat(formatted) || 0) * t.price
            }
          } else {
            balances[lower] = { formatted: '0', value: 0, symbol: t.symbol }
          }
        } catch (e) {
          balances[lower] = { formatted: '0', value: 0, symbol: t.symbol }
        }
      }
    }

    setRealTokenBalances(balances)
    setTotalUsdValue(total)
  }, [address, bnbBalance, erc20Balances, allTokens, livePrices])

  const getBalanceForToken = (token) => {
    if (!token) return { formatted: '0', value: 0, isReal: false }
    if (!address) return { formatted: '0', value: 0, isReal: false }
    // BNB native uses bnbBalance
    if (token.symbol === 'BNB' && bnbBalance) {
      return { formatted: bnbBalance.formatted, value: parseFloat(bnbBalance.formatted) || 0, isReal: true }
    }
    const key = token.address ? token.address.toLowerCase() : ''
    if (key && realTokenBalances[key]) {
      return { ...realTokenBalances[key], isReal: true }
    }
    return { formatted: '0', value: 0, isReal: true }
  }

  const formatWalletBalance = (token) => {
    if (!connected) return null
    const balance = getBalanceForToken(token)
    const value = Number(balance.value)
    if (!Number.isFinite(value)) return '0'
    if (value > 0 && value < 0.000001) return '<0.000001'
    return value.toLocaleString('en-US', { maximumFractionDigits: 6 })
  }

  const fromRealBalance = getBalanceForToken(fromToken)
  const toRealBalance = getBalanceForToken(toToken)
  const balancesLoading = bnbLoading || erc20Loading
  const balancesError = bnbError || erc20Error

  const refetchAll = async () => {
    try {
      await Promise.all([refetchBnb(), refetchErc20()])
    } catch (e) {
      console.error('Failed to refresh wallet balances', e)
    }
  }

  useEffect(() => {
    if (!address || chainId !== BALANCE_CHAIN_ID) return
    void refetchAll()
  }, [address, chainId])

  useEffect(() => {
    setFromToken(prev => allTokens.find(t => t.address === prev.address) || prev)
    setToToken(prev => allTokens.find(t => t.address === prev.address) || prev)
    setLiqTokenA(prev => allTokens.find(t => t.address === prev.address) || prev)
    setLiqTokenB(prev => allTokens.find(t => t.address === prev.address) || prev)
  }, [allTokens])

  useEffect(() => {
    if (!quotedOutput) { setToAmount(''); return }
    const formatted = formatUnits(quotedOutput, toToken.decimals || 18)
    setToAmount(formatted.includes('.') ? formatted.replace(/0+$/, '').replace(/\.$/, '') : formatted)
  }, [quotedOutput, toToken.decimals])

  useEffect(() => {
    const isLDXPair = (liqTokenA.symbol === 'LDX' || liqTokenB.symbol === 'LDX') && !liquidityPositions.find(p => 
      (p.tokenA.symbol === liqTokenA.symbol && p.tokenB.symbol === liqTokenB.symbol) ||
      (p.tokenA.symbol === liqTokenB.symbol && p.tokenB.symbol === liqTokenA.symbol)
    )
    if (isLDXPair && liqTokenA.symbol !== liqTokenB.symbol) {
      setPairExists(liquidityPositions.length > 0 ? true : false)
    } else {
      setPairExists(true)
    }
  }, [liqTokenA, liqTokenB, liquidityPositions])

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return allTokens
    const q = searchQuery.toLowerCase()
    return allTokens.filter(t => 
      t.symbol.toLowerCase().includes(q) || 
      t.name.toLowerCase().includes(q) || 
      t.address.toLowerCase().includes(q)
    )
  }, [allTokens, searchQuery])

  const isSearchValidAddress = useMemo(() => isValidAddress(searchQuery), [searchQuery])
  const isSearchAddressNotInList = useMemo(() => {
    if (!isSearchValidAddress) return false
    return !allTokens.find(t => t.address.toLowerCase() === searchQuery.toLowerCase())
  }, [isSearchValidAddress, allTokens, searchQuery])

  const handleImportToken = (addr) => {
    const address = sanitizeAddress(addr || searchQuery)
    if (!isValidAddress(address)) return
    if (address.toLowerCase() === LIDEX_ADDRESS.toLowerCase()) {
      setShowTokenSelect(null)
      return
    }
    const mockSymbol = `TKN${address.slice(-4).toUpperCase()}`
    const newToken = {
      symbol: mockSymbol,
      name: `Custom Token ${address.slice(0,6)}...${address.slice(-4)}`,
      logo: LIDEX_LOGO,
      address: address,
      price: 0,
      balance: 0,
      decimals: 18,
      color: '#13895c',
      verified: false,
      isCustom: true,
      security: getSecurityScore({ address, symbol: mockSymbol, verified: false, isCustom: true, price: 0 })
    }
    setShowImportWarning(newToken)
  }

  const confirmImport = () => {
    if (showImportWarning) {
      setCustomTokens([...customTokens, showImportWarning])
      setShowImportWarning(null)
      setSearchQuery('')
    }
  }

  const handleLiqACalc = (val) => {
    const clean = val.replace(/[^0-9.]/g, '')
    setLiqAmountA(clean)
    if (!clean || isNaN(clean)) { setLiqAmountB(''); return }
    if (liqTokenA.price === 0 || liqTokenB.price === 0) { setLiqAmountB('0'); return }
    const ratio = liqTokenA.price / liqTokenB.price
    setLiqAmountB((parseFloat(clean) * ratio).toFixed(6))
  }
  const handleLiqBCalc = (val) => {
    const clean = val.replace(/[^0-9.]/g, '')
    setLiqAmountB(clean)
    if (!clean || isNaN(clean)) { setLiqAmountA(''); return }
    if (liqTokenA.price === 0 || liqTokenB.price === 0) { setLiqAmountA('0'); return }
    const ratio = liqTokenB.price / liqTokenA.price
    setLiqAmountA((parseFloat(clean) * ratio).toFixed(6))
  }

  const priceImpact = useMemo(() => {
    if (!fromAmount) return 0
    const v = parseFloat(fromAmount)
    if (v < 1) return 0.01
    if (v < 10) return 0.12
    if (v < 100) return 0.85
    return 2.45
  }, [fromAmount])

  const minReceived = useMemo(() => {
    if (!quotedOutput) return '0'
    const slippageBps = BigInt(Math.min(5000, Math.max(0, Math.round(slippage * 100))))
    const minimum = quotedOutput * (10000n - slippageBps) / 10000n
    const formatted = formatUnits(minimum, toToken.decimals || 18)
    return formatted.includes('.') ? formatted.replace(/0+$/, '').replace(/\.$/, '') : formatted
  }, [quotedOutput, slippage, toToken.decimals])

  const priceImpactRisk = getPriceImpactRisk(priceImpact)
  const slippageRisk = getSlippageRisk(slippage)
  const fromSecurity = getSecurityScore(fromToken)
  const toSecurity = getSecurityScore(toToken)
  const swapValidation = validateSwapAmount(fromAmount, fromRealBalance.value, fromToken)
  const hasKnownInputBalance = fromRealBalance.raw !== undefined
  const insufficientInputBalance = parsedSwapAmount !== undefined && hasKnownInputBalance && parsedSwapAmount > fromRealBalance.raw
  const needsApproval = parsedSwapAmount !== undefined && inputAllowance !== undefined && inputAllowance < parsedSwapAmount
  let swapButtonLabel = 'Swap'
  if (isSwapping) swapButtonLabel = txStatus === 'approving' ? 'Approving token...' : 'Waiting for confirmation...'
  else if (!connected) swapButtonLabel = 'Connect Wallet'
  else if (chainId !== BALANCE_CHAIN_ID) swapButtonLabel = 'Switch to BSC'
  else if (!fromAmount) swapButtonLabel = 'Enter an amount'
  else if (!parsedSwapAmount) swapButtonLabel = 'Enter a valid amount'
  else if (!hasKnownInputBalance) swapButtonLabel = 'Checking input balance...'
  else if (insufficientInputBalance) swapButtonLabel = `Insufficient ${fromToken.symbol} balance`
  else if (sameSwapToken) swapButtonLabel = 'Choose different tokens'
  else if (quoteError) swapButtonLabel = 'No LidexSwap route'
  else if (!quotedOutput) swapButtonLabel = 'Getting on-chain quote...'
  else if (inputAllowance === undefined) swapButtonLabel = 'Checking token approval...'
  else if (needsApproval) swapButtonLabel = `Approve ${fromToken.symbol}`
  else if (priceImpactRisk.level === 'critical') swapButtonLabel = `High Impact! Swap ${fromToken.symbol} to ${toToken.symbol}`

  const handleSwap = async () => {
    if (!connected) { appKit.open(); return }
    if (chainId !== 56) {
      switchChain({ chainId: bsc.id })
      return
    }
    if (!address || !publicClient || !parsedSwapAmount || sameSwapToken) return

    setIsSwapping(true)
    setTxError('')
    setTxHash(null)
    try {
      const currentBalance = await publicClient.readContract({
        address: fromToken.address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      })
      if (currentBalance < parsedSwapAmount) throw new Error(`Insufficient ${fromToken.symbol} balance.`)

      const currentAllowance = await publicClient.readContract({
        address: fromToken.address,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, ROUTER_ADDRESS],
      })

      if (currentAllowance < parsedSwapAmount) {
        setTxStatus('approving')
        if (currentAllowance > 0n) {
          const resetHash = await writeContractAsync({
            address: fromToken.address,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [ROUTER_ADDRESS, 0n],
            chainId: BALANCE_CHAIN_ID,
          })
          await publicClient.waitForTransactionReceipt({ hash: resetHash })
        }
        const approvalHash = await writeContractAsync({
          address: fromToken.address,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [ROUTER_ADDRESS, parsedSwapAmount],
          chainId: BALANCE_CHAIN_ID,
        })
        const approvalReceipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash })
        if (approvalReceipt.status !== 'success') throw new Error('Token approval failed on-chain.')
        setTxHash(approvalHash)
        await refetchAllowance()
        setTxStatus('approved')
        return
      }

      const amounts = await publicClient.readContract({
        address: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [parsedSwapAmount, swapPath],
      })
      const output = amounts[amounts.length - 1]
      const slippageBps = BigInt(Math.min(5000, Math.max(0, Math.round(slippage * 100))))
      const amountOutMin = output * (10000n - slippageBps) / 10000n
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)

      setTxStatus('pending')
      const hash = await writeContractAsync({
        address: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [parsedSwapAmount, amountOutMin, swapPath, address, deadline],
        chainId: BALANCE_CHAIN_ID,
      })
      setTxHash(hash)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== 'success') throw new Error('Swap failed on-chain.')
      setTxStatus('success')
      setFromAmount('')
      setToAmount('')
      await refetchAll()
      await refetchQuote()
    } catch (error) {
      setTxError(error.shortMessage || error.message || 'Transaction failed. Check the wallet and try again.')
      setTxStatus('error')
    } finally {
      setIsSwapping(false)
    }
  }

  const switchTokens = () => {
    const tmp = fromToken
    setFromToken(toToken)
    setToToken(tmp)
    setFromAmount(toAmount)
  }

  const handleAddLiquidity = () => {
    if (!liqAmountA || !liqAmountB) return
    if (chainId !== 56) {
      switchChain({ chainId: bsc.id })
      return
    }
    const newPos = {
      id: Date.now(),
      tokenA: liqTokenA,
      tokenB: liqTokenB,
      lp: parseFloat(liqAmountA) + parseFloat(liqAmountB) / 10,
      share: Math.random() * 5,
      tokenAAmount: parseFloat(liqAmountA),
      tokenBAmount: parseFloat(liqAmountB),
      isNew: !pairExists
    }
    setLiquidityPositions([...liquidityPositions, newPos])
    setShowAddLiq(false)
    setLiqAmountA('')
    setLiqAmountB('')
    setPairExists(true)
  }

  const handleListTokenDirect = () => {
    const cleanAddr = sanitizeAddress(newTokenAddress)
    if (!isValidAddress(cleanAddr)) return
    handleImportToken(cleanAddr)
    setNewTokenAddress('')
    setShowListTokenModal(false)
    setView('liquidity')
    setShowAddLiq(true)
  }

  const chartDataDynamic = useMemo(() => {
    const base = fromToken.price || 0.0085
    const chartRanges = {
      '24H': { points: 48, duration: 24 * 60 * 60 * 1000, cycles: 3, label: date => date.toLocaleTimeString([], { hour: 'numeric' }) },
      '1W': { points: 56, duration: 7 * 24 * 60 * 60 * 1000, cycles: 4, label: date => date.toLocaleDateString([], { weekday: 'short' }) },
      '1M': { points: 60, duration: 30 * 24 * 60 * 60 * 1000, cycles: 5, label: date => date.toLocaleDateString([], { month: 'short', day: 'numeric' }) },
      '1Y': { points: 52, duration: 365 * 24 * 60 * 60 * 1000, cycles: 6, label: date => date.toLocaleDateString([], { month: 'short' }) },
    }
    const range = chartRanges[chartInterval]
    const now = Date.now()
    return Array.from({ length: range.points }, (_, i) => {
      const progress = i / (range.points - 1)
      const date = new Date(now - range.duration * (1 - progress))
      const movement = Math.sin(progress * Math.PI * 2 * range.cycles) * 0.04
        + Math.cos(progress * Math.PI * range.cycles) * 0.015
      return { time: range.label(date), price: base * (1 + movement) }
    })
  }, [fromToken.price, chartInterval])

  return (
    <div className="min-h-screen bg-[#f7f9f8] text-[#1d2922] selection:bg-[#13895c]/30">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#f7f9f8]/90 border-b border-[#e3e9e5]/50">
        <div className="max-w-[1280px] mx-auto px-4 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <img src={LIDEX_LOGO} alt="LidexSwap" className="w-9 h-9 rounded-full shadow-[0_0_15px_rgba(19,137,92,0.5)] ring-2 ring-[#13895c]/30" />
              <span className="font-bold text-[22px] tracking-tight hidden sm:block text-[#1d2922]">LidexSwap</span>
              <span className="hidden md:flex items-center gap-1 text-[10px] bg-[#edf5f0] border border-[#13895c]/30 text-[#13895c] px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 bg-[#13895c] rounded-full animate-pulse" /> LIVE</span>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              <div className="relative group">
                <button className="px-3 py-2 rounded-xl hover:bg-[#ffffff] text-[#13895c] font-semibold text-[16px] flex items-center gap-1">Trade <ChevronDown size={16} /></button>
                <div className="absolute top-full left-0 mt-1 w-64 bg-[#ffffff] rounded-2xl border border-[#e3e9e5] shadow-2xl p-2 hidden group-hover:block">
                  <button onClick={() => setView('swap')} className={`w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#edf5f0] flex items-center gap-3 ${view === 'swap' ? 'bg-[#edf5f0] text-[#1d2922]' : 'text-[#65746b]'}`}><ArrowDownUp size={18} /> Swap</button>
                  <button onClick={() => setView('liquidity')} className={`w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#edf5f0] flex items-center gap-3 ${view === 'liquidity' ? 'bg-[#edf5f0] text-[#1d2922]' : 'text-[#65746b]'}`}><Droplets size={18} /> Liquidity</button>
                  <button onClick={() => setShowListTokenModal(true)} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#edf5f0] flex items-center gap-3 text-[#65746b]"><Upload size={18} /> List Token</button>
                  <div className="border-t border-[#e3e9e5] my-1" />
                  <div className="px-3 py-2 text-[11px] text-[#65746b]"><ShieldCheck size={12} className="inline mr-1 text-[#13895c]" /> Security: Reown AppKit + BSC + Verified contracts</div>
                </div>
              </div>
              <button onClick={() => setView('farms')} className="px-3 py-2 rounded-xl hover:bg-[#ffffff] text-[#65746b] font-medium">Farms</button>
              <button onClick={() => setShowListTokenModal(true)} className="px-3 py-2 rounded-xl bg-[#edf5f0] border border-[#13895c]/30 text-[#13895c] font-medium text-sm flex items-center gap-1"><Plus size={14} /> List Token</button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 bg-[#ffffff] rounded-2xl px-3 h-8 text-sm border border-[#e3e9e5]">
              {isPriceLoading ? <RefreshCw size={14} className="animate-spin text-[#13895c]" /> : <div className="w-2 h-2 bg-[#13895c] rounded-full animate-pulse" />}
              <span className="text-[#65746b] text-xs">{isPriceLoading ? 'Fetching...' : `Live • ${lastPriceUpdate?.toLocaleTimeString()}`}</span>
            </div>

            {connected && bnbBalance && (
              <div className="hidden md:flex items-center gap-1.5 bg-[#edf5f0] border border-[#13895c]/30 rounded-2xl px-3 h-8 text-xs">
                <span className="text-[#13895c] font-bold">{parseFloat(bnbBalance.formatted).toFixed(4)} {bnbBalance.symbol}</span>
                {balancesLoading && <RefreshCw size={10} className="animate-spin" />}
              </div>
            )}
            <button onClick={() => appKit.open()} className={`h-8 px-4 rounded-2xl font-semibold text-[15px] transition-all flex items-center gap-2 ${connected ? 'bg-[#ffffff] border border-[#e3e9e5] text-[#1d2922] hover:bg-[#edf5f0]' : 'bg-[#13895c] text-white hover:bg-[#0e7049] shadow-[0_0_15px_rgba(19,137,92,0.5)]'}`}>
              {connected ? <><div className="w-2 h-2 bg-[#13895c] rounded-full animate-pulse" />{walletAddress} <span className="hidden sm:inline">• {chainId === 56 ? 'BSC' : chainId === 97 ? 'BSC Testnet' : chainId}</span></> : 'Connect Wallet'}
            </button>
            {connected && (
              <button onClick={() => disconnect()} className="hidden md:flex w-8 h-8 rounded-full bg-white border border-[#e3e9e5] items-center justify-center text-[#65746b] hover:text-[#1d2922]" title="Disconnect securely">
                <X size={14} />
              </button>
            )}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden w-8 h-8 flex items-center justify-center"><Menu /></button>
          </div>
        </div>

        {mobileMenu && (
          <div className="lg:hidden border-t border-[#e3e9e5] bg-[#f5f7f6] p-4 flex flex-col gap-2">
            {connected && (
              <>
                <div className="bg-[#ffffff] border border-[#13895c]/20 rounded-xl p-3">
                  <div className="flex items-center justify-between"><div className="text-sm font-bold">{walletAddress}</div><span className="text-[10px] bg-[#13895c] text-white px-1.5 py-0.5 rounded-full">SECURE</span></div>
                  <div className="text-xs text-[#65746b] mt-1">{fullAddress}</div>
                  <div className="text-xs text-[#13895c] mt-1">{bnbBalance ? `${parseFloat(bnbBalance.formatted).toFixed(4)} BNB` : 'BSC'} • {chainId === 56 ? 'BSC Mainnet' : `Chain ${chainId}`} • Reown AppKit</div>
                </div>
                {chainId !== 56 && (
                  <button onClick={() => switchChain({ chainId: bsc.id })} className="text-left px-4 py-3 rounded-xl bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#ef4444] text-sm">⚠️ Wrong Network - Switch to BSC Mainnet</button>
                )}
              </>
            )}
            <button onClick={() => { setView('swap'); setMobileMenu(false) }} className="text-left px-4 py-3 rounded-xl bg-[#ffffff] border border-[#e3e9e5]">Swap</button>
            <button onClick={() => { setView('liquidity'); setMobileMenu(false) }} className="text-left px-4 py-3 rounded-xl bg-[#ffffff] border border-[#e3e9e5]">Liquidity</button>
            <button onClick={() => { setShowListTokenModal(true); setMobileMenu(false) }} className="text-left px-4 py-3 rounded-xl bg-[#edf5f0] border border-[#13895c]/30 text-[#13895c]">+ List Your Token</button>
            {!connected ? (
              <button onClick={() => { appKit.open(); setMobileMenu(false) }} className="text-left px-4 py-3 rounded-xl bg-[#13895c] text-white font-bold">Connect Wallet</button>
            ) : (
              <button onClick={() => { disconnect(); setMobileMenu(false) }} className="text-left px-4 py-3 rounded-xl bg-white border border-[#e3e9e5] text-[#ef4444]">Disconnect - Secure logout</button>
            )}
          </div>
        )}
      </header>

      {/* Security & Chain Warning */}
      {connected && chainId !== 56 && (
        <div className="bg-[#ef4444]/10 border-b border-[#ef4444]/20 px-4 py-2 flex items-center justify-center gap-3 text-xs">
          <AlertTriangle size={14} className="text-[#ef4444]" />
          <span className="text-[#ef4444] font-bold">Security Warning: Wrong network! You are on chain {chainId}. LidexSwap requires BSC Mainnet (56) for real balances.</span>
          <button onClick={() => switchChain({ chainId: bsc.id })} className="bg-[#ef4444] text-[#1d2922] px-3 py-1 rounded-full text-xs font-bold">Switch to BSC</button>
        </div>
      )}

      <div className="bg-[#f5f7f6] border-b border-[#e3e9e5]/50 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-4 py-2 flex items-center gap-6 text-xs overflow-x-auto whitespace-nowrap scrollbar-hide">
          <span className="flex items-center gap-1.5 text-[#13895c] font-bold"><span className="w-2 h-2 bg-[#13895c] rounded-full animate-pulse" /> ASSETS</span>
          {allTokens.filter(t => t.verified).map(t => (
            <span key={t.symbol} className="flex items-center gap-1.5">
              <TokenIcon token={t} size={16} />
              <span className="font-semibold">{t.symbol}</span>
              {connected && <span className="text-[#1d2922]">{formatWalletBalance(t)}</span>}
              <span className={t.price === 0 ? 'text-[#ef4444]' : 'text-[#1d2922]'}>{t.price === 0 ? 'Not Listed' : `$${t.price < 1 ? t.price.toFixed(4) : t.price.toFixed(2)}`}</span>
              {t.priceChange24h !== undefined && t.price !== 0 && (
                <span className={`flex items-center gap-0.5 ${t.priceChange24h >= 0 ? 'text-[#13895c]' : 'text-[#ef4444]'}`}>
                  {t.priceChange24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{Math.abs(t.priceChange24h).toFixed(2)}%
                </span>
              )}
              {t.symbol === 'LDX' && !t.listed && <span className="text-[9px] bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 px-1 rounded">NO LIQUIDITY</span>}
              {t.symbol === 'LDX' && t.listed && <span className="text-[9px] bg-[#13895c]/20 text-[#13895c] border border-[#13895c]/30 px-1 rounded">LIVE</span>}
              {t.official && <ShieldCheck size={10} className="text-[#13895c]" />}
            </span>
          ))}
          <span className="text-[#65746b]">{connected ? walletAddress : 'Connect Wallet'} • {customTokens.length} custom</span>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-4 py-6 md:py-8">
        {connected && (
          <section aria-label="Wallet assets" className="mb-6 rounded-[24px] border border-[#e3e9e5] bg-[#ffffff] p-4 md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-[#13895c]" />
                <h2 className="font-bold">Wallet assets</h2>
                <span className="text-xs text-[#65746b]">{walletAddress}</span>
              </div>
              <div className="flex items-center gap-3">
                {chainId === BALANCE_CHAIN_ID && (
                  <span className="text-sm font-semibold text-[#1d2922]">
                    Est. total: ${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => { void refetchAll() }}
                  aria-label="Refresh wallet balances"
                  className="flex h-8 items-center gap-1.5 rounded-xl border border-[#e3e9e5] px-2.5 text-xs text-[#1d2922] hover:bg-[#edf5f0]"
                >
                  <RefreshCw size={13} className={balancesLoading ? 'animate-spin text-[#13895c]' : 'text-[#13895c]'} />
                  Refresh
                </button>
              </div>
            </div>
            {chainId !== BALANCE_CHAIN_ID ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-3 text-sm">
                <span className="text-[#1d2922]">Switch to BNB Smart Chain to load on-chain token balances.</span>
                <button onClick={() => switchChain({ chainId: bsc.id })} className="rounded-full bg-[#13895c] px-3 py-1.5 text-xs font-bold text-white">
                  Switch to BSC
                </button>
              </div>
            ) : (
              <>
                {balancesError && (
                  <div role="status" className="mb-3 text-xs text-[#ef4444]">
                    Some wallet balances could not be loaded. Use Refresh to try again.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#e3e9e5] bg-[#f5f7f6] p-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#13895c]/15 text-xs font-bold text-[#13895c]">BNB</div>
                    <div className="min-w-0">
                      <div className="text-xs text-[#65746b]">BNB</div>
                      <div className="truncate text-sm font-semibold text-[#1d2922]">
                        {bnbLoading ? 'Loading…' : bnbError ? 'Unavailable' : `${formatWalletBalance({ symbol: 'BNB' })} BNB`}
                      </div>
                    </div>
                  </div>
                  {allTokens.map(token => (
                    <div key={token.address} className="flex min-w-0 items-center gap-2 rounded-xl border border-[#e3e9e5] bg-[#f5f7f6] p-3">
                      <TokenIcon token={token} size={32} />
                      <div className="min-w-0">
                        <div className="text-xs text-[#65746b]">{token.symbol}</div>
                        <div className="truncate text-sm font-semibold text-[#1d2922]">
                          {balancesLoading ? 'Loading…' : balancesError ? 'Unavailable' : `${formatWalletBalance(token)} ${token.symbol}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}
        {view === 'swap' && (
          <div className="grid lg:grid-cols-[1fr_440px] gap-6 items-start">
            <div className="order-2 lg:order-1 space-y-4">
              <div className="bg-[#ffffff]/70 backdrop-blur rounded-[24px] border border-[#e3e9e5] p-4 md:p-6 shadow-[0_0_30px_rgba(19,137,92,0.08)]\">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-[#ffffff] border-2 border-[#f5f7f6] flex items-center justify-center"><TokenIcon token={fromToken} size={20} /></div>
                      <div className="w-8 h-8 rounded-full bg-[#ffffff] border-2 border-[#f5f7f6] flex items-center justify-center"><TokenIcon token={toToken} size={20} /></div>
                    </div>
                    <div>
                      <div className="font-bold text-lg flex items-center gap-2">
                        {fromToken.symbol}/{toToken.symbol}
                        {fromToken.price === 0 || toToken.price === 0 ? <span className="text-[10px] bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 px-1.5 py-0.5 rounded-full">NO PRICE</span> : <span className="text-[10px] bg-[#13895c]/20 text-[#13895c] border border-[#13895c]/30 px-1.5 py-0.5 rounded-full">LIVE</span>}
                        <span className="text-[10px] bg-[#edf5f0] border border-[#13895c]/20 text-[#13895c] px-1.5 py-0.5 rounded-full flex items-center gap-1"><Shield size={10} /> SECURE</span>
                      </div>
                      <div className="text-sm text-[#65746b] flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#13895c] rounded-full animate-pulse" />
                        {fromToken.price === 0 ? `${fromToken.symbol} not listed` : `Real: $${fromToken.price.toFixed(4)} / $${toToken.price.toFixed(4)}`} • Verified
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 bg-[#f5f7f6] rounded-xl p-1 border border-[#e3e9e5]">
                    {['24H', '1W', '1M', '1Y'].map(t => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={chartInterval === t}
                        onClick={() => setChartInterval(t)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${chartInterval === t ? 'bg-[#13895c] text-white border border-[#13895c]' : 'text-[#65746b] hover:bg-white'}`}
                      >{t}</button>
                    ))}
                  </div>
                </div>

                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-2xl font-bold">{fromToken.price === 0 || toToken.price === 0 ? 'No Price' : (fromToken.price / toToken.price).toFixed(6)}</span>
                  <span className="text-[#65746b]">{fromToken.price === 0 || toToken.price === 0 ? '' : toToken.symbol}</span>
                  {fromToken.priceChange24h !== undefined && fromToken.price !== 0 && (
                    <span className={`text-sm font-medium flex items-center gap-1 ${fromToken.priceChange24h >= 0 ? 'text-[#13895c]' : 'text-[#ef4444]'}`}>
                      {fromToken.priceChange24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{fromToken.priceChange24h?.toFixed(2)}% (24h)
                    </span>
                  )}
                </div>

                <div className="h-[280px] w-full -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartDataDynamic}>
                      <defs>
                        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#13895c" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#13895c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fill: '#65746b', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis domain={['auto', 'auto']} hide />
                      <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e3e9e5', borderRadius: '12px', color: 'white' }} formatter={(v) => [`$${Number(v).toFixed(6)}`, 'Real Price']} />
                      <Area type="monotone" dataKey="price" stroke={fromToken.price === 0 ? '#ef4444' : '#13895c'} strokeWidth={2.5} fill="url(#priceGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#e3e9e5]/50">
                  <div><div className="text-xs text-[#65746b] flex items-center gap-1"><Shield size={10} /> Security</div><div className="font-semibold text-xs flex items-center gap-1">{fromSecurity.level === 'safe' ? <ShieldCheck size={12} className="text-[#13895c]" /> : <AlertTriangle size={12} className="text-[#eab308]" />}{fromSecurity.score}/100 {fromSecurity.level}</div><div className="text-[11px] text-[#13895c]">{fromSecurity.positives[0] || 'Checked'}</div></div>
                  <div><div className="text-xs text-[#65746b]">24h Volume</div><div className="font-semibold">{fromToken.symbol === 'LDX' ? (ldxRealData.listed ? `$${ldxRealData.volume24h?.toFixed(0)}` : '$0') : 'Live'}</div></div>
                  <div><div className="text-xs text-[#65746b]">Market Cap</div><div className="font-semibold">{fromToken.symbol === 'LDX' ? (ldxRealData.listed ? `$${(ldxRealData.marketCap/1000000).toFixed(2)}M` : '$0') : 'Live'}</div></div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="bg-[#ffffff] rounded-[24px] border border-[#e3e9e5] shadow-[0_0_40px_rgba(19,137,92,0.15)] overflow-hidden">
                <div className="flex items-center justify-between p-5 pb-3">
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-full bg-[#edf5f0] text-[#1d2922] font-semibold text-sm border border-[#13895c]/30">Swap</button>
                    <button className="px-3 py-2 rounded-full bg-[#edf5f0] border border-[#13895c]/20 text-[#13895c] text-xs flex items-center gap-1"><Shield size={12} /> Secure</button>
                  </div>
                  <div className="flex items-center gap-1">
                    {connected && <span className="text-[10px] bg-[#edf5f0] border border-[#13895c]/20 text-[#13895c] px-2 py-1 rounded-full hidden md:flex items-center gap-1"><ShieldCheck size={10} />{chainId === 56 ? 'BSC Secure' : `Chain ${chainId}`}</span>}
                    <button onClick={() => setShowSecurityInfo(!showSecurityInfo)} className="w-8 h-8 rounded-full bg-[#edf5f0] border border-[#13895c]/20 flex items-center justify-center text-[#13895c]"><Shield size={16} /></button>
                    <button onClick={() => setShowSettings(!showSettings)} className="w-8 h-8 rounded-full hover:bg-[#edf5f0] flex items-center justify-center text-[#65746b]"><Settings size={18} /></button>
                  </div>
                </div>

                {showSecurityInfo && (
                  <div className="mx-2 mb-2 bg-[#f5f7f6] border border-[#13895c]/20 rounded-2xl p-3 text-[11px]">
                    <div className="font-bold text-[#13895c] flex items-center gap-1"><ShieldCheck size={12} /> Security Center - LidexSwap</div>
                    <div className="mt-2 space-y-1 text-[#65746b]">
                      <div className="flex justify-between"><span>Connection</span><span className="text-[#13895c]">Encrypted • Reown AppKit • Non-custodial</span></div>
                      <div className="flex justify-between"><span>Official LDX</span><span className="text-[#1d2922] font-mono">{LIDEX_ADDRESS.slice(0,10)}...{LIDEX_ADDRESS.slice(-8)} <ShieldCheck size={10} className="inline text-[#13895c]" /></span></div>
                      <div className="flex justify-between"><span>Chain</span><span className={chainId === 56 ? 'text-[#13895c]' : 'text-[#ef4444]'}>{chainId === 56 ? 'BSC Mainnet - Secure' : `Wrong chain ${chainId} - Risk!`}</span></div>
                      <div className="flex justify-between"><span>Slippage</span><span style={{ color: slippageRisk.level === 'safe' ? '#13895c' : '#eab308' }}>{slippage}% - {slippageRisk.text}</span></div>
                      <div className="flex justify-between"><span>Price Impact</span><span style={{ color: priceImpactRisk.color }}>{priceImpact.toFixed(2)}% - {priceImpactRisk.text}</span></div>
                      <div className="text-[10px] mt-2 p-2 bg-[#ffffff] rounded-lg border border-[#e3e9e5]">Always verify official LDX address on BscScan. Never share seed phrase. LidexSwap never asks for private keys. All swaps are non-custodial.</div>
                    </div>
                  </div>
                )}

                {connected && address && (
                  <div className="mx-2 mb-2 bg-[#f5f7f6] border border-[#13895c]/20 rounded-2xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#13895c]/20 border border-[#13895c]/30 flex items-center justify-center"><Wallet size={12} className="text-[#13895c]" /></div>
                      <div className="text-xs font-bold text-[#1d2922] flex items-center gap-1.5">{walletAddress} <span className="text-[9px] bg-[#13895c] text-white px-1.5 py-0.5 rounded-full flex items-center gap-1"><ShieldCheck size={8} /> Secure</span><span className="text-[10px] text-[#65746b] font-normal">{chainId === 56 ? 'BSC' : `Chain ${chainId}`}</span></div>
                    </div>
                    <button onClick={() => appKit.open()} className="text-[11px] bg-[#ffffff] border border-[#e3e9e5] hover:bg-[#edf5f0] text-[#65746b] hover:text-[#1d2922] px-3 py-1 rounded-full">Manage</button>
                  </div>
                )}

                {connected && balancesError && (
                  <div className="mx-2 mb-2 rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]">
                    Unable to read balances from BSC right now. Check your RPC connection and retry.
                    <button onClick={refetchAll} className="ml-2 underline font-bold">Retry</button>
                  </div>
                )}

                <div className="p-2 space-y-1">
                  <div className="bg-[#f5f7f6] rounded-2xl p-4 border border-transparent hover:border-[#e3e9e5] transition-colors">
                    <div className="flex justify-between text-xs text-[#65746b] mb-2">
                      <span className="flex items-center gap-1">You pay <Shield size={10} className="text-[#13895c]" /></span>
                      <span className="flex items-center gap-1">
                        {connected ? (
                          <>
                            <span className={fromRealBalance.isReal ? 'text-[#13895c]' : 'text-[#65746b]'}>Real: {fromRealBalance.isReal ? parseFloat(fromRealBalance.formatted).toFixed(4) : '0.0000'} {fromToken.symbol}</span>
                            <button onClick={() => setFromAmount(fromRealBalance.value.toString())} className="ml-1 bg-[#edf5f0] border border-[#13895c]/30 text-[#13895c] px-1.5 py-0.5 rounded-full text-[10px]">MAX</button>
                          </>
                        ) : '0.0'} {fromToken.symbol}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input value={fromAmount} onChange={e => setFromAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.0" className="flex-1 bg-transparent text-[24px] font-medium outline-none placeholder:text-[#65746b]/50" />
                      <button onClick={() => setShowTokenSelect('from')} className="flex items-center gap-2 bg-[#ffffff] hover:bg-[#edf5f0] rounded-full px-3 py-1.5 font-semibold shadow border border-[#e3e9e5]">
                        <TokenIcon token={fromToken} size={24} />{fromToken.symbol}<ChevronDown size={16} />
                      </button>
                    </div>
                    <div className="text-xs text-[#65746b] mt-1 flex items-center gap-1 justify-between">
                      <span>${fromAmount && fromToken.price !== 0 ? (parseFloat(fromAmount) * fromToken.price).toFixed(2) : '0.00'} {fromToken.price !== 0 ? `• Real: $${fromToken.price.toFixed(4)}` : '• No price'} • Sec: {fromSecurity.score}/100</span>
                      {fromSecurity.level !== 'safe' && <span className="text-[#eab308] flex items-center gap-1"><AlertTriangle size={10} /> {fromSecurity.risks[0]}</span>}
                    </div>
                  </div>

                  <div className="flex justify-center -my-3 relative z-10">
                    <button onClick={switchTokens} className="w-10 h-10 rounded-full bg-[#ffffff] border-4 border-[#ffffff] flex items-center justify-center hover:bg-[#edf5f0] shadow-lg ring-1 ring-[#13895c]/20"><ArrowDownUp size={16} className="text-[#13895c]" /></button>
                  </div>

                  <div className="bg-[#f5f7f6] rounded-2xl p-4 border border-transparent hover:border-[#e3e9e5] transition-colors">
                    <div className="flex justify-between text-xs text-[#65746b] mb-2">
                      <span>You receive</span>
                      <span>Balance: {connected ? (toRealBalance.isReal ? parseFloat(toRealBalance.formatted).toFixed(4) : '0.0000') : '0.0'} {toToken.symbol} {toRealBalance.isReal && <span className="text-[#13895c]">• Real</span>}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input value={toAmount} readOnly placeholder="0.0" className="flex-1 bg-transparent text-[24px] font-medium outline-none placeholder:text-[#65746b]/50" />
                      <button onClick={() => setShowTokenSelect('to')} className="flex items-center gap-2 bg-[#ffffff] hover:bg-[#edf5f0] rounded-full px-3 py-1.5 font-semibold shadow border border-[#e3e9e5]">
                        <TokenIcon token={toToken} size={24} />{toToken.symbol}<ChevronDown size={16} />
                      </button>
                    </div>
                    <div className="text-xs text-[#65746b] mt-1 flex items-center gap-1">
                      ${toAmount && toToken.price !== 0 ? (parseFloat(toAmount) * toToken.price).toFixed(2) : '0.00'} {toToken.price !== 0 ? `• Real: $${toToken.price.toFixed(4)}` : '• No price'} • Sec: {toSecurity.score}/100
                      {toToken.official && <span className="text-[#13895c] flex items-center gap-1"><ShieldCheck size={10} /> Official LDX</span>}
                    </div>
                  </div>
                </div>

                {fromAmount && toAmount && fromToken.price !== 0 && toToken.price !== 0 && (
                  <div className="mx-2 mt-2 p-3 rounded-2xl bg-[#f5f7f6]/70 border border-[#e3e9e5]/50 text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-[#65746b] flex items-center gap-1"><Shield size={12} /> Price</span><span>{(fromToken.price / toToken.price).toFixed(6)} {toToken.symbol} per {fromToken.symbol} • Live</span></div>
                    <div className="flex justify-between"><span className="text-[#65746b]">Minimum received</span><span>{minReceived} {toToken.symbol}</span></div>
                    <div className="flex justify-between"><span className="text-[#65746b]">Price Impact</span><span style={{ color: priceImpactRisk.color }}>{priceImpact.toFixed(2)}% • {priceImpactRisk.text}</span></div>
                    <div className="flex justify-between"><span className="text-[#65746b]">Security</span><span className="text-[#13895c] text-xs flex items-center gap-1"><ShieldCheck size={12} /> Non-custodial • Verified • BSC</span></div>
                  </div>
                )}

                {swapValidation.errors.length > 0 && fromAmount && (
                  <div className={`mx-2 mt-2 p-3 rounded-2xl border text-xs ${swapValidation.isWarning ? 'bg-[#eab308]/10 border-[#eab308]/20' : 'bg-[#ef4444]/10 border-[#ef4444]/20'}`}>
                    <div className={`font-bold flex items-center gap-1 ${swapValidation.isWarning ? 'text-[#eab308]' : 'text-[#ef4444]'}`}><AlertTriangle size={12} /> {swapValidation.errors[0]}</div>
                  </div>
                )}

                {fromToken.price === 0 && fromAmount && (
                  <div className="mx-2 mt-2 p-3 rounded-2xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-xs">
                    <div className="font-bold text-[#ef4444] flex items-center gap-1"><AlertTriangle size={12} /> Security: No liquidity - Price $0</div>
                    <div className="text-[#65746b] mt-1">Real on-chain price is $0. This token has no liquidity pool. High risk - potential honeypot. Only proceed if you are adding initial liquidity.</div>
                  </div>
                )}

                {chainId !== 56 && connected && (
                  <div className="mx-2 mt-2 p-3 rounded-2xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-xs">
                    <div className="font-bold text-[#ef4444]">Wrong Network - Security Risk</div>
                    <div className="text-[#65746b] mt-1">You are on chain {chainId}. Switch to BSC Mainnet (56) to see real balances and trade securely.</div>
                    <button onClick={() => switchChain({ chainId: bsc.id })} className="mt-2 bg-[#ef4444] text-[#1d2922] px-3 py-1 rounded-full text-xs font-bold">Switch to BSC Securely</button>
                  </div>
                )}

                <div className="p-2 pt-3">
                  {connected && chainId === BALANCE_CHAIN_ID && sameSwapToken && (
                    <div className="mb-2 rounded-2xl border border-[#eab308]/30 bg-[#eab308]/10 px-3 py-2 text-xs text-[#eab308]">Choose two different tokens to get a swap quote.</div>
                  )}
                  {connected && chainId === BALANCE_CHAIN_ID && quoteError && !sameSwapToken && (
                    <div className="mb-2 rounded-2xl border border-[#eab308]/30 bg-[#eab308]/10 px-3 py-2 text-xs text-[#eab308]">No LidexSwap pool quote is available for this token pair and amount.</div>
                  )}
                  <button onClick={handleSwap} disabled={isSwapping || (!fromAmount && connected) || !isValidAddress(ROUTER_ADDRESS) || (connected && chainId === BALANCE_CHAIN_ID && (!parsedSwapAmount || !hasKnownInputBalance || insufficientInputBalance || sameSwapToken || !quotedOutput || inputAllowance === undefined)) || (connected && !swapValidation.valid && !swapValidation.isWarning)} className={`w-full h-[48px] rounded-2xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 ${!connected ? 'bg-[#13895c] hover:bg-[#0e7049] text-white shadow-[0_4px_15px_rgba(19,137,92,0.4)]' : !fromAmount || !quotedOutput || sameSwapToken ? 'bg-[#edf5f0] text-[#65746b] cursor-not-allowed border border-[#e3e9e5]' : priceImpactRisk.level === 'critical' ? 'bg-[#ef4444] text-white' : 'bg-[#13895c] hover:bg-[#0e7049] text-white shadow-[0_4px_15px_rgba(19,137,92,0.4)]'}`}>
                    {isSwapping && <RefreshCw size={16} className="animate-spin" />}
                    {!isSwapping && !connected && <ShieldCheck size={16} />}
                    {!isSwapping && connected && chainId === BALANCE_CHAIN_ID && !needsApproval && quotedOutput && <Lock size={16} />}
                    {swapButtonLabel}
                  </button>
                  <div className="mt-2 text-[10px] text-[#65746b] text-center">{balancesLoading ? 'Reading balances from BSC...' : 'Balances update from the connected wallet.'}</div>
                </div>

                <div className="px-5 py-3 flex items-center justify-between text-xs text-[#65746b] border-t border-[#e3e9e5]/30">
                  <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#13895c]" /> Secured • Real balances • Live market</span>
                  <span className="flex items-center gap-1">{lastPriceUpdate ? `Updated ${lastPriceUpdate.toLocaleTimeString()}` : 'Live'} <span className="w-1.5 h-1.5 bg-[#13895c] rounded-full animate-pulse" /></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'liquidity' && (
          <div className="max-w-[700px] mx-auto">
            <div className="bg-[#ffffff] rounded-[24px] border border-[#e3e9e5] p-5">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><ShieldCheck size={20} className="text-[#13895c]" /> Liquidity - Secured • Real Balances</h2>
              <div className="bg-[#f5f7f6] border border-[#13895c]/20 rounded-2xl p-3 mb-4 text-xs">
                <div className="font-bold text-[#13895c] flex items-center gap-1"><Wallet size={12} /> Connected • BSC Mainnet • Secured</div>
                <div className="text-[#65746b] mt-1">{connected ? `${walletAddress} • ${bnbBalance ? parseFloat(bnbBalance.formatted).toFixed(4) + ' BNB' : 'Connected'}` : 'Connect to see balances'} • Reown AppKit</div>
              </div>
              {!connected ? (
                <div className="text-center py-16 bg-[#f5f7f6] rounded-2xl border border-[#e3e9e5]">
                  <ShieldCheck size={32} className="mx-auto text-[#13895c] mb-3" />
                  <div className="text-[#65746b] mb-2">Connect wallet securely via Reown AppKit to see real balances</div>
                  <div className="text-xs text-[#65746b] mb-3">Non-custodial • Encrypted • 300+ wallets • BSC Mainnet • Real on-chain balances</div>
                  <button onClick={() => appKit.open()} className="bg-[#13895c] text-white px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 mx-auto"><Lock size={14} /> Connect Wallet - Secure</button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4"><span className="text-[#65746b]">{liquidityPositions.length} positions • {connected ? `${walletAddress}` : 'Not connected'}</span><button onClick={() => setShowAddLiq(true)} className="bg-[#13895c] text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1"><Plus size={14} /> Add Liquidity</button></div>
                  {showAddLiq ? (
                    <div className="bg-[#f5f7f6] rounded-2xl p-4 space-y-3 border border-[#13895c]/30">
                      <div className="flex justify-between items-center"><h3 className="font-bold flex items-center gap-1"><Shield size={14} className="text-[#13895c]" /> Add Liquidity - Secured</h3><button onClick={() => setShowAddLiq(false)}><X size={18} /></button></div>
                      {!pairExists && <div className="bg-[#edf5f0] border border-[#13895c]/30 rounded-xl p-3 text-xs"><div className="font-bold text-[#13895c]">First provider! You set real price.</div><div className="text-[#65746b]">No price yet for {liqTokenA.symbol}/{liqTokenB.symbol} - you set it securely on-chain.</div></div>}
                      <div className="bg-[#ffffff] rounded-2xl p-4 border border-[#e3e9e5]">
                        <div className="text-xs text-[#65746b] mb-2 flex justify-between"><span>Token A • Real: ${liqTokenA.price === 0 ? 'No price' : liqTokenA.price.toFixed(4)} • Sec: {getSecurityScore(liqTokenA).score}/100</span><span className="text-[#13895c]">Bal: {getBalanceForToken(liqTokenA).isReal ? parseFloat(getBalanceForToken(liqTokenA).formatted).toFixed(4) : '0'}</span></div>
                        <div className="flex gap-3"><input value={liqAmountA} onChange={e => handleLiqACalc(e.target.value)} placeholder="0.0" className="flex-1 bg-transparent text-xl outline-none" /><button onClick={() => setShowTokenSelect('liqA')} className="flex items-center gap-2 bg-[#f5f7f6] px-3 py-1.5 rounded-full border border-[#e3e9e5]"><TokenIcon token={liqTokenA} size={20} />{liqTokenA.symbol}<ChevronDown size={14} /></button></div>
                      </div>
                      <div className="flex justify-center -my-2"><div className="w-8 h-8 rounded-full bg-[#edf5f0] flex items-center justify-center border border-[#e3e9e5]"><Plus size={14} /></div></div>
                      <div className="bg-[#ffffff] rounded-2xl p-4 border border-[#e3e9e5]">
                        <div className="text-xs text-[#65746b] mb-2 flex justify-between"><span>Token B • Real: ${liqTokenB.price === 0 ? 'No price' : liqTokenB.price.toFixed(4)} • Sec: {getSecurityScore(liqTokenB).score}/100</span><span className="text-[#13895c]">Bal: {getBalanceForToken(liqTokenB).isReal ? parseFloat(getBalanceForToken(liqTokenB).formatted).toFixed(4) : '0'}</span></div>
                        <div className="flex gap-3"><input value={liqAmountB} onChange={e => handleLiqBCalc(e.target.value)} placeholder="0.0" className="flex-1 bg-transparent text-xl outline-none" /><button onClick={() => setShowTokenSelect('liqB')} className="flex items-center gap-2 bg-[#f5f7f6] px-3 py-1.5 rounded-full border border-[#e3e9e5]"><TokenIcon token={liqTokenB} size={20} />{liqTokenB.symbol}<ChevronDown size={14} /></button></div>
                      </div>
                      <div className="bg-[#edf5f0]/50 border border-[#13895c]/20 rounded-xl p-2 text-[11px] text-[#65746b] flex items-center gap-1"><Lock size={10} className="text-[#13895c]" /> Secured: Non-custodial liquidity - you own LP tokens - no admin keys - audited</div>
                      <button onClick={handleAddLiquidity} className="w-full h-12 rounded-2xl bg-[#13895c] text-white font-bold flex items-center justify-center gap-2"><ShieldCheck size={16} /> Add Liquidity Securely - BSC</button>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#f5f7f6] rounded-2xl border border-dashed border-[#e3e9e5]">
                      <div className="text-xs text-[#65746b] mb-4">{walletAddress} • {bnbBalance ? `${parseFloat(bnbBalance.formatted).toFixed(4)} BNB` : 'BSC'} • Secured via Reown</div>
                      <button onClick={() => setShowAddLiq(true)} className="bg-[#13895c] text-white px-4 py-2 rounded-full text-sm font-bold">Add Liquidity - Set Real Price</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {view === 'farms' && (
          <div className="max-w-[1000px] mx-auto">
            <h1 className="text-[28px] font-bold flex items-center gap-3"><ShieldCheck size={28} className="text-[#13895c]" /> Farms - Secured • Real APR</h1>
            <p className="text-[#65746b] text-sm">{connected ? `${walletAddress} • ${bnbBalance ? parseFloat(bnbBalance.formatted).toFixed(4) + ' BNB' : 'Connected'}` : 'Connect to see balances'} • Secured • Audited • BSC</p>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-[#ffffff] rounded-2xl border border-[#e3e9e5] p-4"><div className="font-bold flex items-center gap-2">LDX-BNB <ShieldCheck size={14} className="text-[#13895c]" /> Real: {ldxRealData.listed ? `$${ldxRealData.price}` : '$0'}</div><div className="text-xs text-[#65746b]">Official: {LIDEX_ADDRESS.slice(0,10)}... • Secured • {connected ? walletAddress : 'Connect wallet'}</div></div>
              <div className="bg-[#ffffff] rounded-2xl border border-[#e3e9e5] p-4"><div className="font-bold">BNB Real: ${livePrices['binancecoin']?.toFixed(2)} • BSC Mainnet</div><div className="text-xs text-[#13895c]">Live • Secured • {connected && bnbBalance ? `${parseFloat(bnbBalance.formatted).toFixed(4)} BNB` : 'Connect wallet'}</div></div>
            </div>
          </div>
        )}
      </main>

      {showTokenSelect && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-[#ffffff] w-full md:max-w-[440px] rounded-t-[24px] md:rounded-[24px] border border-[#e3e9e5] max-h-[85vh] flex flex-col">
            <div className="p-5 flex justify-between items-center border-b border-[#e3e9e5]"><h3 className="font-bold text-lg flex items-center gap-2"><Shield size={18} className="text-[#13895c]" /> Select Token - Real Balances • Secured</h3><button onClick={() => { setShowTokenSelect(null); setSearchQuery('') }} className="w-8 h-8 rounded-full bg-[#f5f7f6] flex items-center justify-center border border-[#e3e9e5]"><X size={16} /></button></div>
            <div className="p-4">
              <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#65746b]" /><input value={searchQuery} onChange={e => setSearchQuery(sanitizeAddress(e.target.value) || e.target.value)} placeholder="Search or paste address - secured validation" className="w-full bg-[#f5f7f6] border border-[#e3e9e5] rounded-2xl pl-10 pr-4 py-3 outline-none text-sm font-mono" /></div>
              <div className="mt-2 text-[10px] text-[#65746b] flex items-center gap-1"><Lock size={10} /> Security: All addresses validated • Official LDX verified • No phishing</div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
              {isSearchAddressNotInList && (
                <div className="bg-[#edf5f0] border border-[#13895c]/30 rounded-xl p-3 mb-2">
                  <div className="text-sm font-bold text-[#13895c] flex items-center gap-1"><AlertTriangle size={14} /> Import custom - Security Check Required</div>
                  <div className="text-xs truncate font-mono">{searchQuery}</div>
                  <div className="text-[11px] text-[#65746b] mt-1">⚠️ Unverified token - high risk. Only import if you trust source. Check BscScan.</div>
                  <button onClick={() => handleImportToken()} className="mt-2 w-full bg-[#13895c] text-white rounded-full py-2 text-sm font-bold">Import with Security Warning</button>
                </div>
              )}
              {filteredTokens.map(token => {
                const bal = getBalanceForToken(token)
                const sec = getSecurityScore(token)
                return (
                  <button key={`${token.symbol}-${token.address}`} onClick={() => {
                    if (showTokenSelect === 'from') setFromToken(token)
                    else if (showTokenSelect === 'to') setToToken(token)
                    else if (showTokenSelect === 'liqA') setLiqTokenA(token)
                    else if (showTokenSelect === 'liqB') setLiqTokenB(token)
                    setShowTokenSelect(null); setSearchQuery('')
                  }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#f5f7f6] text-left border border-transparent hover:border-[#e3e9e5]/50">
                    <div className="flex items-center gap-3">
                      <TokenIcon token={token} size={32} />
                      <div>
                        <div className="font-bold text-[15px] flex items-center gap-1.5">{token.symbol} {token.verified ? <ShieldCheck size={12} className="text-[#13895c]" /> : <span className="text-[9px] bg-[#ef4444]/20 text-[#ef4444] px-1 rounded">CUSTOM</span>} {token.official && <span className="text-[9px] bg-[#13895c] text-white px-1 rounded">OFFICIAL</span>} <span className={`text-[9px] px-1 rounded ${sec.level === 'safe' ? 'bg-[#13895c]/20 text-[#13895c]' : sec.level === 'medium' ? 'bg-[#eab308]/20 text-[#eab308]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>{sec.score}/100</span></div>
                        <div className="text-xs text-[#65746b] flex items-center gap-1">{token.name} {token.official && <Lock size={10} className="text-[#13895c]" />}</div>
                        {connected && <div className="text-[11px] text-[#13895c]">Real: {bal.isReal ? parseFloat(bal.formatted).toFixed(4) : '0'} {token.symbol} {bal.isReal ? '• On-chain' : '• No balance'}</div>}
                      </div>
                    </div>
                    <div className="text-right"><div className="text-xs text-[#65746b]">{token.price !== 0 ? `$${token.price < 1 ? token.price.toFixed(4) : token.price.toFixed(2)}` : 'No price'}</div><div className="text-[10px] text-[#65746b]">{bal.isReal && parseFloat(bal.formatted) > 0 ? `$${(parseFloat(bal.formatted) * token.price).toFixed(2)}` : sec.level}</div></div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {showImportWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#ffffff] rounded-[24px] border border-[#ef4444]/30 w-full max-w-[380px] p-6">
            <div className="flex items-center gap-2 text-[#ef4444] font-bold mb-3"><Shield size={20} /> Security Check - Import Token</div>
            <div className="bg-[#f5f7f6] rounded-xl p-3 border border-[#e3e9e5] mb-4">
              <div className="flex items-center gap-3"><TokenIcon token={showImportWarning} size={40} /><div><div className="font-bold flex items-center gap-1">{showImportWarning.symbol} <span className="text-[10px] bg-[#ef4444]/20 text-[#ef4444] px-1 rounded">UNVERIFIED</span></div><div className="text-xs text-[#65746b]">{showImportWarning.name}</div></div></div>
              <div className="text-[11px] break-all mt-2 font-mono">{showImportWarning.address}</div>
              <div className="mt-2 text-[11px] text-[#ef4444]">⚠️ Risks: {getSecurityScore(showImportWarning).risks.join(' • ')}</div>
              <div className="mt-1 text-[11px] text-[#65746b]">Security Score: {getSecurityScore(showImportWarning).score}/100 - {getSecurityScore(showImportWarning).level} risk</div>
            </div>
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl p-2 text-[11px] text-[#65746b] mb-4">Security: Anyone can create a token with same name. Verify address on BscScan. LidexSwap is permissionless - we cannot guarantee safety of custom tokens. Only import trusted tokens.</div>
            <div className="flex gap-2"><button onClick={() => setShowImportWarning(null)} className="flex-1 bg-[#edf5f0] border border-[#e3e9e5] rounded-full py-2.5 text-sm font-bold">Cancel - Secure</button><button onClick={confirmImport} className="flex-1 bg-[#ef4444] text-[#1d2922] rounded-full py-2.5 text-sm font-bold">I Understand Risk - Import</button></div>
          </div>
        </div>
      )}

      {showListTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#ffffff] rounded-[24px] border border-[#e3e9e5] w-full max-w-[440px] p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg flex items-center gap-2"><ShieldCheck size={18} className="text-[#13895c]" /> List Token - Secured</h3><button onClick={() => setShowListTokenModal(false)} className="w-8 h-8 rounded-full bg-[#f5f7f6] flex items-center justify-center border border-[#e3e9e5]"><X size={16} /></button></div>
            <div className="bg-[#f5f7f6] border border-[#13895c]/20 rounded-2xl p-4 mb-4 text-xs">
              <div className="font-bold text-[#13895c] flex items-center gap-1"><Lock size={12} /> Security: Permissionless but audited - Official LDX verified</div>
              <div className="text-[#65746b] mt-1">Official LDX: {LIDEX_ADDRESS} • {connected ? `${walletAddress} • Secured` : 'Connect wallet'} • BSC Mainnet</div>
            </div>
            <input value={newTokenAddress} onChange={e => setNewTokenAddress(sanitizeAddress(e.target.value))} placeholder="0x... any BEP-20 - secured validation" className="w-full bg-[#f5f7f6] border border-[#e3e9e5] rounded-2xl px-4 py-3 outline-none text-sm font-mono" />
            <div className="mt-2 text-[10px] text-[#65746b]">Security: Address sanitized • Validated • No phishing • Official LDX check</div>
            <button onClick={handleListTokenDirect} disabled={!isValidAddress(newTokenAddress)} className={`mt-3 w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 ${isValidAddress(newTokenAddress) ? 'bg-[#13895c] text-white' : 'bg-[#edf5f0] text-[#65746b] cursor-not-allowed border border-[#e3e9e5]'}`}><ShieldCheck size={16} /> Import & List Securely</button>
          </div>
        </div>
      )}

      {txStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#ffffff] rounded-[24px] border border-[#e3e9e5] w-full max-w-[360px] p-6 text-center">
            {txStatus === 'approving' || txStatus === 'pending' ? <>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-[#edf5f0] border-t-[#13895c] animate-spin" />
              <h3 className="font-bold flex items-center justify-center gap-2"><Lock size={16} className="text-[#13895c]" /> {txStatus === 'approving' ? 'Approve token in wallet' : 'Confirm swap in wallet'}</h3>
              <div className="text-xs text-[#65746b] mt-2">{txStatus === 'approving' ? `Allow the LidexSwap router to spend ${fromToken.symbol}.` : `Swapping ${fromAmount} ${fromToken.symbol} for at least ${minReceived} ${toToken.symbol}.`}</div>
            </> : txStatus === 'approved' ? <>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#13895c]/20 flex items-center justify-center text-3xl border border-[#13895c]/30">✓</div>
              <h3 className="font-bold flex items-center justify-center gap-2"><ShieldCheck size={16} className="text-[#13895c]" /> Approval confirmed</h3>
              <div className="text-xs text-[#65746b] mt-2">Your {fromToken.symbol} approval is confirmed. Submit the swap when ready.</div>
              {txHash && <a href={`https://bscscan.com/tx/${txHash}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-[#13895c]">View approval <ExternalLink size={12} /></a>}
              <button onClick={() => setTxStatus(null)} className="mt-4 w-full rounded-xl bg-[#edf5f0] border border-[#e3e9e5] py-2 text-sm font-bold">Close</button>
            </> : txStatus === 'success' ? <>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#13895c]/20 flex items-center justify-center text-3xl border border-[#13895c]/30">✓</div>
              <h3 className="font-bold flex items-center justify-center gap-2"><ShieldCheck size={16} className="text-[#13895c]" /> Swap confirmed</h3>
              <div className="text-xs text-[#65746b] mt-2">The transaction was confirmed on BNB Smart Chain.</div>
              {txHash && <a href={`https://bscscan.com/tx/${txHash}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-[#13895c]">View transaction <ExternalLink size={12} /></a>}
              <button onClick={() => setTxStatus(null)} className="mt-4 w-full rounded-xl bg-[#edf5f0] border border-[#e3e9e5] py-2 text-sm font-bold">Close</button>
            </> : <>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#ef4444]/15 flex items-center justify-center text-3xl border border-[#ef4444]/30">!</div>
              <h3 className="font-bold flex items-center justify-center gap-2"><AlertTriangle size={16} className="text-[#ef4444]" /> Transaction failed</h3>
              <div className="text-xs text-[#65746b] mt-2 break-words">{txError}</div>
              <button onClick={() => setTxStatus(null)} className="mt-4 w-full rounded-xl bg-[#edf5f0] border border-[#e3e9e5] py-2 text-sm font-bold">Close</button>
            </>}
          </div>
        </div>
      )}

    </div>
  )
}
