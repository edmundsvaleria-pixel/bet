import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBet } from '../context/BetContext'

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate()
  const betContext = useBet()

  // Safety check – if betContext is undefined, return early
  if (!betContext) return

  const { openBetSlip, closeBetSlip, isOpen } = betContext

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + 1: Home
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault()
        navigate('/')
      }
      // Ctrl + 2: Live
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault()
        navigate('/live')
      }
      // Ctrl + 3: Wallet
      if (e.ctrlKey && e.key === '3') {
        e.preventDefault()
        navigate('/wallet')
      }
      // Ctrl + 4: My Bets
      if (e.ctrlKey && e.key === '4') {
        e.preventDefault()
        navigate('/my-bets')
      }
      // Ctrl + B: Toggle Bet Slip
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        if (isOpen) {
          closeBetSlip()
        } else {
          openBetSlip()
        }
      }
      // Escape: Close bet slip
      if (e.key === 'Escape' && isOpen) {
        closeBetSlip()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, openBetSlip, closeBetSlip, isOpen])
}