// Currency formatting utilities
export const formatCurrency = (amount: number, currency: 'XOF' | 'USD' = 'XOF'): string => {
  const numAmount = Number(amount) || 0
  
  if (currency === 'XOF') {
    return `${numAmount.toLocaleString('fr-FR')} XOF`
  } else {
    return `$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
}

export const formatCurrencyDual = (amount: number): string => {
  const numAmount = Number(amount) || 0
  const usdAmount = numAmount / 655.957 // XOF to USD conversion rate (approximate)
  
  return `${numAmount.toLocaleString('fr-FR')} XOF (~$${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
}

export const formatCurrencyCompact = (amount: number): string => {
  const numAmount = Number(amount) || 0
  
  if (numAmount >= 1000000) {
    return `${(numAmount / 1000000).toFixed(1)}M XOF`
  } else if (numAmount >= 1000) {
    return `${(numAmount / 1000).toFixed(1)}K XOF`
  } else {
    return `${numAmount.toLocaleString('fr-FR')} XOF`
  }
}
