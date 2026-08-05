const dummyLive = [
  { id: 1, home: 'Man City', away: 'Arsenal', score: '1:0', time: '34\'' },
  { id: 2, home: 'AC Milan', away: 'Inter', score: '2:2', time: '67\'' },
  { id: 3, home: 'PSG', away: 'Marseille', score: '0:0', time: '12\'' },
]

const LiveMatches = () => {
  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-white">🔥 Live Matches</h2>
        <a href="/live" className="text-primary text-sm font-medium">View All</a>
      </div>
      <div className="space-y-3">
        {dummyLive.map((match) => (
          <div key={match.id} className="bg-card rounded-lg p-4 border border-red-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-red-500 text-sm font-bold animate-pulse">● LIVE</span>
                <span className="text-xs text-gray-400">{match.time}</span>
              </div>
              <span className="text-sm font-mono bg-dark px-2 py-0.5 rounded">
                {match.score}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-medium">{match.home}</span>
              <span className="text-xs text-gray-500">vs</span>
              <span className="font-medium">{match.away}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default LiveMatches