import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'

export default function ForgotPassword({ onNavigate, mode = 'request' }) {
  const { resetPassword, updatePassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Parse URL redirect errors on mount
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const searchParams = new URLSearchParams(window.location.search)

    const errorDesc = hashParams.get('error_description') || searchParams.get('error_description')
    const errorCode = hashParams.get('error_code') || searchParams.get('error_code')
    const errorMsg = hashParams.get('error') || searchParams.get('error')

    if (errorDesc) {
      setError(decodeURIComponent(errorDesc).replace(/\+/g, ' '))
    } else if (errorCode) {
      if (errorCode === 'otp_expired') {
        setError('The password recovery link has expired or has already been used. Please request a new link.')
      } else {
        setError(`Error: ${errorCode}`)
      }
    } else if (errorMsg) {
      setError(errorMsg)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      if (mode === 'request') {
        if (!email.trim()) {
          setError('Please enter your email.')
          setLoading(false)
          return
        }
        await resetPassword(email)
        setSuccess(true)
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.')
          setLoading(false)
          return
        }
        await updatePassword(password)
        setSuccess(true)
        setTimeout(() => {
          onNavigate('login')
        }, 2000)
      }
    } catch (err) {
      console.error(err)
      if (err.message?.includes('rate limit')) {
        setError('Too many requests. Please wait a few minutes before trying again.')
      } else {
        setError('Something went wrong on our end. Your data is safe — try again in a moment.')
      }
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-opsly-text tracking-tight">
            {mode === 'request' ? 'Reset Password' : 'Enter New Password'}
          </h2>
          <p className="text-opsly-secondary text-xs text-center mt-2">
            {mode === 'request'
              ? 'We will send you a recovery link to access your portal.'
              : 'Choose a strong password to secure your account.'}
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
            {mode === 'request'
              ? '✓ Check your email for the password recovery link!'
              : '✓ Password updated successfully! Redirecting to login...'}
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'request' ? (
              <div>
                <label className="block text-xs font-semibold text-opsly-secondary mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text text-sm rounded-lg px-4 py-3 outline-none focus:border-opsly-accent focus:ring-1 focus:ring-opsly-accent transition-all duration-150"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-opsly-secondary mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (Min 6 chars)"
                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text text-sm rounded-lg px-4 py-3 outline-none focus:border-opsly-accent focus:ring-1 focus:ring-opsly-accent transition-all duration-150"
                />
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01, brightness: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text font-medium py-3 px-4 rounded-lg text-sm shadow-md cursor-pointer transition-all duration-150 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              ) : mode === 'request' ? (
                'Send Recovery Email'
              ) : (
                'Update Password'
              )}
            </motion.button>
          </form>
        )}

        {mode === 'request' && (
          <div className="mt-6 pt-5 border-t border-opsly-border text-center">
            <button
              onClick={() => onNavigate('login')}
              className="text-xs text-opsly-accent hover:text-opsly-accent-hover font-semibold cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
