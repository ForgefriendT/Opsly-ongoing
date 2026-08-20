import { handleSendInvoiceEmail } from '../src/lib/sendInvoiceEmailHandler.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method Not Allowed' }))
    return
  }
  try {
    await handleSendInvoiceEmail(req, res)
  } catch (err) {
    console.error('Vercel API Send Invoice Email Error:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Internal Server Error' }))
  }
}
