import { useBet } from '../../context/BetContext'

const BetSlipFloatingButton = () => {
  try {
    const { selections, openBetSlip } = useBet()
    const count = selections.length

    if (count === 0) return null

    return (
      <button
        onClick={openBetSlip}
        className="fixed bottom-20 right-4 z-40 bg-primary text-white p-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-primary/80 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
        <span className="bg-white text-dark rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
          {count}
        </span>
      </button>
    )
  } catch (error) {
    return null
  }
}

export default BetSlipFloatingButton