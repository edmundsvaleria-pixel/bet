import { useState, useEffect } from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import { useNotification } from '../../context/NotificationContext'
import ConfirmModal from '../common/ConfirmModal'

const UserList = () => {
  const [users, setUsers] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const { getAllUsers, adminUpdateUser, adminDeleteUser } = useSupabase()
  const { showNotification } = useNotification()

  const refreshUsers = async () => {
    const data = await getAllUsers()
    setUsers(data)
  }

  useEffect(() => {
    refreshUsers()
  }, [])

  // Toggle active – deactivation revokes sessions instantly
  const handleToggleActive = async (email) => {
    const user = users.find(u => u.email === email)
    if (!user) return
    const newStatus = !user.active
    const result = await adminUpdateUser(user.id, { active: newStatus })
    if (result.success) {
      refreshUsers()
      showNotification(`User ${email} ${newStatus ? 'activated' : 'deactivated'} and logged out if inactive.`, 'success')
    } else {
      showNotification(result.error || 'Action failed', 'error')
    }
  }

  // Change role (immediate update)
  const handleChangeRole = async (email, newRole) => {
    const user = users.find(u => u.email === email)
    if (!user) return
    const result = await adminUpdateUser(user.id, { role: newRole })
    if (result.success) {
      refreshUsers()
      showNotification(`User ${email} role changed to ${newRole}`, 'success')
    } else {
      showNotification(result.error || 'Action failed', 'error')
    }
  }

  // Delete user (permanent)
  const handleDeleteUser = (email, name) => {
    setDeleteTarget({ email, name })
    setShowConfirm(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const { email } = deleteTarget
    const user = users.find(u => u.email === email)
    if (!user) return
    const result = await adminDeleteUser(user.id)
    if (result.success) {
      refreshUsers()
      showNotification(`User "${deleteTarget.name}" (${email}) permanently deleted`, 'success')
    } else {
      showNotification(result.error || 'Delete failed', 'error')
    }
    setDeleteTarget(null)
    setShowConfirm(false)
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 text-gray-400">Name</th>
              <th className="text-left py-2 text-gray-400">Email</th>
              <th className="text-left py-2 text-gray-400">Phone</th>
              <th className="text-left py-2 text-gray-400">Country</th>
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
                <td className="py-2 text-white">{u.country || '-'}</td>
                <td className="py-2 text-white capitalize">{u.role}</td>
                <td className="py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${u.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2 flex gap-1 flex-wrap">
                  <button
                    onClick={() => handleToggleActive(u.email)}
                    className={`text-xs px-2 py-1 rounded transition ${
                      u.active
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'
                    }`}
                  >
                    {u.active ? 'Deactivate' : 'Activate'}
                  </button>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleChangeRole(u.email, 'admin')}
                      className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded hover:bg-yellow-500 hover:text-white transition"
                    >
                      Make Admin
                    </button>
                  )}
                  {u.role === 'admin' && u.email !== 'admin@betzone.com' && (
                    <button
                      onClick={() => handleChangeRole(u.email, 'user')}
                      className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded hover:bg-gray-500 hover:text-white transition"
                    >
                      Remove Admin
                    </button>
                  )}
                  {u.email !== 'admin@betzone.com' && (
                    <button
                      onClick={() => handleDeleteUser(u.email, u.name)}
                      className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500 hover:text-white transition"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false)
          setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to permanently delete user "${deleteTarget?.name}" (${deleteTarget?.email})? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="bg-red-500 hover:bg-red-600"
      />
    </>
  )
}

export default UserList