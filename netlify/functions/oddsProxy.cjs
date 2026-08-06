// netlify/functions/oddsProxy.cjs
const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY
const BACKUP_ODDS_API_KEY = process.env.VITE_BACKUP_ODDS_API_KEY
const BASE_URL = 'https://api.the-odds-api.com/v4'

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const targetUrl = event.queryStringParameters?.url
  if (!targetUrl) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing url' }) }
  }

  const decodedUrl = decodeURIComponent(targetUrl)
  if (!decodedUrl.startsWith(BASE_URL)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) }
  }

  const keys = [ODDS_API_KEY, BACKUP_ODDS_API_KEY].filter(Boolean)
  let lastError = null

  for (const key of keys) {
    try {
      const urlObj = new URL(decodedUrl)
      urlObj.searchParams.set('apiKey', key)
      const finalUrl = urlObj.toString()

      const response = await fetch(finalUrl)
      if (!response.ok) {
        lastError = `API error ${response.status}`
        continue
      }

      const data = await response.json()
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    } catch (e) {
      lastError = e.message
      continue
    }
  }

  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Odds API unavailable', details: lastError })
  }
}