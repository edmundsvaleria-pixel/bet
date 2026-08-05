import { useState } from 'react'
import { useSupabase } from '../context/SupabaseContext'
import { useWallet } from '../context/WalletContext'
import DepositModal from '../components/wallet/DepositModal'
import WithdrawModal from '../components/wallet/WithdrawModal'
import TransactionItem from '../components/wallet/TransactionItem'
import { Plus, Minus } from 'lucide-react'

const Wallet = () => {
  const { balance, depositCount, totalDeposited, transactions } = useWallet()
  const { user } = useSupabase()
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  
  const currency = user?.currency || 'GHS'

  return (
    <div className="py-4 space-y-6">
      <h1 className="text-2xl font-bold text-white">Wallet</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-4 border border-primary/20">
          <div className="text-sm text-gray-400">Available Balance</div>
          <div className="text-2xl font-bold text-green-400">{currency} {balance?.available?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-yellow-500/20">
          <div className="text-sm text-gray-400">Withdrawable</div>
          <div className="text-2xl font-bold text-yellow-400">{currency} {balance?.withdrawable?.toFixed(2) || '0.00'}</div>
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