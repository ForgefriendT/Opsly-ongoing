import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'

export default function TeamManagement({ currentPlan, currentClient, onShowUpgradeModal, onShowToast }) {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Form states
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('Inspector')
  const [customRoleText, setCustomRoleText] = useState('')
  const [rate, setRate] = useState(45)
  const [saving, setSaving] = useState(false)

  // Invite Simulation States
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [generatedInviteLink, setGeneratedInviteLink] = useState('')

  const isGrowthOrAbove = currentPlan !== 'free' && currentPlan !== 'starter'

  useEffect(() => {
    if (!currentClient?.id) return
    fetchWorkers()
  }, [currentClient])

  const fetchWorkers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('client_id', currentClient.id)
        .eq('is_active', true)
        .order('full_name', { ascending: true })

      if (error) throw error

      const storedRates = JSON.parse(localStorage.getItem(`opsly_worker_rates_${currentClient.id}`)) || {}
      
      const workersWithRates = (data || []).map(w => ({
        ...w,
        compensation_rate: storedRates[w.id] !== undefined ? storedRates[w.id] : 45
      }))

      setWorkers(workersWithRates)
    } catch (err) {
      console.error('Error fetching team members:', err)
      onShowToast('Failed to load team members.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddWorker = async (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const finalRole = role === 'Custom' ? (customRoleText.trim() || 'Custom Tech') : role

      // 1. Insert into users table
      const { data, error } = await supabase
        .from('users')
        .insert({
          client_id: currentClient.id,
          full_name: name,
          email: email || null,
          phone: phone || null,
          role: finalRole,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      // 2. Save compensation rate in local storage
      const storedRates = JSON.parse(localStorage.getItem(`opsly_worker_rates_${currentClient.id}`)) || {}
      storedRates[data.id] = Number(rate)
      localStorage.setItem(`opsly_worker_rates_${currentClient.id}`, JSON.stringify(storedRates))

      // Generate simulation invite link
      const inviteLink = `${window.location.origin}/signup?invite_token=INV-${data.id}`
      setGeneratedInviteLink(inviteLink)
      setInviteModalOpen(true)

      onShowToast('Team member invited successfully!')
      
      // Reset form
      setName('')
      setEmail('')
      setPhone('')
      setRole('Inspector')
      setCustomRoleText('')
      setRate(45)
      setIsAdding(false)
      fetchWorkers()
    } catch (err) {
      console.error('Error adding team member:', err)
      onShowToast(err.message || 'Failed to add team member.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivateWorker = async (workerId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', workerId)

      if (error) throw error

      onShowToast('Team member removed successfully.')
      fetchWorkers()
    } catch (err) {
      console.error(err)
      onShowToast('Failed to remove team member.')
    }
  }

  const getInitials = (fullName) => {
    if (!fullName) return 'U'
    const parts = fullName.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return fullName.slice(0, 2).toUpperCase()
  }

  if (!isGrowthOrAbove) {
    return (
      <div className="bg-opsly-card border border-opsly-border rounded-2xl p-12 text-center flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#c15f3c]/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#c15f3c]/5 blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-full bg-[#c15f3c]/15 flex items-center justify-center mb-6 text-[#c15f3c] border border-[#c15f3c]/20">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-opsly-text">Team Management Locked</h2>
        <p className="text-xs text-opsly-secondary max-w-sm mt-2 leading-relaxed">
          Adding inspectors, field technicians, and setting custom compensation payouts are exclusive features of the **Growth and Pro plans**.
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-opsly-text tracking-tight">Team &amp; Inspectors</h1>
          <p className="text-xs text-opsly-secondary mt-1">Manage field inspectors, technicians, and assign dispatch workloads.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="w-full sm:w-auto bg-[#c15f3c] hover:bg-[#a95232] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-[#c15f3c]/15 flex items-center justify-center gap-1.5"
        >
          {isAdding ? 'Cancel' : 'Add Inspector'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddWorker} className="bg-opsly-card border border-[#c15f3c]/30 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-opsly-text uppercase tracking-wider text-[#c15f3c]">New Inspector Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@company.com"
                className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 019-2834"
                className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Role / Position</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
              >
                <option value="Inspector">Inspector</option>
                <option value="Technician">Technician</option>
                <option value="Subcontractor">Subcontractor</option>
                <option value="Office Admin">Office Admin</option>
                <option value="Custom">Other / Custom Role...</option>
              </select>
              {role === 'Custom' && (
                <input
                  type="text"
                  required
                  value={customRoleText}
                  onChange={(e) => setCustomRoleText(e.target.value)}
                  placeholder="Enter custom role title..."
                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none mt-2"
                />
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1.5">Compensation Rate ($/hr)</label>
              <input
                type="number"
                required
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-[#c15f3c] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#c15f3c] hover:bg-[#a95232] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Adding Member...' : 'Save & Send Invite'}
            </button>
          </div>
        </form>
      )}

      {/* Workers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-opsly-card border border-opsly-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <div className="bg-opsly-card border border-opsly-border rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-opsly-input border border-opsly-border flex items-center justify-center mb-4 text-opsly-muted">
            <svg className="w-6 h-6 text-opsly-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-opsly-text">No team members added</h3>
          <p className="text-xs text-opsly-secondary max-w-xs mt-1.5 leading-relaxed">
            Get started by adding your first field technician or inspector using the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workers.map((worker) => (
            <div key={worker.id} className="bg-opsly-card border border-opsly-border rounded-xl p-5 shadow-sm space-y-4 hover:border-opsly-border-hover transition-colors relative">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {worker.avatar_url ? (
                    <img src={worker.avatar_url} alt={worker.full_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#c15f3c]/15 text-[#c15f3c] border border-[#c15f3c]/25 flex items-center justify-center text-xs font-bold font-display">
                      {getInitials(worker.full_name)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-opsly-text">{worker.full_name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] text-opsly-secondary capitalize font-semibold px-2 py-0.5 bg-opsly-input rounded border border-opsly-border">
                        {worker.role || 'Inspector'}
                      </span>
                      {worker.role !== 'owner' && (
                        <span className="text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-950/20 border border-emerald-800/30 rounded">
                          Invited
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {worker.role !== 'owner' && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to remove ${worker.full_name}?`)) {
                        handleDeactivateWorker(worker.id)
                      }
                    }}
                    className="text-opsly-secondary hover:text-opsly-error p-1 bg-opsly-input hover:bg-opsly-error/10 border border-opsly-border rounded-lg transition-colors cursor-pointer"
                    title="Remove worker"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="border-t border-opsly-border pt-3 space-y-2 text-[11px] text-opsly-secondary leading-relaxed">
                {worker.email && <p><span className="font-semibold text-opsly-text">Email:</span> {worker.email}</p>}
                {worker.phone && <p><span className="font-semibold text-opsly-text">Phone:</span> {worker.phone}</p>}
                <p>
                  <span className="font-semibold text-opsly-text">Compensation:</span>{' '}
                  <span className="text-[#c15f3c] font-bold">${worker.compensation_rate}/hr</span>
                </p>
                {worker.role !== 'owner' && (
                  <button
                    onClick={() => {
                      setGeneratedInviteLink(`${window.location.origin}/signup?invite_token=INV-${worker.id}`)
                      setInviteModalOpen(true)
                    }}
                    className="text-opsly-accent hover:underline font-semibold block mt-1"
                  >
                    View Signup Link
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Link Simulation Modal */}
      <AnimatePresence>
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setInviteModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-opsly-card border border-opsly-border rounded-2xl w-full max-w-md p-6 relative shadow-2xl z-10 space-y-4"
            >
              <h3 className="text-sm font-bold text-opsly-text">Secure Worker Invitation Link</h3>
              <p className="text-xs text-opsly-secondary leading-relaxed">
                Share this secure portal connection token. When the tech clicks this, they will create their password and connect to your team dashboard.
              </p>
              
              <div className="p-3 bg-opsly-input border border-opsly-border rounded-lg text-xs break-all select-all font-mono text-opsly-accent">
                {generatedInviteLink}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedInviteLink)
                    onShowToast('Copied invite link!')
                    setInviteModalOpen(false)
                  }}
                  className="bg-[#c15f3c] hover:bg-[#a95232] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Copy &amp; Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
