import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kqyxhnnouwdbwbmwbohl.supabase.co'
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || ''

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Trigger Resend email API
async function sendReminderEmail({ invoice, contact, client, templateName, subject }) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.log(`[Chaser Simulation] Resend API Key missing. Simulating reminder email "${subject}" to ${contact.email}`);
    return true
  }

  const currencySym = invoice.currency_symbol || '$'
  const totalAmount = Number(invoice.grand_total || 0).toFixed(2)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const portalUrl = `http://localhost:5173/invoice/${invoice.id}` // Default fallback url for dev

  const htmlContent = `
    <div style="font-family: sans-serif; background-color: #0f0e0d; color: #f4f3ee; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #c15f3c;">Payment Reminder: Invoice ${invoice.invoice_number}</h2>
      <p>Hello ${contact.name},</p>
      <p>This is a <strong>${templateName}</strong> regarding outstanding Invoice ${invoice.invoice_number} from ${client.business_name || 'Our Service Company'}.</p>
      
      <div style="background-color: #1a1917; border: 1px solid #2a2825; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Invoice #</strong>: ${invoice.invoice_number}</p>
        <p style="margin: 5px 0;"><strong>Due Date</strong>: ${new Date(invoice.due_date).toLocaleDateString()}</p>
        <p style="margin: 5px 0; color: #c15f3c; font-size: 16px;"><strong>Amount Due</strong>: ${currencySym}${totalAmount}</p>
      </div>

      <p><a href="${portalUrl}" style="display: inline-block; background-color: #c15f3c; color: #f4f3ee; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View & Pay Invoice</a></p>
      
      <p style="color: #b1ada1; font-size: 12px;">If you have already submitted payment, please disregard this reminder.</p>
    </div>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Opsly Invoices <${fromEmail}>`,
        to: [contact.email],
        subject: subject,
        html: htmlContent
      })
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('[Chaser API Error]:', err)
      return false
    }

    return true
  } catch (err) {
    console.error('[Chaser Fetch Error]:', err)
    return false
  }
}

export async function runLatePaymentChaser() {
  console.log('[Chaser Run] Starting scan of past due invoices...')
  const today = new Date()
  
  try {
    // 1. Fetch sent/viewed/overdue invoices with due date in the past
    const { data: invoices, error } = await supabaseAdmin
      .from('invoices')
      .select('*, client:clients(*), contact:contacts(*)')
      .in('status', ['sent', 'viewed', 'overdue'])
      .lt('due_date', today.toISOString().split('T')[0])

    if (error) throw error
    if (!invoices || invoices.length === 0) {
      console.log('[Chaser Run] No past due invoices found.')
      return { checked: 0, updated: 0 }
    }

    let updatedCount = 0

    for (const invoice of invoices) {
      if (!invoice.contact || !invoice.contact.email) {
        console.log(`[Chaser Run] Invoice ${invoice.invoice_number} is past due but has no contact/email. Skipping.`)
        continue
      }

      const dueDate = new Date(invoice.due_date)
      const diffTime = Math.abs(today - dueDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let paymentsData = invoice.payments || {}
      let chaserHistory = paymentsData.chaser_history || {}
      let statusNeedsUpdate = invoice.status !== 'overdue'
      let emailSent = false
      let newChaserUpdate = {}

      if (diffDays >= 14 && !chaserHistory.day14_sent_at) {
        // Day 14 Final Notice
        console.log(`[Chaser Run] Invoice ${invoice.invoice_number} is ${diffDays} days past due. Sending Day 14 Final Notice.`)
        emailSent = await sendReminderEmail({
          invoice,
          contact: invoice.contact,
          client: invoice.client,
          templateName: 'Final Notice',
          subject: `Urgent: Final Notice for Invoice ${invoice.invoice_number}`
        })

        if (emailSent) {
          newChaserUpdate.day14_sent_at = new Date().toISOString()
        }
      } else if (diffDays >= 7 && !chaserHistory.day7_sent_at && !chaserHistory.day14_sent_at) {
        // Day 7 Firmer Follow-up
        console.log(`[Chaser Run] Invoice ${invoice.invoice_number} is ${diffDays} days past due. Sending Day 7 Firmer Follow-up.`)
        emailSent = await sendReminderEmail({
          invoice,
          contact: invoice.contact,
          client: invoice.client,
          templateName: 'Firmer Follow-up',
          subject: `Reminder: Invoice ${invoice.invoice_number} is past due`
        })

        if (emailSent) {
          newChaserUpdate.day7_sent_at = new Date().toISOString()
        }
      } else if (diffDays >= 3 && !chaserHistory.day3_sent_at && !chaserHistory.day7_sent_at && !chaserHistory.day14_sent_at) {
        // Day 3 Polite Reminder
        console.log(`[Chaser Run] Invoice ${invoice.invoice_number} is ${diffDays} days past due. Sending Day 3 Polite Reminder.`)
        emailSent = await sendReminderEmail({
          invoice,
          contact: invoice.contact,
          client: invoice.client,
          templateName: 'Polite Reminder',
          subject: `Polite Reminder: Invoice ${invoice.invoice_number}`
        })

        if (emailSent) {
          newChaserUpdate.day3_sent_at = new Date().toISOString()
        }
      }

      // If we performed any action (status change or email chaser), write updates to database
      if (statusNeedsUpdate || Object.keys(newChaserUpdate).length > 0) {
        const nextPayments = {
          ...paymentsData,
          chaser_history: {
            ...chaserHistory,
            ...newChaserUpdate
          }
        }

        const { error: updateErr } = await supabaseAdmin
          .from('invoices')
          .update({
            status: 'overdue',
            payments: nextPayments
          })
          .eq('id', invoice.id)

        if (updateErr) {
          console.error(`[Chaser Run] Failed to update database for Invoice ${invoice.invoice_number}:`, updateErr)
        } else {
          updatedCount++
          console.log(`[Chaser Run] Successfully processed & updated Invoice ${invoice.invoice_number} status/chaser logs.`)
        }
      }
    }

    console.log(`[Chaser Run] Scan completed. Scanned ${invoices.length} invoices, updated/chased ${updatedCount}.`)
    return { checked: invoices.length, updated: updatedCount }

  } catch (err) {
    console.error('[Chaser Run Exception]:', err)
    return { error: err.message }
  }
}
