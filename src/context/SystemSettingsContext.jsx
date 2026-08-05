import { createContext, useContext, useState, useEffect } from 'react'
import supabase from '../lib/supabase'

const SystemSettingsContext = createContext()

export const SystemSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    minDeposit: 200,
    minWithdrawal: 10000,
    commissionRate: 19,
    maintenanceMode: false,
    registrationEnabled: true,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .limit(1)
          .maybeSingle()

        if (error) {
          console.warn('Settings fetch error, using defaults:', error.message)
          setLoading(false)
          return
        }

        if (data) {
          setSettings({
            minDeposit: data.min_deposit || 200,
            minWithdrawal: data.min_withdrawal || 10000,
            commissionRate: data.commission_rate || 19,
            maintenanceMode: data.maintenance_mode || false,
            registrationEnabled: data.registration_enabled !== undefined ? data.registration_enabled : true,
          })
        }
      } catch (error) {
        console.warn('Settings load error, using defaults:', error.message)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const updateSettings = async (newSettings) => {
    try {
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .limit(1)
        .maybeSingle()

      let result

      if (existing) {
        result = await supabase
          .from('system_settings')
          .update({
            min_deposit: newSettings.minDeposit,
            min_withdrawal: newSettings.minWithdrawal,
            commission_rate: newSettings.commissionRate,
            maintenance_mode: newSettings.maintenanceMode,
            registration_enabled: newSettings.registrationEnabled,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .maybeSingle()
      } else {
        result = await supabase
          .from('system_settings')
          .insert({
            min_deposit: newSettings.minDeposit || 200,
            min_withdrawal: newSettings.minWithdrawal || 10000,
            commission_rate: newSettings.commissionRate || 19,
            maintenance_mode: newSettings.maintenanceMode || false,
            registration_enabled: newSettings.registrationEnabled !== undefined ? newSettings.registrationEnabled : true,
          })
          .select()
          .maybeSingle()
      }

      if (result.error) throw result.error

      setSettings(newSettings)
      return { success: true }
    } catch (error) {
      console.error('Error updating settings:', error)
      return { success: false, error: error.message }
    }
  }

  return (
    <SystemSettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  )
}

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext)
  if (!context) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider')
  }
  return context
}