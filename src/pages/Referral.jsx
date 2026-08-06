import { useState, useEffect } from 'react'
import { useSupabase } from '../context/SupabaseContext'
import { useNotification } from '../context/NotificationContext'
import { Copy, Share2, Users, Gift, RefreshCw } from 'lucide-react'
import supabase from '../lib/supabase'

const Referral = () => {
  const { user, refreshBalance } = useSupabase()
  const { showNotification } = useNotification()
  const [referralCode, setReferralCode] = useState('')
  const [referrals, setReferrals] = useState([])
  const [totalEarned, setTotalEarned] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchReferralData = async () => {
    if (!user) return
    try {
      // Get user's referral code
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('referral_code')
        .eq('id', user.id)
        .single()

      if (userError) throw userError
      setReferralCode(userData.referral_code || '')

      // Get referral earnings
      const { data: earnings, error: earningsError } = await supabase
        .from('referral_earnings')
        .select(`
          *,
          referee:referee_id (name, email, created_at)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })

      if (earningsError) throw earningsError
      setReferrals(earnings || [])

      const total = earnings?.reduce((sum, e) => sum + e.bonus_amount, 0) || 0
      setTotalEarned(total)
    } catch (error) {
      console.error('Error fetching referral data:', error)
      showNotification('Failed to load referral data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshBalance()      // ✅ Update navbar/wallet balance
    await fetchReferralData()   // ✅ Refresh referral data
    setRefreshing(false)
    showNotification('Referral data refreshed', 'success')
  }

  useEffect(() => {
    fetchReferralData()
    refreshBalance() // Ensure balance is up‑to‑date on page load
  }, [user])

  const handleCopy = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`
    navigator.clipboard.writeText(link)
    showNotification('Referral link copied to clipboard!', 'success')
  }

  const handleShare = async () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join BetZone!',
          text: `Use my referral link to join BetZone and get a bonus!`,
          url: link,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      handleCopy()
    }
  }

  if (!user) {
    return (
      <div className="py-4 text-center">
        <p className="text-gray-400">Please login to access your referral page.</p>
        <a href="/login" className="text-primary hover:underline">Login</a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="py-4 space-y-4">
        <div className="animate-pulse bg-card rounded-lg p-4 h-24"></div>
        <div className="animate-pulse bg-card rounded-lg p-4 h-16"></div>
      </div>
    )
  }

  return (
    <div className="py-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Refer & Earn</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-gray-400 hover:text-white transition"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Referral Link Card */}
      <div className="bg-card rounded-2xl p-6 border border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <Gift size={24} className="text-yellow-400" />
          <h2 className="text-lg font-bold text-white">Your Referral Link</h2>
        </div>

        <div className="flex items-center gap-2 bg-dark/50 rounded-lg p-3 border border-white/10">
          <input
            type="text"
            value={`${window.location.origin}/register?ref=${referralCode}`}
            readOnly
            className="flex-1 bg-transparent text-white text-sm outline-none"
          />
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white transition p-1"
          >
            <Copy size={18} />
          </button>
          <button
            onClick={handleShare}
            className="text-gray-400 hover:text-white transition p-1"
          >
            <Share2 size={18} />
          </button>
        </div>

        <div className="mt-3 text-sm text-gray-400">
          <span className="font-medium text-yellow-400">{referralCode}</span> — Share this link with friends!
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-4 border border-primary/20">
          <div className="text-sm text-gray-400">Total Referrals</div>
          <div className="text-2xl font-bold text-white">{referrals.length}</div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-yellow-500/20">
          <div className="text-sm text-gray-400">Total Earned</div>
          <div className="text-2xl font-bold text-yellow-400">
            {user?.currency || 'GHS'} {totalEarned.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">Referral History</h3>
        {referrals.length === 0 ? (
          <div className="bg-card rounded-lg p-8 text-center text-gray-400 border border-white/5">
            <Users size={48} className="mx-auto mb-3 text-gray-600" />
            <p>No referrals yet. Share your link and start earning!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref) => (
              <div key={ref.id} className="bg-card rounded-lg p-4 border border-white/5 flex justify-between items-center">
                <div>
                  <div className="text-sm text-white">
                    {ref.referee?.name || 'Anonymous User'}
                  </div>
                  <div className="text-xs text-gray-400">
                    Joined: {new Date(ref.referee?.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-400">
                    +{user?.currency || 'GHS'} {ref.bonus_amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{ref.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Referral