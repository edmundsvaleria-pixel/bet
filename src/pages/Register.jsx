import { useState, useEffect } from 'react'
import { useSupabase } from '../context/SupabaseContext'
import { Link, useNavigate } from 'react-router-dom'
import { countries, defaultCountry } from '../data/countries'

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp, user } = useSupabase()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fullPhone = `${selectedCountry.code}${phone}`
      const result = await signUp(name, email, fullPhone, password, selectedCountry.name, selectedCountry.code, selectedCountry.currency)
      if (result.success) {
        navigate('/login', { state: { message: 'Registration successful! Please login.' } })
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (user) return null

  return (
    <div className="py-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-white text-center mb-6">Join BetZone</h1>
      <div className="bg-card rounded-2xl p-6 border border-white/5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none transition"
              placeholder="Enter your full name"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none transition"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Phone Number</label>
            <div className="flex gap-2">
              <select
                value={selectedCountry.code}
                onChange={(e) => {
                  const country = countries.find(c => c.code === e.target.value)
                  setSelectedCountry(country || defaultCountry)
                }}
                className="w-1/3 bg-dark border border-white/10 rounded-lg px-2 py-2 text-white text-sm focus:border-primary outline-none transition"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none transition"
                placeholder="Enter phone number"
                required
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Country: {selectedCountry.name} • Currency: {selectedCountry.currency}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none transition"
              placeholder="Create a password (min 6 characters)"
              required
              minLength={6}
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
        </p>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            By registering, you agree to our{' '}
            <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link>
            {' '}and confirm that you are at least 18 years old.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register