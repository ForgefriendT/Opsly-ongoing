import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useFeatureAccess } from './hooks/useFeatureAccess'
import { supabase } from './lib/supabase'

// Component Imports
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import OtpVerification from './components/Auth/OtpVerification'
import ForgotPassword from './components/Auth/ForgotPassword'
import OnboardingWizard from './components/Onboarding/OnboardingWizard'

// Shell Component Imports
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import CommandBar from './components/Layout/CommandBar'
import MobileNav from './components/Layout/MobileNav'
import UpgradePrompt from './components/Layout/UpgradePrompt'
import CustomConfirmModal from './components/Layout/CustomConfirmModal'

// CRM Component Imports
import CsvImportModal from './components/CRM/CsvImportModal'
import ContactProfile from './components/CRM/ContactProfile'

// Invoices Component Imports
import InvoiceBuilder from './components/Invoices/InvoiceBuilder'
import InvoicePortal from './components/Invoices/InvoicePortal'

// Estimates Component Imports
import EstimateBuilder from './components/Estimates/EstimateBuilder'
import EstimatePortal from './components/Estimates/EstimatePortal'
import EstimateWizardModal from './components/Estimates/EstimateWizardModal'
import PlanUpgradeModal from './components/Billing/PlanUpgradeModal'
import TeamManagement from './components/Team/TeamManagement'
import CommunicationInbox from './components/Communication/CommunicationInbox'
import CustomerReviews from './components/Reviews/CustomerReviews'
import DocumentsModule from './components/Documents/DocumentsModule'
import AdvancedReports from './components/Analytics/AdvancedReports'

// Jobs Component Imports
import CalendarView from './components/Jobs/CalendarView'
import JobBuilderModal from './components/Jobs/JobBuilderModal'
import JobDetailsModal from './components/Jobs/JobDetailsModal'

