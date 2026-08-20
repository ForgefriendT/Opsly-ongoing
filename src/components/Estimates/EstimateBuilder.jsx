import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function EstimateBuilder({ onBack, onSave, currentPlan, currentClient, onShowToast }) {
  const [contacts, setContacts] = useState([])
  const [loadingContacts, setLoadingContacts] = useState(true)

  // Estimate form states
  const [selectedContactId, setSelectedContactId] = useState('')
  const [estimateNumber, setEstimateNumber] = useState('')
  const [estimateDate, setEstimateDate] = useState(new Date().toISOString().split('T')[0])
  const [validUntil, setValidUntil] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 30) // Default 30 days validity
    return date.toISOString().split('T')[0]
  })

  const [lineItems, setLineItems] = useState([
    { id: '1', description: '', quantity: 1, unit_price: 0, tax_rate: 0 }
  ])
  const [notes, setNotes] = useState('')

  // Customization Toggles
  const [showLogo, setShowLogo] = useState(true)
  const [showSignature, setShowSignature] = useState(true)

  // Paid Plan Customizations (Growth and above)
  const isGrowthOrAbove = currentPlan !== 'free' && currentPlan !== 'starter'
  const [discountType, setDiscountType] = useState('percentage') // 'percentage' or 'flat'
  const [discountValue, setDiscountValue] = useState(0)
  const [colorTheme, setColorTheme] = useState('default')
  const [template, setTemplate] = useState('minimal')

  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const currencySymbol = currentClient?.currency_symbol || '$'

  // Fetch CRM contacts for client selector
  useEffect(() => {
    const fetchContacts = async () => {
      if (!currentClient?.id) return
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('id, name, email')
          .eq('client_id', currentClient.id)
          .order('name', { ascending: true })

        if (error) throw error
        setContacts(data || [])
        if (data && data.length > 0) {
          setSelectedContactId(data[0].id)
        }
      } catch (err) {
        console.error('Error fetching contacts:', err)
      } finally {
        setLoadingContacts(false)
      }
    }

    // Auto-generate estimate number
    const prefix = currentClient?.invoice_prefix || 'EST'
    const randNum = Math.floor(1000 + Math.random() * 9000)
    setEstimateNumber(`${prefix}-${randNum}`)

    fetchContacts()
  }, [currentClient])

  // Real-time calculations
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const taxTotal = lineItems.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unit_price
    return sum + (lineTotal * (item.tax_rate / 100))
  }, 0)

  // Calculate discount (Growth+)
  let discountAmount = 0
  if (isGrowthOrAbove && discountValue > 0) {
    if (discountType === 'percentage') {
      discountAmount = subtotal * (discountValue / 100)
    } else {
      discountAmount = Number(discountValue)
    }
  }

  const grandTotal = Math.max(0, subtotal + taxTotal - discountAmount)

  const handleAddLineItem = () => {
    setLineItems(prev => [
      ...prev,
      { id: Date.now().toString(), description: '', quantity: 1, unit_price: 0, tax_rate: 0 }
    ])
  }

  const handleRemoveLineItem = (id) => {
    if (lineItems.length === 1) return
    setLineItems(prev => prev.filter(item => item.id !== id))
  }

  const handleLineItemChange = (id, field, value) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  const getEstimatePayload = (status) => {
    return {
      client_id: currentClient.id,
      contact_id: selectedContactId || null,
      estimate_number: estimateNumber,
      status: status,
      valid_until: validUntil,
      line_items: lineItems.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        tax_rate: Number(item.tax_rate)
      })),
      subtotal,
      tax_total: taxTotal,
      discount_amount: isGrowthOrAbove ? discountAmount : 0,
      grand_total: grandTotal,
      notes,
      currency: currentClient.currency || 'USD',
      currency_symbol: currencySymbol,
      pdf_url: null
    }
  }

  const handleSaveEstimate = async (status) => {
    if (!selectedContactId) {
      onShowToast('Please select a client contact.')
      return
    }
    if (!estimateNumber.trim()) {
      onShowToast('Please enter an estimate number.')
      return
    }

    const isSend = status === 'sent'
    if (isSend) setSending(true)
    else setSaving(true)

    try {
      // 1. Save estimate to Supabase
      const payload = getEstimatePayload(status)
      if (isSend) {
        payload.sent_date = new Date().toISOString()
      }

      const { data: savedEstimate, error: saveErr } = await supabase
        .from('estimates')
        .insert(payload)
        .select()
        .single()

      if (saveErr) throw saveErr

      // 2. Trigger transactional email via Resend if sending immediately
      if (isSend) {
        const contact = contacts.find(c => c.id === selectedContactId)
        if (contact && contact.email) {
          const emailRes = await fetch('/api/send-estimate-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              estimateId: savedEstimate.id,
              recipientEmail: contact.email,
              recipientName: contact.name,
              businessName: currentClient.business_name || 'Our Service Company'
            })
          })

          if (!emailRes.ok) {
            console.warn('Email delivery failed, but estimate was saved.')
            onShowToast('Estimate saved — email delivery failed. Check your email settings.')
          } else {
            onShowToast('Estimate generated and emailed successfully!')
          }
        } else {
          onShowToast('Estimate saved, but client contact is missing an email address.')
        }
      } else {
        onShowToast('Draft estimate saved successfully!')
      }

      onSave()
      onBack()
    } catch (err) {
      console.error(err)
      onShowToast(err.message || 'Failed to save estimate.')
    } finally {
      setSaving(false)
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-opsly-secondary hover:text-opsly-text bg-opsly-input hover:bg-opsly-hover border border-opsly-border py-2 px-3.5 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Estimates
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSaveEstimate('draft')}
            disabled={saving || sending}
            className="text-xs font-semibold text-opsly-secondary hover:text-opsly-text bg-opsly-input hover:bg-opsly-hover border border-opsly-border py-2 px-4 rounded-xl cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
          >
            {saving ? 'Saving Draft...' : 'Save as Draft'}
          </button>
          <button
            onClick={() => handleSaveEstimate('sent')}
            disabled={saving || sending}
            className="text-xs font-semibold text-opsly-text bg-opsly-accent hover:bg-opsly-accent-hover py-2 px-5 rounded-xl cursor-pointer shadow-lg shadow-opsly-accent/15 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
          >
            {sending ? 'Sending...' : 'Save & Send Email'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-opsly-card border border-opsly-border rounded-xl p-5 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-opsly-text border-b border-opsly-border pb-3">Estimate Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">For Client *</label>
                {loadingContacts ? (
                  <div className="h-9 w-full bg-opsly-input border border-opsly-border rounded-lg animate-pulse" />
                ) : (
                  <select
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                  >
                    <option value="" disabled>Select a contact...</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ''}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Estimate Number *</label>
                <input
                  type="text"
                  required
                  value={estimateNumber}
                  onChange={(e) => setEstimateNumber(e.target.value)}
                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Estimate Date</label>
                <input
                  type="date"
                  value={estimateDate}
                  onChange={(e) => setEstimateDate(e.target.value)}
                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Line items section */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Line Items</label>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="text-[10px] font-semibold text-opsly-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Add Line Item
                </button>
              </div>

              <div className="space-y-3.5">
                {lineItems.map((item) => (
                  <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-opsly-input/20 border border-opsly-border/50 rounded-xl p-4 relative group">
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        required
                        placeholder="Description of estimate service or materials..."
                        value={item.description}
                        onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                        className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 w-full md:w-80">
                      <div>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-2.5 py-2 text-xs text-center focus:border-opsly-accent focus:outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          placeholder="Rate"
                          value={item.unit_price || ''}
                          onChange={(e) => handleLineItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-2.5 py-2 text-xs text-center focus:border-opsly-accent focus:outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Tax %"
                          value={item.tax_rate || ''}
                          onChange={(e) => handleLineItemChange(item.id, 'tax_rate', parseFloat(e.target.value) || 0)}
                          className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-2.5 py-2 text-xs text-center focus:border-opsly-accent focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full md:w-auto gap-3 pt-2 md:pt-0 border-t border-opsly-border/30 md:border-none">
                      <span className="text-xs font-bold text-opsly-text w-20 text-right">
                        {currencySymbol}{(item.quantity * item.unit_price).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(item.id)}
                        disabled={lineItems.length === 1}
                        className="p-1.5 rounded-xl bg-opsly-input border border-opsly-border text-opsly-secondary hover:text-opsly-error disabled:opacity-40 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150"
                        title="Remove item"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes and terms */}
            <div>
              <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Notes &amp; Terms</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Estimate valid for 30 days. Material prices subject to change."
                rows={3}
                className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Customization & Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Summary Details */}
          <div className="bg-opsly-card border border-opsly-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-opsly-text border-b border-opsly-border pb-3">Estimate Summary</h3>

            <div className="space-y-2.5 text-xs text-opsly-secondary">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-opsly-text">{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Total</span>
                <span className="font-semibold text-opsly-text">{currencySymbol}{taxTotal.toFixed(2)}</span>
              </div>

              {isGrowthOrAbove && discountValue > 0 && (
                <div className="flex justify-between text-opsly-error">
                  <span>Discount</span>
                  <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-opsly-border flex justify-between items-center text-sm font-bold text-opsly-text">
                <span>Grand Total</span>
                <span className="text-base text-opsly-accent">{currencySymbol}{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Toggle Options */}
          <div className="bg-opsly-card border border-opsly-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-opsly-text border-b border-opsly-border pb-3">Branding Options</h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between text-xs text-opsly-secondary cursor-pointer select-none">
                <span>Show Company Logo</span>
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="rounded bg-opsly-input border-opsly-border text-opsly-accent focus:ring-0 focus:ring-offset-0"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-opsly-secondary cursor-pointer select-none">
                <span>Show Signature / Stamp</span>
                <input
                  type="checkbox"
                  checked={showSignature}
                  onChange={(e) => setShowSignature(e.target.checked)}
                  className="rounded bg-opsly-input border-opsly-border text-opsly-accent focus:ring-0 focus:ring-offset-0"
                />
              </label>
            </div>
          </div>

          {/* Paid Customizations (Growth and above) */}
          {isGrowthOrAbove ? (
            <div className="bg-opsly-card border border-opsly-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-opsly-accent border-b border-opsly-border pb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Growth Customizations
              </h3>

              {/* Discount Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Discount Options</label>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-2 py-1.5 text-xs focus:border-opsly-accent focus:outline-none"
                  >
                    <option value="percentage">% Percent</option>
                    <option value="flat">$ Flat</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="Val"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="flex-1 bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-1.5 text-xs focus:border-opsly-accent focus:outline-none"
                  />
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Color Theme Preset</label>
                <select
                  value={colorTheme}
                  onChange={(e) => setColorTheme(e.target.value)}
                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                >
                  <option value="default">Default Coral</option>
                  <option value="blue">Deep Ocean Blue</option>
                  <option value="green">Forest Green</option>
                  <option value="amber">Warm Amber</option>
                  <option value="charcoal">Slate Charcoal</option>
                  <option value="rose">Soft Rose</option>
                </select>
              </div>

              {/* Template Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Estimate Layout Template</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                >
                  <option value="minimal">Minimal Clean</option>
                  <option value="detailed">Detailed Modern</option>
                  <option value="contractor">Contractor Style</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="bg-opsly-input border border-opsly-border rounded-xl p-4 text-center space-y-2">
              <svg className="w-5 h-5 text-opsly-muted mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-[10px] font-semibold text-opsly-secondary">Growth Features Locked</p>
              <p className="text-[9px] text-opsly-muted leading-relaxed">
                Upgrade to Growth plan to unlock estimate templates, color themes, and discounts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
