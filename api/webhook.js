// api/webhook.js
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  const signature = req.headers['x-paystack-signature']
  if (!signature) {
    return res.status(401).send('Unauthorized')
  }

  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex')

  if (hash !== signature) {
    return res.status(401).send('Invalid signature')
  }

  const { event, data } = req.body
  if (event !== 'charge.success') {
    return res.status(200).send('Ignored')
  }

  const reference = data.reference
  const amount = data.amount / 100
  const customerEmail = data.customer.email

  // Find user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', customerEmail)
    .single()

  if (userError || !user) {
    console.error('User not found:', customerEmail)
    return res.status(404).send('User not found')
  }

  // Get current balance
  const { data: current, error: fetchError } = await supabase
    .from('balances')
    .select('available')
    .eq('user_id', user.id)
    .single()

  if (fetchError) {
    console.error('Fetch balance error:', fetchError)
    return res.status(500).send('Balance fetch failed')
  }

  const newAvailable = (current?.available || 0) + amount

  // Update balance
  const { error: balanceError } = await supabase
    .from('balances')
    .update({ available: newAvailable })
    .eq('user_id', user.id)

  if (balanceError) {
    console.error('Balance update error:', balanceError)
    return res.status(500).send('Balance update failed')
  }

  // Log transaction
  await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'deposit',
    amount: amount,
    description: `Deposit via Paystack (${reference})`,
    status: 'completed',
    reference,
  })

  res.status(200).json({ message: 'Webhook processed' })
}