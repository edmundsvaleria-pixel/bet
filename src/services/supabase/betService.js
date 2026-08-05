import supabase from '../../lib/supabase'
import { authService } from './authService'
import { walletService } from './walletService'

export const betService = {
  async placeBet(userId, selections, stake, totalOdds, potentialWin) {
    try {
      const balance = await walletService.getBalance(userId)
      if (stake > balance.available) {
        return { success: false, error: 'Insufficient balance' }
      }
      await supabase
        .from('balances')
        .update({ available: supabase.raw('available - ?', [stake]) })
        .eq('user_id', userId)
      const { data: bet, error: betError } = await supabase
        .from('bets')
        .insert({
          user_id: userId,
          selections: selections.map(s => ({ matchId: s.matchId, market: s.market, odds: s.odds, label: s.label })),
          stake,
          total_odds: totalOdds,
          potential_win: potentialWin,
          status: 'open',
        })
        .select()
        .single()
      if (betError) throw betError
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'bet',
          amount: -stake,
          description: `Bet placed on ${selections.length} selection(s)`,
          status: 'completed',
        })
      await authService.logActivity(userId, 'place_bet', `Placed bet of ${stake}`)
      return { success: true, bet }
    } catch (error) {
      console.error('Place bet error:', error)
      return { success: false, error: error.message }
    }
  },

  async getUserBets(userId, status = null) {
    try {
      let query = supabase
        .from('bets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get user bets error:', error)
      return []
    }
  },

  async getOpenBets() {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select('*, users:user_id (name, email, phone)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get open bets error:', error)
      return []
    }
  },

  async settleBet(betId, status) {
    try {
      const { data: bet, error: betError } = await supabase
        .from('bets')
        .select('*')
        .eq('id', betId)
        .single()
      if (betError) throw betError
      if (bet.status !== 'open') return { success: false, error: 'Bet already settled' }
      const { data: updatedBet, error: updateError } = await supabase
        .from('bets')
        .update({ status, settled: true, settled_at: new Date().toISOString() })
        .eq('id', betId)
        .select()
        .single()
      if (updateError) throw updateError
      if (status === 'won') {
        const winnings = bet.stake * bet.total_odds
        await supabase
          .from('balances')
          .update({ withdrawable: supabase.raw('withdrawable + ?', [winnings]) })
          .eq('user_id', bet.user_id)
        await supabase
          .from('transactions')
          .insert({
            user_id: bet.user_id,
            type: 'win',
            amount: winnings,
            description: `Bet won: ${betId}`,
            status: 'completed',
          })
      } else if (status === 'void') {
        await supabase
          .from('balances')
          .update({ available: supabase.raw('available + ?', [bet.stake]) })
          .eq('user_id', bet.user_id)
        await supabase
          .from('transactions')
          .insert({
            user_id: bet.user_id,
            type: 'refund',
            amount: bet.stake,
            description: `Bet voided: ${betId}`,
            status: 'completed',
          })
      }
      await authService.logActivity(bet.user_id, 'bet_settled', `Bet ${status}`)
      return { success: true, bet: updatedBet }
    } catch (error) {
      console.error('Settle bet error:', error)
      return { success: false, error: error.message }
    }
  },

  async autoSettleMatch(matchId, result) {
    try {
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .contains('selections', [{ matchId }])
        .eq('status', 'open')
      if (betsError) throw betsError
      const { homeScore, awayScore } = result
      for (const bet of bets) {
        let betWins = true
        for (const selection of bet.selections) {
          if (selection.matchId !== matchId) continue
          const { market } = selection
          let selectionWins = false
          if (market === '1X2_home') selectionWins = homeScore > awayScore
          else if (market === '1X2_draw') selectionWins = homeScore === awayScore
          else if (market === '1X2_away') selectionWins = homeScore < awayScore
          else if (market.startsWith('over_')) {
            const line = parseFloat(market.split('_')[1])
            const total = homeScore + awayScore
            selectionWins = total > line
          } else if (market.startsWith('under_')) {
            const line = parseFloat(market.split('_')[1])
            const total = homeScore + awayScore
            selectionWins = total < line
          } else selectionWins = false
          if (!selectionWins) { betWins = false; break }
        }
        await this.settleBet(bet.id, betWins ? 'won' : 'lost')
      }
      return { success: true }
    } catch (error) {
      console.error('Auto-settle match error:', error)
      return { success: false, error: error.message }
    }
  },
}