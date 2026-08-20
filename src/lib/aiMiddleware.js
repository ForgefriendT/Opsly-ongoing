// Polyfill global WebSocket for Node.js environments (Vite config, Vercel Serverless)
if (typeof global !== 'undefined' && !global.WebSocket) {
  global.WebSocket = class {}
}

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Admin Client using server-side secret key
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kqyxhnnouwdbwbmwbohl.supabase.co'
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || ''

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Helper to strip all text emojis
function stripEmojis(text) {
  if (!text) return ''
  return text.replace(/[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E9}-\u{1F1F0}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f1e0}-\u{1f1ff}]/gu, '')
}

// Helper to parse SSE event messages
function sendSSEEvent(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  if (typeof res.flush === 'function') {
    res.flush()
  }
}

// Helper to parse raw request stream bodies
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
        reject(err)
      }
    })
    req.on('error', err => reject(err))
  })
}

// Helper to perform web searches against DuckDuckGo Lite HTML interface
async function searchWeb(query) {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    if (!res.ok) return ''
    const html = await res.text()
    
    const snippets = []
    const snippetRegex = /<td class="result-snippet">([\s\S]*?)<\/td>/g
    let match
    let count = 0
    while ((match = snippetRegex.exec(html)) !== null && count < 3) {
      const snippet = match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
      snippets.push(snippet)
      count++
    }
    return snippets.join('\n\n')
  } catch (err) {
    console.error('Web search failed:', err)
    return ''
  }
}

/**
 * Shared AI Command Middleware handler.
 * Compatible with Vite's Dev Server Connect middleware and Vercel Serverless Node functions.
 */
