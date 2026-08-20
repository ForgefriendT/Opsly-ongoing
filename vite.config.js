import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleAICommand } from './src/lib/aiMiddleware.js'
import { handlePaddleWebhook } from './src/lib/paddleWebhookHandler.js'
import { handleSendInvoiceEmail } from './src/lib/sendInvoiceEmailHandler.js'
import { handleSendEstimateEmail } from './src/lib/sendEstimateEmailHandler.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables into process.env for server-side usage in Vite plugins
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-command-middleware',
        configureServer(server) {
          server.middlewares.use('/api/command', async (req, res) => {
            if (req.method !== 'POST') {
              res.writeHead(405, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Method Not Allowed' }))
              return
            }
            try {
              await handleAICommand(req, res)
            } catch (err) {
              console.error('Vite Dev Server Middleware Error:', err)
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Internal Server Error' }))
            }
          })

          server.middlewares.use('/api/paddle-webhook', async (req, res) => {
            if (req.method !== 'POST') {
              res.writeHead(405, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Method Not Allowed' }))
              return
            }
            try {
              await handlePaddleWebhook(req, res)
            } catch (err) {
              console.error('Vite Dev Server Webhook Error:', err)
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Internal Server Error' }))
            }
          })

          server.middlewares.use('/api/send-invoice-email', async (req, res) => {
            if (req.method !== 'POST') {
              res.writeHead(405, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Method Not Allowed' }))
              return
            }
            try {
              await handleSendInvoiceEmail(req, res)
            } catch (err) {
              console.error('Vite Dev Server Send Email Error:', err)
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Internal Server Error' }))
            }
          })

          server.middlewares.use('/api/send-estimate-email', async (req, res) => {
            if (req.method !== 'POST') {
              res.writeHead(405, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Method Not Allowed' }))
              return
            }
            try {
              await handleSendEstimateEmail(req, res)
            } catch (err) {
              console.error('Vite Dev Server Send Estimate Email Error:', err)
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Internal Server Error' }))
            }
          })
        }
      }
    ]
  }
})
// Dev server middleware integration

