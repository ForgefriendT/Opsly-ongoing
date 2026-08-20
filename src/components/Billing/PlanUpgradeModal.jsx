import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'

export default function PlanUpgradeModal({ isOpen, onClose, clientId, onUpgradeSuccess, currentPlan, currencySymbol = '$' }) {
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleUpgrade = async (planName) => {
    setLoadingPlan(planName)
    setError(null)
    try {
      const { error: err } = await supabase
        .from('clients')
        .update({ plan: planName })
        .eq('id', clientId)
      if (err) throw err
      onUpgradeSuccess(planName)
      onClose()
    } catch (e) {
      console.error(e)
      setError(`Upgrade to ${planName} failed. Please try again.`)
    } finally {
      setLoadingPlan(null)
    }
  }

  const plans = [
    {
      name: 'starter',
      label: 'Starter',
      price: `${currencySymbol}49`,
      desc: 'Essential toolkit for solo contractors.',
      features: [
        'Unlimited Invoices & Estimates',
        'Full CRM — unlimited contacts',
        'Expense Tracking with Receipts',
        'Job Scheduling & Calendar',
        'Late Payment Chasers (Day 3, 7, 14)',
        'Auto Invoice Numbering & PDF',
        '500 AI Commands / month',
        '1 User · 2 GB Storage',
        'Email Support (48hr)'
      ],
      color: 'border-opsly-border',
      badge: null,
      highlight: false
    },
    {
      name: 'growth',
      label: 'Growth',
      price: `${currencySymbol}99`,
      desc: 'For growing teams that need comms, analytics, and docs.',
      features: [
        'Everything in Starter',
        'Business Analytics & Reports',
        'Inbox & Communication Logs',
        'Documents, Contracts & Scope of Work',
        'Automated Follow-up Sequences',
        'Customer Review Requests',
        'Niche ERP Layout (Roofing, HVAC...)',
        '1,500 AI Commands / month',
        '3 Users · 10 GB Storage',
        'Email Support (24hr)'
      ],
      color: 'border-[#c15f3c]/40',
      badge: 'Best Value',
      highlight: false
    },
    {
      name: 'pro',
      label: 'Pro',
      price: `${currencySymbol}199`,
      desc: 'Advanced automation, portal access, and deep reporting.',
      features: [
        'Everything in Growth',
        'Enhanced Client Portal (client login)',
        'Advanced P&L, Cash Flow & AR Aging',
        'Photo Job Documentation',
        'Voice Note Estimate Generator',
        'GPS Job Check-in & Route Optimiser',
        'QuickBooks & Zapier Integration',
        '5,000 AI Commands / month',
        '10 Users · 50 GB Storage',
        'Priority Support (4hr) + Monthly Call'
      ],
      color: 'border-[#c15f3c] shadow-lg shadow-[#c15f3c]/10',
      badge: 'Most Popular',
      highlight: true
    },
    {
      name: 'business',
      label: 'Business',
      price: `${currencySymbol}399`,
      desc: 'Multi-location management and crew tools.',
      features: [
        'Everything in Pro',
        'Multi-Location Dashboard',
        'Unlimited Users',
        'Crew Mobile PWA',
        'Subcontractor Portal',
        'Custom Report Builder',
        'Bulk Document Operations',
        '15,000 AI Commands / month',
        'Unlimited Storage',
        'WhatsApp Support · 99.5% SLA'
      ],
      color: 'border-opsly-border/60',
      badge: null,
      highlight: false
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 bg-[#0f0e0d]/90 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-6xl bg-[#161514] border border-opsly-border rounded-2xl shadow-2xl p-6 md:p-8 relative overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#c15f3c]/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-opsly-accent/5 blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-opsly-secondary hover:text-opsly-text p-1 bg-opsly-input hover:bg-opsly-hover border border-opsly-border rounded-lg transition-colors cursor-pointer z-20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative z-10 space-y-7">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c15f3c]/15 text-[#c15f3c] rounded-full text-[10px] font-bold uppercase tracking-wider">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" />
              </svg>
              Choose Your Plan
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-opsly-text tracking-tight">Upgrade Your Opsly Portal</h2>
            <p className="text-xs text-opsly-secondary max-w-lg mx-auto">
              Every plan includes your full business portal. Upgrade or downgrade any time — your data is always safe.
            </p>
          </div>

          {error && (
            <div className="text-[11px] text-opsly-error bg-opsly-error/10 border border-opsly-error/25 rounded-lg py-2 px-3 text-center max-w-md mx-auto">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans.map((p) => {
              const isCurrent = currentPlan === p.name
              return (
                <div
                  key={p.name}
                  className={`bg-[#1c1a19]/80 border rounded-2xl p-5 flex flex-col justify-between relative transition-all duration-300 hover:-translate-y-1 ${p.color} ${p.highlight ? 'ring-1 ring-[#c15f3c]/30' : ''}`}
                >
                  {p.badge && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 bg-[#c15f3c] text-white text-[9px] font-black uppercase rounded tracking-wider">
                      {p.badge}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-opsly-accent/20 text-opsly-accent text-[9px] font-black uppercase rounded border border-opsly-accent/30">
                      Current
                    </span>
                  )}

                  <div className="space-y-4">
                    <div className={isCurrent || p.badge ? 'pt-5' : ''}>
                      <h3 className="text-sm font-bold text-opsly-text">{p.label}</h3>
                      <p className="text-[10px] text-opsly-secondary mt-1 leading-relaxed">{p.desc}</p>
                    </div>

                    <div className="flex items-baseline gap-1 py-2 border-b border-opsly-border">
                      <span className="text-2xl font-black text-[#c15f3c]">{p.price}</span>
                      <span className="text-[10px] text-opsly-secondary">/month</span>
                    </div>

                    <div className="space-y-2">
                      {p.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[11px] text-opsly-text">
                          <svg className="w-3.5 h-3.5 text-[#c15f3c] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="leading-tight">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-5">
                    <button
                      onClick={() => handleUpgrade(p.name)}
                      disabled={loadingPlan !== null || isCurrent}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                        isCurrent
                          ? 'bg-opsly-input text-opsly-muted border border-opsly-border cursor-not-allowed'
                          : p.highlight
                          ? 'bg-[#c15f3c] hover:bg-[#a95232] text-white shadow-lg shadow-[#c15f3c]/20'
                          : 'bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-text'
                      }`}
                    >
                      {loadingPlan === p.name ? 'Processing...' : isCurrent ? '✓ Current Plan' : `Choose ${p.label}`}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* AI CA Add-on */}
          <div className="bg-[#1c1a19]/60 border border-opsly-accent/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-opsly-accent/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-opsly-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-opsly-text">AI CA Add-on</p>
                  <span className="px-1.5 py-0.5 bg-opsly-accent/15 text-opsly-accent text-[9px] font-bold uppercase rounded tracking-wider border border-opsly-accent/20">Pro & Above</span>
                </div>
                <p className="text-[11px] text-opsly-secondary mt-0.5">
                  +{currencySymbol}19/month — AI reads your invoices & expenses, estimates tax liability, tracks income vs. costs, and flags unusual spending.
                </p>
                <p className="text-[10px] text-opsly-muted mt-0.5 italic">For informational guidance only. Consult a licensed accountant before filing taxes.</p>
              </div>
            </div>
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={['pro', 'business', 'enterprise', 'custom'].includes(currentPlan)}
              className="px-4 py-2 bg-opsly-accent hover:bg-opsly-accent-hover text-white text-xs font-bold rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
            >
              {['pro', 'business', 'enterprise', 'custom'].includes(currentPlan) ? '✓ Available on your plan' : 'Upgrade to Access'}
            </button>
          </div>

          {/* Custom/Enterprise */}
          <div className="text-center py-3 border-t border-opsly-border">
            <p className="text-xs text-opsly-secondary">
              Need a dedicated instance, white-label, or custom integrations?{' '}
              <span className="text-[#c15f3c] font-semibold">Custom / Enterprise from {currencySymbol}999/mo + build fee.</span>
              {' '}Contact us at{' '}
              <a href="mailto:hello@opsly.com" className="underline text-opsly-accent hover:text-opsly-accent-hover">hello@opsly.com</a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
