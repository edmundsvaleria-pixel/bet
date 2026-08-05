import { useState } from 'react'
import { useSupabase } from '../context/SupabaseContext'
import { useSupport } from '../context/SupportContext'
import SupportMessageItem from '../components/support/SupportMessageItem'

const Support = () => {
  const { user } = useSupabase()
  const { sendMessage, getUserMessages } = useSupport()
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="py-4 text-center">
        <p className="text-gray-400">Please login to access support.</p>
        <a href="/login" className="text-primary hover:underline">Login</a>
      </div>
    )
  }

  const userMessages = getUserMessages(user.email)

  const handleSend = async () => {
    if (!newMessage.trim()) {
      setError('Please enter a message')
      return
    }
    setSending(true)
    setError('')
    try {
      sendMessage(user.email, newMessage)
      setNewMessage('')
    } catch (err) {
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-white mb-4">Support</h1>

      <div className="bg-card rounded-lg p-4 border border-white/5 mb-6">
        <h3 className="text-sm font-medium text-white mb-2">Send a message to support</h3>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Describe your issue or question..."
          className="w-full bg-dark border border-white/10 rounded-lg px-4 py-2 text-white h-24 resize-none"
        />
        {error && <div className="text-red-400 text-sm mt-1">{error}</div>}
        <button
          onClick={handleSend}
          disabled={sending}
          className="mt-2 bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-lg transition disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send Message'}
        </button>
      </div>

      <h3 className="text-lg font-bold text-white mb-3">Your Messages</h3>
      {userMessages.length === 0 ? (
        <div className="bg-card rounded-lg p-8 text-center text-gray-400">
          <p>No messages yet. Send a message to support.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userMessages.map((msg) => (
            <SupportMessageItem key={msg.id} message={msg} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Support