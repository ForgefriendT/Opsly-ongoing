import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'

export default function Login({ onNavigate }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await login(email, password)
    } catch (err) {
      console.error(err)
      // Human-friendly error translation (Section 14)
      if (err.message?.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.')
      } else if (err.message?.includes('rate limit')) {
        setError('Too many login attempts. Please wait a few minutes and try again.')
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
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-9 h-9 flex-shrink-0">
              <defs>
                <radialGradient id="star-grad-login" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e8926e" />
                  <stop offset="100%" stopColor="#b05a3a" />
                </radialGradient>
                <mask id="circle-cutout-login">
                  <rect width="32" height="32" fill="white" />
                  <circle cx="16" cy="16" r="5" fill="black" />
                </mask>
              </defs>
              <path d="M 16 2 L 17.7 11.9 L 23.8 8.2 L 20.1 14.3 L 30 16 L 20.1 17.7 L 23.8 23.8 L 17.7 20.1 L 16 30 L 14.3 20.1 L 8.2 23.8 L 11.9 17.7 L 2 16 L 11.9 14.3 L 8.2 8.2 L 14.3 11.9 Z" fill="url(#star-grad-login)" mask="url(#circle-cutout-login)" />
            </svg>
            <span className="text-3xl font-semibold tracking-tight text-opsly-text">opsly</span>
          </div>
          <p className="text-opsly-secondary text-sm text-center">Log in to your AI business operating system</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-3 rounded-lg bg-opsly-error/15 border border-opsly-error/30 text-opsly-error text-xs font-medium"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-opsly-secondary uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-xs text-opsly-accent hover:text-opsly-accent-hover font-medium cursor-pointer"
              >
                Forgot?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-opsly-input border border-opsly-border text-opsly-text text-sm rounded-lg px-4 py-3 outline-none focus:border-opsly-accent focus:ring-1 focus:ring-opsly-accent transition-all duration-150"
            />
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
              'Log In'
            )}
          </motion.button>
        </form>

        <div className="mt-8 pt-6 border-t border-opsly-border text-center">
          <p className="text-xs text-opsly-secondary">
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('signup')}
              className="text-opsly-accent hover:text-opsly-accent-hover font-semibold cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
