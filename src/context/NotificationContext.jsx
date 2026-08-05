import { createContext, useContext, useState, useEffect } from 'react'

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const showNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type, duration }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, duration)
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <NotificationContext.Provider value={{ showNotification, removeNotification, notifications }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)

// Notification Container Component
const NotificationContainer = () => {
  const { notifications, removeNotification } = useContext(NotificationContext)

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[9999] space-y-2 max-w-sm w-full">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`rounded-lg shadow-2xl p-4 border animate-slideIn ${
            notif.type === 'success' ? 'bg-green-500/95 border-green-400' :
            notif.type === 'error' ? 'bg-red-500/95 border-red-400' :
            notif.type === 'warning' ? 'bg-yellow-500/95 border-yellow-400' :
            'bg-primary/95 border-primary/50'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {notif.type === 'success' && <span className="text-xl">✅</span>}
              {notif.type === 'error' && <span className="text-xl">❌</span>}
              {notif.type === 'warning' && <span className="text-xl">⚠️</span>}
              {notif.type === 'info' && <span className="text-xl">ℹ️</span>}
              <span className="text-white text-sm font-medium">{notif.message}</span>
            </div>
            <button
              onClick={() => removeNotification(notif.id)}
              className="text-white/70 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}