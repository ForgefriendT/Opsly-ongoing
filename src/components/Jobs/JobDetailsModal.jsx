import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'

const STATUS_FLOW = ['scheduled', 'in_progress', 'completed', 'cancelled']

const STATUS_LABELS = {
  scheduled: { text: 'Scheduled', class: 'bg-opsly-accent-soft text-opsly-accent border-opsly-accent/20' },
  in_progress: { text: 'In Progress', class: 'bg-blue-950/20 text-blue-400 border-blue-800/25' },
  completed: { text: 'Completed', class: 'bg-green-950/20 text-green-400 border-green-800/25' },
  cancelled: { text: 'Cancelled', class: 'bg-red-950/20 text-red-400 border-red-800/25' }
}

export default function JobDetailsModal({ isOpen, onClose, onRefresh, job, clientId, onEditJob, contacts = [], triggerConfirm }) {
  const [status, setStatus] = useState('scheduled')
  const [price, setPrice] = useState(0)
  const [materialsCost, setMaterialsCost] = useState('0')
  const [labourCost, setLabourCost] = useState('0')
  const [subCost, setSubCost] = useState('0')
  
  const [teamMembers, setTeamMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState(null)
  const [showSavedMsg, setShowSavedMsg] = useState(false)

  // Populate data
  useEffect(() => {
    if (job) {
      setStatus(job.status || 'scheduled')
      setPrice(Number(job.price) || 0)
      setMaterialsCost(job.materials_cost !== null && job.materials_cost !== undefined ? String(job.materials_cost) : '0')
      setLabourCost(job.labour_cost !== null && job.labour_cost !== undefined ? String(job.labour_cost) : '0')
      setSubCost(job.sub_cost !== null && job.sub_cost !== undefined ? String(job.sub_cost) : '0')
      setError(null)
    }
  }, [job, isOpen])

  // Load team members to resolve assignee names
  useEffect(() => {
    if (!clientId) return
    async function fetchTeamMembers() {
      setLoadingMembers(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('client_id', clientId)
        if (fetchErr) throw fetchErr
        setTeamMembers(data || [])
      } catch (err) {
        console.error('Failed to load team members:', err)
      } finally {
        setLoadingMembers(false)
      }
    }
    fetchTeamMembers()
  }, [clientId, isOpen])

  if (!isOpen || !job) return null

  // Find linked contact/client
  const contact = contacts.find(c => c.id === job.contact_id)

  // Calculate profit and margin
  const matVal = parseFloat(materialsCost) || 0
  const labVal = parseFloat(labourCost) || 0
  const subVal = parseFloat(subCost) || 0
  const totalCost = matVal + labVal + subVal
  const profit = price - totalCost
  const marginPercentage = price > 0 ? (profit / price) * 100 : 0

  // Advance status flow
  const handleAdvanceStatus = async () => {
    const currentIndex = STATUS_FLOW.indexOf(status)
    let nextIndex = (currentIndex + 1) % STATUS_FLOW.length
    // Skip cancelled in default progression cycle unless specifically selected
    if (STATUS_FLOW[nextIndex] === 'cancelled') {
      nextIndex = 0 // loop back to scheduled
    }
    await updateStatusInDb(STATUS_FLOW[nextIndex])
  }

  const updateStatusInDb = async (newStatus) => {
    setIsUpdating(true)
    setError(null)
    try {
      const { error: updateErr } = await supabase
        .from('jobs')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)

      if (updateErr) throw updateErr
      setStatus(newStatus)
      onRefresh()
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Failed to update status.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveCosts = async () => {
    setIsUpdating(true)
    setError(null)
    try {
      const { error: updateErr } = await supabase
        .from('jobs')
        .update({
          materials_cost: matVal,
          labour_cost: labVal,
          sub_cost: subVal,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)

      if (updateErr) throw updateErr
      onRefresh()
      setShowSavedMsg(true)
      setTimeout(() => setShowSavedMsg(false), 3000)
    } catch (err) {
      console.error('Error saving costs:', err)
      setError('Failed to save costs.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteJob = async () => {
    if (triggerConfirm) {
      triggerConfirm({
        title: 'Delete Job',
        message: 'Are you sure you want to delete this job? This action cannot be undone.',
        confirmText: 'Delete',
        isDanger: true,
        onConfirm: async () => {
          setIsUpdating(true)
          try {
            const { error: delErr } = await supabase
              .from('jobs')
              .delete()
              .eq('id', job.id)

            if (delErr) throw delErr
            onRefresh()
            onClose()
          } catch (err) {
            console.error('Error deleting job:', err)
            setError('Failed to delete job.')
          } finally {
            setIsUpdating(false)
          }
        }
      })
    } else {
      if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
        return
      }
      setIsUpdating(true)
      try {
        const { error: delErr } = await supabase
          .from('jobs')
          .delete()
          .eq('id', job.id)

        if (delErr) throw delErr
        onRefresh()
        onClose()
      } catch (err) {
        console.error('Error deleting job:', err)
        setError('Failed to delete job.')
      } finally {
        setIsUpdating(false)
      }
    }
  }

  // Get assigned user names
  const assignedUsers = teamMembers.filter(member => job.assigned_user_ids?.includes(member.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0e0d]/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-opsly-card border border-opsly-border rounded-xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-opsly-border bg-opsly-input/20">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-opsly-text truncate max-w-[200px]">
              {job.title}
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_LABELS[status]?.class || 'bg-opsly-input border-opsly-border text-opsly-secondary'}`}>
              {STATUS_LABELS[status]?.text || status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-secondary hover:text-opsly-text cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 bg-opsly-error/10 border border-opsly-error/20 text-opsly-error rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* Quick status cycle button */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-opsly-input/30 border border-opsly-border rounded-xl">
            <div className="text-[11px] font-bold text-opsly-secondary uppercase tracking-wider">
              Status Progression
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAdvanceStatus}
                disabled={isUpdating}
                className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm transition-colors"
              >
                Advance Status
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <select
                value={status}
                onChange={(e) => updateStatusInDb(e.target.value)}
                disabled={isUpdating}
                className="bg-opsly-input border border-opsly-border rounded-lg text-[11px] font-bold text-opsly-text p-1.5 focus:outline-none cursor-pointer"
              >
                {STATUS_FLOW.map(flowStatus => (
                  <option key={flowStatus} value={flowStatus}>
                    {STATUS_LABELS[flowStatus]?.text}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="block text-[10px] font-bold text-opsly-muted uppercase tracking-wider mb-0.5">Linked Client</span>
              <span className="font-semibold text-opsly-text">{contact ? contact.name : '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-opsly-muted uppercase tracking-wider mb-0.5">Contract Price</span>
              <span className="font-semibold text-opsly-text">${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-[10px] font-bold text-opsly-muted uppercase tracking-wider mb-0.5">Address</span>
              <span className="font-medium text-opsly-secondary">{job.address || '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-opsly-muted uppercase tracking-wider mb-0.5">Scheduled Start</span>
              <span className="font-medium text-opsly-secondary">
                {job.start_date ? new Date(job.start_date).toLocaleString() : '—'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-opsly-muted uppercase tracking-wider mb-0.5">Scheduled End</span>
              <span className="font-medium text-opsly-secondary">
                {job.end_date ? new Date(job.end_date).toLocaleString() : '—'}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-[10px] font-bold text-opsly-muted uppercase tracking-wider mb-0.5">Description / Notes</span>
              <p className="font-medium text-opsly-secondary whitespace-pre-line bg-opsly-input/20 border border-opsly-border rounded-lg p-2.5">
                {job.description || 'No description provided.'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-[10px] font-bold text-opsly-muted uppercase tracking-wider mb-1">Assigned Technicians</span>
              {loadingMembers ? (
                <div className="text-[10px] text-opsly-muted">Resolving...</div>
              ) : assignedUsers.length === 0 ? (
                <span className="text-[11px] text-opsly-muted italic">Unassigned</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {assignedUsers.map(u => (
                    <span key={u.id} className="text-[10px] font-semibold bg-opsly-input border border-opsly-border text-opsly-text px-2 py-1 rounded-md">
                      {u.full_name || u.email}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Profit Costing Widget */}
          <div className="border border-opsly-border rounded-xl p-4 bg-opsly-input/10 space-y-4">
            <h3 className="text-xs font-bold text-opsly-text uppercase tracking-wider border-b border-opsly-border pb-2">
              Profitability Costing Calculator
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-opsly-muted uppercase tracking-wider mb-1">
                  Materials ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={materialsCost}
                  onChange={(e) => setMaterialsCost(e.target.value)}
                  className="w-full bg-opsly-input border border-opsly-border rounded-lg text-xs text-opsly-text p-2 focus:outline-none focus:border-opsly-accent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-opsly-muted uppercase tracking-wider mb-1">
                  Labour ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={labourCost}
                  onChange={(e) => setLabourCost(e.target.value)}
                  className="w-full bg-opsly-input border border-opsly-border rounded-lg text-xs text-opsly-text p-2 focus:outline-none focus:border-opsly-accent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-opsly-muted uppercase tracking-wider mb-1">
                  Subs / Other ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={subCost}
                  onChange={(e) => setSubCost(e.target.value)}
                  className="w-full bg-opsly-input border border-opsly-border rounded-lg text-xs text-opsly-text p-2 focus:outline-none focus:border-opsly-accent"
                />
              </div>
            </div>

            {/* Calculations Dashboard */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-opsly-border text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-opsly-muted">Contract Price:</span>
                  <span className="font-semibold text-opsly-text">${price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-opsly-muted">Total Cost:</span>
                  <span className="font-semibold text-opsly-secondary">${totalCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col items-end justify-center bg-opsly-input/30 p-2 border border-opsly-border rounded-lg">
                <span className="text-[9px] font-bold text-opsly-muted uppercase tracking-wider">Gross Profit</span>
                <span className={`text-sm font-extrabold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${profit.toFixed(2)}
                </span>
                <span className={`text-[10px] font-semibold ${profit >= 0 ? 'text-green-500/80' : 'text-red-500/80'}`}>
                  {marginPercentage.toFixed(1)}% margin
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              {showSavedMsg ? (
                <span className="text-[10px] font-bold text-green-400 animate-pulse">
                  ✓ Cost metrics saved successfully!
                </span>
              ) : (
                <span />
              )}
              <button
                onClick={handleSaveCosts}
                disabled={isUpdating}
                className="bg-opsly-input border border-opsly-border hover:bg-opsly-hover text-opsly-text text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
              >
                Save Cost Metrics
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-between pt-3 border-t border-opsly-border">
            <button
              onClick={() => onDeleteJob(job)}
              disabled={isUpdating}
              className="px-3.5 py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-800/25 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Delete Job
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onEditJob(job)
                  onClose()
                }}
                className="px-4 py-2 border border-opsly-border hover:bg-opsly-hover text-opsly-secondary rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                Edit Details
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-opsly-input border border-opsly-border text-opsly-text hover:bg-opsly-hover rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
