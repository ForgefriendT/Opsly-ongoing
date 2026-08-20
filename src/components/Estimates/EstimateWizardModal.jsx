import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'

export default function EstimateWizardModal({
  isOpen,
  onClose,
  estimate,
  clientId,
  currentPlan,
  onShowUpgradeModal,
  onActionSuccess,
  contacts = [],
  currencySymbol = '$'
}) {
  const [step, setStep] = useState(1) // 1: Create Job, 2: Create Invoice
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Job form fields
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [assignWorker, setAssignWorker] = useState(false)
  const [workerSelectType, setWorkerSelectType] = useState('custom') // 'team' or 'custom'
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [customWorkerName, setCustomWorkerName] = useState('')
  const [workerPay, setWorkerPay] = useState('0')
  const [logExpense, setLogExpense] = useState(true)

  // Team members list
  const [teamMembers, setTeamMembers] = useState([])
  const [fetchingMembers, setFetchingMembers] = useState(false)

  useEffect(() => {
    if (estimate) {
      setJobTitle(`Job for ${estimate.estimate_number}`)
      setJobDescription(`Scheduled following approval of Estimate ${estimate.estimate_number}.`)
    }
    setStep(1)
    setAssignWorker(false)
    setWorkerPay('0')
    setLogExpense(true)
    setError(null)
  }, [estimate, isOpen])

  useEffect(() => {
    if (!clientId || !isOpen) return
    async function loadTeam() {
      setFetchingMembers(true)
      try {
        const { data, error: err } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('client_id', clientId)
          .eq('is_active', true)
        if (err) throw err
        setTeamMembers(data || [])
      } catch (e) {
        console.error('Failed to load team:', e)
      } finally {
        setFetchingMembers(false)
      }
    }
    loadTeam()
  }, [clientId, isOpen])

  if (!isOpen || !estimate) return null

  const isGrowthOrAbove = currentPlan === 'growth' || currentPlan === 'pro'

  const handleCreateJob = async () => {
    if (assignWorker) {
      if (!isGrowthOrAbove) {
        onShowUpgradeModal()
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      const payVal = parseFloat(workerPay) || 0
      const finalWorkerName = workerSelectType === 'team'
        ? teamMembers.find(t => t.id === selectedMemberId)?.full_name || 'Team Member'
        : customWorkerName.trim() || 'Assigned Worker'

      // 1. Create Job in database
      const { data: savedJob, error: jobErr } = await supabase
        .from('jobs')
        .insert({
          client_id: clientId,
          contact_id: estimate.contact_id,
          title: jobTitle.trim(),
          description: assignWorker 
            ? `[Worker/Inspector: ${finalWorkerName}]\n${jobDescription.trim()}`
            : jobDescription.trim(),
          start_date: new Date().toISOString(),
          price: parseFloat(estimate.grand_total) || 0,
          status: 'scheduled',
          labour_cost: assignWorker ? payVal : 0,
          assigned_user_ids: assignWorker && workerSelectType === 'team' && selectedMemberId ? [selectedMemberId] : []
        })
        .select()
        .single()

      if (jobErr) throw jobErr

      // 2. Auto-log expense if selected & worker paid
      if (assignWorker && payVal > 0 && logExpense) {
        const { error: expErr } = await supabase
          .from('expenses')
          .insert({
            client_id: clientId,
            amount: payVal,
            category: 'Labour',
            description: `Labour payout for Job: ${jobTitle.trim()} (Worker: ${finalWorkerName})`,
            expense_date: new Date().toISOString().split('T')[0]
          })
        if (expErr) console.error('Failed to log automatic labor expense:', expErr)
      }

      setStep(2)
    } catch (e) {
      console.error(e)
      setError(e.message || 'Failed to create job.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvoice = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Generate invoice prefix
      const { data: clientProfile } = await supabase
        .from('clients')
        .select('invoice_prefix')
        .eq('id', clientId)
        .maybeSingle()

      const prefix = clientProfile?.invoice_prefix || 'INV'
      const randNum = Math.floor(1000 + Math.random() * 9000)
      const invNum = `${prefix}-${randNum}`

      // 2. Insert Invoice (status 'sent' => unpaid)
      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .insert({
          client_id: clientId,
          contact_id: estimate.contact_id,
          job_id: estimate.job_id,
          invoice_number: invNum,
          status: 'sent', // unpaid invoice
          line_items: estimate.line_items || [],
          subtotal: estimate.subtotal || 0,
          tax_total: estimate.tax_total || 0,
          discount_amount: estimate.discount_amount || 0,
          grand_total: estimate.grand_total || 0,
          notes: estimate.notes || `Created automatically from Approved Estimate ${estimate.estimate_number}`,
          currency: estimate.currency,
          currency_symbol: estimate.currency_symbol
        })
        .select()
        .single()

      if (invErr) throw invErr

      // 3. Mark Estimate as converted
      await supabase
        .from('estimates')
        .update({
          status: 'converted',
          converted_invoice_id: invoice.id
        })
        .eq('id', estimate.id)

      onActionSuccess(`Successfully generated Unpaid Invoice ${invNum}!`)
      onClose()
    } catch (e) {
      console.error(e)
      setError(e.message || 'Failed to generate invoice.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipInvoice = async () => {
    setLoading(true)
    try {
      // Just mark approved in case it isn't
      await supabase
        .from('estimates')
        .update({ status: 'approved' })
        .eq('id', estimate.id)

      onActionSuccess('Estimate processed!')
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
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
            <h2 className="text-sm font-bold text-opsly-text">
              Estimate Approved
            </h2>
            <span className="text-[10px] text-opsly-secondary block mt-0.5">
              Processing {estimate.estimate_number}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-secondary hover:text-opsly-text cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex border-b border-opsly-border/70 text-center text-xs">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 py-2 font-bold cursor-pointer transition-all ${step === 1 ? 'text-[#c15f3c] border-b-2 border-[#c15f3c]' : 'text-opsly-secondary hover:text-opsly-text'}`}
          >
            1. Schedule Job
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex-1 py-2 font-bold cursor-pointer transition-all ${step === 2 ? 'text-[#c15f3c] border-b-2 border-[#c15f3c]' : 'text-opsly-secondary hover:text-opsly-text'}`}
          >
            2. Generate Invoice
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-opsly-error/10 border border-opsly-error/20 text-opsly-error rounded-xl text-[11px] font-medium leading-relaxed">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-xs font-bold text-opsly-text">Step 1: Convert to Active Job</h3>
                  <p className="text-[11px] text-opsly-secondary mt-1 leading-relaxed">
                    Opsly will automatically set the job price to the estimate total: <strong className="text-opsly-text">{currencySymbol}{Number(estimate.grand_total).toFixed(2)}</strong>.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Job Title</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Job Description</label>
                    <textarea
                      rows={2}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none resize-none"
                    />
                  </div>

                  {/* Worker assignment check */}
                  <div className="border border-opsly-border/60 bg-opsly-input/10 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="assignWorkerCheck"
                          checked={assignWorker}
                          onChange={(e) => setAssignWorker(e.target.checked)}
                          className="rounded bg-opsly-input border-opsly-border text-opsly-accent focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="assignWorkerCheck" className="text-xs font-bold text-opsly-text cursor-pointer select-none">
                          Assign worker / inspector
                        </label>
                      </div>
                      {!isGrowthOrAbove && (
                        <span className="text-[8.5px] bg-[#c15f3c]/15 text-[#c15f3c] border border-[#c15f3c]/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                          <svg className="w-2.5 h-2.5 text-[#c15f3c] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" />
                          </svg>
                          Pro Feature
                        </span>
                      )}
                    </div>

                    {assignWorker && (
                      <div className="space-y-3 pt-1 border-t border-opsly-border/40">
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
                            {fetchingMembers ? (
                              <div className="h-8 bg-opsly-input border border-opsly-border rounded-lg animate-pulse" />
                            ) : (
                              <select
                                value={selectedMemberId}
                                onChange={(e) => setSelectedMemberId(e.target.value)}
                                className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                              >
                                <option value="">Select a member...</option>
                                {teamMembers.map(t => (
                                  <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
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
                              {currencySymbol}
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
                              checked={logExpense}
                              onChange={(e) => setLogExpense(e.target.checked)}
                              className="rounded bg-opsly-input border-opsly-border text-opsly-accent focus:ring-0 cursor-pointer mt-0.5"
                            />
                            <label htmlFor="autoLogExpenseCheck" className="cursor-pointer select-none leading-normal">
                              <strong>Auto-Log Expense noticed:</strong> Deduct worker compensation of {currencySymbol}{Number(workerPay).toFixed(2)} automatically as a Labour cost.
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-opsly-border/40">
                  <button
                    onClick={() => setStep(2)}
                    disabled={loading}
                    className="px-4 py-2 border border-opsly-border hover:bg-opsly-hover text-opsly-secondary rounded-xl text-xs font-semibold cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    I'll do it manually later
                  </button>
                  <button
                    onClick={handleCreateJob}
                    disabled={loading}
                    className="px-5 py-2 bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text rounded-xl text-xs font-semibold cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Scheduling...' : 'Create Job & Proceed'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-xs font-bold text-opsly-text">Step 2: Generate Unpaid Invoice</h3>
                  <p className="text-[11px] text-opsly-secondary mt-1 leading-relaxed">
                    Would you like to generate the corresponding invoice for this estimate now?
                  </p>
                </div>

                <div className="p-3.5 bg-opsly-input/10 border border-opsly-border rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-opsly-text">
                    <span>Invoice Amount:</span>
                    <span>{currencySymbol}{Number(estimate.grand_total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-opsly-secondary">
                    <span>Due Status:</span>
                    <span>Unpaid (Status: Sent)</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-opsly-border/40">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="px-3.5 py-2 border border-opsly-border hover:bg-opsly-hover text-opsly-secondary rounded-xl text-xs font-semibold cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Back to Step 1
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSkipInvoice}
                      disabled={loading}
                      className="px-3.5 py-2 border border-opsly-border hover:bg-opsly-hover text-opsly-secondary rounded-xl text-xs font-semibold cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      I'll do it manually later
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateInvoice}
                      disabled={loading}
                      className="px-4 py-2 bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text rounded-xl text-xs font-semibold cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {loading ? 'Generating...' : 'Generate Unpaid Invoice'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
