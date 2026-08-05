// netlify/functions/oddsProxy.cjs
const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY
const BACKUP_ODDS_API_KEY = process.env.VITE_BACKUP_ODDS_API_KEY
const BASE_URL = 'https://api.the-odds-api.com/v4'

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // Get the full target URL from query parameter
  const targetUrl = event.queryStringParameters?.url
  if (!targetUrl) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing url parameter' }) }
  }

  const decodedUrl = decodeURIComponent(targetUrl)

  if (!decodedUrl.startsWith(BASE_URL)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Only Odds API requests allowed' }) }
  }

  // Try primary key first, fallback to backup
  const keys = [ODDS_API_KEY, BACKUP_ODDS_API_KEY].filter(Boolean)
  let lastError = null

  for (const key of keys) {
    try {
      // The URL already contains an apiKey, but we'll replace with the current key to be safe
      const urlObj = new URL(decodedUrl)
      urlObj.searchParams.set('apiKey', key)
      const finalUrl = urlObj.toString()

      console.log(`📡 Proxying Odds request (${key.slice(0, 4)}...)`)

      const response = await fetch(finalUrl)

      if (!response.ok) {
        const text = await response.text()
        console.warn(`⚠️ Odds API error (${response.status}) with key:`, text.slice(0, 100))
        lastError = `API error ${response.status}`
        continue
      }

      const data = await response.json()
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(data),
      }
    } catch (error) {
      console.warn('⚠️ Odds proxy fetch error:', error.message)
      lastError = error.message
      continue
    }
  }

  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Odds API unavailable', details: lastError || 'All keys failed' })
  }
}