import { useState, useEffect } from 'react'
import { getLiveFixtures } from '../services/footballApi'
import { getOddsForFixture, extractOdds } from '../services/oddsApi'
import { useMatchEngine } from '../context/MatchEngineContext'
import MatchCard from '../components/common/MatchCard'
import LoadingSkeleton from '../components/common/LoadingSkeleton'
import EmptyState from '../components/common/EmptyState'

const Live = () => {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { customMatches } = useMatchEngine()

  const fetchLive = async () => {
    try {
      setLoading(true)
      const data = await getLiveFixtures()
      const limited = data.slice(0, 20)
      const withOdds = await Promise.allSettled(
        limited.map(async (match) => {
          try {
            const odds = await getOddsForFixture(match)
            if (odds) {
              const extracted = extractOdds(odds)
              return { ...match, odds: extracted }
            }
            return match
          } catch (e) {
            return match
          }
        })
      )
      const finalMatches = withOdds.map((res, idx) => res.value || limited[idx])
      setMatches(finalMatches)
      setError(null)
    } catch (err) {
      setError('Could not load live matches. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLive()
    const interval = setInterval(fetchLive, 30000)
    return () => clearInterval(interval)
  }, [])

  const customLive = customMatches
    .filter(m => m.status === 'live')
    .map(match => ({
      fixture: {
        id: `custom_${match.id}`,
        status: { short: 'LIVE', elapsed: match.elapsed || 0, long: 'Live' },
        date: match.startTime,
        venue: { name: 'Custom Match', city: 'BetZone' },
      },
      teams: {
        home: { name: match.homeTeam, logo: null },
        away: { name: match.awayTeam, logo: null },
      },
      league: { name: match.league || 'Custom League', logo: null },
      goals: { home: match.goals?.home || 0, away: match.goals?.away || 0 },
      odds: match.odds || null,
      isCustom: true,
      customMatch: match,
    }))

  const allLive = [...matches, ...customLive]

  if (loading) {
    return (
      <div className="py-4">
        <h1 className="text-2xl font-bold text-white mb-4">Live Matches</h1>
        <LoadingSkeleton type="card" count={3} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4">
        <h1 className="text-2xl font-bold text-white mb-4">Live Matches</h1>
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">🔥 Live Matches</h1>
        <span className="text-xs text-gray-400">Auto-refresh: 30s</span>
      </div>
      {allLive.length === 0 ? (
        <EmptyState 
          icon="📺"
          title="No live matches"
          message="No matches are currently live. Check back soon."
        />
      ) : (
        <div className="space-y-4">
          {allLive.map((match) => (
            <MatchCard key={match.fixture.id} match={match} isLive={true} showOdds={true} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Live