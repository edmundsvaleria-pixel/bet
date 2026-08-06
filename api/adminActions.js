// api/adminActions.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, userId, updates } = req.body

  // Verify token
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: No token' })
  }

  const token = authHeader.split(' ')[1]
  const regularClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY)
  
  try {
    const { data: { user }, error: userError } = await regularClient.auth.getUser(token)
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Check admin role – directly query users table (bypasses RLS)
    const { data: adminCheck, error: adminError } = await regularClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminError || adminCheck?.role !== 'admin') {
      console.error('Admin check failed:', adminError)
      return res.status(403).json({ error: 'Forbidden: Not admin' })
    }

    // Process action
    switch (action) {
      case 'deleteUser': {
        await supabaseAdmin.auth.admin.deleteUser(userId)
        await regularClient.from('users').delete().eq('id', userId)
        await regularClient.from('balances').delete().eq('user_id', userId)
        return res.status(200).json({ success: true })
      }
      case 'updateUser': {
        if (updates.active === false) {
          try {
            await supabaseAdmin.auth.admin.revokeUser(userId)
          } catch (_) {}
        }
        const { data, error } = await regularClient
          .from('users')
          .update(updates)
          .eq('id', userId)
          .select()
        if (error) throw error
        return res.status(200).json({ success: true, user: data?.[0] })
      }
      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    console.error('Admin action error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}