import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'

export default function CommunicationInbox({ currentPlan, currentClient, onShowUpgradeModal, onShowToast }) {
  const [subTab, setSubTab] = useState('inbox')
  const isGrowthOrAbove = currentPlan !== 'free' && currentPlan !== 'starter'
  const clientId = currentClient?.id

  // Twilio Settings States
  const [sid, setSid] = useState('')
  const [token, setToken] = useState('')
  const [number, setNumber] = useState('')

  // Two-way messaging chat states
  const [chatThreads, setChatThreads] = useState([])
  const [activeThreadId, setActiveThreadId] = useState(null)
  const [typedMessage, setTypedMessage] = useState('')

  // Sequence builder states
  const [sequences, setSequences] = useState([])
  const [seqOpen, setSeqOpen] = useState(false)
  const [seqName, setSeqName] = useState('')
  const [seqTrigger, setSeqTrigger] = useState('invoice_sent')
  const [seqStepSubject, setSeqStepSubject] = useState('')
  const [seqStepBody, setSeqStepBody] = useState('')
  const [seqStepDelay, setSeqStepDelay] = useState(3)

  useEffect(() => {
    if (!clientId) return
    const stored = JSON.parse(localStorage.getItem(`opsly_twilio_settings_${clientId}`))
    if (stored) {
      setSid(stored.sid || '')
      setToken(stored.token || '')
      setNumber(stored.number || '')
    }
    fetchSequences()
    fetchChatThreads()
  }, [clientId])

  const fetchSequences = async () => {
    try {
      const { data, error } = await supabase
        .from('follow_up_sequences')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setSequences(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchChatThreads = async () => {
    try {
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('name', { ascending: true })

      const savedThreads = JSON.parse(localStorage.getItem(`opsly_chat_threads_${clientId}`) || '{}')

      const threads = (contactsData || []).map((c) => {
        const threadId = `thread-${c.id}`
        const existing = savedThreads[threadId] || {
          messages: [
            { sender: 'them', text: `Hi, interested in scheduling service with your team.`, time: '10:30 AM' },
            { sender: 'me', text: `Hello ${c.name}, thanks for reaching out! When would be best for an estimate?`, time: '10:35 AM' }
          ]
        }
        const lastMsg = existing.messages.length > 0 ? existing.messages[existing.messages.length - 1].text : 'No messages yet'
        return {
          id: threadId,
          contactId: c.id,
          contactName: c.name,
          phone: c.phone || '+1 555-019-4829',
          lastMessage: lastMsg,
          timestamp: 'Today',
          messages: existing.messages
        }
      })

      // Fallback demo threads if no DB contacts yet
      if (threads.length === 0) {
        threads.push(
          {
            id: 'thread-demo-1',
            contactName: 'Alex Rivera',
            phone: '+1 555-019-4829',
            lastMessage: 'Sure, Tuesday at 9am works great for the inspection.',
            timestamp: '10:45 AM',
            messages: [
              { sender: 'them', text: 'Hi, when can you come check the roof leak?', time: '10:30 AM' },
              { sender: 'me', text: 'We have availability this coming Tuesday morning.', time: '10:35 AM' },
              { sender: 'them', text: 'Sure, Tuesday at 9am works great for the inspection.', time: '10:45 AM' }
            ]
          },
          {
            id: 'thread-demo-2',
            contactName: 'Morgan Miller',
            phone: '+1 555-019-3382',
            lastMessage: 'Thank you! Sent the payment online.',
            timestamp: 'Yesterday',
            messages: [
              { sender: 'me', text: 'Hi Morgan, your job invoice has been dispatched.', time: 'Yesterday, 3:00 PM' },
              { sender: 'them', text: 'Thank you! Sent the payment online.', time: 'Yesterday, 3:15 PM' }
            ]
          }
        )
      }

      setChatThreads(threads)
      if (threads.length > 0 && !activeThreadId) setActiveThreadId(threads[0].id)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveTwilio = (e) => {
    e.preventDefault()
    if (!isGrowthOrAbove) {
      onShowUpgradeModal('growth')
      return
    }

    localStorage.setItem(`opsly_twilio_settings_${clientId}`, JSON.stringify({
      sid,
      token,
      number
    }))
    onShowToast('Twilio credentials saved successfully!')
  }

  const handleCreateSequence = async (e) => {
    e.preventDefault()
    if (!seqName || !seqStepSubject || !seqStepBody) return

    try {
      const payload = {
        client_id: clientId,
        name: seqName,
        trigger_event: seqTrigger,
        steps: [
          {
            subject: seqStepSubject,
            body: seqStepBody,
            delay_days: Number(seqStepDelay),
            channel: 'email'
          }
        ],
        is_active: true
      }

      const { error } = await supabase.from('follow_up_sequences').insert(payload)
      if (error) throw error

      onShowToast('Follow-up sequence created successfully!')
      setSeqName('')
      setSeqStepSubject('')
      setSeqStepBody('')
      setSeqStepDelay(3)
      setSeqOpen(false)
      fetchSequences()
    } catch (err) {
      console.error(err)
      onShowToast('Failed to create sequence.')
    }
  }

  const handleDeleteSequence = async (id) => {
    try {
      const { error } = await supabase.from('follow_up_sequences').delete().eq('id', id)
      if (error) throw error
      onShowToast('Sequence deleted.')
      fetchSequences()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendMessage = () => {
    if (!typedMessage.trim() || !activeThreadId) return
    
    setChatThreads(prev => {
      const updated = prev.map(t => {
        if (t.id === activeThreadId) {
          const newMsg = { sender: 'me', text: typedMessage.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          return {
            ...t,
            lastMessage: typedMessage.trim(),
            timestamp: 'Just now',
            messages: [...t.messages, newMsg]
          }
        }
        return t
      })

      // Persist to localStorage
      try {
        const saved = {}
        updated.forEach(t => { saved[t.id] = { messages: t.messages } })
        localStorage.setItem(`opsly_chat_threads_${clientId}`, JSON.stringify(saved))
      } catch (e) { console.error(e) }

      return updated
    })
    
    setTypedMessage('')
    onShowToast('Message dispatched via carrier SMS.')
  }

  const activeThread = chatThreads.find(t => t.id === activeThreadId)

  if (!isGrowthOrAbove) {
    return (
      <div className="bg-opsly-card border border-opsly-border rounded-2xl p-12 text-center flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#c15f3c]/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#c15f3c]/5 blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-full bg-[#c15f3c]/15 flex items-center justify-center mb-6 text-[#c15f3c] border border-[#c15f3c]/20">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-opsly-text">Communication Inbox Locked</h2>
        <p className="text-xs text-opsly-secondary max-w-sm mt-2 leading-relaxed">
          Accessing email logs, custom follow-up email sequence templates, and Twilio carrier SMS numbers is reserved for **Growth and Pro plans**.
        </p>

        <button
          onClick={() => onShowUpgradeModal('growth')}
          className="mt-6 bg-[#c15f3c] hover:bg-[#a95232] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#c15f3c]/15"
        >
          View Upgrade Options
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-opsly-text tracking-tight">Inbox</h1>
          <p className="text-xs text-opsly-secondary mt-1">Track customer communications, SMS carrier settings, and auto-responders.</p>
        </div>
        <button
          onClick={() => setSeqOpen(true)}
          className="w-full sm:w-auto bg-[#c15f3c] hover:bg-[#a95232] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          Create Auto Sequence
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-opsly-border/70 pb-px gap-2">
        <button
          onClick={() => setSubTab('inbox')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            subTab === 'inbox' ? 'border-[#c15f3c] text-opsly-text font-bold' : 'border-transparent text-opsly-secondary hover:text-opsly-text'
          }`}
        >
          2-Way SMS Threads
        </button>
        <button
          onClick={() => setSubTab('sequences')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            subTab === 'sequences' ? 'border-[#c15f3c] text-opsly-text font-bold' : 'border-transparent text-opsly-secondary hover:text-opsly-text'
          }`}
        >
          Follow-up Sequences
        </button>
        <button
          onClick={() => setSubTab('twilio')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            subTab === 'twilio' ? 'border-[#c15f3c] text-opsly-text font-bold' : 'border-transparent text-opsly-secondary hover:text-opsly-text'
          }`}
        >
          Twilio Settings
        </button>
      </div>

      {/* 2-Way SMS Workspace */}
      {subTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
          {/* Threads list */}
          <div className="bg-opsly-card border border-opsly-border rounded-xl p-4 overflow-y-auto space-y-2">
            <h3 className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-2">Conversations</h3>
            {chatThreads.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all text-xs cursor-pointer ${
                  activeThreadId === t.id
                    ? 'bg-opsly-accent-soft border-opsly-accent text-opsly-text'
                    : 'bg-opsly-input border-opsly-border text-opsly-secondary hover:border-opsly-accent/40'
                }`}
              >
                <div className="flex justify-between font-semibold">
                  <span>{t.contactName}</span>
                  <span className="text-[10px] text-opsly-muted">{t.timestamp}</span>
                </div>
                <p className="text-[10px] text-opsly-muted mt-1 truncate">{t.lastMessage}</p>
              </button>
            ))}
          </div>

          {/* Active Chat Thread */}
          <div className="lg:col-span-2 bg-opsly-card border border-opsly-border rounded-xl flex flex-col justify-between overflow-hidden">
            {activeThread ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-opsly-border bg-opsly-input/20 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-opsly-text">{activeThread.contactName}</h4>
                    <span className="text-[10px] text-opsly-muted">{activeThread.phone}</span>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {activeThread.messages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-xl p-3 text-xs leading-relaxed ${
                        m.sender === 'me'
                          ? 'bg-[#c15f3c] text-white rounded-tr-none'
                          : 'bg-opsly-input text-opsly-text rounded-tl-none border border-opsly-border'
                      }`}>
                        <p>{m.text}</p>
                        <span className="block text-[8px] text-right mt-1 opacity-70">{m.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input area */}
                <div className="p-3 border-t border-opsly-border bg-opsly-input/10 flex gap-2">
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type SMS message..."
                    className="flex-1 bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-[#c15f3c] hover:bg-[#a95232] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-opsly-muted">
                Select a thread to start chatting
              </div>
            )}
          </div>
        </div>
      )}

      {/* Follow-up sequences */}
      {subTab === 'sequences' && (
        <div className="space-y-6">
          <div className="bg-opsly-card border border-opsly-border rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-opsly-text uppercase tracking-wider">Late Payment Follow-up Sequences</h3>
            <p className="text-xs text-opsly-secondary leading-relaxed">
              Define automated email chasers when customer invoices are sent or past due dates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sequences.map((seq) => (
              <div key={seq.id} className="bg-opsly-card border border-opsly-border rounded-xl p-5 flex flex-col justify-between gap-4 relative overflow-hidden">
                <span className="absolute top-4 right-4 px-2 py-0.5 bg-[#c15f3c]/15 text-[#c15f3c] text-[9px] font-bold rounded">
                  {seq.trigger_event.toUpperCase()}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-opsly-text">{seq.name}</h4>
                  <div className="mt-3 space-y-2">
                    {seq.steps?.map((step, idx) => (
                      <div key={idx} className="bg-opsly-input/30 border border-opsly-border rounded p-2 text-[11px] text-opsly-secondary">
                        <p className="font-bold text-opsly-text">Step: Email after {step.delay_days} days</p>
                        <p className="mt-0.5"><span className="text-opsly-muted">Subject:</span> {step.subject}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end pt-3 border-t border-opsly-border/40">
                  <button
                    onClick={() => handleDeleteSequence(seq.id)}
                    className="text-opsly-muted hover:text-opsly-error transition-colors p-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Twilio Carrier Settings */}
      {subTab === 'twilio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-opsly-card border border-opsly-border rounded-xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-xs font-bold text-opsly-text uppercase tracking-wider mb-1.5">Twilio Account Integration</h3>
              <p className="text-xs text-opsly-secondary leading-relaxed">
                Connect your business Twilio account to enable SMS customer notifications, auto-replies, and dispatch logs.
              </p>
            </div>

            <form onSubmit={handleSaveTwilio} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Twilio Account SID</label>
                <input
                  type="text"
                  required
                  value={sid}
                  onChange={(e) => setSid(e.target.value)}
                  placeholder="e.g. ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Twilio Auth Token</label>
                <input
                  type="password"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Twilio Phone Number</label>
                <input
                  type="text"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="e.g. +15550192834"
                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-[#c15f3c] hover:bg-[#a95232] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>

          <div className="bg-opsly-card border border-opsly-border rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-opsly-text uppercase tracking-wider">How Messaging Works</h4>
            <div className="text-xs text-opsly-secondary leading-relaxed space-y-3">
              <p>
                All transactional email notifications are delivered through your connected business email. Connecting Twilio enables outbound SMS directly from your own carrier number.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auto Sequence Modal */}
      <AnimatePresence>
        {seqOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSeqOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-opsly-card border border-opsly-border rounded-2xl w-full max-w-md p-6 relative shadow-2xl z-10 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-opsly-text">Create Auto Sequence</h3>
                <button onClick={() => setSeqOpen(false)} className="p-1 rounded bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-secondary hover:text-opsly-text">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateSequence} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Sequence Name</label>
                  <input
                    type="text"
                    required
                    value={seqName}
                    onChange={(e) => setSeqName(e.target.value)}
                    placeholder="e.g. Roof Inspection Late Notice"
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Trigger Event</label>
                    <select
                      value={seqTrigger}
                      onChange={(e) => setSeqTrigger(e.target.value)}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:outline-none"
                    >
                      <option value="invoice_sent">Invoice Sent</option>
                      <option value="job_complete">Job Completed</option>
                      <option value="estimate_sent">Estimate Sent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Delay (Days)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={seqStepDelay}
                      onChange={(e) => setSeqStepDelay(e.target.value)}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Step 1 Email Subject</label>
                  <input
                    type="text"
                    required
                    value={seqStepSubject}
                    onChange={(e) => setSeqStepSubject(e.target.value)}
                    placeholder="Reminder: Your invoice is past due"
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-opsly-secondary uppercase mb-1.5">Step 1 Email Message Body</label>
                  <textarea
                    rows={4}
                    required
                    value={seqStepBody}
                    onChange={(e) => setSeqStepBody(e.target.value)}
                    placeholder="Friendly reminder to complete your invoice payment online..."
                    className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2 gap-2">
                  <button type="button" onClick={() => setSeqOpen(false)} className="border border-opsly-border bg-opsly-input text-opsly-text px-4 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                  <button type="submit" className="bg-[#c15f3c] hover:bg-[#a95232] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all">Save Sequence</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
