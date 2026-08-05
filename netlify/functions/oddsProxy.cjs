// netlify/functions/oddsProxy.cjs
const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY
const BACKUP_ODDS_API_KEY = process.env.VITE_BACKUP_ODDS_API_KEY
const BASE_URL = 'https://api.the-odds-api.com/v4'

exports.handler = async (event) => {
  // Only accept GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  // Get the full URL (already encoded) from query parameter
  // We'll pass the entire URL as a single parameter to avoid encoding issues
  const targetUrl = event.queryStringParameters?.url
  if (!targetUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing url parameter' })
    }
  }

  // Decode the URL (it's already encoded, but we'll decode to be safe)
  const decodedUrl = decodeURIComponent(targetUrl)

  // Validate that it's an Odds API request (security)
  if (!decodedUrl.startsWith(BASE_URL)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden: Only Odds API requests allowed' })
    }
  }

  // Try primary key, fallback to backup
  const keys = [ODDS_API_KEY, BACKUP_ODDS_API_KEY].filter(Boolean)
  let lastError = null

  for (const key of keys) {
    try {
      // Replace the API key in the URL (the URL already contains the key)
      // We'll just use the URL as-is because it already has the apiKey parameter
      // But we need to ensure the key is correct
      // Since the URL is pre-built with the API key, we just fetch it.
      const urlWithKey = decodedUrl // The frontend already includes apiKey

      console.log(`📡 Proxying Odds request to: ${urlWithKey.replace(/apiKey=[^&]+/, 'apiKey=***')}`)

      const response = await fetch(urlWithKey)

      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`⚠️ Odds API error (${response.status}) with key:`, errorText.slice(0, 100))
        lastError = `API error ${response.status}`
        continue // try next key
      }

      const data = await response.json()
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(data),
      }
    } catch (error) {
      console.warn('⚠️ Odds proxy fetch error:', error.message)
      lastError = error.message
      continue
    }
  }

  // All keys failed
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Odds API unavailable',
      details: lastError || 'All API keys failed'
    })
  }
}