// Security utilities for LidexSwap
export const OFFICIAL_LDX_ADDRESS = "0x567A4F63f6838005e104C053fc24a3510b0432E1"
export const OFFICIAL_LDX_SUPPLY = "500000000"

export const KNOWN_SCAM_PATTERNS = [
  /0x0000000000000000000000000000000000000000/i,
]

export function isValidAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

export function isOfficialLDX(address) {
  return address.toLowerCase() === OFFICIAL_LDX_ADDRESS.toLowerCase()
}

export function sanitizeAddress(address) {
  if (!address) return ''
  // Remove any non-hex characters except 0x
  return address.trim().replace(/[^0-9a-fA-Fx]/gi, '').slice(0, 42)
}

export function getSecurityScore(token) {
  let score = 0
  let risks = []
  let positives = []

  // Verified check
  if (token.verified) {
    score += 40
    positives.push("Verified token")
  } else {
    risks.push("Unverified - custom token")
  }

  // Official LDX check
  if (isOfficialLDX(token.address)) {
    score += 30
    positives.push("Official LDX token")
  }

  // Price check
  if (token.price === 0) {
    risks.push("No liquidity - price $0")
    score -= 10
  } else if (token.price > 0) {
    score += 20
    positives.push("Has liquidity")
  }

  // Custom token risks
  if (token.isCustom) {
    risks.push("Custom imported token - DYOR")
    score -= 20
  }

  // Known tokens
  const trustedSymbols = ['BNB', 'WBNB', 'USDT', 'USDC', 'ETH', 'BTCB', 'CAKE', 'LDX']
  if (trustedSymbols.includes(token.symbol)) {
    score += 10
    positives.push("Trusted symbol")
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score))

  let level = 'high'
  if (score >= 70) level = 'safe'
  else if (score >= 40) level = 'medium'
  else if (score >= 20) level = 'low'

  return { score, level, risks, positives }
}

export function getPriceImpactRisk(impact) {
  if (impact < 0.5) return { level: 'safe', color: '#13895c', text: 'Low impact' }
  if (impact < 2) return { level: 'medium', color: '#eab308', text: 'Medium impact' }
  if (impact < 5) return { level: 'high', color: '#f97316', text: 'High impact' }
  return { level: 'critical', color: '#ef4444', text: 'Very high impact - risky!' }
}

export function getSlippageRisk(slippage) {
  if (slippage <= 1) return { level: 'safe', text: 'Low slippage' }
  if (slippage <= 3) return { level: 'medium', text: 'Medium slippage' }
  return { level: 'high', text: 'High slippage - MEV risk' }
}

export function validateSwapAmount(amount, balance, token) {
  const errors = []
  const num = parseFloat(amount)
  
  if (isNaN(num) || num <= 0) {
    errors.push("Invalid amount")
    return { valid: false, errors }
  }

  if (balance && num > balance) {
    errors.push(`Insufficient ${token.symbol} balance`)
  }

  // Anti-dust
  if (num < 0.000001) {
    errors.push("Amount too small (dust)")
  }

  // Large amount warning
  if (balance && num / balance > 0.9) {
    errors.push("You are swapping >90% of balance - leave some for gas")
  }

  return { valid: errors.length === 0, errors, isWarning: errors.some(e => e.includes('90%')) }
}
