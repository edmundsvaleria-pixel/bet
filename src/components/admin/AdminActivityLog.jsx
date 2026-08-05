import { useState, useEffect } from 'react'

const AdminActivityLog = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('betzone_activities')
    if (stored) {
      const parsed = JSON.parse(stored)
      // Sort by timestamp (newest first)
      parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      setActivities(parsed)
    }
    setLoading(false)
  }, [])

  // Listen for changes (when new activities are added)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('betzone_activities')
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        setActivities(parsed)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-dark/50 rounded-lg p-3 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-gray-400 text-center py-8">
        <div className="text-4xl mb-3">📭</div>
        <p>No user activity recorded yet.</p>
        <p className="text-sm mt-1">Activities will appear here when users login, logout, or register.</p>
      </div>
    )
  }

  const getActionColor = (action) => {
    switch(action) {
      case 'login': return 'bg-green-500/20 text-green-400'
      case 'logout': return 'bg-red-500/20 text-red-400'
      case 'register': return 'bg-blue-500/20 text-blue-400'
      case 'delete': return 'bg-red-600/20 text-red-500'
      case 'admin_update': return 'bg-yellow-500/20 text-yellow-400'
      case 'balance_change': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getActionIcon = (action) => {
    switch(action) {
      case 'login': return '🔓'
      case 'logout': return '🔒'
      case 'register': return '📝'
      case 'delete': return '🗑️'
      case 'admin_update': return '⚙️'
      case 'balance_change': return '💰'
      default: return '📌'
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 mb-2">
        Showing {activities.length} activity record{activities.length > 1 ? 's' : ''}
      </div>
      {activities.map((act) => (
        <div key={act.id} className="bg-dark/50 rounded-lg p-3 border border-white/5 hover:border-white/10 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{getActionIcon(act.action)}</span>
              <div>
                <div className="text-sm text-white font-medium">{act.userEmail}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded ${getActionColor(act.action)}`}>
                    {act.action}
                  </span>
                  {act.details && (
                    <span className="text-xs text-gray-400">{act.details}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AdminActivityLog