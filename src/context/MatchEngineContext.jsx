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

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('betzone_custom_matches', JSON.stringify(customMatches))
  }, [customMatches])

  useEffect(() => {
    localStorage.setItem('betzone_match_history', JSON.stringify(matchHistory))
  }, [matchHistory])

  // Add a custom match with final score and goal schedule
  const addCustomMatch = (match) => {
    // Determine final scores
    const finalHome = match.finalHomeScore || 0
    const finalAway = match.finalAwayScore || 0

    // If no final scores set, generate random ones (0-5 each)
    const homeGoals = finalHome > 0 ? finalHome : Math.floor(Math.random() * 6)
    const awayGoals = finalAway > 0 ? finalAway : Math.floor(Math.random() * 6)

    // Generate random goal minutes (unique, 1-89)
    const generateGoalMinutes = (count) => {
      if (count === 0) return []
      const minutes = new Set()
      while (minutes.size < count) {
        const minute = Math.floor(Math.random() * 89) + 1 // 1-89
        minutes.add(minute)
      }
      return Array.from(minutes).sort((a, b) => a - b)
    }

    const homeMinutes = generateGoalMinutes(homeGoals)
    const awayMinutes = generateGoalMinutes(awayGoals)

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
      goalSchedule: {
        home: homeMinutes,
        away: awayMinutes,
      },
      finalHomeScore: homeGoals,
      finalAwayScore: awayGoals,
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

  // Main simulation effect – runs every second
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
        // Auto-start when time arrives
        if (m.status === 'upcoming' && new Date(m.startTime) <= now) {
          changesMade = true
          return { ...m, status: 'live', elapsed: 0 }
        }

        // Live simulation
        if (m.status === 'live') {
          let newGoals = { ...m.goals }
          let events = [...(m.events || [])]
          let goalTimeline = [...(m.goalTimeline || [])]
          let newElapsed = (m.elapsed || 0) + 1

          // Use the goal schedule
          const schedule = m.goalSchedule || { home: [], away: [] }
          const homeMinutes = schedule.home || []
          const awayMinutes = schedule.away || []

          // Check if current minute is in the schedule
          if (homeMinutes.includes(newElapsed)) {
            newGoals.home += 1
            events.push({ minute: newElapsed, team: 'home', type: 'goal' })
            goalTimeline.push({ minute: newElapsed, team: 'home', score: { ...newGoals } })
          }
          if (awayMinutes.includes(newElapsed)) {
            newGoals.away += 1
            events.push({ minute: newElapsed, team: 'away', type: 'goal' })
            goalTimeline.push({ minute: newElapsed, team: 'away', score: { ...newGoals } })
          }

          // Check if match finished (90 mins)
          if (newElapsed >= 90) {
            changesMade = true
            const result = {
              homeScore: newGoals.home,
              awayScore: newGoals.away,
              homeName: m.homeTeam,
              awayName: m.awayTeam,
            }
            matchesToSettle.push({ matchId: m.id, result })
            return {
              ...m,
              goals: newGoals,
              elapsed: 90,
              status: 'finished',
              events,
              goalTimeline,
              finishedAt: new Date().toISOString(),
              result,
            }
          }

          if (newGoals.home !== m.goals.home || newGoals.away !== m.goals.away || newElapsed !== m.elapsed) {
            changesMade = true
          }
          return { ...m, goals: newGoals, elapsed: newElapsed, events, goalTimeline }
        }

        return m
      })

      // Handle finished matches – archive after 10 seconds
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
        setMatchHistory(prev => [
          ...prev,
          ...toArchive.map(m => ({ ...m, archivedAt: new Date().toISOString() }))
        ])
      }

      // Settle bets for finished matches
      if (matchesToSettle.length > 0) {
        setTimeout(() => {
          matchesToSettle.forEach(({ matchId, result }) => {
            const matchIdStr = `custom_${matchId}`
            settleBetsForMatch(matchIdStr, result)
          })
        }, 100)
      }

      if (changesMade) {
        setCustomMatches(kept)
      } else if (toArchive.length > 0) {
        setCustomMatches(kept)
      }

      processingRef.current = false
    }, 1000)

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