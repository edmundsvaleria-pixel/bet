const dummyFeatured = [
  {
    id: 1,
    league: 'Premier League',
    home: 'Liverpool',
    away: 'Chelsea',
    time: '20:00',
    odds: { home: 1.85, draw: 3.40, away: 4.20 },
  },
  {
    id: 2,
    league: 'La Liga',
    home: 'Barcelona',
    away: 'Real Madrid',
    time: '22:00',
    odds: { home: 2.10, draw: 3.30, away: 3.50 },
  },
  {
    id: 3,
    league: 'Bundesliga',
    home: 'Bayern Munich',
    away: 'Dortmund',
    time: '19:30',
    odds: { home: 1.60, draw: 4.00, away: 5.50 },
  },
]

const FeaturedMatches = () => {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-3">⭐ Featured Matches</h2>
      <div className="space-y-3">
        {dummyFeatured.map((match) => (
          <div key={match.id} className="bg-card rounded-lg p-4 border border-white/5">
            <div className="text-xs text-gray-400">{match.league}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-medium">{match.home}</span>
              <span className="text-xs text-gray-500">vs</span>
              <span className="font-medium">{match.away}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-400">{match.time}</span>
              <div className="flex gap-2">
                <button className="bg-primary/20 text-primary px-3 py-1 rounded text-sm font-bold hover:bg-primary hover:text-white transition">
                  {match.odds.home}
                </button>
                <button className="bg-primary/20 text-primary px-3 py-1 rounded text-sm font-bold hover:bg-primary hover:text-white transition">
                  {match.odds.draw}
                </button>
                <button className="bg-primary/20 text-primary px-3 py-1 rounded text-sm font-bold hover:bg-primary hover:text-white transition">
                  {match.odds.away}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default FeaturedMatches