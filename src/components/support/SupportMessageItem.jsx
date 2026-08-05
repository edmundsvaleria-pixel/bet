const SupportMessageItem = ({ message }) => {
  const date = new Date(message.date)
  const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-card rounded-lg p-4 border border-white/5">
      <div className="flex justify-between items-start">
        <div className="text-sm text-gray-400">{dateStr}</div>
        <span className={`text-xs px-2 py-0.5 rounded ${
          message.status === 'replied' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {message.status === 'replied' ? 'Replied' : 'Pending'}
        </span>
      </div>
      <div className="text-white mt-2">{message.message}</div>
      {message.adminReply && (
        <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="text-xs text-primary font-semibold">Admin Reply:</div>
          <div className="text-gray-200 mt-1">{message.adminReply}</div>
          {message.replyDate && (
            <div className="text-xs text-gray-500 mt-1">
              {new Date(message.replyDate).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SupportMessageItem