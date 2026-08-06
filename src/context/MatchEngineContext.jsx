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
      elapsedSeconds: 0,
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

  const updateMatch = (id, updates) => {
    setCustomMatches(prev =>
      prev.map(m => m.id === id ? { ...m, ...updates } : m)
    )
  }

  const deleteMatch = (id) => {
    setCustomMatches(prev => prev.filter(m => m.id !== id))
  }

  const archiveMatch = (id) => {
    const match = customMatches.find(m => m.id === id)
    if (match) {
      const archived = {
        ...match,
        archivedAt: new Date().toISOString(),
        status: 'archived',
      }
      setMatchHistory(prev => [...prev, archived])
      deleteMatch(id)
    }
  }

  // Real‑time simulation – runs every second
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      if (processingRef.current) return
      processingRef.current = true

      const now = new Date()
      let updatedMatches = [...customMatches]
      let changesMade = false
      let matchesToSettle = []
      let matchesToArchive = []

      updatedMatches = updatedMatches.map(m => {
        // Auto‑start
        if (m.status === 'upcoming' && new Date(m.startTime) <= now) {
          changesMade = true
          return { ...m, status: 'live', elapsedSeconds: 0 }
        }

        if (m.status === 'live') {
          let newGoals = { ...m.goals }
          let events = [...(m.events || [])]
          let goalTimeline = [...(m.goalTimeline || [])]
          // ✅ Real‑time: add 1 second per tick
          let newElapsedSeconds = (m.elapsedSeconds || 0) + 1

          // Check if a goal should happen at this second
          const schedule = m.goalSchedule || { home: [], away: [] }
          const homeMinutes = schedule.home || []
          const awayMinutes = schedule.away || []
          // Compute current minute (rounded down)
          const currentMinute = Math.floor(newElapsedSeconds / 60)

          // If we crossed a minute boundary, check for goals
          const prevMinute = Math.floor((newElapsedSeconds - 1) / 60)
          if (currentMinute !== prevMinute) {
            if (homeMinutes.includes(currentMinute)) {
              newGoals.home += 1
              events.push({ minute: currentMinute, team: 'home', type: 'goal' })
              goalTimeline.push({ minute: currentMinute, team: 'home', score: { ...newGoals } })
            }
            if (awayMinutes.includes(currentMinute)) {
              newGoals.away += 1
              events.push({ minute: currentMinute, team: 'away', type: 'goal' })
              goalTimeline.push({ minute: currentMinute, team: 'away', score: { ...newGoals } })
            }
          }

          let halftimeScore = m.halftimeScore
          // Half‑time at exactly 2700 seconds (45 minutes)
          if (newElapsedSeconds === 2700) {
            halftimeScore = { home: newGoals.home, away: newGoals.away }
          }

          let status = 'LIVE'
          if (newElapsedSeconds === 2700) {
            status = 'HT'
          }

          // Full‑time at 5400 seconds (90 minutes)
          if (newElapsedSeconds >= 5400) {
            changesMade = true
            const result = {
              homeScore: newGoals.home,
              awayScore: newGoals.away,
              homeName: m.homeTeam,
              awayName: m.awayTeam,
              halftimeHome: halftimeScore?.home ?? 0,
              halftimeAway: halftimeScore?.away ?? 0,
            }
            matchesToSettle.push({ matchId: m.id, result })
            return {
              ...m,
              goals: newGoals,
              elapsedSeconds: 5400,
              status: 'finished',
              events,
              goalTimeline,
              finishedAt: new Date().toISOString(),
              result,
              halftimeScore,
            }
          }

          if (newGoals.home !== m.goals.home || newGoals.away !== m.goals.away || newElapsedSeconds !== m.elapsedSeconds) {
            changesMade = true
          }

          return {
            ...m,
            goals: newGoals,
            elapsedSeconds: newElapsedSeconds,
            events,
            goalTimeline,
            halftimeScore,
          }
        }
        return m
      })

      // Archive finished matches after 10 seconds
      const nowTime = now.getTime()
      const kept = []
      const toArchive = []
      updatedMatches.forEach(m => {
        if (m.status === 'finished' && m.finishedAt) {
          const finishedTime = new Date(m.finishedAt).getTime()
          if (nowTime - finishedTime > 10000) {
            toArchive.push(m)
          } else {
            kept.push(m)
          }
        } else {
          kept.push(m)
        }
      })

      if (toArchive.length > 0) {
        changesMade = true
        setMatchHistory(prev => [...prev, ...toArchive.map(m => ({ ...m, archivedAt: new Date().toISOString() }))])
      }

      if (matchesToSettle.length > 0) {
        setTimeout(() => {
          matchesToSettle.forEach(({ matchId, result }) => {
            settleBetsForMatch(`custom_${matchId}`, result)
          })
        }, 100)
      }

      if (changesMade) {
        setCustomMatches(kept)
      } else if (toArchive.length > 0) {
        setCustomMatches(kept)
      }

      processingRef.current = false
    }, 1000) // ✅ runs every 1 second

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [customMatches, settleBetsForMatch])

  return (
    <MatchEngineContext.Provider
      value={{
        customMatches,
        matchHistory,
        addCustomMatch,
        updateMatch,
        deleteMatch,
        archiveMatch,
      }}
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