import supabase from '../../lib/supabase'

export const authService = {
  async register(name, email, phone, password, country, countryCode, currency) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone, country, countryCode, currency, role: 'user' },
        },
      })
      if (authError) throw authError
      if (authData.user) {
        await this.logActivity(authData.user.id, 'register', `New user registered from ${country}`)
      }
      return { success: true, user: authData.user }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: error.message }
    }
  },

  async login(identifier, password) {
    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      })
      if (error && error.message?.includes('Invalid login credentials')) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('phone', identifier)
          .single()
        if (userError) throw new Error('Invalid credentials')
        if (userData) {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password,
          })
          if (loginError) throw loginError
          data = loginData
        } else {
          throw new Error('Invalid credentials')
        }
      } else if (error) {
        throw error
      }
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('active, role')
          .eq('id', data.user.id)
          .single()
        if (userError) throw userError
        if (!userData.active) {
          await supabase.auth.signOut()
          return { success: false, error: 'Account deactivated. Contact support.' }
        }
        await this.logActivity(data.user.id, 'login', 'User logged in')
      }
      return { success: true, user: data.user }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  },

  async logout() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await this.logActivity(user.id, 'logout', 'User logged out')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, error: error.message }
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      if (!user) return null
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      if (profileError) throw profileError
      return { ...user, ...profile }
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  },

  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get user by ID error:', error)
      return null
    }
  },

  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get all users error:', error)
      return []
    }
  },

  async updateUser(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
      if (error) throw error
      await this.logActivity(userId, 'admin_update', `Admin updated user: ${JSON.stringify(updates)}`)
      return { success: true, user: data[0] }
    } catch (error) {
      console.error('Update user error:', error)
      return { success: false, error: error.message }
    }
  },

  async deleteUser(userId) {
    try {
      const user = await this.getUserById(userId)
      if (!user) return { success: false, error: 'User not found' }
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error
      await this.logActivity(userId, 'delete', 'User permanently deleted by admin')
      return { success: true }
    } catch (error) {
      console.error('Delete user error:', error)
      return { success: false, error: error.message }
    }
  },

  async logActivity(userId, action, details = '') {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({ user_id: userId, action, details, timestamp: new Date().toISOString() })
      if (error) console.error('Activity log error:', error)
    } catch (error) {
      console.error('Log activity error:', error)
    }
  },

  async getActivities() {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, users:user_id (name, email)')
        .order('timestamp', { ascending: false })
        .limit(100)
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get activities error:', error)
      return []
    }
  },
}