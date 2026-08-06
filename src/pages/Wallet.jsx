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
    if (!promoCode.trim()) {
      setPromoMessage('Please enter a promo code')
      return
    }
    setRedeeming(true)
    setPromoMessage('')
    try {
      // Look up promo code
      const { data: promo, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.trim().toUpperCase())
        .eq('active', true)
        .single()

      if (promoError || !promo) {
        setPromoMessage('Invalid or expired promo code')
        return
      }

      // Check if already redeemed by this user
      const { data: redeemed, error: redeemCheck } = await supabase
        .from('user_promo_redemptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('promo_code_id', promo.id)
        .maybeSingle()

      if (redeemed) {
        setPromoMessage('You have already redeemed this code')
        return
      }

      // Check max uses
      if (promo.max_uses && promo.used_count >= promo.max_uses) {
        setPromoMessage('This promo code has reached its limit')
        return
      }

      // Check expiry
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        setPromoMessage('This promo code has expired')
        return
      }

      // ✅ Convert bonus amount to user's currency
      const bonusInGHS = promo.bonus_amount
      const convertedBonus = await convertFromGHS(bonusInGHS, user.currency || 'GHS')

      // Credit user's available balance
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

      // Increment used count
      await supabase
        .from('promo_codes')
        .update({ used_count: promo.used_count + 1 })
        .eq('id', promo.id)

      // Log transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'bonus',
          amount: convertedBonus,
          description: `Promo code: ${promo.code} (converted from ${bonusInGHS} GHS)`,
          status: 'completed',
        })

      showNotification(`🎉 Promo code redeemed! +${currency} ${convertedBonus.toFixed(2)}`, 'success')
      setPromoCode('')
      setPromoMessage('')
      await fetchBalance()
    } catch (err) {
      console.error(err)
      setPromoMessage('Failed to redeem promo code')
    } finally {
      setRedeeming(false)
    }
  }

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

      {/* Promo Code Redemption */}
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
          className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-bold py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <Minus size={20} /> Withdraw
        </button>
      </div>

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