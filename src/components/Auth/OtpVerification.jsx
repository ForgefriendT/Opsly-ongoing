import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'

export default function OtpVerification({ onVerificationComplete, signupData }) {
  const { verifyPhoneOTP } = useAuth()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Please enter a 6-digit verification code.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await verifyPhoneOTP(code, signupData?.clientData?.client_id)
      setSuccess(true)
      setTimeout(() => {
        onVerificationComplete()
      }, 1500)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Verification failed. Enter 123456 to simulate success.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-opsly-base flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md bg-opsly-card border border-opsly-border rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        style={{
          background: 'rgba(44, 44, 41, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-opsly-accent/15 flex items-center justify-center mb-4 text-opsly-accent">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-opsly-text tracking-tight">Verify Phone Number</h2>
          <p className="text-opsly-secondary text-xs text-center mt-2">
            Enter the 6-digit code sent to your phone to prevent multi-account abuse.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-3 rounded-lg bg-opsly-error/15 border border-opsly-error/30 text-opsly-error text-xs font-medium text-center"
          >
            {error}
          </motion.div>
        )}

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-lg bg-opsly-success/15 border border-opsly-success/30 text-opsly-success text-sm font-medium text-center"
          >
            ✓ Verification Successful! Accessing portal...
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-opsly-secondary mb-1.5 uppercase tracking-wider text-center">
                6-Digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full bg-opsly-input border border-opsly-border text-opsly-text text-2xl tracking-[0.5em] text-center rounded-lg py-3 outline-none focus:border-opsly-accent focus:ring-1 focus:ring-opsly-accent transition-all duration-150"
              />
              <p className="text-[10px] text-opsly-muted mt-2 text-center">
                * Simulated Environment: Enter <span className="font-semibold text-opsly-accent">123456</span> to succeed.
              </p>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01, brightness: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text font-medium py-3 px-4 rounded-lg text-sm shadow-md cursor-pointer transition-all duration-150 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Verify & Continue'
              )}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
