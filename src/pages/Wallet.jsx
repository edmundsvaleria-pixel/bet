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
  const { user, refreshBalance, balance, updateBalance, loading } = useSupabase()
  const { depositCount, totalDeposited, transactions } = useWallet()
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [promoMessage, setPromoMessage] = useState('')
  const { showNotification } = useNotification()

  const currency = user?.currency || 'GHS'
  const canWithdraw = depositCount >= 3 && balance?.withdrawable > 0

  useEffect(() => {
    if (user) refreshBalance()
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

      // Expiry check
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

      if (promo.max_uses && promo.used_count >= promo.max_uses) {
        setPromoMessage('This promo code has reached its limit')
        setRedeeming(false)
        return
      }

      const bonusInGHS = promo.bonus_amount
      const convertedBonus = await convertFromGHS(bonusInGHS, user.currency || 'GHS')

      // Update Supabase balance
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

      // ✅ Optimistic balance update – show instantly
      const updatedBalance = { ...balance, available: newAvailable }
      updateBalance(updatedBalance)

      showNotification(`🎉 Promo code redeemed! +${currency} ${convertedBonus.toFixed(2)}`, 'success')
      setPromoCode('')
      setPromoMessage('')
    } catch (err) {
      console.error(err)
      setPromoMessage('Failed to redeem promo code')
    } finally {
      setRedeeming(false)
    }
  }

  // ... (rest of the component unchanged)
}

export default Wallet