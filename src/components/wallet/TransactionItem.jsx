const TransactionItem = ({ transaction, currency = 'GHS' }) => {
  const isDeposit = transaction.type === 'deposit'
  const isWithdrawal = transaction.type === 'withdrawal'
  const isBet = transaction.type === 'bet'

  let icon = '💰'
  let color = 'text-green-400'
  let amount = `+${currency} ${transaction.amount.toFixed(2)}`
  let desc = transaction.description || ''

  if (isDeposit) {
    icon = '📥'
    color = 'text-green-400'
    amount = `+${currency} ${transaction.amount.toFixed(2)}`
    desc = 'Deposit'
  } else if (isWithdrawal) {
    icon = '📤'
    color = 'text-red-400'
    amount = `-${currency} ${transaction.amount.toFixed(2)}`
    desc = 'Withdrawal'
  } else if (isBet) {
    icon = '🎯'
    color = 'text-yellow-400'
    amount = `-${currency} ${Math.abs(transaction.amount).toFixed(2)}`
    desc = transaction.description || 'Bet placed'
  } else if (transaction.type === 'win') {
    icon = '🏆'
    color = 'text-green-400'
    amount = `+${currency} ${transaction.amount.toFixed(2)}`
    desc = 'Bet won!'
  } else if (transaction.type === 'admin_adjustment') {
    icon = '⚙️'
    color = 'text-blue-400'
    amount = `${currency} ${transaction.amount.toFixed(2)}`
    desc = 'Admin adjustment'
  }

  const date = new Date(transaction.date)
  const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-card rounded-lg p-3 border border-white/5 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-sm font-medium text-white">{desc}</div>
          <div className="text-xs text-gray-400">{dateStr}</div>
        </div>
      </div>
      <div className={`font-bold ${color}`}>{amount}</div>
    </div>
  )
}

export default TransactionItem