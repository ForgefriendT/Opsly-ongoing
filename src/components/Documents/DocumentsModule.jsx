import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'

export default function DocumentsModule({ currentPlan, currentClient, onShowUpgradeModal, onShowToast }) {
  const isGrowthOrAbove = currentPlan !== 'free' && currentPlan !== 'starter'
  const clientId = currentClient?.id
  const currencySymbol = currentClient?.currency_symbol || '$'

  const [documents, setDocuments] = useState([])
  const [contacts, setContacts] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewDoc, setPreviewDoc] = useState(null)

  // Sub tabs: 'list' | 'templates' | 'upload'
  const [subTab, setSubTab] = useState('list')
  const [filterType, setFilterType] = useState('all')

  // Builder form states
  const [builderOpen, setBuilderOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [docTitle, setDocTitle] = useState('')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [selectedJobId, setSelectedJobId] = useState('')
  const [scopeDetails, setScopeDetails] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('50% upfront deposit, 50% upon completion.')
  const [liabilityClause, setLiabilityClause] = useState('Provider is not liable for structural changes pre-dating the project scope.')
  const [expiryDate, setExpiryDate] = useState('')

  // Upload states
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadType, setUploadType] = useState('client_contract')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadContactId, setUploadContactId] = useState('')
  const [uploadExpiry, setUploadExpiry] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Change order states
  const [coOpen, setCoOpen] = useState(false)
  const [coJobId, setCoJobId] = useState('')
  const [coDescription, setCoDescription] = useState('')
  const [coCost, setCoCost] = useState('')
  const [coReason, setCoReason] = useState('')

  const templatesList = [
    { id: 'roofing', name: 'Roofing Contract', type: 'client_contract', text: 'Standard agreement for roof repair and material guarantees.' },
    { id: 'painting', name: 'Painting Agreement', type: 'client_contract', text: 'Agreement detailing layers of coat, paint brands, and area metrics.' },
    { id: 'landscaping', name: 'Landscaping Design Contract', type: 'client_contract', text: 'Service scope for sodding, planting, and seasonal upkeep.' },
    { id: 'cleaning', name: 'Commercial Cleaning Scope', type: 'client_contract', text: 'Standard bi-weekly clean checklist and workspace liabilities.' },
    { id: 'hvac', name: 'HVAC Maintenance Scope', type: 'client_contract', text: 'HVAC parts warranty and standard inspection checklist.' }
  ]

  useEffect(() => {
    if (!clientId) return
    fetchInitialData()
  }, [clientId])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [docsRes, contactsRes, jobsRes] = await Promise.all([
        supabase.from('documents').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('contacts').select('id, name').eq('client_id', clientId),
        supabase.from('jobs').select('id, title').eq('client_id', clientId)
      ])

      if (docsRes.data) setDocuments(docsRes.data)
      if (contactsRes.data) setContacts(contactsRes.data)
      if (jobsRes.data) setJobs(jobsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl)
    setDocTitle(tpl.name)
    setScopeDetails(`Scope details for ${tpl.name}. Include specific materials, tools, and labor breakdown.`)
    setBuilderOpen(true)
  }

  const handleSaveDocument = async (e) => {
    e.preventDefault()
    if (!docTitle) return

    try {
      const payload = {
        client_id: clientId,
        title: docTitle,
        type: selectedTemplate ? selectedTemplate.type : 'client_contract',
        contact_id: selectedContactId || null,
        job_id: selectedJobId || null,
        expiry_date: expiryDate || null,
        signed_status: false,
        file_url: `https://opsly.com/portal/shared-doc-${Math.floor(Math.random() * 100000)}.pdf`
      }

      const { error } = await supabase.from('documents').insert(payload)
      if (error) throw error

      onShowToast?.('Document generated and saved successfully!')
      setBuilderOpen(false)
      setSelectedTemplate(null)
      setDocTitle('')
      setSelectedContactId('')
      setSelectedJobId('')
      setExpiryDate('')
      fetchInitialData()
    } catch (err) {
      console.error(err)
      onShowToast?.('Could not create document.')
    }
  }

  const handleManualUpload = async (e) => {
    e.preventDefault()
    if (!uploadTitle || !uploadFile) return

    setIsUploading(true)
    try {
      const fileUrl = `https://kqyxhnnouwdbwbmwbohl.supabase.co/storage/v1/object/public/documents/${clientId}/${Date.now()}_${uploadFile.name}`
      
      const payload = {
        client_id: clientId,
        title: uploadTitle,
        type: uploadType,
        contact_id: uploadContactId || null,
        expiry_date: uploadExpiry || null,
        signed_status: true,
        signed_date: new Date().toISOString(),
        file_url: fileUrl
      }

      const { error } = await supabase.from('documents').insert(payload)
      if (error) throw error

      onShowToast?.('Contract uploaded and registered successfully!')
      setUploadTitle('')
      setUploadFile(null)
      setUploadContactId('')
      setUploadExpiry('')
      setSubTab('list')
      fetchInitialData()
    } catch (err) {
      console.error(err)
      onShowToast?.('Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreateChangeOrder = async (e) => {
    e.preventDefault()
    if (!coJobId || !coDescription || !coCost) return

    try {
      const payload = {
        client_id: clientId,
        job_id: coJobId,
        title: `Change Order: ${coReason || 'Additional Scope'}`,
        type: 'change_order',
        signed_status: false,
        file_url: `https://opsly.com/change-order-${Date.now()}.pdf`,
        expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0]
      }

      const { error } = await supabase.from('documents').insert(payload)
      if (error) throw error

      onShowToast?.(`Change Order for ${currencySymbol}${coCost} added successfully!`)
      setCoJobId('')
      setCoDescription('')
      setCoCost('')
      setCoReason('')
      setCoOpen(false)
      fetchInitialData()
    } catch (err) {
      console.error(err)
      onShowToast?.('Failed to submit change order.')
    }
  }

  const handleToggleSign = async (docId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          signed_status: !currentStatus,
          signed_date: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', docId)

      if (error) throw error
      onShowToast?.(`Signature status marked as ${!currentStatus ? 'Signed' : 'Unsigned'}.`)
      fetchInitialData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteDoc = async (id) => {
    try {
      const { error } = await supabase.from('documents').delete().eq('id', id)
      if (error) throw error
      onShowToast?.('Document deleted.')
      fetchInitialData()
    } catch (err) {
      console.error(err)
    }
  }

  const checkExpiryStatus = (expiryStr) => {
    if (!expiryStr) return 'active'
    const today = new Date()
    const exp = new Date(expiryStr)
    const diff = exp.getTime() - today.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (days < 0) return 'expired'
    if (days <= 30) return 'warning'
    return 'active'
  }

  if (!isGrowthOrAbove) {
    return (
      <div className="bg-opsly-card border border-opsly-border rounded-2xl p-12 text-center flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#c15f3c]/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#c15f3c]/5 blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-full bg-[#c15f3c]/15 flex items-center justify-center mb-6 text-[#c15f3c] border border-[#c15f3c]/20">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-opsly-text">Documents Module Locked</h2>
        <p className="text-xs text-opsly-secondary max-w-sm mt-2 leading-relaxed">
          Create service contracts, change orders, warranty certificates, and manage manual file uploads under the **Growth and Pro plans**.
        </p>

        <button
          onClick={() => onShowUpgradeModal('growth')}
          className="mt-6 bg-[#c15f3c] hover:bg-[#a95232] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#c15f3c]/15"
        >
          View Upgrade Options
        </button>
      </div>
    )
  }

  const filteredDocs = filterType === 'all' ? documents : documents.filter(d => d.type === filterType)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-opsly-text tracking-tight">Documents &amp; Contracts</h1>
          <p className="text-xs text-opsly-secondary mt-1">Manage, build, and verify service contracts, change orders, and warranty templates.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setCoOpen(true)}
            className="flex-1 sm:flex-none border border-opsly-border bg-opsly-input hover:bg-opsly-hover text-opsly-text px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Create Change Order
          </button>
          <button
            onClick={() => setSubTab('templates')}
            className="flex-1 sm:flex-none bg-[#c15f3c] hover:bg-[#a95232] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            New Document Template
          </button>
        </div>
      </div>

      <div className="flex border-b border-opsly-border/70 pb-px gap-2">
        <button
          onClick={() => setSubTab('list')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            subTab === 'list' ? 'border-[#c15f3c] text-opsly-text font-bold' : 'border-transparent text-opsly-secondary hover:text-opsly-text'
          }`}
        >
          All Active Documents
        </button>
        <button
          onClick={() => setSubTab('templates')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            subTab === 'templates' ? 'border-[#c15f3c] text-opsly-text font-bold' : 'border-transparent text-opsly-secondary hover:text-opsly-text'
          }`}
        >
          Templates Library
        </button>
        <button
          onClick={() => setSubTab('upload')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            subTab === 'upload' ? 'border-[#c15f3c] text-opsly-text font-bold' : 'border-transparent text-opsly-secondary hover:text-opsly-text'
          }`}
        >
          Upload Received Contract
        </button>
      </div>

      {subTab === 'list' && (
        <div className="space-y-4">
          {documents.some(d => checkExpiryStatus(d.expiry_date) !== 'active') && (
            <div className="p-4 bg-red-950/20 border border-red-800/30 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-xs text-opsly-text font-semibold">
                  Warning: You have contract agreements that are expired or expiring within 30 days. Update or renew details to maintain service safety.
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Filter:</span>
            {['all', 'client_contract', 'material_contract', 'scope_of_work', 'change_order', 'warranty'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-all ${
                  filterType === type
                    ? 'bg-opsly-accent text-opsly-text'
                    : 'bg-opsly-input border border-opsly-border text-opsly-secondary hover:bg-opsly-hover'
                }`}
              >
                {type.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          {filteredDocs.length === 0 ? (
            <div className="bg-opsly-card border border-opsly-border rounded-xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-opsly-input border border-opsly-border flex items-center justify-center mb-4 text-opsly-muted">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-opsly-text">No active documents found</h3>
              <p className="text-xs text-opsly-secondary max-w-xs mt-1.5 leading-relaxed">
                Add contracts using the templates library or upload external agreements.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocs.map((doc) => {
                const expStatus = checkExpiryStatus(doc.expiry_date)
                return (
                  <div key={doc.id} className="bg-opsly-card border border-opsly-border rounded-xl p-5 hover:border-opsly-accent/20 transition-all flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-opsly-input border border-opsly-border text-[9px] font-bold uppercase text-opsly-accent tracking-wider rounded">
                          {doc.type.replace('_', ' ')}
                        </span>
                        {doc.expiry_date && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            expStatus === 'expired' ? 'bg-red-950/20 text-red-400 border border-red-800/30' :
                            expStatus === 'warning' ? 'bg-amber-950/20 text-amber-400 border border-amber-800/30' :
                            'text-opsly-muted'
                          }`}>
                            {expStatus === 'expired' ? 'Expired' : `Expires: ${new Date(doc.expiry_date).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-opsly-text">{doc.title}</h4>
                      <p className="text-[11px] text-opsly-muted mt-1 break-all">Portal URL: <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-opsly-accent hover:underline">{doc.file_url}</a></p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-opsly-border">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSign(doc.id, doc.signed_status)}
                          className={`px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer border ${
                            doc.signed_status
                              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800/30'
                              : 'bg-opsly-input text-opsly-secondary border-opsly-border hover:text-opsly-text'
                          }`}
                        >
                          {doc.signed_status ? '✓ Signed' : 'Mark Signed'}
                        </button>
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="px-3 py-1 bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-text rounded text-[10px] font-bold transition-all cursor-pointer"
                        >
                          View PDF
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-opsly-muted hover:text-opsly-error transition-colors p-1"
                        title="Remove Document"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {subTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templatesList.map((tpl) => (
            <div key={tpl.id} className="bg-opsly-card border border-opsly-border rounded-xl p-5 flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#c15f3c] uppercase tracking-wider">{tpl.name}</h3>
                <p className="text-xs text-opsly-secondary mt-2 leading-relaxed">{tpl.text}</p>
              </div>
              <button
                onClick={() => handleSelectTemplate(tpl)}
                className="w-full bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-text text-xs font-semibold py-2.5 rounded-xl cursor-pointer transition-all"
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}

      {subTab === 'upload' && (
        <form onSubmit={handleManualUpload} className="max-w-xl bg-opsly-card border border-opsly-border rounded-xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-opsly-text uppercase tracking-wider">Upload Received Agreement</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Document Title</label>
              <input
                type="text"
                required
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Approved Roof Replacement Agreement"
                className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Type</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
                >
                  <option value="client_contract">Client Contract</option>
                  <option value="material_contract">Material Contract</option>
                  <option value="scope_of_work">Scope of Work</option>
                  <option value="warranty">Warranty</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={uploadExpiry}
                  onChange={(e) => setUploadExpiry(e.target.value)}
                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Assigned Contact (Optional)</label>
              <select
                value={uploadContactId}
                onChange={(e) => setUploadContactId(e.target.value)}
                className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
              >
                <option value="">None</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Select PDF/DOCX File</label>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                required
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-opsly-text"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={isUploading}
                className="bg-[#c15f3c] hover:bg-[#a95232] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Save Uploaded Contract'}
              </button>
            </div>
          </div>
        </form>
      )}

      <AnimatePresence>
        {builderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBuilderOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-opsly-card border border-opsly-border rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl z-10 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-opsly-text">Build {selectedTemplate?.name}</h3>
                <button onClick={() => setBuilderOpen(false)} className="p-1 rounded bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-secondary hover:text-opsly-text">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSaveDocument} className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Document Title</label>
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Map to Client / Contact</label>
                    <select
                      value={selectedContactId}
                      onChange={(e) => setSelectedContactId(e.target.value)}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
                    >
                      <option value="">Select Client</option>
                      {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Map to Job / Project (Optional)</label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
                    >
                      <option value="">Select Job</option>
                      {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Scope of Work Details</label>
                  <textarea
                    rows={4}
                    value={scopeDetails}
                    onChange={(e) => setScopeDetails(e.target.value)}
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Payment Terms</label>
                    <input
                      type="text"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Contract Expiry Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Liability Limitation Clause</label>
                  <input
                    type="text"
                    value={liabilityClause}
                    onChange={(e) => setLiabilityClause(e.target.value)}
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-3 gap-2">
                  <button type="button" onClick={() => setBuilderOpen(false)} className="border border-opsly-border bg-opsly-input text-opsly-text px-4 py-2.5 rounded-xl text-xs font-semibold">Cancel</button>
                  <button type="submit" className="bg-[#c15f3c] hover:bg-[#a95232] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all">Generate &amp; Save PDF</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {coOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCoOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-opsly-card border border-opsly-border rounded-2xl w-full max-w-md p-6 relative shadow-2xl z-10 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-opsly-text">Create Change Order</h3>
                <button onClick={() => setCoOpen(false)} className="p-1 rounded bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-secondary hover:text-opsly-text">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateChangeOrder} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Select Job / Project</label>
                  <select
                    value={coJobId}
                    required
                    onChange={(e) => setCoJobId(e.target.value)}
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
                  >
                    <option value="">Select Job</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Change Reason</label>
                  <input
                    type="text"
                    required
                    value={coReason}
                    onChange={(e) => setCoReason(e.target.value)}
                    placeholder="e.g. Additional material layer"
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Additional Cost ({currencySymbol})</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={coCost}
                      onChange={(e) => setCoCost(e.target.value)}
                      placeholder="500"
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Detailed Description</label>
                  <textarea
                    rows={3}
                    value={coDescription}
                    onChange={(e) => setCoDescription(e.target.value)}
                    placeholder="Explain the changes to the project scope and client approvals..."
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2 gap-2">
                  <button type="button" onClick={() => setCoOpen(false)} className="border border-opsly-border bg-opsly-input text-opsly-text px-4 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                  <button type="submit" className="bg-[#c15f3c] hover:bg-[#a95232] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all">Submit Change Order</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setPreviewDoc(null)} />
            
            {/* Print style overrides for documents */}
            <style>{`
              @media print {
                aside, header, nav, footer, button, .no-print, .no-print-wrapper {
                  display: none !important;
                  height: 0 !important;
                  width: 0 !important;
                  opacity: 0 !important;
                  overflow: hidden !important;
                }
                body, html, #root, .app-layout-wrapper, .main-content-area, .invoice-print-root {
                  background: #ffffff !important;
                  color: #000000 !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  height: auto !important;
                  overflow: visible !important;
                }
                .print-card-doc {
                  border: none !important;
                  box-shadow: none !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  position: relative !important;
                }
                .print-card-doc * {
                  color: #000000 !important;
                  border-color: #e5e7eb !important;
                }
              }
            `}</style>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-opsly-card border border-opsly-border rounded-2xl w-full max-w-3xl p-6 relative z-10 space-y-4 max-h-[90vh] overflow-y-auto no-print-wrapper"
            >
              {/* Control bar */}
              <div className="flex justify-between items-center no-print">
                <h3 className="text-sm font-bold text-opsly-text">Document PDF Preview</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="bg-[#c15f3c] hover:bg-[#a95232] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    Print Document
                  </button>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="border border-opsly-border bg-opsly-input hover:bg-opsly-hover text-opsly-text px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Printable white A4 paper card */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 sm:p-12 shadow-xl print-card-doc text-gray-900 space-y-8 font-sans">
                {/* Header */}
                <div className="flex justify-between items-start gap-4 border-b border-gray-200 pb-6">
                  <div>
                    {currentClient?.logo_url && (
                      <img src={currentClient.logo_url} alt={currentClient.business_name} className="max-h-12 max-w-[160px] object-contain rounded mb-3" />
                    )}
                    <h2 className="text-base font-bold text-gray-900">{currentClient?.business_name || 'Our Service Company'}</h2>
                    <p className="text-[11px] text-gray-500 mt-0.5">{currentClient?.business_address || ''}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-800 text-[10px] font-bold uppercase rounded tracking-wider border border-gray-200">
                      {previewDoc.type.replace('_', ' ')}
                    </span>
                    <p className="text-[10px] text-gray-500 mt-2">Date: {new Date(previewDoc.created_at).toLocaleDateString()}</p>
                    {previewDoc.expiry_date && (
                      <p className="text-[10px] text-gray-500">Expires: {new Date(previewDoc.expiry_date).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-4">
                  <h1 className="text-xl font-bold text-gray-900">{previewDoc.title}</h1>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    This document sets forth the mutually agreed terms, scope of service, and warranty parameters between <strong>{currentClient?.business_name || 'Provider'}</strong> and the assigned project client.
                  </p>

                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-3">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Project Scope details</h4>
                    <p className="text-xs text-gray-800 leading-relaxed italic">
                      "Scope covers all materials, installation tools, labor metrics, clean-up operations, and post-project checks aligned to original specifications."
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Payment Terms</h4>
                      <p className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded p-2.5">
                        50% upfront deposit, 50% upon completion.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Liability Limitation</h4>
                      <p className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded p-2.5">
                        Provider is not liable for structural changes pre-dating the project scope.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-8 border-t border-gray-100 flex justify-between gap-12 text-xs">
                  <div>
                    <p className="font-semibold text-gray-900">Authorized Representative</p>
                    {currentClient?.signature_url ? (
                      <img src={currentClient.signature_url} alt="Signature" className="max-h-8 object-contain mt-2" />
                    ) : (
                      <div className="h-8 border-b border-gray-300 w-36 mt-2" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Client Signature</p>
                    {previewDoc.signed_status ? (
                      <span className="inline-block text-[#10b981] font-bold tracking-wider uppercase border-2 border-[#10b981] px-2 py-0.5 rounded rotate-[-2deg] mt-2">
                        ✓ Signed Digitally
                      </span>
                    ) : (
                      <div className="h-8 border-b border-gray-300 w-36 mt-2" />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
