import { useLocation } from 'react-router-dom'
import Navbar from '../components/navigation/Navbar'
import BottomNav from '../components/navigation/BottomNav'
import BetSlipFloatingButton from '../components/betslip/BetSlipFloatingButton'
import BetSlip from '../components/betslip/BetSlip'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useBet } from '../context/BetContext'

const Layout = ({ children }) => {
  const location = useLocation()
  
  // Try to use keyboard shortcuts, but handle error gracefully
  try {
    useKeyboardShortcuts()
  } catch (error) {
    // If BetProvider is not available, just skip keyboard shortcuts
    console.warn('Keyboard shortcuts unavailable:', error.message)
  }

  return (
    <div className="min-h-screen bg-dark pb-20">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-4">
        {children}
      </main>
      <BottomNav />
      <BetSlipFloatingButton />
      <BetSlip />
    </div>
  )
}

export default Layout