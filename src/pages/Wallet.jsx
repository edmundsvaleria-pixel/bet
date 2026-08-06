import { useState, useEffect } from 'react'
import { useSupabase } from '../context/SupabaseContext'
import { useWallet } from '../context/WalletContext'
import { useNotification } from '../context/NotificationContext'
import { walletService } from '../services/supabase/walletService'
import { convertFromGHS } from '../utils/currency'
import DepositModal from '../components/wallet/DepositModal'
import WithdrawModal from '../components/wallet/WithdrawModal'
import TransactionItem from '../components/wallet/TransactionItem'
import { Plus, Minus, RefreshCw, Gift } from 'lucide-react'
import supabase from '../lib/supabase'

const Wallet = () => {
  const { user, refreshBalance, loading } = useSupabase()
  const { depositCount, totalDeposited, transactions } = useWallet()
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [localBalance, setLocalBalance] = useState({ available: 0, withdrawable: 0 })
  const [promoCode, setPromoCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [promoMessage, setPromoMessage] = useState('')
  const { showNotification } = useNotification()

  const currency = user?.currency || 'GHS'

  const fetchBalance = async () => {
    if (!user?.id) return
    try {
      const bal = await walletService.getBalance(user.id)
      setLocalBalance(bal || { available: 0, withdrawable: 0 })
      await refreshBalance()
    } catch (err) {
      console.error('Failed to fetch balance:', err)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [user?.id])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchBalance()
    setRefreshing(false)
  }

  const handleRedeemPromo = async () => {
    // ... same as before (keep your existing code)
  }

  // ✅ If not logged in, show message
  if (!user) {
    return (
      <div className="py-8 max-w-md mx-auto text-center">
        <div className="bg-card rounded-2xl p-8 border border-white/5">
          <h2 className="text-2xl font-bold text-white mb-4">Wallet</h2>
          <p className="text-gray-400 mb-6">Please login or register to view your wallet and manage funds.</p>
          <div className="flex gap-4 justify-center">
            <a href="/login" className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-lg transition">
              Login
            </a>
            <a href="/register" className="bg-accent hover:bg-yellow-400 text-dark font-bold py-2 px-6 rounded-lg transition">
              Register
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Rest of the wallet page (existing code)
  const displayBalance = localBalance

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Wallet</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-gray-400 hover:text-white transition"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-4 border border-primary/20">
          <div className="text-sm text-gray-400">Available Balance</div>
          <div className="text-2xl font-bold text-green-400">
            {currency} {displayBalance?.available?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-yellow-500/20">
          <div className="text-sm text-gray-400">Withdrawable</div>
          <div className="text-2xl font-bold text-yellow-400">
            {currency} {displayBalance?.withdrawable?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>

      {/* stats & promo & buttons... same as before */}
      {/* ... rest of wallet UI ... */}

    </div>
  )
}

export default Wallet