import { createContext, useContext, useState, useEffect } from 'react'

const WalletContext = createContext()

export const WalletProvider = ({ children }) => {
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('betzone_balance')
    return saved ? JSON.parse(saved) : { available: 0, withdrawable: 0 }
  })
  const [depositCount, setDepositCount] = useState(() => {
    return parseInt(localStorage.getItem('betzone_depositCount')) || 0
  })
  const [totalDeposited, setTotalDeposited] = useState(() => {
    return parseFloat(localStorage.getItem('betzone_totalDeposited')) || 0
  })
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('betzone_transactions')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('betzone_balance', JSON.stringify(balance))
  }, [balance])
  useEffect(() => {
    localStorage.setItem('betzone_depositCount', depositCount.toString())
  }, [depositCount])
  useEffect(() => {
    localStorage.setItem('betzone_totalDeposited', totalDeposited.toString())
  }, [totalDeposited])
  useEffect(() => {
    localStorage.setItem('betzone_transactions', JSON.stringify(transactions))
  }, [transactions])

  const deposit = (amount) => {
    const newBalance = { ...balance, available: balance.available + amount }
    setBalance(newBalance)
    setDepositCount(prev => prev + 1)
    setTotalDeposited(prev => prev + amount)
    const newTx = { type: 'deposit', amount, date: new Date().toISOString(), status: 'completed' }
    setTransactions(prev => [newTx, ...prev])
  }

  // Updated withdraw with reference and commission
  const withdraw = async (amount, commissionRef, commission) => {
    if (balance.withdrawable < amount) throw new Error('Insufficient withdrawable balance')
    if (depositCount < 3) throw new Error('Need at least 3 deposits')
    
    const netAmount = amount - commission
    
    // Deduct full amount from withdrawable balance
    const newBalance = { ...balance, withdrawable: balance.withdrawable - amount }
    setBalance(newBalance)
    
    // Create transaction with commission details
    const newTx = { 
      type: 'withdrawal', 
      amount: amount, 
      commission, 
      netAmount,
      commissionRef,
      date: new Date().toISOString(), 
      status: 'pending',
      adminNote: null
    }
    setTransactions(prev => [newTx, ...prev])
    localStorage.setItem('betzone_balance', JSON.stringify(newBalance))
    localStorage.setItem('betzone_transactions', JSON.stringify([newTx, ...transactions]))
    
    return { success: true, transaction: newTx }
  }

  const canWithdraw = () => {
    return depositCount >= 3 && balance.withdrawable > 0
  }

  // Admin functions for withdrawal management
  const getPendingWithdrawals = () => {
    return transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending')
  }

  const approveWithdrawal = (transactionId) => {
    const updated = transactions.map(t => 
      t.id === transactionId ? { ...t, status: 'approved', approvedAt: new Date().toISOString() } : t
    )
    setTransactions(updated)
    localStorage.setItem('betzone_transactions', JSON.stringify(updated))
  }

  const rejectWithdrawal = (transactionId, note) => {
    const updated = transactions.map(t => 
      t.id === transactionId ? { ...t, status: 'rejected', adminNote: note, rejectedAt: new Date().toISOString() } : t
    )
    setTransactions(updated)
    localStorage.setItem('betzone_transactions', JSON.stringify(updated))
  }

  return (
    <WalletContext.Provider
      value={{
        balance,
        depositCount,
        totalDeposited,
        transactions,
        deposit,
        withdraw,
        canWithdraw,
        getPendingWithdrawals,
        approveWithdrawal,
        rejectWithdrawal,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}