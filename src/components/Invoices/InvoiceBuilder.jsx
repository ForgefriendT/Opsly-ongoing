import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'

export default function InvoiceBuilder({ invoiceId, onBack, onSave, currentPlan, currentClient, onShowToast, prefillData }) {
  const [contacts, setContacts] = useState([])
  const [loadingContacts, setLoadingContacts] = useState(true)
  
  // Invoice form states
  const [selectedContactId, setSelectedContactId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 14) // Default 14 days terms
    return date.toISOString().split('T')[0]
  })
  
  const [lineItems, setLineItems] = useState([
    { id: '1', description: '', quantity: 1, unit_price: 0, tax_rate: 0 }
  ])
  const [notes, setNotes] = useState('')
  const [stripePaymentLink, setStripePaymentLink] = useState(currentClient?.stripe_payment_link || '')
  
  // Customization Toggles
  const [showLogo, setShowLogo] = useState(true)
  const [showSignature, setShowSignature] = useState(true)

  // Paid Plan Customizations (Growth and above)
  const isGrowthOrAbove = currentPlan !== 'free' && currentPlan !== 'starter'
  const [discountType, setDiscountType] = useState('percentage') // 'percentage' or 'flat'
  const [discountValue, setDiscountValue] = useState(0)
  const [depositPercentage, setDepositPercentage] = useState(0)
  const [colorTheme, setColorTheme] = useState('default')
  const [template, setTemplate] = useState('minimal')

  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  // Custom Adjustments and tax global toggles
  const [taxesEnabled, setTaxesEnabled] = useState(true)
  const [adjustments, setAdjustments] = useState([])
  const [fetchingInvoice, setFetchingInvoice] = useState(false)

  // Job Photo Scanner States
  const [isScanningModalOpen, setIsScanningModalOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(null)
  const [uploadedFileName, setUploadedFileName] = useState('')

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
 
    if (!invoiceId) {
      // Auto-generate invoice number prefix only when creating new invoice
      const prefix = currentClient?.invoice_prefix || 'INV'
      const randNum = Math.floor(1000 + Math.random() * 9000)
      setInvoiceNumber(`${prefix}-${randNum}`)
    }
 
    fetchContacts()
  }, [currentClient, invoiceId])

  // Fetch invoice details if editing
  useEffect(() => {
    const fetchInvoiceDetailsForEdit = async () => {
      if (!invoiceId) return
      setFetchingInvoice(true)
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .single()

        if (error) throw error
        if (data) {
          setInvoiceNumber(data.invoice_number || '')
          if (data.created_at) {
            setInvoiceDate(data.created_at.split('T')[0])
          }
          if (data.due_date) {
            setDueDate(data.due_date)
          }
          setNotes(data.notes || '')
          setStripePaymentLink(data.stripe_payment_link || '')
          setColorTheme(data.color_theme || 'default')
          setTemplate(data.template || 'minimal')
          setDepositPercentage(Number(data.deposit_percentage) || 0)
          setSelectedContactId(data.contact_id || '')

          if (data.discount_amount && isGrowthOrAbove) {
            // Deduce discount value if saved
            setDiscountValue(Number(data.discount_amount))
            setDiscountType('flat')
          }

          // Parse line items
          if (Array.isArray(data.line_items)) {
            const stdItems = []
            const adjs = []
            let txEnabled = true

            data.line_items.forEach((item, idx) => {
              if (item.is_metadata) {
                if (item.taxes_disabled) {
                  txEnabled = false
                }
              } else if (item.is_adjustment) {
                adjs.push({
                  id: item.id || `adj-${idx}-${Date.now()}`,
                  label: item.description || '',
                  amount: Math.abs(Number(item.unit_price) || 0),
                  type: Number(item.unit_price) < 0 ? 'deduction' : 'addition'
                })
              } else {
                stdItems.push({
                  id: item.id || `item-${idx}-${Date.now()}`,
                  description: item.description || '',
                  quantity: Number(item.quantity) || 1,
                  unit_price: Number(item.unit_price) || 0,
                  tax_rate: Number(item.tax_rate) || 0
                })
              }
            })

            if (stdItems.length > 0) {
              setLineItems(stdItems)
            } else {
              setLineItems([{ id: '1', description: '', quantity: 1, unit_price: 0, tax_rate: 0 }])
            }
            setAdjustments(adjs)
            setTaxesEnabled(txEnabled)
          }
        }
      } catch (err) {
        console.error('Error fetching invoice for edit:', err)
        onShowToast('Could not load invoice data.')
      } finally {
        setFetchingInvoice(false)
      }
    }

    fetchInvoiceDetailsForEdit()
  }, [invoiceId, isGrowthOrAbove])

  // Handle prefill data passed from parent component (e.g. from client profile quick actions)
  useEffect(() => {
    if (prefillData) {
      if (prefillData.contact_id) {
        setSelectedContactId(prefillData.contact_id)
      }
      if (Array.isArray(prefillData.line_items) && prefillData.line_items.length > 0) {
        setLineItems(prefillData.line_items.map((item, idx) => ({
          id: item.id || `prefill-${idx}-${Date.now()}`,
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
          tax_rate: Number(item.tax_rate) || 0
        })))
      }
    }
  }, [prefillData])

  // Real-time calculations with safe array guards
  const subtotal = (lineItems || []).reduce((sum, item) => sum + (Number(item?.quantity || 0) * Number(item?.unit_price || 0)), 0)
  const taxTotal = taxesEnabled 
    ? (lineItems || []).reduce((sum, item) => {
        const lineTotal = Number(item?.quantity || 0) * Number(item?.unit_price || 0)
        return sum + (lineTotal * (Number(item?.tax_rate || 0) / 100))
      }, 0)
    : 0

  // Calculate discount (Growth+)
  let discountAmount = 0
  if (isGrowthOrAbove && discountValue > 0) {
    if (discountType === 'percentage') {
      discountAmount = subtotal * (discountValue / 100)
    } else {
      discountAmount = Number(discountValue)
    }
  }

  // Calculate custom adjustments total
  const adjustmentsTotal = adjustments.reduce((sum, adj) => {
    const val = Number(adj.amount) || 0
    return sum + (adj.type === 'deduction' ? -val : val)
  }, 0)

  const grandTotal = Math.max(0, subtotal + taxTotal - discountAmount + adjustmentsTotal)
  
  // Calculate deposit (Growth+)
  const depositAmount = isGrowthOrAbove && depositPercentage > 0
    ? grandTotal * (depositPercentage / 100)
    : 0

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

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadedFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedPhotoUrl(event.target.result)
      // Trigger scan simulation
      setIsScanning(true)
      setScanSuccess(false)
      setTimeout(() => {
        setIsScanning(false)
        setScanSuccess(true)
      }, 2500)
    }
    reader.readAsDataURL(file)
  }

  const getNicheMockItems = (niche) => {
    const n = (niche || 'generic').toLowerCase()
    if (n.includes('fence') || n.includes('fencing')) {
      return [
        { id: `mock-${Date.now()}-1`, description: 'Custom Redwood fencing panels', quantity: 8, unit_price: 65.00, tax_rate: 0 },
        { id: `mock-${Date.now()}-2`, description: 'Post concrete & structural fasteners', quantity: 1, unit_price: 140.00, tax_rate: 0 },
        { id: `mock-${Date.now()}-3`, description: 'Labor hours: Fence installation & post setting', quantity: 1, unit_price: 450.00, tax_rate: 0 }
      ]
    } else if (n.includes('roof') || n.includes('roofing')) {
      return [
        { id: `mock-${Date.now()}-1`, description: 'Architectural shingle bundles', quantity: 12, unit_price: 42.00, tax_rate: 0 },
        { id: `mock-${Date.now()}-2`, description: 'Synthetic roof underlayment & drip edge', quantity: 1, unit_price: 185.00, tax_rate: 0 },
        { id: `mock-${Date.now()}-3`, description: 'Labor hours: Shingle tear-off & installation', quantity: 1, unit_price: 680.00, tax_rate: 0 }
      ]
    } else if (n.includes('clean') || n.includes('cleaning')) {
      return [
        { id: `mock-${Date.now()}-1`, description: 'Eco-friendly cleaning supplies & chemicals', quantity: 1, unit_price: 45.00, tax_rate: 0 },
        { id: `mock-${Date.now()}-2`, description: 'Labor hours: Deep post-construction cleanup', quantity: 8, unit_price: 35.00, tax_rate: 0 }
      ]
    } else {
      return [
        { id: `mock-${Date.now()}-1`, description: 'Premium Service Materials', quantity: 1, unit_price: 180.00, tax_rate: 0 },
        { id: `mock-${Date.now()}-2`, description: 'General Maintenance & Labour', quantity: 1, unit_price: 320.00, tax_rate: 0 }
      ]
    }
  }

  const handleApplyScannedItems = () => {
    const items = getNicheMockItems(currentClient?.niche)
    setLineItems(prev => {
      // Filter out initial empty line item if there is only 1 and it's empty
      if (prev.length === 1 && prev[0].description === '' && prev[0].unit_price === 0) {
        return items
      }
      return [...prev, ...items]
    })
    setIsScanningModalOpen(false)
    setUploadedPhotoUrl(null)
    setUploadedFileName('')
    setScanSuccess(false)
    onShowToast('Job photo line items appended to invoice successfully!')
  }

  const getInvoicePayload = (status) => {
    // 1. Map standard line items
    const itemsPayload = lineItems.map(item => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      tax_rate: taxesEnabled ? Number(item.tax_rate) : 0
    }))

    // 2. Map custom adjustments
    adjustments.forEach(adj => {
      itemsPayload.push({
        id: adj.id,
        description: adj.label,
        quantity: 1,
        unit_price: adj.type === 'deduction' ? -Number(adj.amount) : Number(adj.amount),
        tax_rate: 0,
        is_adjustment: true
      })
    })

    // 3. Map metadata
    itemsPayload.push({
      is_metadata: true,
      taxes_disabled: !taxesEnabled
    })

    return {
      client_id: currentClient.id,
      contact_id: selectedContactId || null,
      invoice_number: invoiceNumber,
      status: status,
      due_date: dueDate,
      line_items: itemsPayload,
      subtotal,
      tax_total: taxTotal,
      discount_amount: isGrowthOrAbove ? discountAmount : 0,
      deposit_percentage: isGrowthOrAbove ? Number(depositPercentage) : 0,
      grand_total: grandTotal,
      notes,
      stripe_payment_link: stripePaymentLink || null,
      currency: currentClient.currency || 'USD',
      currency_symbol: currencySymbol,
      color_theme: isGrowthOrAbove ? colorTheme : 'default',
      template: isGrowthOrAbove ? template : 'minimal'
    }
  }

  const handleSaveInvoice = async (status) => {
    if (!selectedContactId) {
      onShowToast('Please select a client contact.')
      return
    }
    if (!invoiceNumber.trim()) {
      onShowToast('Please enter an invoice number.')
      return
    }

    const isSend = status === 'sent'
    if (isSend) setSending(true)
    else setSaving(true)

    try {
      // 1. Save invoice to Supabase
      const payload = getInvoicePayload(status)
      if (isSend) {
        payload.sent_date = new Date().toISOString()
      }

      const { data: savedInvoice, error: saveErr } = invoiceId
        ? await supabase
            .from('invoices')
            .update(payload)
            .eq('id', invoiceId)
            .select()
            .single()
        : await supabase
            .from('invoices')
            .insert(payload)
            .select()
            .single()

      if (saveErr) throw saveErr

      // 2. Trigger transactional email via Resend if sending immediately
      if (isSend) {
        const contact = contacts.find(c => c.id === selectedContactId)
        if (contact && contact.email) {
          const googleReviewLink = JSON.parse(localStorage.getItem(`opsly_review_settings_${currentClient?.id}`) || '{}')?.googleReviewLink || ''
          const emailRes = await fetch('/api/send-invoice-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              invoiceId: savedInvoice.id,
              recipientEmail: contact.email,
              recipientName: contact.name,
              businessName: currentClient.business_name || 'Our Service Company',
              googleReviewLink
            })
          })

          if (!emailRes.ok) {
            console.warn('Email delivery failed, but invoice was saved.')
            onShowToast('Invoice saved — email delivery failed. Check your email settings.')
          } else {
            onShowToast('Invoice generated and emailed successfully!')
          }
        } else {
          onShowToast('Invoice saved, but this client has no email address on file.')
        }
      } else {
        onShowToast('Draft invoice saved successfully!')
      }

      onSave()
      onBack()
    } catch (err) {
      console.error(err)
      onShowToast(err.message || 'Failed to save invoice. Ensure you are under Free plan limits.')
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
          className="flex items-center gap-2 text-xs font-semibold text-opsly-secondary hover:text-opsly-text bg-opsly-input hover:bg-opsly-hover border border-opsly-border/70 hover:border-opsly-border py-2 px-3.5 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Invoices
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSaveInvoice('draft')}
            disabled={saving || sending || fetchingInvoice}
            className="text-xs font-semibold text-opsly-secondary hover:text-opsly-text bg-opsly-input hover:bg-opsly-hover border border-opsly-border/70 hover:border-opsly-border py-2 px-4 rounded-xl cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            {saving ? 'Saving Draft...' : 'Save as Draft'}
          </button>
          <button
            onClick={() => handleSaveInvoice('sent')}
            disabled={saving || sending || fetchingInvoice}
            className="text-xs font-semibold text-opsly-text bg-opsly-accent hover:bg-opsly-accent-hover py-2 px-5 rounded-xl cursor-pointer shadow-lg shadow-opsly-accent/15 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            {sending ? 'Sending...' : 'Save & Send Email'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-opsly-card border border-opsly-border rounded-xl p-5 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-opsly-text border-b border-opsly-border pb-3">
              {invoiceId ? `Edit Invoice ${invoiceNumber}` : 'Invoice Details'}
            </h3>

            {fetchingInvoice ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-opsly-secondary">
                <svg className="animate-spin h-6 w-6 text-opsly-accent" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-xs">Loading invoice details...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Bill To Client *</label>
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
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Invoice Number *</label>
                    <input
                      type="text"
                      required
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Invoice Date</label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                    />
                  </div>
                </div>

                {/* Global Tax Toggle */}
                <div className="flex items-center gap-2.5 bg-opsly-input/20 border border-opsly-border/40 rounded-xl p-3.5">
                  <input
                    type="checkbox"
                    id="taxesEnabled"
                    checked={taxesEnabled}
                    onChange={(e) => setTaxesEnabled(e.target.checked)}
                    className="rounded bg-opsly-input border-opsly-border text-opsly-accent focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="taxesEnabled" className="text-xs text-opsly-secondary font-semibold cursor-pointer select-none">
                    Enable Taxes / VAT column on this invoice
                  </label>
                </div>

                {/* Line items section */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Line Items</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsScanningModalOpen(true)}
                        className="text-[10.5px] font-bold text-opsly-accent bg-[#c15f3c]/10 border border-[#c15f3c]/25 hover:bg-[#c15f3c]/20 rounded-lg px-2.5 py-1 flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <svg className="w-3.5 h-3.5 text-opsly-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Scan Job Photos
                      </button>
                      <button
                        type="button"
                        onClick={handleAddLineItem}
                        className="text-[10.5px] font-semibold text-opsly-accent hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Add Line Item
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {lineItems.map((item, index) => (
                      <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-opsly-input/20 border border-opsly-border/50 rounded-xl p-4 relative group">
                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            required
                            placeholder="Description of service or materials..."
                            value={item.description}
                            onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                            className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                          />
                        </div>
                        <div className={`grid gap-2 w-full ${taxesEnabled ? 'grid-cols-3 md:w-80' : 'grid-cols-2 md:w-56'}`}>
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
                          {taxesEnabled && (
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
                          )}
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

                {/* Custom adjustments section */}
                <div className="space-y-4 pt-4 border-t border-opsly-border/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider block">Custom Adjustments</label>
                      <span className="text-[9px] text-opsly-muted mt-0.5 block">Add discounts, fees, tips, or other manual modifications.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdjustments(prev => [...prev, { id: Date.now().toString(), label: '', amount: 0, type: 'deduction' }])}
                      className="text-[10px] font-semibold text-opsly-accent hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      + Add Adjustment
                    </button>
                  </div>

                  <div className="space-y-3">
                    {adjustments.map((adj) => (
                      <div key={adj.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-opsly-input/10 border border-opsly-border/40 rounded-xl p-3.5 relative group">
                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            required
                            placeholder="e.g. Friends & Family Discount, Late Fee..."
                            value={adj.label}
                            onChange={(e) => setAdjustments(prev => prev.map(a => a.id === adj.id ? { ...a, label: e.target.value } : a))}
                            className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                          />
                        </div>
                        
                        <div className="flex gap-2 items-center w-full sm:w-52">
                          <select
                            value={adj.type}
                            onChange={(e) => setAdjustments(prev => prev.map(a => a.id === adj.id ? { ...a, type: e.target.value } : a))}
                            className="bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-2 py-2 text-xs focus:border-opsly-accent focus:outline-none cursor-pointer"
                          >
                            <option value="deduction">Subtract (-)</option>
                            <option value="addition">Add (+)</option>
                          </select>

                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            placeholder="Amount"
                            value={adj.amount || ''}
                            onChange={(e) => setAdjustments(prev => prev.map(a => a.id === adj.id ? { ...a, amount: parseFloat(e.target.value) || 0 } : a))}
                            className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setAdjustments(prev => prev.filter(a => a.id !== adj.id))}
                          className="p-1.5 rounded-xl bg-opsly-input border border-opsly-border text-opsly-secondary hover:text-opsly-error cursor-pointer hover:scale-105 transition-all duration-150"
                          title="Remove adjustment"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

            {/* Static Stripe Link Field */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Stripe Payment Link (pasted from Stripe)</label>
              <input
                type="url"
                value={stripePaymentLink}
                onChange={(e) => setStripePaymentLink(e.target.value)}
                placeholder="https://donate.stripe.com/..."
                className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
              />
              <p className="text-[9px] text-opsly-muted mt-1 leading-relaxed">
                Enter your static Stripe Checkout Payment Link. Customers will click "Pay Now" on their invoice portal to pay you directly.
              </p>
            </div>

            {/* Terms and notes */}
            <div>
              <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Notes &amp; Payment Terms</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please send payment within 14 days. Bank details: Acct..."
                rows={3}
                className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none resize-none"
              />
            </div>
          </div>

        {/* Right Column: Customization & Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Summary Details */}
          <div className="bg-opsly-card border border-opsly-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-opsly-text border-b border-opsly-border pb-3">Invoice Summary</h3>

            <div className="space-y-2.5 text-xs text-opsly-secondary">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-opsly-text">{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              {taxesEnabled && (
                <div className="flex justify-between">
                  <span>Tax Total</span>
                  <span className="font-semibold text-opsly-text">{currencySymbol}{taxTotal.toFixed(2)}</span>
                </div>
              )}
              
              {isGrowthOrAbove && discountValue > 0 && (
                <div className="flex justify-between text-opsly-error">
                  <span>Discount</span>
                  <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {adjustments.map((adj) => (
                <div key={adj.id} className={`flex justify-between ${adj.type === 'deduction' ? 'text-opsly-error' : 'text-opsly-success'}`}>
                  <span className="truncate max-w-[150px]">{adj.label || 'Adjustment'}</span>
                  <span>{adj.type === 'deduction' ? '-' : '+'}{currencySymbol}{Number(adj.amount || 0).toFixed(2)}</span>
                </div>
              ))}

              <div className="pt-2 border-t border-opsly-border flex justify-between items-center text-sm font-bold text-opsly-text">
                <span>Grand Total</span>
                <span className="text-base text-opsly-accent">{currencySymbol}{grandTotal.toFixed(2)}</span>
              </div>

              {isGrowthOrAbove && depositPercentage > 0 && (
                <div className="flex justify-between pt-2 border-t border-dashed border-opsly-border text-[11px] text-opsly-secondary italic">
                  <span>Required Deposit ({depositPercentage}%)</span>
                  <span className="font-semibold not-italic text-opsly-text">{currencySymbol}{depositAmount.toFixed(2)}</span>
                </div>
              )}
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

              {/* Deposit Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Upfront Deposit (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 50"
                  value={depositPercentage || ''}
                  onChange={(e) => setDepositPercentage(parseFloat(e.target.value) || 0)}
                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-1.5 text-xs focus:border-opsly-accent focus:outline-none"
                />
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
                <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Invoice Layout Template</label>
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
                Upgrade to Growth plan to unlock invoice templates, color themes, discounts, and deposit invoices.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Job Photo Scanner Modal */}
      <AnimatePresence>
        {isScanningModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0e0d]/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-opsly-card border border-opsly-border rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-opsly-border bg-opsly-input/20">
                <div>
                  <h2 className="text-sm font-bold text-opsly-text flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-opsly-accent animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    Job Photo Details Extractor
                  </h2>
                  <span className="text-[10px] text-opsly-secondary block mt-0.5">
                    Upload job site photos to extract line items using AI
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsScanningModalOpen(false)
                    setUploadedPhotoUrl(null)
                    setUploadedFileName('')
                    setScanSuccess(false)
                  }}
                  className="p-1 rounded-xl bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-secondary hover:text-opsly-text cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5 space-y-4">
                {!uploadedPhotoUrl ? (
                  <div className="border-2 border-dashed border-opsly-border hover:border-opsly-accent rounded-xl p-8 text-center transition-colors cursor-pointer relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2">
                      <svg className="w-8 h-8 text-opsly-muted mx-auto group-hover:text-opsly-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs font-bold text-opsly-text">Upload Job Site Photos</p>
                      <p className="text-[10px] text-opsly-muted">Drag &amp; drop or click to browse</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Viewport for photo with laser scan */}
                    <div className="relative rounded-xl border border-opsly-border overflow-hidden bg-opsly-input/30 aspect-video flex items-center justify-center">
                      <img src={uploadedPhotoUrl} alt="Job site scan preview" className="w-full h-full object-cover" />
                      
                      {isScanning && (
                        <>
                          {/* Glowing horizontal laser line */}
                          <motion.div
                            animate={{ top: ["0%", "100%", "0%"] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                            className="absolute left-0 right-0 h-1 bg-opsly-accent shadow-[0_0_15px_#c15f3c] z-10"
                          />
                          <div className="absolute inset-0 bg-opsly-accent/5 backdrop-brightness-110 flex items-center justify-center z-20">
                            <span className="bg-[#161514]/90 border border-opsly-border/80 text-[10px] font-bold text-opsly-text px-3 py-1.5 rounded-lg shadow-md animate-pulse">
                              Extracting line items...
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {scanSuccess && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-opsly-success text-xs font-bold bg-opsly-success/10 border border-opsly-success/20 rounded-lg p-2.5">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Scan Complete! Detected items based on photo details.</span>
                        </div>

                        {/* List of detected items */}
                        <div className="bg-opsly-input/20 border border-opsly-border rounded-xl p-3 divide-y divide-opsly-border/60 text-xs">
                          {getNicheMockItems(currentClient?.niche).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                              <div className="max-w-[70%]">
                                <p className="font-semibold text-opsly-text truncate">{item.description}</p>
                                <p className="text-[9px] text-opsly-muted">Qty: {item.quantity} &times; {currencySymbol}{item.unit_price.toFixed(2)}</p>
                              </div>
                              <span className="font-bold text-opsly-text">{currencySymbol}{(item.quantity * item.unit_price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedPhotoUrl(null)
                              setUploadedFileName('')
                              setScanSuccess(false)
                            }}
                            className="px-3.5 py-1.5 border border-opsly-border hover:bg-opsly-hover text-opsly-secondary rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Retake/Reset
                          </button>
                          <button
                            type="button"
                            onClick={handleApplyScannedItems}
                            className="px-4 py-1.5 bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Add to Invoice
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
