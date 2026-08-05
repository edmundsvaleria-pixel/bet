// netlify/functions/footballProxy.cjs
const API_KEY = process.env.VITE_FOOTBALL_API_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

exports.handler = async (event) => {
  // Only accept GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  const endpoint = event.queryStringParameters?.endpoint
  if (!endpoint) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing endpoint parameter' })
    }
  }

  if (!API_KEY) {
    console.error('❌ Football API key is missing!')
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured' })
    }
  }

  const targetUrl = `${BASE_URL}${endpoint}`

  try {
    console.log(`📡 Proxying request to: ${targetUrl}`)

    const response = await fetch(targetUrl, {
      headers: {
        'x-apisports-key': API_KEY,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API error (${response.status}):`, errorText)
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: `Football API returned ${response.status}`,
          details: errorText.slice(0, 200)
        })
      }
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
    console.error('❌ Proxy internal error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal proxy error',
        message: error.message
      })
    }
  }
}