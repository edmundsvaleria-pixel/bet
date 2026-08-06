import { useState, useEffect } from 'react'
import { useSupabase } from '../context/SupabaseContext'
import { useWallet } from '../context/WalletContext'
import { walletService } from '../services/supabase/walletService'
import DepositModal from '../components/wallet/DepositModal'
import WithdrawModal from '../components/wallet/WithdrawModal'
import TransactionItem from '../components/wallet/TransactionItem'
import { Plus, Minus, RefreshCw } from 'lucide-react'

const Wallet = () => {
  const { user, refreshBalance, loading } = useSupabase()
  const { depositCount, totalDeposited, transactions } = useWallet()
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  // ✅ Local balance state – direct fetch from Supabase
  const [localBalance, setLocalBalance] = useState({ available: 0, withdrawable: 0 })

  const currency = user?.currency || 'GHS'

  // Fetch balance directly on mount and when user changes
  const fetchBalance = async () => {
    if (!user?.id) return
    try {
      const bal = await walletService.getBalance(user.id)
      setLocalBalance(bal || { available: 0, withdrawable: 0 })
      // Also update context balance so navbar stays in sync
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

  // Use local balance for display
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