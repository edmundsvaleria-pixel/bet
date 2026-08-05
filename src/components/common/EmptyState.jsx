const EmptyState = ({ icon, title, message, actionText, actionLink }) => {
  return (
    <div className="bg-card rounded-lg p-8 text-center border border-white/5">
      <div className="text-6xl mb-4">{icon || '📭'}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title || 'Nothing here yet'}</h3>
      <p className="text-gray-400 mb-4">{message || 'Check back later'}</p>
      {actionText && actionLink && (
        <a href={actionLink} className="inline-block bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-lg transition">
          {actionText}
        </a>
      )}
    </div>
  )
}

export default EmptyState