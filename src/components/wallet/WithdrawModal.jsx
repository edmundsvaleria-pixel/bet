import { useState } from 'react'
import { useWallet } from '../../context/WalletContext'
import { useSupabase } from '../../context/SupabaseContext'
import { useSystemSettings } from '../../context/SystemSettingsContext'
import { useNotification } from '../../context/NotificationContext'
import { X, Loader2 } from 'lucide-react'

const WithdrawModal = ({ isOpen, onClose, currency = 'GHS' }) => {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form') // 'form' | 'pay_commission' | 'submitted'
  const [commissionRef, setCommissionRef] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const { balance, withdraw, canWithdraw, depositCount } = useWallet()
  const { user } = useSupabase()
  const { settings } = useSystemSettings()
  const { showNotification } = useNotification()

  // ✅ Use the user's currency
  const displayCurrency = currency

  if (!isOpen) return null

  const val = parseFloat(amount)
  const commission = val * (settings.commissionRate / 100)
  const netAmount = val - commission
  const minWithdrawal = settings.minWithdrawal || 10000

  const handleCommissionPayment = async () => {
    if (isNaN(val) || val < minWithdrawal) {
      setError(`Minimum withdrawal is ${displayCurrency} ${minWithdrawal}`)
      return
    }
    if (val > balance.withdrawable) {
      setError('Insufficient withdrawable balance')
      return
    }
    if (!canWithdraw()) {
      setError('Withdrawal requirements not met. Need at least 3 deposits.')
      return
    }

    setStep('pay_commission')
    setError('')
  }

  const processCommissionPayment = async () => {
    setLoading(true)
    setError('')

    try {
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
      if (!publicKey) throw new Error('Paystack public key not configured.')

      const email = user?.email || 'user@example.com'
      const amountInKobo = Math.round(commission * 100)

      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: email,
        amount: amountInKobo,
        currency: displayCurrency,
        ref: `COMMISSION-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        metadata: {
          custom_fields: [
            { display_name: "Payment Type", variable_name: "payment_type", value: "Withdrawal Commission" },
            { display_name: "Withdrawal Amount", variable_name: "withdrawal_amount", value: val.toString() },
          ]
        },
        callback: function(response) {
          const reference = response.reference
          setCommissionRef(reference)
          setStep('submitted')
          showNotification(`Commission of ${displayCurrency} ${commission.toFixed(2)} paid successfully!`, 'success')
          setLoading(false)
          submitWithdrawal(reference)
        },
        onClose: function() {
          showNotification('Commission payment cancelled.', 'warning')
          setStep('form')
          setLoading(false)
        }
      })

      handler.openIframe()
    } catch (err) {
      console.error('Commission payment error:', err)
      setError(err.message || 'Payment failed. Please try again.')
      showNotification(err.message || 'Payment failed. Please try again.', 'error')
      setLoading(false)
    }
  }

  const submitWithdrawal = async (reference) => {
    try {
      const result = await withdraw(val, reference, commission)
      if (result.success) {
        setSuccessMsg(`Withdrawal request submitted! Commission reference: ${reference}`)
        setAmount('')
        setTimeout(() => {
          onClose()
          setStep('form')
          setCommissionRef('')
          setSuccessMsg('')
        }, 3000)
      } else {
        setError(result.error || 'Withdrawal submission failed')
        showNotification(result.error || 'Withdrawal submission failed', 'error')
      }
    } catch (err) {
      setError(err.message || 'Withdrawal submission failed')
      showNotification(err.message || 'Withdrawal submission failed', 'error')
    }
  }

  if (step === 'submitted') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />
        <div className="relative bg-card rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl text-center">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-white mb-2">Withdrawal Submitted</h3>
          <p className="text-gray-400 text-sm">Your withdrawal request has been submitted successfully.</p>
          <p className="text-xs text-gray-500 mt-2">Commission Reference: {commissionRef}</p>
          {successMsg && <p className="text-green-400 text-sm mt-2">{successMsg}</p>}
          <button
            onClick={() => {
              onClose()
              setStep('form')
              setCommissionRef('')
              setSuccessMsg('')
            }}
            className="mt-4 bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-card rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>

        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">
            {step === 'pay_commission' ? 'Pay Commission' : 'Withdraw Funds'}
          </h3>
          <p className="text-gray-400 text-sm">
            {step === 'pay_commission'
              ? `Pay ${displayCurrency} ${commission.toFixed(2)} commission to proceed`
              : `${displayCurrency} ${balance.withdrawable?.toFixed(2) || '0.00'} withdrawable`}
          </p>
        </div>

        {step === 'form' ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Amount ({displayCurrency})</label>
              <input
                type="number"
                min={minWithdrawal}
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-dark border border-white/10 rounded-lg px-4 py-3 text-white text-lg focus:border-primary outline-none transition"
                placeholder={`Min. ${minWithdrawal}`}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum: {displayCurrency} {minWithdrawal} | Commission: {settings.commissionRate}%</p>
            </div>

            {val >= minWithdrawal && (
              <div className="bg-dark/50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Withdrawable:</span>
                  <span className="text-white font-bold">{displayCurrency} {val.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Commission ({settings.commissionRate}%):</span>
                  <span className="text-red-400">-{displayCurrency} {commission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-white/10 pt-1">
                  <span className="text-gray-400">You receive:</span>
                  <span className="text-green-400">{displayCurrency} {netAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <div className="text-xs text-gray-400 space-y-1">
              <p>• Deposits made: {depositCount || 0} (need at least 3)</p>
              <p>• Withdrawable balance: {displayCurrency} {balance.withdrawable?.toFixed(2) || '0.00'}</p>
              {!canWithdraw() && <p className="text-yellow-400">⚠️ Withdrawal requirements not met</p>}
            </div>

            <button
              onClick={handleCommissionPayment}
              disabled={!canWithdraw() || loading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-dark font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Proceed to Pay Commission'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-dark/50 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm">Commission Amount</p>
              <p className="text-2xl font-bold text-yellow-400">{displayCurrency} {commission.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Withdrawal: {displayCurrency} {val.toFixed(2)}</p>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button
              onClick={processCommissionPayment}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                `Pay ${displayCurrency} ${commission.toFixed(2)} with Paystack`
              )}
            </button>

            <button
              onClick={() => setStep('form')}
              className="w-full text-gray-400 hover:text-white text-sm py-2"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default WithdrawModal