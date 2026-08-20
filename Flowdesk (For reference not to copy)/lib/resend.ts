// lib/resend.ts

import { Resend } from 'resend';
import { Invoice } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY || 'mock_key');

function invoiceEmailTemplate(invoice: Invoice): string {
  const ownerName = process.env.NEXT_PUBLIC_OWNER_NAME || "Your Name";
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; color: #333;">
      <h2 style="color: #0c0c0e; font-size: 20px; margin-bottom: 16px;">Invoice ${invoice.invoice_number}</h2>
      <p>Hello ${invoice.client?.name || 'Client'},</p>
      <p>We have generated invoice <strong>${invoice.invoice_number}</strong> for your review. Please find the PDF copy attached to this email.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px 0; color: #666;">Due Date</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${invoice.due_date}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px 0; color: #666;">Total Amount</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #E8C547; font-family: monospace;">
            ${invoice.currency} ${invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </td>
        </tr>
      </table>

      <p style="margin-top: 24px;">Thank you for your business!</p>
      <p>Best regards,<br/><strong>${ownerName}</strong></p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;"/>
      <p style="font-size: 11px; color: #999; text-align: center;">Generated automatically by FlowDesk Business OS.</p>
    </div>
  `;
}

/**
 * Sends an email with the invoice details and PDF attachment.
 * @param invoice The Invoice object, including client details.
 * @param pdfBase64 The base64-encoded PDF file string.
 */
export async function sendInvoiceEmail(invoice: Invoice, pdfBase64: string) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured in environment variables.");
  }
  if (!invoice.client?.email) {
    throw new Error("Client does not have a valid email address.");
  }
  const ownerName = process.env.NEXT_PUBLIC_OWNER_NAME || "Your Name";
  
  return resend.emails.send({
    from: 'FlowDesk <onboarding@resend.dev>', // Resend sandbox requirement
    to: invoice.client.email,
    subject: `Invoice ${invoice.invoice_number} from ${ownerName}`,
    html: invoiceEmailTemplate(invoice),
    attachments: [
      {
        filename: `${invoice.invoice_number}_${invoice.client.name.replace(/\s+/g, '_')}.pdf`,
        content: pdfBase64,
      }
    ]
  });
}
