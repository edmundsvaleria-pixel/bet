import { useState, useEffect } from 'react'
import supabase from '../../lib/supabase'
import { useNotification } from '../../context/NotificationContext'

const AdminPromoCodes = () => {
  const [codes, setCodes] = useState([])
  const [newCode, setNewCode] = useState({ code: '', bonus_amount: '', description: '', max_uses: '', expires_at: '' })
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotification()

  const fetchCodes = async () => {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setCodes(data || [])
  }

  useEffect(() => {
    fetchCodes()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newCode.code || !newCode.bonus_amount) {
      showNotification('Code and bonus amount required', 'error')
      return
    }
    setLoading(true)
    try {
      const payload = {
        code: newCode.code.toUpperCase(),
        bonus_amount: parseFloat(newCode.bonus_amount),
        description: newCode.description || '',
        max_uses: parseInt(newCode.max_uses) || 1,
        expires_at: newCode.expires_at || null,
        active: true,
        used_count: 0,
      }
      const { error } = await supabase.from('promo_codes').insert(payload)
      if (error) throw error
      showNotification('Promo code created!', 'success')
      setNewCode({ code: '', bonus_amount: '', description: '', max_uses: '', expires_at: '' })
      fetchCodes()
    } catch (err) {
      showNotification(err.message || 'Failed to create', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id, currentActive) => {
    const { error } = await supabase
      .from('promo_codes')
      .update({ active: !currentActive })
      .eq('id', id)
    if (error) {
      showNotification('Failed to update', 'error')
    } else {
      showNotification('Updated', 'success')
      fetchCodes()
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white">Promo Codes</h3>
      <div className="bg-dark/50 rounded-lg p-4 border border-white/5">
        <h4 className="text-sm font-medium text-white mb-3">Create New Promo Code</h4>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Code (e.g. WELCOME100)"
            value={newCode.code}
            onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
            className="bg-card border border-white/10 rounded px-3 py-2 text-white text-sm"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Bonus Amount (GHS)"
            value={newCode.bonus_amount}
            onChange={(e) => setNewCode({ ...newCode, bonus_amount: e.target.value })}
            className="bg-card border border-white/10 rounded px-3 py-2 text-white text-sm"
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newCode.description}
            onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
            className="bg-card border border-white/10 rounded px-3 py-2 text-white text-sm"
          />
          <input
            type="number"
            placeholder="Max uses (default 1)"
            value={newCode.max_uses}
            onChange={(e) => setNewCode({ ...newCode, max_uses: e.target.value })}
            className="bg-card border border-white/10 rounded px-3 py-2 text-white text-sm"
          />
          <input
            type="datetime-local"
            placeholder="Expiry (optional)"
            value={newCode.expires_at}
            onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
            className="bg-card border border-white/10 rounded px-3 py-2 text-white text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/80 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 text-gray-400">Code</th>
              <th className="text-left py-2 text-gray-400">Bonus</th>
              <th className="text-left py-2 text-gray-400">Description</th>
              <th className="text-left py-2 text-gray-400">Uses</th>
              <th className="text-left py-2 text-gray-400">Expiry</th>
              <th className="text-left py-2 text-gray-400">Status</th>
              <th className="text-left py-2 text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="py-2 text-white font-mono">{c.code}</td>
                <td className="py-2 text-green-400">GHS {c.bonus_amount.toFixed(2)}</td>
                <td className="py-2 text-gray-300">{c.description || '-'}</td>
                <td className="py-2 text-gray-400">{c.used_count} / {c.max_uses || '∞'}</td>
                <td className="py-2 text-gray-400">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}</td>
                <td className="py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${c.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2">
                  <button
                    onClick={() => toggleActive(c.id, c.active)}
                    className={`text-xs px-2 py-1 rounded ${c.active ? 'bg-red-500/20 text-red-400 hover:bg-red-500' : 'bg-green-500/20 text-green-400 hover:bg-green-500'}`}
                  >
                    {c.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminPromoCodes