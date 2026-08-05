const MatchList = ({ matches, isHistory = false }) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-gray-400 text-center py-4 text-sm">
        {isHistory ? 'No match history' : 'No custom matches'}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {matches.map((match) => (
        <div key={match.id} className="bg-dark/50 rounded-lg p-3 border border-white/5">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="text-sm font-medium text-white">
                {match.homeTeam} vs {match.awayTeam}
              </div>
              <div className="text-xs text-gray-400">{match.league}</div>
              
              {/* Match Status */}
              <div className="flex items-center gap-2 mt-1">
                {match.status === 'upcoming' && (
                  <span className="text-xs text-blue-400">⏰ Upcoming</span>
                )}
                {match.status === 'live' && (
                  <span className="text-xs text-red-400 animate-pulse">● LIVE {match.elapsed}'</span>
                )}
                {match.status === 'finished' && (
                  <span className="text-xs text-green-400">✓ Finished</span>
                )}
                {match.status === 'archived' && (
                  <span className="text-xs text-gray-400">📦 Archived</span>
                )}
                
                {/* Score */}
                {(match.status === 'live' || match.status === 'finished') && (
                  <span className="text-xs font-bold">
                    {match.goals.home} : {match.goals.away}
                  </span>
                )}
              </div>

              {/* Goal Timeline */}
              {match.goalTimeline && match.goalTimeline.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {match.goalTimeline.map((g, idx) => (
                    <span key={idx} className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                      {g.minute}' {g.team} ⚽
                    </span>
                  ))}
                </div>
              )}

              {/* Odds */}
              {match.odds && (
                <div className="mt-1 text-xs text-gray-500">
                  1X2: {match.odds.h2h?.home || '-'} / {match.odds.h2h?.draw || '-'} / {match.odds.h2h?.away || '-'} 
                  {match.odds.overUnder && ` | O/U: ${match.odds.overUnder}`}
                </div>
              )}
            </div>
            
            <div className="text-right text-xs ml-2">
              <div className="text-gray-400">{new Date(match.startTime).toLocaleString()}</div>
              {match.finishedAt && (
                <div className="text-gray-500 text-[10px]">Ended: {new Date(match.finishedAt).toLocaleTimeString()}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MatchList