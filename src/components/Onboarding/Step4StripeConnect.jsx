import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'

export default function Step4StripeConnect({ clientId, onComplete, onSkip }) {
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  const handleConnect = async () => {
    // Stripe Connect OAuth requires server-side setup (Edge Function)
    // For now, simulate the flow and mark step as complete
    setConnecting(true)
    setError('')

    try {
      const updates = {
        onboarding_step_completed: 5
      }

      const { error: updateErr } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)

      if (updateErr) throw updateErr

      onComplete(updates)
    } catch (err) {
      console.error('Stripe connect failed:', err)
      setError('Something went wrong. Please try again or skip for now.')
    } finally {
      setConnecting(false)
    }
  }

  const handleSkip = async () => {
    setConnecting(true)
    try {
      const updates = {
        onboarding_step_completed: 5
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
      setConnecting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold text-opsly-text tracking-tight">Accept Online Payments</h2>
        <p className="text-xs text-opsly-secondary mt-1.5">
          Connect Stripe so your clients can pay invoices online with a "Pay Now" button.
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

      {/* Benefits card */}
      <div className="bg-opsly-input border border-opsly-border rounded-xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-opsly-accent-soft flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-opsly-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-opsly-text">Online invoice payments</p>
            <p className="text-xs text-opsly-secondary mt-0.5">Clients pay directly from the invoice with credit card or bank transfer.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-opsly-accent-soft flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-opsly-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-opsly-text">Secure and automatic</p>
            <p className="text-xs text-opsly-secondary mt-0.5">Payments are processed by Stripe. Invoices mark as paid automatically.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-opsly-accent-soft flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-opsly-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-opsly-text">Money goes straight to you</p>
            <p className="text-xs text-opsly-secondary mt-0.5">Opsly never touches your funds. Payments go directly to your Stripe account.</p>
          </div>
        </div>
      </div>

      {/* Not required notice */}
      <p className="text-[10px] text-opsly-muted text-center leading-relaxed">
        Stripe is optional. You can accept cash, bank transfers, or cheques and mark invoices paid manually. 
        You can connect Stripe anytime from Settings → Connected Accounts.
      </p>

      {/* Actions */}
      <div className="space-y-3">
        <motion.button
          onClick={handleConnect}
          disabled={connecting}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text font-medium py-3 px-4 rounded-lg text-sm shadow-md cursor-pointer transition-all duration-150 flex items-center justify-center gap-2"
        >
          {connecting ? (
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connect Stripe Account
            </>
          )}
        </motion.button>

        <button
          onClick={handleSkip}
          disabled={connecting}
          className="w-full bg-opsly-input border border-opsly-border hover:bg-opsly-hover text-opsly-text text-sm py-3 rounded-lg font-medium cursor-pointer transition-all duration-150"
        >
          I'll set this up later
        </button>
      </div>
    </motion.div>
  )
}
