import { Link } from 'react-router-dom'

const Hero = () => {
  return (
    <section className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white text-center shadow-lg">
      <div className="flex flex-col items-center">
        <span className="text-sm bg-yellow-400 text-dark px-3 py-1 rounded-full font-semibold mb-2">
          NEW CUSTOMER OFFER
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
          100% WELCOME BONUS
        </h1>
        <p className="text-xl md:text-2xl font-light mt-2">
          Up to <span className="font-bold text-accent">GHS 100</span> on your first deposit
        </p>
        <Link
          to="/register"
          className="mt-4 bg-accent text-dark font-bold py-3 px-8 rounded-full hover:bg-yellow-300 transition transform hover:scale-105 inline-block"
        >
          Join Now
        </Link>
      </div>
    </section>
  )
}

export default Hero