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

  const addCustomMatch = (match) => {
    const finalHome = match.finalHomeScore || 0
    const finalAway = match.finalAwayScore || 0

    const homeGoals = finalHome > 0 ? finalHome : Math.floor(Math.random() * 6)
    const awayGoals = finalAway > 0 ? finalAway : Math.floor(Math.random() * 6)

    const generateGoalMinutes = (count) => {
      if (count === 0) return []
      const minutes = new Set()
      while (minutes.size < count) {
        const minute = Math.floor(Math.random() * 89) + 1
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
      const archived = { ...match, archivedAt: new Date().toISOString(), status: 'archived' }
      setMatchHistory(prev => [...prev, archived])
      deleteMatch(id)
    }
  }

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
        if (m.status === 'upcoming' && new Date(m.startTime) <= now) {
          changesMade = true
          return { ...m, status: 'live', elapsed: 0 }
        }

        if (m.status === 'live') {
          let newGoals = { ...m.goals }
          let events = [...(m.events || [])]
          let goalTimeline = [...(m.goalTimeline || [])]
          let newElapsed = (m.elapsed || 0) + 1

          const schedule = m.goalSchedule || { home: [], away: [] }
          const homeMinutes = schedule.home || []
          const awayMinutes = schedule.away || []

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

          let halftimeScore = m.halftimeScore
          if (newElapsed === 45) {
            halftimeScore = { home: newGoals.home, away: newGoals.away }
          }

          // Set status to 'HT' exactly at 45
          let status = 'LIVE'
          if (newElapsed === 45) {
            status = 'HT'
          }

          if (newElapsed >= 90) {
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
              elapsed: 90,
              status: 'finished',
              events,
              goalTimeline,
              finishedAt: new Date().toISOString(),
              result,
              halftimeScore,
            }
          }

          if (newGoals.home !== m.goals.home || newGoals.away !== m.goals.away || newElapsed !== m.elapsed) {
            changesMade = true
          }

          // Update fixture status for display
          const fixtureStatus = {
            short: status === 'HT' ? 'HT' : 'LIVE',
            elapsed: newElapsed,
            long: status === 'HT' ? 'Half-time' : 'Live',
          }

          // For match card display, we need to update the fixture.status
          // But we can't modify the fixture directly, so we'll add a custom field
          const updatedMatch = {
            ...m,
            goals: newGoals,
            elapsed: newElapsed,
            events,
            goalTimeline,
            halftimeScore,
          }

          // Add fixture status for display
          updatedMatch.fixtureStatus = fixtureStatus

          return updatedMatch
        }
        return m
      })

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
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [customMatches, settleBetsForMatch])

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