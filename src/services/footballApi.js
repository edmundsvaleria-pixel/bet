// src/services/footballApi.js
const BASE_URL = 'https://v3.football.api-sports.io'
const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY

// ✅ Use different proxy for local dev vs production
const getProxyUrl = (endpoint) => {
  if (import.meta.env.DEV) {
    // Local development – use a public CORS proxy
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(`${BASE_URL}${endpoint}`)}`
  } else {
    // Production (Netlify) – use our Netlify Function
    return `/.netlify/functions/footballProxy?endpoint=${encodeURIComponent(endpoint)}`
  }
}

const fetchApi = async (endpoint) => {
  const url = getProxyUrl(endpoint)
  console.log(`📡 Fetching via ${import.meta.env.DEV ? 'public proxy' : 'Netlify function'}:`, url)
  
  const response = await fetch(url, {
    headers: import.meta.env.DEV ? { 'x-apisports-key': API_KEY } : {}
  })
  
  if (!response.ok) {
    const text = await response.text()
    console.error('❌ Proxy error:', text)
    throw new Error(`API error: ${response.status}`)
  }
  
  const data = await response.json()
  console.log('✅ API Response:', data)
  return data
}

export const getLiveFixtures = async () => {
  try {
    const data = await fetchApi('/fixtures?live=all')
    return data.response || []
  } catch (error) {
    console.error('Failed to fetch live fixtures:', error)
    throw error
  }
}

export const getFixturesByDate = async (date) => {
  try {
    const data = await fetchApi(`/fixtures?date=${date}`)
    return data.response || []
  } catch (error) {
    console.error('Failed to fetch fixtures by date:', error)
    throw error
  }
}

export const getMatchDetails = async (id) => {
  try {
    const data = await fetchApi(`/fixtures?id=${id}`)
    return data.response?.[0] || null
  } catch (error) {
    console.error('Failed to fetch match details:', error)
    throw error
  }
}