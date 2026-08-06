// api/footballProxy.js
const API_KEY = process.env.VITE_FOOTBALL_API_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const endpoint = req.query.endpoint
  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint' })
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  const targetUrl = `${BASE_URL}${endpoint}`

  try {
    const response = await fetch(targetUrl, {
      headers: { 'x-apisports-key': API_KEY },
    })

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Football API returned ${response.status}`,
      })
    }

    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}