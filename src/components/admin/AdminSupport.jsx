import { useState } from 'react'
import { useSupport } from '../../context/SupportContext'

const AdminSupport = () => {
  const { getAllMessages, replyMessage } = useSupport()
  const [replyText, setReplyText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const messages = getAllMessages()

  const handleReply = (messageId) => {
    if (!replyText.trim()) return
    replyMessage(messageId, replyText)
    setReplyText('')
    setReplyingTo(null)
  }

  if (messages.length === 0) {
    return <div className="text-gray-400 text-center py-4">No support messages yet.</div>
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <div key={msg.id} className="bg-dark/50 rounded-lg p-4 border border-white/5">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-white">{msg.userEmail}</div>
              <div className="text-xs text-gray-400">{new Date(msg.date).toLocaleString()}</div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded ${
              msg.status === 'replied' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {msg.status === 'replied' ? 'Replied' : 'Pending'}
            </span>
          </div>
          <div className="text-white mt-2">{msg.message}</div>
          
          {msg.adminReply && (
            <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded text-sm">
              <div className="text-primary font-semibold">Reply:</div>
              <div className="text-gray-200">{msg.adminReply}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(msg.replyDate).toLocaleString()}
              </div>
            </div>
          )}

          {!msg.adminReply && (
            <div className="mt-3">
              {replyingTo === msg.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 bg-card border border-white/10 rounded px-3 py-1 text-white text-sm"
                  />
                  <button
                    onClick={() => handleReply(msg.id)}
                    className="bg-primary hover:bg-primary/80 text-white px-3 py-1 rounded text-sm"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setReplyingTo(msg.id)}
                  className="text-primary text-sm hover:underline"
                >
                  Reply
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default AdminSupport