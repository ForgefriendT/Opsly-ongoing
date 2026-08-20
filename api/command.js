import { handleAICommand } from '../src/lib/aiMiddleware.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method Not Allowed' }))
    return
  }
  try {
    // Under Vercel, the body might already be parsed, handleAICommand handles both parsed and unparsed stream bodies.
    await handleAICommand(req, res)
  } catch (err) {
    console.error('Vercel API Command Error:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Internal Server Error' }))
  }
}
