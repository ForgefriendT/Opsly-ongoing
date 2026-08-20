import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'

const NICHES = [
  {
    id: 'contractor',
    label: 'Contractor',
    description: 'Plumbing, roofing, electrical, general contracting',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    )
  },
  {
    id: 'landscaper',
    label: 'Landscaper',
    description: 'Lawn care, garden design, maintenance',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    )
  },
  {
    id: 'cleaner',
    label: 'Cleaner',
    description: 'Residential & commercial cleaning',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    id: 'hvac',
    label: 'HVAC',
    description: 'Heating, ventilation, air conditioning',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    id: 'painter',
    label: 'Painter',
    description: 'Interior & exterior painting',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    )
  },
  {
    id: 'salon',
    label: 'Salon / Spa',
    description: 'Hair, beauty, wellness services',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
]

export default function Step3NicheSelection({ clientId, clientPlan, onComplete, onSkip }) {
  const [selectedNiche, setSelectedNiche] = useState(null)
  const [customNiche, setCustomNiche] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Free and Starter plans get generic layout auto-assigned (Section 8/11)
  const isEligible = !['free', 'starter'].includes(clientPlan || 'free')

  const handleSelect = async (nicheId) => {
    if (nicheId === selectedNiche) {
      setSelectedNiche(null)
      return
    }
    setSelectedNiche(nicheId)
    setShowCustomInput(false)
    setCustomNiche('')
  }

  const handleOther = () => {
    setSelectedNiche(null)
    setShowCustomInput(true)
  }

  const handleSubmit = async () => {
    const niche = selectedNiche || (customNiche.trim() ? 'generic' : null)
    
    if (!niche && !showCustomInput) {
      setError('Please select a niche or skip this step.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const updates = {
        niche: niche || 'generic',
        onboarding_step_completed: 4
      }

      const { error: updateErr } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)

      if (updateErr) throw updateErr

      onComplete(updates)
    } catch (err) {
      console.error('Save failed:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    setSaving(true)
    try {
      const updates = {
        niche: 'generic',
        onboarding_step_completed: 4
      }
      const { error: updateErr } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)

      if (updateErr) throw updateErr
      onSkip(updates)
    } catch (err) {
      console.error('Skip failed:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Auto-assign generic for ineligible plans
  if (!isEligible) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="space-y-5 text-center"
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-opsly-text tracking-tight">Industry Layout</h2>
          <p className="text-xs text-opsly-secondary mt-1.5">
            Custom industry layouts are available on Growth plans and above.
          </p>
        </div>

        <div className="p-5 bg-opsly-input border border-opsly-border rounded-xl">
          <p className="text-sm text-opsly-text font-medium mb-1">You're set up with the standard layout</p>
          <p className="text-xs text-opsly-secondary">
            Upgrade to Growth to unlock niche-specific dashboards, labels, and workflows tailored to your industry.
          </p>
        </div>

        <motion.button
          onClick={handleSkip}
          disabled={saving}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text font-medium py-3 px-4 rounded-lg text-sm shadow-md cursor-pointer transition-all duration-150 flex items-center justify-center gap-2"
        >
          {saving ? (
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          ) : (
            'Continue'
          )}
        </motion.button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-5"
    >
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold text-opsly-text tracking-tight">What's Your Industry?</h2>
        <p className="text-xs text-opsly-secondary mt-1.5">
          Opsly will customise your dashboard, labels, and AI to match how your business works.
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-lg bg-opsly-error/15 border border-opsly-error/30 text-opsly-error text-xs font-medium text-center"
        >
          {error}
        </motion.div>
      )}

      {/* Niche Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {NICHES.map((niche) => {
          const isSelected = selectedNiche === niche.id
          return (
            <motion.button
              key={niche.id}
              onClick={() => handleSelect(niche.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-opsly-accent-soft border-opsly-accent text-opsly-accent'
                  : 'bg-opsly-input border-opsly-border hover:border-opsly-accent/40 text-opsly-secondary hover:text-opsly-text'
              }`}
            >
              <div className={`mb-2 ${isSelected ? 'text-opsly-accent' : 'text-opsly-muted'}`}>
                {niche.icon}
              </div>
              <p className={`text-sm font-medium ${isSelected ? 'text-opsly-text' : ''}`}>{niche.label}</p>
              <p className="text-[10px] text-opsly-muted mt-0.5 leading-relaxed">{niche.description}</p>
            </motion.button>
          )
        })}
      </div>

      {/* Other / Custom */}
      {showCustomInput ? (
        <div>
          <label className="block text-xs font-semibold text-opsly-secondary mb-1.5 uppercase tracking-wider">
            Describe Your Business
          </label>
          <input
            type="text"
            value={customNiche}
            onChange={(e) => setCustomNiche(e.target.value)}
            placeholder="e.g., Mobile pet grooming"
            className="w-full bg-opsly-input border border-opsly-border text-opsly-text text-sm rounded-lg px-4 py-2.5 outline-none focus:border-opsly-accent focus:ring-1 focus:ring-opsly-accent transition-all duration-150"
            autoFocus
          />
          <p className="text-[10px] text-opsly-muted mt-1">
            We'll match you to the closest layout. You can change this later in Settings.
          </p>
        </div>
      ) : (
        <button
          onClick={handleOther}
          className="w-full p-3 bg-opsly-input border border-dashed border-opsly-border hover:border-opsly-accent/40 rounded-xl text-xs text-opsly-secondary hover:text-opsly-text cursor-pointer transition-all duration-200"
        >
          Something else? Describe your business →
        </button>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSkip}
          disabled={saving}
          className="flex-1 bg-opsly-input border border-opsly-border hover:bg-opsly-hover text-opsly-text text-sm py-3 rounded-lg font-medium cursor-pointer transition-all duration-150"
        >
          I'll choose later
        </button>
        <motion.button
          onClick={handleSubmit}
          disabled={saving || (!selectedNiche && !customNiche.trim())}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text font-medium py-3 px-4 rounded-lg text-sm shadow-md cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          ) : (
            'Continue'
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}
