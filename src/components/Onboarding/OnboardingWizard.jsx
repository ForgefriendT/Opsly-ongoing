import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Step1LogoUpload from './Step1LogoUpload'
import Step2BusinessDetails from './Step2BusinessDetails'
import Step3NicheSelection from './Step3NicheSelection'
import Step4StripeConnect from './Step4StripeConnect'

const STEPS = [
  { id: 1, label: 'Brand' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Industry' },
  { id: 4, label: 'Payments' }
]

export default function OnboardingWizard({ clientId, clientPlan, currentStep, onStepComplete, onDismiss }) {
  // Determine which step to show based on onboarding_step_completed
  // Step 1 = onboarding_step_completed was 1 (phone verified), needs to do logo upload
  // Step 2 = onboarding_step_completed was 2, needs business details
  // Step 3 = onboarding_step_completed was 3, needs niche
  // Step 4 = onboarding_step_completed was 4, needs stripe
  const activeStepIndex = useMemo(() => {
    if (currentStep <= 1) return 0  // Step 1: Logo
    if (currentStep === 2) return 1 // Step 2: Details
    if (currentStep === 3) return 2 // Step 3: Niche
    if (currentStep === 4) return 3 // Step 4: Stripe
    return 4 // All done
  }, [currentStep])

  const [displayStep, setDisplayStep] = useState(activeStepIndex)

  const handleStepComplete = (updates) => {
    // Advance to next step
    const nextStep = displayStep + 1
    if (nextStep >= 4) {
      // All steps done
      onStepComplete(updates)
      onDismiss()
    } else {
      setDisplayStep(nextStep)
      onStepComplete(updates)
    }
  }

  const handleSkip = (updates) => {
    const nextStep = displayStep + 1
    if (nextStep >= 4) {
      onStepComplete(updates)
      onDismiss()
    } else {
      setDisplayStep(nextStep)
      onStepComplete(updates)
    }
  }

  // If onboarding is complete, don't render
  if (currentStep >= 5) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-opsly-base/80 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Wizard Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full max-w-lg bg-opsly-card border border-opsly-border rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(44, 44, 41, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        {/* Header with dismiss */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-6 h-6 flex-shrink-0">
              <defs>
                <radialGradient id="star-grad-onboard" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e8926e" />
                  <stop offset="100%" stopColor="#b05a3a" />
                </radialGradient>
                <mask id="circle-cutout-onboard">
                  <rect width="32" height="32" fill="white" />
                  <circle cx="16" cy="16" r="5" fill="black" />
                </mask>
              </defs>
              <path d="M 16 2 L 17.7 11.9 L 23.8 8.2 L 20.1 14.3 L 30 16 L 20.1 17.7 L 23.8 23.8 L 17.7 20.1 L 16 30 L 14.3 20.1 L 8.2 23.8 L 11.9 17.7 L 2 16 L 11.9 14.3 L 8.2 8.2 L 14.3 11.9 Z" fill="url(#star-grad-onboard)" mask="url(#circle-cutout-onboard)" />
            </svg>
            <span className="text-sm font-semibold text-opsly-text tracking-tight">Set up your portal</span>
          </div>
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-full bg-opsly-input hover:bg-opsly-hover border border-opsly-border flex items-center justify-center text-opsly-muted hover:text-opsly-text cursor-pointer transition-all duration-150"
            title="Finish later"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-1">
            {STEPS.map((step, i) => {
              const isCompleted = i < displayStep
              const isCurrent = i === displayStep
              return (
                <div key={step.id} className="flex-1 flex flex-col items-center gap-1.5">
                  {/* Progress segment */}
                  <div className="w-full h-1 rounded-full overflow-hidden bg-opsly-input">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: isCompleted ? '100%' : isCurrent ? '50%' : '0%',
                        backgroundColor: isCompleted ? 'var(--accent)' : isCurrent ? 'var(--accent)' : 'transparent'
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                  {/* Step label */}
                  <span className={`text-[10px] font-medium ${
                    isCompleted ? 'text-opsly-accent' : isCurrent ? 'text-opsly-text' : 'text-opsly-muted'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 pb-6 max-h-[65vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {displayStep === 0 && (
              <Step1LogoUpload
                key="step1"
                clientId={clientId}
                onComplete={handleStepComplete}
              />
            )}
            {displayStep === 1 && (
              <Step2BusinessDetails
                key="step2"
                clientId={clientId}
                onComplete={handleStepComplete}
              />
            )}
            {displayStep === 2 && (
              <Step3NicheSelection
                key="step3"
                clientId={clientId}
                clientPlan={clientPlan}
                onComplete={handleStepComplete}
                onSkip={handleSkip}
              />
            )}
            {displayStep === 3 && (
              <Step4StripeConnect
                key="step4"
                clientId={clientId}
                onComplete={handleStepComplete}
                onSkip={handleSkip}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
