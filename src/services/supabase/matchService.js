import supabase from '../../lib/supabase'
import { authService } from './authService'

export const matchService = {
  async createCustomMatch(matchData) {
    try {
      const { data, error } = await supabase
        .from('custom_matches')
        .insert({
          home_team: matchData.homeTeam,
          away_team: matchData.awayTeam,
          league: matchData.league,
          start_time: matchData.startTime,
          odds_h2h_home: matchData.odds?.h2h?.home || 0,
          odds_h2h_draw: matchData.odds?.h2h?.draw || 0,
          odds_h2h_away: matchData.odds?.h2h?.away || 0,
          odds_over_under: matchData.odds?.overUnder || 0,
          odds_correct_score: matchData.odds?.correctScore || 0,
          odds_htft: matchData.odds?.htft || 0,
          status: 'upcoming',
          goals_home: 0,
          goals_away: 0,
          elapsed: 0,
        })
        .select()
        .single()
      if (error) throw error
      await authService.logActivity(matchData.adminId, 'create_match', `Created match: ${matchData.homeTeam} vs ${matchData.awayTeam}`)
      return { success: true, match: data }
    } catch (error) {
      console.error('Create custom match error:', error)
      return { success: false, error: error.message }
    }
  },

  async getCustomMatches() {
    try {
      const { data, error } = await supabase
        .from('custom_matches')
        .select('*')
        .order('start_time', { ascending: true })
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get custom matches error:', error)
      return []
    }
  },

  async getLiveCustomMatches() {
    try {
      const { data, error } = await supabase
        .from('custom_matches')
        .select('*')
        .eq('status', 'live')
        .order('start_time', { ascending: true })
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get live custom matches error:', error)
      return []
    }
  },

  async updateMatch(matchId, updates) {
    try {
      const { data, error } = await supabase
        .from('custom_matches')
        .update(updates)
        .eq('id', matchId)
        .select()
        .single()
      if (error) throw error
      return { success: true, match: data }
    } catch (error) {
      console.error('Update match error:', error)
      return { success: false, error: error.message }
    }
  },

  async deleteMatch(matchId) {
    try {
      const { error } = await supabase
        .from('custom_matches')
        .delete()
        .eq('id', matchId)
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Delete match error:', error)
      return { success: false, error: error.message }
    }
  },

  async getMatchHistory() {
    try {
      const { data, error } = await supabase
        .from('custom_matches')
        .select('*')
        .eq('status', 'finished')
        .order('finished_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get match history error:', error)
      return []
    }
  },

  async addGoal(matchId, team, adminId) {
    try {
      const match = await this.getCustomMatch(matchId)
      if (!match) return { success: false, error: 'Match not found' }
      const goalsHome = team === 'home' ? match.goals_home + 1 : match.goals_home
      const goalsAway = team === 'away' ? match.goals_away + 1 : match.goals_away
      const { data, error } = await supabase
        .from('custom_matches')
        .update({
          goals_home: goalsHome,
          goals_away: goalsAway,
          events: [...(match.events || []), { minute: match.elapsed || 0, team, type: 'goal' }],
          goal_timeline: [...(match.goal_timeline || []), { minute: match.elapsed || 0, team, score: { home: goalsHome, away: goalsAway } }],
        })
        .eq('id', matchId)
        .select()
        .single()
      if (error) throw error
      await authService.logActivity(adminId, 'manual_goal', `Added goal for ${team}`)
      return { success: true, match: data }
    } catch (error) {
      console.error('Add goal error:', error)
      return { success: false, error: error.message }
    }
  },

  async overrideMatch(matchId, homeScore, awayScore, adminId) {
    try {
      const match = await this.getCustomMatch(matchId)
      if (!match) return { success: false, error: 'Match not found' }
      const { data, error } = await supabase
        .from('custom_matches')
        .update({
          goals_home: homeScore,
          goals_away: awayScore,
          status: 'finished',
          elapsed: 90,
          finished_at: new Date().toISOString(),
          result: JSON.stringify({ homeScore, awayScore }),
        })
        .eq('id', matchId)
        .select()
        .single()
      if (error) throw error
      await authService.logActivity(adminId, 'match_override', `Overrode match to ${homeScore}:${awayScore}`)
      return { success: true, match: data }
    } catch (error) {
      console.error('Override match error:', error)
      return { success: false, error: error.message }
    }
  },

  async getCustomMatch(matchId) {
    try {
      const { data, error } = await supabase
        .from('custom_matches')
        .select('*')
        .eq('id', matchId)
        .single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get custom match error:', error)
      return null
    }
  },
}