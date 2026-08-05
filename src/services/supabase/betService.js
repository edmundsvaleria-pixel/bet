// src/services/supabase/betService.js
import supabase from '../../lib/supabase'
import { authService } from './authService'
import { walletService } from './walletService'

export const betService = {
  // Place a bet
  async placeBet(userId, selections, stake, totalOdds, potentialWin) {
    try {
      // 1. Check balance – fetch current
      const { data: current, error: fetchError } = await supabase
        .from('balances')
        .select('available')
        .eq('user_id', userId)
        .single()

      if (fetchError) throw fetchError

      if ((current?.available || 0) < stake) {
        return { success: false, error: 'Insufficient balance' }
      }

      const newAvailable = (current?.available || 0) - stake

      // 2. Deduct from available balance
      const { error: balanceError } = await supabase
        .from('balances')
        .update({ available: newAvailable })
        .eq('user_id', userId)

      if (balanceError) throw balanceError

      // 3. Create bet record
      const { data: bet, error: betError } = await supabase
        .from('bets')
        .insert({
          user_id: userId,
          selections: selections.map(s => ({
            matchId: s.matchId,
            market: s.market,
            odds: s.odds,
            label: s.label,
          })),
          stake,
          total_odds: totalOdds,
          potential_win: potentialWin,
          status: 'open',
        })
        .select()
        .single()

      if (betError) throw betError

      // 4. Add transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'bet',
        amount: -stake,
        description: `Bet placed on ${selections.length} selection(s)`,
        status: 'completed',
      })

      // 5. Log activity
      await authService.logActivity(userId, 'place_bet', `Placed bet of ${stake}`)

      return { success: true, bet }
    } catch (error) {
      console.error('Place bet error:', error)
      return { success: false, error: error.message }
    }
  },

  // Get user bets
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

  // Get all open bets (admin)
  async getOpenBets() {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          users:user_id (name, email, phone)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Get open bets error:', error)
      return []
    }
  },

  // Settle bet (admin)
  async settleBet(betId, status) {
    try {
      // 1. Get bet first
      const { data: bet, error: betError } = await supabase
        .from('bets')
        .select('*')
        .eq('id', betId)
        .single()

      if (betError) throw betError
      if (bet.status !== 'open') {
        return { success: false, error: 'Bet already settled' }
      }

      // 2. Update bet status
      const { data: updatedBet, error: updateError } = await supabase
        .from('bets')
        .update({
          status,
          settled: true,
          settled_at: new Date().toISOString(),
        })
        .eq('id', betId)
        .select()
        .single()

      if (updateError) throw updateError

      // 3. If won, credit withdrawable balance
      if (status === 'won') {
        const winnings = bet.stake * bet.total_odds

        // Fetch current withdrawable balance
        const { data: current, error: fetchError } = await supabase
          .from('balances')
          .select('withdrawable')
          .eq('user_id', bet.user_id)
          .single()

        if (fetchError) throw fetchError

        const newWithdrawable = (current?.withdrawable || 0) + winnings

        await supabase
          .from('balances')
          .update({ withdrawable: newWithdrawable })
          .eq('user_id', bet.user_id)

        // Add win transaction
        await supabase.from('transactions').insert({
          user_id: bet.user_id,
          type: 'win',
          amount: winnings,
          description: `Bet won: ${betId}`,
          status: 'completed',
        })
      }

      // 4. If void, refund stake
      if (status === 'void') {
        const { data: current, error: fetchError } = await supabase
          .from('balances')
          .select('available')
          .eq('user_id', bet.user_id)
          .single()

        if (fetchError) throw fetchError

        const newAvailable = (current?.available || 0) + bet.stake

        await supabase
          .from('balances')
          .update({ available: newAvailable })
          .eq('user_id', bet.user_id)

        // Add refund transaction
        await supabase.from('transactions').insert({
          user_id: bet.user_id,
          type: 'refund',
          amount: bet.stake,
          description: `Bet voided: ${betId}`,
          status: 'completed',
        })
      }

      // 5. Log activity
      await authService.logActivity(bet.user_id, 'bet_settled', `Bet ${status}`)

      return { success: true, bet: updatedBet }
    } catch (error) {
      console.error('Settle bet error:', error)
      return { success: false, error: error.message }
    }
  },

  // Auto-settle bets for a match
  async autoSettleMatch(matchId, result) {
    try {
      // Get all open bets for this match
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

          if (market === '1X2_home') {
            selectionWins = homeScore > awayScore
          } else if (market === '1X2_draw') {
            selectionWins = homeScore === awayScore
          } else if (market === '1X2_away') {
            selectionWins = homeScore < awayScore
          } else if (market.startsWith('over_')) {
            const line = parseFloat(market.split('_')[1])
            const total = homeScore + awayScore
            selectionWins = total > line
          } else if (market.startsWith('under_')) {
            const line = parseFloat(market.split('_')[1])
            const total = homeScore + awayScore
            selectionWins = total < line
          } else if (market === 'correct_score') {
            // For correct score, we need exact score
            // We store the predicted score in label or separate field; skip for now
            selectionWins = false
          } else if (market === 'htft') {
            // Skip for now
            selectionWins = false
          } else {
            selectionWins = false
          }

          if (!selectionWins) {
            betWins = false
            break
          }
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