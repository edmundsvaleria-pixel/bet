import { useState } from 'react'
import { useWallet } from '../../context/WalletContext'
import { useSupabase } from '../../context/SupabaseContext'
import { useSystemSettings } from '../../context/SystemSettingsContext'
import { useNotification } from '../../context/NotificationContext'
import { X, Loader2 } from 'lucide-react'

const DepositModal = ({ isOpen, onClose, currency = 'GHS' }) => {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { deposit } = useWallet()
  const { user } = useSupabase()
  const { settings } = useSystemSettings()
  const { showNotification } = useNotification()

  if (!isOpen) return null

  // ✅ Countries that support Mobile Money (by currency)
  const mobileMoneyCurrencies = ['GHS', 'KES', 'NGN']
  const isMobileMoneySupported = mobileMoneyCurrencies.includes(currency)

  const handleDeposit = async () => {
    const val = parseFloat(amount)
    if (isNaN(val) || val < settings.minDeposit) {
      setError(`Minimum deposit is ${currency} ${settings.minDeposit}`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
      if (!publicKey) throw new Error('Paystack public key not configured.')

      const email = user?.email || 'user@example.com'
      const fullName = user?.name || 'BetZone User'
      const amountInKobo = val * 100

      // 1️⃣ Build the channels array based on country support
      let channels
      if (isMobileMoneySupported) {
        // Mobile Money only – user gets the simple prompt
        channels = ['mobile_money']
      } else {
        // All channels – user sees full Paystack popup
        channels = ['card', 'bank', 'ussd', 'mobile_money', 'qr', 'bank_transfer']
      }

      // 2️⃣ If Mobile Money is supported, include the user's phone number
      const mobileMoneyPayload = {}
      if (isMobileMoneySupported && user?.phone) {
        // Paystack requires phone without "+" prefix, e.g., "233559326645"
        mobileMoneyPayload.mobile_money = {
          phone: user.phone.replace(/^\+/, ''),
        }
      }

      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: email,
        amount: amountInKobo,
        currency: currency,
        label: "BetZone Deposit",
        theme: {
          brandColor: '#2563EB',
          logo: 'https://betzonepassion.vercel.app/logo.png',
        },
        channels: channels, // 🔥 This controls what the user sees
        ...mobileMoneyPayload,
        metadata: {
          custom_fields: [
            { display_name: "Full Name", variable_name: "full_name", value: fullName },
            { display_name: "Platform", variable_name: "platform", value: "BetZone" }
          ]
        },
        ref: `BETZONE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        callback: function(response) {
          const reference = response.reference
          console.log('Payment successful! Reference:', reference)
          showNotification(
            `Deposit of ${currency} ${val.toFixed(2)} successful! Reference: ${reference.slice(0, 10)}...`,
            'success'
          )
          setAmount('')
          onClose()
          setLoading(false)
        },
        onClose: function() {
          showNotification('Payment cancelled.', 'warning')
          setLoading(false)
        }
      })

      handler.openIframe()
    } catch (err) {
      console.error('Deposit error:', err)
      setError(err.message || 'Payment failed. Please try again.')
      showNotification(err.message || 'Payment failed. Please try again.', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-card rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">Deposit Funds</h3>
          <p className="text-gray-400 text-sm">
            {isMobileMoneySupported 
              ? 'Mobile Money (prompt will be sent to your phone)' 
              : 'Choose your preferred payment method'}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Amount ({currency})</label>
            <input
              type="number"
              min={settings.minDeposit}
              step="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-dark border border-white/10 rounded-lg px-4 py-3 text-white text-lg focus:border-primary outline-none transition"
              placeholder={`Min. ${settings.minDeposit}`}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum deposit: {currency} {settings.minDeposit}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[200, 500, 1000, 2000, 5000].map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className="bg-dark border border-white/10 hover:border-primary px-3 py-1 rounded text-sm text-gray-300 hover:text-white transition"
              >
                {currency} {amt}
              </button>
            ))}
          </div>

          {error && <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-300 text-sm">{error}</div>}

          <button
            onClick={handleDeposit}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              isMobileMoneySupported ? 'Pay with Mobile Money' : 'Pay with Paystack'
            )}
          </button>

          <div className="flex items-center gap-2 justify-center text-xs text-gray-500">
            <span className="inline-block w-1 h-1 bg-green-400 rounded-full"></span>
            Secured by Paystack
          </div>

          {isMobileMoneySupported && (
            <p className="text-xs text-gray-500 text-center">
              A payment prompt will be sent to your phone. Authorize it with your PIN.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DepositModal