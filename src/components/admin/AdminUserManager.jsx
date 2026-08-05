import { useState, useEffect } from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import { useNotification } from '../../context/NotificationContext'

const AdminUserManager = () => {
  const { getAllUsers, adminUpdateUser } = useSupabase()
  const { showNotification } = useNotification()
  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const data = await getAllUsers()
    setUsers(data)
  }

  const handleToggleActive = async (email) => {
    const user = users.find(u => u.email === email)
    if (!user) return
    const newStatus = !user.active
    const result = await adminUpdateUser(user.id, { active: newStatus })
    if (result.success) {
      loadUsers()
      showNotification(`User ${email} ${newStatus ? 'activated' : 'deactivated'}`, 'success')
    } else {
      showNotification(result.error || 'Action failed', 'error')
    }
  }

  const handleChangeRole = async (email, role) => {
    const user = users.find(u => u.email === email)
    if (!user) return
    const result = await adminUpdateUser(user.id, { role })
    if (result.success) {
      loadUsers()
      showNotification(`User ${email} role changed to ${role}`, 'success')
    } else {
      showNotification(result.error || 'Action failed', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">User Management</h3>
      {message && <div className="text-green-400 text-sm">{message}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 text-gray-400">Name</th>
              <th className="text-left py-2 text-gray-400">Email</th>
              <th className="text-left py-2 text-gray-400">Phone</th>
              <th className="text-left py-2 text-gray-400">Role</th>
              <th className="text-left py-2 text-gray-400">Status</th>
              <th className="text-left py-2 text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email} className="border-b border-white/5">
                <td className="py-2 text-white">{u.name}</td>
                <td className="py-2 text-white">{u.email}</td>
                <td className="py-2 text-white">{u.phone || '-'}</td>
                <td className="py-2 text-white capitalize">{u.role}</td>
                <td className="py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${u.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2 flex gap-1 flex-wrap">
                  <button
                    onClick={() => handleToggleActive(u.email)}
                    className={`text-xs px-2 py-1 rounded ${u.active ? 'bg-red-500/20 text-red-400 hover:bg-red-500' : 'bg-green-500/20 text-green-400 hover:bg-green-500'}`}
                  >
                    {u.active ? 'Deactivate' : 'Activate'}
                  </button>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleChangeRole(u.email, 'admin')}
                      className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded hover:bg-yellow-500"
                    >
                      Make Admin
                    </button>
                  )}
                  {u.role === 'admin' && u.email !== 'admin@betzone.com' && (
                    <button
                      onClick={() => handleChangeRole(u.email, 'user')}
                      className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded hover:bg-gray-500"
                    >
                      Remove Admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminUserManager