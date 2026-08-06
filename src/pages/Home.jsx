import { useState, useEffect } from 'react'
import { getLiveFixtures, getFixturesByDate } from '../services/footballApi'
import { getOddsForFixture, extractOdds } from '../services/oddsApi'
import { useMatchEngine } from '../context/MatchEngineContext'
import { useSupabase } from '../context/SupabaseContext'
import MatchCard from '../components/common/MatchCard'
import Hero from '../components/home/Hero'
import HeroCarousel from '../components/home/HeroCarousel'
import LoadingSkeleton from '../components/common/LoadingSkeleton'
import EmptyState from '../components/common/EmptyState'

const Home = () => {
  const [liveMatches, setLiveMatches] = useState([])
  const [upcomingMatches, setUpcomingMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { customMatches } = useMatchEngine()
  const { user } = useSupabase()
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const today = new Date()
        const dates = []
        for (let i = 0; i < 3; i++) {
          const d = new Date(today)
          d.setDate(d.getDate() + i)
          dates.push(d.toISOString().split('T')[0])
        }

        // Fetch live matches and upcoming for multiple days
        const [liveData, ...upcomingData] = await Promise.all([
          getLiveFixtures(),
          ...dates.map(date => getFixturesByDate(date)),
        ])

        // Combine all upcoming fixtures
        const allUpcomingRaw = upcomingData.flat()
        // Remove duplicates by fixture id
        const upcomingMap = {}
        allUpcomingRaw.forEach(m => {
          if (!upcomingMap[m.fixture.id]) {
            upcomingMap[m.fixture.id] = m
          }
        })
        const filteredUpcoming = Object.values(upcomingMap)

        const limitedLive = liveData.slice(0, 10)
        const limitedUpcoming = filteredUpcoming.slice(0, 10)

        const fetchOddsForMatches = async (matches) => {
          const results = await Promise.allSettled(
            matches.map(async (match) => {
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
          return results.map((res, idx) => res.value || matches[idx])
        }

        const liveWithOdds = await fetchOddsForMatches(limitedLive.slice(0, 5))
        const upcomingWithOdds = await fetchOddsForMatches(limitedUpcoming)

        setLiveMatches(liveWithOdds)
        setUpcomingMatches(upcomingWithOdds)
        setError(null)
      } catch (err) {
        console.error('Home fetch error:', err)
        setError('Failed to load matches. Please refresh.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Convert custom matches to MatchCard format
  const customToMatchCard = (match) => {
    const isLive = match.status === 'live'
    const isUpcoming = match.status === 'upcoming'

    return {
      fixture: {
        id: `custom_${match.id}`,
        status: {
          short: isLive ? 'LIVE' : isUpcoming ? 'NS' : 'FT',
          elapsed: match.elapsed || 0,
          long: isLive ? 'Live' : isUpcoming ? 'Not Started' : 'Finished',
        },
        date: match.startTime,
        venue: {
          name: 'Custom Match',
          city: 'BetZone',
        },
      },
      teams: {
        home: {
          name: match.homeTeam,
          logo: null,
        },
        away: {
          name: match.awayTeam,
          logo: null,
        },
      },
      league: {
        name: match.league || 'Custom League',
        logo: null,
      },
      goals: {
        home: match.goals?.home || 0,
        away: match.goals?.away || 0,
      },
      odds: match.odds || null,
      isCustom: true,
      customMatch: match,
    }
  }

  const customLive = customMatches.filter(m => m.status === 'live').map(customToMatchCard)
  const customUpcoming = customMatches.filter(m => m.status === 'upcoming').map(customToMatchCard)

  const allLive = [...liveMatches, ...customLive]
  const allUpcoming = [...upcomingMatches, ...customUpcoming]

  if (loading) {
    return (
      <div className="space-y-4 pb-4">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl h-48 animate-pulse" />
        <LoadingSkeleton type="card" count={3} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
          {error}
        </div>
      </div>
    )
  }

  // ✅ Show carousel for logged-in users if there are upcoming matches
  const showCarousel = user && allUpcoming.length > 0

  return (
    <div className="space-y-6 pb-4">
      {showCarousel ? (
        <HeroCarousel matches={allUpcoming} />
      ) : (
        <Hero />
      )}

      {allLive.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-white">🔥 Live Now</h2>
            <a href="/live" className="text-primary text-sm font-medium">View All</a>
          </div>
          <div className="space-y-3">
            {allLive.map((match) => (
              <MatchCard
                key={match.fixture.id}
                match={match}
                isLive={true}
                showOdds={true}
              />
            ))}
          </div>
        </section>
      )}

      {!showCarousel && allUpcoming.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-3">📅 Upcoming Matches</h2>
          <div className="space-y-3">
            {allUpcoming.map((match) => (
              <MatchCard
                key={match.fixture.id}
                match={match}
                isLive={false}
                showOdds={true}
              />
            ))}
          </div>
        </section>
      )}

      {allLive.length === 0 && allUpcoming.length === 0 && (
        <EmptyState
          icon="⚽"
          title="No matches available"
          message="Check back later for upcoming matches."
          actionText={isAdmin ? "Go to Admin" : undefined}
          actionLink={isAdmin ? "/admin" : undefined}
        />
      )}
    </div>
  )
}

export default Home