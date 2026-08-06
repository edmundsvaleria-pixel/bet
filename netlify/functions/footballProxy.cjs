// netlify/functions/footballProxy.cjs
const API_KEY = process.env.VITE_FOOTBALL_API_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const endpoint = event.queryStringParameters?.endpoint
  if (!endpoint) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing endpoint' }) }
  }

  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) }
  }

  const targetUrl = `${BASE_URL}${endpoint}`

  try {
    const response = await fetch(targetUrl, {
      headers: { 'x-apisports-key': API_KEY },
    })

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Football API returned ${response.status}` })
      }
    }

    const data = await response.json()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  } catch (error) {
    console.error(error)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}