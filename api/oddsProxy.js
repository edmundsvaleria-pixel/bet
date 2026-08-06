// api/oddsProxy.js
const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY
const BACKUP_ODDS_API_KEY = process.env.VITE_BACKUP_ODDS_API_KEY
const BASE_URL = 'https://api.the-odds-api.com/v4'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const urlParam = req.query.url
  if (!urlParam) {
    return res.status(400).json({ error: 'Missing url' })
  }

  const decodedUrl = decodeURIComponent(urlParam)
  if (!decodedUrl.startsWith(BASE_URL)) {
    return res.status(403).json({ error: 'Forbidden' })
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
      return res.status(200).json(data)
    } catch (e) {
      lastError = e.message
      continue
    }
  }

  res.status(500).json({
    error: 'Odds API unavailable',
    details: lastError || 'All keys failed',
  })
}