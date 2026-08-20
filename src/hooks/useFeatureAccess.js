import { useAuth } from '../contexts/AuthContext'

const FEATURE_GATES = {
  scheduling: {
    minPlan: 'starter',
    label: 'Scheduling & Calendar',
    desc: 'Schedule jobs, manage dispatching, and sync with Google Calendar.'
  },
  estimates: {
    minPlan: 'starter',
    label: 'Estimates & Quotes',
    desc: 'Create professional estimates, send them to clients, and convert to invoices with one click.'
  },
  expenses: {
    minPlan: 'starter',
    label: 'Expense Tracking',
    desc: 'Log business expenses, upload receipts, and categorize them for tax preparation.'
  },
  documents: {
    minPlan: 'growth',
    label: 'Documents & Contracts',
    desc: 'Generate service contracts, scopes of work, change orders, and capture digital client signatures.'
  },
  analytics: {
    minPlan: 'growth',
    label: 'Business Analytics',
    desc: 'Analyze business profitability, recurring monthly costs, one-time expenses, and margins.'
  },
  ai_assistant: {
    minPlan: 'growth',
    label: 'AI Assistant & History',
    desc: 'Review past chat histories, save conversational threads, and access your full natural language business assistant logs.'
  },
  ai_ca: {
    minPlan: 'pro',
    label: 'AI Tax & Cost Assistant',
    desc: 'Analyze financial health, track deductions, and estimate quarterly tax liabilities (Pro plan add-on).'
  },
  automated_followups: {
    minPlan: 'pro',
    label: 'Automated Payment Chasers',
    desc: 'Send automated late payment follow-ups and reminders to clients with unpaid invoices.'
  },
  inbox: {
    minPlan: 'growth',
    label: 'Inbox & Communications',
    desc: 'Access email logs, follow-up sequences, draft message replies, and connect Twilio carrier numbers.'
  },
  workers: {
    minPlan: 'growth',
    label: 'Team & Inspectors',
    desc: 'Manage company workers, set compensation rates, and review assigned dispatch tasks.'
  },
  reviews: {
    minPlan: 'growth',
    label: 'Customer Reviews',
    desc: 'Track customer feedback, request Google reviews after job completion, and monitor your reputation.'
  }
}

const PLAN_RANKS = {
  free: 0,
  starter: 1,
  growth: 2,
  pro: 3,
  business: 4,
  enterprise: 5,
  custom: 5
}

export function useFeatureAccess() {
  const { currentClient } = useAuth()
  const currentPlan = currentClient?.plan || 'free'
  const currentRank = PLAN_RANKS[currentPlan] ?? 0

  const isSubscriptionValid = () => {
    if (currentPlan === 'free') return true
    if (!currentClient) return true

    const status = currentClient.plan_status || 'active'
    if (status === 'active') return true

    if (status === 'past_due') {
      const graceEnd = currentClient.grace_period_ends_at ? new Date(currentClient.grace_period_ends_at) : null
      if (!graceEnd) return false
      return new Date() < graceEnd
    }

    if (status === 'cancelled') {
      return false
    }

    return true
  }

  const hasAccess = (featureName) => {
    if (currentPlan !== 'free' && !isSubscriptionValid()) {
      return false
    }

    const gate = FEATURE_GATES[featureName]
    if (!gate) return true

    const requiredRank = PLAN_RANKS[gate.minPlan] ?? 0
    return currentRank >= requiredRank
  }

  const getFeatureGateInfo = (featureName) => {
    const gate = FEATURE_GATES[featureName]
    if (!gate) return null

    const requiredRank = PLAN_RANKS[gate.minPlan] ?? 0
    const allowed = isSubscriptionValid() && currentRank >= requiredRank

    return {
      hasAccess: allowed,
      planRequired: gate.minPlan,
      label: gate.label,
      desc: gate.desc
    }
  }

  const getSubscriptionInfo = () => {
    if (!currentClient) return null
    return {
      status: currentClient.plan_status || 'active',
      gracePeriodEndsAt: currentClient.grace_period_ends_at,
      isValid: isSubscriptionValid()
    }
  }

  return {
    hasAccess,
    getFeatureGateInfo,
    getSubscriptionInfo,
    currentPlan
  }
}
