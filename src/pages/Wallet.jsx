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
  const { user, refreshBalance, balance: supabaseBalance, loading } = useSupabase()
  const { depositCount, totalDeposited, transactions } = useWallet()
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [promoMessage, setPromoMessage] = useState('')
  const { showNotification } = useNotification()

  const currency = user?.currency || 'GHS'
  const canWithdraw = depositCount >= 3 && supabaseBalance?.withdrawable > 0

  // Load balance on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshBalance()
    }
  }, [user])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshBalance()
    setRefreshing(false)
  }

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) {
      setPromoMessage('Please enter a promo code')
      return
    }
    setRedeeming(true)
    setPromoMessage('')
    try {
      const { data: promo, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.trim().toUpperCase())
        .eq('active', true)
        .single()

      if (promoError || !promo) {
        setPromoMessage('Invalid or expired promo code')
        setRedeeming(false)
        return
      }

      // Expiry check (date only)
      if (promo.expires_at) {
        const expiryDate = new Date(promo.expires_at)
        const today = new Date()
        if (
          expiryDate.getFullYear() < today.getFullYear() ||
          (expiryDate.getFullYear() === today.getFullYear() && expiryDate.getMonth() < today.getMonth()) ||
          (expiryDate.getFullYear() === today.getFullYear() && expiryDate.getMonth() === today.getMonth() && expiryDate.getDate() < today.getDate())
        ) {
          setPromoMessage('This promo code has expired')
          setRedeeming(false)
          return
        }
      }

      // Check if already redeemed
      const { data: redeemed } = await supabase
        .from('user_promo_redemptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('promo_code_id', promo.id)
        .maybeSingle()

      if (redeemed) {
        setPromoMessage('You have already redeemed this code')
        setRedeeming(false)
        return
      }

      // Check max uses
      if (promo.max_uses && promo.used_count >= promo.max_uses) {
        setPromoMessage('This promo code has reached its limit')
        setRedeeming(false)
        return
      }

      // Convert bonus to user's currency
      const bonusInGHS = promo.bonus_amount
      const convertedBonus = await convertFromGHS(bonusInGHS, user.currency || 'GHS')

      // Credit the user's available balance
      const currentBalance = await walletService.getBalance(user.id)
      const newAvailable = (currentBalance?.available || 0) + convertedBonus
      await supabase
        .from('balances')
        .update({ available: newAvailable })
        .eq('user_id', user.id)

      // Log redemption
      await supabase
        .from('user_promo_redemptions')
        .insert({
          user_id: user.id,
          promo_code_id: promo.id,
          bonus_amount: convertedBonus,
        })

      await supabase
        .from('promo_codes')
        .update({ used_count: promo.used_count + 1 })
        .eq('id', promo.id)

      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'bonus',
          amount: convertedBonus,
          description: `Promo code: ${promo.code}`,
          status: 'completed',
        })

      showNotification(`🎉 Promo code redeemed! +${currency} ${convertedBonus.toFixed(2)}`, 'success')
      setPromoCode('')
      setPromoMessage('')
      // ✅ Refresh balance to update UI
      await refreshBalance()
    } catch (err) {
      console.error(err)
      setPromoMessage('Failed to redeem promo code')
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) {
    return (
      <div className="py-4 space-y-4">
        <div className="animate-pulse bg-card rounded-lg p-4 h-24"></div>
        <div className="animate-pulse bg-card rounded-lg p-4 h-16"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-8 max-w-md mx-auto text-center">
        <div className="bg-card rounded-2xl p-8 border border-white/5">
          <h2 className="text-2xl font-bold text-white mb-4">Wallet</h2>
          <p className="text-gray-400 mb-6">Please login or register to view your wallet and manage funds.</p>
          <div className="flex gap-4 justify-center">
            <a href="/login" className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-lg transition">Login</a>
            <a href="/register" className="bg-accent hover:bg-yellow-400 text-dark font-bold py-2 px-6 rounded-lg transition">Register</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Wallet</h1>
        <button onClick={handleRefresh} disabled={refreshing} className="text-gray-400 hover:text-white transition">
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-4 border border-primary/20">
          <div className="text-sm text-gray-400">Available Balance</div>
          <div className="text-2xl font-bold text-green-400">
            {currency} {supabaseBalance?.available?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-yellow-500/20">
          <div className="text-sm text-gray-400">Withdrawable</div>
          <div className="text-2xl font-bold text-yellow-400">
            {currency} {supabaseBalance?.withdrawable?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-4 border border-white/5 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">Deposits made:</span>
          <span className="ml-2 text-white font-bold">{depositCount || 0}</span>
        </div>
        <div>
          <span className="text-gray-400">Total deposited:</span>
          <span className="ml-2 text-white font-bold">{currency} {totalDeposited?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      {/* Promo Code */}
      <div className="bg-card rounded-lg p-4 border border-dashed border-yellow-500/40">
        <div className="flex items-center gap-2 mb-2">
          <Gift size={18} className="text-yellow-400" />
          <span className="text-sm font-medium text-white">Redeem Promo Code</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
            className="flex-1 bg-dark border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none transition"
          />
          <button
            onClick={handleRedeemPromo}
            disabled={redeeming}
            className="bg-yellow-500 hover:bg-yellow-400 text-dark font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm"
          >
            {redeeming ? '...' : 'Redeem'}
          </button>
        </div>
        {promoMessage && (
          <div className={`text-sm mt-2 ${promoMessage.includes('🎉') ? 'text-green-400' : 'text-red-400'}`}>
            {promoMessage}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setShowDeposit(true)}
          className="flex-1 bg-primary hover:bg-primary/80 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <Plus size={20} /> Deposit
        </button>
        <button
          onClick={() => setShowWithdraw(true)}
          disabled={!canWithdraw}
          className={`flex-1 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition ${
            canWithdraw
              ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
              : 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Minus size={20} /> Withdraw
        </button>
      </div>
      {!canWithdraw && (
        <p className="text-xs text-gray-500 text-center">
          {depositCount < 3 ? `⚠️ Need ${3 - depositCount} more deposit(s) to withdraw` : '⚠️ No withdrawable balance'}
        </p>
      )}

      <div>
        <h3 className="text-lg font-bold text-white mb-3">Transaction History</h3>
        <div className="space-y-2">
          {!transactions || transactions.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No transactions yet</p>
          ) : (
            transactions.map((tx, idx) => (
              <TransactionItem key={idx} transaction={tx} currency={currency} />
            ))
          )}
        </div>
      </div>

      <DepositModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} currency={currency} />
      <WithdrawModal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} currency={currency} />
    </div>
  )
}

export default Wallet