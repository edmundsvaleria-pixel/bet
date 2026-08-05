import { createContext, useContext, useState, useEffect } from 'react'
import { useWallet } from './WalletContext'

const BetContext = createContext()

export const BetProvider = ({ children }) => {
  const [selections, setSelections] = useState(() => {
    const saved = localStorage.getItem('betzone_selections')
    return saved ? JSON.parse(saved) : []
  })
  const [stake, setStake] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [bets, setBets] = useState(() => {
    const saved = localStorage.getItem('betzone_bets')
    return saved ? JSON.parse(saved) : []
  })

  const { balance, updateBalance, addTransaction } = useWallet()

  // Persist selections and bets to localStorage
  useEffect(() => {
    localStorage.setItem('betzone_selections', JSON.stringify(selections))
  }, [selections])

  useEffect(() => {
    localStorage.setItem('betzone_bets', JSON.stringify(bets))
  }, [bets])

  // ✅ ADD SELECTION - THIS WAS MISSING!
  const addSelection = (matchId, market, odds, label) => {
    const exists = selections.find(s => s.matchId === matchId && s.market === market)
    if (exists) {
      const updated = selections.map(s =>
        s.matchId === matchId && s.market === market ? { ...s, odds } : s
      )
      setSelections(updated)
    } else {
      setSelections([...selections, { matchId, market, odds, label }])
    }
  }

  const removeSelection = (matchId, market) => {
    setSelections(selections.filter(s => !(s.matchId === matchId && s.market === market)))
  }

  const clearSelections = () => setSelections([])

  const getTotalOdds = () => {
    if (selections.length === 0) return 0
    return selections.reduce((acc, s) => acc * s.odds, 1)
  }

  const getPotentialWinnings = () => {
    const totalOdds = getTotalOdds()
    return stake * totalOdds
  }

  const placeBet = async () => {
    if (selections.length === 0) throw new Error('No selections')
    if (stake <= 0) throw new Error('Invalid stake')
    if (stake > balance.available) throw new Error('Insufficient balance')

    const totalOdds = getTotalOdds()
    const potentialWin = stake * totalOdds

    // Deduct from available balance
    const newAvailable = balance.available - stake
    updateBalance({ ...balance, available: newAvailable })

    // Create bet record
    const bet = {
      id: Date.now(),
      selections: selections.map(s => ({ ...s })),
      stake,
      totalOdds,
      potentialWin,
      status: 'open',
      date: new Date().toISOString(),
      settled: false,
    }
    setBets(prev => [bet, ...prev])

    // Add transaction
    addTransaction({
      type: 'bet',
      amount: -stake,
      description: `Bet placed on ${selections.length} selection(s)`,
      date: new Date().toISOString(),
    })

    // Clear selections and reset stake
    clearSelections()
    setStake(0)
    setIsOpen(false)

    return bet
  }

  // Admin functions
  const getOpenBets = () => {
    return bets.filter(b => b.status === 'open' && !b.settled)
  }

  const getSettledBets = () => {
    return bets.filter(b => b.settled)
  }

  const adminSettleBet = (betId, status) => {
    const bet = bets.find(b => b.id === betId)
    if (!bet) return
    if (bet.settled) return

    const updatedBets = bets.map(b => {
      if (b.id !== betId) return b
      const settledBet = { ...b, status, settled: true, settledAt: new Date().toISOString() }

      if (status === 'won') {
        const winnings = b.stake * b.totalOdds
        const newBalance = {
          ...balance,
          withdrawable: balance.withdrawable + winnings,
        }
        updateBalance(newBalance)
        addTransaction({
          type: 'win',
          amount: winnings,
          description: `Admin settled bet as win`,
          date: new Date().toISOString(),
        })
      } else if (status === 'void') {
        const newBalance = {
          ...balance,
          available: balance.available + b.stake,
        }
        updateBalance(newBalance)
        addTransaction({
          type: 'refund',
          amount: b.stake,
          description: `Admin voided bet, stake refunded`,
          date: new Date().toISOString(),
        })
      }
      return settledBet
    })

    setBets(updatedBets)
  }

  const openBetSlip = () => setIsOpen(true)
  const closeBetSlip = () => setIsOpen(false)

  return (
    <BetContext.Provider
      value={{
        selections,
        stake,
        setStake,
        isOpen,
        bets,
        addSelection,        // ✅ EXPORTED
        removeSelection,
        clearSelections,
        getTotalOdds,
        getPotentialWinnings,
        placeBet,
        getOpenBets,
        getSettledBets,
        adminSettleBet,
        openBetSlip,
        closeBetSlip,
      }}
    >
      {children}
    </BetContext.Provider>
  )
}

export const useBet = () => {
  const context = useContext(BetContext)
  if (!context) {
    throw new Error('useBet must be used within a BetProvider')
  }
  return context
}