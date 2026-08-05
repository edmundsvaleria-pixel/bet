// src/services/footballApi.js
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const getCached = (key) => {
  const cached = localStorage.getItem(`football_${key}`)
  if (!cached) return null
  try {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_TTL) return null
    return data
  } catch { return null }
}

const setCache = (key, data) => {
  localStorage.setItem(`football_${key}`, JSON.stringify({ data, timestamp: Date.now() }))
}

const fetchApi = async (endpoint) => {
  const cacheKey = endpoint
  const cached = getCached(cacheKey)
  if (cached) {
    console.log(`📦 Using cached: ${endpoint}`)
    return cached
  }

  const proxyUrl = `/.netlify/functions/footballProxy?endpoint=${encodeURIComponent(endpoint)}`
  const response = await fetch(proxyUrl)
  if (!response.ok) throw new Error(`API error: ${response.status}`)
  const data = await response.json()
  setCache(cacheKey, data)
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