import { useState, useEffect } from 'react'
import { useSupabase } from '../context/SupabaseContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const Login = () => {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, user } = useSupabase()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  useEffect(() => {
    if (location.state?.message) setSuccessMsg(location.state.message)
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)
    try {
      const result = await signIn(identifier, password)
      if (result.success) {
        navigate('/')
      } else {
        if (result.error?.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account before logging in.')
        } else {
          setError(result.error || 'Invalid credentials')
        }
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (user) return null

  return (
    <div className="py-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-white text-center mb-6">Welcome Back</h1>
      <div className="bg-card rounded-2xl p-6 border border-white/5">
        {successMsg && (
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-green-300 text-sm mb-4">
            {successMsg}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Email or Phone</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none transition"
              placeholder="Enter email or phone number"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none transition"
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}

export default Login