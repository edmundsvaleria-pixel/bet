const dummyUpcoming = [
  { id: 1, home: 'Tottenham', away: 'Newcastle', time: '20:00', league: 'Premier League' },
  { id: 2, home: 'Juventus', away: 'Roma', time: '21:45', league: 'Serie A' },
  { id: 3, home: 'Benfica', away: 'Porto', time: '19:00', league: 'Primeira Liga' },
]

const UpcomingMatches = () => {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-3">📅 Upcoming Matches</h2>
      <div className="space-y-2">
        {dummyUpcoming.map((match) => (
          <div key={match.id} className="bg-card rounded-lg p-3 flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-400">{match.league}</div>
              <div className="text-sm font-medium">{match.home} vs {match.away}</div>
            </div>
            <div className="text-sm text-gray-400">{match.time}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default UpcomingMatches