import { useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useBet } from '../../context/BetContext'
import { ShoppingCart } from 'lucide-react'

const BetSlipFloatingButton = () => {
  const { selections, openBetSlip } = useBet()
  const location = useLocation()
  const count = selections.length

  // Only show on homepage and if there are selections
  if (location.pathname !== '/') return null
  if (count === 0) return null

  // Position state (default bottom‑right)
  const [position, setPosition] = useState(() => {
    const x = window.innerWidth - 80
    const y = window.innerHeight - 120
    return { x, y }
  })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef(null)
  const offsetRef = useRef({ x: 0, y: 0 })

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
    const rect = dragRef.current.getBoundingClientRect()
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const btnWidth = 80
    const btnHeight = 80
    const maxX = window.innerWidth - btnWidth
    const maxY = window.innerHeight - btnHeight
    const newX = e.clientX - offsetRef.current.x
    const newY = e.clientY - offsetRef.current.y
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // Touch drag handlers
  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    const rect = dragRef.current.getBoundingClientRect()
    offsetRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    }
    setIsDragging(true)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const btnWidth = 80
    const btnHeight = 80
    const maxX = window.innerWidth - btnWidth
    const maxY = window.innerHeight - btnHeight
    const newX = touch.clientX - offsetRef.current.x
    const newY = touch.clientY - offsetRef.current.y
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }

  // Click – only open if not dragging
  const handleClick = (e) => {
    if (isDragging) return
    openBetSlip()
  }

  return (
    <button
      ref={dragRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className="fixed z-50 bg-primary text-white p-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-primary/80 transition touch-none select-none"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <ShoppingCart size={24} />
      <span className="bg-white text-dark rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
        {count}
      </span>
    </button>
  )
}

export default BetSlipFloatingButton