const fetchApi = async (endpoint) => {
  const res = await fetch(`/.netlify/functions/footballProxy?endpoint=${encodeURIComponent(endpoint)}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
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