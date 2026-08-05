import { createContext, useContext, useState, useEffect } from 'react'

const UserActivityContext = createContext()

export const UserActivityProvider = ({ children }) => {
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('betzone_activities')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('betzone_activities', JSON.stringify(activities))
  }, [activities])

  const addActivity = (userEmail, action, details = '') => {
    const activity = {
      id: Date.now(),
      userEmail,
      action, // 'login', 'logout', 'register'
      details,
      timestamp: new Date().toISOString(),
    }
    setActivities(prev => [activity, ...prev])
  }

  const getActivities = () => activities

  return (
    <UserActivityContext.Provider value={{ addActivity, getActivities }}>
      {children}
    </UserActivityContext.Provider>
  )
}

export const useUserActivity = () => useContext(UserActivityContext)