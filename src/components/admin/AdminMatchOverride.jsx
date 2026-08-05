import { useState } from 'react'
import { useMatchEngine } from '../../context/MatchEngineContext'
import { useBet } from '../../context/BetContext'
import { useNotification } from '../../context/NotificationContext'
import ConfirmModal from '../common/ConfirmModal'

const AdminMatchOverride = () => {
  const { customMatches, updateMatch } = useMatchEngine()
  const { settleBetsForMatch } = useBet()
  const { showNotification } = useNotification()
  const [selectedMatch, setSelectedMatch] = useState('')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [matchData, setMatchData] = useState(null)

  const liveOrFinished = customMatches.filter(m => m.status === 'live' || m.status === 'finished')

  const handleOverride = () => {
    if (!selectedMatch) {
      showNotification('Select a match', 'error')
      return
    }
    const home = parseInt(homeScore)
    const away = parseInt(awayScore)
    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      showNotification('Invalid scores', 'error')
      return
    }

    const match = customMatches.find(m => m.id === parseInt(selectedMatch))
    if (!match) {
      showNotification('Match not found', 'error')
      return
    }

    setMatchData({ match, home, away })
    setShowConfirm(true)
  }

  const confirmOverride = () => {
    if (!matchData) return
    const { match, home, away } = matchData

    const updates = {
      goals: { home, away },
      status: 'finished',
      elapsed: 90,
      result: { homeScore: home, awayScore: away, homeName: match.homeTeam, awayName: match.awayTeam },
      finishedAt: new Date().toISOString(),
    }
    updateMatch(match.id, updates)

    const matchId = `custom_${match.id}`
    settleBetsForMatch(matchId, { homeScore: home, awayScore: away, homeName: match.homeTeam, awayName: match.awayTeam })

    showNotification(`Match ${match.homeTeam} vs ${match.awayTeam} overridden to ${home}:${away} and settled.`, 'success')
    setHomeScore('')
    setAwayScore('')
    setMatchData(null)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">Match Score Override</h3>
      <div>
        <label className="text-sm text-gray-400 block">Select Match</label>
        <select
          value={selectedMatch}
          onChange={(e) => setSelectedMatch(e.target.value)}
          className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white text-sm"
        >
          <option value="">Choose match</option>
          {liveOrFinished.map(m => (
            <option key={m.id} value={m.id}>
              {m.homeTeam} vs {m.awayTeam} ({m.status}) {m.status === 'live' ? m.elapsed + '\'' : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-400 block">Home Score</label>
          <input
            type="number"
            min="0"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block">Away Score</label>
          <input
            type="number"
            min="0"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white"
          />
        </div>
      </div>
      <button
        onClick={handleOverride}
        className="bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
      >
        Override & Settle
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false)
          setMatchData(null)
        }}
        onConfirm={confirmOverride}
        title="Confirm Match Override"
        message={`This will set ${matchData?.match?.homeTeam} vs ${matchData?.match?.awayTeam} to ${matchData?.home}:${matchData?.away} and settle all bets. This action cannot be undone.`}
        confirmText="Confirm Override"
        cancelText="Cancel"
        confirmColor="bg-red-500 hover:bg-red-600"
      />
    </div>
  )
}

export default AdminMatchOverride