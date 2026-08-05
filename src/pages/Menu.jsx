import { Link } from 'react-router-dom'
import { useSupabase } from '../context/SupabaseContext'
import { User, Settings, HelpCircle, LogOut, Shield, MessageCircle, FileText } from 'lucide-react'

const Menu = () => {
  const { user, signOut } = useSupabase()
  const isAdmin = user?.role === 'admin'

  const menuItems = [
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: MessageCircle, label: 'Support', path: '/support' },
    { icon: FileText, label: 'Terms & Conditions', path: '/terms' },
    { icon: Settings, label: 'Settings', path: '/profile' },
    { icon: HelpCircle, label: 'About', path: '/profile' },
  ]

  // 🔒 Only add Admin Dashboard if user is admin
  if (isAdmin) {
    menuItems.push({ icon: Shield, label: 'Admin Dashboard', path: '/admin' })
  }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-white mb-4">Menu</h1>
      <div className="bg-card rounded-2xl border border-white/5 overflow-hidden">
        {menuItems.map((item, idx) => (
          <Link
            key={idx}
            to={item.path}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 last:border-0"
          >
            <item.icon size={20} className="text-gray-400" />
            <span className="text-white">{item.label}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition w-full text-left border-t border-white/5"
        >
          <LogOut size={20} className="text-red-400" />
          <span className="text-red-400">Logout</span>
        </button>
      </div>
      {user && (
        <div className="mt-4 text-center text-xs text-gray-500">
          Logged in as {user.email} ({user.role || 'user'})
        </div>
      )}
    </div>
  )
}

export default Menu