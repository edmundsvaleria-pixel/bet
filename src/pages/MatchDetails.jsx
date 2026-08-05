import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getMatchDetails } from '../services/footballApi'
import { getOddsForMatch, extractOdds } from '../services/oddsApi'
import { useMatchEngine } from '../context/MatchEngineContext'
import { useBet } from '../context/BetContext'

const MatchDetails = () => {
  const { id } = useParams()
  const [match, setMatch] = useState(null)
  const [odds, setOdds] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { addSelection } = useBet()
  const { customMatches } = useMatchEngine()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const isCustom = id.toString().startsWith('custom_')
        const customId = isCustom ? parseInt(id.toString().replace('custom_', '')) : null
        
        if (isCustom && customId) {
          const customMatch = customMatches.find(m => m.id === customId)
          if (!customMatch) {
            setError('Match not found')
            return
          }
          
          const matchData = {
            fixture: {
              id: `custom_${customMatch.id}`,
              status: {
                short: customMatch.status === 'live' ? 'LIVE' : customMatch.status === 'upcoming' ? 'NS' : 'FT',
                elapsed: customMatch.elapsed || 0,
                long: customMatch.status === 'live' ? 'Live' : customMatch.status === 'upcoming' ? 'Not Started' : 'Finished',
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
          if (customMatch.markets) {
            setOdds(customMatch.markets)
          } else {
            setOdds(null)
          }
        } else {
          const matchData = await getMatchDetails(id)
          if (!matchData) {
            setError('Match not found')
            return
          }
          setMatch(matchData)

          const home = matchData.teams.home.name
          const away = matchData.teams.away.name
          const date = matchData.fixture.date.split('T')[0]
          const league = matchData.league.name
          const oddsData = await getOddsForMatch(home, away, date, league)
          if (oddsData) {
            const extracted = extractOdds(oddsData)
            setOdds(extracted)
          } else {
            setOdds(null)
          }
        }
        setError(null)
      } catch (err) {
        setError('Failed to load match details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
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
      </div>
    )
  }

  if (!match) return null

  const isLive = match.fixture.status.short === 'LIVE' || match.fixture.status.short === '1H' || match.fixture.status.short === '2H'
  const elapsed = match.fixture.status.elapsed || 0
  const homeScore = match.goals.home ?? '-'
  const awayScore = match.goals.away ?? '-'

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
            <div>
              <div className="font-bold text-lg">{match.teams.home.name}</div>
              {isLive && <div className="text-sm font-mono text-red-500">● LIVE</div>}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{homeScore} : {awayScore}</div>
            {isLive ? (
              <div className="text-xs text-gray-400">{elapsed}'</div>
            ) : (
              <div className="text-xs text-gray-400">{match.fixture.date?.split('T')[1]?.slice(0,5) || 'Scheduled'}</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div>
              <div className="font-bold text-lg text-right">{match.teams.away.name}</div>
              {isLive && <div className="text-sm font-mono text-red-500">● LIVE</div>}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          {match.fixture.status.long} • {match.fixture.venue.city}
        </div>
        
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

        {/* ✅ Updated message – no "free tier limitation" text */}
        {!odds && !match.isCustom ? (
          <div className="bg-card rounded-lg p-4 text-center text-gray-400 border border-white/5">
            Odds are currently unavailable for this match.
          </div>
        ) : null}

        {/* Odds display for non-custom matches */}
        {odds && !match.isCustom && (
          <>
            {/* 1X2 */}
            {odds.h2h && (
              <div className="bg-card rounded-lg p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-2">Match Winner (1X2)</div>
                <div className="flex gap-2 flex-wrap">
                  <OddsButton label={match.teams.home.name} oddsValue={odds.h2h.home} market="1X2_home" />
                  <OddsButton label="Draw" oddsValue={odds.h2h.draw} market="1X2_draw" />
                  <OddsButton label={match.teams.away.name} oddsValue={odds.h2h.away} market="1X2_away" />
                </div>
              </div>
            )}

            {/* Over/Under */}
            {odds.overUnder && (
              <div className="bg-card rounded-lg p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-2">Over / Under</div>
                <div className="flex gap-2 flex-wrap">
                  <OddsButton label="Over" oddsValue={odds.overUnder.over} market="over" />
                  <OddsButton label="Under" oddsValue={odds.overUnder.under} market="under" />
                </div>
              </div>
            )}

            {/* Double Chance */}
            {odds.doubleChance && (
              <div className="bg-card rounded-lg p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-2">Double Chance</div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(odds.doubleChance).map(([key, val]) => (
                    <OddsButton key={key} label={key} oddsValue={val} market={`double_chance_${key}`} />
                  ))}
                </div>
              </div>
            )}

            {/* Draw No Bet */}
            {odds.drawNoBet && (
              <div className="bg-card rounded-lg p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-2">Draw No Bet</div>
                <div className="flex gap-2 flex-wrap">
                  <OddsButton label={match.teams.home.name} oddsValue={odds.drawNoBet.home} market="dnb_home" />
                  <OddsButton label={match.teams.away.name} oddsValue={odds.drawNoBet.away} market="dnb_away" />
                </div>
              </div>
            )}

            {/* Both Teams To Score */}
            {odds.btts && (
              <div className="bg-card rounded-lg p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-2">Both Teams To Score</div>
                <div className="flex gap-2 flex-wrap">
                  <OddsButton label="Yes" oddsValue={odds.btts.yes} market="btts_yes" />
                  <OddsButton label="No" oddsValue={odds.btts.no} market="btts_no" />
                </div>
              </div>
            )}

            {/* First Half Winner */}
            {odds.firstHalfWinner && (
              <div className="bg-card rounded-lg p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-2">First Half Winner</div>
                <div className="flex gap-2 flex-wrap">
                  <OddsButton label={match.teams.home.name} oddsValue={odds.firstHalfWinner.home} market="fh_winner_home" />
                  <OddsButton label="Draw" oddsValue={odds.firstHalfWinner.draw} market="fh_winner_draw" />
                  <OddsButton label={match.teams.away.name} oddsValue={odds.firstHalfWinner.away} market="fh_winner_away" />
                </div>
              </div>
            )}

            {/* Second Half Winner */}
            {odds.secondHalfWinner && (
              <div className="bg-card rounded-lg p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-2">Second Half Winner</div>
                <div className="flex gap-2 flex-wrap">
                  <OddsButton label={match.teams.home.name} oddsValue={odds.secondHalfWinner.home} market="sh_winner_home" />
                  <OddsButton label="Draw" oddsValue={odds.secondHalfWinner.draw} market="sh_winner_draw" />
                  <OddsButton label={match.teams.away.name} oddsValue={odds.secondHalfWinner.away} market="sh_winner_away" />
                </div>
              </div>
            )}
          </>
        )}

        {/* ✅ Custom Markets for Custom Matches (always show if markets exist) */}
        {match.isCustom && match.customMatch?.markets && (
          <div className="space-y-4 mt-4">
            <h3 className="text-lg font-bold text-white border-t border-white/10 pt-4">Custom Markets</h3>
            
            {/* Over/Under */}
            {Object.keys(match.customMatch.markets.overUnder || {}).length > 0 && (
              <div className="bg-card rounded-lg p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-2">Over / Under (Custom)</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(match.customMatch.markets.overUnder).map(([line, odds]) => (
                    <div key={line} className="flex gap-2 items-center">
                      <span className="text-xs text-white w-8">O{line}</span>
                      <OddsButton label="Over" oddsValue={odds.over} market={`custom_over_${line}`} />
                      <OddsButton label="Under" oddsValue={odds.under} market={`custom_under_${line}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correct Score */}
            {Object.keys(match.customMatch.markets.correctScore || {}).length > 0 && (
              <div className="bg-card rounded-lg p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-2">Correct Score</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(match.customMatch.markets.correctScore).map(([score, odds]) => (
                    <OddsButton key={score} label={score} oddsValue={odds} market={`custom_cs_${score}`} />
                  ))}
                </div>
              </div>
            )}

            {/* HT/FT */}
            {Object.keys(match.customMatch.markets.htft || {}).length > 0 && (
              <div className="bg-card rounded-lg p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-2">Half Time / Full Time</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(match.customMatch.markets.htft).map(([key, odds]) => (
                    <OddsButton key={key} label={key} oddsValue={odds} market={`custom_htft_${key}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MatchDetails