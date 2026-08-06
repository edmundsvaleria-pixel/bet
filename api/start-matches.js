// api/start-matches.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  // Only allow GET requests (Vercel cron uses GET)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Optional: Verify a secret token to prevent public access
  // const authHeader = req.headers.authorization
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).json({ error: 'Unauthorized' })
  // }

  try {
    // 1. Find all upcoming matches where start_time has passed
    const now = new Date().toISOString()
    const { data: matches, error: fetchError } = await supabase
      .from('custom_matches')
      .select('*')
      .eq('status', 'upcoming')
      .lt('start_time', now)

    if (fetchError) throw fetchError

    if (!matches || matches.length === 0) {
      return res.status(200).json({ message: 'No matches to start', started: 0 })
    }

    // 2. Update each match to 'live'
    const started = []
    for (const match of matches) {
      const { error: updateError } = await supabase
        .from('custom_matches')
        .update({
          status: 'live',
          elapsed: 0,
        })
        .eq('id', match.id)

      if (!updateError) {
        started.push(match.id)
        console.log(`✅ Match ${match.id} started`)
      } else {
        console.error(`❌ Failed to start match ${match.id}:`, updateError)
      }
    }

    return res.status(200).json({
      message: `Started ${started.length} matches`,
      started,
    })
  } catch (error) {
    console.error('Cron error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}