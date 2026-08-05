const BetSlipItem = ({ selection, onRemove }) => {
  const { matchId, market, odds, label } = selection

  return (
    <div className="bg-dark/50 rounded-lg p-3 border border-white/10 flex justify-between items-center">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-gray-400">Market: {market}</div>
        <div className="text-xs text-primary font-bold">Odds: {odds.toFixed(2)}</div>
      </div>
      <button
        onClick={onRemove}
        className="text-red-500 hover:text-red-400 text-xl font-bold px-2"
      >
        ×
      </button>
    </div>
  )
}

export default BetSlipItem