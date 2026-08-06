import { useState, useEffect } from 'react'
import { useSupabase } from '../context/SupabaseContext'
import { Link, useNavigate } from 'react-router-dom'
import { countries, defaultCountry } from '../data/countries'
import { convertFromGHS } from '../utils/currency'
import supabase from '../lib/supabase'

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry)
  const [password, setPassword] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [error, setError] = useState('')
  const [promoMessage, setPromoMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp, user } = useSupabase()
  const navigate = useNavigate()

  const [referralCodeParam, setReferralCodeParam] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) setReferralCodeParam(ref)
  }, [])

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setPromoMessage('')
    setLoading(true)

    try {
      // 1. Register user
      const fullPhone = `${selectedCountry.code}${phone}`
      const result = await signUp(name, email, fullPhone, password, selectedCountry.name, selectedCountry.code, selectedCountry.currency)
      if (!result.success) {
        setError(result.error || 'Registration failed')
        setLoading(false)
        return
      }

      const userId = result.user?.id
      if (!userId) {
        setError('User ID not found')
        setLoading(false)
        return
      }

      // 2. Handle referral (if any)
      const REFERRAL_BONUS_GHS = 50
      if (referralCodeParam) {
        const { data: referrer, error: refError } = await supabase
          .from('users')
          .select('id, currency')
          .eq('referral_code', referralCodeParam.toUpperCase())
          .single()

        if (!refError && referrer) {
          const referrerCurrency = referrer.currency || 'GHS'
          const refereeCurrency = selectedCountry.currency || 'GHS'

          const referrerBonus = await convertFromGHS(REFERRAL_BONUS_GHS, referrerCurrency)
          const refereeBonus = await convertFromGHS(REFERRAL_BONUS_GHS, refereeCurrency)

          await supabase
            .from('users')
            .update({ referred_by: referrer.id })
            .eq('id', userId)

          await supabase
            .from('referral_earnings')
            .insert([
              { referrer_id: referrer.id, referee_id: userId, bonus_amount: referrerBonus, status: 'completed' },
              { referrer_id: userId, referee_id: referrer.id, bonus_amount: refereeBonus, status: 'completed' },
            ])

          const { data: referrerBalance } = await supabase
            .from('balances')
            .select('available')
            .eq('user_id', referrer.id)
            .single()
          await supabase
            .from('balances')
            .update({ available: (referrerBalance?.available || 0) + referrerBonus })
            .eq('user_id', referrer.id)

          const { data: refereeBalance } = await supabase
            .from('balances')
            .select('available')
            .eq('user_id', userId)
            .single()
          await supabase
            .from('balances')
            .update({ available: (refereeBalance?.available || 0) + refereeBonus })
            .eq('user_id', userId)
        }
      }

      // 3. Handle promo code (if any)
      if (promoCode.trim()) {
        const { data: promo, error: promoError } = await supabase
          .from('promo_codes')
          .select('*')
          .eq('code', promoCode.trim().toUpperCase())
          .eq('active', true)
          .single()

        if (!promoError && promo) {
          // Check if already redeemed
          const { data: redeemed } = await supabase
            .from('user_promo_redemptions')
            .select('id')
            .eq('user_id', userId)
            .eq('promo_code_id', promo.id)
            .maybeSingle()

          if (!redeemed) {
            // ✅ Fixed expiry check – compare only date
            let isExpired = false
            if (promo.expires_at) {
              const expiryDate = new Date(promo.expires_at)
              const today = new Date()
              if (
                expiryDate.getFullYear() < today.getFullYear() ||
                (expiryDate.getFullYear() === today.getFullYear() && expiryDate.getMonth() < today.getMonth()) ||
                (expiryDate.getFullYear() === today.getFullYear() && expiryDate.getMonth() === today.getMonth() && expiryDate.getDate() < today.getDate())
              ) {
                isExpired = true
              }
            }

            if (isExpired) {
              setPromoMessage('This promo code has expired')
            } else {
              // Convert and credit
              const promoBonusInUserCurrency = await convertFromGHS(promo.bonus_amount, selectedCountry.currency || 'GHS')

              const { data: currentBalance } = await supabase
                .from('balances')
                .select('available')
                .eq('user_id', userId)
                .single()

              await supabase
                .from('balances')
                .update({ available: (currentBalance?.available || 0) + promoBonusInUserCurrency })
                .eq('user_id', userId)

              await supabase
                .from('user_promo_redemptions')
                .insert({
                  user_id: userId,
                  promo_code_id: promo.id,
                  bonus_amount: promoBonusInUserCurrency,
                })

              await supabase
                .from('promo_codes')
                .update({ used_count: promo.used_count + 1 })
                .eq('id', promo.id)

              setPromoMessage(`🎉 Promo code redeemed!`)
            }
          } else {
            setPromoMessage('You have already redeemed this code')
          }
        } else {
          setPromoMessage('Invalid or expired promo code')
        }
      }

      // 4. Redirect to login
      navigate('/login', { state: { message: 'Registration successful! Please login.' } })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Registration failed')
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

          {/* Promo Code Input */}
          <div>
            <label className="text-sm text-gray-400 block mb-1">Promo Code (optional)</label>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="w-full bg-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary outline-none transition"
              placeholder="Enter promo code if you have one"
            />
            {promoMessage && (
              <div className={`text-sm mt-1 ${promoMessage.includes('🎉') ? 'text-green-400' : 'text-red-400'}`}>
                {promoMessage}
              </div>
            )}
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