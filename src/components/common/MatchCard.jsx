import React from 'react'
import { Link } from 'react-router-dom'
import { useBet } from '../../context/BetContext'

// ✅ Generate a consistent color based on team name
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

// ✅ Get first letter (uppercase) of team name
const getInitials = (name) => {
  return name?.charAt(0)?.toUpperCase() || '?'
}

const MatchCard = ({ match, isLive = false, showOdds = true }) => {
  const { addSelection } = useBet()
  if (!match) return null

  const homeTeam = match.teams?.home?.name || 'TBD'
  const awayTeam = match.teams?.away?.name || 'TBD'
  const homeLogo = match.teams?.home?.logo
  const awayLogo = match.teams?.away?.logo
  const leagueName = match.league?.name || 'Unknown League'
  const leagueLogo = match.league?.logo
  const homeScore = match.goals?.home ?? '-'
  const awayScore = match.goals?.away ?? '-'

  let elapsedSeconds = 0
  let status = match.fixture?.status?.short || 'NS'
  let matchTime = match.fixture?.date
    ? new Date(match.fixture.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : ''

  if (match.isCustom && match.customMatch) {
    const cm = match.customMatch
    elapsedSeconds = cm.elapsedSeconds || 0
    status = cm.status === 'live' ? 'LIVE' : cm.status === 'upcoming' ? 'NS' : 'FT'
    if (cm.status === 'HT') status = 'HT'
    matchTime = cm.startTime
      ? new Date(cm.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : ''
  } else {
    const minutes = match.fixture?.status?.elapsed || 0
    elapsedSeconds = minutes * 60
  }

  const isLiveMatch = isLive || ['LIVE', '1H', '2H', 'HT'].includes(status)
  const isHalfTime = status === 'HT' || (isLiveMatch && elapsedSeconds === 2700)

  const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const displayTime = match.isCustom
    ? formatTime(elapsedSeconds)
    : `${Math.floor(elapsedSeconds / 60)}'`

  const oddsData = match.odds || null

  const handleAddBet = (market, oddsValue, label, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!oddsValue) return
    addSelection(match.fixture.id, market, oddsValue, label)
  }

  const OddsButton = ({ label, oddsValue, market }) => {
    if (!oddsValue) return null
    return (
      <button
        onClick={(e) => handleAddBet(market, oddsValue, label, e)}
        className="bg-primary/20 hover:bg-primary text-white px-2 py-1 rounded text-xs font-bold transition flex items-center gap-1"
      >
        <span className="text-white/70">{label}</span>
        <span className="text-yellow-300">{oddsValue.toFixed(2)}</span>
      </button>
    )
  }

  const hasOdds = oddsData && (oddsData.h2h || oddsData.overUnder)

  // ✅ Render team logo – real logo if exists, otherwise first letter
  const TeamLogo = ({ name, logo, className = "w-6 h-6" }) => {
    if (logo) {
      return <img src={logo} alt={name} loading="lazy" className={`${className} object-contain rounded-full`} />
    }
    // ✅ Letter logo fallback
    const colorClass = getTeamColor(name)
    const initial = getInitials(name)
    return (
      <div className={`${className} ${colorClass} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
        {initial}
      </div>
    )
  }

  return (
    <Link to={`/match/${match.fixture.id}`} className="block">
      <div className={`bg-card rounded-lg p-3 border transition ${
        isLiveMatch ? 'border-red-500/40 hover:border-red-500/60' : 'border-white/5 hover:border-primary/30'
      }`}>
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          {leagueLogo && <img src={leagueLogo} alt={leagueName} loading="lazy" className="w-4 h-4 object-contain" />}
          <span>{leagueName}</span>
          {match.isCustom && <span className="text-xs text-yellow-400 ml-1">⭐ Custom</span>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TeamLogo name={homeTeam} logo={homeLogo} className="w-6 h-6" />
            <span className="font-medium text-sm">{homeTeam}</span>
          </div>
          <div className="text-center">
            {isLiveMatch ? (
              isHalfTime ? (
                <div className="text-sm font-bold text-yellow-400">HT</div>
              ) : (
                <>
                  <span className="text-red-500 text-sm font-bold animate-pulse">●</span>
                  <span className="text-xs text-gray-400 ml-1">{displayTime}</span>
                  <div className="text-lg font-bold">{homeScore} : {awayScore}</div>
                </>
              )
            ) : (
              <span className="text-sm text-gray-400">{matchTime}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{awayTeam}</span>
            <TeamLogo name={awayTeam} logo={awayLogo} className="w-6 h-6" />
          </div>
        </div>
        {showOdds && (
          <div className="mt-2 flex flex-wrap gap-1 justify-end">
            {hasOdds ? (
              <>
                {oddsData.h2h && (
                  <>
                    <OddsButton label="1" oddsValue={oddsData.h2h.home} market="1X2_home" />
                    <OddsButton label="X" oddsValue={oddsData.h2h.draw} market="1X2_draw" />
                    <OddsButton label="2" oddsValue={oddsData.h2h.away} market="1X2_away" />
                  </>
                )}
                {oddsData.overUnder && (
                  <OddsButton label="O/U" oddsValue={oddsData.overUnder.over} market="over" />
                )}
              </>
            ) : (
              <span className="text-xs text-gray-500">Odds unavailable</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

export default MatchCard