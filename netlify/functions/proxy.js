// netlify/functions/proxy.js
const API_KEY = process.env.VITE_FOOTBALL_API_KEY

exports.handler = async (event) => {
  // Only accept GET requests
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  // Get the target URL from query parameter
  const queryParams = new URLSearchParams(event.queryStringParameters)
  const targetUrl = queryParams.get('url')

  if (!targetUrl) {
    return { statusCode: 400, body: 'Missing url parameter' }
  }

  // Decode the URL
  const decodedUrl = decodeURIComponent(targetUrl)

  // Ensure it's a Football API request (security)
  if (!decodedUrl.startsWith('https://v3.football.api-sports.io/')) {
    return { statusCode: 403, body: 'Forbidden: Only Football API requests allowed' }
  }

  try {
    const response = await fetch(decodedUrl, {
      headers: {
        'x-apisports-key': API_KEY,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      return {
        statusCode: response.status,
        body: text || 'API error',
        headers: { 'Content-Type': 'application/json' },
      }
    }

    const data = await response.json()
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    }
  } catch (error) {
    console.error('Proxy error:', error)
    return { statusCode: 500, body: error.message }
  }
}