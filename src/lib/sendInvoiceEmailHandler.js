import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kqyxhnnouwdbwbmwbohl.supabase.co'
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || ''

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

export async function handleSendInvoiceEmail(req, res, preParsedBody) {
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

    const { invoiceId, recipientEmail, recipientName, businessName } = body

    if (!invoiceId || !recipientEmail) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Missing invoiceId or recipientEmail' }))
      return
    }

    // 1. Fetch invoice and client details using admin client (bypasses RLS to construct invoice email safely)
    const { data: invoice, error: invoiceErr } = await supabaseAdmin
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('id', invoiceId)
      .maybeSingle()

    if (invoiceErr || !invoice) {
      console.error('Error fetching invoice for email:', invoiceErr)
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invoice not found' }))
      return
    }

    // 2. Build email details
    const logoUrl = invoice.client?.logo_url
    const currencySym = invoice.currency_symbol || '$'
    const totalAmount = Number(invoice.grand_total || 0).toFixed(2)
    const dueDateStr = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon Receipt'
    
    // Resolve dynamic app base URL from request headers
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers.host
    const appUrl = `${protocol}://${host}`
    const portalUrl = `${appUrl}/invoice/${invoice.id}`

    // Compose HTML content with Claude/Opsly dark aesthetics
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoice_number} from ${businessName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f0e0d;
            color: #f4f3ee;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1a1917;
            border: 1px solid #2a2825;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          }
          .logo {
            max-height: 50px;
            max-width: 180px;
            object-fit: contain;
            margin-bottom: 24px;
            border-radius: 6px;
          }
          h1 {
            font-size: 20px;
            font-weight: 700;
            color: #f4f3ee;
            margin-top: 0;
            margin-bottom: 12px;
          }
          p {
            font-size: 14px;
            line-height: 1.6;
            color: #b1ada1;
            margin-top: 0;
            margin-bottom: 16px;
          }
          .details-card {
            background-color: #242220;
            border: 1px solid #2a2825;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 28px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 13px;
          }
          .detail-row:last-child {
            margin-bottom: 0;
            padding-top: 10px;
            border-top: 1px dashed #2a2825;
          }
          .label {
            color: #b1ada1;
          }
          .value {
            color: #f4f3ee;
            font-weight: 600;
          }
          .value.highlight {
            color: #c15f3c;
            font-size: 16px;
            font-weight: 700;
          }
          .btn {
            display: inline-block;
            background-color: #c15f3c;
            color: #f4f3ee !important;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            padding: 12px 24px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 24px;
          }
          .btn:hover {
            background-color: #d4795a;
          }
          .footer {
            font-size: 11px;
            color: #6b6760;
            text-align: center;
            border-top: 1px solid #2a2825;
            padding-top: 20px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${logoUrl ? `<img src="${logoUrl}" alt="${businessName}" class="logo">` : ''}
          <h1>Invoice ${invoice.invoice_number}</h1>
          <p>Hello ${recipientName || 'Valued Customer'},</p>
          <p>${businessName} has sent you an invoice for <strong>${currencySym}${totalAmount}</strong>, due on <strong>${dueDateStr}</strong>.</p>
          
          <div class="details-card">
            <div class="detail-row">
              <span class="label">Invoice Number</span>
              <span class="value">${invoice.invoice_number}</span>
            </div>
            <div class="detail-row">
              <span class="label">Due Date</span>
              <span class="value">${dueDateStr}</span>
            </div>
            <div class="detail-row">
              <span class="label">Amount Due</span>
              <span class="value highlight">${currencySym}${totalAmount}</span>
            </div>
          </div>

          <a href="${portalUrl}" class="btn" style="color: #f4f3ee;">View & Pay Invoice</a>

          <p>Clicking the button above will open a secure page where you can review the invoice details, print a PDF copy, and complete payment online.</p>
          
          <div class="footer">
            Sent securely via Opsly on behalf of ${businessName}.<br>
            If you have any questions, please reply directly to this email or reach out to the sender.
          </div>
        </div>
      </body>
      </html>
    `

    // 3. Dispatch via Resend API
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is not defined in env. Simulating email dispatch.')
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true, simulated: true, portalUrl }))
      return
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Opsly Invoices <${fromEmail}>`,
        to: [recipientEmail],
        subject: `Invoice ${invoice.invoice_number} from ${businessName}`,
        html: htmlContent
      })
    })

    if (!resendRes.ok) {
      const resendErr = await resendRes.json()
      console.error('Resend API Error:', resendErr)
      const errMsg = resendErr?.message || ''
      if (errMsg.includes('verify a domain') || errMsg.includes('testing emails') || errMsg.includes('own email address')) {
        console.warn('Resend sandbox restriction detected. Falling back to simulation mode.')
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ 
          success: true, 
          simulated: true, 
          portalUrl, 
          warning: 'Sandbox restriction: Email delivery simulated. Verify Resend domain keys for real delivery.' 
        }))
        return
      }
      throw new Error(errMsg || 'Failed to dispatch email via Resend')
    }

    const resendData = await resendRes.json()
    console.log(`Email dispatched successfully for Invoice ${invoice.invoice_number} to ${recipientEmail}:`, resendData)

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: true, messageId: resendData.id, portalUrl }))

  } catch (err) {
    console.error('Send Invoice Email Error:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }))
  }
}
