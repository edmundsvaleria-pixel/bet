import { useState } from 'react'
import { useBet } from '../context/BetContext'
import EmptyState from '../components/common/EmptyState'

const MyBets = () => {
  const { bets = [] } = useBet()
  const [filter, setFilter] = useState('all')

  const filtered = bets.filter(b => {
    if (filter === 'all') return true
    if (filter === 'open') return b.status === 'open'
    if (filter === 'won') return b.status === 'won'
    if (filter === 'lost') return b.status === 'lost'
    return true
  })

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-white mb-4">My Bets</h1>
      
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['all', 'open', 'won', 'lost'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1 rounded-full text-sm font-medium transition ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-card text-gray-400 hover:text-white'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState 
          icon="📋"
          title="No bets found"
          message={filter === 'all' ? "You haven't placed any bets yet." : `No ${filter} bets found.`}
          actionText="Browse matches"
          actionLink="/"
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((bet) => (
            <div key={bet.id} className="bg-card rounded-lg p-4 border border-white/5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-gray-400">{new Date(bet.date).toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {bet.selections?.length || 0} selection(s)
                  </div>
                  <div className="mt-2 text-sm">
                    {bet.selections?.map((sel, i) => (
                      <div key={i} className="text-gray-300">{sel.label} @ {sel.odds.toFixed(2)}</div>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${
                    bet.status === 'won' ? 'text-green-400' :
                    bet.status === 'lost' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {bet.status?.toUpperCase() || 'OPEN'}
                  </div>
                  <div className="text-xs text-gray-400">Stake: GHS {bet.stake?.toFixed(2) || '0.00'}</div>
                  <div className="text-xs text-gray-400">Odds: {bet.totalOdds?.toFixed(2) || '0.00'}</div>
                  {bet.status === 'won' && (
                    <div className="text-sm text-green-400 font-bold">
                      +GHS {bet.potentialWin?.toFixed(2) || '0.00'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyBets