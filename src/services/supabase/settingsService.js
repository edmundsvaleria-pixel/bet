import supabase from '../../lib/supabase'

export const settingsService = {
  async getSettings() {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .maybeSingle()  // Use maybeSingle() to avoid 406

      if (error) {
        console.warn('Settings fetch error:', error.message)
        return null
      }

      if (data) {
        return data
      }

      // No settings found, try to create defaults
      return await this.createDefaultSettings()
    } catch (error) {
      console.error('Get settings error:', error)
      return null
    }
  },

  async createDefaultSettings() {
    try {
      const defaults = {
        min_deposit: 200,
        min_withdrawal: 10000,
        commission_rate: 19,
        maintenance_mode: false,
        registration_enabled: true,
      }

      const { data, error } = await supabase
        .from('system_settings')
        .insert(defaults)
        .select()
        .maybeSingle()

      if (error) {
        console.warn('Create default settings error:', error.message)
        return defaults // Return defaults even if insert fails
      }

      return data || defaults
    } catch (error) {
      console.error('Create default settings error:', error)
      return {
        min_deposit: 200,
        min_withdrawal: 10000,
        commission_rate: 19,
        maintenance_mode: false,
        registration_enabled: true,
      }
    }
  },

  async updateSettings(updates) {
    try {
      // First check if settings exist
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .limit(1)
        .maybeSingle()

      let result

      if (existing) {
        // Update existing
        result = await supabase
          .from('system_settings')
          .update({
            min_deposit: updates.min_deposit,
            min_withdrawal: updates.min_withdrawal,
            commission_rate: updates.commission_rate,
            maintenance_mode: updates.maintenance_mode,
            registration_enabled: updates.registration_enabled,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .maybeSingle()
      } else {
        // Insert new
        result = await supabase
          .from('system_settings')
          .insert({
            min_deposit: updates.min_deposit || 200,
            min_withdrawal: updates.min_withdrawal || 10000,
            commission_rate: updates.commission_rate || 19,
            maintenance_mode: updates.maintenance_mode || false,
            registration_enabled: updates.registration_enabled !== undefined ? updates.registration_enabled : true,
          })
          .select()
          .maybeSingle()
      }

      if (result.error) throw result.error

      return { success: true, settings: result.data }
    } catch (error) {
      console.error('Update settings error:', error)
      return { success: false, error: error.message }
    }
  },
}