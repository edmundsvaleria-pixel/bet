// src/utils/currency.js
const BASE_CURRENCY = 'GHS'

// Fetch live exchange rates from a free API
export const getExchangeRate = async (targetCurrency) => {
  if (targetCurrency === BASE_CURRENCY) return 1
  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${BASE_CURRENCY}`)
    const data = await res.json()
    return data.rates[targetCurrency] || 1
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    return 1 // fallback to 1:1
  }
}

// Convert amount from GHS to target currency
export const convertFromGHS = async (amountGHS, targetCurrency) => {
  const rate = await getExchangeRate(targetCurrency)
  return amountGHS * rate
}