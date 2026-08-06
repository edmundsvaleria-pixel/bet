// src/services/oddsApi.js
const ODDS_API_KEY = import.meta.env.VITE_ODDS_API_KEY
const BACKUP_ODDS_API_KEY = import.meta.env.VITE_BACKUP_ODDS_API_KEY
const BASE_URL = 'https://api.the-odds-api.com/v4'

const getProxyUrl = (url) => {
  if (import.meta.env.DEV) {
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
  } else {
    // Vercel serverless function
    return `/api/oddsProxy?url=${encodeURIComponent(url)}`
  }
}

const SPORT_KEYS = {
  'Premier League': 'soccer_epl',
  'La Liga': 'soccer_spain_la_liga',
  'Bundesliga': 'soccer_germany_bundesliga',
  'Serie A': 'soccer_italy_serie_a',
  'Ligue 1': 'soccer_france_ligue_1',
  'Champions League': 'soccer_uefa_champions_league',
  'Europa League': 'soccer_uefa_europa_league',
}

const FALLBACK_SPORTS = ['soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga']

const getSportKey = (league) => {
  if (!league) return FALLBACK_SPORTS[0]
  if (SPORT_KEYS[league]) return SPORT_KEYS[league]
  for (const [key, value] of Object.entries(SPORT_KEYS)) {
    if (league.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(league.toLowerCase())) {
      return value
    }
  }
  return FALLBACK_SPORTS[0]
}

export const getOddsForMatch = async (homeTeam, awayTeam, date, league) => {
  const sportKey = getSportKey(league)
  const sportKeysToTry = [sportKey, ...FALLBACK_SPORTS.filter(k => k !== sportKey)]

  for (const key of sportKeysToTry) {
    try {
      const apiKey = ODDS_API_KEY || BACKUP_ODDS_API_KEY
      if (!apiKey) break

      const url = `${BASE_URL}/sports/${key}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,overunder&date=${date || ''}`
      const proxyUrl = getProxyUrl(url)

      console.log(`📡 Fetching odds via ${import.meta.env.DEV ? 'public proxy' : 'Vercel function'}: ${key}`)
      const response = await fetch(proxyUrl)

      if (!response.ok) {
        console.warn(`⚠️ Odds API failed for ${key} (${response.status})`)
        continue
      }

      const data = await response.json()

      const match = data.find(
        (m) =>
          m.home_team?.toLowerCase() === homeTeam?.toLowerCase() &&
          m.away_team?.toLowerCase() === awayTeam?.toLowerCase()
      )

      if (match) {
        console.log(`✅ Found odds for ${homeTeam} vs ${awayTeam}`)
        return match
      }

      const partial = data.find(
        (m) =>
          m.home_team?.toLowerCase().includes(homeTeam?.toLowerCase()) ||
          m.away_team?.toLowerCase().includes(awayTeam?.toLowerCase())
      )

      if (partial) {
        console.log(`✅ Found partial odds match`)
        return partial
      }
    } catch (error) {
      console.warn(`⚠️ Odds API error for ${key}:`, error.message)
      continue
    }
  }

  console.log(`ℹ️ No odds found for ${homeTeam} vs ${awayTeam}`)
  return null
}

export const extractOdds = (matchOdds) => {
  if (!matchOdds) return null
  const result = { h2h: null, overUnder: null }
  matchOdds.bookmakers?.forEach((bookmaker) => {
    bookmaker.markets?.forEach((market) => {
      if (market.key === 'h2h') {
        const home = market.outcomes.find((o) => o.name === matchOdds.home_team)
        const draw = market.outcomes.find((o) => o.name === 'Draw')
        const away = market.outcomes.find((o) => o.name === matchOdds.away_team)
        if (home && draw && away) result.h2h = { home: home.price, draw: draw.price, away: away.price }
      } else if (market.key === 'overunder') {
        const over = market.outcomes.find((o) => o.name.includes('Over'))
        const under = market.outcomes.find((o) => o.name.includes('Under'))
        if (over && under) result.overUnder = { over: over.price, under: under.price }
      }
    })
  })
  return result
}

export const getOddsForFixture = async (fixture) => {
  if (!fixture) return null
  const home = fixture.teams?.home?.name
  const away = fixture.teams?.away?.name
  const date = fixture.fixture?.date?.split('T')[0]
  const league = fixture.league?.name
  if (!home || !away) return null
  return getOddsForMatch(home, away, date, league)
}