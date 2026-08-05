import { useState } from 'react'
import { useMatchEngine } from '../../context/MatchEngineContext'

const AdminManualGoal = () => {
  const { customMatches, updateMatch } = useMatchEngine()
  const [selectedMatch, setSelectedMatch] = useState('')
  const [team, setTeam] = useState('home')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const liveMatches = customMatches.filter(m => m.status === 'live')

  const handleAddGoal = () => {
    if (!selectedMatch) { setError('Select a live match'); return }
    const match = customMatches.find(m => m.id === parseInt(selectedMatch))
    if (!match) { setError('Match not found'); return }

    const newGoals = { ...match.goals }
    newGoals[team] += 1

    const events = [...(match.events || [])]
    events.push({
      minute: match.elapsed || 0,
      team,
      type: 'goal',
    })

    const goalTimeline = [...(match.goalTimeline || [])]
    goalTimeline.push({
      minute: match.elapsed || 0,
      team,
      score: { ...newGoals },
    })

    updateMatch(match.id, { goals: newGoals, events, goalTimeline })
    setMessage(`Goal added for ${team} team! Score: ${newGoals.home} - ${newGoals.away}`)
    setError('')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">Manual Goal (Live Matches)</h3>
      <div>
        <label className="text-sm text-gray-400 block">Select Live Match</label>
        <select
          value={selectedMatch}
          onChange={(e) => setSelectedMatch(e.target.value)}
          className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white text-sm"
        >
          <option value="">Choose match</option>
          {liveMatches.map(m => (
            <option key={m.id} value={m.id}>
              {m.homeTeam} vs {m.awayTeam} ({m.elapsed}') - {m.goals.home}:{m.goals.away}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm text-gray-400 block">Scoring Team</label>
        <select
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white text-sm"
        >
          <option value="home">Home</option>
          <option value="away">Away</option>
        </select>
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {message && <div className="text-green-400 text-sm">{message}</div>}
      <button
        onClick={handleAddGoal}
        className="bg-yellow-500 hover:bg-yellow-400 text-dark font-bold py-2 px-4 rounded-lg transition text-sm"
      >
        Add Goal
      </button>
    </div>
  )
}

export default AdminManualGoal