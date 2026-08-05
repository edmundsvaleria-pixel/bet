import { useState } from 'react'
import { useSupabase } from '../context/SupabaseContext'
import { useMatchEngine } from '../context/MatchEngineContext'
import CustomMatchForm from '../components/admin/CustomMatchForm'
import MatchList from '../components/admin/MatchList'
import UserList from '../components/admin/UserList'
import WithdrawalRequests from '../components/admin/WithdrawalRequests'
import AdminSupport from '../components/admin/AdminSupport'
import AdminSettlements from '../components/admin/AdminSettlements'
import AdminBalanceManager from '../components/admin/AdminBalanceManager'
import AdminUserManager from '../components/admin/AdminUserManager'
import AdminSystemSettings from '../components/admin/AdminSystemSettings'
import AdminMatchOverride from '../components/admin/AdminMatchOverride'
import AdminManualGoal from '../components/admin/AdminManualGoal'
import AdminActivityLog from '../components/admin/AdminActivityLog'
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard'
import { Users, Calendar, DollarSign, BarChart3, MessageCircle, Trophy, Settings, UserPlus, Target, Activity } from 'lucide-react'

const AdminDashboard = () => {
  const { user } = useSupabase()
  const { customMatches, matchHistory } = useMatchEngine()
  const [activeTab, setActiveTab] = useState('matches')

  // 🔒 SECURITY: Block non-admin access
  if (!user || user.role !== 'admin') {
    return (
      <div className="py-4 text-center">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">You do not have permission to view this page.</p>
          <a href="/" className="inline-block bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-lg transition">
            Go Home
          </a>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'matches', label: 'Custom Matches', icon: Calendar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
    { id: 'support', label: 'Support', icon: MessageCircle },
    { id: 'settlements', label: 'Settlements', icon: Trophy },
    { id: 'balance', label: 'Balance Manager', icon: DollarSign },
    { id: 'usermanage', label: 'User Manager', icon: UserPlus },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'override', label: 'Match Override', icon: Target },
    { id: 'goal', label: 'Manual Goal', icon: Target },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-white mb-4">Admin Dashboard</h1>
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-card text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-card rounded-2xl p-4 border border-white/5">
        {activeTab === 'matches' && (
          <div className="space-y-6">
            <CustomMatchForm />
            <MatchList matches={customMatches} />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Match History</h3>
              <MatchList matches={matchHistory} isHistory />
            </div>
          </div>
        )}
        {activeTab === 'users' && <UserList />}
        {activeTab === 'withdrawals' && <WithdrawalRequests />}
        {activeTab === 'support' && <AdminSupport />}
        {activeTab === 'settlements' && <AdminSettlements />}
        {activeTab === 'balance' && <AdminBalanceManager />}
        {activeTab === 'usermanage' && <AdminUserManager />}
        {activeTab === 'settings' && <AdminSystemSettings />}
        {activeTab === 'override' && <AdminMatchOverride />}
        {activeTab === 'goal' && <AdminManualGoal />}
        {activeTab === 'activity' && <AdminActivityLog />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </div>
    </div>
  )
}

export default AdminDashboard