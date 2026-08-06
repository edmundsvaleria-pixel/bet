import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useBet } from './BetContext'

const MatchEngineContext = createContext()

export const MatchEngineProvider = ({ children }) => {
  const [customMatches, setCustomMatches] = useState(() => {
    const saved = localStorage.getItem('betzone_custom_matches')
    return saved ? JSON.parse(saved) : []
  })
  const [matchHistory, setMatchHistory] = useState(() => {
    const saved = localStorage.getItem('betzone_match_history')
    return saved ? JSON.parse(saved) : []
  })

  const { settleBetsForMatch } = useBet()
  const intervalRef = useRef(null)
  const processingRef = useRef(false)

  useEffect(() => {
    localStorage.setItem('betzone_custom_matches', JSON.stringify(customMatches))
  }, [customMatches])

  useEffect(() => {
    localStorage.setItem('betzone_match_history', JSON.stringify(matchHistory))
  }, [matchHistory])

  const generateGoalMinutes = (count) => {
    if (count === 0) return []
    const minutes = new Set()
    while (minutes.size < count) {
      const minute = Math.floor(Math.random() * 89) + 1
      minutes.add(minute)
    }
    return Array.from(minutes).sort((a, b) => a - b)
  }

  const addCustomMatch = (match) => {
    const finalHome = match.finalHomeScore || 0
    const finalAway = match.finalAwayScore || 0

    const homeGoals = finalHome > 0 ? finalHome : Math.floor(Math.random() * 6)
    const awayGoals = finalAway > 0 ? finalAway : Math.floor(Math.random() * 6)

    // Use custom minutes if provided, else random
    const homeMinutes = match.homeGoalMinutes?.length > 0
      ? match.homeGoalMinutes
      : generateGoalMinutes(homeGoals)

    const awayMinutes = match.awayGoalMinutes?.length > 0
      ? match.awayGoalMinutes
      : generateGoalMinutes(awayGoals)

    const newMatch = {
      ...match,
      id: Date.now(),
      status: 'upcoming',
      goals: { home: 0, away: 0 },
      elapsed: 0,
      events: [],
      goalTimeline: [],
      createdAt: new Date().toISOString(),
      markets: match.markets || {},
      goalSchedule: { home: homeMinutes, away: awayMinutes },
      finalHomeScore: homeGoals,
      finalAwayScore: awayGoals,
      halftimeScore: null,
    }
    setCustomMatches(prev => [...prev, newMatch])
    return newMatch
  }

  // ... (keep the rest of the updateMatch, deleteMatch, archiveMatch, and the simulation effect exactly as before)
  // The simulation effect already uses the goalSchedule to place goals at exact minutes.

  // ... rest of the context unchanged ...

  return (
    <MatchEngineContext.Provider
      value={{ customMatches, matchHistory, addCustomMatch, updateMatch, deleteMatch, archiveMatch }}
    >
      {children}
    </MatchEngineContext.Provider>
  )
}

export const useMatchEngine = () => {
  const context = useContext(MatchEngineContext)
  if (!context) throw new Error('useMatchEngine must be used within a MatchEngineProvider')
  return context
}