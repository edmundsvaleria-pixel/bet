import { useState } from 'react'
import { useSupabase } from '../context/SupabaseContext'
import { useNotification } from '../context/NotificationContext'
import { Eye, EyeOff } from 'lucide-react'
import supabase from '../lib/supabase'

const Profile = () => {
  const { user, balance, signOut } = useSupabase()
  const { showNotification } = useNotification()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  if (!user) {
    return (
      <div className="py-4 text-center">
        <p className="text-gray-400">Please login to view profile.</p>
        <a href="/login" className="text-primary hover:underline">Login</a>
      </div>
    )
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setLoading(true)

    // Validate
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      setLoading(false)
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      // ✅ Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        // ✅ Show specific error message
        if (error.message.includes('Password should be different')) {
          setPasswordError('New password must be different from current')
        } else {
          setPasswordError(error.message)
        }
        setLoading(false)
        return
      }

      showNotification('Password updated successfully!', 'success')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError('')
    } catch (err) {
      console.error(err)
      setPasswordError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-white mb-4">Profile</h1>
      <div className="bg-card rounded-2xl p-6 border border-white/5 space-y-3">
        <div>
          <div className="text-sm text-gray-400">Name</div>
          <div className="text-white font-medium">{user.name || 'N/A'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Email</div>
          <div className="text-white font-medium">{user.email}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Role</div>
          <div className="text-white font-medium capitalize">{user.role || 'User'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Available Balance</div>
          <div className="text-white font-bold">GHS {balance.available?.toFixed(2) || '0.00'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Withdrawable Balance</div>
          <div className="text-white font-bold">GHS {balance.withdrawable?.toFixed(2) || '0.00'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Phone</div>
          <div className="text-white font-medium">{user.phone || 'N/A'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Country</div>
          <div className="text-white font-medium">{user.country || 'N/A'}</div>
        </div>

        {/* Change Password Section */}
        <div className="border-t border-white/10 pt-4 mt-4">
          <h3 className="text-lg font-bold text-white mb-3">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-dark border border-white/10 rounded-lg px-4 py-2 pr-10 text-white focus:border-primary outline-none transition"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-dark border border-white/10 rounded-lg px-4 py-2 pr-10 text-white focus:border-primary outline-none transition"
                  placeholder="Enter new password (min 6 chars)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-dark border border-white/10 rounded-lg px-4 py-2 pr-10 text-white focus:border-primary outline-none transition"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {passwordError && (
              <div className="text-red-400 text-sm">{passwordError}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile