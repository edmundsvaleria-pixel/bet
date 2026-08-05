import supabase from '../../lib/supabase'

export const analyticsService = {
  async getStats() {
    try {
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      if (usersError) throw usersError

      const { count: activeUsers, error: activeError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
      if (activeError) throw activeError

      const { count: totalBets, error: betsError } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
      if (betsError) throw betsError

      const { count: openBets, error: openError } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open')
      if (openError) throw openError

      const { count: wonBets, error: wonError } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'won')
      if (wonError) throw wonError

      const { count: lostBets, error: lostError } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'lost')
      if (lostError) throw lostError

      const { data: volumeData, error: volumeError } = await supabase
        .from('bets')
        .select('stake')
      if (volumeError) throw volumeError
      const totalVolume = volumeData.reduce((sum, b) => sum + b.stake, 0)

      const { data: depositData, error: depositError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'deposit')
        .eq('status', 'completed')
      if (depositError) throw depositError
      const totalDeposits = depositData.reduce((sum, t) => sum + t.amount, 0)

      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'withdrawal')
        .eq('status', 'completed')
      if (withdrawalError) throw withdrawalError
      const totalWithdrawals = withdrawalData.reduce((sum, t) => sum + t.amount, 0)

      const { data: winData, error: winError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'win')
      if (winError) throw winError
      const totalWinnings = winData.reduce((sum, t) => sum + t.amount, 0)

      const { data: matchData, error: matchError } = await supabase
        .from('custom_matches')
        .select('status')
      if (matchError) throw matchError

      const liveMatches = matchData.filter(m => m.status === 'live').length
      const upcomingMatches = matchData.filter(m => m.status === 'upcoming').length
      const finishedMatches = matchData.filter(m => m.status === 'finished').length

      return {
        totalUsers,
        activeUsers,
        totalBets,
        openBets,
        wonBets,
        lostBets,
        totalVolume,
        totalDeposits,
        totalWithdrawals,
        totalWinnings,
        liveMatches,
        upcomingMatches,
        finishedMatches,
        totalMatches: matchData.length,
        winRate: totalBets > 0 ? (wonBets / totalBets) * 100 : 0,
      }
    } catch (error) {
      console.error('Get stats error:', error)
      return null
    }
  },
}