export async function handleAICommand(req, res, reqBody) {
  let clientId = null
  let userId = null
  let body = reqBody
  let command = ''
  let history = []
  let chatHistory = []

  try {
    if (!body) {
      if (req.body && typeof req.body === 'object') {
        body = req.body
      } else if (typeof req.body === 'string') {
        body = JSON.parse(req.body)
      } else {
        body = await getRequestBody(req)
      }
    }

    command = body?.command || ''
    history = body?.history || [] // Last 5 commands context
    chatHistory = body?.chatHistory || []
    // 1. Authenticate Client
    const authHeader = req.headers['authorization'] || req.headers['Authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Missing authentication token' }))
      return
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized token verification failed' }))
      return
    }

    userId = user.id

    // 2. Look up client record & user profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('auth_uid', user.id)
      .maybeSingle()

    if (profileErr || !profile) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'User profile not found in database' }))
      return
    }

    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', profile.client_id)
      .maybeSingle()

    if (clientErr || !client) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Client portal profile not found' }))
      return
    }

    clientId = client.id

    // 3. Sanitise Input
    command = (command || '').replace(/<[^>]*>/g, '').trim() // Strip HTML
    if (command.length > 2000) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'That command is too long — could you break it into smaller steps?' }))
      return
    }

    if (!command) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Empty command text' }))
      return
    }

    // 4. Usage limit checks
    // Fetch month-to-date token usage
    const { data: usageData, error: usageErr } = await supabaseAdmin
      .rpc('get_client_monthly_tokens', { p_client_id: clientId })

    let totalTokens = 0
    if (!usageErr && usageData && usageData.length > 0) {
      totalTokens = Number(usageData[0].total_input || 0) + Number(usageData[0].total_output || 0)
    }

    const commandsUsed = Math.floor(totalTokens / 2500)

    // Load Plan limits
    const { data: planConfig, error: planConfigErr } = await supabaseAdmin
      .from('plan_configs')
      .select('ai_command_limit, overage_price_cents')
      .eq('plan_name', client.plan || 'free')
      .maybeSingle()

    const limit = planConfig?.ai_command_limit ?? 30
    const overagePriceCents = planConfig?.overage_price_cents ?? 0
    const capCents = client.overage_cap_cents ?? 0

    const isOverageEligible = client.plan !== 'free' && overagePriceCents > 0

    if (limit !== -1 && commandsUsed >= limit) {
      const overageCommands = commandsUsed - limit
      const currentOverageCostCents = overageCommands * overagePriceCents

      if (!isOverageEligible || currentOverageCostCents >= capCents) {
        res.writeHead(403, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          error: "You've used all your AI assistant commands for this month. Upgrade to the Growth plan ($199/mo) to unlock unlimited AI commands, auto-expense tracking, and invoice details extraction!",
          capReached: true
        }))
        return
      }
    }

    // Set headers for Server-Sent Events (SSE) streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Prevent buffering on Nginx/Vercel
    })

    // Fetch Database Context BEFORE calling Claude (A. No Hallucinations guardrail)
    const { data: contacts } = await supabaseAdmin
      .from('contacts')
      .select('id, name, email, phone')
      .eq('client_id', clientId)

    const { data: activeJobs } = await supabaseAdmin
      .from('jobs')
      .select('id, title, status')
      .eq('client_id', clientId)
      .neq('status', 'completed')

    const { data: outstandingInvoices } = await supabaseAdmin
      .from('invoices')
      .select('grand_total')
      .eq('client_id', clientId)
      .in('status', ['sent', 'viewed', 'overdue'])

    const { data: recentEstimates } = await supabaseAdmin
      .from('estimates')
      .select('id, estimate_number, status, grand_total, contact:contacts(name)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10)

    const contactsList = contacts ? contacts.map(c => `- ${c.name} (UUID: ${c.id}, Email: ${c.email || 'N/A'}, Phone: ${c.phone || 'N/A'})`).join('\n') : 'None'
    const jobsList = activeJobs ? activeJobs.map(j => `- ${j.title} (UUID: ${j.id}, Status: ${j.status})`).join('\n') : 'None'
    const estimatesList = recentEstimates ? recentEstimates.map(e => `- Estimate ${e.estimate_number} (UUID: ${e.id}, Client: ${e.contact?.name || 'Unknown'}, Total: ${client.currency_symbol || '$'}${Number(e.grand_total).toFixed(2)}, Status: ${e.status})`).join('\n') : 'None'
    
    const outstandingCount = outstandingInvoices?.length || 0
    const outstandingSum = outstandingInvoices?.reduce((sum, inv) => sum + Number(inv.grand_total || 0), 0) || 0

    // Fetch Niche Config for prompt addition
    const { data: nicheConfig } = await supabaseAdmin
      .from('niche_configs')
      .select('*')
      .eq('niche_name', client.niche || 'generic')
      .maybeSingle()

    const nichePromptAddition = nicheConfig?.ai_system_prompt_addition || 'This is a standard service business.'

    // 5. Build system prompt
    const systemPrompt = `You are the AI brain of Opsly, a business management platform. You are operating inside the portal of "${client.business_name || 'Acme Service'}", a ${client.niche || 'generic'} business.

BUSINESS CONTEXT:
- Business name: ${client.business_name || 'Acme Service'}
- Owner/User name: ${profile.full_name || 'Owner'}
- Niche: ${client.niche || 'generic'}
- Plan: ${client.plan || 'free'}
- Country: ${client.country || 'US'}
- Currency: ${client.currency || 'USD'} (${client.currency_symbol || '$'})

RECENT CONTEXT:
- Active jobs count: ${activeJobs?.length || 0}
- Outstanding invoices: ${outstandingCount} invoices, total outstanding: ${client.currency_symbol || '$'}${outstandingSum.toFixed(2)}
- Last 5 commands: ${JSON.stringify(history)}

DATABASE RECORDS (Use this to match entities exactly by UUID instead of guessing):
Contacts/Clients:
${contactsList}

Active Jobs/Projects:
${jobsList}

Recent Estimates:
${estimatesList}

AVAILABLE ACTIONS & SCHEMA:
If the user wants to perform an action, append a structured JSON block inside \`<action>...</action>\` at the very end of your response. Here are the allowed action formats:

1. Add Contact / Client:
   {"type": "ADD_CONTACT", "params": {"name": "Required Name", "email": "Optional Email", "phone": "Optional Phone", "address": "Optional Address", "notes": "Optional Notes"}}

2. Create Job / Project:
   {"type": "CREATE_JOB", "params": {"title": "Required Title", "description": "Optional Desc", "address": "Optional Address", "start_date": "Optional ISO Date string", "end_date": "Optional ISO Date string", "contact_id": "Optional Contact UUID", "price": 1000}}

3. Update Job Status:
   {"type": "UPDATE_JOB_STATUS", "params": {"job_id": "Required Job UUID", "status": "Required status (scheduled, in_progress, completed, cancelled)"}}

4. Update Job Cost:
   {"type": "UPDATE_JOB_COST", "params": {"job_id": "Required Job UUID", "price": 1000, "materials_cost": 200, "labour_cost": 300, "sub_cost": 100}}

5. Create Invoice:
   {"type": "CREATE_INVOICE", "params": {"contact_id": "Optional Contact UUID", "job_id": "Optional Job UUID", "line_items": [{"description": "Item desc", "quantity": 1, "unit_price": 100}], "notes": "Optional notes", "due_date": "Optional due date YYYY-MM-DD"}}

6. Create Estimate:
   {"type": "CREATE_ESTIMATE", "params": {"contact_id": "Optional Contact UUID", "job_id": "Optional Job UUID", "line_items": [{"description": "Item desc", "quantity": 1, "unit_price": 100}], "notes": "Optional notes"}}

7. Send Estimate:
   {"type": "SEND_ESTIMATE", "params": {"estimate_id": "Required Estimate UUID"}}

8. Update Estimate Status:
   {"type": "UPDATE_ESTIMATE_STATUS", "params": {"estimate_id": "Required Estimate UUID", "status": "Required status (approved, rejected, draft, sent)"}}

9. Log Expense:
   {"type": "LOG_EXPENSE", "params": {"amount": 50.00, "category": "Required category", "description": "Optional desc", "expense_date": "Optional date YYYY-MM-DD"}}

RULES:
- Always respond in plain English that the owner would understand.
- Never use technical jargon.
- If you are unsure what the owner wants, ask one clarifying question.
- Always confirm before sending anything to a client (e.g. sending invoices, estimates, or SMS).
- Never invent data — only use what exists in the database.
- Keep responses short — one paragraph maximum unless generating a document or listing items.
- Format currency as ${client.currency_symbol || '$'} with two decimal places.
- Do NOT automatically convert approved estimates into invoices. Instead, ask the user if they want to create a Job or create an Invoice, mentioning that they can say 'I'll do it manually later' to skip.

NICHE SPECIFIC INSTRUCTIONS:
${nichePromptAddition}`

    // Intercept Web Search for Business Tips / Marketing queries
    const lowerCmd = command.toLowerCase()
    const needsSearch = lowerCmd.includes('search') || 
                        lowerCmd.includes('google') || 
                        lowerCmd.includes('tips') || 
                        lowerCmd.includes('advice') || 
                        lowerCmd.includes('how to') || 
                        lowerCmd.includes('trend') || 
                        lowerCmd.includes('competitor') ||
                        lowerCmd.includes('marketing')

    let searchResults = ''
    let searchContext = ''
    if (needsSearch) {
      searchResults = await searchWeb(command)
      if (searchResults) {
        searchContext = `\n\nWEB SEARCH RESULTS FOR "${command}":\n${searchResults}\nUse this real-time web search context to answer the user's request accurately and provide relevant business tips tailored to their niche (${client.niche || 'generic'}).`
      }
    }

    // 6. Model routing logic
    // Free plan override: always Haiku, never Sonnet, regardless of complexity
    const isFree = (client.plan || 'free') === 'free'
    const isSonnet = !isFree && (
      command.toLowerCase().includes('report') || 
      command.toLowerCase().includes('audit') || 
      command.toLowerCase().includes('estimate') || 
      command.length > 250
    )

    const modelName = isSonnet ? 'claude-sonnet-4-5-20250929' : 'claude-haiku-4-5-20251001'

    // Check if Anthropic API Key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY
    const isMock = !apiKey || apiKey === 'PASTE_WHEN_BUILDING_SECTION_E' || body?.mock !== false

    let fullResponseText = ''
    let inputTokens = 0
    let outputTokens = 0

    if (isMock) {
      // Fallback Simulator: Mock Claude's response and structured actions
      await new Promise(resolve => setTimeout(resolve, 500)) // 500ms initial response latency limit

      let mockText = ''
      let actionObj = null

      const lowerCmd = command.toLowerCase()

      // 1. Custom / Enterprise features upsell
      const isCustomFeatureRequest = lowerCmd.includes('custom') || 
                                     lowerCmd.includes('integration') || 
                                     lowerCmd.includes('integrate') || 
                                     lowerCmd.includes('new tab') || 
                                     lowerCmd.includes('api') || 
                                     lowerCmd.includes('plug in') || 
                                     lowerCmd.includes('add tab') || 
                                     lowerCmd.includes('out of the box') || 
                                     lowerCmd.includes('another system') || 
                                     lowerCmd.includes('bespoke')

      // 2. Dashboard / Next steps / suggestions (Collaborative Partner)
      const isSuggestionRequest = lowerCmd.includes('suggestion') || 
                                   lowerCmd.includes('next') || 
                                   lowerCmd.includes('do now') || 
                                   lowerCmd.includes('recommend') || 
                                   lowerCmd.includes('status')

      // 3. App Guidance & Step-by-Step Questions
      const isHowTo = lowerCmd.includes('how to') || 
                      lowerCmd.includes('how do i') || 
                      lowerCmd.includes('how can i') || 
                      lowerCmd.includes('explain') || 
                      lowerCmd.includes('help me with')

      if (isCustomFeatureRequest) {
        mockText = "Custom tabs, native integrations, and bespoke client portal features are available on our Enterprise Custom Plan. To request custom workflows tailored for your business, you can upgrade your plan in your settings or contact our support team. Let's schedule a call to build exactly what you need!"
      } else if (isSuggestionRequest) {
        mockText = `I have analyzed your current business state:
- You have outstanding invoices totaling ${client.currency_symbol || '$'}${outstandingSum.toFixed(2)}. I suggest sending a friendly reminder for those.
- You have ${activeJobs?.length || 0} active jobs in progress.
- Would you like me to schedule a new job or draft a follow-up estimate for a client? Here are a few next steps I recommend:
  1. Follow up on unpaid invoices.
  2. Schedule job inspections for recent client leads.
  3. Send an estimate for pending requests.
How would you like to proceed?`
      } else if (isHowTo) {
        if (lowerCmd.includes('job') || lowerCmd.includes('schedule') || lowerCmd.includes('calendar')) {
          mockText = `To schedule a job in Opsly, follow these steps:
1. Go to the Jobs tab in the sidebar navigation.
2. Click the Schedule Job button at the top of the page.
3. Select the client contact, set the start date, price, and description.
4. If you are on the Growth or Pro plan, you can assign registered team members and log labor compensation.
Alternatively, tell me something like 'Schedule a job Roof Repair for John Connor $500' and I will prepare it for you to confirm.`
        } else if (lowerCmd.includes('invoice') || lowerCmd.includes('bill') || lowerCmd.includes('pay')) {
          mockText = `To create an invoice:
1. Click on the Invoices tab in the sidebar.
2. Select Create Invoice to open the invoice builder.
3. Choose a contact, add your line items (description, quantity, rate), and click Save & Send.
4. You can also click Scan Job Photos to extract line items automatically from job site images if you are on a paid plan.
Would you like me to draft an invoice for you right now?`
        } else if (lowerCmd.includes('estimate') || lowerCmd.includes('quote') || lowerCmd.includes('proposal')) {
          mockText = `To manage estimates:
1. Go to the Estimates tab.
2. Select Create Estimate to draft a proposal.
3. Once sent, if the client approves it, Opsly will guide you step-by-step to schedule the job and generate the invoice.
Would you like me to draft an estimate for a client now?`
        } else if (lowerCmd.includes('client') || lowerCmd.includes('contact') || lowerCmd.includes('customer')) {
          mockText = `To add or manage client contacts:
1. Click on the Clients tab in the sidebar.
2. Click Add New Contact to enter their name, phone, email, and address.
3. You can click on any client's name to view their profile, history timeline, active jobs, and outstanding invoices.
Alternatively, tell me 'Add client John Doe' and I'll queue that up for you.`
        } else {
          mockText = "I am your Opsly business partner. You can ask me how to manage your client portal, schedule jobs, log expenses, and generate invoices. How can I help guide you today?"
        }
      } else if (lowerCmd.includes('client') || lowerCmd.includes('contact')) {
        // Mock add contact
        const nameMatch = command.match(/(?:client|contact)\s+([A-Za-z\s]+)/i)
        const phoneMatch = command.match(/(\d[\d-]{6,}\d)/)
        const name = (nameMatch ? nameMatch[1] : 'Sarah Connor').trim()
        const phone = phoneMatch ? phoneMatch[0] : '555-0199'

        mockText = `I will help you add the new client ${name} to your portal records. Please confirm the action below to save their profile.`
        actionObj = {
          type: 'ADD_CONTACT',
          params: { name, phone }
        }
      } else if (lowerCmd.includes('invoice')) {
        // Check for specific sub-commands
        if (lowerCmd.includes('mark') && (lowerCmd.includes('paid') || lowerCmd.includes('pay'))) {
          // e.g. "Mark the Johnson invoice as paid"
          const nameMatch = command.match(/(?:mark|invoice)\s+(?:the\s+)?([A-Za-z\s]+)\s+invoice/i) || command.match(/(?:mark\s+)?([A-Za-z\s]+)(?:\s+invoice)?\s+as\s+paid/i)
          const targetName = nameMatch ? nameMatch[1].replace(/\binvoice\b/gi, '').trim() : ''
          
          let matchedInvoice = null
          if (targetName) {
            const { data: invs } = await supabaseAdmin
              .from('invoices')
              .select('*, contact:contacts(*)')
              .eq('client_id', clientId)
            if (invs) {
              matchedInvoice = invs.find(inv => inv.contact?.name.toLowerCase().includes(targetName.toLowerCase()))
            }
          }
          
          if (matchedInvoice) {
            mockText = `I will help you mark invoice ${matchedInvoice.invoice_number} for ${matchedInvoice.contact?.name} as paid. Please confirm below.`
            actionObj = {
              type: 'UPDATE_INVOICE_STATUS',
              params: {
                invoice_id: matchedInvoice.id,
                status: 'paid'
              }
            }
          } else {
            mockText = `I couldn't find an unpaid invoice for "${targetName || 'that client'}".`
          }
        } else if (lowerCmd.includes('send') || lowerCmd.includes('email') || lowerCmd.includes('mail')) {
          // e.g. "Send the Henderson invoice"
          const nameMatch = command.match(/(?:send|email)\s+(?:the\s+)?([A-Za-z\s]+)\s+invoice/i)
          const targetName = nameMatch ? nameMatch[1].replace(/\binvoice\b/gi, '').trim() : ''
          
          let matchedInvoice = null
          if (targetName) {
            const { data: invs } = await supabaseAdmin
              .from('invoices')
              .select('*, contact:contacts(*)')
              .eq('client_id', clientId)
              .order('created_at', { ascending: false })
            if (invs) {
              matchedInvoice = invs.find(inv => inv.contact?.name.toLowerCase().includes(targetName.toLowerCase()))
            }
          }
          
          if (matchedInvoice) {
            mockText = `I will help you email the invoice ${matchedInvoice.invoice_number} to ${matchedInvoice.contact?.name || 'the client'}. Please confirm below.`
            actionObj = {
              type: 'SEND_INVOICE',
              params: {
                invoice_id: matchedInvoice.id
              }
            }
          } else {
            mockText = `I couldn't find a matching invoice for "${targetName || 'that client'}".`
          }
        } else if (lowerCmd.includes('who') && (lowerCmd.includes('paid') || lowerCmd.includes('pay') || lowerCmd.includes('unpaid') || lowerCmd.includes('overdue') || lowerCmd.includes('hasn\'t'))) {
          // e.g. "Who hasn't paid me this month?"
          const { data: unpaidInvoices } = await supabaseAdmin
            .from('invoices')
            .select('*, contact:contacts(*)')
            .eq('client_id', clientId)
            .in('status', ['sent', 'viewed', 'overdue'])
          
          if (unpaidInvoices && unpaidInvoices.length > 0) {
            const list = unpaidInvoices.map(inv => `- ${inv.contact?.name || 'Unknown'}: ${client.currency_symbol || '$'}${Number(inv.grand_total).toFixed(2)} (Invoice ${inv.invoice_number}, Due: ${new Date(inv.due_date).toLocaleDateString()})`).join('\n')
            mockText = `Here is the list of clients with outstanding invoices:\n${list}`
          } else {
            mockText = `All of your invoices have been paid! You have no outstanding balances.`
          }
        } else {
          // Mock create invoice / recurring invoice
          const amtMatch = command.match(/\$?(\d+)/)
          const amount = amtMatch ? Number(amtMatch[1]) : 350
          const nameMatch = command.match(/(?:for|invoice)\s+([A-Za-z\s]+)/i)
          let targetName = nameMatch ? nameMatch[1].replace(/\bfor\b/gi, '').replace(/\b(?:$)?\d+\b/g, '').trim() : ''
          if (targetName.toLowerCase() === 'invoice') targetName = ''
          
          let matchedContactId = null
          if (contacts && targetName) {
            const matched = contacts.find(c => c.name.toLowerCase().includes(targetName.toLowerCase()))
            if (matched) matchedContactId = matched.id
          }

          const isRecurring = lowerCmd.includes('recurring') || lowerCmd.includes('every') || lowerCmd.includes('retainer')
          const interval = lowerCmd.includes('week') ? 'weekly' : 'monthly'

          if (isRecurring) {
            mockText = `I will help you set up a recurring ${interval} invoice of ${client.currency_symbol || '$'}${amount.toFixed(2)}${targetName ? ` for ${targetName}` : ''}. Please confirm below to preview and finalize.`
            actionObj = {
              type: 'CREATE_INVOICE',
              params: {
                contact_id: matchedContactId,
                line_items: [{ description: `${interval.charAt(0).toUpperCase() + interval.slice(1)} retainer service`, quantity: 1, unit_price: amount }],
                is_recurring: true,
                recurring_interval: interval,
                notes: 'Recurring invoice set up via AI Command Bar.'
              }
            }
          } else {
            mockText = `I will help you draft an invoice of ${client.currency_symbol || '$'}${amount.toFixed(2)}${targetName ? ` for ${targetName}` : ''}. Please confirm below to preview and finalize.`
            actionObj = {
              type: 'CREATE_INVOICE',
              params: {
                contact_id: matchedContactId,
                line_items: [{ description: 'Service charge', quantity: 1, unit_price: amount }],
                notes: 'Created via AI Command Bar.'
              }
            }
          }
        }
      } else if (lowerCmd.includes('estimate')) {
        // Check for specific sub-commands
        if (lowerCmd.includes('approved') || lowerCmd.includes('approve') || lowerCmd.includes('reject') || lowerCmd.includes('rejected')) {
          // e.g. "Mark the Johnson estimate as approved" or "Approve the Johnson estimate"
          const status = (lowerCmd.includes('approve') || lowerCmd.includes('approved')) ? 'approved' : 'rejected'
          const nameMatch = command.match(/(?:mark|estimate)\s+(?:the\s+)?([A-Za-z\s]+)\s+estimate/i) || command.match(/(?:mark\s+)?([A-Za-z\s]+)(?:\s+estimate)?\s+as\s+(?:approved|rejected)/i) || command.match(/(?:approve|reject)\s+(?:the\s+)?([A-Za-z\s]+)\s+estimate/i)
          const targetName = nameMatch ? nameMatch[1].replace(/\bestimate\b/gi, '').trim() : ''
          
          let matchedEstimate = null
          if (targetName) {
            const { data: ests } = await supabaseAdmin
              .from('estimates')
              .select('*, contact:contacts(*)')
              .eq('client_id', clientId)
              .order('created_at', { ascending: false })
            if (ests) {
              matchedEstimate = ests.find(est => est.contact?.name.toLowerCase().includes(targetName.toLowerCase()))
            }
          }
          
          if (matchedEstimate) {
            if (status === 'approved') {
              mockText = `I have marked estimate ${matchedEstimate.estimate_number} for ${matchedEstimate.contact?.name} as approved. Would you like me to schedule a job or generate an invoice for this estimate now? (Or say 'I'll do it manually later' to skip).`
            } else {
              mockText = `I will mark estimate ${matchedEstimate.estimate_number} for ${matchedEstimate.contact?.name} as ${status}.`
            }
            actionObj = {
              type: 'UPDATE_ESTIMATE_STATUS',
              params: {
                estimate_id: matchedEstimate.id,
                status: status
              }
            }
          } else {
            mockText = `I couldn't find an estimate for "${targetName || 'that client'}".`
          }
        } else if (lowerCmd.includes('send') || lowerCmd.includes('email') || lowerCmd.includes('mail')) {
          // e.g. "Send the Henderson estimate"
          const nameMatch = command.match(/(?:send|email)\s+(?:the\s+)?([A-Za-z\s]+)\s+estimate/i)
          const targetName = nameMatch ? nameMatch[1].replace(/\bestimate\b/gi, '').trim() : ''
          
          let matchedEstimate = null
          if (targetName) {
            const { data: ests } = await supabaseAdmin
              .from('estimates')
              .select('*, contact:contacts(*)')
              .eq('client_id', clientId)
              .order('created_at', { ascending: false })
            if (ests) {
              matchedEstimate = ests.find(est => est.contact?.name.toLowerCase().includes(targetName.toLowerCase()))
            }
          }
          
          if (matchedEstimate) {
            mockText = `I will email the estimate ${matchedEstimate.estimate_number} to ${matchedEstimate.contact?.name || 'the client'} now.`
            actionObj = {
              type: 'SEND_ESTIMATE',
              params: {
                estimate_id: matchedEstimate.id
              }
            }
          } else {
            mockText = `I couldn't find a matching estimate for "${targetName || 'that client'}".`
          }
        } else {
          // Mock create estimate
          const amtMatch = command.match(/\$?(\d+)/)
          const amount = amtMatch ? Number(amtMatch[1]) : 350
          const nameMatch = command.match(/(?:for|estimate)\s+([A-Za-z\s]+)/i)
          let targetName = nameMatch ? nameMatch[1].replace(/\bfor\b/gi, '').replace(/\b(?:$)?\d+\b/g, '').trim() : ''
          if (targetName.toLowerCase() === 'estimate') targetName = ''
          
          let matchedContactId = null
          if (contacts && targetName) {
            const matched = contacts.find(c => c.name.toLowerCase().includes(targetName.toLowerCase()))
            if (matched) matchedContactId = matched.id
          }

          mockText = `I will help you draft an estimate of ${client.currency_symbol || '$'}${amount.toFixed(2)}${targetName ? ` for ${targetName}` : ''}. Please confirm below to proceed.`
          actionObj = {
            type: 'CREATE_ESTIMATE',
            params: {
              contact_id: matchedContactId,
              line_items: [{ description: 'Service estimate', quantity: 1, unit_price: amount }],
              notes: 'Created via AI Command Bar.'
            }
          }
        }
      } else if (lowerCmd.includes('job') || lowerCmd.includes('schedule') || lowerCmd.includes('cost') || lowerCmd.includes('labour') || lowerCmd.includes('labor') || lowerCmd.includes('materials') || lowerCmd.includes('subcontractor') || lowerCmd.includes('sub_cost') || lowerCmd.includes('profit')) {
        // Check for specific sub-commands
        if (lowerCmd.includes('mark') || lowerCmd.includes('status') || lowerCmd.includes('complete') || lowerCmd.includes('start') || lowerCmd.includes('cancel')) {
          // e.g. "Mark the Roof Repair job as completed"
          let status = 'completed'
          if (lowerCmd.includes('progress') || lowerCmd.includes('start') || lowerCmd.includes('active')) status = 'in_progress'
          else if (lowerCmd.includes('cancel') || lowerCmd.includes('stop')) status = 'cancelled'
          else if (lowerCmd.includes('schedule') || lowerCmd.includes('todo')) status = 'scheduled'

          // Extract job name
          const nameMatch = command.match(/(?:mark|job|schedule)\s+(?:the\s+)?([A-Za-z0-9\s]+)\s+(?:as|to)/i) || command.match(/(?:complete|start|cancel)\s+(?:the\s+)?([A-Za-z0-9\s]+)\s+job/i)
          const targetTitle = nameMatch ? nameMatch[1].replace(/\bjob\b/gi, '').trim() : ''

          let matchedJob = null
          if (targetTitle) {
            const { data: jbs } = await supabaseAdmin
              .from('jobs')
              .select('*')
              .eq('client_id', clientId)
            if (jbs) {
              matchedJob = jbs.find(j => j.title.toLowerCase().includes(targetTitle.toLowerCase()))
            }
          }

          if (matchedJob) {
            mockText = `I will help you update the job "${matchedJob.title}" status to ${status}. Please confirm below.`
            actionObj = {
              type: 'UPDATE_JOB_STATUS',
              params: {
                job_id: matchedJob.id,
                status: status
              }
            }
          } else {
            mockText = `I couldn't find a matching active job for "${targetTitle || 'that request'}".`
          }
        } else if (lowerCmd.includes('cost') || lowerCmd.includes('labour') || lowerCmd.includes('labor') || lowerCmd.includes('materials') || lowerCmd.includes('subcontractor') || lowerCmd.includes('profit')) {
          // e.g. "Set materials cost for Roof Repair to $300"
          const amtMatch = command.match(/\$?(\d+)/)
          const amount = amtMatch ? Number(amtMatch[1]) : 150
          const nameMatch = command.match(/(?:for|job)\s+([A-Za-z0-9\s]+)\s+to/i) || command.match(/(?:for|job)\s+([A-Za-z0-9\s]+)$/i)
          const targetTitle = nameMatch ? nameMatch[1].replace(/\bjob\b/gi, '').trim() : ''

          let matchedJob = null
          if (targetTitle) {
            const { data: jbs } = await supabaseAdmin
              .from('jobs')
              .select('*')
              .eq('client_id', clientId)
            if (jbs) {
              matchedJob = jbs.find(j => j.title.toLowerCase().includes(targetTitle.toLowerCase()))
            }
          }

          if (matchedJob) {
            let field = 'materials_cost'
            if (lowerCmd.includes('labour') || lowerCmd.includes('labor')) field = 'labour_cost'
            else if (lowerCmd.includes('sub') || lowerCmd.includes('subcontractor')) field = 'sub_cost'
            else if (lowerCmd.includes('price') || lowerCmd.includes('revenue')) field = 'price'

            mockText = `I will help you set the ${field.replace('_', ' ')} for job "${matchedJob.title}" to ${client.currency_symbol || '$'}${amount}. Please confirm below.`
            actionObj = {
              type: 'UPDATE_JOB_COST',
              params: {
                job_id: matchedJob.id,
                [field]: amount
              }
            }
          } else {
            mockText = `I couldn't find a matching job for "${targetTitle || 'that request'}".`
          }
        } else {
          // Mock create job
          const titleMatch = command.match(/(?:job|schedule)\s+([A-Za-z0-9\s]+)/i)
          const title = titleMatch ? titleMatch[1].trim() : 'General Maintenance'
          const priceMatch = command.match(/\$?(\d+)/)
          const price = priceMatch ? Number(priceMatch[1]) : 0

          let matchedContactId = null
          if (contacts) {
            const matched = contacts.find(c => command.toLowerCase().includes(c.name.toLowerCase()))
            if (matched) matchedContactId = matched.id
          }

          mockText = `I will help you schedule the job "${title}"${price ? ` priced at ${client.currency_symbol || '$'}${price}` : ''} on your calendar. Please confirm below.`
          actionObj = {
            type: 'CREATE_JOB',
            params: {
              title,
              description: 'Scheduled via AI Command Bar.',
              contact_id: matchedContactId,
              price: price,
              start_date: new Date().toISOString()
            }
          }
        }
      } else if (lowerCmd.includes('expense')) {
        // Mock log expense
        const amtMatch = command.match(/\$?(\d+)/)
        const amount = amtMatch ? Number(amtMatch[1]) : 45
        const catMatch = command.match(/for\s+([A-Za-z\s]+)/i)
        const category = catMatch ? catMatch[1].trim() : 'Materials'

        mockText = `I will help you log a business expense of ${client.currency_symbol || '$'}${amount.toFixed(2)} under the category ${category}. Please confirm below.`
        actionObj = {
          type: 'LOG_EXPENSE',
          params: {
            amount,
            category,
            description: 'Logged via AI Command Bar.'
          }
        }
      } else if (needsSearch) {
        mockText = `Based on a real-time web search for "${command}", here are some business tips and findings for your ${client.niche || 'services'} business:\n\n${searchResults || 'No web results found. Try using keywords like "marketing tips" or "business advice".'}\n\nI hope this helps! Let me know if you would like me to schedule a job or draft an invoice for you.`
      } else {
        // Mock generic text response
        mockText = `I've analyzed your request: "${command}". I can help you manage jobs, create invoices, log expenses, and update client records. Try asking me "add client Mike" or "invoice Sarah $350".`
      }

      // Stream mock response word by word
      mockText = mockText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      const words = mockText.split(' ')
      for (const word of words) {
        sendSSEEvent(res, 'text', word + ' ')
        fullResponseText += word + ' '
        await new Promise(resolve => setTimeout(resolve, 80)) // Simulated word-by-word streaming
      }

      if (actionObj) {
        const actionStr = `<action>${JSON.stringify(actionObj)}</action>`
        fullResponseText += actionStr
      }

      inputTokens = 1500 // Simulated usage
      outputTokens = Math.round(mockText.length / 4)
    } else {
      // Call Real Anthropic API
      const historyMessages = []
      if (chatHistory && chatHistory.length > 0) {
        // Take the last 6 messages, ensuring alternating roles starting with user
        let slice = chatHistory.slice(-6)
        while (slice.length > 0 && slice[0].role === 'assistant') {
          slice = slice.slice(1)
        }
        for (const msg of slice) {
          historyMessages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          })
        }
      } else if (history && history.length > 0) {
        // Only take the last 5 commands
        const last5 = history.slice(0, 5)
        for (const h of last5) {
          historyMessages.push({ role: 'user', content: h })
          historyMessages.push({ role: 'assistant', content: 'Understood. Action recorded.' })
        }
      }

      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 1024,
          system: systemPrompt + searchContext,
          messages: [
            ...historyMessages,
            { role: 'user', content: command }
          ],
          stream: true
        })
      })

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text()
        throw new Error(`Anthropic API Error: ${anthropicRes.status} ${errText}`)
      }

      const reader = anthropicRes.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let streamBuffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        streamBuffer += decoder.decode(value, { stream: true })
        const lines = streamBuffer.split('\n')
        streamBuffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim()
            if (dataStr === '[DONE]') continue

            try {
              const parsed = JSON.parse(dataStr)
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                const text = parsed.delta.text
                fullResponseText += text
                
                // Do not stream the action JSON payload to the user interface
                if (!fullResponseText.includes('<action>')) {
                  sendSSEEvent(res, 'text', stripEmojis(text))
                }
              } else if (parsed.type === 'message_start' && parsed.message?.usage) {
                inputTokens = parsed.message.usage.input_tokens || 0
              } else if (parsed.type === 'message_delta' && parsed.usage) {
                outputTokens = parsed.usage.output_tokens || 0
              }
            } catch (err) {
              // Ignore partial JSON parse errors
            }
          }
        }
      }
    }

    // 7. Parse Response and Resolve Database Action
    let resolvedAction = 'ANSWER_QUESTION'
    let actionPayload = null

    const actionMatch = fullResponseText.match(/<action>([\s\S]*?)<\/action>/)
    if (actionMatch) {
      try {
        actionPayload = JSON.parse(actionMatch[1].trim())
        resolvedAction = actionPayload.type || 'ANSWER_QUESTION'
      } catch (err) {
        console.error('Failed to parse structured action JSON:', err)
      }
    }

    // Execute resolved action against Supabase using admin client
    let actionExecutionResult = null
    if (actionPayload) {
      try {
        const { type, params } = actionPayload
        if (type === 'ADD_CONTACT' && params.name) {
          const { data, error } = await supabaseAdmin
            .from('contacts')
            .insert({
              client_id: clientId,
              name: params.name,
              email: params.email || null,
              phone: params.phone || null,
              address: params.address || null,
              notes: params.notes || null,
              status: 'active'
            })
            .select()
            .single()

          if (error) throw error
          actionExecutionResult = data
        } else if (type === 'CREATE_JOB' && params.title) {
          const { data, error } = await supabaseAdmin
            .from('jobs')
            .insert({
              client_id: clientId,
              contact_id: params.contact_id || null,
              title: params.title,
              description: params.description || null,
              address: params.address || null,
              start_date: params.start_date || new Date().toISOString(),
              end_date: params.end_date || null,
              status: 'scheduled',
              price: params.price || 0,
              assigned_user_ids: params.assigned_user_ids || []
            })
            .select()
            .single()

          if (error) throw error
          actionExecutionResult = data
        } else if (type === 'UPDATE_JOB_STATUS' && params.job_id) {
          const { data, error } = await supabaseAdmin
            .from('jobs')
            .update({
              status: params.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', params.job_id)
            .select()
            .single()

          if (error) throw error
          actionExecutionResult = data
        } else if (type === 'UPDATE_JOB_COST' && params.job_id) {
          const updateFields = {
            updated_at: new Date().toISOString()
          }
          if (params.price !== undefined) updateFields.price = params.price
          if (params.materials_cost !== undefined) updateFields.materials_cost = params.materials_cost
          if (params.labour_cost !== undefined) updateFields.labour_cost = params.labour_cost
          if (params.sub_cost !== undefined) updateFields.sub_cost = params.sub_cost

          const { data, error } = await supabaseAdmin
            .from('jobs')
            .update(updateFields)
            .eq('id', params.job_id)
            .select()
            .single()

          if (error) throw error
          actionExecutionResult = data
        } else if (type === 'CREATE_INVOICE') {
          // Generate temporary invoice number
          const invNum = `INV-${Date.now().toString().slice(-6)}`
          const { data, error } = await supabaseAdmin
            .from('invoices')
            .insert({
              client_id: clientId,
              contact_id: params.contact_id || null,
              job_id: params.job_id || null,
              invoice_number: invNum,
              status: 'draft',
              line_items: params.line_items || [],
              subtotal: params.line_items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0,
              grand_total: params.line_items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0,
              currency: client.currency,
              currency_symbol: client.currency_symbol,
              notes: params.notes || null,
              is_recurring: params.is_recurring || false,
              recurring_interval: params.recurring_interval || null
            })
            .select()
            .single()

          if (error) throw error
          actionExecutionResult = data
        } else if (type === 'UPDATE_INVOICE_STATUS' && params.invoice_id) {
          const { data, error } = await supabaseAdmin
            .from('invoices')
            .update({
              status: params.status,
              paid_date: params.status === 'paid' ? new Date().toISOString() : null
            })
            .eq('id', params.invoice_id)
            .select()
            .single()

          if (error) throw error
          actionExecutionResult = data
        } else if (type === 'SEND_INVOICE' && params.invoice_id) {
          // Fetch invoice with client/contact info to send email
          const { data: invoice, error: fetchErr } = await supabaseAdmin
            .from('invoices')
            .select('*, contact:contacts(*), client:clients(*)')
            .eq('id', params.invoice_id)
            .single()

          if (fetchErr) throw fetchErr

          if (invoice && invoice.contact?.email) {
            // Trigger email send via Resend
            const currencySym = invoice.currency_symbol || '$'
            const totalAmount = Number(invoice.grand_total || 0).toFixed(2)
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
            const portalUrl = `http://localhost:5173/invoice/${invoice.id}`
            const resendApiKey = process.env.RESEND_API_KEY

            if (resendApiKey) {
              const htmlContent = `
                <div style="font-family: sans-serif; background-color: #0f0e0d; color: #f4f3ee; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #c15f3c;">Invoice ${invoice.invoice_number} from ${invoice.client?.business_name || 'Our Service Company'}</h2>
                  <p>Hello ${invoice.contact.name},</p>
                  <p>You have received a new invoice for <strong>${currencySym}${totalAmount}</strong>.</p>
                  <p><a href="${portalUrl}" style="display: inline-block; background-color: #c15f3c; color: #f4f3ee; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View & Pay Invoice</a></p>
                </div>
              `
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  from: `Opsly Invoices <${fromEmail}>`,
                  to: [invoice.contact.email],
                  subject: `Invoice ${invoice.invoice_number} from ${invoice.client?.business_name}`,
                  html: htmlContent
                })
              })
            }

            // Update status to 'sent'
            const { data: updated, error: updateErr } = await supabaseAdmin
              .from('invoices')
              .update({
                status: 'sent',
                sent_date: new Date().toISOString()
              })
              .eq('id', params.invoice_id)
              .select()
              .single()

            if (updateErr) throw updateErr
            actionExecutionResult = updated
          } else {
            throw new Error('Contact email missing on invoice recipient.')
          }
        } else if (type === 'CREATE_ESTIMATE') {
          const estNum = `EST-${Date.now().toString().slice(-6)}`
          const { data, error } = await supabaseAdmin
            .from('estimates')
            .insert({
              client_id: clientId,
              contact_id: params.contact_id || null,
              job_id: params.job_id || null,
              estimate_number: estNum,
              status: 'draft',
              line_items: params.line_items || [],
              subtotal: params.line_items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0,
              grand_total: params.line_items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0,
              currency: client.currency,
              currency_symbol: client.currency_symbol,
              notes: params.notes || null
            })
            .select()
            .single()

          if (error) throw error
          actionExecutionResult = data
        } else if (type === 'SEND_ESTIMATE' && params.estimate_id) {
          // Fetch estimate with client/contact info to send email
          const { data: estimate, error: fetchErr } = await supabaseAdmin
            .from('estimates')
            .select('*, contact:contacts(*), client:clients(*)')
            .eq('id', params.estimate_id)
            .single()

          if (fetchErr) throw fetchErr

          if (estimate && estimate.contact?.email) {
            // Trigger email send via Resend
            const currencySym = estimate.currency_symbol || '$'
            const totalAmount = Number(estimate.grand_total || 0).toFixed(2)
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
            const portalUrl = `http://localhost:5173/estimate/${estimate.id}`
            const resendApiKey = process.env.RESEND_API_KEY

            if (resendApiKey) {
              const htmlContent = `
                <div style="font-family: sans-serif; background-color: #0f0e0d; color: #f4f3ee; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #c15f3c;">Estimate ${estimate.estimate_number} from ${estimate.client?.business_name || 'Our Service Company'}</h2>
                  <p>Hello ${estimate.contact.name},</p>
                  <p>You have received a new estimate for <strong>${currencySym}${totalAmount}</strong>.</p>
                  <p><a href="${portalUrl}" style="display: inline-block; background-color: #c15f3c; color: #f4f3ee; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Estimate</a></p>
                </div>
              `
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  from: `Opsly Estimates <${fromEmail}>`,
                  to: [estimate.contact.email],
                  subject: `Estimate ${estimate.estimate_number} from ${estimate.client?.business_name}`,
                  html: htmlContent
                })
              })
            }

            // Update status to 'sent'
            const { data: updated, error: updateErr } = await supabaseAdmin
              .from('estimates')
              .update({
                status: 'sent',
                sent_date: new Date().toISOString()
              })
              .eq('id', params.estimate_id)
              .select()
              .single()

            if (updateErr) throw updateErr
            actionExecutionResult = updated
          } else {
            throw new Error('Contact email missing on estimate recipient.')
          }
        } else if (type === 'UPDATE_ESTIMATE_STATUS' && params.estimate_id) {
          const { data, error } = await supabaseAdmin
            .from('estimates')
            .update({
              status: params.status,
              approved_date: params.status === 'approved' ? new Date().toISOString() : null,
              rejected_date: params.status === 'rejected' ? new Date().toISOString() : null
            })
            .eq('id', params.estimate_id)
            .select()
            .single()

          if (error) throw error
          actionExecutionResult = data
        } else if (type === 'LOG_EXPENSE' && params.amount) {
          const { data, error } = await supabaseAdmin
            .from('expenses')
            .insert({
              client_id: clientId,
              amount: params.amount,
              category: params.category || 'Materials',
              description: params.description || null,
              expense_date: params.expense_date || new Date().toISOString().split('T')[0]
            })
            .select()
            .single()

          if (error) throw error
          actionExecutionResult = data
        }

        // Notify client of action success
        if (actionExecutionResult) {
          sendSSEEvent(res, 'action_success', { type, data: actionExecutionResult })
        }
      } catch (err) {
        console.error('Failed to execute database action:', err)
        sendSSEEvent(res, 'action_error', { error: err.message || 'Database execution failed' })
      }
    }

    // 8. Log AI usage
    const { error: usageLogErr } = await supabaseAdmin
      .from('ai_usage')
      .insert({
        client_id: clientId,
        user_id: profile.id,
        input_tokens: inputTokens || 1000, // Fallback if 0
        output_tokens: outputTokens || 100, // Fallback if 0
        model: modelName,
        command_type: resolvedAction,
        command_text: command
      })

    if (usageLogErr) {
      console.error('Error logging AI usage to database:', usageLogErr)
    }

    // 9. Send Overage Cap Warnings at 90%
    const newTotalTokens = totalTokens + inputTokens + outputTokens
    const newCommandsUsed = Math.floor(newTotalTokens / 2500)
    if (limit !== -1 && newCommandsUsed >= limit * 0.9 && newCommandsUsed < limit) {
      sendSSEEvent(res, 'overage_warning', {
        message: `You've used ${newCommandsUsed} commands out of your monthly ${limit} plan limit. Additional commands will incur overages.`
      })
    }

    sendSSEEvent(res, 'done', { success: true })
    res.end()

  } catch (err) {
    console.error('AI Middleware Execution Failed:', err)
    
    // Log failure to `ai_errors` table for admin debugging (D. Failed AI commands guardrail)
    if (clientId) {
      try {
        await supabaseAdmin
          .from('ai_errors')
          .insert({
            client_id: clientId,
            command_type: command ? 'AI_COMMAND' : 'UNKNOWN',
            error_code: err.message || 'Unknown middleware failure',
            timestamp: new Date().toISOString()
          })
      } catch (logErr) {
        console.error('Failed to log error to database:', logErr)
      }
    }

    // Return friendly, non-technical message to user
    if (res.headersSent) {
      sendSSEEvent(res, 'action_error', { error: 'Something went wrong — your data is safe. Try again in a moment.' })
      res.end()
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Something went wrong — your data is safe. Try again in a moment.' }))
    }
  }
}
