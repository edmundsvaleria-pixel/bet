import { useState, useEffect } from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import { useNotification } from '../../context/NotificationContext'

const AdminBalanceManager = () => {
  const { getAllUsers, wallet } = useSupabase()
  const { showNotification } = useNotification()
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('add') // add, deduct
  const [balanceType, setBalanceType] = useState('available') // available, withdrawable
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const data = await getAllUsers()
    setUsers(data)
  }

  const handleAdjust = async () => {
    const amt = parseFloat(amount)
    if (!selectedUser) { setError('Select a user'); return }
    if (isNaN(amt) || amt <= 0) { setError('Invalid amount'); return }
    if (!reason) { setError('Please provide a reason'); return }

    const finalAmount = type === 'add' ? amt : -amt
    const result = await wallet.adminAdjustBalance(selectedUser, finalAmount, balanceType, reason)

    if (result.success) {
      setMessage(`Balance updated for user`)
      setAmount('')
      setReason('')
      setError('')
      showNotification(`Balance updated successfully`, 'success')
      setTimeout(() => setMessage(''), 3000)
    } else {
      setError(result.error || 'Failed to update balance')
      showNotification(result.error || 'Failed to update balance', 'error')
    }
  }

  // Helper to get current balance for selected user
  const getCurrentBalance = () => {
    const user = users.find(u => u.id === selectedUser)
    if (!user) return { available: 0, withdrawable: 0 }
    // We need to fetch balance from the wallet service
    // For simplicity, we'll just show placeholder
    return { available: 0, withdrawable: 0 }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">Balance Manager</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-400 block">Select User</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white text-sm"
          >
            <option value="">Choose user</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-400 block">Amount (GHS)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white text-sm"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-400 block">Balance Type</label>
          <select
            value={balanceType}
            onChange={(e) => setBalanceType(e.target.value)}
            className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white text-sm"
          >
            <option value="available">Available</option>
            <option value="withdrawable">Withdrawable</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-400 block">Action</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white text-sm"
          >
            <option value="add">Add</option>
            <option value="deduct">Deduct</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-400 block">Reason</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white text-sm"
          placeholder="e.g., Bonus, Correction"
        />
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}
      {message && <div className="text-green-400 text-sm">{message}</div>}

      <button
        onClick={handleAdjust}
        className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
      >
        Apply Balance Change
      </button>

      {selectedUser && (
        <div className="text-xs text-gray-400">
          User ID: {selectedUser}
        </div>
      )}
    </div>
  )
}

export default AdminBalanceManager