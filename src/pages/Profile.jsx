import { useSupabase } from '../context/SupabaseContext'

const Profile = () => {
  const { user, balance } = useSupabase()

  if (!user) {
    return (
      <div className="py-4 text-center">
        <p className="text-gray-400">Please login to view profile.</p>
        <a href="/login" className="text-primary hover:underline">Login</a>
      </div>
    )
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
      </div>
    </div>
  )
}

export default Profile