function AppContent() {
  const {
    user,
    currentUserProfile,
    currentClient,
    setCurrentClient,
    currentNicheConfig,
    loading,
    logout,
    sessionConflict,
    setSessionConflict
  } = useAuth()

  const { hasAccess, getFeatureGateInfo, currentPlan } = useFeatureAccess()

  const [authView, setAuthView] = useState('login')
  const [signupData, setSignupData] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAIFocused, setIsAIFocused] = useState(false)
  
  // Settings tab local states
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsName, setSettingsName] = useState('')
  const [settingsAddress, setSettingsAddress] = useState('')
  const [settingsPhone, setSettingsPhone] = useState('')
  const [settingsEmail, setSettingsEmail] = useState('')
  const [settingsWebsite, setSettingsWebsite] = useState('')

  // Review settings (stored in localStorage keyed by client ID)
  const [reviewSettings, setReviewSettings] = useState({ googleReviewLink: '', yelpLink: '', facebookReviewLink: '' })
  const [isSavingReviewSettings, setIsSavingReviewSettings] = useState(false)

  // QuickBooks & Zapier states (Rules of Hooks safe)
  const [qbConnected, setQbConnected] = useState(false)
  const [zapierWebhook, setZapierWebhook] = useState('')
  const [isEditingZapier, setIsEditingZapier] = useState(false)

  // App Feedback form
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackCategory, setFeedbackCategory] = useState('feature_request')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  const commandBarInputRef = useRef(null)

  const [commandBarPrefill, setCommandBarPrefill] = useState('')
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    activeJobsCount: 0,
    outstandingAR: 0,
    recentActivity: [],
    upcomingJobs: [],
    outstandingInvoicesList: [],
    activeJobsList: []
  })
  const [isFetchingDashboard, setIsFetchingDashboard] = useState(false)
  const [expenses, setExpenses] = useState([])
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    category: 'Materials',
    amount: '',
    description: '',
    recurrence: 'one_time',
    expenseDate: new Date().toISOString().split('T')[0],
    jobId: ''
  })

  // CRM Tab States
  const [contacts, setContacts] = useState([])
  const [isFetchingContacts, setIsFetchingContacts] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [showCsvImportModal, setShowCsvImportModal] = useState(false)
  const [showAddContactModal, setShowAddContactModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Add Contact Form States
  const [addContactName, setAddContactName] = useState('')
  const [addContactEmail, setAddContactEmail] = useState('')
  const [addContactPhone, setAddContactPhone] = useState('')
  const [addContactAddress, setAddContactAddress] = useState('')
  const [addContactNotes, setAddContactNotes] = useState('')
  const [addContactStatus, setAddContactStatus] = useState('active')
  const [isSavingContact, setIsSavingContact] = useState(false)

  // Invoices Tab States
  const [invoices, setInvoices] = useState([])
  const [isFetchingInvoices, setIsFetchingInvoices] = useState(false)
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null)
  const [invoiceSubView, setInvoiceSubView] = useState('list') // 'list', 'create', 'portal'
  const [publicInvoiceId, setPublicInvoiceId] = useState(null)

  // Estimates Tab States
  const [estimates, setEstimates] = useState([])
  const [isFetchingEstimates, setIsFetchingEstimates] = useState(false)
  const [estimateSearchQuery, setEstimateSearchQuery] = useState('')
  const [estimateStatusFilter, setEstimateStatusFilter] = useState('all')
  const [selectedEstimateId, setSelectedEstimateId] = useState(null)
  const [estimateSubView, setEstimateSubView] = useState('list') // 'list', 'create', 'portal'
  const [publicEstimateId, setPublicEstimateId] = useState(null)

  // Jobs Tab States
  const [jobs, setJobs] = useState([])
  const [isFetchingJobs, setIsFetchingJobs] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [isJobBuilderOpen, setIsJobBuilderOpen] = useState(false)
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false)
  const [jobBuilderDate, setJobBuilderDate] = useState(null)
  const [showGoogleOAuth, setShowGoogleOAuth] = useState(false)
  const [showEstimateWizard, setShowEstimateWizard] = useState(false)
  const [wizardEstimate, setWizardEstimate] = useState(null)
  const [showPlanUpgradeModal, setShowPlanUpgradeModal] = useState(false)

  // Lifted AI Chat States
  const [aiMessages, _setAiMessages] = useState([])
  const [threads, setThreads] = useState([])
  const [activeThreadId, setActiveThreadId] = useState(null)
  const [isAIChatActive, setIsAIChatActive] = useState(false)
  const [isAIChatMinimized, setIsAIChatMinimized] = useState(false)
  const [mobileAISubView, setMobileAISubView] = useState('chat')

  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateMatch, setDuplicateMatch] = useState(null)
  const [invoicePrefillData, setInvoicePrefillData] = useState(null)
  const [estimatePrefillData, setEstimatePrefillData] = useState(null)

  const handleTabChange = (tabId) => {
    setSelectedContact(null)
    setSelectedInvoiceId(null)
    setSelectedEstimateId(null)
    setInvoiceSubView('list')
    setEstimateSubView('list')
    setInvoicePrefillData(null)
    setEstimatePrefillData(null)
    setActiveTab(tabId)
  }

  const handleCreateJobForContact = (contact) => {
    setSelectedJob({
      contact_id: contact.id,
      title: `Job for ${contact.name}`,
      description: '',
      address: contact.address || ''
    })
    setIsJobBuilderOpen(true)
  }

  const handleCreateInvoiceForContact = (contact) => {
    setInvoicePrefillData({
      contact_id: contact.id,
      line_items: [{ id: '1', description: 'Service charge', quantity: 1, unit_price: 0, tax_rate: 0 }]
    })
    setInvoiceSubView('create')
    setActiveTab('invoices')
  }

  const handleOpenJobBuilderForEstimate = (est) => {
    setSelectedJob({
      contact_id: est.contact_id,
      title: `Job for ${est.estimate_number}`,
      price: est.grand_total,
      description: `Scheduled following approval of Estimate ${est.estimate_number}.`,
      address: est.contact?.address || ''
    })
    setIsJobBuilderOpen(true)
  }

  const handleApproveFollowup = async (invoice) => {
    const isPro = ['pro', 'business', 'enterprise', 'custom'].includes(currentPlan)
    if (!isPro) {
      triggerConfirm({
        title: 'Upgrade to Pro Plan Required',
        message: 'Automated payment follow-up dispatches require the Pro plan subscription. Upgrade now to enable automated collections.',
        confirmText: 'View Upgrade Options',
        onConfirm: () => handleUpgrade('pro')
      })
      return
    }

    try {
      const todayStr = new Date().toISOString()
      const payments = invoice.payments || {}
      const chaserHistory = payments.chaser_history || {}
      
      let nextChaserHistory = { ...chaserHistory }
      if (invoice.pendingType === 'Final Notice') {
        nextChaserHistory.day14_sent_at = todayStr
      } else if (invoice.pendingType === 'Firmer Follow-up') {
        nextChaserHistory.day7_sent_at = todayStr
      } else if (invoice.pendingType === 'Polite Reminder') {
        nextChaserHistory.day3_sent_at = todayStr
      }

      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'overdue',
          payments: {
            ...payments,
            chaser_history: nextChaserHistory
          }
        })
        .eq('id', invoice.id)

      if (error) throw error

      handleAction(`Approved! "${invoice.pendingType}" reminder email sent to ${invoice.contact?.name || 'client'}.`)
      fetchDashboardData()
    } catch (err) {
      console.error(err)
      handleAction("Failed to send payment reminder.")
    }
  }

  const triggerZapierWebhook = (event, data) => {
    if (!currentClient?.id) return
    const webhookUrl = localStorage.getItem(`opsly_zapier_hook_${currentClient.id}`)
    if (!webhookUrl) return
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
    }).catch(err => console.warn('Zapier webhook dispatch notice:', err))
  }

  // Custom setAiMessages updater that synchronizes messages with threads and localStorage
  const setAiMessages = (updateFn) => {
    _setAiMessages((prevMessages) => {
      const nextMessages = typeof updateFn === 'function' ? updateFn(prevMessages) : updateFn;
      
      // Update or create active thread
      if (nextMessages.length === 0) {
        // If empty messages (like clear history), delete the active thread
        if (activeThreadId) {
          setThreads(prevThreads => {
            const updated = prevThreads.filter(t => t.id !== activeThreadId);
            if (currentClient?.id) {
              localStorage.setItem(`opsly_ai_threads_${currentClient.id}`, JSON.stringify(updated));
            }
            return updated;
          });
          setActiveThreadId(null);
        }
      } else {
        setActiveThreadId(currId => {
          let targetId = currId;
          if (!targetId) {
            targetId = 'thread-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
            const userMessage = nextMessages.find(m => m.role === 'user');
            const title = userMessage ? (userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : '')) : 'New Chat';
            const newThread = {
              id: targetId,
              title,
              createdAt: new Date().toISOString(),
              messages: nextMessages
            };
            setThreads(prev => {
              const updated = [newThread, ...prev];
              if (currentClient?.id) {
                localStorage.setItem(`opsly_ai_threads_${currentClient.id}`, JSON.stringify(updated));
              }
              return updated;
            });
          } else {
            setThreads(prev => {
              const updated = prev.map(t => {
                if (t.id === targetId) {
                  return { ...t, messages: nextMessages };
                }
                return t;
              });
              if (currentClient?.id) {
                localStorage.setItem(`opsly_ai_threads_${currentClient.id}`, JSON.stringify(updated));
              }
              return updated;
            });
          }
          return targetId;
        });
      }
      
      return nextMessages;
    });
  };

  const handleNewChat = () => {
    setActiveThreadId(null)
    _setAiMessages([])
    setIsAIChatActive(false)
  };

  const handleDeleteThread = (threadId, e) => {
    e.stopPropagation();
    const updatedThreads = threads.filter(t => t.id !== threadId);
    setThreads(updatedThreads);
    if (currentClient?.id) {
      localStorage.setItem(`opsly_ai_threads_${currentClient.id}`, JSON.stringify(updatedThreads));
    }
    if (activeThreadId === threadId) {
      if (updatedThreads.length > 0) {
        setActiveThreadId(updatedThreads[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  // Load AI Chat Threads on mount / client load
  useEffect(() => {
    if (currentClient?.id) {
      try {
        const stored = localStorage.getItem(`opsly_ai_threads_${currentClient.id}`)
        const parsed = stored ? JSON.parse(stored) : []
        setThreads(parsed)
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id)
          _setAiMessages(parsed[0].messages || [])
        } else {
          setActiveThreadId(null)
          _setAiMessages([])
        }
      } catch (err) {
        console.error('Failed to load AI threads:', err)
        setThreads([])
        setActiveThreadId(null)
        _setAiMessages([])
      }
    }
  }, [currentClient?.id])

  // Sync current thread messages when changing active thread
  useEffect(() => {
    if (activeThreadId) {
      const activeThread = threads.find(t => t.id === activeThreadId)
      if (activeThread) {
        _setAiMessages(activeThread.messages || [])
      }
    }
  }, [activeThreadId])

  // Custom Confirmation Dialog State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDanger: false,
    onConfirm: null
  })

  // Revenue analytics sub-view state
  const [showRevenueDetail, setShowRevenueDetail] = useState(false)
  const [activeInvoiceMenuId, setActiveInvoiceMenuId] = useState(null)
  const [activeEstimateMenuId, setActiveEstimateMenuId] = useState(null)

  const overrideText = (defaultText, key) => {
    const override = currentNicheConfig?.terminology_overrides?.[key]
    if (!override) return defaultText
    if (defaultText === defaultText.toLowerCase()) {
      return override.toLowerCase()
    }
    return override
  }

  const groupThreadsByDate = (threadsList) => {
    const groups = {
      'Today': [],
      'Yesterday': [],
      'Previous Week': [],
      'Older': []
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000
    const sevenDaysAgoStart = todayStart - 7 * 24 * 60 * 60 * 1000

    threadsList.forEach(thread => {
      const threadTime = new Date(thread.createdAt).getTime()
      if (threadTime >= todayStart) {
        groups['Today'].push(thread)
      } else if (threadTime >= yesterdayStart) {
        groups['Yesterday'].push(thread)
      } else if (threadTime >= sevenDaysAgoStart) {
        groups['Previous Week'].push(thread)
      } else {
        groups['Older'].push(thread)
      }
    })

    return groups
  }

  const fetchDashboardData = async () => {
    if (!currentClient?.id) return
    setIsFetchingDashboard(true)
    try {
      const [invoicesRes, jobsRes, contactsRes, expensesRes] = await Promise.all([
        supabase.from('invoices').select('*').eq('client_id', currentClient.id),
        supabase.from('jobs').select('*').eq('client_id', currentClient.id),
        supabase.from('contacts').select('*').eq('client_id', currentClient.id),
        supabase.from('expenses').select('*').eq('client_id', currentClient.id)
      ])

      const invoices = invoicesRes.data || []
      const jobs = jobsRes.data || []
      const contacts = contactsRes.data || []
      const expenses = expensesRes.data || []
      setExpenses(expenses)

      const paidInvoices = invoices.filter(inv => inv.status === 'paid')
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.grand_total || 0), 0)

      const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
      const netProfit = totalRevenue - totalExpenses

      const outstandingInvoices = invoices.filter(inv => ['sent', 'viewed', 'overdue'].includes(inv.status))
      const outstandingAR = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.grand_total || 0), 0)

      const activeJobs = jobs.filter(job => job.status !== 'completed')
      const activeJobsCount = activeJobs.length

      const upcomingJobs = jobs.filter(job => {
        if (!job.start_date) return false
        const jobDate = new Date(job.start_date)
        const now = new Date()
        const oneWeekLater = new Date()
        oneWeekLater.setDate(now.getDate() + 7)
        return jobDate >= now && jobDate <= oneWeekLater && job.status !== 'completed'
      }).sort((a,b) => new Date(a.start_date) - new Date(b.start_date)).slice(0, 5)

      const activities = []
      contacts.forEach(c => {
        activities.push({
          id: `contact-${c.id}`,
          type: 'contact',
          title: `New contact added`,
          desc: `${c.name} was added to your contacts`,
          date: new Date(c.created_at || Date.now())
        })
      })
      jobs.forEach(j => {
        activities.push({
          id: `job-${j.id}`,
          type: 'job',
          title: `${overrideText('Job', 'jobs')} scheduled`,
          desc: `"${j.title}" - Status: ${j.status}`,
          date: new Date(j.created_at || Date.now())
        })
      })
      invoices.forEach(inv => {
        const contactName = contacts.find(c => c.id === inv.contact_id)?.name || 'a client'
        activities.push({
          id: `invoice-${inv.id}`,
          type: 'invoice',
          title: inv.status === 'paid' ? `Invoice paid` : `Invoice created`,
          desc: `Invoice ${inv.invoice_number} for ${contactName} - ${currentClient.currency_symbol || '$'}${Number(inv.grand_total || 0).toFixed(2)}`,
          date: new Date(inv.created_at || Date.now())
        })
      })
      expenses.forEach(exp => {
        activities.push({
          id: `expense-${exp.id}`,
          type: 'expense',
          title: `Expense logged`,
          desc: `${exp.category}: ${currentClient.currency_symbol || '$'}${Number(exp.amount || 0).toFixed(2)}`,
          date: new Date(exp.created_at || Date.now())
        })
      })

      const sortedActivities = activities.sort((a,b) => b.date - a.date).slice(0, 10)

      setDashboardData({
        totalRevenue,
        totalExpenses,
        netProfit,
        activeJobsCount,
        outstandingAR,
        recentActivity: sortedActivities,
        upcomingJobs,
        outstandingInvoicesList: outstandingInvoices,
        activeJobsList: activeJobs
      })
    } catch (err) {
      console.error('Error fetching dashboard details:', err)
    } finally {
      setIsFetchingDashboard(false)
    }
  }

  const fetchContacts = async () => {
    if (!currentClient?.id) return
    setIsFetchingContacts(true)
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('client_id', currentClient.id)
        .order('name', { ascending: true })

      if (error) throw error
      setContacts(data || [])

      // Keep selected contact updated with latest info
      if (selectedContact) {
        const updated = data.find(c => c.id === selectedContact.id)
        if (updated) {
          setSelectedContact(updated)
        }
      }
    } catch (err) {
      console.error('Error fetching contacts:', err)
    } finally {
      setIsFetchingContacts(false)
    }
  }

  const fetchInvoices = async () => {
    if (!currentClient?.id) return
    setIsFetchingInvoices(true)
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, contact:contacts(name, email)')
        .eq('client_id', currentClient.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (err) {
      console.error('Error fetching invoices:', err)
    } finally {
      setIsFetchingInvoices(false)
    }
  }

  const fetchEstimates = async () => {
    if (!currentClient?.id) return
    setIsFetchingEstimates(true)
    try {
      const { data, error } = await supabase
        .from('estimates')
        .select('*, contact:contacts(name, email)')
        .eq('client_id', currentClient.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEstimates(data || [])
    } catch (err) {
      console.error('Error fetching estimates:', err)
    } finally {
      setIsFetchingEstimates(false)
    }
  }

  const fetchJobs = async () => {
    if (!currentClient?.id) return
    setIsFetchingJobs(true)
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_id', currentClient.id)
        .order('start_date', { ascending: true })

      if (error) throw error
      setJobs(data || [])
    } catch (err) {
      console.error('Error fetching jobs:', err)
    } finally {
      setIsFetchingJobs(false)
    }
  }

  const handleConvertEstimateToInvoice = async (est) => {
    triggerConfirm({
      title: 'Convert Estimate',
      message: 'Are you sure you want to convert this estimate to a draft invoice?',
      confirmText: 'Convert',
      onConfirm: async () => {
        try {
          // 1. Generate new invoice number prefix
          const prefix = currentClient?.invoice_prefix || 'INV'
          const randNum = Math.floor(1000 + Math.random() * 9000)
          const invNum = `${prefix}-${randNum}`

          // 2. Insert invoice
          const { data: savedInvoice, error: invErr } = await supabase
            .from('invoices')
            .insert({
              client_id: est.client_id,
              contact_id: est.contact_id,
              job_id: est.job_id,
              invoice_number: invNum,
              status: 'draft',
              line_items: est.line_items,
              subtotal: est.subtotal,
              tax_total: est.tax_total,
              discount_amount: est.discount_amount || 0,
              grand_total: est.grand_total,
              notes: est.notes || `Converted from Estimate ${est.estimate_number}`,
              currency: est.currency,
              currency_symbol: est.currency_symbol
            })
            .select()
            .single()

          if (invErr) throw invErr

          // 3. Update estimate to converted
          const { error: estUpdateErr } = await supabase
            .from('estimates')
            .update({
              status: 'converted',
              converted_invoice_id: savedInvoice.id
            })
            .eq('id', est.id)

          if (estUpdateErr) throw estUpdateErr

          handleAction(`Successfully converted estimate to Draft Invoice ${invNum}!`)
          fetchEstimates()
          fetchInvoices()
          fetchDashboardData()
        } catch (err) {
          console.error('Error converting estimate:', err)
          handleAction('Failed to convert estimate to invoice. ' + err.message)
        }
      }
    })
  }

  const handleAddContactSubmit = async (e, forceCreate = false) => {
    if (e) e.preventDefault()
    if (currentPlan === 'free') {
      handleAction('Free plan accounts cannot add contacts.')
      return
    }
    if (!addContactName.trim()) {
      handleAction('Contact name is required.')
      return
    }

    if (!forceCreate) {
      const duplicate = contacts.find(c => 
        c.name.toLowerCase().trim() === addContactName.toLowerCase().trim() &&
        (c.email || '').toLowerCase().trim() === (addContactEmail || '').toLowerCase().trim() &&
        (c.phone || '').trim() === (addContactPhone || '').trim()
      )
      if (duplicate) {
        setDuplicateMatch(duplicate)
        setShowDuplicateModal(true)
        return
      }
    }

    setIsSavingContact(true)
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          client_id: currentClient.id,
          name: addContactName,
          email: addContactEmail || null,
          phone: addContactPhone || null,
          address: addContactAddress || null,
          notes: addContactNotes || null,
          status: addContactStatus
        })
        .select()
        .single()

      if (error) throw error

      handleAction('Contact added successfully!')
      setAddContactName('')
      setAddContactEmail('')
      setAddContactPhone('')
      setAddContactAddress('')
      setAddContactNotes('')
      setAddContactStatus('active')
      setShowAddContactModal(false)
      setShowDuplicateModal(false)
      setDuplicateMatch(null)
      fetchContacts()
    } catch (err) {
      console.error(err)
      handleAction(err.message || 'Failed to add contact.')
    } finally {
      setIsSavingContact(false)
    }
  }

  useEffect(() => {
    if (currentClient?.id) {
      fetchDashboardData()
      fetchContacts()
      fetchInvoices()
      fetchEstimates()
      fetchJobs()
    }
  }, [currentClient?.id, activeTab])

  useEffect(() => {
    const handleActionSuccess = (e) => {
      fetchDashboardData()
      fetchContacts()
      fetchInvoices()
      fetchEstimates()
      fetchJobs()

      const { type, data } = e?.detail || {}
      if (type === 'CREATE_ESTIMATE' || (type === 'UPDATE_ESTIMATE_STATUS' && data?.status === 'approved')) {
        if (data) {
          setWizardEstimate(data)
          setShowEstimateWizard(true)
        }
      }
    }
    window.addEventListener('opsly-action-success', handleActionSuccess)
    return () => {
      window.removeEventListener('opsly-action-success', handleActionSuccess)
    }
  }, [currentClient?.id])

  useEffect(() => {
    const handleTriggerUpgrade = (e) => {
      const plan = e.detail?.plan || 'starter'
      handleUpgrade(plan)
    }
    window.addEventListener('opsly-trigger-upgrade', handleTriggerUpgrade)
    return () => {
      window.removeEventListener('opsly-trigger-upgrade', handleTriggerUpgrade)
    }
  }, [currentClient?.id])

  // Populate settings states on load or tab change
  useEffect(() => {
    if (currentClient && activeTab === 'settings') {
      setSettingsName(currentClient.business_name || '')
      setSettingsAddress(currentClient.business_address || '')
      setSettingsPhone(currentClient.business_phone || '')
      setSettingsEmail(currentClient.business_email || '')
      setSettingsWebsite(currentClient.business_website || '')
      // Load review platform links from localStorage
      const savedReview = JSON.parse(localStorage.getItem(`opsly_review_settings_${currentClient.id}`) || '{}')
      setReviewSettings({
        googleReviewLink: savedReview.googleReviewLink || '',
        yelpLink: savedReview.yelpLink || '',
        facebookReviewLink: savedReview.facebookReviewLink || ''
      })
      // Load QuickBooks and Zapier hook states
      setQbConnected(localStorage.getItem(`opsly_qb_connected_${currentClient.id}`) === 'true')
      setZapierWebhook(localStorage.getItem(`opsly_zapier_hook_${currentClient.id}`) || '')
    }
  }, [currentClient, activeTab])

  // Show onboarding wizard when user has incomplete onboarding
  useEffect(() => {
    if (user && currentClient && currentClient.onboarding_step_completed >= 1 && currentClient.onboarding_step_completed < 5) {
      setShowOnboarding(true)
    }
  }, [user, currentClient?.id])

  // Handle URL path and hash recovery routing on mount
  useEffect(() => {
    const handleRouting = () => {
      const path = window.location.pathname
      const hash = window.location.hash
      const search = window.location.search

      if (path.startsWith('/invoice/')) {
        const id = path.split('/invoice/')[1]
        if (id) {
          setPublicInvoiceId(id)
        }
      } else if (path.startsWith('/estimate/')) {
        const id = path.split('/estimate/')[1]
        if (id) {
          setPublicEstimateId(id)
        }
      } else if (
        path === '/reset-password' ||
        (hash && (hash.includes('type=recovery') || hash.includes('recovery') || hash.includes('error='))) ||
        (search && (search.includes('type=recovery') || search.includes('recovery') || search.includes('error=')))
      ) {
        setAuthView('reset-password')
      } else {
        setPublicInvoiceId(null)
        setPublicEstimateId(null)
      }
    }
    handleRouting()
    window.addEventListener('hashchange', handleRouting)
    window.addEventListener('popstate', handleRouting)
    return () => {
      window.removeEventListener('hashchange', handleRouting)
      window.removeEventListener('popstate', handleRouting)
    }
  }, [])

  const handleAction = (message) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleLogExpenseSubmit = async (e) => {
    e.preventDefault()
    const amountVal = parseFloat(expenseForm.amount) || 0
    if (amountVal <= 0) {
      handleAction("Expense amount must be greater than 0.")
      return
    }
    
    try {
      const payload = {
        client_id: currentClient.id,
        amount: amountVal,
        category: expenseForm.category,
        description: expenseForm.description.trim(),
        recurrence: expenseForm.recurrence,
        expense_date: expenseForm.expenseDate,
        job_id: expenseForm.jobId || null,
        updated_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('expenses')
        .insert(payload)
        
      if (error) throw error
      
      setShowExpenseModal(false)
      setExpenseForm({
        category: 'Materials',
        amount: '',
        description: '',
        recurrence: 'one_time',
        expenseDate: new Date().toISOString().split('T')[0],
        jobId: ''
      })
      fetchDashboardData()
      handleAction("Expense logged successfully!")
    } catch (err) {
      console.error("Error logging expense:", err)
      handleAction("Failed to log expense.")
    }
  }

  const triggerConfirm = ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false, onConfirm }) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      isDanger,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    })
  }

  // Handle upgrade simulation directly from UpgradePrompt
  const handleUpgrade = async (planRequired) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ plan: planRequired })
        .eq('id', currentClient.id)

      if (error) throw error

      setCurrentClient((prev) => ({ ...prev, plan: planRequired }))
      handleAction(`Successfully upgraded to ${planRequired.toUpperCase()}!`)
    } catch (err) {
      console.error('Upgrade failed:', err)
      handleAction('Could not process upgrade. Please try again.')
    }
  }

  const handleSettingsSave = async (e) => {
    e.preventDefault()
    setIsSavingSettings(true)
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          business_name: settingsName,
          business_address: settingsAddress,
          business_phone: settingsPhone,
          business_email: settingsEmail,
          business_website: settingsWebsite
        })
        .eq('id', currentClient.id)

      if (error) throw error

      setCurrentClient((prev) => ({
        ...prev,
        business_name: settingsName,
        business_address: settingsAddress,
        business_phone: settingsPhone,
        business_email: settingsEmail,
        business_website: settingsWebsite
      }))
      handleAction('Business details updated successfully!')
    } catch (err) {
      console.error('Settings update failed:', err)
      handleAction('Could not save details. Please try again.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const focusCommandBar = () => {
    const inputEl = document.querySelector('input[type="text"]');
    if (inputEl) {
      inputEl.focus();
    }
  }

  // 0. PUBLIC INVOICE PORTAL ROUTE
  if (publicInvoiceId) {
    return (
      <InvoicePortal
        invoiceId={publicInvoiceId}
        onClose={() => {
          if (user) {
            setPublicInvoiceId(null)
            window.history.pushState({}, '', '/')
            setActiveTab('invoices')
            setInvoiceSubView('list')
          } else {
            window.location.href = '/login'
          }
        }}
      />
    )
  }

  // 0.1 PUBLIC ESTIMATE PORTAL ROUTE
  if (publicEstimateId) {
    return (
      <EstimatePortal
        estimateId={publicEstimateId}
        onClose={() => {
          if (user) {
            setPublicEstimateId(null)
            window.history.pushState({}, '', '/')
            setActiveTab('estimates')
            setEstimateSubView('list')
          } else {
            window.location.href = '/login'
          }
        }}
      />
    )
  }

  // 1. LOADING STATE (Skeleton Screens per Section 14)
  if (loading) {
    return (
      <div className="min-h-screen bg-opsly-base flex flex-col p-6 animate-pulse select-none">
        <div className="h-8 bg-opsly-input rounded-md w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="h-32 bg-opsly-input rounded-xl"></div>
          <div className="h-32 bg-opsly-input rounded-xl"></div>
          <div className="h-32 bg-opsly-input rounded-xl"></div>
        </div>
        <div className="flex-1 bg-opsly-input rounded-xl h-64"></div>
      </div>
    )
  }

  // 2. CONCURRENT SESSION LIMIT REACHED SCREEN
  if (sessionConflict) {
    return (
      <div className="min-h-screen bg-opsly-base flex flex-col items-center justify-center p-6 text-center antialiased font-sans">
        <div className="w-full max-w-md bg-opsly-card border border-opsly-border rounded-2xl p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-opsly-error/15 flex items-center justify-center mx-auto mb-4 text-opsly-error">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-opsly-text tracking-tight">Session Terminated</h2>
          <p className="text-opsly-secondary text-sm mt-3 leading-relaxed">
            You have been logged out because another device signed into this account. 
            Your plan allows <span className="font-semibold text-opsly-accent">{currentClient?.plan === 'free' || currentClient?.plan === 'starter' ? '1' : '3'} concurrent session</span>.
          </p>
          <button
            onClick={() => {
              setSessionConflict(false)
              setAuthView('login')
            }}
            className="mt-6 bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 shadow-lg shadow-opsly-accent/15"
          >
            Acknowledge & Login
          </button>
        </div>
      </div>
    )
  }

  // 3. UNAUTHENTICATED SCREENS
  if (!user) {
    switch (authView) {
      case 'signup':
        return (
          <Signup
            onNavigate={setAuthView}
            onSignupSuccess={(data) => {
              setSignupData(data)
              setAuthView('otp')
            }}
          />
        )
      case 'forgot-password':
        return <ForgotPassword onNavigate={setAuthView} mode="request" />
      case 'reset-password':
        return <ForgotPassword onNavigate={setAuthView} mode="reset" />
      case 'otp':
        return (
          <OtpVerification
            signupData={signupData}
            onVerificationComplete={() => {
              setAuthView('login')
              handleAction('Account created successfully! Please log in.')
            }}
          />
        )
      case 'login':
      default:
        return <Login onNavigate={setAuthView} />
    }
  }

  // 4. PHONE VERIFICATION FORCED STATE
  if (currentClient?.onboarding_step_completed === 0) {
    return (
      <OtpVerification
        onVerificationComplete={() => {
          handleAction('Phone verified successfully!')
        }}
      />
    )
  }

  const onboardingIncomplete = currentClient && currentClient.onboarding_step_completed >= 1 && currentClient.onboarding_step_completed < 5

  // Map active tab to its gating feature name
  const tabGateMap = {
    jobs: 'scheduling',
    estimates: 'estimates',
    expenses: 'expenses',
    documents: 'documents',
    analytics: 'analytics',
    inbox: 'inbox',
    workers: 'workers',
    reviews: 'reviews',
    ai_assistant: 'ai_assistant'
  }

  const activeGate = tabGateMap[activeTab]
  const isTabLocked = activeGate ? !hasAccess(activeGate) : false
  const activeGateInfo = activeGate ? getFeatureGateInfo(activeGate) : null

  // Mobile More items mapping
  const mobileMenuItems = [
    { id: 'jobs', label: overrideText('Jobs', 'jobs'), gate: 'scheduling' },
    { id: 'estimates', label: 'Estimates', gate: 'estimates' },
    { id: 'expenses', label: 'Expenses', gate: 'expenses' },
    { id: 'documents', label: 'Documents', gate: 'documents' },
    { id: 'analytics', label: 'Analytics & Reports', gate: 'analytics' },
    { id: 'inbox', label: 'Inbox', gate: 'inbox' },
    { id: 'workers', label: 'Team & Inspectors', gate: 'workers' },
    { id: 'reviews', label: 'Reviews', gate: 'reviews' },
    { id: 'settings', label: 'Settings' }
  ]

  // Widget Renderers for Niche Dashboard Layouts
  const renderActiveJobsWidget = () => (
    <div key="active_jobs" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-opsly-text">Active {overrideText('Jobs', 'jobs')}</h3>
        <span className="text-[10px] font-bold text-opsly-accent bg-opsly-accent-soft px-2 py-0.5 rounded uppercase tracking-wider">
          {dashboardData.activeJobsList.length} Active
        </span>
      </div>
      
      {dashboardData.activeJobsList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-opsly-input flex items-center justify-center mb-3 text-opsly-muted">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-opsly-text mb-0.5">No active {overrideText('jobs', 'jobs')}</p>
          <p className="text-[10px] text-opsly-muted mb-3">Schedule a {overrideText('job', 'jobs')} to dispatch work</p>
          <button
            onClick={() => { setCommandBarPrefill(`Schedule a ${overrideText('job', 'jobs')} for `); focusCommandBar(); }}
            className="text-[10px] text-opsly-accent hover:text-opsly-accent-hover font-semibold cursor-pointer"
          >
            Create one now →
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 max-h-[250px] pr-1">
          {dashboardData.activeJobsList.map((job) => (
            <div 
              key={job.id} 
              onClick={() => {
                setSelectedJob(job);
                setIsJobDetailsOpen(true);
              }}
              className="p-3 bg-opsly-input/40 border border-opsly-border rounded-lg flex items-center justify-between gap-3 hover:border-opsly-accent/20 transition-all duration-150 cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-opsly-text truncate">{job.title}</p>
                <p className="text-[10px] text-opsly-muted truncate mt-0.5">{job.address || 'No address specified'}</p>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded capitalize bg-opsly-accent-soft text-opsly-accent">
                {job.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderOutstandingInvoicesWidget = () => (
    <div key="outstanding_invoices" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-opsly-text">Outstanding Invoices</h3>
        <span className="text-[10px] font-bold text-opsly-error bg-opsly-error/15 px-2 py-0.5 rounded uppercase tracking-wider">
          {currentClient.currency_symbol || '$'}{Number(dashboardData.outstandingAR).toFixed(2)}
        </span>
      </div>

      {dashboardData.outstandingInvoicesList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-opsly-input flex items-center justify-center mb-3 text-opsly-muted">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-opsly-text mb-0.5">No outstanding invoices</p>
          <p className="text-[10px] text-opsly-muted mb-3">All clear! No unpaid invoices</p>
          <button
            onClick={() => { setCommandBarPrefill('Create an invoice for '); focusCommandBar(); }}
            className="text-[10px] text-opsly-accent hover:text-opsly-accent-hover font-semibold cursor-pointer"
          >
            Create invoice →
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 max-h-[250px] pr-1">
          {dashboardData.outstandingInvoicesList.map((inv) => (
            <div 
              key={inv.id} 
              onClick={() => {
                setSelectedInvoiceId(inv.id);
                setInvoiceSubView('portal');
                setActiveTab('invoices');
              }}
              className="p-3 bg-opsly-input/40 border border-opsly-border rounded-lg flex items-center justify-between gap-3 hover:border-opsly-accent/20 transition-all duration-150 cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-opsly-text truncate">{inv.invoice_number}</p>
                <p className="text-[10px] text-opsly-muted truncate mt-0.5">
                  Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-opsly-text">
                  {currentClient.currency_symbol || '$'}{Number(inv.grand_total || 0).toFixed(2)}
                </p>
                <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded block mt-1 ${
                  inv.status === 'overdue' ? 'bg-opsly-error/15 text-opsly-error' : 'bg-opsly-input text-opsly-secondary'
                }`}>
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderRecentActivityWidget = () => (
    <div key="recent_activity" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <h3 className="text-base font-semibold text-opsly-text mb-4">Recent Activity</h3>
      
      {dashboardData.recentActivity.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-opsly-input flex items-center justify-center mb-3 text-opsly-muted">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-opsly-text mb-0.5">No recent activity</p>
          <p className="text-[10px] text-opsly-muted">Create contacts, jobs, or invoices to see updates</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[250px] pr-1">
          {dashboardData.recentActivity.map((activity, i) => (
            <div key={activity.id || i} className="flex gap-3 items-start">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                activity.type === 'contact' ? 'bg-blue-900/30 text-blue-300' :
                activity.type === 'job' ? 'bg-amber-900/30 text-amber-300' :
                activity.type === 'invoice' ? 'bg-green-900/30 text-green-300' :
                'bg-red-900/30 text-red-300'
              }`}>
                {activity.type === 'contact' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                {activity.type === 'job' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                {activity.type === 'invoice' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                {activity.type === 'expense' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-opsly-text">{activity.title}</p>
                <p className="text-[10px] text-opsly-muted mt-0.5 leading-relaxed">{activity.desc}</p>
                <span className="text-[9px] text-opsly-muted/80 mt-1 block">
                  {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(activity.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderUpcomingJobsWidget = () => (
    <div key="upcoming_jobs" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <h3 className="text-base font-semibold text-opsly-text mb-4">Upcoming {overrideText('Jobs', 'jobs')} This Week</h3>
      
      {dashboardData.upcomingJobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-opsly-input flex items-center justify-center mb-3 text-opsly-muted">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-opsly-text mb-0.5">No upcoming {overrideText('jobs', 'jobs')}</p>
          <p className="text-[10px] text-opsly-muted">No appointments scheduled for the next 7 days</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 max-h-[250px] pr-1">
          {dashboardData.upcomingJobs.map((job) => (
            <div 
              key={job.id} 
              onClick={() => {
                setSelectedJob(job);
                setIsJobDetailsOpen(true);
              }}
              className="p-3 bg-opsly-input/40 border border-opsly-border rounded-lg flex items-center justify-between gap-3 cursor-pointer hover:border-opsly-accent/20 transition-all duration-150"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-opsly-text truncate">{job.title}</p>
                <p className="text-[10px] text-opsly-muted truncate mt-0.5">
                  {new Date(job.start_date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(job.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className="text-[9px] font-semibold text-opsly-accent bg-opsly-accent-soft/20 px-2 py-0.5 rounded">
                Upcoming
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderRecurringServicesWidget = () => (
    <div key="recurring_services" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-opsly-text">Recurring Services</h3>
        <span className="text-[10px] font-bold text-opsly-accent bg-opsly-accent-soft px-2 py-0.5 rounded uppercase tracking-wider">
          Active Contracts
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {[
          { address: '742 Evergreen Terrace', service: 'Weekly Mow & Edge', price: 180, nextBill: 'Jul 1, 2026' },
          { address: '102 Elm Street', service: 'Bi-Weekly Pruning & Weed', price: 240, nextBill: 'Jul 5, 2026' },
          { address: '555 Maple Avenue', service: 'Monthly Lawn Treatment', price: 110, nextBill: 'Jul 15, 2026' }
        ].map((srv, i) => (
          <div key={i} className="p-3 bg-opsly-input/40 border border-opsly-border rounded-lg flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-opsly-text truncate">{srv.address}</p>
              <p className="text-[10px] text-opsly-muted truncate mt-0.5">{srv.service} • Next billing: {srv.nextBill}</p>
            </div>
            <p className="text-xs font-bold text-opsly-accent">
              {currentClient.currency_symbol || '$'}{srv.price}/mo
            </p>
          </div>
        ))}
      </div>
    </div>
  )

  const renderRouteScheduleWidget = () => (
    <div key="route_schedule" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-opsly-text">Route Dispatch</h3>
        <span className="text-[10px] font-bold text-opsly-success bg-opsly-success/15 text-opsly-success px-2 py-0.5 rounded uppercase tracking-wider">
          Optimized
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div className="relative border-l border-opsly-accent/40 ml-2.5 pl-6 space-y-4 py-1">
          {[
            { stop: '1', address: '742 Evergreen Terrace', time: '9:00 AM - 10:30 AM', status: 'Completed' },
            { stop: '2', address: '102 Elm Street', time: '11:00 AM - 12:30 PM', status: 'Next' },
            { stop: '3', address: '555 Maple Avenue', time: '1:30 PM - 3:00 PM', status: 'Scheduled' }
          ].map((st, i) => (
            <div key={i} className="relative">
              <span className={`absolute -left-[31px] top-0 w-3 h-3 rounded-full border border-opsly-base flex items-center justify-center text-[7px] font-bold text-white ${
                st.status === 'Completed' ? 'bg-opsly-accent' :
                st.status === 'Next' ? 'bg-opsly-success animate-pulse' :
                'bg-opsly-muted'
              }`}>
                {st.stop}
              </span>
              <p className="text-xs font-semibold text-opsly-text">{st.address}</p>
              <p className="text-[10px] text-opsly-muted mt-0.5">{st.time} • <span className={st.status === 'Completed' ? 'text-opsly-accent' : st.status === 'Next' ? 'text-opsly-success' : 'text-opsly-muted'}>{st.status}</span></p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-opsly-muted mt-3 text-center border-t border-opsly-border/40 pt-2">
          Route efficiency: 94%. Saved 3.2 miles.
        </p>
      </div>
    </div>
  )

  const renderSeasonalRevenueWidget = () => (
    <div key="seasonal_revenue" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <h3 className="text-base font-semibold text-opsly-text mb-4">Seasonal Service Breakdown</h3>
      <div className="flex-1 flex flex-col justify-around py-2">
        {[
          { label: 'Lawn Mowing & Maintenance', amount: 3200, pct: 65, color: 'bg-opsly-accent' },
          { label: 'Leaf Cleanup & Mulching', amount: 1200, pct: 25, color: 'bg-opsly-success' },
          { label: 'Snow Plowing (Off-season contracts)', amount: 500, pct: 10, color: 'bg-opsly-muted' }
        ].map((item, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-opsly-text truncate max-w-[70%]">{item.label}</span>
              <span className="text-opsly-secondary">{currentClient.currency_symbol || '$'}{item.amount.toLocaleString()} ({item.pct}%)</span>
            </div>
            <div className="w-full h-2 bg-opsly-input rounded-full overflow-hidden">
              <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderTodaysScheduleWidget = () => (
    <div key="todays_schedule" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <h3 className="text-base font-semibold text-opsly-text mb-4">Today's Cleaning Appointments</h3>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {[
          { client: 'Alice Montgomery', type: 'Residential Deep Clean', time: '10:00 AM', crew: 'Team Alpha' },
          { client: 'TechCorp HQ', type: 'Commercial Office Clean', time: '2:00 PM', crew: 'Team Beta' }
        ].map((ap, i) => (
          <div key={i} className="p-3 bg-opsly-input/40 border border-opsly-border rounded-lg flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-opsly-text">{ap.client}</p>
              <p className="text-[10px] text-opsly-muted mt-0.5">{ap.type} • Assigned: <span className="text-opsly-accent font-semibold">{ap.crew}</span></p>
            </div>
            <span className="text-xs font-bold text-opsly-secondary">{ap.time}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderRecurringCleansWidget = () => (
    <div key="recurring_cleans" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <h3 className="text-base font-semibold text-opsly-text mb-4">Recurring Clean Contracts</h3>
      <div className="flex-1 grid grid-cols-3 gap-4 items-center">
        {[
          { label: 'Weekly', count: 14, change: '+2' },
          { label: 'Bi-Weekly', count: 28, change: '0' },
          { label: 'Monthly', count: 5, change: '-1' }
        ].map((item, i) => (
          <div key={i} className="p-4 bg-opsly-input/40 border border-opsly-border rounded-lg text-center">
            <span className="text-[10px] font-bold text-opsly-muted uppercase tracking-wider">{item.label}</span>
            <p className="text-2xl font-bold text-opsly-text mt-1.5">{item.count}</p>
            <span className={`text-[8px] font-semibold block mt-1 ${item.change.startsWith('+') ? 'text-opsly-success' : item.change.startsWith('-') ? 'text-opsly-error' : 'text-opsly-muted'}`}>
              {item.change} this month
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCrewAssignmentsWidget = () => (
    <div key="crew_assignments" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <h3 className="text-base font-semibold text-opsly-text mb-4">Crew Dispatch status</h3>
      <div className="flex-1 space-y-3">
        {[
          { crew: 'Team Alpha', leader: 'Marcus K.', location: '555 Maple Ave (Active)', status: 'On Site' },
          { crew: 'Team Beta', leader: 'Svetlana R.', location: 'TechCorp HQ (Not Started)', status: 'En Route' },
          { crew: 'Team Gamma', leader: 'John D.', location: 'Off Duty', status: 'Standby' }
        ].map((cr, i) => (
          <div key={i} className="p-3 bg-opsly-input/40 border border-opsly-border rounded-lg flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-opsly-text">{cr.crew} ({cr.leader})</p>
              <p className="text-[10px] text-opsly-muted mt-0.5">{cr.location}</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
              cr.status === 'On Site' ? 'bg-opsly-accent-soft text-opsly-accent' :
              cr.status === 'En Route' ? 'bg-opsly-success/15 text-opsly-success' :
              'bg-opsly-border text-opsly-muted'
            }`}>
              {cr.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderEmergencyCallsWidget = () => (
    <div key="emergency_calls" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px] border-opsly-error/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-opsly-text flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-opsly-error animate-ping" />
          HVAC Emergency Alerts
        </h3>
        <span className="text-[9px] font-bold text-opsly-error bg-opsly-error/15 px-2 py-0.5 rounded">URGENT</span>
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div className="p-4 bg-opsly-error/10 border border-opsly-error/20 rounded-xl space-y-2">
          <p className="text-xs font-semibold text-opsly-text">No Air Conditioning / 95°F Heat</p>
          <p className="text-[10px] text-opsly-secondary leading-relaxed">
            Address: 102 Elm St. Client: Sarah Connor. Compressor failure reported by smart thermostat trigger.
          </p>
          <button
            onClick={() => { setCommandBarPrefill('Schedule emergency dispatch for Sarah Connor at 102 Elm St '); focusCommandBar(); }}
            className="mt-2 bg-opsly-error text-white text-[10px] font-bold px-3 py-1.5 rounded hover:bg-opsly-error/80 transition-all cursor-pointer"
          >
            Dispatch Technician
          </button>
        </div>
        <p className="text-[10px] text-opsly-muted text-center pt-2">
          Emergency response time average: 24 mins.
        </p>
      </div>
    </div>
  )

  const renderEquipmentWarrantyWidget = () => (
    <div key="equipment_warranty" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <h3 className="text-base font-semibold text-opsly-text mb-4">Client HVAC Warranties</h3>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {[
          { client: 'Marcus Aurelius', unit: 'Carrier Condenser (CR-901)', expires: 'Dec 12, 2028' },
          { client: 'Julius Caesar', unit: 'Trane Furnace (TR-202)', expires: 'May 20, 2027' }
        ].map((eq, i) => (
          <div key={i} className="p-3 bg-opsly-input/40 border border-opsly-border rounded-lg">
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold text-opsly-text">{eq.client}</p>
              <span className="text-[9px] font-semibold text-opsly-success bg-opsly-success/10 px-1.5 py-0.5 rounded">Active</span>
            </div>
            <p className="text-[10px] text-opsly-muted mt-1">{eq.unit}</p>
            <p className="text-[9px] text-opsly-accent font-medium mt-0.5">Warranty Expires: {eq.expires}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const renderPartsNeededWidget = () => (
    <div key="parts_needed" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <h3 className="text-base font-semibold text-opsly-text mb-4">Technician Restock Alerts</h3>
      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {[
            { part: '45+5 uF Run Capacitor', stock: '0 in warehouse', action: 'Need 3' },
            { part: '2-Pole 30A Contactor', stock: '1 in warehouse', action: 'Need 2' }
          ].map((pt, i) => (
            <div key={i} className="p-3 bg-opsly-input/40 border border-opsly-border rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-opsly-text">{pt.part}</p>
                <p className="text-[10px] text-opsly-error font-medium mt-0.5">{pt.stock}</p>
              </div>
              <span className="text-[10px] font-bold text-opsly-accent bg-opsly-accent-soft/20 px-2 py-1 rounded">
                {pt.action}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => { setCommandBarPrefill('Create purchase order for HVAC capacitors and contactors '); focusCommandBar(); }}
          className="w-full mt-3 bg-opsly-input border border-opsly-border hover:bg-opsly-hover text-opsly-text text-xs py-2 rounded font-semibold cursor-pointer transition-colors"
        >
          Create Restock PO
        </button>
      </div>
    </div>
  )

  const renderTodaysAppointmentsWidget = () => (
    <div key="todays_appointments" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <h3 className="text-base font-semibold text-opsly-text mb-4">Today's Stylist Bookings</h3>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {[
          { client: 'Sarah Connor', service: 'Balayage Haircut', time: '9:00 AM', stylist: 'Jasmine' },
          { client: 'Emma Watson', service: 'Spa Massage & Facial', time: '11:30 AM', stylist: 'Chloe' }
        ].map((ap, i) => (
          <div key={i} className="p-3 bg-opsly-input/40 border border-opsly-border rounded-lg flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-opsly-text">{ap.client}</p>
              <p className="text-[10px] text-opsly-muted mt-0.5">{ap.service} • Stylist: <span className="text-opsly-accent font-semibold">{ap.stylist}</span></p>
            </div>
            <span className="text-xs font-bold text-opsly-secondary">{ap.time}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderRecurringBookingsWidget = () => (
    <div key="recurring_bookings" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <h3 className="text-base font-semibold text-opsly-text mb-4">Guest Loyalty &amp; Retention</h3>
      <div className="flex-1 flex flex-col justify-around py-2">
        <div className="flex items-center justify-between border-b border-opsly-border/40 pb-3">
          <div>
            <p className="text-xs text-opsly-muted">Client Retention Rate</p>
            <p className="text-xl font-bold text-opsly-text mt-1">92%</p>
          </div>
          <span className="text-[10px] font-bold text-opsly-success bg-opsly-success/15 px-2 py-0.5 rounded">+3% this mo</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-opsly-muted">Average Re-booking Rate</p>
            <p className="text-xl font-bold text-opsly-text mt-1">84%</p>
          </div>
          <span className="text-[10px] font-bold text-opsly-accent bg-opsly-accent-soft px-2 py-0.5 rounded">High Loyalty</span>
        </div>
      </div>
    </div>
  )

  const renderRetailSalesWidget = () => (
    <div key="retail_sales" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <h3 className="text-base font-semibold text-opsly-text mb-4">Beauty Products Retail Sales</h3>
      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {[
            { product: 'Moroccan Argan Hair Oil (100ml)', sold: '14 units sold', revenue: 420 },
            { product: 'Olaplex No. 3 Hair Perfector', sold: '9 units sold', revenue: 270 }
          ].map((rt, i) => (
            <div key={i} className="p-3 bg-opsly-input/40 border border-opsly-border rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-opsly-text">{rt.product}</p>
                <p className="text-[10px] text-opsly-muted mt-0.5">{rt.sold}</p>
              </div>
              <span className="text-xs font-bold text-opsly-accent">
                {currentClient.currency_symbol || '$'}{rt.revenue.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-opsly-muted text-center pt-2">
          Total Retail Revenue: {currentClient.currency_symbol || '$'}690.00 MTD (+15% vs last mo).
        </p>
      </div>
    </div>
  )

  const renderEstimatePipelineWidget = () => (
    <div key="estimate_pipeline" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <h3 className="text-base font-semibold text-opsly-text mb-4">Painting Bid Pipeline</h3>
      <div className="flex-1 flex flex-col justify-around">
        <div className="p-4 bg-opsly-input/40 border border-opsly-border rounded-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-opsly-muted">Bids Sent (Awaiting Approval)</p>
            <p className="text-2xl font-bold text-opsly-text mt-1">4 Pending</p>
          </div>
          <p className="text-lg font-bold text-opsly-accent">{currentClient.currency_symbol || '$'}6,200.00</p>
        </div>
        <p className="text-[10px] text-opsly-muted text-center">
          Avg. client response time: 4.2 days. Win rate: 72%.
        </p>
      </div>
    </div>
  )

  const renderMaterialCostsWidget = () => (
    <div key="material_costs" className="bg-opsly-card/60 backdrop-blur-md border border-opsly-border rounded-xl p-6 shadow-sm flex flex-col min-h-[300px]">
      <h3 className="text-base font-semibold text-opsly-text mb-4">Paint &amp; Materials Cost</h3>
      <div className="flex-1 flex flex-col justify-around">
        {[
          { category: 'Sherwin-Williams Paint / Primer', cost: 850, pct: 87 },
          { category: 'Brushes, Tape, Dropcloths', cost: 120, pct: 13 }
        ].map((mt, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-opsly-text truncate max-w-[70%]">{mt.category}</span>
              <span className="text-opsly-secondary">{currentClient.currency_symbol || '$'}{mt.cost.toFixed(2)}</span>
            </div>
            <div className="w-full h-1.5 bg-opsly-input rounded-full overflow-hidden">
              <div className="h-full bg-opsly-accent" style={{ width: `${mt.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderWidget = (key) => {
    switch (key) {
      case 'active_projects':
      case 'active_jobs':
        return renderActiveJobsWidget()
      case 'outstanding_invoices':
        return renderOutstandingInvoicesWidget()
      case 'upcoming_jobs':
        return renderUpcomingJobsWidget()
      case 'recent_activity':
        return renderRecentActivityWidget()
      // Landscaper
      case 'recurring_services':
        return renderRecurringServicesWidget()
      case 'route_schedule':
        return renderRouteScheduleWidget()
      case 'seasonal_revenue':
        return renderSeasonalRevenueWidget()
      // Cleaner
      case 'todays_schedule':
        return renderTodaysScheduleWidget()
      case 'recurring_cleans':
        return renderRecurringCleansWidget()
      case 'crew_assignments':
        return renderCrewAssignmentsWidget()
      // HVAC
      case 'emergency_calls':
        return renderEmergencyCallsWidget()
      case 'equipment_warranty':
        return renderEquipmentWarrantyWidget()
      case 'parts_needed':
        return renderPartsNeededWidget()
      // Salon
      case 'todays_appointments':
        return renderTodaysAppointmentsWidget()
      case 'recurring_bookings':
        return renderRecurringBookingsWidget()
      case 'retail_sales':
        return renderRetailSalesWidget()
      // Painter
      case 'estimate_pipeline':
        return renderEstimatePipelineWidget()
      case 'material_costs':
        return renderMaterialCostsWidget()
      default:
        return null
    }
  }

  // 5. AUTHENTICATED LAYOUT
  return (
    <div className="min-h-screen bg-opsly-base text-opsly-text flex flex-col md:flex-row antialiased font-sans relative overflow-x-hidden">
      
      {/* BACKGROUND AMBIENT ORBS (Section 2, Design Spec #14 - adapted to warm accent colors) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          backgroundImage: `
            radial-gradient(ellipse 600px 400px at 15% 15%, rgba(204, 120, 92, 0.04) 0%, transparent 70%),
            radial-gradient(ellipse 500px 350px at 85% 85%, rgba(217, 119, 87, 0.03) 0%, transparent 70%)
          `
        }}
      />

      {/* ONBOARDING WIZARD OVERLAY */}
      <AnimatePresence>
        {showOnboarding && onboardingIncomplete && (
          <OnboardingWizard
            clientId={currentClient.id}
            clientPlan={currentClient.plan}
            currentStep={currentClient.onboarding_step_completed}
            onStepComplete={(updates) => {
              setCurrentClient(prev => ({ ...prev, ...updates }))
            }}
            onDismiss={() => setShowOnboarding(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Toast Notification (Framer Motion slide-in Toast per Section 2 Animation #7) */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-24 right-4 md:right-8 z-50 bg-opsly-card border border-opsly-border text-opsly-text px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3"
            style={{
              background: 'rgba(44, 44, 41, 0.95)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-opsly-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-opsly-accent"></span>
            </span>
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE MORE MENU DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-opsly-base z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Menu Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 max-h-[75vh] bg-opsly-card border-t border-opsly-border rounded-t-2xl z-50 p-6 overflow-y-auto md:hidden"
              style={{
                background: 'rgba(44, 44, 41, 0.96)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-opsly-secondary uppercase tracking-widest">More Operations</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-7 h-7 rounded-full bg-opsly-input border border-opsly-border flex items-center justify-center text-opsly-muted hover:text-opsly-text cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-8">
                {mobileMenuItems.map((item) => {
                  const hasFeature = !item.gate || hasAccess(item.gate)
                  
                  // Map specific icon for mobile drawer grid
                  let iconElement = null
                  if (item.id === 'jobs') {
                    iconElement = <svg className="w-5 h-5 text-opsly-accent mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  } else if (item.id === 'estimates') {
                    iconElement = <svg className="w-5 h-5 text-opsly-accent mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  } else if (item.id === 'expenses') {
                    iconElement = <svg className="w-5 h-5 text-opsly-accent mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  } else if (item.id === 'documents') {
                    iconElement = <svg className="w-5 h-5 text-opsly-accent mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  } else if (item.id === 'analytics') {
                    iconElement = <svg className="w-5 h-5 text-opsly-accent mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  } else if (item.id === 'sms') {
                    iconElement = <svg className="w-5 h-5 text-opsly-accent mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  } else if (item.id === 'workers') {
                    iconElement = <svg className="w-5 h-5 text-opsly-accent mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  } else if (item.id === 'settings') {
                    iconElement = <svg className="w-5 h-5 text-opsly-accent mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleTabChange(item.id)
                        setIsMobileMenuOpen(false)
                      }}
                      className="p-4 bg-opsly-input border border-opsly-border hover:border-opsly-accent/40 rounded-xl text-left cursor-pointer transition-all duration-150 flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start w-full">
                        {iconElement}
                        {!hasFeature && (
                          <svg className="w-3.5 h-3.5 text-opsly-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-opsly-text mt-2">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR (Desktop) */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* MAIN CONTAINER */}
      <div className="flex-1 md:pl-0 flex flex-col min-h-screen bg-transparent pb-36 md:pb-24 z-10 transition-all duration-300 md:ml-60 select-none" style={{ marginLeft: 'var(--sidebar-offset, 240px)' }}>
        
        {/* Dynamic calculation of sidebar offset for margin adjustment */}
        <SidebarOffsetObserver />

        {/* HEADER */}
        <Header onAction={handleAction} onSettingsClick={() => setActiveTab('settings')} />

        {/* SUBSCRIPTION GRACE PERIOD WARNING BANNER */}
        {currentClient?.plan_status === 'past_due' && currentClient?.grace_period_ends_at && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-opsly-warning/10 border border-opsly-warning/20 rounded-xl p-4 flex items-center justify-between gap-4 mx-6 md:mx-8 mt-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-opsly-warning/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-opsly-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-opsly-text">Payment failed — grace period active</p>
                <p className="text-[11px] text-opsly-secondary mt-0.5">
                  We couldn't process your payment — update your card to keep things running. You have until{' '}
                  <span className="font-semibold text-opsly-warning">
                    {new Date(currentClient.grace_period_ends_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="bg-opsly-warning text-opsly-base hover:opacity-90 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 flex-shrink-0 cursor-pointer"
            >
              Update Card
            </button>
          </motion.div>
        )}

        {/* CONTENT */}
        <main className="p-6 md:p-8 space-y-8 flex-1">
          
          {/* ONBOARDING REMINDER CARD */}
          {onboardingIncomplete && !showOnboarding && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-opsly-accent-soft border border-opsly-accent/20 rounded-xl p-4 flex items-center justify-between gap-4"
              style={{
                background: 'rgba(204, 120, 92, 0.08)'
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-opsly-accent/15 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-opsly-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-opsly-text">Finish setting up your account</p>
                  <p className="text-xs text-opsly-secondary truncate mt-0.5">Upload your logo and complete your business details to unlock invoices.</p>
                </div>
              </div>
              <button
                onClick={() => setShowOnboarding(true)}
                className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex-shrink-0 shadow-lg shadow-opsly-accent/15"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* MAIN PAGE SWAPPER WITH FADE + SLIDE TRANSITION (Section 2 Animation #1) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-8"
            >
              {isTabLocked ? (
                /* Upgrade screen for locked features */
                <UpgradePrompt
                  featureInfo={activeGateInfo}
                  currentPlan={currentPlan}
                  onUpgradeClick={handleUpgrade}
                />
              ) : (
                /* Tab Contents */
                <>
                  {/* AI ASSISTANT TAB */}
                  {activeTab === 'ai_assistant' && (
                    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
                      <div>
                        <h1 className="text-2xl font-bold text-opsly-text tracking-tight">AI Assistant Thread</h1>
                        <p className="text-xs text-opsly-secondary mt-1">Review conversational history and active search logs.</p>
                      </div>

                      {/* Mobile sub-view tab toggler */}
                      <div className="flex md:hidden bg-opsly-input p-0.5 rounded-lg border border-opsly-border w-full">
                        <button
                          type="button"
                          onClick={() => setMobileAISubView('chat')}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer text-center ${
                            mobileAISubView === 'chat'
                              ? 'bg-[#c15f3c] text-white font-bold'
                              : 'text-opsly-secondary hover:text-opsly-text'
                          }`}
                        >
                          Active Chat
                        </button>
                        <button
                          type="button"
                          onClick={() => setMobileAISubView('history')}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer text-center ${
                            mobileAISubView === 'history'
                              ? 'bg-[#c15f3c] text-white font-bold'
                              : 'text-opsly-secondary hover:text-opsly-text'
                          }`}
                        >
                          Chat History ({threads.length})
                        </button>
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-hidden h-full">
                        {/* Left sidebar: Thread list */}
                        <div className={`md:col-span-1 bg-opsly-card/30 border border-opsly-border rounded-xl p-4 flex flex-col h-full overflow-hidden shadow-sm ${mobileAISubView === 'history' ? 'flex' : 'hidden md:flex'}`}>
                          <button
                            onClick={handleNewChat}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-dashed border-opsly-accent/30 text-opsly-accent hover:bg-opsly-accent/5 hover:border-opsly-accent hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-xs font-semibold cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Chat
                          </button>
                          
                          <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-4 custom-scrollbar">
                            {threads.length === 0 ? (
                              <div className="text-center py-6 text-[11px] text-opsly-secondary">
                                No chat history yet.
                              </div>
                            ) : (
                              Object.entries(groupThreadsByDate(threads)).map(([groupName, items]) => {
                                if (items.length === 0) return null;
                                return (
                                  <div key={groupName} className="space-y-1">
                                    <h3 className="text-[9px] font-bold text-opsly-muted uppercase tracking-wider px-2 mb-1">{groupName}</h3>
                                    {items.map(thread => (
                                      <div
                                        key={thread.id}
                                        onClick={() => {
                                          setActiveThreadId(thread.id);
                                          setMobileAISubView('chat'); // Jump to active chat view on mobile select!
                                        }}
                                        className={`group relative flex items-center justify-between py-1.5 px-2 rounded-lg text-xs cursor-pointer transition-all ${
                                          activeThreadId === thread.id
                                            ? 'bg-opsly-accent-soft border border-opsly-accent/20 text-opsly-text'
                                            : 'bg-transparent text-opsly-secondary hover:bg-opsly-hover hover:text-opsly-text'
                                        }`}
                                      >
                                        <span className="truncate pr-4 font-medium">{thread.title}</span>
                                        <button
                                          onClick={(e) => handleDeleteThread(thread.id, e)}
                                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-opsly-input rounded text-red-400 hover:text-red-300 transition-all cursor-pointer"
                                          title="Delete Thread"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Right pane: Active chat panel */}
                        <div className={`md:col-span-3 bg-opsly-card/40 border border-opsly-border rounded-xl p-5 flex flex-col h-full overflow-hidden shadow-sm ${mobileAISubView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
                          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                            {aiMessages.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="w-12 h-12 rounded-full bg-opsly-accent/15 flex items-center justify-center mb-4 text-opsly-accent border border-opsly-accent/25">
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                                <h3 className="text-sm font-semibold text-opsly-text">No active conversation</h3>
                                <p className="text-xs text-opsly-secondary max-w-xs mt-1.5 leading-relaxed">
                                  Use the command bar pill at the bottom of the screen to talk with the AI assistant.
                                </p>
                              </div>
                            ) : (
                              aiMessages.map((msg, idx) => (
                                <div key={msg.id || idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  {msg.role === 'user' ? (
                                    <div className="max-w-[80%] bg-opsly-input border border-opsly-border rounded-2xl px-4 py-2.5 text-xs text-opsly-text antialiased">
                                      {msg.content}
                                    </div>
                                  ) : (
                                    <>
                                      <div className="w-8 h-8 rounded-full bg-opsly-accent/15 flex items-center justify-center flex-shrink-0 text-opsly-accent border border-opsly-accent/20">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                      </div>
                                      <div className="flex-1 pr-6">
                                        <p className="text-[10px] font-bold text-opsly-muted uppercase tracking-wider mb-1">Opsly Assistant</p>
                                        <p className="text-xs text-opsly-text leading-relaxed whitespace-pre-wrap antialiased">
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
                          </div>

                          {aiMessages.length > 0 && (
                            <div className="pt-4 border-t border-opsly-border flex justify-end gap-3">
                              <button
                                onClick={() => {
                                  setAiMessages([])
                                  setIsAIChatActive(false)
                                }}
                                className="px-3.5 py-1.5 border border-opsly-border hover:bg-opsly-hover text-opsly-secondary rounded-xl text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                              >
                                Clear Chat History
                              </button>
                              <button
                                onClick={() => {
                                  setIsAIChatMinimized(false)
                                  focusCommandBar()
                                }}
                                className="px-4 py-1.5 bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text rounded-xl text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                              >
                                Open Input Panel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DASHBOARD TAB */}
                  {activeTab === 'dashboard' && (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h1 className="text-2xl font-bold text-opsly-text tracking-tight capitalize">Dashboard</h1>
                          <p className="text-xs text-opsly-secondary mt-1">AI-powered summary of your business activities.</p>
                        </div>
                        
                        {currentPlan !== 'free' && (
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => { setCommandBarPrefill(`Schedule a ${overrideText('job', 'jobs')} for `); focusCommandBar(); }}
                              className="bg-opsly-input border border-opsly-border text-opsly-text hover:bg-opsly-hover px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
                            >
                              New {overrideText('Job', 'jobs')}
                            </button>
                            <button 
                              onClick={() => { setCommandBarPrefill("Create an invoice for "); focusCommandBar(); }}
                              className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-opsly-accent/15 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
                            >
                              New Invoice
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Dynamic numbers metrics cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {/* Card 1: Revenue */}
                        <div 
                          onClick={() => setActiveTab('invoices')}
                          className="bg-opsly-card border border-opsly-border rounded-xl p-6 transition-all duration-200 hover:border-opsly-accent/40 hover:bg-opsly-hover shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer"
                        >
                          <span className="text-xs font-semibold text-opsly-muted uppercase tracking-wider">Total Revenue</span>
                          <div className="mt-4">
                            <span className="text-3xl font-bold tracking-tight text-opsly-text">
                              {currentClient?.currency_symbol || '$'}{Number(dashboardData.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <p className="text-xs text-opsly-muted mt-1.5">
                              {dashboardData.totalRevenue > 0 ? 'Revenue collected this month' : 'No invoices paid this month'}
                            </p>
                          </div>
                        </div>

                        {/* Card 2: Total Expenses (Starter+) */}
                        {currentPlan !== 'free' && (
                        <div 
                          onClick={() => {
                            if (!hasAccess('expenses')) { setShowPlanUpgradeModal(true) } else { setActiveTab('expenses') }
                          }}
                          className="bg-opsly-card border border-opsly-border rounded-xl p-6 transition-all duration-200 hover:border-opsly-accent/40 hover:bg-opsly-hover shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer"
                        >
                          <span className="text-xs font-semibold text-opsly-muted uppercase tracking-wider">Total Expenses</span>
                          <div className="mt-4">
                            <span className="text-3xl font-bold tracking-tight text-opsly-error">
                              {currentClient?.currency_symbol || '$'}{Number(dashboardData.totalExpenses).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <p className="text-xs text-opsly-muted mt-1.5">
                              Recurring &amp; one-time costs logged
                            </p>
                          </div>
                        </div>
                        )}

                        {/* Card 3: Net Profit (Growth+) */}
                        {currentPlan !== 'free' && (
                        <div 
                          onClick={() => {
                            if (!hasAccess('analytics')) {
                              setShowPlanUpgradeModal(true)
                            } else {
                              setActiveTab('analytics')
                            }
                          }}
                          className="bg-opsly-card border border-opsly-border rounded-xl p-6 transition-all duration-200 hover:border-opsly-accent/40 hover:bg-opsly-hover shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer"
                        >
                          <span className="text-xs font-semibold text-opsly-muted uppercase tracking-wider">Net Profit</span>
                          <div className="mt-4">
                            <span className={`text-3xl font-bold tracking-tight ${dashboardData.netProfit >= 0 ? 'text-opsly-success' : 'text-opsly-error'}`}>
                              {dashboardData.netProfit < 0 ? '-' : ''}{currentClient?.currency_symbol || '$'}{Math.abs(Number(dashboardData.netProfit)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <p className="text-xs text-opsly-muted mt-1.5">
                              Profit margin: {dashboardData.totalRevenue > 0 ? ((dashboardData.netProfit / dashboardData.totalRevenue) * 100).toFixed(1) : 0}%
                            </p>
                          </div>
                        </div>
                        )}

                        {/* Card 4: Active Jobs */}
                        <div 
                          onClick={() => setActiveTab('jobs')}
                          className="bg-opsly-card border border-opsly-border rounded-xl p-6 transition-all duration-200 hover:border-opsly-accent/40 hover:bg-opsly-hover shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer"
                        >
                          <span className="text-xs font-semibold text-opsly-muted uppercase tracking-wider">Active {overrideText('Jobs', 'jobs')}</span>
                          <div className="mt-4">
                            <span className="text-3xl font-bold tracking-tight text-opsly-text">{dashboardData.activeJobsCount}</span>
                            <p className="text-xs text-opsly-muted mt-1.5">
                              {dashboardData.activeJobsCount > 0 ? 'Active dispatch workload' : `Create a ${overrideText('job', 'jobs')} to populate scheduler`}
                            </p>
                          </div>
                        </div>

                        {/* Card 5: Outstanding AR */}
                        <div 
                          onClick={() => { setActiveTab('invoices'); setInvoiceSubView('list'); }}
                          className="bg-opsly-card border border-opsly-border rounded-xl p-6 transition-all duration-200 hover:border-opsly-accent/40 hover:bg-opsly-hover shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer"
                        >
                          <span className="text-xs font-semibold text-opsly-muted uppercase tracking-wider">Outstanding AR</span>
                          <div className="mt-4">
                            <span className="text-3xl font-bold tracking-tight text-opsly-text">
                              {currentClient?.currency_symbol || '$'}{Number(dashboardData.outstandingAR).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <p className="text-xs text-opsly-muted mt-1.5">
                              {dashboardData.outstandingAR > 0 ? 'Awaiting customer payment' : 'No outstanding invoices'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Revenue Analytics Detail Panel */}
                      <AnimatePresence>
                        {showRevenueDetail && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-opsly-card border border-opsly-border rounded-xl p-6 shadow-sm space-y-6 overflow-hidden"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="text-sm font-bold text-opsly-text">Revenue Analytics Detail</h3>
                                <p className="text-[10px] text-opsly-secondary mt-0.5">Monthly breakdown of paid invoices (last 6 months).</p>
                              </div>
                              <button
                                onClick={() => setShowRevenueDetail(false)}
                                className="text-xs text-opsly-secondary hover:text-opsly-text border border-opsly-border px-2.5 py-1 rounded bg-opsly-input cursor-pointer"
                              >
                                Hide
                              </button>
                            </div>

                            {/* Chart */}
                            <div className="h-44 flex items-end gap-4 sm:gap-8 pt-6 border-b border-opsly-border/70 pb-3">
                              {(() => {
                                const paid = invoices.filter(inv => inv.status === 'paid')
                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                                
                                const last6Months = []
                                const now = new Date()
                                for (let i = 5; i >= 0; i--) {
                                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                                  const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`
                                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                                  last6Months.push({ label, key, total: 0 })
                                }

                                paid.forEach(inv => {
                                  if (!inv.created_at) return
                                  const d = new Date(inv.created_at)
                                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                                  const match = last6Months.find(m => m.key === key)
                                  if (match) {
                                    match.total += Number(inv.grand_total || 0)
                                  }
                                })

                                const maxRevenue = Math.max(...last6Months.map(m => m.total), 100)

                                return last6Months.map((m, idx) => {
                                  const heightPct = (m.total / maxRevenue) * 100
                                  return (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                      <div className="text-[9px] font-bold text-opsly-accent opacity-0 group-hover:opacity-100 transition-opacity">
                                        {currentClient?.currency_symbol || '$'}{m.total.toFixed(0)}
                                      </div>
                                      <div 
                                        className="w-full bg-opsly-accent hover:bg-opsly-accent-hover rounded-t transition-all duration-350 cursor-pointer min-h-[4px]" 
                                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                                        title={`${m.label}: ${currentClient?.currency_symbol || '$'}${m.total.toFixed(2)}`}
                                      />
                                      <div className="text-[10px] text-opsly-muted font-medium whitespace-nowrap mt-1">{m.label}</div>
                                    </div>
                                  )
                                })
                              })()}
                            </div>

                            {/* Detail Records */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-opsly-muted uppercase tracking-wider">Recently Paid Invoices</h4>
                              {(() => {
                                const paidInvoicesDetail = invoices.filter(inv => inv.status === 'paid').slice(0, 5)
                                if (paidInvoicesDetail.length === 0) {
                                  return <p className="text-xs text-opsly-secondary italic">No paid invoices recorded.</p>
                                }
                                return (
                                  <div className="divide-y divide-opsly-border">
                                    {paidInvoicesDetail.map((inv) => (
                                      <div key={inv.id} className="py-2.5 flex justify-between items-center text-xs">
                                        <div>
                                          <p className="font-bold text-opsly-text">{inv.invoice_number}</p>
                                          <p className="text-[10px] text-opsly-muted mt-0.5">
                                            Client: {inv.contact?.name || 'Unknown'} • Paid on {inv.viewed_date ? new Date(inv.viewed_date).toLocaleDateString() : new Date(inv.created_at).toLocaleDateString()}
                                          </p>
                                        </div>
                                        <span className="font-bold text-opsly-accent">{currentClient?.currency_symbol || '$'}{Number(inv.grand_total).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )
                              })()}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Paid Plan Quick Actions */}
                      {currentPlan !== 'free' && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-semibold text-opsly-secondary uppercase tracking-wider">Quick Actions</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <button
                              onClick={() => { setCommandBarPrefill('Create an invoice for '); focusCommandBar(); }}
                              className="p-4 bg-opsly-card border border-opsly-border hover:border-opsly-accent/45 rounded-xl text-left cursor-pointer transition-all duration-150 flex flex-col justify-between group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-opsly-accent/10 text-opsly-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <span className="text-xs font-semibold text-opsly-text">New Invoice</span>
                            </button>
                            <button
                              onClick={() => { setCommandBarPrefill(`Schedule a ${overrideText('job', 'jobs')} for `); focusCommandBar(); }}
                              className="p-4 bg-opsly-card border border-opsly-border hover:border-opsly-accent/45 rounded-xl text-left cursor-pointer transition-all duration-150 flex flex-col justify-between group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-opsly-accent/10 text-opsly-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <span className="text-xs font-semibold text-opsly-text">New {overrideText('Job', 'jobs')}</span>
                            </button>
                            <button
                              onClick={() => { setCommandBarPrefill(`Add a ${overrideText('client', 'contacts')} `); focusCommandBar(); }}
                              className="p-4 bg-opsly-card border border-opsly-border hover:border-opsly-accent/45 rounded-xl text-left cursor-pointer transition-all duration-150 flex flex-col justify-between group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-opsly-accent/10 text-opsly-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <span className="text-xs font-semibold text-opsly-text">New {overrideText('Client', 'contacts')}</span>
                            </button>
                            <button
                              onClick={() => { setCommandBarPrefill('Create an estimate for '); focusCommandBar(); }}
                              className="p-4 bg-opsly-card border border-opsly-border hover:border-opsly-accent/45 rounded-xl text-left cursor-pointer transition-all duration-150 flex flex-col justify-between group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-opsly-accent/10 text-opsly-accent flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <span className="text-xs font-semibold text-opsly-text">New Estimate</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Dynamic Content Grid */}
                      {currentPlan === 'free' ? (
                        <div className="grid grid-cols-1 gap-6">
                          {/* Suggestion list for Free plan */}
                          <div className="bg-opsly-card border border-opsly-border rounded-xl p-6 shadow-sm">
                            <h3 className="text-base font-semibold text-opsly-text mb-2">Get Started</h3>
                            <p className="text-xs text-opsly-secondary leading-relaxed mb-4">
                              Opsly understands natural language. Click a suggestion below to prefill the AI bar at the bottom:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <button 
                                onClick={() => { setCommandBarPrefill('Create an invoice of $350 for Sarah'); focusCommandBar(); }} 
                                className="text-left p-4 bg-opsly-input hover:bg-opsly-hover rounded-xl border border-opsly-border text-xs text-opsly-secondary italic cursor-pointer transition-colors duration-150 flex flex-col justify-between min-h-[100px]"
                              >
                                <span className="font-semibold not-italic text-opsly-accent mb-2">Invoice client</span>
                                "Create invoice of $350 for Sarah"
                              </button>
                              <button 
                                onClick={() => { setCommandBarPrefill('Add client Mike Thompson'); focusCommandBar(); }} 
                                className="text-left p-4 bg-opsly-input hover:bg-opsly-hover rounded-xl border border-opsly-border text-xs text-opsly-secondary italic cursor-pointer transition-colors duration-150 flex flex-col justify-between min-h-[100px]"
                              >
                                <span className="font-semibold not-italic text-opsly-accent mb-2">Add new contact</span>
                                "Add client Mike Thompson"
                              </button>
                              <button 
                                onClick={() => { setCommandBarPrefill('Schedule a job on Friday at 9am'); focusCommandBar(); }} 
                                className="text-left p-4 bg-opsly-input hover:bg-opsly-hover rounded-xl border border-opsly-border text-xs text-opsly-secondary italic cursor-pointer transition-colors duration-150 flex flex-col justify-between min-h-[100px]"
                              >
                                <span className="font-semibold not-italic text-opsly-accent mb-2">Schedule dispatch</span>
                                "Schedule a job on Friday at 9am"
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Automated Follow-ups Approval Queue */}
                          {(() => {
                            const today = new Date()
                            const pendingFollowups = invoices.filter(inv => {
                              if (!['sent', 'viewed', 'overdue'].includes(inv.status)) return false
                              if (!inv.due_date) return false
                              const dueDate = new Date(inv.due_date)
                              if (dueDate >= today) return false

                              const diffTime = Math.abs(today - dueDate)
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                              
                              const chaserHistory = inv.payments?.chaser_history || {}
                              
                              if (diffDays >= 14 && !chaserHistory.day14_sent_at) {
                                inv.pendingType = 'Final Notice'
                                inv.pendingDays = diffDays
                                return true
                              }
                              if (diffDays >= 7 && !chaserHistory.day7_sent_at && !chaserHistory.day14_sent_at) {
                                inv.pendingType = 'Firmer Follow-up'
                                inv.pendingDays = diffDays
                                return true
                              }
                              if (diffDays >= 3 && !chaserHistory.day3_sent_at && !chaserHistory.day7_sent_at && !chaserHistory.day14_sent_at) {
                                inv.pendingType = 'Polite Reminder'
                                inv.pendingDays = diffDays
                                return true
                              }
                              return false
                            })

                            const isPro = ['pro', 'business', 'enterprise', 'custom'].includes(currentPlan)

                            return (
                              <div className="bg-opsly-card border border-opsly-border rounded-xl p-6 space-y-4 shadow-sm relative overflow-hidden">
                                {!isPro && (
                                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-opsly-accent-soft text-opsly-accent border border-opsly-accent/25 font-bold text-[9px] uppercase tracking-wider">
                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Pro Feature
                                  </div>
                                )}

                                <div>
                                  <h3 className="text-sm font-bold text-opsly-text uppercase tracking-wider">Automated Payments Follow-up Queue</h3>
                                  <p className="text-[10px] text-opsly-secondary mt-0.5">
                                    AI drafts smart late chaser emails. Owner approval is required before dispatching to client inbox.
                                  </p>
                                </div>

                                {pendingFollowups.length === 0 ? (
                                  <p className="text-xs text-opsly-secondary italic pt-2">No pending invoice follow-up actions requiring review today.</p>
                                ) : (
                                  <div className="divide-y divide-opsly-border/40">
                                    {pendingFollowups.map((inv) => (
                                      <div key={inv.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-opsly-text">{inv.invoice_number}</span>
                                            <span className="px-1.5 py-0.5 rounded bg-[#c0614f]/15 text-[#c0614f] border border-[#c0614f]/30 font-bold text-[9px] uppercase tracking-wider">
                                              {inv.pendingType}
                                            </span>
                                            <span className="text-[10px] text-opsly-muted">{inv.pendingDays} days overdue</span>
                                          </div>
                                          <p className="text-[10px] text-opsly-secondary mt-1">
                                            Customer: <span className="font-semibold text-opsly-text">{inv.contact?.name || 'Unknown'}</span> ({inv.contact?.email || 'no email'})
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="font-extrabold text-opsly-text">{inv.currency_symbol || '$'}{Number(inv.grand_total || 0).toFixed(2)}</span>
                                          <button
                                            onClick={() => handleApproveFollowup(inv)}
                                            className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] duration-150 flex items-center gap-1"
                                          >
                                            {!isPro && (
                                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                              </svg>
                                            )}
                                            Approve &amp; Send
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {(currentNicheConfig?.layout_config?.dashboard_priority || ['active_jobs', 'outstanding_invoices', 'recent_activity']).map((widgetKey) => renderWidget(widgetKey))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* CLIENTS TAB */}
                  {activeTab === 'clients' && (
                    <div className="space-y-6">
                      {selectedContact ? (
                        <ContactProfile
                          contact={selectedContact}
                          onBack={() => {
                            setSelectedContact(null)
                            fetchContacts()
                          }}
                          onUpdate={(updated) => {
                            setSelectedContact(updated)
                            fetchContacts()
                          }}
                          currentPlan={currentPlan}
                          currentNicheConfig={currentNicheConfig}
                          onShowToast={handleAction}
                          onCreateJob={handleCreateJobForContact}
                          onCreateInvoice={handleCreateInvoiceForContact}
                        />
                      ) : (
                        <div className="space-y-6">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                              <h1 className="text-2xl font-bold text-opsly-text tracking-tight">{overrideText('Clients CRM', 'contacts')}</h1>
                              <p className="text-xs text-opsly-secondary mt-1">Manage and track your customer accounts.</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {currentPlan === 'free' ? (
                                <>
                                  <button
                                    onClick={() => handleAction("Free plan accounts are limited to exactly 3 permanent contacts. Upgrade to add more.")}
                                    className="bg-opsly-accent/40 text-opsly-text/60 border border-opsly-border px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Add {overrideText('Client', 'contacts')}
                                  </button>
                                  <button
                                    onClick={() => handleAction("CSV Import requires a paid plan. Please upgrade to use this feature.")}
                                    className="bg-opsly-input border border-opsly-border hover:bg-opsly-hover text-opsly-secondary px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Import CSV
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setShowAddContactModal(true)}
                                    className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-opsly-accent/15 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
                                  >
                                    Add {overrideText('Client', 'contacts')}
                                  </button>
                                  <button
                                    onClick={() => setShowCsvImportModal(true)}
                                    className="bg-opsly-input border border-opsly-border hover:bg-opsly-hover text-opsly-text px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
                                  >
                                    Import CSV
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Free Plan Warning Banner */}
                          {currentPlan === 'free' && (
                            <div className="bg-opsly-accent-soft border border-opsly-accent/25 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-opsly-text">
                              <svg className="w-5 h-5 text-opsly-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <p className="font-semibold text-opsly-accent">Free Plan CRM Gating Rule</p>
                                <p className="text-opsly-secondary mt-0.5">
                                  Free plan accounts are limited to exactly 3 permanent, non-deletable, and non-replaceable contacts.
                                  To add more, import CSV spreadsheets, or edit/delete contact identities, please upgrade to a paid plan.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Search and Filters Controls */}
                          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-opsly-card/40 border border-opsly-border rounded-xl p-4">
                            {/* Search */}
                            <div className="relative w-full md:max-w-md">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-opsly-muted">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </span>
                              <input
                                type="text"
                                placeholder={`Search by name, email, or phone...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg pl-9 pr-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                              />
                            </div>

                            {/* Status Filters */}
                            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                              {['all', 'active', 'lead', 'dormant'].map((filter) => (
                                <button
                                  key={filter}
                                  onClick={() => setStatusFilter(filter)}
                                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold capitalize whitespace-nowrap cursor-pointer transition-all border ${
                                    statusFilter === filter
                                      ? 'bg-opsly-accent-soft border-opsly-accent text-opsly-text'
                                      : 'bg-opsly-input/30 border-opsly-border text-opsly-secondary hover:text-opsly-text'
                                  }`}
                                >
                                  {filter}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Contacts Grid */}
                          {isFetchingContacts ? (
                            <div className="flex flex-col items-center justify-center py-20 text-opsly-muted space-y-3">
                              <svg className="animate-spin h-6 w-6 text-opsly-accent" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span className="text-xs">Loading contacts...</span>
                            </div>
                          ) : contacts.length === 0 ? (
                            <div className="bg-opsly-card border border-opsly-border rounded-xl p-12 text-center flex flex-col items-center justify-center shadow-sm">
                              <div className="w-12 h-12 rounded-full bg-opsly-input border border-opsly-border flex items-center justify-center mb-4 text-opsly-muted">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                              <h3 className="text-sm font-semibold text-opsly-text">No contacts found</h3>
                              <p className="text-xs text-opsly-secondary max-w-xs mt-1.5 leading-relaxed">
                                {currentPlan === 'free'
                                  ? 'Your seeded free plan contacts should appear here. Please reload if they are missing.'
                                  : 'Your customer accounts will be listed here. Add a contact above or type "add client" in the command bar.'}
                              </p>
                            </div>
                          ) : (
                            (() => {
                              const filtered = contacts.filter(contact => {
                                const matchesSearch = 
                                  contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                  (contact.phone && contact.phone.includes(searchQuery));
                                
                                const matchesStatus = 
                                  statusFilter === 'all' || 
                                  (contact.status && contact.status.toLowerCase() === statusFilter.toLowerCase());

                                return matchesSearch && matchesStatus;
                              });

                              if (filtered.length === 0) {
                                return (
                                  <div className="bg-opsly-card border border-opsly-border rounded-xl p-8 text-center text-xs text-opsly-secondary leading-relaxed">
                                    No contacts match your current search queries or filters.
                                  </div>
                                );
                              }

                              const getStatusColor = (status) => {
                                switch (status?.toLowerCase()) {
                                  case 'active':
                                    return 'text-opsly-success bg-opsly-success/10 border-opsly-success/20'
                                  case 'lead':
                                    return 'text-opsly-accent bg-opsly-accent-soft border-opsly-accent/20'
                                  case 'dormant':
                                    return 'text-opsly-muted bg-opsly-input border-opsly-border'
                                  default:
                                    return 'text-opsly-secondary bg-opsly-input border-opsly-border'
                                }
                              }

                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {filtered.map(contact => (
                                    <div
                                      key={contact.id}
                                      onClick={() => setSelectedContact(contact)}
                                      className="bg-opsly-card border border-opsly-border hover:border-opsly-accent/40 rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col justify-between min-h-[160px] relative overflow-hidden group"
                                    >
                                      {/* Hover subtle background accent */}
                                      <div className="absolute inset-0 bg-opsly-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                      
                                      <div className="relative z-10 space-y-2.5">
                                        <div className="flex justify-between items-start gap-3">
                                          <h3 className="text-sm font-bold text-opsly-text truncate group-hover:text-opsly-accent transition-colors">{contact.name}</h3>
                                          <span className={`text-[8px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getStatusColor(contact.status)}`}>
                                            {contact.status || 'Active'}
                                          </span>
                                        </div>

                                        <div className="space-y-1.5 text-[11px] text-opsly-secondary">
                                          <div className="flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5 text-opsly-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002-22z" /> {/* Note: Clean up if SVG is broken, standard mail icon */}
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span className="truncate">{contact.email || 'No email'}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5 text-opsly-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span className="truncate">{contact.phone || 'No phone'}</span>
                                          </div>
                                          {contact.address && (
                                            <div className="flex items-center gap-2">
                                              <svg className="w-3.5 h-3.5 text-opsly-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                              </svg>
                                              <span className="truncate">{contact.address}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="relative z-10 pt-2 border-t border-opsly-border mt-3 flex justify-between items-center text-[10px] text-opsly-muted">
                                        <span>Added {new Date(contact.created_at).toLocaleDateString()}</span>
                                        <span className="text-opsly-accent font-semibold group-hover:translate-x-1 transition-transform duration-150 flex items-center gap-0.5">
                                          View Profile
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                          </svg>
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* JOBS TAB */}
                  {activeTab === 'jobs' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h1 className="text-2xl font-bold text-opsly-text tracking-tight">Jobs &amp; Schedule</h1>
                          <p className="text-xs text-opsly-secondary mt-1">Calendar dispatching and job costing.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Google Calendar Sync button */}
                          {currentPlan !== 'free' && (
                            currentClient?.google_calendar_connected ? (
                              <div className="flex items-center gap-2 bg-[#161514] border border-opsly-border rounded-lg px-3 py-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[10px] font-bold text-opsly-secondary">Synced</span>
                                <button
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from('clients')
                                        .update({ google_calendar_connected: false })
                                        .eq('id', currentClient.id)
                                      if (error) throw error
                                      setCurrentClient({ ...currentClient, google_calendar_connected: false })
                                      handleAction("Google Calendar disconnected.")
                                    } catch (err) {
                                      console.error(err)
                                    }
                                  }}
                                  className="text-[10px] text-opsly-muted hover:text-opsly-text font-bold ml-1.5 cursor-pointer"
                                >
                                  Disconnect
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowGoogleOAuth(true)}
                                className="bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-text text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                                </svg>
                                Sync GCal
                              </button>
                            )
                          )}
                          
                          {currentPlan !== 'free' && (
                            <button
                              onClick={() => {
                                setJobBuilderDate(null);
                                setSelectedJob(null);
                                setIsJobBuilderOpen(true);
                              }}
                              className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Add Job
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Calendar Scheduler */}
                      <CalendarView
                        currentPlan={currentPlan}
                        currentClient={currentClient}
                        onSelectJob={(job) => {
                          setSelectedJob(job);
                          setIsJobDetailsOpen(true);
                        }}
                        onAddJob={(date) => {
                          setJobBuilderDate(date);
                          setSelectedJob(null);
                          setIsJobBuilderOpen(true);
                        }}
                        jobs={jobs}
                        refreshJobs={fetchJobs}
                      />
                    </div>
                  )}

                  {/* INVOICES TAB */}
                  {activeTab === 'invoices' && (
                    <div className="space-y-6">
                      {invoiceSubView === 'create' || invoiceSubView === 'edit' ? (
                        <InvoiceBuilder
                          invoiceId={invoiceSubView === 'edit' ? selectedInvoiceId : null}
                          onBack={() => {
                            setInvoiceSubView('list')
                            setInvoicePrefillData(null)
                          }}
                          onSave={() => {
                            fetchInvoices()
                            fetchDashboardData()
                            setInvoicePrefillData(null)
                          }}
                          currentPlan={currentPlan}
                          currentClient={currentClient}
                          onShowToast={handleAction}
                          prefillData={invoicePrefillData}
                        />
                      ) : invoiceSubView === 'portal' ? (
                        <InvoicePortal
                          invoiceId={selectedInvoiceId}
                          onClose={() => setInvoiceSubView('list')}
                        />
                      ) : (
                        <div className="space-y-6">
                          {/* Title & Actions */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <h1 className="text-2xl font-bold text-opsly-text tracking-tight">Invoices</h1>
                              <p className="text-xs text-opsly-secondary mt-1">Billing, payment links, and invoice history.</p>
                            </div>
                            <button
                              onClick={() => {
                                if (currentPlan === 'free' && invoices.length >= 5) {
                                  handleAction('You have reached the Free plan limit of 5 lifetime invoices.')
                                  return
                                }
                                setInvoiceSubView('create')
                              }}
                              disabled={currentPlan === 'free' && invoices.length >= 5}
                              className="w-full sm:w-auto bg-opsly-accent hover:bg-opsly-accent-hover disabled:bg-opsly-accent/40 text-opsly-text px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-1.5 shadow-lg shadow-opsly-accent/15"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add Invoice
                            </button>
                          </div>

                          {/* Free Limit Warning Banner */}
                          {currentPlan === 'free' && (
                            <div className="bg-opsly-input border border-opsly-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div className="space-y-0.5">
                                <p className="font-bold text-opsly-text">Free Plan Invoice Limits</p>
                                <p className="text-opsly-secondary">You have used {invoices.length} of your 5 lifetime invoices.</p>
                              </div>
                              {invoices.length >= 5 ? (
                                <span className="font-semibold text-opsly-error">Limit Reached</span>
                              ) : (
                                <span className="text-opsly-muted font-medium">{5 - invoices.length} left</span>
                              )}
                            </div>
                          )}

                          {/* Search and Filters */}
                          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-opsly-card border border-opsly-border rounded-xl p-4">
                            {/* Search bar */}
                            <div className="w-full md:w-80 relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-opsly-muted">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </span>
                              <input
                                type="text"
                                placeholder="Search by number or contact..."
                                value={invoiceSearchQuery}
                                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                                className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg pl-9 pr-4 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                              />
                            </div>

                            {/* Status filters */}
                            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                              {['all', 'draft', 'sent', 'viewed', 'paid', 'overdue'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => setInvoiceStatusFilter(status)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                                    invoiceStatusFilter === status
                                      ? 'bg-opsly-accent text-opsly-text font-bold'
                                      : 'bg-opsly-input text-opsly-secondary hover:text-opsly-text border border-opsly-border'
                                  }`}
                                >
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Invoices List / Table */}
                          {isFetchingInvoices ? (
                            <div className="space-y-3">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 bg-opsly-card border border-opsly-border rounded-xl animate-pulse" />
                              ))}
                            </div>
                          ) : (() => {
                            const filteredInvoices = invoices.filter(inv => {
                              const matchesSearch = inv.invoice_number.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
                                (inv.contact?.name && inv.contact.name.toLowerCase().includes(invoiceSearchQuery.toLowerCase()))
                              
                              const matchesStatus = invoiceStatusFilter === 'all' || inv.status === invoiceStatusFilter
                              return matchesSearch && matchesStatus
                            })

                            if (filteredInvoices.length === 0) {
                              return (
                                <div className="bg-opsly-card border border-opsly-border rounded-xl p-12 text-center flex flex-col items-center justify-center">
                                  <div className="w-12 h-12 rounded-full bg-opsly-input border border-opsly-border flex items-center justify-center mb-4 text-opsly-muted">
                                    <svg className="w-6 h-6 text-opsly-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <h3 className="text-sm font-semibold text-opsly-text">No invoices found</h3>
                                  <p className="text-xs text-opsly-secondary max-w-xs mt-1.5 leading-relaxed">
                                    Create invoices using the button above or type <span className="font-semibold text-opsly-accent">"create invoice"</span> in the AI bar.
                                  </p>
                                </div>
                              )
                            }

                            return (
                              <div className="bg-opsly-card border border-opsly-border rounded-xl overflow-hidden shadow-sm">
                                {/* Mobile View (Card List) */}
                                <div className="block md:hidden divide-y divide-opsly-border">
                                  {filteredInvoices.map((inv) => {
                                    const currencySym = inv.currency_symbol || '$'
                                    return (
                                      <div key={inv.id} className="p-4 space-y-3 hover:bg-opsly-input/5 transition-colors">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <span className="text-xs font-bold text-opsly-text">{inv.invoice_number}</span>
                                            <span className="block text-[11px] text-opsly-secondary mt-0.5">{inv.contact?.name || 'No contact'}</span>
                                          </div>
                                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                                            inv.status === 'paid' ? 'bg-green-950/40 text-green-300 border-green-800/40' :
                                            inv.status === 'overdue' ? 'bg-red-950/40 text-red-300 border-red-800/40' :
                                            inv.status === 'viewed' ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' :
                                            inv.status === 'sent' ? 'bg-blue-950/40 text-blue-300 border-blue-800/40' :
                                            'bg-opsly-input text-opsly-secondary border-opsly-border'
                                          }`}>
                                            {inv.status}
                                          </span>
                                        </div>

                                        <div className="flex justify-between items-center text-xs">
                                          <div className="text-opsly-secondary text-[11px]">
                                            Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                                          </div>
                                          <span className="font-bold text-opsly-text text-sm">
                                            {currencySym}{Number(inv.grand_total).toFixed(2)}
                                          </span>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2">
                                          <button
                                            onClick={() => {
                                              setSelectedInvoiceId(inv.id)
                                              setInvoiceSubView('portal')
                                            }}
                                            className="px-2.5 py-1.5 bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-text rounded-xl text-[10px] font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                          >
                                            Portal
                                          </button>
                                          {inv.status === 'draft' && (
                                            <button
                                              onClick={() => {
                                                setSelectedInvoiceId(inv.id)
                                                setInvoiceSubView('edit')
                                              }}
                                              className="px-2.5 py-1.5 bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-text rounded-xl text-[10px] font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                              Edit
                                            </button>
                                          )}
                                          {inv.status !== 'paid' && (
                                            <button
                                              onClick={async () => {
                                                try {
                                                  const { error } = await supabase
                                                    .from('invoices')
                                                    .update({ status: 'paid', paid_date: new Date().toISOString() })
                                                    .eq('id', inv.id)
                                                  if (error) throw error
                                                  handleAction('Invoice marked as paid!')
                                                  fetchInvoices()
                                                  fetchDashboardData()
                                                } catch (err) {
                                                  console.error(err)
                                                  handleAction('Failed to mark invoice as paid.')
                                                }
                                              }}
                                              className="px-2.5 py-1.5 bg-green-950/40 text-green-300 border border-green-800/40 hover:bg-green-900/40 rounded-xl text-[10px] font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                              Mark Paid
                                            </button>
                                          )}
                                          <button
                                            onClick={() => {
                                              triggerConfirm({
                                                title: 'Delete Invoice',
                                                message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
                                                confirmText: 'Delete',
                                                isDanger: true,
                                                onConfirm: async () => {
                                                  try {
                                                    const { error } = await supabase
                                                      .from('invoices')
                                                      .delete()
                                                      .eq('id', inv.id)
                                                    if (error) throw error
                                                    handleAction('Invoice deleted successfully!')
                                                    fetchInvoices()
                                                    fetchDashboardData()
                                                  } catch (err) {
                                                    console.error(err)
                                                    handleAction('Failed to delete invoice.')
                                                  }
                                                }
                                              })
                                            }}
                                            className="px-2 py-1.5 bg-red-950/20 text-red-400 hover:text-red-300 border border-red-900/20 rounded-xl text-[10px] font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            title="Delete"
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>

                                {/* Desktop View (Table) */}
                                <div className="hidden md:block overflow-x-auto">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="border-b border-opsly-border bg-opsly-input/20 text-opsly-secondary font-semibold">
                                        <th className="p-4">Invoice #</th>
                                        <th className="p-4">Contact</th>
                                        <th className="p-4">Due Date</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Total</th>
                                        <th className="p-4 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-opsly-border text-opsly-text">
                                      {filteredInvoices.map((inv) => {
                                        const currencySym = inv.currency_symbol || '$'
                                        return (
                                          <tr key={inv.id} className="hover:bg-opsly-input/10 transition-colors">
                                            <td className="p-4 font-bold text-opsly-text">{inv.invoice_number}</td>
                                            <td className="p-4 text-opsly-secondary">{inv.contact?.name || 'No contact'}</td>
                                            <td className="p-4 text-opsly-secondary">
                                              {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="p-4">
                                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                                inv.status === 'paid' ? 'bg-green-950/40 text-green-300 border-green-800/40' :
                                                inv.status === 'overdue' ? 'bg-red-950/40 text-red-300 border-red-800/40' :
                                                inv.status === 'viewed' ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' :
                                                inv.status === 'sent' ? 'bg-blue-950/40 text-blue-300 border-blue-800/40' :
                                                'bg-opsly-input text-opsly-secondary border-opsly-border'
                                              }`}>
                                                {inv.status}
                                              </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-opsly-text">
                                              {currencySym}{Number(inv.grand_total).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right relative">
                                               <div className="flex justify-end items-center relative">
                                                 <button
                                                   onClick={(e) => {
                                                     e.stopPropagation();
                                                     setActiveInvoiceMenuId(activeInvoiceMenuId === inv.id ? null : inv.id);
                                                   }}
                                                   className="p-1.5 rounded-xl bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-secondary hover:text-opsly-text cursor-pointer transition-colors"
                                                   title="Actions"
                                                 >
                                                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                                   </svg>
                                                 </button>

                                                 {/* Dropdown Menu */}
                                                 <AnimatePresence>
                                                   {activeInvoiceMenuId === inv.id && (
                                                     <>
                                                       {/* Click away backdrop */}
                                                       <div 
                                                         className="fixed inset-0 z-10" 
                                                         onClick={(e) => {
                                                           e.stopPropagation();
                                                           setActiveInvoiceMenuId(null);
                                                         }} 
                                                       />
                                                       
                                                       <motion.div
                                                         initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                                         exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                         transition={{ duration: 0.1 }}
                                                         className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-opsly-border bg-opsly-card/95 backdrop-blur-md shadow-2xl p-1.5 flex flex-col items-start gap-0.5"
                                                       >
                                                         <button
                                                           onClick={() => {
                                                             setSelectedInvoiceId(inv.id)
                                                             setInvoiceSubView('portal')
                                                             setActiveInvoiceMenuId(null)
                                                           }}
                                                           className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-opsly-hover text-opsly-text transition-colors flex items-center gap-2 cursor-pointer"
                                                         >
                                                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                           </svg>
                                                           View Portal
                                                         </button>

                                                         <button
                                                           onClick={() => {
                                                             setSelectedInvoiceId(inv.id)
                                                             setInvoiceSubView('edit')
                                                             setActiveInvoiceMenuId(null)
                                                           }}
                                                           className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-opsly-hover text-opsly-text transition-colors flex items-center gap-2 cursor-pointer"
                                                         >
                                                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                           </svg>
                                                           Edit Invoice
                                                         </button>

                                                         {inv.status !== 'paid' && (
                                                           <button
                                                             onClick={async () => {
                                                               try {
                                                                 const { error } = await supabase
                                                                   .from('invoices')
                                                                   .update({ status: 'paid', paid_date: new Date().toISOString() })
                                                                   .eq('id', inv.id)
                                                                 if (error) throw error
                                                                 triggerZapierWebhook('invoice.paid', inv)
                                                                 handleAction('Invoice marked as paid!')
                                                                 fetchInvoices()
                                                                 fetchDashboardData()
                                                               } catch (err) {
                                                                 console.error(err)
                                                                 handleAction('Failed to mark invoice as paid.')
                                                               } finally {
                                                                 setActiveInvoiceMenuId(null)
                                                               }
                                                             }}
                                                             className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-opsly-hover text-green-400 hover:text-green-300 transition-colors flex items-center gap-2 cursor-pointer"
                                                           >
                                                             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                             </svg>
                                                             Mark as Paid
                                                           </button>
                                                         )}

                                                         {(inv.status === 'sent' || inv.status === 'viewed' || inv.status === 'overdue') && (
                                                           <button
                                                             onClick={async () => {
                                                               try {
                                                                 handleAction('Resending email...')
                                                                 const emailRes = await fetch('/api/send-invoice-email', {
                                                                   method: 'POST',
                                                                   headers: { 'Content-Type': 'application/json' },
                                                                   body: JSON.stringify({
                                                                     invoiceId: inv.id,
                                                                     recipientEmail: inv.contact?.email || '',
                                                                     recipientName: inv.contact?.name || '',
                                                                     businessName: currentClient.business_name || 'Our Service Company'
                                                                   })
                                                                 })
                                                                 if (!emailRes.ok) throw new Error()
                                                                 handleAction('Invoice email resent!')
                                                               } catch (err) {
                                                                 handleAction('Failed to resend email.')
                                                               } finally {
                                                                 setActiveInvoiceMenuId(null)
                                                               }
                                                             }}
                                                             className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-opsly-hover text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 cursor-pointer"
                                                           >
                                                             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                             </svg>
                                                             Resend Email
                                                           </button>
                                                         )}

                                                         <div className="w-full h-px bg-opsly-border/70 my-1" />

                                                         <button
                                                           onClick={() => {
                                                             setActiveInvoiceMenuId(null)
                                                             triggerConfirm({
                                                               title: 'Delete Invoice',
                                                               message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
                                                               confirmText: 'Delete',
                                                               isDanger: true,
                                                               onConfirm: async () => {
                                                                 try {
                                                                   const { error } = await supabase
                                                                     .from('invoices')
                                                                     .delete()
                                                                     .eq('id', inv.id)
                                                                   if (error) throw error
                                                                   handleAction('Invoice deleted successfully!')
                                                                   fetchInvoices()
                                                                   fetchDashboardData()
                                                                 } catch (err) {
                                                                   console.error(err)
                                                                   handleAction('Failed to delete invoice.')
                                                                 }
                                                               }
                                                             })
                                                           }}
                                                           className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-950/20 text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 cursor-pointer"
                                                         >
                                                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                           </svg>
                                                           Delete Invoice
                                                         </button>
                                                       </motion.div>
                                                     </>
                                                   )}
                                                 </AnimatePresence>
                                               </div>
                                             </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ESTIMATES TAB */}
                  {activeTab === 'estimates' && (
                    <div className="space-y-6">
                      {estimateSubView === 'create' ? (
                        <EstimateBuilder
                          onBack={() => setEstimateSubView('list')}
                          onSave={() => {
                            fetchEstimates()
                            fetchDashboardData()
                          }}
                          currentPlan={currentPlan}
                          currentClient={currentClient}
                          onShowToast={handleAction}
                        />
                      ) : estimateSubView === 'portal' ? (
                        <EstimatePortal
                          estimateId={selectedEstimateId}
                          onClose={() => setEstimateSubView('list')}
                        />
                      ) : (
                        <div className="space-y-6">
                          {/* Title & Actions */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <h1 className="text-2xl font-bold text-opsly-text tracking-tight">Estimates</h1>
                              <p className="text-xs text-opsly-secondary mt-1">Draft quotes and proposal approvals.</p>
                            </div>
                            <button
                              onClick={() => setEstimateSubView('create')}
                              className="w-full sm:w-auto bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-1.5 shadow-lg shadow-opsly-accent/15"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              New Estimate
                            </button>
                          </div>

                          {/* Search and Filters */}
                          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-opsly-card border border-opsly-border rounded-xl p-4">
                            {/* Search bar */}
                            <div className="w-full md:w-80 relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-opsly-muted">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </span>
                              <input
                                type="text"
                                placeholder="Search by number or contact..."
                                value={estimateSearchQuery}
                                onChange={(e) => setEstimateSearchQuery(e.target.value)}
                                className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg pl-9 pr-4 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                              />
                            </div>

                            {/* Status filters */}
                            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                              {['all', 'draft', 'sent', 'approved', 'rejected', 'converted'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => setEstimateStatusFilter(status)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                                    estimateStatusFilter === status
                                      ? 'bg-opsly-accent text-opsly-text font-bold'
                                      : 'bg-opsly-input text-opsly-secondary hover:text-opsly-text border border-opsly-border'
                                  }`}
                                >
                                  {status === 'converted' ? 'Invoiced' : (status.charAt(0).toUpperCase() + status.slice(1))}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Estimates List / Table */}
                          {isFetchingEstimates ? (
                            <div className="space-y-3">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 bg-opsly-card border border-opsly-border rounded-xl animate-pulse" />
                              ))}
                            </div>
                          ) : (() => {
                            const filteredEstimates = estimates.filter(est => {
                              const matchesSearch = est.estimate_number.toLowerCase().includes(estimateSearchQuery.toLowerCase()) ||
                                (est.contact?.name && est.contact.name.toLowerCase().includes(estimateSearchQuery.toLowerCase()))
                              
                              const matchesStatus = estimateStatusFilter === 'all' || est.status === estimateStatusFilter
                              return matchesSearch && matchesStatus
                            })

                            if (filteredEstimates.length === 0) {
                              return (
                                <div className="bg-opsly-card border border-opsly-border rounded-xl p-12 text-center flex flex-col items-center justify-center">
                                  <div className="w-12 h-12 rounded-full bg-opsly-input border border-opsly-border flex items-center justify-center mb-4 text-opsly-muted">
                                    <svg className="w-6 h-6 text-opsly-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-6 9l2 2 4-4" />
                                    </svg>
                                  </div>
                                  <h3 className="text-sm font-semibold text-opsly-text">No estimates found</h3>
                                  <p className="text-xs text-opsly-secondary max-w-xs mt-1.5 leading-relaxed">
                                    Create estimates using the button above or type <span className="font-semibold text-opsly-accent">"create estimate"</span> in the AI bar.
                                  </p>
                                </div>
                              )
                            }

                            return (
                              <div className="bg-opsly-card border border-opsly-border rounded-xl overflow-hidden shadow-sm animate-fadeIn">
                                {/* Mobile View (Card List) */}
                                <div className="block md:hidden divide-y divide-opsly-border">
                                  {filteredEstimates.map((est) => {
                                    const currencySym = est.currency_symbol || '$'
                                    return (
                                      <div key={est.id} className="p-4 space-y-3 hover:bg-opsly-input/5 transition-colors">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <span className="text-xs font-bold text-opsly-text">{est.estimate_number}</span>
                                            <span className="block text-[11px] text-opsly-secondary mt-0.5">{est.contact?.name || 'No contact'}</span>
                                          </div>
                                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                                            est.status === 'approved' ? 'bg-green-950/40 text-green-300 border-green-800/40' :
                                            est.status === 'converted' ? 'bg-green-950/40 text-green-300 border-green-800/40 border-dashed' :
                                            est.status === 'rejected' ? 'bg-red-950/40 text-red-300 border-red-800/40' :
                                            est.status === 'sent' ? 'bg-blue-950/40 text-blue-300 border-blue-800/40' :
                                            'bg-opsly-input text-opsly-secondary border-opsly-border'
                                          }`}>
                                            {est.status === 'converted' ? 'invoiced' : est.status}
                                          </span>
                                        </div>

                                        <div className="flex justify-between items-center text-xs">
                                          <div className="text-opsly-secondary text-[11px]">
                                            Valid Until: {est.valid_until ? new Date(est.valid_until).toLocaleDateString() : '—'}
                                          </div>
                                          <span className="font-bold text-opsly-text text-sm">
                                            {currencySym}{Number(est.grand_total).toFixed(2)}
                                          </span>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2">
                                          {est.status === 'approved' && (
                                            <>
                                              <button
                                                onClick={() => {
                                                  setWizardEstimate(est)
                                                  setShowEstimateWizard(true)
                                                }}
                                                className="px-2.5 py-1.5 bg-[#c15f3c]/20 text-[#c15f3c] border border-[#c15f3c]/35 hover:bg-[#c15f3c]/30 rounded-xl text-[10px] font-bold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                              >
                                                Process Approval
                                              </button>
                                              <button
                                                onClick={() => handleOpenJobBuilderForEstimate(est)}
                                                className="px-2.5 py-1.5 bg-[#c15f3c]/10 text-[#c15f3c] border border-[#c15f3c]/25 hover:bg-[#c15f3c]/20 rounded-xl text-[10px] font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                              >
                                                Add as Job
                                              </button>
                                              <button
                                                onClick={() => handleConvertEstimateToInvoice(est)}
                                                className="px-2.5 py-1.5 bg-[#c15f3c]/10 text-[#c15f3c] border border-[#c15f3c]/25 hover:bg-[#c15f3c]/20 rounded-xl text-[10px] font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                              >
                                                Add as Invoice
                                              </button>
                                            </>
                                          )}
                                          <button
                                            onClick={() => {
                                              setSelectedEstimateId(est.id)
                                              setEstimateSubView('portal')
                                            }}
                                            className="px-2.5 py-1.5 bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-text rounded-xl text-[10px] font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                          >
                                            Portal
                                          </button>
                                          <button
                                            onClick={() => {
                                              triggerConfirm({
                                                title: 'Delete Estimate',
                                                message: 'Are you sure you want to delete this estimate? This action cannot be undone.',
                                                confirmText: 'Delete',
                                                isDanger: true,
                                                onConfirm: async () => {
                                                  try {
                                                    const { error } = await supabase
                                                      .from('estimates')
                                                      .delete()
                                                      .eq('id', est.id)
                                                    if (error) throw error
                                                    handleAction('Estimate deleted successfully!')
                                                    fetchEstimates()
                                                    fetchDashboardData()
                                                  } catch (err) {
                                                    console.error(err)
                                                    handleAction('Failed to delete estimate.')
                                                  }
                                                }
                                              })
                                            }}
                                            className="px-2.5 py-1.5 bg-red-950/20 text-red-400 hover:text-red-300 border border-red-900/20 rounded-xl text-[10px] font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            title="Delete"
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>

                                {/* Desktop View (Table) */}
                                <div className="hidden md:block overflow-x-auto">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="border-b border-opsly-border bg-opsly-input/20 text-opsly-secondary font-semibold">
                                        <th className="p-4">Estimate #</th>
                                        <th className="p-4">Contact</th>
                                        <th className="p-4">Valid Until</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Total</th>
                                        <th className="p-4 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-opsly-border text-opsly-text">
                                      {filteredEstimates.map((est) => {
                                        const currencySym = est.currency_symbol || '$'
                                        return (
                                          <tr key={est.id} className="hover:bg-opsly-input/10 transition-colors">
                                            <td className="p-4 font-bold text-opsly-text">{est.estimate_number}</td>
                                            <td className="p-4 text-opsly-secondary">{est.contact?.name || 'No contact'}</td>
                                            <td className="p-4 text-opsly-secondary">
                                              {est.valid_until ? new Date(est.valid_until).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="p-4">
                                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                                est.status === 'approved' ? 'bg-green-950/40 text-green-300 border-green-800/40' :
                                                est.status === 'converted' ? 'bg-green-950/40 text-green-300 border-green-800/40 border-dashed' :
                                                est.status === 'rejected' ? 'bg-red-950/40 text-red-300 border-red-800/40' :
                                                est.status === 'sent' ? 'bg-blue-950/40 text-blue-300 border-blue-800/40' :
                                                'bg-opsly-input text-opsly-secondary border-opsly-border'
                                              }`}>
                                                {est.status === 'converted' ? 'invoiced' : est.status}
                                              </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-opsly-text">
                                              {currencySym}{Number(est.grand_total).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right relative">
                                               <div className="flex justify-end items-center relative">
                                                 {/* Convert to Invoice quick action button if approved */}
                                                 {est.status === 'approved' && (
                                                   <>
                                                      <button
                                                        onClick={() => {
                                                          setWizardEstimate(est)
                                                          setShowEstimateWizard(true)
                                                        }}
                                                        className="mr-1.5 px-2.5 py-1.5 bg-[#c15f3c]/20 text-[#c15f3c] border border-[#c15f3c]/35 hover:bg-[#c15f3c]/30 text-[10px] font-bold rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                      >
                                                        Process Approval
                                                      </button>
                                                      <button
                                                        onClick={() => handleOpenJobBuilderForEstimate(est)}
                                                        className="mr-1.5 px-2.5 py-1.5 bg-[#c15f3c]/10 text-[#c15f3c] border border-[#c15f3c]/25 hover:bg-[#c15f3c]/20 text-[10px] font-semibold rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                      >
                                                        Add as Job
                                                      </button>
                                                      <button
                                                        onClick={() => handleConvertEstimateToInvoice(est)}
                                                        className="mr-2 px-2.5 py-1.5 bg-[#c15f3c]/10 text-[#c15f3c] border border-[#c15f3c]/25 hover:bg-[#c15f3c]/20 text-[10px] font-semibold rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                      >
                                                        Add as Invoice
                                                      </button>
                                                   </>
                                                 )}

                                                 <button
                                                   onClick={(e) => {
                                                     e.stopPropagation();
                                                     setActiveEstimateMenuId(activeEstimateMenuId === est.id ? null : est.id);
                                                   }}
                                                   className="p-1.5 rounded-xl bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-secondary hover:text-opsly-text cursor-pointer transition-colors"
                                                   title="Actions"
                                                 >
                                                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                                   </svg>
                                                 </button>

                                                 {/* Dropdown Menu */}
                                                 <AnimatePresence>
                                                   {activeEstimateMenuId === est.id && (
                                                     <>
                                                       {/* Click away backdrop */}
                                                       <div 
                                                         className="fixed inset-0 z-10" 
                                                         onClick={(e) => {
                                                           e.stopPropagation();
                                                           setActiveEstimateMenuId(null);
                                                         }} 
                                                       />
                                                       
                                                       <motion.div
                                                         initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                         animate={{ opacity: 1, scale: 1, y: 0 }}
                                                         exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                         transition={{ duration: 0.1 }}
                                                         className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-opsly-border bg-opsly-card/95 backdrop-blur-md shadow-2xl p-1.5 flex flex-col items-start gap-0.5"
                                                       >
                                                         <button
                                                           onClick={() => {
                                                             setSelectedEstimateId(est.id)
                                                             setEstimateSubView('portal')
                                                             setActiveEstimateMenuId(null)
                                                           }}
                                                           className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-opsly-hover text-opsly-text transition-colors flex items-center gap-2 cursor-pointer"
                                                         >
                                                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                           </svg>
                                                           View Portal
                                                         </button>

                                                         {(est.status === 'sent' || est.status === 'approved' || est.status === 'rejected') && (
                                                           <button
                                                             onClick={async () => {
                                                               try {
                                                                 handleAction('Resending email...')
                                                                 const emailRes = await fetch('/api/send-estimate-email', {
                                                                   method: 'POST',
                                                                   headers: { 'Content-Type': 'application/json' },
                                                                   body: JSON.stringify({
                                                                     estimateId: est.id,
                                                                     recipientEmail: est.contact?.email || '',
                                                                     recipientName: est.contact?.name || '',
                                                                     businessName: currentClient.business_name || 'Our Service Company'
                                                                   })
                                                                 })
                                                                 if (!emailRes.ok) throw new Error()
                                                                 handleAction('Estimate email resent!')
                                                               } catch (err) {
                                                                 handleAction('Failed to resend email.')
                                                               } finally {
                                                                 setActiveEstimateMenuId(null)
                                                               }
                                                             }}
                                                             className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-opsly-hover text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 cursor-pointer"
                                                           >
                                                             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                             </svg>
                                                             Resend Email
                                                           </button>
                                                         )}

                                                         <div className="w-full h-px bg-opsly-border/70 my-1" />

                                                         <button
                                                           onClick={() => {
                                                             setActiveEstimateMenuId(null)
                                                             triggerConfirm({
                                                               title: 'Delete Estimate',
                                                               message: 'Are you sure you want to delete this estimate? This action cannot be undone.',
                                                               confirmText: 'Delete',
                                                               isDanger: true,
                                                               onConfirm: async () => {
                                                                 try {
                                                                   const { error } = await supabase
                                                                     .from('estimates')
                                                                     .delete()
                                                                     .eq('id', est.id)
                                                                   if (error) throw error
                                                                   handleAction('Estimate deleted successfully!')
                                                                   fetchEstimates()
                                                                   fetchDashboardData()
                                                                 } catch (err) {
                                                                   console.error(err)
                                                                   handleAction('Failed to delete estimate.')
                                                                 }
                                                               }
                                                             })
                                                           }}
                                                           className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-950/20 text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 cursor-pointer"
                                                         >
                                                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142v-11.5M4 7h16" />
                                                           </svg>
                                                           Delete Estimate
                                                         </button>
                                                       </motion.div>
                                                     </>
                                                   )}
                                                 </AnimatePresence>
                                               </div>
                                             </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* EXPENSES TAB */}
                  {activeTab === 'expenses' && (() => {
                    const monthlyExpensesList = expenses.filter(e => e.recurrence === 'monthly')
                    const oneTimeExpensesList = expenses.filter(e => e.recurrence === 'one_time' || !e.recurrence)
                    
                    const monthlyTotal = monthlyExpensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0)
                    const oneTimeTotal = oneTimeExpensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0)
                    const totalExpensesSum = monthlyTotal + oneTimeTotal

                    return (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h1 className="text-2xl font-bold text-opsly-text tracking-tight">Expenses</h1>
                            <p className="text-xs text-opsly-secondary mt-1">Log operating costs, monthly software, tools, and labor pay.</p>
                          </div>
                          <button 
                            onClick={() => {
                              setExpenseForm({
                                category: 'Materials',
                                amount: '',
                                description: '',
                                recurrence: 'one_time',
                                expenseDate: new Date().toISOString().split('T')[0],
                                jobId: ''
                              });
                              setShowExpenseModal(true);
                            }} 
                            className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] duration-150 shadow-md shadow-opsly-accent/10"
                          >
                            Log Expense
                          </button>
                        </div>

                        {/* Cost type overview grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-opsly-card border border-opsly-border rounded-xl p-5">
                            <span className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Total Expenses</span>
                            <div className="text-2xl font-extrabold text-opsly-text mt-2">
                              {currentClient?.currency_symbol || '$'}{totalExpensesSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div className="bg-opsly-card border border-opsly-border rounded-xl p-5">
                            <span className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Monthly Recurring Costs</span>
                            <div className="text-2xl font-extrabold text-opsly-text mt-2 text-[#c0614f]">
                              {currentClient?.currency_symbol || '$'}{monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-[10px] text-opsly-muted mt-1">Calculated monthly overhead expenses</p>
                          </div>
                          <div className="bg-opsly-card border border-opsly-border rounded-xl p-5">
                            <span className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">One-Time Costs</span>
                            <div className="text-2xl font-extrabold text-opsly-text mt-2 text-opsly-accent">
                              {currentClient?.currency_symbol || '$'}{oneTimeTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-[10px] text-opsly-muted mt-1">Job supplies, subcontractor pay, labor</p>
                          </div>
                        </div>

                        {expenses.length === 0 ? (
                          <div className="bg-opsly-card border border-opsly-border rounded-xl p-12 text-center flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-opsly-input border border-opsly-border flex items-center justify-center mb-4 text-opsly-muted">
                              <svg className="w-6 h-6 text-opsly-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-opsly-text">No logged expenses</h3>
                            <p className="text-xs text-opsly-secondary max-w-xs mt-1.5 leading-relaxed">
                              Log software subscriptions, job materials, and worker payouts to track your true net profitability.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-opsly-card border border-opsly-border rounded-xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-opsly-input/30 border-b border-opsly-border text-opsly-secondary font-semibold">
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Recurrence</th>
                                    <th className="p-4">Job Reference</th>
                                    <th className="p-4 text-right">Amount</th>
                                    <th className="p-4 text-center">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-opsly-border/40">
                                  {expenses.map(exp => {
                                    const matchedJobName = dashboardData.activeJobsList.find(j => j.id === exp.job_id)?.title || '—'
                                    return (
                                      <tr key={exp.id} className="hover:bg-opsly-hover/30 transition-colors">
                                        <td className="p-4 text-opsly-text font-medium">{new Date(exp.expense_date).toLocaleDateString()}</td>
                                        <td className="p-4 text-opsly-text max-w-xs truncate" title={exp.description}>{exp.description || '—'}</td>
                                        <td className="p-4">
                                          <span className="px-2 py-0.5 rounded bg-opsly-input border border-opsly-border text-opsly-secondary font-medium text-[10px]">
                                            {exp.category}
                                          </span>
                                        </td>
                                        <td className="p-4">
                                          {exp.recurrence === 'monthly' ? (
                                            <span className="px-2 py-0.5 rounded-full bg-[#c0614f]/15 text-[#c0614f] border border-[#c0614f]/30 font-bold text-[9px] uppercase tracking-wider">
                                              Monthly
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded-full bg-opsly-accent-soft text-opsly-accent border border-opsly-accent/25 font-bold text-[9px] uppercase tracking-wider">
                                              One-Time
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-4 text-opsly-secondary italic truncate max-w-xs">{matchedJobName}</td>
                                        <td className="p-4 text-right font-bold text-opsly-text">
                                          {currentClient?.currency_symbol || '$'}{Number(exp.amount || 0).toFixed(2)}
                                        </td>
                                        <td className="p-4 text-center">
                                          <button
                                            onClick={() => {
                                              triggerConfirm({
                                                title: 'Delete Expense',
                                                message: 'Are you sure you want to delete this expense record?',
                                                confirmText: 'Delete',
                                                isDanger: true,
                                                onConfirm: async () => {
                                                  try {
                                                    const { error } = await supabase
                                                      .from('expenses')
                                                      .delete()
                                                      .eq('id', exp.id)
                                                    if (error) throw error
                                                    fetchDashboardData()
                                                    handleAction("Expense deleted successfully!")
                                                  } catch (err) {
                                                    console.error(err)
                                                    handleAction("Failed to delete expense.")
                                                  }
                                                }
                                              })
                                            }}
                                            className="p-1 rounded bg-opsly-input hover:bg-red-950/20 text-opsly-secondary hover:text-red-400 border border-opsly-border transition-colors cursor-pointer"
                                            title="Delete Expense"
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* DOCUMENTS TAB */}
                  {activeTab === 'documents' && (
                    <DocumentsModule
                      currentPlan={currentPlan}
                      currentClient={currentClient}
                      onShowUpgradeModal={setShowPlanUpgradeModal}
                      onShowToast={handleAction}
                    />
                  )}



                  {/* INBOX & RESEND TAB */}
                  {activeTab === 'inbox' && (
                    <CommunicationInbox
                      currentPlan={currentPlan}
                      currentClient={currentClient}
                      onShowUpgradeModal={setShowPlanUpgradeModal}
                      onShowToast={handleAction}
                    />
                  )}

                  {/* TEAM & INSPECTORS TAB */}
                  {activeTab === 'workers' && (
                    <TeamManagement
                      currentPlan={currentPlan}
                      currentClient={currentClient}
                      onShowUpgradeModal={setShowPlanUpgradeModal}
                      onShowToast={handleAction}
                    />
                  )}

                  {/* CUSTOMER REVIEWS TAB */}
                  {activeTab === 'reviews' && (
                    <CustomerReviews
                      currentPlan={currentPlan}
                      currentClient={currentClient}
                      onShowUpgradeModal={setShowPlanUpgradeModal}
                      onShowToast={handleAction}
                    />
                  )}

                  {/* BUSINESS ANALYTICS TAB */}
                  {activeTab === 'analytics' && (
                    <AdvancedReports
                      currentPlan={currentPlan}
                      currentClient={currentClient}
                      expenses={expenses}
                      dashboardData={dashboardData}
                      onShowUpgradeModal={setShowPlanUpgradeModal}
                      onShowToast={handleAction}
                    />
                  )}

                  {/* SETTINGS TAB (Section S Settings Spec) */}
                  {activeTab === 'settings' && (
                    <div className="space-y-8">
                      <div>
                        <h1 className="text-2xl font-bold text-opsly-text tracking-tight">Portal Settings</h1>
                        <p className="text-xs text-opsly-secondary mt-1">Manage your business profile, plan billing, and integrations.</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left column: Profile Form */}
                        <div className="lg:col-span-2 space-y-6">
                          <form onSubmit={handleSettingsSave} className="bg-opsly-card border border-opsly-border rounded-xl p-6 space-y-5">
                            <h3 className="text-sm font-semibold text-opsly-text uppercase tracking-wider mb-2">Business Profile</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-opsly-secondary uppercase">Business Name</label>
                                <input
                                  type="text"
                                  value={settingsName}
                                  onChange={(e) => setSettingsName(e.target.value)}
                                  className="w-full bg-opsly-input border border-opsly-border rounded-lg px-3 py-2 text-xs text-opsly-text outline-none focus:border-opsly-accent"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-opsly-secondary uppercase">Phone Number</label>
                                <input
                                  type="tel"
                                  value={settingsPhone}
                                  onChange={(e) => setSettingsPhone(e.target.value)}
                                  className="w-full bg-opsly-input border border-opsly-border rounded-lg px-3 py-2 text-xs text-opsly-text outline-none focus:border-opsly-accent"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-opsly-secondary uppercase">Address</label>
                              <input
                                type="text"
                                value={settingsAddress}
                                onChange={(e) => setSettingsAddress(e.target.value)}
                                className="w-full bg-opsly-input border border-opsly-border rounded-lg px-3 py-2 text-xs text-opsly-text outline-none focus:border-opsly-accent"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-opsly-secondary uppercase">Billing Email</label>
                                <input
                                  type="email"
                                  value={settingsEmail}
                                  onChange={(e) => setSettingsEmail(e.target.value)}
                                  className="w-full bg-opsly-input border border-opsly-border rounded-lg px-3 py-2 text-xs text-opsly-text outline-none focus:border-opsly-accent"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-opsly-secondary uppercase">Website</label>
                                <input
                                  type="url"
                                  value={settingsWebsite}
                                  onChange={(e) => setSettingsWebsite(e.target.value)}
                                  className="w-full bg-opsly-input border border-opsly-border rounded-lg px-3 py-2 text-xs text-opsly-text outline-none focus:border-opsly-accent"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end pt-2">
                              <button
                                type="submit"
                                disabled={isSavingSettings}
                                className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                              >
                                {isSavingSettings ? 'Saving...' : 'Save Changes'}
                              </button>
                            </div>
                          </form>

                          {/* Stripe Payment Link */}
                          <div className="bg-opsly-card border border-opsly-border rounded-xl p-6 space-y-4">
                            <h3 className="text-sm font-semibold text-opsly-text uppercase tracking-wider">Payment Collection</h3>
                            <p className="text-[10px] text-opsly-muted">Paste your Stripe Payment Link below. This link appears as a "Pay Now" button on all invoices sent to your clients. Create one at <span className="text-opsly-accent">dashboard.stripe.com → Payment Links</span>.</p>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={currentClient?.stripe_payment_link || ''}
                                onChange={(e) => setCurrentClient(prev => ({ ...prev, stripe_payment_link: e.target.value }))}
                                placeholder="https://buy.stripe.com/your-link"
                                className="flex-1 bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                              />
                              <button
                                onClick={async () => {
                                  try {
                                    const { error } = await supabase
                                      .from('clients')
                                      .update({ stripe_payment_link: currentClient?.stripe_payment_link || '' })
                                      .eq('id', currentClient.id)
                                    if (error) throw error
                                    handleAction('Payment link saved!')
                                  } catch { handleAction('Could not save payment link.') }
                                }}
                                className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>

                          {/* Invoice Number Prefix */}
                          <div className="bg-opsly-card border border-opsly-border rounded-xl p-6 space-y-4">
                            <h3 className="text-sm font-semibold text-opsly-text uppercase tracking-wider">Invoice Numbering</h3>
                            <p className="text-[10px] text-opsly-muted">Set a custom prefix for your invoice numbers (e.g. INV-, MIKE-). This will be applied to all new invoices.</p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={currentClient?.invoice_prefix || ''}
                                onChange={(e) => setCurrentClient(prev => ({ ...prev, invoice_prefix: e.target.value }))}
                                placeholder="INV-"
                                className="w-40 bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                              />
                              <button
                                onClick={async () => {
                                  try {
                                    const { error } = await supabase
                                      .from('clients')
                                      .update({ invoice_prefix: currentClient?.invoice_prefix || 'INV-' })
                                      .eq('id', currentClient.id)
                                    if (error) throw error
                                    handleAction('Invoice prefix updated!')
                                  } catch { handleAction('Could not update prefix.') }
                                }}
                                className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>

                          {/* Saved Discount Presets (Growth+) */}
                          {['growth', 'pro', 'business', 'enterprise', 'custom'].includes(currentPlan) && (
                          <div className="bg-opsly-card border border-opsly-border rounded-xl p-6 space-y-4">
                            <h3 className="text-sm font-semibold text-opsly-text uppercase tracking-wider">Saved Discount Presets</h3>
                            <p className="text-[10px] text-opsly-muted">Create reusable discount presets that appear in the Invoice Builder. Saves you from re-entering discounts each time.</p>
                            {(() => {
                              const presetsKey = `opsly_discount_presets_${currentClient?.id}`
                              const savedPresets = JSON.parse(localStorage.getItem(presetsKey) || '[]')
                              return (
                                <div className="space-y-3">
                                  {savedPresets.length > 0 && (
                                    <div className="space-y-2">
                                      {savedPresets.map((p, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-opsly-input border border-opsly-border rounded-lg px-3 py-2">
                                          <div>
                                            <span className="text-xs font-semibold text-opsly-text">{p.name}</span>
                                            <span className="text-[10px] text-opsly-muted ml-2">{p.type === 'percentage' ? `${p.value}%` : `${currentClient?.currency_symbol || '$'}${p.value}`} off</span>
                                          </div>
                                          <button
                                            onClick={() => {
                                              const updated = savedPresets.filter((_, i) => i !== idx)
                                              localStorage.setItem(presetsKey, JSON.stringify(updated))
                                              handleAction('Preset removed.')
                                              setCurrentClient(prev => ({ ...prev }))
                                            }}
                                            className="text-opsly-muted hover:text-opsly-error cursor-pointer p-1"
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-1">
                                      <label className="text-[10px] font-bold text-opsly-secondary uppercase">Name</label>
                                      <input id="preset-name" type="text" placeholder="e.g. Senior Discount" className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-1.5 text-xs focus:border-opsly-accent focus:outline-none" />
                                    </div>
                                    <div className="w-20 space-y-1">
                                      <label className="text-[10px] font-bold text-opsly-secondary uppercase">Type</label>
                                      <select id="preset-type" className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-2 py-1.5 text-xs focus:border-opsly-accent focus:outline-none">
                                        <option value="percentage">%</option>
                                        <option value="flat">{currentClient?.currency_symbol || '$'}</option>
                                      </select>
                                    </div>
                                    <div className="w-20 space-y-1">
                                      <label className="text-[10px] font-bold text-opsly-secondary uppercase">Value</label>
                                      <input id="preset-value" type="number" min="0" placeholder="10" className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-2 py-1.5 text-xs focus:border-opsly-accent focus:outline-none" />
                                    </div>
                                    <button
                                      onClick={() => {
                                        const nameEl = document.getElementById('preset-name')
                                        const typeEl = document.getElementById('preset-type')
                                        const valueEl = document.getElementById('preset-value')
                                        if (!nameEl?.value?.trim() || !valueEl?.value) {
                                          handleAction('Please enter a name and value for the preset.')
                                          return
                                        }
                                        const updated = [...savedPresets, { name: nameEl.value.trim(), type: typeEl.value, value: parseFloat(valueEl.value) || 0 }]
                                        localStorage.setItem(presetsKey, JSON.stringify(updated))
                                        nameEl.value = ''
                                        valueEl.value = ''
                                        handleAction('Discount preset saved!')
                                        setCurrentClient(prev => ({ ...prev }))
                                      }}
                                      className="bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                          )}

                          {/* Connected Accounts */}
                          <div className="bg-opsly-card border border-opsly-border rounded-xl p-6 space-y-4">
                            <h3 className="text-sm font-semibold text-opsly-text uppercase tracking-wider">Connected Accounts</h3>
                            
                            <div className="divide-y divide-opsly-border">
                              <div className="py-3 flex justify-between items-center">
                                <div>
                                  <p className="text-xs font-semibold text-opsly-text">Google Calendar</p>
                                  <p className="text-[10px] text-opsly-muted mt-0.5">Sync job dispatcher scheduling automatically.</p>
                                </div>
                                {currentClient?.google_calendar_connected ? (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-950/20 text-green-400 border border-green-800/25">
                                      Connected
                                    </span>
                                    <button
                                      onClick={async () => {
                                        try {
                                          const { error } = await supabase
                                            .from('clients')
                                            .update({ google_calendar_connected: false })
                                            .eq('id', currentClient.id)
                                          if (error) throw error
                                          setCurrentClient({ ...currentClient, google_calendar_connected: false })
                                          handleAction("Google Calendar disconnected.")
                                        } catch (err) {
                                          console.error(err)
                                        }
                                      }}
                                      className="border border-opsly-border bg-opsly-input hover:bg-red-950/20 hover:text-red-400 text-opsly-secondary px-2.5 py-1.5 rounded text-[10px] font-semibold cursor-pointer transition-colors"
                                    >
                                      Disconnect
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setShowGoogleOAuth(true)}
                                    className="border border-opsly-border bg-opsly-input text-opsly-text hover:bg-opsly-hover px-3 py-1.5 rounded text-[10px] font-semibold cursor-pointer transition-colors"
                                  >
                                    Connect
                                  </button>
                                )}
                              </div>

                              {/* QuickBooks Integration */}
                              <div className="py-3 flex justify-between items-center">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-semibold text-opsly-text">QuickBooks Sync</p>
                                    {!isProOrAbove && <span className="text-[9px] px-1.5 py-0.5 bg-[#c15f3c]/20 text-[#c15f3c] font-bold rounded">PRO+</span>}
                                  </div>
                                  <p className="text-[10px] text-opsly-muted mt-0.5">Sync invoice records and payouts logs automatically.</p>
                                </div>
                                {!isProOrAbove ? (
                                  <button
                                    type="button"
                                    onClick={() => setShowPlanUpgradeModal(true)}
                                    className="border border-[#c15f3c]/30 text-[#c15f3c] hover:bg-[#c15f3c]/10 px-3 py-1.5 rounded text-[10px] font-semibold cursor-pointer transition-colors"
                                  >
                                    Unlock on Pro
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = !qbConnected
                                      setQbConnected(next)
                                      localStorage.setItem(`opsly_qb_connected_${currentClient?.id}`, String(next))
                                      handleAction(next ? 'Connected to QuickBooks Online sandbox!' : 'Disconnected QuickBooks.')
                                    }}
                                    className={`px-3 py-1.5 rounded text-[10px] font-semibold cursor-pointer transition-colors border ${
                                      qbConnected
                                        ? 'bg-green-950/20 text-green-400 border-green-800/25 hover:border-red-800/30 hover:text-red-400'
                                        : 'bg-opsly-input border-opsly-border text-opsly-text hover:bg-opsly-hover'
                                    }`}
                                  >
                                    {qbConnected ? 'Disconnect' : 'Connect'}
                                  </button>
                                )}
                              </div>

                              {/* Zapier Integration */}
                              <div className="py-3 flex justify-between items-center">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-semibold text-opsly-text">Zapier Webhooks</p>
                                    {!isProOrAbove && <span className="text-[9px] px-1.5 py-0.5 bg-[#c15f3c]/20 text-[#c15f3c] font-bold rounded">PRO+</span>}
                                  </div>
                                  <p className="text-[10px] text-opsly-muted mt-0.5">Trigger custom webhooks on invoice payment or job completes.</p>
                                </div>
                                {!isProOrAbove ? (
                                  <button
                                    type="button"
                                    onClick={() => setShowPlanUpgradeModal(true)}
                                    className="border border-[#c15f3c]/30 text-[#c15f3c] hover:bg-[#c15f3c]/10 px-3 py-1.5 rounded text-[10px] font-semibold cursor-pointer transition-colors"
                                  >
                                    Unlock on Pro
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2 max-w-[200px]">
                                    {isEditingZapier ? (
                                      <input
                                        type="url"
                                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                                        defaultValue={zapierWebhook}
                                        onBlur={(e) => {
                                          const val = e.target.value.trim()
                                          setZapierWebhook(val)
                                          localStorage.setItem(`opsly_zapier_hook_${currentClient?.id}`, val)
                                          setIsEditingZapier(false)
                                          if (val) handleAction('Zapier webhook saved!')
                                        }}
                                        className="bg-opsly-input border border-opsly-border text-opsly-text rounded px-2 py-1 text-[10px] focus:outline-none w-full"
                                        autoFocus
                                      />
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setIsEditingZapier(true)}
                                        className="border border-opsly-border bg-opsly-input text-opsly-text hover:bg-opsly-hover px-3 py-1.5 rounded text-[10px] font-semibold cursor-pointer transition-colors"
                                      >
                                        {zapierWebhook ? 'Configure Hook' : 'Connect'}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right column: Subscription Overview */}
                        <div className="space-y-6">
                          <div className="bg-opsly-card border border-opsly-border rounded-xl p-6 space-y-4">
                            <h3 className="text-sm font-semibold text-opsly-text uppercase tracking-wider">Subscription Plan</h3>
                            
                            <div className="p-4 bg-opsly-accent-soft rounded-lg border border-opsly-accent/20">
                              <p className="text-[10px] font-bold text-opsly-accent uppercase tracking-wider">Active Subscription</p>
                              <p className="text-xl font-bold text-opsly-text mt-1 capitalize">{currentPlan} Plan</p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-opsly-secondary">Monthly Price:</span>
                                <span className="font-semibold text-opsly-text">
                                  {currentPlan === 'free' ? 'Free ($0)' : currentPlan === 'starter' ? '$49/mo' : currentPlan === 'growth' ? '$99/mo' : '$199/mo'}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-opsly-secondary">Command Limit:</span>
                                <span className="font-semibold text-opsly-text">
                                  {currentPlan === 'free' ? '30' : currentPlan === 'starter' ? '500' : currentPlan === 'growth' ? '1500' : '5000'} / month
                                </span>
                              </div>
                            </div>

                            {/* Plan Change Trigger */}
                            <div className="pt-2">
                              <button
                                onClick={() => setShowPlanUpgradeModal(true)}
                                className="w-full bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-opsly-accent/15 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150"
                              >
                                {currentPlan === 'free' ? 'Upgrade Your Plan' : 'Manage Plan'}
                              </button>
                            </div>
                          </div>

                          {/* Review Platform Links */}
                          <div className="bg-opsly-card border border-opsly-border rounded-xl p-6 space-y-4">
                            <div>
                              <h3 className="text-sm font-semibold text-opsly-text uppercase tracking-wider">Review Links</h3>
                              <p className="text-[10px] text-opsly-muted mt-1">Paste your review links here. They are automatically included in invoice emails and job completion messages to encourage client feedback.</p>
                            </div>
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Google Business Review Link</label>
                                <input
                                  type="url"
                                  value={reviewSettings.googleReviewLink}
                                  onChange={(e) => setReviewSettings(p => ({ ...p, googleReviewLink: e.target.value }))}
                                  placeholder="https://g.page/r/..."
                                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Yelp Review Link</label>
                                <input
                                  type="url"
                                  value={reviewSettings.yelpLink}
                                  onChange={(e) => setReviewSettings(p => ({ ...p, yelpLink: e.target.value }))}
                                  placeholder="https://www.yelp.com/biz/..."
                                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Facebook Review Link</label>
                                <input
                                  type="url"
                                  value={reviewSettings.facebookReviewLink}
                                  onChange={(e) => setReviewSettings(p => ({ ...p, facebookReviewLink: e.target.value }))}
                                  placeholder="https://www.facebook.com/..."
                                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                                />
                              </div>
                              <button
                                disabled={isSavingReviewSettings}
                                onClick={() => {
                                  setIsSavingReviewSettings(true)
                                  localStorage.setItem(`opsly_review_settings_${currentClient?.id}`, JSON.stringify(reviewSettings))
                                  setTimeout(() => {
                                    setIsSavingReviewSettings(false)
                                    handleAction('Review links saved! They will appear on all future invoice emails.')
                                  }, 500)
                                }}
                                className="w-full bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-text px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
                              >
                                {isSavingReviewSettings ? 'Saving...' : 'Save Review Links'}
                              </button>
                            </div>
                          </div>

                          {/* App Feedback */}
                          <div className="bg-opsly-card border border-opsly-border rounded-xl p-6 space-y-4">
                            <div>
                              <h3 className="text-sm font-semibold text-opsly-text uppercase tracking-wider">Share Feedback</h3>
                              <p className="text-[10px] text-opsly-muted mt-1">Tell us what you think, what's missing, or what could be improved. Your feedback is reviewed directly by the founder.</p>
                            </div>
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Category</label>
                                <select
                                  value={feedbackCategory}
                                  onChange={(e) => setFeedbackCategory(e.target.value)}
                                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none cursor-pointer"
                                >
                                  <option value="feature_request">Feature Request</option>
                                  <option value="bug_report">Bug Report</option>
                                  <option value="ui_improvement">UI / Design Improvement</option>
                                  <option value="general">General Feedback</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-opsly-secondary uppercase tracking-wider">Your Feedback</label>
                                <textarea
                                  rows={4}
                                  value={feedbackText}
                                  onChange={(e) => setFeedbackText(e.target.value)}
                                  placeholder="Describe what you'd like to see improved or what's not working for you..."
                                  className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none resize-none"
                                />
                              </div>
                              <button
                                disabled={isSubmittingFeedback || !feedbackText.trim()}
                                onClick={async () => {
                                  if (!feedbackText.trim()) return
                                  setIsSubmittingFeedback(true)
                                  try {
                                    await supabase.from('app_feedback').insert({
                                      client_id: currentClient?.id,
                                      user_id: currentUserProfile?.id,
                                      category: feedbackCategory,
                                      message: feedbackText.trim(),
                                      business_name: currentClient?.business_name,
                                      plan: currentClient?.plan
                                    })
                                    setFeedbackText('')
                                    handleAction('Thank you! Your feedback has been sent to the Opsly team.')
                                  } catch (err) {
                                    handleAction('Could not submit feedback right now. Please try again.')
                                  } finally {
                                    setIsSubmittingFeedback(false)
                                  }
                                }}
                                className="w-full bg-[#c15f3c] hover:bg-[#a95232] text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSubmittingFeedback ? 'Sending...' : 'Submit Feedback'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

        </main>

        {/* AI COMMAND BAR pill container */}
        <CommandBar 
          onAction={handleAction} 
          onFocusChange={setIsAIFocused} 
          prefill={commandBarPrefill}
          onPrefillUsed={() => setCommandBarPrefill('')}
          messages={aiMessages}
          setMessages={setAiMessages}
          responseActive={isAIChatActive}
          setResponseActive={setIsAIChatActive}
          isMinimized={isAIChatMinimized}
          setIsMinimized={setIsAIChatMinimized}
        />

        {/* MOBILE BOTTOM NAVIGATION */}
        {!isAIFocused && (
          <MobileNav
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            onAIFocus={focusCommandBar}
            onMoreClick={() => setIsMobileMenuOpen(true)}
          />
        )}

        {/* ADD CONTACT MODAL */}
        <AnimatePresence>
          {showAddContactModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddContactModal(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-opsly-card border border-opsly-border rounded-xl w-full max-w-md p-6 relative shadow-2xl z-10 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-opsly-text">Add New {overrideText('Client', 'contacts')}</h3>
                  <button onClick={() => setShowAddContactModal(false)} className="p-1 rounded bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-secondary hover:text-opsly-text cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleAddContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={addContactName}
                      onChange={(e) => setAddContactName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Email</label>
                    <input
                      type="email"
                      value={addContactEmail}
                      onChange={(e) => setAddContactEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Phone</label>
                    <input
                      type="text"
                      value={addContactPhone}
                      onChange={(e) => setAddContactPhone(e.target.value)}
                      placeholder="e.g. (555) 123-4567"
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Address</label>
                    <input
                      type="text"
                      value={addContactAddress}
                      onChange={(e) => setAddContactAddress(e.target.value)}
                      placeholder="e.g. 123 Main St"
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Notes</label>
                    <textarea
                      value={addContactNotes}
                      onChange={(e) => setAddContactNotes(e.target.value)}
                      placeholder="Additional details..."
                      rows={2.5}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Status</label>
                    <select
                      value={addContactStatus}
                      onChange={(e) => setAddContactStatus(e.target.value)}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="lead">Lead</option>
                      <option value="dormant">Dormant</option>
                    </select>
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddContactModal(false)}
                      disabled={isSavingContact}
                      className="px-4 py-2 border border-opsly-border hover:bg-opsly-hover text-opsly-secondary rounded-xl text-xs font-semibold cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingContact}
                      className="px-5 py-2 bg-opsly-accent hover:bg-opsly-accent-hover disabled:bg-opsly-accent/40 text-opsly-text rounded-xl text-xs font-semibold cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 shadow-lg shadow-opsly-accent/15"
                    >
                      {isSavingContact ? 'Saving...' : 'Add Contact'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CSV IMPORT MODAL */}
        <AnimatePresence>
          {showCsvImportModal && (
            <CsvImportModal
              isOpen={showCsvImportModal}
              onClose={() => setShowCsvImportModal(false)}
              onImportSuccess={(msg) => {
                handleAction(msg);
                fetchContacts();
              }}
              currentPlan={currentPlan}
              clientId={currentClient?.id}
              handleUpgrade={handleUpgrade}
            />
          )}
        </AnimatePresence>

        {/* JOB BUILDER MODAL */}
        <AnimatePresence>
          {isJobBuilderOpen && (
            <JobBuilderModal
              isOpen={isJobBuilderOpen}
              onClose={() => {
                setIsJobBuilderOpen(false);
                setJobBuilderDate(null);
              }}
              onSaveSuccess={() => {
                fetchJobs();
                fetchDashboardData();
                if (currentClient?.google_calendar_connected) {
                  handleAction("Synced with Google Calendar!");
                } else {
                  handleAction("Job saved successfully!");
                }
              }}
              job={selectedJob}
              clientId={currentClient?.id}
              contacts={contacts}
              initialDate={jobBuilderDate}
              currentPlan={currentPlan}
              onShowUpgradeModal={() => setShowPlanUpgradeModal(true)}
            />
          )}
        </AnimatePresence>

        {/* JOB DETAILS MODAL */}
        <AnimatePresence>
          {isJobDetailsOpen && (
            <JobDetailsModal
              isOpen={isJobDetailsOpen}
              onClose={() => setIsJobDetailsOpen(false)}
              onRefresh={() => {
                fetchJobs();
                fetchDashboardData();
              }}
              job={selectedJob}
              clientId={currentClient?.id}
              onEditJob={(job) => {
                setSelectedJob(job);
                setIsJobBuilderOpen(true);
              }}
              contacts={contacts}
              triggerConfirm={triggerConfirm}
            />
          )}
        </AnimatePresence>

        {/* GOOGLE CALENDAR OAUTH SIMULATOR */}
        {showGoogleOAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0e0d]/90 backdrop-blur-sm">
            <div className="w-full max-w-md bg-opsly-card border border-opsly-border rounded-xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="flex items-center gap-1 font-bold text-lg text-white mb-2">
                  <span className="text-blue-500">G</span>
                  <span className="text-red-500">o</span>
                  <span className="text-yellow-500">o</span>
                  <span className="text-blue-500">g</span>
                  <span className="text-green-500">l</span>
                  <span className="text-red-500">e</span>
                </div>
                <h2 className="text-sm font-bold text-opsly-text">Sign in with Google</h2>
                <p className="text-xs text-opsly-secondary">to continue to <span className="text-opsly-accent font-semibold">Opsly Dispatcher</span></p>
              </div>

              <div className="bg-opsly-input border border-opsly-border rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-opsly-accent/20 border border-opsly-accent/30 flex items-center justify-center text-opsly-accent font-bold text-xs">
                  {currentUserProfile?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-left truncate">
                  <p className="text-xs font-semibold text-opsly-text truncate">{currentUserProfile?.full_name || 'Active User'}</p>
                  <p className="text-[10px] text-opsly-muted truncate">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-opsly-secondary text-left bg-opsly-input/20 border border-opsly-border rounded-lg p-3.5">
                <p className="font-semibold text-opsly-text">Opsly requests permission to:</p>
                <div className="flex gap-2 items-start">
                  <input type="checkbox" checked readOnly className="mt-0.5 accent-opsly-accent" />
                  <span className="text-[10px] leading-relaxed text-opsly-secondary">
                    See, edit, share, and permanently delete all the calendars you can access using Google Calendar.
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowGoogleOAuth(false)}
                  className="px-4 py-2 border border-opsly-border hover:bg-opsly-hover text-opsly-secondary rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('clients')
                        .update({ google_calendar_connected: true })
                        .eq('id', currentClient.id)

                      if (error) throw error

                      setCurrentClient({ ...currentClient, google_calendar_connected: true })
                      handleAction("Google Calendar connected successfully!")
                      setShowGoogleOAuth(false)
                    } catch (err) {
                      console.error(err)
                      alert('Connection failed')
                    }
                  }}
                  className="px-5 py-2 bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Allow Access
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOG EXPENSE MODAL */}
        <AnimatePresence>
          {showExpenseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0e0d]/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-opsly-card border border-opsly-border rounded-xl shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-opsly-border bg-opsly-input/20">
                  <h2 className="text-sm font-bold text-opsly-text">Log Business Expense</h2>
                  <button
                    onClick={() => setShowExpenseModal(false)}
                    className="p-1 rounded bg-opsly-input hover:bg-opsly-hover border border-opsly-border text-opsly-secondary hover:text-opsly-text cursor-pointer transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleLogExpenseSubmit} className="p-5 space-y-4">
                  {/* Category */}
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Category</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none cursor-pointer"
                    >
                      <option value="Materials">Materials &amp; Supplies</option>
                      <option value="Labour">Labour &amp; Wages</option>
                      <option value="Software">Software &amp; Tools</option>
                      <option value="Rent">Rent &amp; Overhead</option>
                      <option value="Travel">Travel &amp; Gas</option>
                      <option value="Advertising">Advertising &amp; Marketing</option>
                      <option value="Other">Other Operational Costs</option>
                    </select>
                  </div>

                  {/* Recurrence Type */}
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Recurrence Type</label>
                    <div className="flex gap-4 items-center mt-1 bg-opsly-input border border-opsly-border rounded-lg p-2.5">
                      <label className="flex items-center gap-2 text-xs text-opsly-text cursor-pointer select-none">
                        <input
                          type="radio"
                          name="recurrence"
                          checked={expenseForm.recurrence === 'one_time'}
                          onChange={() => setExpenseForm({ ...expenseForm, recurrence: 'one_time' })}
                          className="accent-opsly-accent"
                        />
                        One-Time Cost
                      </label>
                      <label className="flex items-center gap-2 text-xs text-opsly-text cursor-pointer select-none">
                        <input
                          type="radio"
                          name="recurrence"
                          checked={expenseForm.recurrence === 'monthly'}
                          onChange={() => setExpenseForm({ ...expenseForm, recurrence: 'monthly' })}
                          className="accent-opsly-accent"
                        />
                        Monthly Recurring Cost
                      </label>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Amount ($)</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={expenseForm.expenseDate}
                      onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Description / Notes</label>
                    <textarea
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      placeholder="Receipt details, item names, or notes..."
                      rows={2.5}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text placeholder-opsly-muted rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none resize-none"
                    />
                  </div>

                  {/* Linked Job (Optional) */}
                  <div>
                    <label className="block text-[10px] font-bold text-opsly-secondary uppercase tracking-wider mb-1">Link to Job (Optional)</label>
                    <select
                      value={expenseForm.jobId}
                      onChange={(e) => setExpenseForm({ ...expenseForm, jobId: e.target.value })}
                      className="w-full bg-opsly-input border border-opsly-border text-opsly-text rounded-lg px-3 py-2 text-xs focus:border-opsly-accent focus:outline-none cursor-pointer"
                    >
                      <option value="">-- No Linked Job --</option>
                      {dashboardData.activeJobsList.map(j => (
                        <option key={j.id} value={j.id}>{j.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-3 justify-end pt-3 border-t border-opsly-border">
                    <button
                      type="button"
                      onClick={() => setShowExpenseModal(false)}
                      className="px-4 py-2 border border-opsly-border hover:bg-opsly-hover text-opsly-secondary rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-opsly-accent hover:bg-opsly-accent-hover text-opsly-text rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Save Expense
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CUSTOM CONFIRM OVERLAY */}
        <CustomConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          cancelText={confirmConfig.cancelText}
          isDanger={confirmConfig.isDanger}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        />

        {/* ESTIMATE APPROVAL WIZARD MODAL */}
        <AnimatePresence>
          {showEstimateWizard && (
            <EstimateWizardModal
              isOpen={showEstimateWizard}
              onClose={() => {
                setShowEstimateWizard(false);
                setWizardEstimate(null);
              }}
              estimate={wizardEstimate}
              clientId={currentClient?.id}
              currentPlan={currentPlan}
              onShowUpgradeModal={() => setShowPlanUpgradeModal(true)}
              onActionSuccess={(msg) => {
                handleAction(msg);
                fetchEstimates();
                fetchInvoices();
                fetchJobs();
                fetchDashboardData();
              }}
              contacts={contacts}
              currencySymbol={currentClient?.currency_symbol || '$'}
            />
          )}
        </AnimatePresence>

        {/* PLAN UPGRADE MODAL (UPSELLS) */}
        <AnimatePresence>
          {showPlanUpgradeModal && (
            <PlanUpgradeModal
              isOpen={showPlanUpgradeModal}
              onClose={() => setShowPlanUpgradeModal(false)}
              clientId={currentClient?.id}
              currentPlan={currentPlan}
              currencySymbol={currentClient?.currency_symbol || '$'}
              onUpgradeSuccess={(newPlan) => handleUpgrade(newPlan)}
            />
          )}
        </AnimatePresence>

        {/* DUPLICATE CONTACT WARNING MODAL */}
        <AnimatePresence>
          {showDuplicateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0e0d]/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1a1917] border border-[#2a2825] rounded-xl w-full max-w-sm p-5 relative shadow-2xl z-10 space-y-4"
              >
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#2a2825]">
                  <div className="w-8 h-8 rounded-full bg-[#c15f3c]/15 flex items-center justify-center text-[#c15f3c]">
                    <svg className="w-4.5 h-4.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#f4f3ee]">Duplicate Client Found</h3>
                </div>
                
                <p className="text-xs text-[#b1ada1] leading-relaxed">
                  A client named <span className="font-semibold text-[#f4f3ee]">{duplicateMatch?.name}</span> with matching email and phone number already exists in your CRM records.
                </p>
                
                <div className="flex flex-col gap-2 pt-1.5">
                  <button
                    onClick={() => {
                      setSelectedContact(duplicateMatch)
                      setShowAddContactModal(false)
                      setShowDuplicateModal(false)
                      setDuplicateMatch(null)
                      setActiveTab('clients')
                    }}
                    className="w-full py-2 bg-[#c15f3c] hover:bg-[#d4795a] text-[#f4f3ee] rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
                  >
                    Open Existing Profile
                  </button>
                  
                  <button
                    onClick={() => handleAddContactSubmit(null, true)}
                    className="w-full py-2 bg-[#1a1917] hover:bg-[#2e2b28] border border-[#2a2825] text-[#b1ada1] hover:text-[#f4f3ee] rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
                  >
                    Create Repeat Record
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowDuplicateModal(false)
                      setDuplicateMatch(null)
                    }}
                    className="w-full py-2 bg-[#242220] hover:bg-[#2e2b28] text-[#b1ada1] rounded-xl text-xs font-medium cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}

// Helper: Observes changes to the sidebar width and updates layout margins dynamically on desktop
function SidebarOffsetObserver() {
  useEffect(() => {
    const checkOffset = () => {
      const sidebarEl = document.querySelector('aside');
      if (sidebarEl) {
        const width = sidebarEl.getBoundingClientRect().width;
        document.documentElement.style.setProperty('--sidebar-offset', `${width}px`);
      }
    };

    checkOffset();
    
    // Set up a mutation observer to track width style changes on Sidebar
    const sidebarEl = document.querySelector('aside');
    if (!sidebarEl) return;
    
    const observer = new MutationObserver(checkOffset);
    observer.observe(sidebarEl, { attributes: true, attributeFilter: ['style'] });
    
    window.addEventListener('resize', checkOffset);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkOffset);
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
