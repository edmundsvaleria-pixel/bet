// src/services/supabase/walletService.js
import supabase from '../../lib/supabase'
import { authService } from './authService'

export const walletService = {
  // Get user balance
  async getBalance(userId) {
    try {
      const { data, error } = await supabase
        .from('balances')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // No balance found, create one
        const { data: newBalance, error: createError } = await supabase
          .from('balances')
          .insert({ user_id: userId, available: 0, withdrawable: 0 })
          .select()
          .single()
        if (createError) throw createError
        return newBalance
      }
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get balance error:', error)
      return { available: 0, withdrawable: 0 }
    }
  },

  // Deposit – credits available balance
  async deposit(userId, amount, reference) {
    try {
      // 1. Fetch current balance
      const { data: current, error: fetchError } = await supabase
        .from('balances')
        .select('available')
        .eq('user_id', userId)
        .single()

      if (fetchError) throw fetchError

      const newAvailable = (current?.available || 0) + amount

      // 2. Update balance
      const { data: balance, error: balanceError } = await supabase
        .from('balances')
        .update({ available: newAvailable })
        .eq('user_id', userId)
        .select()
        .single()

      if (balanceError) throw balanceError

      // 3. Log transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'deposit',
        amount,
        description: `Deposit via Paystack (${reference})`,
        status: 'completed',
        reference,
      })

      await authService.logActivity(userId, 'deposit', `Deposited ${amount}`)

      return { success: true, balance }
    } catch (error) {
      console.error('Deposit error:', error)
      return { success: false, error: error.message }
    }
  },

  // Withdraw – deducts from withdrawable balance
  async withdraw(userId, amount) {
    try {
      // 1. Fetch current balance
      const { data: current, error: fetchError } = await supabase
        .from('balances')
        .select('withdrawable')
        .eq('user_id', userId)
        .single()

      if (fetchError) throw fetchError

      if ((current?.withdrawable || 0) < amount) {
        return { success: false, error: 'Insufficient withdrawable balance' }
      }

      const newWithdrawable = (current?.withdrawable || 0) - amount
      const commission = amount * 0.19
      const netAmount = amount - commission

      // 2. Update balance
      const { data: newBalance, error: balanceError } = await supabase
        .from('balances')
        .update({ withdrawable: newWithdrawable })
        .eq('user_id', userId)
        .select()
        .single()

      if (balanceError) throw balanceError

      // 3. Log transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'withdrawal',
        amount,
        description: `Withdrawal request (Net: ${netAmount}, Commission: ${commission})`,
        status: 'pending',
        commission,
        net_amount: netAmount,
      })

      await authService.logActivity(userId, 'withdrawal', `Requested withdrawal of ${amount}`)

      return { success: true, balance: newBalance }
    } catch (error) {
      console.error('Withdraw error:', error)
      return { success: false, error: error.message }
    }
  },

  // Get user transactions
  async getTransactions(userId) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Get transactions error:', error)
      return []
    }
  },

  // Admin adjust balance (add/deduct from available or withdrawable)
  async adminAdjustBalance(userId, amount, type, description) {
    try {
      const column = type === 'available' ? 'available' : 'withdrawable'
      const sign = amount >= 0 ? '+' : '-'
      const absAmount = Math.abs(amount)

      // 1. Fetch current balance
      const { data: current, error: fetchError } = await supabase
        .from('balances')
        .select(column)
        .eq('user_id', userId)
        .single()

      if (fetchError) throw fetchError

      const currentValue = current?.[column] || 0
      const newValue = currentValue + amount

      if (newValue < 0) {
        return { success: false, error: 'Resulting balance cannot be negative' }
      }

      // 2. Update balance
      const { data: balance, error: balanceError } = await supabase
        .from('balances')
        .update({ [column]: newValue })
        .eq('user_id', userId)
        .select()
        .single()

      if (balanceError) throw balanceError

      // 3. Log transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'admin_adjustment',
        amount: amount,
        description: `Admin adjustment: ${description}`,
        status: 'completed',
      })

      await authService.logActivity(userId, 'balance_change', `Admin ${sign} ${absAmount} from ${column}`)

      return { success: true, balance }
    } catch (error) {
      console.error('Admin adjust balance error:', error)
      return { success: false, error: error.message }
    }
  },

  // Get withdrawal requests (admin)
  async getWithdrawalRequests() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          users:user_id (name, email, phone)
        `)
        .eq('type', 'withdrawal')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Get withdrawal requests error:', error)
      return []
    }
  },

  // Process withdrawal (admin approve/reject)
  async processWithdrawal(transactionId, status) {
    try {
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (txError) throw txError

      await supabase.from('transactions').update({
        status,
        processed_at: new Date().toISOString(),
      }).eq('id', transactionId)

      if (status === 'rejected') {
        // Refund the amount back to withdrawable balance
        const { data: current, error: fetchError } = await supabase
          .from('balances')
          .select('withdrawable')
          .eq('user_id', tx.user_id)
          .single()

        if (!fetchError) {
          const newWithdrawable = (current?.withdrawable || 0) + tx.amount
          await supabase
            .from('balances')
            .update({ withdrawable: newWithdrawable })
            .eq('user_id', tx.user_id)
        }
      }

      await authService.logActivity(tx.user_id, 'withdrawal_processed', `Withdrawal ${status}`)

      return { success: true }
    } catch (error) {
      console.error('Process withdrawal error:', error)
      return { success: false, error: error.message }
    }
  },
}