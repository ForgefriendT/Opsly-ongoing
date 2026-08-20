import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kqyxhnnouwdbwbmwbohl.supabase.co'
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_5nMWYIFwhaWTxfnDevmOJA_4s1eTIXl'

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'))
      } catch (err) {
        resolve({})
      }
    })
    req.on('error', err => reject(err))
  })
}

export async function handlePaddleWebhook(req, res, preParsedBody) {
  try {
    let body = preParsedBody
    if (!body) {
      if (req.body && typeof req.body === 'object') {
        body = req.body
      } else if (typeof req.body === 'string') {
        body = JSON.parse(req.body)
      } else {
        body = await getRequestBody(req)
      }
    }

    const eventType = body?.event_type || body?.alert_name
    const data = body?.data || body

    console.log(`Received Paddle webhook: ${eventType}`, JSON.stringify(body))

    if (!eventType) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Missing event_type or alert_name' }))
      return
    }

    let paddleSubId = data?.subscription_id || data?.id
    let customerId = data?.customer_id
    let status = data?.status
    let clientId = data?.custom_data?.client_id

    if (eventType === 'subscription.created') {
      if (clientId) {
        const { error } = await supabaseAdmin
          .from('clients')
          .update({
            plan_status: 'active',
            paddle_subscription_id: paddleSubId,
            paddle_customer_id: customerId,
            grace_period_ends_at: null
          })
          .eq('id', clientId)

        if (error) throw error
        console.log(`Webhook updated client ${clientId} to active subscription.`)
      } else {
        console.warn('subscription.created webhook missing client_id in custom_data')
      }
    } else if (eventType === 'payment.failed' || eventType === 'transaction.payment_failed' || (eventType === 'subscription.updated' && status === 'past_due')) {
      const gracePeriod = new Date()
      gracePeriod.setDate(gracePeriod.getDate() + 5) // 5 days grace period

      let query = supabaseAdmin.from('clients').update({
        plan_status: 'past_due',
        grace_period_ends_at: gracePeriod.toISOString()
      })

      if (clientId) {
        query = query.eq('id', clientId)
      } else if (paddleSubId) {
        query = query.eq('paddle_subscription_id', paddleSubId)
      } else {
        console.warn('payment.failed webhook missing identifiers')
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Unidentifiable client context' }))
        return
      }

      const { error } = await query
      if (error) throw error
      console.log(`Webhook updated client subscription status to past_due, grace ends at ${gracePeriod.toISOString()}`)
    } else if (eventType === 'subscription.cancelled' || eventType === 'subscription.canceled' || (eventType === 'subscription.updated' && status === 'canceled')) {
      let query = supabaseAdmin.from('clients').update({
        plan_status: 'cancelled'
      })

      if (clientId) {
        query = query.eq('id', clientId)
      } else if (paddleSubId) {
        query = query.eq('paddle_subscription_id', paddleSubId)
      } else {
        console.warn('subscription.cancelled webhook missing identifiers')
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Unidentifiable client context' }))
        return
      }

      const { error } = await query
      if (error) throw error
      console.log('Webhook updated client subscription status to cancelled.')
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ received: true }))

  } catch (err) {
    console.error('Paddle Webhook Processing Error:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Internal Server Error' }))
  }
}
