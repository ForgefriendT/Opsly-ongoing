import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'

export default function Signup({ onNavigate, onSignupSuccess }) {
  const { signup } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteBanner, setInviteBanner] = useState('')

  useState(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('invite_token')
    if (token) {
      setInviteBanner('You have been invited to join a team account! Complete registration below.')
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password.trim() || !businessName.trim() || !phone.trim()) {
      setError('Please fill in all fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await signup(email, password, fullName, businessName, phone)
      // Call success callback passing user and client details to advance to OTP verification
      onSignupSuccess(res)
    } catch (err) {
      console.error(err)
      if (err.message?.includes('already registered')) {
        setError('An account with this email already exists. Please log in.')
      } else if (err.message?.includes('rate limit')) {
        setError('Too many requests. Please wait a few minutes before trying again.')
      } else {
        setError('Something went wrong on our end. Your data is safe — try again in a moment.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-opsly-base flex flex-col items-center justify-center p-4 py-8">
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
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-3 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-9 h-9 flex-shrink-0">
              <defs>
                <radialGradient id="star-grad-signup" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e8926e" />
                  <stop offset="100%" stopColor="#b05a3a" />
                </radialGradient>
                <mask id="circle-cutout-signup">
                  <rect width="32" height="32" fill="white" />
                  <circle cx="16" cy="16" r="5" fill="black" />
                </mask>
              </defs>
              <path d="M 16 2 L 17.7 11.9 L 23.8 8.2 L 20.1 14.3 L 30 16 L 20.1 17.7 L 23.8 23.8 L 17.7 20.1 L 16 30 L 14.3 20.1 L 8.2 23.8 L 11.9 17.7 L 2 16 L 11.9 14.3 L 8.2 8.2 L 14.3 11.9 Z" fill="url(#star-grad-signup)" mask="url(#circle-cutout-signup)" />
            </svg>
            <span className="text-3xl font-semibold tracking-tight text-opsly-text">opsly</span>
          </div>
          <p className="text-opsly-secondary text-sm text-center">Create your free operating system portal</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-opsly-secondary mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Fauzan Baig"
              className="w-full bg-opsly-input border border-opsly-border text-opsly-text text-sm rounded-lg px-4 py-2.5 outline-none focus:border-opsly-accent focus:ring-1 focus:ring-opsly-accent transition-all duration-150"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-opsly-secondary mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="fauzan@agency.com"
              className="w-full bg-opsly-input border border-opsly-border text-opsly-text text-sm rounded-lg px-4 py-2.5 outline-none focus:border-opsly-accent focus:ring-1 focus:ring-opsly-accent transition-all duration-150"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-opsly-secondary mb-1.5 uppercase tracking-wider">
              Business Name
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Acme Operations"
              className="w-full bg-opsly-input border border-opsly-border text-opsly-text text-sm rounded-lg px-4 py-2.5 outline-none focus:border-opsly-accent focus:ring-1 focus:ring-opsly-accent transition-all duration-150"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-opsly-secondary mb-1.5 uppercase tracking-wider">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-opsly-input border border-opsly-border text-opsly-text text-sm rounded-lg px-4 py-2.5 outline-none focus:border-opsly-accent focus:ring-1 focus:ring-opsly-accent transition-all duration-150"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-opsly-secondary mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (Min 6 chars)"
              className="w-full bg-opsly-input border border-opsly-border text-opsly-text text-sm rounded-lg px-4 py-2.5 outline-none focus:border-opsly-accent focus:ring-1 focus:ring-opsly-accent transition-all duration-150"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01, brightness: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text font-medium py-3 px-4 rounded-lg text-sm shadow-md cursor-pointer transition-all duration-150 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Sign Up'
            )}
          </motion.button>
        </form>

        <div className="mt-6 pt-5 border-t border-opsly-border text-center">
          <p className="text-xs text-opsly-secondary">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-opsly-accent hover:text-opsly-accent-hover font-semibold cursor-pointer"
            >
              Log In
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
