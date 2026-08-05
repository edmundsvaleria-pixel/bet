import { createContext, useContext, useState, useEffect } from 'react'

const SupportContext = createContext()

export const SupportProvider = ({ children }) => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('betzone_support_messages')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('betzone_support_messages', JSON.stringify(messages))
  }, [messages])

  const sendMessage = (userEmail, message) => {
    const newMsg = {
      id: Date.now(),
      userEmail,
      message,
      date: new Date().toISOString(),
      status: 'pending',
      adminReply: null,
      replyDate: null,
    }
    setMessages(prev => [newMsg, ...prev])
    return newMsg
  }

  const replyMessage = (messageId, reply) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, adminReply: reply, replyDate: new Date().toISOString(), status: 'replied' }
          : msg
      )
    )
  }

  const getUserMessages = (email) => {
    return messages.filter(msg => msg.userEmail === email)
  }

  const getAllMessages = () => {
    return messages
  }

  return (
    <SupportContext.Provider
      value={{
        messages,
        sendMessage,
        replyMessage,
        getUserMessages,
        getAllMessages,
      }}
    >
      {children}
    </SupportContext.Provider>
  )
}

export const useSupport = () => {
  const context = useContext(SupportContext)
  if (!context) {
    throw new Error('useSupport must be used within a SupportProvider')
  }
  return context
}