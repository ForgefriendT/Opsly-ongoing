import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'

export default function Step2BusinessDetails({ clientId, onComplete }) {
  const [address, setAddress] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const validateEmail = (email) => {
    if (!email) return true // optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async () => {
    if (!address.trim()) {
      setError('Please enter your business address.')
      return
    }

    if (businessEmail && !validateEmail(businessEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const updates = {
        business_address: address.trim(),
        business_phone: businessPhone.trim() || null,
        business_email: businessEmail.trim() || null,
        business_website: website.trim() || null,
        onboarding_step_completed: 3
      }

      const { error: updateErr } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)

      if (updateErr) throw updateErr

      onComplete(updates)
    } catch (err) {
      console.error('Save failed:', err)
      setError('Something went wrong saving your details. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-5"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-opsly-text tracking-tight">Business Details</h2>
        <p className="text-xs text-opsly-secondary mt-1.5">
          This information appears on your invoices and documents.
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

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <label className="text-xs font-semibold text-opsly-secondary uppercase tracking-wider">
            Business Address
          </label>
          <span className="text-[10px] font-medium text-opsly-accent bg-opsly-accent-soft px-1.5 py-0.5 rounded">Required</span>
        </div>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main Street, Suite 200, Austin, TX 78701"
          rows={2}
          className="w-full bg-opsly-input border border-opsly-border text-opsly-text text-sm rounded-lg px-4 py-2.5 outline-none focus:border-opsly-accent focus:ring-1 focus:ring-opsly-accent transition-all duration-150 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-opsly-secondary mb-1.5 uppercase tracking-wider">
          Business Phone
        </label>
        <input
          type="tel"
          value={businessPhone}
          onChange={(e) => setBusinessPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
          className="w-full bg-opsly-input border border-opsly-border text-opsly-text text-sm rounded-lg px-4 py-2.5 outline-none focus:border-opsly-accent focus:ring-1 focus:ring-opsly-accent transition-all duration-150"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-opsly-secondary mb-1.5 uppercase tracking-wider">
          Business Email
        </label>
        <input
          type="email"
          value={businessEmail}
          onChange={(e) => setBusinessEmail(e.target.value)}
          placeholder="hello@yourbusiness.com"
          className="w-full bg-opsly-input border border-opsly-border text-opsly-text text-sm rounded-lg px-4 py-2.5 outline-none focus:border-opsly-accent focus:ring-1 focus:ring-opsly-accent transition-all duration-150"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-opsly-secondary mb-1.5 uppercase tracking-wider">
          Website
        </label>
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://yourbusiness.com"
          className="w-full bg-opsly-input border border-opsly-border text-opsly-text text-sm rounded-lg px-4 py-2.5 outline-none focus:border-opsly-accent focus:ring-1 focus:ring-opsly-accent transition-all duration-150"
        />
      </div>

      <motion.button
        onClick={handleSubmit}
        disabled={saving}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text font-medium py-3 px-4 rounded-lg text-sm shadow-md cursor-pointer transition-all duration-150 flex items-center justify-center gap-2 mt-2"
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
