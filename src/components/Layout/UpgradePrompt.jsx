import { motion } from 'framer-motion'

export default function UpgradePrompt({ featureInfo, currentPlan, onUpgradeClick }) {
  if (!featureInfo) return null

  const { label, desc, planRequired } = featureInfo

  // Capitalize plan names for presentation
  const formatPlanName = (p) => p.charAt(0).toUpperCase() + p.slice(1)

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-lg rounded-2xl p-8 border border-opsly-border relative overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(44, 44, 41, 0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        }}
      >
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-opsly-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-opsly-accent/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center">
          {/* Lock Icon */}
          <div className="w-14 h-14 rounded-full bg-opsly-accent/15 flex items-center justify-center mb-6 text-opsly-accent border border-opsly-accent/20">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <span className="text-[10px] font-bold text-opsly-accent uppercase tracking-widest bg-opsly-accent-soft px-3 py-1 rounded-full border border-opsly-accent/25 mb-3">
            {formatPlanName(planRequired)} Plan Feature
          </span>

          <h2 className="text-2xl font-semibold text-opsly-text tracking-tight mb-3">
            Unlock {label}
          </h2>

          <p className="text-opsly-secondary text-sm leading-relaxed max-w-sm mb-8">
            {desc} Upgrade your business portal to the <span className="font-semibold text-opsly-accent">{formatPlanName(planRequired)} plan</span> to unlock this module and supercharge your operations.
          </p>

          {/* Features checkmark list */}
          <div className="w-full text-left bg-opsly-base/35 border border-opsly-border rounded-xl p-5 mb-8 space-y-3.5">
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 text-opsly-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-opsly-text">Seamless Workspace Integration</p>
                <p className="text-[11px] text-opsly-secondary mt-0.5">Fully functional tab and natural language AI commands.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 text-opsly-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-opsly-text">Increased AI Limits &amp; Features</p>
                <p className="text-[11px] text-opsly-secondary mt-0.5">Unlock higher monthly command thresholds with lower overage rates.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <motion.button
              onClick={() => onUpgradeClick(planRequired)}
              whileHover={{ scale: 1.01, brightness: 1.1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text font-medium py-3 px-4 rounded-lg text-sm shadow-md cursor-pointer transition-all duration-150 flex items-center justify-center gap-2"
            >
              Upgrade to {formatPlanName(planRequired)}
            </motion.button>
            <p className="text-[10px] text-opsly-muted leading-relaxed">
              Your current plan is <span className="font-medium text-opsly-secondary">{formatPlanName(currentPlan)}</span>. Upgrade anytime, no locked contracts.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
