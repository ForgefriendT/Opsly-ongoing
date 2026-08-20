import { handlePaddleWebhook } from '../src/lib/paddleWebhookHandler.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method Not Allowed' }))
    return
  }
  try {
    await handlePaddleWebhook(req, res)
  } catch (err) {
    console.error('Vercel API Webhook Error:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Internal Server Error' }))
  }
}
