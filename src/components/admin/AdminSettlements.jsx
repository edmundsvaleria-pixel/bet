import { useState, useEffect } from 'react'
import { useBet } from '../../context/BetContext'

const AdminSettlements = () => {
  const { getOpenBets, getSettledBets, adminSettleBet } = useBet()
  const [openBets, setOpenBets] = useState([])
  const [settledBets, setSettledBets] = useState([])
  const [filter, setFilter] = useState('open') // open, settled

  useEffect(() => {
    setOpenBets(getOpenBets())
    setSettledBets(getSettledBets())
  }, [getOpenBets, getSettledBets])

  const handleSettle = (betId, status) => {
    adminSettleBet(betId, status)
    // Refresh lists
    setOpenBets(getOpenBets())
    setSettledBets(getSettledBets())
  }

  const betsToShow = filter === 'open' ? openBets : settledBets

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('open')}
          className={`px-4 py-1 rounded-lg text-sm font-medium transition ${
            filter === 'open' ? 'bg-primary text-white' : 'bg-dark text-gray-400 hover:text-white'
          }`}
        >
          Open Bets ({openBets.length})
        </button>
        <button
          onClick={() => setFilter('settled')}
          className={`px-4 py-1 rounded-lg text-sm font-medium transition ${
            filter === 'settled' ? 'bg-primary text-white' : 'bg-dark text-gray-400 hover:text-white'
          }`}
        >
          Settled ({settledBets.length})
        </button>
      </div>

      {betsToShow.length === 0 ? (
        <div className="text-gray-400 text-center py-4">No bets in this category</div>
      ) : (
        <div className="space-y-3">
          {betsToShow.map((bet) => (
            <div key={bet.id} className="bg-dark/50 rounded-lg p-3 border border-white/5">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-xs text-gray-400">{new Date(bet.date).toLocaleString()}</div>
                  <div className="text-sm text-white mt-1">Stake: GHS {bet.stake.toFixed(2)}</div>
                  <div className="text-sm text-white">Odds: {bet.totalOdds.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Selections: {bet.selections.map(s => `${s.label} (${s.market})`).join(', ')}
                  </div>
                  <div className="text-xs text-gray-500">Match IDs: {bet.selections.map(s => s.matchId).join(', ')}</div>
                  {bet.status !== 'open' && (
                    <div className={`text-sm font-bold mt-1 ${
                      bet.status === 'won' ? 'text-green-400' : 
                      bet.status === 'lost' ? 'text-red-400' : 
                      'text-yellow-400'
                    }`}>
                      Status: {bet.status.toUpperCase()}
                      {bet.status === 'won' && ` (+GHS ${(bet.stake * bet.totalOdds).toFixed(2)})`}
                    </div>
                  )}
                </div>
                {bet.status === 'open' && !bet.settled && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleSettle(bet.id, 'won')}
                      className="bg-green-500 hover:bg-green-400 text-white text-xs px-2 py-1 rounded"
                    >
                      Win
                    </button>
                    <button
                      onClick={() => handleSettle(bet.id, 'lost')}
                      className="bg-red-500 hover:bg-red-400 text-white text-xs px-2 py-1 rounded"
                    >
                      Lose
                    </button>
                    <button
                      onClick={() => handleSettle(bet.id, 'void')}
                      className="bg-yellow-500 hover:bg-yellow-400 text-dark text-xs px-2 py-1 rounded"
                    >
                      Void
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminSettlements