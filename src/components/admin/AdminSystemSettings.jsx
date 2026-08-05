import { useState } from 'react'
import { useSystemSettings } from '../../context/SystemSettingsContext'

const AdminSystemSettings = () => {
  const { settings, updateSettings } = useSystemSettings()
  const [localSettings, setLocalSettings] = useState(settings)
  const [message, setMessage] = useState('')

  const handleChange = (key, value) => {
    setLocalSettings({ ...localSettings, [key]: value })
  }

  const handleSave = () => {
    updateSettings(localSettings)
    setMessage('Settings saved successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">System Settings</h3>
      {message && <div className="text-green-400 text-sm">{message}</div>}

      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-400 block">Minimum Deposit (GHS)</label>
          <input
            type="number"
            min="0"
            value={localSettings.minDeposit}
            onChange={(e) => handleChange('minDeposit', parseFloat(e.target.value) || 0)}
            className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block">Minimum Withdrawal (GHS)</label>
          <input
            type="number"
            min="0"
            value={localSettings.minWithdrawal}
            onChange={(e) => handleChange('minWithdrawal', parseFloat(e.target.value) || 0)}
            className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block">Commission Rate (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={localSettings.commissionRate}
            onChange={(e) => handleChange('commissionRate', parseFloat(e.target.value) || 0)}
            className="w-full bg-dark border border-white/10 rounded px-3 py-2 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={localSettings.maintenanceMode}
            onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <label className="text-sm text-gray-400">Maintenance Mode</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={localSettings.registrationEnabled}
            onChange={(e) => handleChange('registrationEnabled', e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <label className="text-sm text-gray-400">Registration Enabled</label>
        </div>
        <button
          onClick={handleSave}
          className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}

export default AdminSystemSettings