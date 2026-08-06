import { useState, useEffect } from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import { useBet } from '../../context/BetContext'
import { useMatchEngine } from '../../context/MatchEngineContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

const AnalyticsDashboard = () => {
  const { getAllUsers } = useSupabase()
  const { bets = [] } = useBet()
  const { customMatches = [], matchHistory = [] } = useMatchEngine()
  const [stats, setStats] = useState({})
  const [dailyData, setDailyData] = useState([])

  useEffect(() => {
    const fetchStats = async () => {
      const users = await getAllUsers()
      const openBets = bets.filter(b => b.status === 'open')
      const wonBets = bets.filter(b => b.status === 'won')
      const lostBets = bets.filter(b => b.status === 'lost')
      const totalVolume = bets.reduce((sum, b) => sum + (b.stake || 0), 0)
      const totalWinnings = bets.filter(b => b.status === 'won').reduce((sum, b) => sum + (b.potentialWin || 0), 0)

      const liveMatches = customMatches.filter(m => m.status === 'live').length
      const upcomingMatches = customMatches.filter(m => m.status === 'upcoming').length
      const finishedMatches = customMatches.filter(m => m.status === 'finished').length

      setStats({
        totalUsers: users?.length || 0,
        activeUsers: users?.filter(u => u.active !== false).length || 0,
        totalBets: bets.length,
        openBets: openBets.length,
        wonBets: wonBets.length,
        lostBets: lostBets.length,
        totalVolume,
        totalWinnings,
        liveMatches,
        upcomingMatches,
        finishedMatches,
        totalMatches: customMatches.length + matchHistory.length,
        winRate: bets.length > 0 ? (wonBets.length / bets.length) * 100 : 0,
      })

      // Daily revenue (mock – in production you'd query transactions grouped by date)
      // For demo, we'll create dummy data from bets
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
      }).reverse()

      const dailyRevenue = last7Days.map(date => {
        const dayBets = bets.filter(b => b.date?.startsWith(date))
        return {
          date: date.slice(5), // MM-DD
          revenue: dayBets.reduce((sum, b) => sum + b.stake, 0),
          bets: dayBets.length,
          winnings: dayBets.filter(b => b.status === 'won').reduce((sum, b) => sum + (b.potentialWin || 0), 0),
        }
      })
      setDailyData(dailyRevenue)
    }

    fetchStats()
  }, [bets, customMatches, matchHistory, getAllUsers])

  const StatCard = ({ title, value, color = 'text-primary', subtitle = '' }) => (
    <div className="bg-dark/50 rounded-lg p-4 border border-white/5">
      <div className="text-sm text-gray-400">{title}</div>
      <div className={`text-2xl font-bold ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  )

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white">Analytics Dashboard</h3>
      
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Users" value={stats.totalUsers} color="text-blue-400" />
        <StatCard title="Active Users" value={stats.activeUsers} color="text-green-400" />
        <StatCard title="Total Bets" value={stats.totalBets} color="text-white" />
        <StatCard title="Win Rate" value={`${stats.winRate?.toFixed(1) || 0}%`} color="text-yellow-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Open Bets" value={stats.openBets} color="text-yellow-400" />
        <StatCard title="Won" value={stats.wonBets} color="text-green-400" />
        <StatCard title="Lost" value={stats.lostBets} color="text-red-400" />
        <StatCard title="Live Matches" value={stats.liveMatches} color="text-red-400" />
      </div>

      {/* Revenue Chart */}
      {dailyData.length > 0 && (
        <div className="bg-dark/50 rounded-lg p-4 border border-white/5">
          <h4 className="text-sm font-medium text-gray-400 mb-4">Daily Activity (Last 7 Days)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#333' }} />
              <Legend />
              <Bar dataKey="bets" fill="#2563EB" name="Bets Placed" />
              <Bar dataKey="revenue" fill="#FACC15" name="Revenue (GHS)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Match stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Matches" value={stats.totalMatches} color="text-white" />
        <StatCard title="Upcoming" value={stats.upcomingMatches} color="text-blue-400" />
        <StatCard title="Finished" value={stats.finishedMatches} color="text-gray-400" />
        <StatCard title="Total Volume" value={`GHS ${stats.totalVolume?.toFixed(2) || '0.00'}`} color="text-green-400" />
      </div>
    </div>
  )
}

export default AnalyticsDashboard