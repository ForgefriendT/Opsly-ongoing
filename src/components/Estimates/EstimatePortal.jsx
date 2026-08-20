import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function EstimatePortal({ estimateId, onClose }) {
  const [estimate, setEstimate] = useState(null)
  const [client, setClient] = useState(null)
  const [contact, setContact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchEstimateDetails = async () => {
      if (!estimateId) {
        setError('Estimate ID is missing.')
        setLoading(false)
        return
      }

      try {
        // 1. Fetch Estimate
        const { data: estData, error: estErr } = await supabase
          .from('estimates')
          .select('*')
          .eq('id', estimateId)
          .maybeSingle()

        if (estErr) throw estErr
        if (!estData) {
          setError('We couldn\'t find that estimate. It may have been deleted.')
          setLoading(false)
          return
        }

        setEstimate(estData)

        // 2. Fetch Client & Contact details
        const [clientRes, contactRes] = await Promise.all([
          supabase.from('clients').select('*').eq('id', estData.client_id).maybeSingle(),
          estData.contact_id ? supabase.from('contacts').select('*').eq('id', estData.contact_id).maybeSingle() : Promise.resolve({ data: null })
        ])

        if (clientRes.data) setClient(clientRes.data)
        if (contactRes.data) setContact(contactRes.data)

      } catch (err) {
        console.error('Error loading estimate portal:', err)
        setError('Something went wrong on our end. Please try again in a moment.')
      } finally {
        setLoading(false)
      }
    }

    fetchEstimateDetails()
  }, [estimateId])

  const handleUpdateStatus = async (newStatus) => {
    if (updating) return
    setUpdating(true)
    
    const updatePayload = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }
    
    if (newStatus === 'approved') {
      updatePayload.approved_date = new Date().toISOString()
    } else if (newStatus === 'rejected') {
      updatePayload.rejected_date = new Date().toISOString()
    }

    try {
      // 1. Update Estimate Status
      const { error: updateErr } = await supabase
        .from('estimates')
        .update(updatePayload)
        .eq('id', estimateId)

      if (updateErr) throw updateErr

      setEstimate(prev => ({
        ...prev,
        ...updatePayload
      }))
    } catch (err) {
      console.error('Error updating estimate status:', err)
      setError('Could not update status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0e0d] flex items-center justify-center flex-col gap-4 text-opsly-secondary">
        <svg className="animate-spin h-8 w-8 text-opsly-accent" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs">Loading Secure Estimate Portal...</span>
      </div>
    )
  }

  if (error || !estimate || !client) {
    return (
      <div className="min-h-screen bg-[#0f0e0d] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-opsly-error/15 flex items-center justify-center mb-4 text-opsly-error border border-opsly-error/20">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-opsly-text">Estimate Load Failed</h3>
        <p className="text-xs text-opsly-secondary max-w-sm mt-1.5 leading-relaxed">{error || 'Estimate not found.'}</p>
        {onClose && (
          <button onClick={onClose} className="mt-6 bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-text px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer">
            Close Portal
          </button>
        )}
      </div>
    )
  }

  const currencySymbol = estimate.currency_symbol || '$'
  const isApproved = estimate.status === 'approved'
  const isRejected = estimate.status === 'rejected'
  const isConverted = estimate.status === 'converted'
  const isActionable = estimate.status !== 'approved' && estimate.status !== 'rejected' && estimate.status !== 'converted'

  // Standard items, adjustments, and metadata
  const lineItems = estimate.line_items || []
  const standardItems = lineItems.filter(item => !item.is_adjustment && !item.is_metadata)
  const adjustments = lineItems.filter(item => item.is_adjustment)
  const taxesDisabled = lineItems.some(item => item.is_metadata && item.taxes_disabled)

  return (
    <div className="invoice-print-root min-h-screen bg-[#0f0e0d] py-10 px-4 sm:px-6">
      
      {/* Print-only isolation: only show estimate card, nothing else */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          /* Hide all App elements on print */
          aside, header, nav, footer, button, .no-print, .no-print-wrapper {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            opacity: 0 !important;
            overflow: hidden !important;
          }
          /* Reset container settings */
          body, html, #root, .app-layout-wrapper, .main-content-area, .invoice-print-root {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            position: relative !important;
          }
          .print-card * {
            color: #000000 !important;
            border-color: #e5e7eb !important;
          }
        }
      `}</style>

      {/* Control bar */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center no-print">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-secondary hover:text-opsly-text px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Exit Portal
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-text px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / PDF
          </button>
          
          {isActionable && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateStatus('rejected')}
                disabled={updating}
                className="bg-red-950/40 text-red-400 border border-red-800/40 hover:bg-red-900/40 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Reject Proposal
              </button>
              <button
                onClick={() => handleUpdateStatus('approved')}
                disabled={updating}
                className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-md disabled:opacity-50"
              >
                Approve & Sign
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Estimate Sheet */}
      <div
        className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-8 sm:p-12 shadow-xl print-card overflow-hidden relative text-gray-900"
      >
        {/* Company details & Estimate title header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-200 pb-6 relative">
          <div className="space-y-3">
            {client.logo_url && (
              <img
                src={client.logo_url}
                alt={client.business_name}
                className="max-h-12 max-w-[180px] object-contain rounded"
              />
            )}
            <div>
              <h2 className="text-base font-bold text-gray-900">{client.business_name || 'Our Service Company'}</h2>
              <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                {client.business_address && <span className="block">{client.business_address}</span>}
                {client.business_phone && <span className="block">Phone: {client.business_phone}</span>}
                {client.business_email && <span className="block">Email: {client.business_email}</span>}
                {client.business_website && <span className="block">Web: {client.business_website}</span>}
              </p>
            </div>
          </div>

          <div className="sm:text-right space-y-2 flex flex-col sm:items-end">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">ESTIMATE</h1>
            <div className="text-[11px] text-gray-500 leading-relaxed">
              <p><span className="font-semibold text-gray-700">Estimate #:</span> {estimate.estimate_number}</p>
              <p><span className="font-semibold text-gray-700">Date:</span> {new Date(estimate.created_at).toLocaleDateString()}</p>
              <p><span className="font-semibold text-gray-700">Valid Until:</span> {estimate.valid_until ? new Date(estimate.valid_until).toLocaleDateString() : '—'}</p>
            </div>

            {/* Rotated status stamp positioned cleanly in header */}
            <div className="mt-2 sm:mt-1 select-none">
              <span
                className={`inline-block text-[14px] font-extrabold uppercase tracking-wider rotate-[-5deg] select-none border-3 px-2.5 py-0.5 rounded ${
                  isApproved || isConverted ? 'text-green-500 border-green-500' : 
                  isRejected ? 'text-red-500 border-red-500' : 'text-amber-500 border-amber-500'
                }`}
              >
                {estimate.status}
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6 pt-6">
          {/* Prepared For customer information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Prepared For</h3>
              {contact ? (
                <div className="text-xs leading-relaxed text-gray-800">
                  <p className="font-bold text-gray-900">{contact.name}</p>
                  {contact.address && <p>{contact.address}</p>}
                  {contact.phone && <p>Phone: {contact.phone}</p>}
                  {contact.email && <p>Email: {contact.email}</p>}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No contact information.</p>
              )}
            </div>
          </div>

          {/* Line items table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center w-16">Qty</th>
                  <th className="p-3 text-right w-24">Rate</th>
                  {!taxesDisabled && <th className="p-3 text-right w-24">Tax %</th>}
                  <th className="p-3 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                {standardItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="p-3">
                      <p className="font-medium text-gray-900">{item.description}</p>
                    </td>
                    <td className="p-3 text-center text-gray-600">{item.quantity}</td>
                    <td className="p-3 text-right text-gray-600">{currencySymbol}{Number(item.unit_price).toFixed(2)}</td>
                    {!taxesDisabled && <td className="p-3 text-right text-gray-600">{item.tax_rate}%</td>}
                    <td className="p-3 text-right font-bold text-gray-900">{currencySymbol}{(item.quantity * item.unit_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            {/* Left: Notes / Terms / Signatures */}
            <div className="flex-1 space-y-4 w-full">
              {estimate.notes && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Estimate Terms</h4>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-lg p-3">
                    {estimate.notes}
                  </p>
                </div>
              )}

              {client.signature_url && (
                <div className="pt-2">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Authorized Representative</h4>
                  <img
                    src={client.signature_url}
                    alt="Signature"
                    className="max-h-10 max-w-[140px] object-contain"
                  />
                </div>
              )}
            </div>

            {/* Right: Calculations breakdown */}
            <div className="w-full sm:w-72 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">{currencySymbol}{Number(estimate.subtotal).toFixed(2)}</span>
              </div>
              
              {!taxesDisabled && (
                <div className="flex justify-between">
                  <span>Tax Total</span>
                  <span className="font-semibold text-gray-900">{currencySymbol}{Number(estimate.tax_total).toFixed(2)}</span>
                </div>
              )}
              
              {estimate.discount_amount > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Discount</span>
                  <span>-{currencySymbol}{Number(estimate.discount_amount).toFixed(2)}</span>
                </div>
              )}

              {/* Custom adjustments */}
              {adjustments.map((adj, idx) => {
                const isNeg = Number(adj.unit_price) < 0
                return (
                  <div key={idx} className={`flex justify-between font-medium ${isNeg ? 'text-red-600' : 'text-emerald-600'}`}>
                    <span>{adj.description}</span>
                    <span>{isNeg ? '-' : '+'}{currencySymbol}{Math.abs(Number(adj.unit_price)).toFixed(2)}</span>
                  </div>
                )
              })}

              <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-bold text-gray-900">
                <span>Grand Total</span>
                <span className="text-base text-gray-900">{currencySymbol}{Number(estimate.grand_total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
