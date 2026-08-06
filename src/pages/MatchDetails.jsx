import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMatchEngine } from '../context/MatchEngineContext'
import { useBet } from '../context/BetContext'

// ✅ Helper functions for letter logos
const getTeamColor = (name) => {
  const colors = [
    'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-rose-500', 'bg-emerald-500',
    'bg-violet-500', 'bg-fuchsia-500', 'bg-amber-500', 'bg-lime-500'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % colors.length
  }
  return colors[hash]
}

const getInitials = (name) => name?.charAt(0)?.toUpperCase() || '?'

const TeamLogo = ({ name, logo, className = "w-10 h-10" }) => {
  if (logo) {
    return <img src={logo} alt={name} className={`${className} object-contain rounded-full`} />
  }
  const colorClass = getTeamColor(name)
  const initial = getInitials(name)
  return (
    <div className={`${className} ${colorClass} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
      {initial}
    </div>
  )
}

const MatchDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { addSelection } = useBet()
  const { customMatches } = useMatchEngine()

  useEffect(() => {
    const isCustom = id.toString().startsWith('custom_')
    const customId = isCustom ? parseInt(id.toString().replace('custom_', '')) : null

    if (!isCustom || !customId) {
      setError('Invalid match ID – only custom matches are available')
      setLoading(false)
      return
    }

    const customMatch = customMatches.find(m => m.id === customId)
    if (!customMatch) {
      setError('Match not found')
      setLoading(false)
      return
    }

    const isLive = customMatch.status === 'live'
    const isFinished = customMatch.status === 'finished'
    const elapsed = customMatch.elapsed || 0
    const isHalfTime = elapsed === 2700

    const matchData = {
      fixture: {
        id: `custom_${customMatch.id}`,
        status: {
          short: isFinished ? 'FT' : isHalfTime ? 'HT' : isLive ? 'LIVE' : 'NS',
          elapsed: elapsed,
          long: isFinished ? 'Finished' : isHalfTime ? 'Half-time' : isLive ? 'Live' : 'Not Started',
        },
        date: customMatch.startTime,
        venue: {
          name: 'Custom Match',
          city: 'BetZone',
        },
      },
      teams: {
        home: {
          name: customMatch.homeTeam,
          logo: null,
        },
        away: {
          name: customMatch.awayTeam,
          logo: null,
        },
      },
      league: {
        name: customMatch.league || 'Custom League',
        logo: null,
      },
      goals: {
        home: customMatch.goals?.home || 0,
        away: customMatch.goals?.away || 0,
      },
      isCustom: true,
      customMatch: customMatch,
    }

    setMatch(matchData)
    setLoading(false)
  }, [id, customMatches])

  const handleAddBet = (market, oddsValue, label) => {
    addSelection(id, market, oddsValue, label)
  }

  if (loading) {
    return (
      <div className="py-4 space-y-4">
        <div className="bg-card rounded-lg p-4 animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="bg-card rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
          {error}
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-primary hover:bg-primary/80 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          Go Home
        </button>
      </div>
    )
  }

  if (!match) return null

  const isLive = match.fixture.status.short === 'LIVE' || match.fixture.status.short === '1H' || match.fixture.status.short === '2H'
  const isHalfTime = match.fixture.status.short === 'HT'
  const isFinished = match.fixture.status.short === 'FT'
  const elapsed = match.fixture.status.elapsed || 0
  const homeScore = match.goals.home ?? '-'
  const awayScore = match.goals.away ?? '-'

  const oddsData = match.customMatch?.markets || null

  const OddsButton = ({ label, oddsValue, market, className = '' }) => {
    if (!oddsValue) return null
    return (
      <button
        onClick={() => handleAddBet(market, oddsValue, label)}
        className={`bg-primary/20 hover:bg-primary text-white px-3 py-1 rounded text-sm font-bold transition ${className}`}
      >
        {label} <span className="ml-1">{oddsValue.toFixed(2)}</span>
      </button>
    )
  }

  return (
    <div className="py-4 space-y-6">
      <div className="bg-card rounded-lg p-4 border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{match.league.name}</span>
          </div>
          <span className="text-xs text-gray-500">{match.fixture.venue.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo name={match.teams.home.name} logo={match.teams.home.logo} className="w-12 h-12" />
            <div>
              <div className="font-bold text-lg">{match.teams.home.name}</div>
              {isLive && <div className="text-sm font-mono text-red-500">● LIVE</div>}
              {isHalfTime && <div className="text-sm font-mono text-yellow-400">⏱️ HT</div>}
            </div>
          </div>
          <div className="text-center">
            {isHalfTime ? (
              <div className="text-2xl font-bold text-yellow-400">HT</div>
            ) : (
              <div className="text-2xl font-bold">{homeScore} : {awayScore}</div>
            )}
            {isLive && !isHalfTime && <div className="text-xs text-gray-400">{elapsed}'</div>}
            {!isLive && !isFinished && !isHalfTime && (
              <div className="text-xs text-gray-400">{match.fixture.date?.split('T')[1]?.slice(0,5) || 'Scheduled'}</div>
            )}
            {isFinished && <div className="text-xs text-gray-400">Full Time</div>}
          </div>
          <div className="flex items-center gap-3">
            <div>
              <div className="font-bold text-lg text-right">{match.teams.away.name}</div>
              {isLive && <div className="text-sm font-mono text-red-500">● LIVE</div>}
              {isHalfTime && <div className="text-sm font-mono text-yellow-400">⏱️ HT</div>}
            </div>
            <TeamLogo name={match.teams.away.name} logo={match.teams.away.logo} className="w-12 h-12" />
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          {match.fixture.status.long} • {match.fixture.venue.city}
        </div>

        {/* Half-time score display */}
        {match.isCustom && match.customMatch?.halftimeScore && (
          <div className="mt-2 p-2 bg-dark/50 rounded-lg text-center">
            <div className="text-xs text-gray-400">Half-time Score</div>
            <div className="text-sm font-bold text-yellow-400">
              {match.customMatch.halftimeScore.home} : {match.customMatch.halftimeScore.away}
            </div>
          </div>
        )}

        {match.isCustom && match.customMatch?.goalTimeline && match.customMatch.goalTimeline.length > 0 && (
          <div className="mt-2 p-2 bg-dark/50 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">⚽ Goal Timeline</div>
            <div className="flex flex-wrap gap-1">
              {match.customMatch.goalTimeline.map((g, idx) => (
                <span key={idx} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                  {g.minute}' {g.team} ({g.score.home}:{g.score.away})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Markets</h3>

        {!oddsData ? (
          <div className="bg-card rounded-lg p-4 text-center text-gray-400 border border-white/5">
            Odds are not configured for this custom match.
          </div>
        ) : (
          <>
            {/* 1X2 */}
            {oddsData.h2h && (
              <div className="bg-card rounded-lg p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-2">Match Winner (1X2)</div>
                <div className="flex gap-2 flex-wrap">
                  <OddsButton label={match.teams.home.name} oddsValue={oddsData.h2h.home} market="1X2_home" />
                  <OddsButton label="Draw" oddsValue={oddsData.h2h.draw} market="1X2_draw" />
                  <OddsButton label={match.teams.away.name} oddsValue={oddsData.h2h.away} market="1X2_away" />
                </div>
              </div>
            )}

            {/* Over/Under */}
            {Object.keys(oddsData.overUnder || {}).length > 0 && (
              <div className="bg-card rounded-lg p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-2">Over / Under</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(oddsData.overUnder).map(([line, odds]) => (
                    <div key={line} className="flex gap-2 items-center">
                      <span className="text-xs text-white w-8">O{line}</span>
                      <OddsButton label="Over" oddsValue={odds.over} market={`over_${line}`} />
                      <OddsButton label="Under" oddsValue={odds.under} market={`under_${line}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correct Score */}
            {Object.keys(oddsData.correctScore || {}).length > 0 && (
              <div className="bg-card rounded-lg p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-2">Correct Score</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(oddsData.correctScore).map(([score, odds]) => (
                    <OddsButton key={score} label={score} oddsValue={odds} market={`cs_${score}`} />
                  ))}
                </div>
              </div>
            )}

            {/* HT/FT */}
            {Object.keys(oddsData.htft || {}).length > 0 && (
              <div className="bg-card rounded-lg p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-2">Half Time / Full Time</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(oddsData.htft).map(([key, odds]) => (
                    <OddsButton key={key} label={key} oddsValue={odds} market={`htft_${key}`} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default MatchDetails