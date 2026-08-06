import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useBet } from '../../context/BetContext'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const HeroCarousel = ({ matches }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchEndX, setTouchEndX] = useState(0)
  const carouselRef = useRef(null)
  const { addSelection } = useBet()

  if (!matches || matches.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-8 text-center text-gray-400">
        No upcoming matches available
      </div>
    )
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % matches.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + matches.length) % matches.length)
  }

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStartX - touchEndX > 50) {
      nextSlide()
    }
    if (touchStartX - touchEndX < -50) {
      prevSlide()
    }
  }

  const handleTouchMove = (e) => {
    setTouchEndX(e.touches[0].clientX)
  }

  const currentMatch = matches[currentIndex]

  const handleAddBet = (market, oddsValue, label, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!oddsValue) return
    addSelection(currentMatch.fixture.id, market, oddsValue, label)
  }

  const OddsButton = ({ label, oddsValue, market }) => {
    if (!oddsValue) return null
    return (
      <button
        onClick={(e) => handleAddBet(market, oddsValue, label, e)}
        className="bg-primary/30 hover:bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold transition"
      >
        {label} <span className="ml-1 text-yellow-300">{oddsValue.toFixed(2)}</span>
      </button>
    )
  }

  return (
    <div
      ref={carouselRef}
      className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-primary/20 to-secondary/20 border border-white/5"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Match Card – Full Width */}
      <Link to={`/match/${currentMatch.fixture.id}`} className="block">
        <div className="p-6 min-h-[220px] flex flex-col justify-between">
          {/* League */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {currentMatch.league.logo && (
              <img src={currentMatch.league.logo} alt="" className="w-5 h-5 object-contain" />
            )}
            <span>{currentMatch.league.name}</span>
            {currentMatch.isCustom && <span className="text-yellow-400 ml-1">⭐ Custom</span>}
          </div>

          {/* Teams & Score/Time */}
          <div className="flex items-center justify-between my-3">
            <div className="flex items-center gap-3">
              {currentMatch.teams.home.logo && (
                <img src={currentMatch.teams.home.logo} alt="" className="w-10 h-10 object-contain" />
              )}
              <span className="font-bold text-white text-lg">{currentMatch.teams.home.name}</span>
            </div>

            <div className="text-center">
              {currentMatch.fixture.status.short === 'LIVE' ? (
                <>
                  <span className="text-red-500 text-sm font-bold animate-pulse">● LIVE</span>
                  <div className="text-2xl font-bold text-white">
                    {currentMatch.goals.home} : {currentMatch.goals.away}
                  </div>
                  <span className="text-xs text-gray-400">{currentMatch.fixture.status.elapsed}'</span>
                </>
              ) : (
                <div className="text-sm text-gray-400">
                  {new Date(currentMatch.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-white text-lg text-right">{currentMatch.teams.away.name}</span>
              {currentMatch.teams.away.logo && (
                <img src={currentMatch.teams.away.logo} alt="" className="w-10 h-10 object-contain" />
              )}
            </div>
          </div>

          {/* Odds Buttons */}
          <div className="flex gap-2 justify-end mt-2 flex-wrap">
            {currentMatch.odds?.h2h ? (
              <>
                <OddsButton label="1" oddsValue={currentMatch.odds.h2h.home} market="1X2_home" />
                <OddsButton label="X" oddsValue={currentMatch.odds.h2h.draw} market="1X2_draw" />
                <OddsButton label="2" oddsValue={currentMatch.odds.h2h.away} market="1X2_away" />
              </>
            ) : (
              <span className="text-xs text-gray-500">Odds unavailable</span>
            )}
          </div>
        </div>
      </Link>

      {/* Navigation Arrows */}
      {matches.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {matches.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {matches.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition ${
                idx === currentIndex ? 'bg-primary' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default HeroCarousel