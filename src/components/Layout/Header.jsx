import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function Header({ onAction, onSettingsClick }) {
  const { currentClient, currentUserProfile } = useAuth()
  const [usageCount, setUsageCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Welcome to Opsly!',
      desc: 'Type a command in the AI box at the bottom of the screen to start.',
      time: 'Just now',
      read: false
    }
  ])

  // Get plan limit based on plan
  const plan = currentClient?.plan || 'free'
  const planLimits = {
    free: 30,
    starter: 500,
    growth: 1500,
    pro: 5000,
    business: 15000,
    enterprise: 999999,
    custom: 999999
  }
  const limit = planLimits[plan] ?? 30

  // Format plan names for display
  const formatPlanName = (p) => p.toUpperCase()

  // Fetch month-to-date AI command usage from Supabase
  useEffect(() => {
    if (!currentClient?.id) return

    const fetchUsage = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_client_monthly_tokens', { p_client_id: currentClient.id })

        if (error) throw error
        if (data && data.length > 0) {
          const totalTokens = Number(data[0].total_input || 0) + Number(data[0].total_output || 0)
          setUsageCount(Math.floor(totalTokens / 2500))
        } else {
          setUsageCount(0)
        }
      } catch (err) {
        console.warn('Error fetching usage counter:', err)
      }
    }

    fetchUsage()

    // Listen for inserts in the `ai_usage` table to update the counter in real-time
    const channel = supabase
      .channel('ai_usage_counter')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_usage',
          filter: `client_id=eq.${currentClient.id}`
        },
        () => {
          fetchUsage()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentClient?.id])

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    onAction?.('Marked all notifications as read')
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="h-16 border-b border-opsly-border flex items-center justify-between px-6 md:px-8 bg-opsly-base relative z-20 select-none">
      
      {/* Brand title on desktop / Mobile spacer */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger button placeholder - mobile layout will manage it if needed */}
        <h2 className="hidden md:block text-base font-semibold tracking-tight text-opsly-text">
          {currentClient?.business_name || 'My Portal'}
        </h2>
      </div>

      {/* Stats, notifications, and profile card */}
      <div className="flex items-center gap-4">
        
        {/* Usage limits counter */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-opsly-input border border-opsly-border text-xs text-opsly-secondary font-medium">
          <span className="font-semibold text-opsly-accent">{usageCount} / {limit === 999999 ? '∞' : limit}</span>
          <span className="text-opsly-muted">commands</span>
          
          <span className="h-3 w-px bg-opsly-border mx-1" />

          {/* Plan badge */}
          <span className="text-[9px] font-bold text-opsly-accent uppercase tracking-wider">
            {formatPlanName(plan)}
          </span>
        </div>

        {/* Notifications Dropdown Container */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="p-2 rounded-full hover:bg-opsly-hover text-opsly-secondary hover:text-opsly-text cursor-pointer relative transition-all duration-150 border border-transparent focus:border-opsly-border"
            title="View notifications"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            
            {/* Bell unread dot */}
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-opsly-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-opsly-accent"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Click outside backdrop */}
                <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-3 w-80 md:w-96 rounded-xl border border-opsly-border shadow-2xl z-40 overflow-hidden"
                  style={{
                    background: 'rgba(44, 44, 41, 0.96)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
                  }}
                >
                  {/* Dropdown Header */}
                  <div className="px-5 py-3.5 border-b border-opsly-border flex items-center justify-between bg-opsly-base/30">
                    <span className="text-xs font-semibold text-opsly-text uppercase tracking-wider">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] font-semibold text-opsly-accent hover:text-opsly-accent-hover cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Notification items list */}
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-opsly-border">
                    {notifications.length === 0 ? (
                      <div className="px-5 py-8 text-center">
                        <p className="text-xs text-opsly-muted">All caught up! No notifications.</p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 transition-colors duration-150 ${
                            item.read ? 'bg-transparent' : 'bg-opsly-accent-soft/5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs ${item.read ? 'text-opsly-text' : 'font-semibold text-opsly-text'}`}>
                                {item.title}
                              </p>
                              <p className="text-[11px] text-opsly-secondary mt-0.5 leading-relaxed">
                                {item.desc}
                              </p>
                              <span className="text-[9px] text-opsly-muted mt-1.5 block">
                                {item.time}
                              </span>
                            </div>
                            
                            {!item.read && (
                              <span className="h-1.5 w-1.5 bg-opsly-accent rounded-full mt-1.5 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User profile bubble — click opens Settings */}
        <button
          onClick={onSettingsClick}
          title="Account & Settings"
          className="w-8 h-8 rounded-full bg-opsly-input border border-opsly-border flex items-center justify-center font-bold text-opsly-accent text-xs hover:bg-opsly-hover hover:border-opsly-accent/40 cursor-pointer transition-all duration-150"
        >
          {currentUserProfile?.full_name?.split(' ').map(n => n[0]).join('') || 'O'}
        </button>

      </div>
    </header>
  )
}
