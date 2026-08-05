import supabase from '../../lib/supabase'
import { authService } from './authService'

export const walletService = {
  async getBalance(userId) {
    try {
      const { data, error } = await supabase
        .from('balances')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (error && error.code === 'PGRST116') {
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

  async deposit(userId, amount, reference) {
    try {
      const { data: balance, error: balanceError } = await supabase
        .from('balances')
        .update({ available: supabase.raw('available + ?', [amount]) })
        .eq('user_id', userId)
        .select()
        .single()
      if (balanceError) throw balanceError
      await supabase
        .from('transactions')
        .insert({
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

  async withdraw(userId, amount) {
    try {
      const balance = await this.getBalance(userId)
      const commission = amount * 0.19
      const netAmount = amount - commission
      if (amount > balance.withdrawable) {
        return { success: false, error: 'Insufficient withdrawable balance' }
      }
      const { data: newBalance, error: balanceError } = await supabase
        .from('balances')
        .update({ withdrawable: supabase.raw('withdrawable - ?', [amount]) })
        .eq('user_id', userId)
        .select()
        .single()
      if (balanceError) throw balanceError
      await supabase
        .from('transactions')
        .insert({
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

  async adminAdjustBalance(userId, amount, type, description) {
    try {
      const column = type === 'available' ? 'available' : 'withdrawable'
      const sign = amount >= 0 ? '+' : '-'
      const absAmount = Math.abs(amount)
      const { data: balance, error: balanceError } = await supabase
        .from('balances')
        .update({ [column]: supabase.raw(`${column} ${sign} ?`, [absAmount]) })
        .eq('user_id', userId)
        .select()
        .single()
      if (balanceError) throw balanceError
      await supabase
        .from('transactions')
        .insert({
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

  async getWithdrawalRequests() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, users:user_id (name, email, phone)')
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

  async processWithdrawal(transactionId, status) {
    try {
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .update({ status, processed_at: new Date().toISOString() })
        .eq('id', transactionId)
        .select()
        .single()
      if (txError) throw txError
      if (status === 'rejected') {
        await supabase
          .from('balances')
          .update({ withdrawable: supabase.raw('withdrawable + ?', [tx.amount]) })
          .eq('user_id', tx.user_id)
      }
      await authService.logActivity(tx.user_id, 'withdrawal_processed', `Withdrawal ${status}`)
      return { success: true }
    } catch (error) {
      console.error('Process withdrawal error:', error)
      return { success: false, error: error.message }
    }
  },
}