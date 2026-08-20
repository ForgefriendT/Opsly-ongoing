import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'

export default function JobBuilderModal({ isOpen, onClose, onSaveSuccess, job = null, clientId, contacts = [], initialDate = null, currentPlan, onShowUpgradeModal }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contactId, setContactId] = useState('')
  const [address, setAddress] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [price, setPrice] = useState('0')
  const [assignedUserIds, setAssignedUserIds] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // Worker assignment states
  const [assignWorker, setAssignWorker] = useState(false)
  const [workerSelectType, setWorkerSelectType] = useState('custom')
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [customWorkerName, setCustomWorkerName] = useState('')
  const [workerPay, setWorkerPay] = useState('0')
  const [autoLogExpense, setAutoLogExpense] = useState(true)

  // Helper to format ISO date to datetime-local format (YYYY-MM-DDTHH:MM)
  const formatDateTimeLocal = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Load team members
  useEffect(() => {
    if (!clientId) return
    async function fetchTeamMembers() {
      setLoadingMembers(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('users')
          .select('id, full_name, email, role')
          .eq('client_id', clientId)
          .eq('is_active', true)
        
        if (fetchErr) throw fetchErr
        setTeamMembers(data || [])
      } catch (err) {
        console.error('Failed to load team members:', err)
      } finally {
        setLoadingMembers(false)
      }
    }
    fetchTeamMembers()
  }, [clientId])

  // Populate values if in edit mode
  useEffect(() => {
    if (job) {
      setTitle(job.title || '')
      
      // Parse worker name if exists in description (stored as [Worker/Inspector: Name])
      const desc = job.description || ''
      const workerMatch = desc.match(/^\[Worker\/Inspector:\s*(.*?)\]/)
      if (workerMatch) {
        setAssignWorker(true)
        const workerName = workerMatch[1]
        const matchedMember = teamMembers.find(t => t.full_name === workerName)
        if (matchedMember) {
          setWorkerSelectType('team')
          setSelectedMemberId(matchedMember.id)
        } else {
          setWorkerSelectType('custom')
          setCustomWorkerName(workerName)
        }
        setDescription(desc.replace(/^\[Worker\/Inspector:\s*(.*?)\]\n?/, ''))
      } else {
        setAssignWorker(false)
        setCustomWorkerName('')
        setSelectedMemberId('')
        setDescription(desc)
      }

      setContactId(job.contact_id || '')
      setAddress(job.address || '')
      setStartDate(job.start_date ? formatDateTimeLocal(job.start_date) : '')
      setEndDate(job.end_date ? formatDateTimeLocal(job.end_date) : '')
      setPrice(job.price ? String(job.price) : '0')
      setWorkerPay(job.labour_cost ? String(job.labour_cost) : '0')
      setAssignedUserIds(job.assigned_user_ids || [])
    } else {
      setTitle('')
      setDescription('')
      setContactId('')
      setAddress('')
      // Default to the clicked date/time or today at 9:00 AM
      const base = initialDate ? new Date(initialDate) : new Date()
      if (!initialDate) {
        base.setHours(9, 0, 0, 0)
      }
      setStartDate(formatDateTimeLocal(base.toISOString()))
      // Default end to base + 1 hour
      const endBase = new Date(base)
      endBase.setHours(endBase.getHours() + 1)
      setEndDate(formatDateTimeLocal(endBase.toISOString()))
      setPrice('0')
      setAssignedUserIds([])
      setAssignWorker(false)
      setCustomWorkerName('')
      setSelectedMemberId('')
      setWorkerPay('0')
    }
    setError(null)
  }, [job, isOpen, initialDate, teamMembers])

  if (!isOpen) return null

  const handleToggleAssignee = (userId) => {
    if (assignedUserIds.includes(userId)) {
      setAssignedUserIds(assignedUserIds.filter(id => id !== userId))
    } else {
      setAssignedUserIds([...assignedUserIds, userId])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Job title is required.')
      return
    }

    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : null

    if (end && start >= end) {
      setError('Start date must be strictly before end date.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const isProPlan = currentPlan === 'pro'
      const payVal = assignWorker && isProPlan ? parseFloat(workerPay) || 0 : 0
      const finalWorkerName = assignWorker && isProPlan
        ? (workerSelectType === 'team'
            ? teamMembers.find(t => t.id === selectedMemberId)?.full_name || 'Team Member'
            : customWorkerName.trim() || 'Assigned Worker')
        : ''

      const finalDescription = assignWorker && isProPlan && finalWorkerName
        ? `[Worker/Inspector: ${finalWorkerName}]\n${description.trim()}`
        : description.trim()

      const payload = {
        client_id: clientId,
        contact_id: contactId || null,
        title: title.trim(),
        description: finalDescription || null,
        address: address.trim() || null,
        start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        price: parseFloat(price) || 0,
        labour_cost: payVal,
        assigned_user_ids: assignWorker && isProPlan && workerSelectType === 'team' && selectedMemberId ? [selectedMemberId] : [],
        updated_at: new Date().toISOString()
      }

      let savedJob = null
      if (job?.id) {
        // Edit Mode
        const { data, error: saveErr } = await supabase
          .from('jobs')
          .update(payload)
          .eq('id', job.id)
          .select()
          .single()

        if (saveErr) throw saveErr
        savedJob = data
      } else {
        // Create Mode
        const { data, error: saveErr } = await supabase
          .from('jobs')
          .insert({
            ...payload,
            status: 'scheduled'
          })
          .select()
          .single()

        if (saveErr) throw saveErr
        savedJob = data
      }

      // Auto-log expense if selected and worker has a positive compensation payout
      if (assignWorker && isProPlan && payVal > 0 && autoLogExpense && savedJob) {
        const { error: expErr } = await supabase
          .from('expenses')
          .insert({
            client_id: clientId,
            job_id: savedJob.id,
            amount: payVal,
            category: 'Labour',
            description: `Labour payout for Job: ${title.trim()} (Worker: ${finalWorkerName})`,
            expense_date: new Date().toISOString().split('T')[0],
            recurrence: 'one_time'
          })
        if (expErr) console.error('Failed to log automatic labor expense:', expErr)
      }

      onSaveSuccess()
      onClose()
    } catch (err) {
      console.error('Error saving job:', err)
      setError(err.message || 'An error occurred while saving the job.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0e0d]/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-opsly-card border border-opsly-border rounded-xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-opsly-border bg-opsly-input/20">
          <h2 className="text-sm font-bold text-opsly-text">
            {job ? 'Edit Scheduled Job' : 'Schedule New Job'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-secondary hover:text-opsly-text cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 bg-opsly-error/10 border border-opsly-error/20 text-opsly-error rounded-xl text-xs flex gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">
                Job Title <span className="text-opsly-accent">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AC Maintenance & Repair"
                className="w-full bg-opsly-input border border-opsly-border rounded-lg text-xs text-opsly-text p-2.5 focus:outline-none focus:border-opsly-accent"
                required
              />
            </div>

            {/* Client / Contact */}
            <div>
              <label className="block text-[11px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">
                Select Client
              </label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full bg-opsly-input border border-opsly-border rounded-lg text-xs text-opsly-text p-2.5 focus:outline-none focus:border-opsly-accent cursor-pointer"
              >
                <option value="">-- No Client Linked --</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-[11px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">
                Price / Contract Value ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-opsly-input border border-opsly-border rounded-lg text-xs text-opsly-text p-2.5 focus:outline-none focus:border-opsly-accent"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">
                Address / Location
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Job site location"
                className="w-full bg-opsly-input border border-opsly-border rounded-lg text-xs text-opsly-text p-2.5 focus:outline-none focus:border-opsly-accent"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-[11px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">
                Start Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-opsly-input border border-opsly-border rounded-lg text-xs text-opsly-text p-2.5 focus:outline-none focus:border-opsly-accent"
                required
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[11px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">
                End Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-opsly-input border border-opsly-border rounded-lg text-xs text-opsly-text p-2.5 focus:outline-none focus:border-opsly-accent"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">
                Job Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scope of work details..."
                rows={3}
                className="w-full bg-opsly-input border border-opsly-border rounded-lg text-xs text-opsly-text p-2.5 focus:outline-none focus:border-opsly-accent resize-none"
              />
            </div>

            {/* Worker assignment section */}
            <div className="sm:col-span-2 border border-opsly-border/60 bg-opsly-input/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="assignWorkerCheck"
                    checked={assignWorker}
                    onChange={(e) => {
                      if (currentPlan !== 'pro') {
                        onShowUpgradeModal()
                        return
                      }
                      setAssignWorker(e.target.checked)
                    }}
                    className="rounded bg-opsly-input border-opsly-border text-opsly-accent focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="assignWorkerCheck" className="text-xs font-bold text-opsly-text cursor-pointer select-none flex items-center gap-1">
                    Assign worker / inspector and track payout
                  </label>
                </div>
                {currentPlan !== 'pro' && (
                  <span 
                    onClick={onShowUpgradeModal}
                    className="text-[8px] bg-[#c15f3c]/15 text-[#c15f3c] border border-[#c15f3c]/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-2.5 h-2.5 text-[#c15f3c] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" />
                    </svg>
                    Pro Feature
                  </span>
                )}
              </div>

              {assignWorker && currentPlan === 'pro' && (
                <div className="space-y-3 pt-3 border-t border-opsly-border/40">
                  {/* Worker select type toggle */}
                  <div className="flex bg-opsly-input p-0.5 rounded-lg border border-opsly-border w-fit">
                    <button
                      type="button"
                      onClick={() => setWorkerSelectType('custom')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        workerSelectType === 'custom'
                          ? 'bg-[#c15f3c] text-white'
                          : 'text-opsly-secondary hover:text-opsly-text'
                      }`}
                    >
                      Custom Name
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkerSelectType('team')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        workerSelectType === 'team'
                          ? 'bg-[#c15f3c] text-white'
                          : 'text-opsly-secondary hover:text-opsly-text'
                      }`}
                    >
                      Registered Team
                    </button>
                  </div>

                  {workerSelectType === 'team' ? (
                    <div>
                      <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Select Team Member</label>
                      {loadingMembers ? (
                        <div className="h-8 bg-opsly-input border border-opsly-border rounded-lg animate-pulse" />
                      ) : (
                        <select
                          value={selectedMemberId}
                          onChange={(e) => {
                            const val = e.target.value
                            setSelectedMemberId(val)
                            if (val) {
                              const rates = JSON.parse(localStorage.getItem(`opsly_worker_rates_${clientId}`)) || {}
                              const rateVal = rates[val] !== undefined ? rates[val] : 45
                              setWorkerPay(rateVal.toString())
                            }
                          }}
                          className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                        >
                          <option value="">Select a member...</option>
                          {teamMembers.map(t => (
                            <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Worker/Inspector Name</label>
                      <input
                        type="text"
                        value={customWorkerName}
                        onChange={(e) => setCustomWorkerName(e.target.value)}
                        placeholder="e.g. Sarah Connor"
                        className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Worker Compensation / Payout</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-opsly-muted text-xs">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={workerPay}
                        onChange={(e) => setWorkerPay(e.target.value)}
                        className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg pl-7 pr-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  {parseFloat(workerPay) > 0 && (
                    <div className="flex items-start gap-2 bg-[#c15f3c]/5 border border-[#c15f3c]/20 rounded-lg p-2.5 text-[10px] text-opsly-text">
                      <input
                        type="checkbox"
                        id="autoLogExpenseCheck"
                        checked={autoLogExpense}
                        onChange={(e) => setAutoLogExpense(e.target.checked)}
                        className="rounded bg-opsly-input border-opsly-border text-opsly-accent focus:ring-0 cursor-pointer mt-0.5"
                      />
                      <label htmlFor="autoLogExpenseCheck" className="cursor-pointer select-none leading-normal">
                        <strong>Auto-Log Expense:</strong> Deduct worker compensation of ${Number(workerPay).toFixed(2)} automatically as a Labour expense.
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 justify-end pt-3 border-t border-opsly-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-opsly-border hover:bg-opsly-hover text-opsly-secondary rounded-lg text-xs font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-opsly-text" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                job ? 'Update Job' : 'Schedule Job'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
