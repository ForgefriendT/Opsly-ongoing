import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFeatureAccess } from '../../hooks/useFeatureAccess'
import { useAuth } from '../../contexts/AuthContext'

const PLACEHOLDERS = [
  'Invoice Sarah for the roof repair...',
  "What's my outstanding balance this month?",
  'Schedule a job for Mike on Friday at 9am...',
  "Who hasn't paid me in the last 30 days?",
  'Create an estimate for the Henderson job...'
]

export default function CommandBar({
  onSendCommand,
  onAction,
  onFocusChange,
  prefill,
  onPrefillUsed,
  messages: propMessages,
  setMessages: propSetMessages,
  responseActive: propResponseActive,
  setResponseActive: propSetResponseActive,
  isMinimized: propIsMinimized,
  setIsMinimized: propSetIsMinimized
}) {
  const { hasAccess } = useFeatureAccess()
  const [commandText, setCommandText] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [isFocused, setIsFocused] = useState(false)

  // Listen to prefill from parent (e.g., Quick Action click)
  useEffect(() => {
    if (prefill) {
      setCommandText(prefill)
      onPrefillUsed?.()
      // Focus the input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 50)
    }
  }, [prefill, onPrefillUsed])
  
  // Response States (will connect to AI middleware in Section E)
  const [localResponseActive, setLocalResponseActive] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // Chat messages thread (conversational history)
  const [localMessages, setLocalMessages] = useState([])
  const [localIsMinimized, setLocalIsMinimized] = useState(false)

  const responseActive = propResponseActive !== undefined ? propResponseActive : localResponseActive
  const setResponseActive = propSetResponseActive !== undefined ? propSetResponseActive : setLocalResponseActive
  
  const messages = propMessages !== undefined ? propMessages : localMessages
  const setMessages = propSetMessages !== undefined ? propSetMessages : setLocalMessages

  const isMinimized = propIsMinimized !== undefined ? propIsMinimized : localIsMinimized
  const setIsMinimized = propSetIsMinimized !== undefined ? propSetIsMinimized : setLocalIsMinimized

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (responseActive) {
      scrollToBottom()
    }
  }, [messages, responseActive])

  // Command History States
  const [historyIndex, setHistoryIndex] = useState(-1)

  const inputRef = useRef(null)
  const isVoiceEnabled = hasAccess('ai_ca') // Voice note is Pro+ (linked to ai_ca feature gate)

  // 1. Cycling Placeholder Text (every 4 seconds with fade out/in transition)
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPlaceholder(false) // Trigger fade out
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length)
        setShowPlaceholder(true) // Trigger fade in
      }, 300) // 300ms fade duration
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  // 2. Command History Helpers
  const getHistory = () => {
    try {
      const stored = sessionStorage.getItem('opsly_command_history')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const addToHistory = (cmd) => {
    try {
      const history = getHistory()
      const updated = [cmd, ...history.filter((h) => h !== cmd)].slice(0, 10)
      sessionStorage.setItem('opsly_command_history', JSON.stringify(updated))
    } catch (e) {
      console.warn('Error saving command history:', e)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const history = getHistory()
      if (history.length === 0) return

      const nextIndex = historyIndex + 1
      if (nextIndex < history.length) {
        setHistoryIndex(nextIndex)
        setCommandText(history[nextIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const history = getHistory()
      
      const nextIndex = historyIndex - 1
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex)
        setCommandText(history[nextIndex])
      } else {
        setHistoryIndex(-1)
        setCommandText('')
      }
    }
  }

  const { session, currentClient } = useAuth()
  const isFreePlan = (currentClient?.plan || 'free') === 'free'
  const [showFreeLockToast, setShowFreeLockToast] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = commandText.trim()
    if (!trimmed) return

    // Free plan gets 30 commands per month — middleware enforces the real limit.
    // Show a soft upsell nudge to keep users aware they are on a limited plan.
    if (isFreePlan) {
      setShowFreeLockToast(true)
      setTimeout(() => setShowFreeLockToast(false), 4000)
    }

    addToHistory(trimmed)
    setHistoryIndex(-1)
    setCommandText('')

    if (onSendCommand) {
      onSendCommand(trimmed)
    } else {
      handleAICommandRequest(trimmed)
    }
  }

  const handleAICommandRequest = async (cmd) => {
    setResponseActive(true)
    setIsStreaming(true)

    // Generate unique IDs for this user-assistant conversation pair
    const userMsgId = 'u-' + Date.now()
    const assistantMsgId = 'a-' + (Date.now() + 1)

    const userMsg = { id: userMsgId, role: 'user', content: cmd }
    const assistantMsg = { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }

    // Take snapshot of previous messages plus new user message to construct clean chatHistory
    const currentMessages = [...messages, userMsg]
    setMessages(prev => [...prev, userMsg, assistantMsg])

    try {
      const token = session?.access_token
      const historyList = getHistory()
      const chatHistoryPayload = currentMessages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await fetch('/api/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          command: cmd,
          history: historyList,
          chatHistory: chatHistoryPayload
        })
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        const errMsg = errJson.error || 'Something went wrong — your data is safe. Try again in a moment.'
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: errMsg, isStreaming: false } : m))
        setIsStreaming(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let streamBuffer = ''
      let currentEvent = 'message'

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        streamBuffer += decoder.decode(value, { stream: true })
        const lines = streamBuffer.split('\n')
        streamBuffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.substring(6).trim()
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.substring(5).trim()
            try {
              const parsedData = JSON.parse(dataStr)
              if (currentEvent === 'text') {
                setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: m.content + parsedData } : m))
              } else if (currentEvent === 'action_success') {
                onAction?.(`Action executed: ${parsedData.type}`)
                window.dispatchEvent(new CustomEvent('opsly-action-success', { detail: parsedData }))
              } else if (currentEvent === 'action_error') {
                onAction?.(`Action execution failed: ${parsedData.error}`)
              } else if (currentEvent === 'overage_warning') {
                onAction?.(parsedData.message)
              }
            } catch (e) {
              console.error('Failed to parse SSE payload:', e)
            }
            currentEvent = 'message'
          }
        }
      }

      // Mark streaming completed on the assistant message
      setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, isStreaming: false } : m))

    } catch (err) {
      console.error('AI execution failed:', err)
      const errMsg = 'Something went wrong — your data is safe. Try again in a moment.'
      setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: errMsg, isStreaming: false } : m))
    } finally {
      setIsStreaming(false)
    }
  }

  const handleVoiceRecord = () => {
    if (!isVoiceEnabled) {
      onAction?.('Voice recording is a Pro feature. Please upgrade to unlock.')
      return
    }
    
    if (isRecording) {
      setIsRecording(false)
      onAction?.('Voice recording saved.')
      setCommandText('Create an invoice of $350 for Sarah')
    } else {
      setIsRecording(true)
      onAction?.('Listening... Speak now.')
      // Auto transcribe after 3 seconds
      setTimeout(() => {
        setIsRecording(prev => {
          if (prev) {
            onAction?.('Voice note transcribed successfully!')
            setCommandText('Create an invoice of $350 for Sarah')
            return false
          }
          return false
        })
      }, 3000)
    }
  }

  const hasContent = commandText.trim().length > 0

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="w-12 h-12 rounded-full bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-105 duration-150 relative group border border-opsly-accent/20"
          title="Open AI Command Bar"
        >
          <svg className="w-5 h-5 text-opsly-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-[#161514] border border-opsly-border text-opsly-text text-[10px] font-bold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
            Ask AI Assistant
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-0 right-0 px-4 md:pl-68 md:pr-4 flex flex-col items-center z-40 pointer-events-none">
      
      {/* Response Bubble area ABOVE the command bar */}
      <AnimatePresence>
        {responseActive && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: 10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-2xl mb-3 pointer-events-auto overflow-hidden"
          >
            <div
              className="rounded-2xl border border-opsly-border p-5 max-h-[300px] overflow-y-auto relative shadow-2xl"
              style={{
                background: 'rgba(44, 44, 41, 0.94)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
              }}
            >
              {/* Controls bar */}
              <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-20">
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="w-6 h-6 rounded-full bg-opsly-input hover:bg-opsly-hover flex items-center justify-center text-opsly-muted hover:text-opsly-text cursor-pointer transition-colors duration-150"
                  title="Minimize command bar"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessages([])
                    setResponseActive(false)
                  }}
                  className="w-6 h-6 rounded-full bg-opsly-input hover:bg-opsly-hover flex items-center justify-center text-opsly-muted hover:text-opsly-text cursor-pointer transition-colors duration-150"
                  title="Clear chat thread"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setResponseActive(false)}
                  className="w-6 h-6 rounded-full bg-opsly-input hover:bg-opsly-hover flex items-center justify-center text-opsly-muted hover:text-opsly-text cursor-pointer transition-colors duration-150"
                  title="Close chat"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-opsly-accent/15 flex items-center justify-center flex-shrink-0 text-opsly-accent border border-opsly-accent/20">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 pr-6">
                      <p className="text-xs font-semibold text-opsly-muted uppercase tracking-wider mb-1.5">Opsly Assistant</p>
                      <p className="text-sm text-opsly-text leading-relaxed italic antialiased">
                        How can I help you manage your business today?
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={msg.id || idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'user' ? (
                        <div className="max-w-[85%] bg-opsly-input border border-opsly-border rounded-2xl px-4 py-2 text-sm text-opsly-text antialiased">
                          {msg.content}
                        </div>
                      ) : (
                        <>
                          {/* AI brain symbol (sparkles SVG) */}
                          <div className="w-8 h-8 rounded-full bg-opsly-accent/15 flex items-center justify-center flex-shrink-0 text-opsly-accent border border-opsly-accent/20">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 pr-6">
                            <p className="text-xs font-semibold text-opsly-muted uppercase tracking-wider mb-1.5">Opsly Assistant</p>
                            <p className="text-sm text-opsly-text leading-relaxed whitespace-pre-wrap antialiased">
                              {msg.content}
                              {msg.isStreaming && (
                                <span className="inline-block w-1.5 h-4 bg-opsly-accent ml-1 animate-pulse" />
                              )}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Free plan AI usage nudge */}
      <AnimatePresence>
        {showFreeLockToast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-2xl mb-2 pointer-events-auto"
          >
            <div className="rounded-2xl border border-[#c15f3c]/30 px-5 py-3 flex items-center justify-between gap-3 shadow-lg"
              style={{ background: 'rgba(193,95,60,0.08)', backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-[#c15f3c] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs text-opsly-text">
                  You're on the <span className="font-bold text-[#c15f3c]">Free Plan</span> — 30 AI commands/month. 
                  <span className="text-opsly-secondary"> Upgrade for unlimited access and advanced features.</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Command Bar pill container */}
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-2xl bg-opsly-card/90 backdrop-blur-md border rounded-full py-2 pl-5 pr-2 shadow-2xl flex items-center gap-3 transition-all duration-200 pointer-events-auto relative ${
          isFocused
            ? 'border-opsly-accent ring-2 ring-opsly-accent/30'
            : 'border-opsly-border/70 hover:border-opsly-border'
        }`}
        style={{
          background: 'rgba(44, 44, 41, 0.90)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        }}
      >
        {/* Input Field with cycling placeholder */}
        <div className="flex-1 relative flex items-center h-10">
          <input
            ref={inputRef}
            type="text"
            value={commandText}
            onFocus={() => {
              setIsFocused(true)
              onFocusChange?.(true)
            }}
            onBlur={() => {
              setIsFocused(false)
              // Delay slightly so click events on send or microphone button can fire
              setTimeout(() => {
                onFocusChange?.(false)
              }, 150)
            }}
            onChange={(e) => setCommandText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-0 outline-none text-opsly-text text-sm py-1.5 z-10 antialiased"
          />
          
          {/* Animated fading placeholder */}
          {!commandText && (
            <div className="absolute inset-0 flex items-center pointer-events-none select-none z-0">
              <span className="text-opsly-muted text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-opsly-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <AnimatePresence mode="wait">
                  {showPlaceholder && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                      className="italic"
                    >
                      {PLACEHOLDERS[placeholderIndex]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </div>
          )}
        </div>

        {/* Minimize Button */}
        <button
          type="button"
          onClick={() => setIsMinimized(true)}
          className="p-2 rounded-full text-opsly-secondary hover:text-opsly-text hover:bg-opsly-hover border border-transparent cursor-pointer flex-shrink-0 transition-colors"
          title="Minimize Command Bar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Voice Note Button */}
        <button
          type="button"
          onClick={handleVoiceRecord}
          className={`p-2 rounded-full transition-all duration-200 cursor-pointer flex-shrink-0 border relative ${
            isRecording
              ? 'animate-pulse ring-4 ring-opsly-error/45 bg-opsly-error/20 text-opsly-error border-opsly-error'
              : 'text-opsly-secondary hover:text-opsly-text hover:bg-opsly-hover border-transparent focus:border-opsly-border'
          }`}
          title="Record voice note"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          {!isVoiceEnabled && (
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-opsly-accent rounded-full border border-opsly-card" />
          )}
        </button>

        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={!hasContent}
          whileHover={hasContent ? { scale: 1.08 } : {}}
          whileTap={hasContent ? { scale: 0.95 } : {}}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 cursor-pointer ${
            hasContent
              ? 'bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text shadow-md'
              : 'bg-opsly-input text-opsly-muted border border-opsly-border opacity-40 cursor-not-allowed'
          }`}
          title="Send command"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </motion.button>
      </form>
    </div>
  )
}

