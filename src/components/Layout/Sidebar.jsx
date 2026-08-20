import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useFeatureAccess } from '../../hooks/useFeatureAccess'

export default function Sidebar({ activeTab, setActiveTab }) {
  const { currentClient, currentUserProfile, logout, currentNicheConfig } = useAuth()
  const { hasAccess } = useFeatureAccess()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showLabels, setShowLabels] = useState(true)

  const overrideText = (defaultText, key) => {
    return currentNicheConfig?.terminology_overrides?.[key] || defaultText
  }

  // Manage label visibility based on expand/collapse progress
  // Labels fade in after width reaches ~80% (i.e. near the end of expand)
  // When collapsing, labels fade out immediately
  useEffect(() => {
    if (!isCollapsed) {
      const timer = setTimeout(() => setShowLabels(true), 150)
      return () => clearTimeout(timer)
    } else {
      setShowLabels(false)
    }
  }, [isCollapsed])

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'ai_assistant',
      label: 'AI Assistant',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gate: 'ai_assistant'
    },
    {
      id: 'clients',
      label: overrideText('Clients', 'contacts'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'jobs',
      label: overrideText('Jobs', 'jobs'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      gate: 'scheduling'
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'estimates',
      label: 'Estimates',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gate: 'estimates'
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gate: 'expenses'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gate: 'documents'
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      gate: 'analytics'
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      gate: 'inbox'
    },
    {
      id: 'workers',
      label: 'Team & Inspectors',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      gate: 'workers'
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      gate: 'reviews'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ]

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <motion.aside
      className="hidden md:flex flex-col bg-opsly-sidebar border-r border-opsly-border h-screen fixed left-0 top-0 p-4 z-30"
      animate={{ width: isCollapsed ? 76 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Brand logo & Collapse trigger */}
      <div className={`flex items-center justify-between mb-8 ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}>
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-8 h-8 flex-shrink-0">
                <defs>
                  <radialGradient id="star-grad-sidebar" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#e8926e" />
                    <stop offset="100%" stopColor="#b05a3a" />
                  </radialGradient>
                  <mask id="circle-cutout-sidebar">
                    <rect width="32" height="32" fill="white" />
                    <circle cx="16" cy="16" r="5" fill="black" />
                  </mask>
                </defs>
                <path d="M 16 2 L 17.7 11.9 L 23.8 8.2 L 20.1 14.3 L 30 16 L 20.1 17.7 L 23.8 23.8 L 17.7 20.1 L 16 30 L 14.3 20.1 L 8.2 23.8 L 11.9 17.7 L 2 16 L 11.9 14.3 L 8.2 8.2 L 14.3 11.9 Z" fill="url(#star-grad-sidebar)" mask="url(#circle-cutout-sidebar)" />
              </svg>
              <span className="text-xl font-bold tracking-tight text-opsly-text">opsly</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-muted hover:text-opsly-text cursor-pointer transition-all duration-150"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-4 h-4 transform transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id
          const hasFeature = !item.gate || hasAccess(item.gate)

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center relative py-2.5 px-3 rounded-lg text-sm transition-all duration-200 cursor-pointer group select-none text-left"
            >
              {/* Active Indicator Pill */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-pill"
                  className="absolute inset-0 bg-opsly-accent-soft rounded-lg border-l-[3px] border-opsly-accent pointer-events-none"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div
                className={`relative z-10 flex-shrink-0 transition-colors duration-150 ${
                  isActive
                    ? 'text-opsly-accent'
                    : 'text-opsly-secondary group-hover:text-opsly-text'
                }`}
              >
                {item.icon}
              </div>

              {/* Label */}
              <AnimatePresence>
                {!isCollapsed && showLabels && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`ml-3 relative z-10 font-medium truncate flex-1 flex items-center justify-between ${
                      isActive
                        ? 'text-opsly-text'
                        : 'text-opsly-secondary group-hover:text-opsly-text'
                    }`}
                  >
                    <span>{item.label}</span>
                    
                    {/* Lock indicator for plan-gated features */}
                    {!hasFeature && (
                      <svg className="w-3.5 h-3.5 text-opsly-muted group-hover:text-opsly-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-150 bg-opsly-card border border-opsly-border text-opsly-text text-xs rounded px-2.5 py-1.5 shadow-xl font-medium z-50 whitespace-nowrap pointer-events-none origin-left flex items-center gap-1.5">
                  {item.label}
                  {!hasFeature && (
                    <svg className="w-3.5 h-3.5 text-opsly-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* User profile footer */}
      <div className="border-t border-opsly-border pt-4 mt-auto">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center px-0 mb-1' : 'px-2 mb-3'}`}>
          <div className="w-9 h-9 rounded-full bg-opsly-input border border-opsly-border flex items-center justify-center font-bold text-opsly-accent flex-shrink-0 select-none">
            {currentUserProfile?.full_name?.split(' ').map(n => n[0]).join('') || 'O'}
          </div>
          
          <AnimatePresence>
            {!isCollapsed && showLabels && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-semibold text-opsly-text truncate">
                  {currentUserProfile?.full_name || 'Owner'}
                </p>
                <p className="text-xs text-opsly-muted truncate">
                  {currentClient?.business_name || 'Portal'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={logout}
          className={`w-full bg-opsly-input border border-opsly-border hover:bg-opsly-hover hover:border-opsly-error/30 hover:text-opsly-error text-xs py-2 rounded-lg font-medium cursor-pointer transition-all duration-200 flex items-center justify-center ${
            isCollapsed ? 'px-0' : 'px-2'
          }`}
          title="Log Out"
        >
          {isCollapsed ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          ) : (
            'Log Out'
          )}
        </button>
      </div>
    </motion.aside>
  )
}
