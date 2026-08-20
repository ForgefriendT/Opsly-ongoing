import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'

export default function ContactProfile({ contact, onBack, onUpdate, currentPlan, currentNicheConfig, onShowToast, onCreateJob, onCreateInvoice }) {
  const [activeSubTab, setActiveSubTab] = useState('timeline')
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [invoices, setInvoices] = useState([])
  const [documents, setDocuments] = useState([])
  const [smsMessages, setSmsMessages] = useState([])
  const [timeline, setTimeline] = useState([])
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: contact.name,
    email: contact.email || '',
    phone: contact.phone || '',
    address: contact.address || '',
    notes: contact.notes || '',
    status: contact.status || 'active'
  })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isFree = currentPlan === 'free'

  const overrideText = (defaultText, key) => {
    return currentNicheConfig?.terminology_overrides?.[key] || defaultText
  }

  // Fetch associated timeline data
  useEffect(() => {
    const fetchTimelineData = async () => {
      setLoading(true)
      try {
        const [jobsRes, invoicesRes, docsRes, smsRes] = await Promise.all([
          supabase.from('jobs').select('*').eq('contact_id', contact.id),
          supabase.from('invoices').select('*').eq('contact_id', contact.id),
          supabase.from('documents').select('*').eq('contact_id', contact.id),
          supabase.from('sms_messages').select('*').eq('contact_id', contact.id)
        ])

        const fetchedJobs = jobsRes.data || []
        const fetchedInvoices = invoicesRes.data || []
        const fetchedDocs = docsRes.data || []
        const fetchedSms = smsRes.data || []

        setJobs(fetchedJobs)
        setInvoices(fetchedInvoices)
        setDocuments(fetchedDocs)
        setSmsMessages(fetchedSms)

        // Aggregate into a single chronological timeline (newest first)
        const events = []

        // 1. Jobs events
        fetchedJobs.forEach(job => {
          events.push({
            id: `job-sched-${job.id}`,
            date: job.start_date || job.created_at,
            type: 'job',
            title: `Job Scheduled`,
            description: `"${job.title}" scheduled for ${formatDate(job.start_date)}`,
            status: job.status
          })
          if (job.status === 'completed') {
            events.push({
              id: `job-comp-${job.id}`,
              date: job.updated_at || job.start_date,
              type: 'job_completed',
              title: `Job Completed`,
              description: `"${job.title}" marked as completed`,
              status: 'completed'
            })
          }
        })

        // 2. Invoices events
        fetchedInvoices.forEach(inv => {
          events.push({
            id: `inv-creat-${inv.id}`,
            date: inv.created_at,
            type: 'invoice',
            title: `Invoice Created`,
            description: `Invoice #${inv.invoice_number} of $${inv.grand_total} generated`,
            status: inv.status
          })
          if (inv.sent_date) {
            events.push({
              id: `inv-sent-${inv.id}`,
              date: inv.sent_date,
              type: 'invoice_sent',
              title: `Invoice Sent`,
              description: `Invoice #${inv.invoice_number} sent to client`,
              status: 'sent'
            })
          }
          if (inv.paid_date) {
            events.push({
              id: `inv-paid-${inv.id}`,
              date: inv.paid_date,
              type: 'invoice_paid',
              title: `Invoice Paid`,
              description: `Invoice #${inv.invoice_number} marked as Paid`,
              status: 'paid'
            })
          }
        })

        // 3. Documents events
        fetchedDocs.forEach(doc => {
          events.push({
            id: `doc-creat-${doc.id}`,
            date: doc.created_at,
            type: 'document',
            title: `Document Uploaded`,
            description: `"${doc.title}" (${doc.type || 'Contract'}) created`,
            status: doc.signed_status ? 'signed' : 'unsigned'
          })
          if (doc.signed_status && doc.signed_date) {
            events.push({
              id: `doc-sign-${doc.id}`,
              date: doc.signed_date,
              type: 'document_signed',
              title: `Document Signed`,
              description: `"${doc.title}" signed by ${doc.signee_name || 'client'}`,
              status: 'signed'
            })
          }
        })

        // 4. SMS events
        fetchedSms.forEach(sms => {
          events.push({
            id: `sms-${sms.id}`,
            date: sms.created_at,
            type: 'sms',
            title: sms.direction === 'outbound' ? 'SMS Sent' : 'SMS Received',
            description: sms.body,
            direction: sms.direction
          })
        })

        // Sort events date descending
        events.sort((a, b) => new Date(b.date) - new Date(a.date))
        setTimeline(events)

      } catch (err) {
        console.error('Error fetching timeline data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTimelineData()
  }, [contact.id])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (isFree) {
      onShowToast('Free plan contacts cannot be modified.')
      return
    }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update({
          name: editForm.name,
          email: editForm.email || null,
          phone: editForm.phone || null,
          address: editForm.address || null,
          notes: editForm.notes || null,
          status: editForm.status
        })
        .eq('id', contact.id)
        .select()
        .single()

      if (error) throw error

      onUpdate(data)
      setIsEditing(false)
      onShowToast('Contact details updated successfully!')
    } catch (err) {
      console.error(err)
      onShowToast(err.message || 'Failed to update contact.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (isFree) {
      onShowToast('Free plan contacts cannot be deleted.')
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id)

      if (error) throw error

      onShowToast('Contact deleted successfully.')
      onBack() // Back to list
    } catch (err) {
      console.error(err)
      onShowToast(err.message || 'Failed to delete contact.')
    } finally {
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-opsly-success bg-opsly-success/10 border-opsly-success/20'
      case 'lead':
        return 'text-opsly-accent bg-opsly-accent-soft border-opsly-accent/20'
      case 'dormant':
        return 'text-opsly-muted bg-opsly-input border-opsly-border'
      default:
        return 'text-opsly-secondary bg-opsly-input border-opsly-border'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-opsly-secondary hover:text-opsly-text bg-opsly-input hover:bg-opsly-hover border border-opsly-border py-2 px-3.5 rounded-lg w-max cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {overrideText('Clients', 'contacts')}
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onCreateJob?.(contact)}
            className="text-xs font-semibold text-white bg-[#c15f3c] hover:bg-[#a95232] py-2 px-3.5 rounded-lg cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule {overrideText('Job', 'job')}
          </button>
          <button
            onClick={() => onCreateInvoice?.(contact)}
            className="text-xs font-semibold text-opsly-text bg-opsly-input hover:bg-opsly-hover border border-opsly-border py-2 px-3.5 rounded-lg cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Create Invoice
          </button>

          {isFree ? (
            <div className="flex items-center gap-2 text-[11px] text-opsly-warning bg-opsly-warning/10 border border-opsly-warning/20 px-3.5 py-2 rounded-lg font-medium">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Contacts are permanent on Free plan</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-semibold text-opsly-text bg-opsly-input hover:bg-opsly-hover border border-opsly-border py-2 px-4 rounded-lg cursor-pointer"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Details'}
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="text-xs font-semibold text-opsly-error bg-opsly-error/10 hover:bg-opsly-error/20 border border-opsly-error/20 py-2 px-4 rounded-lg cursor-pointer"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-opsly-card border border-opsly-border rounded-xl p-5 shadow-sm space-y-5">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="lead">Lead</option>
                    <option value="dormant">Dormant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2 bg-opsly-accent hover:bg-opsly-accent-hover disabled:bg-opsly-accent/40 text-opsly-text text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="text-center pb-4 border-b border-opsly-border">
                  <div className="w-16 h-16 rounded-full bg-opsly-input border border-opsly-border flex items-center justify-center font-bold text-opsly-accent text-2xl mx-auto mb-3">
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h2 className="text-base font-bold text-opsly-text">{contact.name}</h2>
                  <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider mt-2 ${getStatusColor(contact.status)}`}>
                    {contact.status || 'Active'}
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <span className="block text-[9px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Email</span>
                    <span className="text-xs text-opsly-text break-all">{contact.email || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Phone</span>
                    <span className="text-xs text-opsly-text">{contact.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Address</span>
                    <span className="text-xs text-opsly-text leading-relaxed block">{contact.address || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Notes</span>
                    <span className="text-xs text-opsly-secondary leading-relaxed whitespace-pre-wrap block bg-opsly-input/35 border border-opsly-border/45 rounded-lg p-3">
                      {contact.notes || 'No notes added yet.'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-opsly-border/50 flex justify-between items-center text-[10px] text-opsly-muted">
                    <span>Added: {formatDate(contact.created_at)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: History & Timeline Tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sub-tab Navigation */}
          <div className="flex gap-1.5 border-b border-opsly-border pb-px overflow-x-auto">
            {[
              { id: 'timeline', label: 'Overview & Timeline' },
              { id: 'jobs', label: overrideText('Jobs', 'jobs') },
              { id: 'invoices', label: 'Invoices' },
              { id: 'documents', label: 'Documents' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`py-2 px-4 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  activeSubTab === tab.id
                    ? 'border-opsly-accent text-opsly-text'
                    : 'border-transparent text-opsly-secondary hover:text-opsly-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-opsly-muted space-y-3">
                <svg className="animate-spin h-6 w-6 text-opsly-accent" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-xs">Loading records...</span>
              </div>
            ) : (
              <div>
                {/* TIMELINE TAB */}
                {activeSubTab === 'timeline' && (
                  <div className="space-y-4">
                    {timeline.length === 0 ? (
                      <div className="bg-opsly-card border border-opsly-border rounded-xl p-8 text-center text-xs text-opsly-secondary leading-relaxed">
                        No activity records found for this contact.
                      </div>
                    ) : (
                      <div className="relative border-l border-opsly-border ml-3 pl-6 space-y-5 py-2">
                        {timeline.map((evt) => (
                          <div key={evt.id} className="relative group">
                            {/* Point Bullet */}
                            <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full bg-opsly-border group-hover:bg-opsly-accent transition-colors duration-200" />
                            
                            <div className="bg-opsly-card border border-opsly-border rounded-xl p-4 shadow-sm hover:border-opsly-border/70 transition-all">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-opsly-text">{evt.title}</span>
                                    {evt.status && (
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wider ${
                                        evt.status === 'completed' || evt.status === 'paid' || evt.status === 'signed'
                                          ? 'text-opsly-success bg-opsly-success/5 border-opsly-success/15'
                                          : 'text-opsly-accent bg-opsly-accent-soft border-opsly-accent/15'
                                      }`}>
                                        {evt.status}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-opsly-secondary mt-1 leading-relaxed">{evt.description}</p>
                                </div>
                                <span className="text-[10px] text-opsly-muted whitespace-nowrap">{formatDate(evt.date)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* JOBS TAB */}
                {activeSubTab === 'jobs' && (
                  <div className="space-y-4">
                    {jobs.length === 0 ? (
                      <div className="bg-opsly-card border border-opsly-border rounded-xl p-8 text-center text-xs text-opsly-secondary leading-relaxed">
                        No {overrideText('jobs', 'jobs').toLowerCase()} scheduled for this contact.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {jobs.map(job => (
                          <div key={job.id} className="bg-opsly-card border border-opsly-border rounded-xl p-4 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-opsly-text truncate max-w-[70%]">{job.title}</h4>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                                job.status === 'completed'
                                  ? 'text-opsly-success bg-opsly-success/10 border-opsly-success/20'
                                  : 'text-opsly-accent bg-opsly-accent-soft border-opsly-accent/20'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-opsly-secondary line-clamp-2 leading-relaxed">{job.description || 'No description provided.'}</p>
                            <div className="pt-2.5 border-t border-opsly-border/50 text-[10px] text-opsly-muted space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Start: {formatDate(job.start_date)}</span>
                              </div>
                              {job.address && (
                                <div className="flex items-center gap-1.5">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="truncate">{job.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* INVOICES TAB */}
                {activeSubTab === 'invoices' && (
                  <div className="space-y-4">
                    {invoices.length === 0 ? (
                      <div className="bg-opsly-card border border-opsly-border rounded-xl p-8 text-center text-xs text-opsly-secondary leading-relaxed">
                        No invoices generated for this contact.
                      </div>
                    ) : (
                      <div className="bg-opsly-card border border-opsly-border rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-opsly-input/30 border-b border-opsly-border text-opsly-secondary font-semibold">
                              <th className="p-3">Invoice #</th>
                              <th className="p-3">Due Date</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-opsly-border text-opsly-text">
                            {invoices.map(inv => (
                              <tr key={inv.id} className="hover:bg-opsly-input/10">
                                <td className="p-3 font-semibold">{inv.invoice_number}</td>
                                <td className="p-3 text-opsly-secondary">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                                <td className="p-3">
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                                    inv.status === 'paid'
                                      ? 'text-opsly-success bg-opsly-success/10 border-opsly-success/20'
                                      : 'text-opsly-accent bg-opsly-accent-soft border-opsly-accent/20'
                                  }`}>
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="p-3 font-bold text-right text-opsly-text">${Number(inv.grand_total || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* DOCUMENTS TAB */}
                {activeSubTab === 'documents' && (
                  <div className="space-y-4">
                    {documents.length === 0 ? (
                      <div className="bg-opsly-card border border-opsly-border rounded-xl p-8 text-center text-xs text-opsly-secondary leading-relaxed">
                        No documents uploaded for this contact.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map(doc => (
                          <div key={doc.id} className="bg-opsly-card border border-opsly-border rounded-xl p-4 shadow-sm flex flex-col justify-between min-h-[120px]">
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className="text-xs font-bold text-opsly-text truncate max-w-[75%]">{doc.title}</h4>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                                  doc.signed_status
                                    ? 'text-opsly-success bg-opsly-success/10 border-opsly-success/20'
                                    : 'text-opsly-accent bg-opsly-accent-soft border-opsly-accent/20'
                                }`}>
                                  {doc.signed_status ? 'Signed' : 'Pending'}
                                </span>
                              </div>
                              <p className="text-[10px] text-opsly-secondary mt-1">Type: {doc.type || 'Agreement'}</p>
                            </div>
                            <div className="pt-3 border-t border-opsly-border/50 flex justify-between items-center text-[10px] text-opsly-muted">
                              <span>Added: {new Date(doc.created_at).toLocaleDateString()}</span>
                              {doc.file_url && (
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-opsly-accent hover:underline font-semibold cursor-pointer"
                                >
                                  View File
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-opsly-card border border-opsly-border rounded-xl w-full max-w-sm p-5 relative shadow-2xl z-10 space-y-4"
            >
              <h3 className="text-sm font-bold text-opsly-text">Delete Contact?</h3>
              <p className="text-xs text-opsly-secondary leading-relaxed">
                Are you sure you want to permanently delete <span className="font-semibold text-opsly-text">{contact.name}</span>? This action cannot be undone and will unlink history records.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 border border-opsly-border hover:bg-opsly-hover text-opsly-secondary rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-5 py-2 bg-opsly-error hover:bg-opsly-error-hover disabled:bg-opsly-error/40 text-opsly-text rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
