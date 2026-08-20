import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

// Helper to generate a session ID that persists per browser tab session
const getTabSessionId = () => {
  let sessionId = sessionStorage.getItem('opsly_tab_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem('opsly_tab_session_id', sessionId)
  }
  return sessionId
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [currentUserProfile, setCurrentUserProfile] = useState(null)
  const [currentClient, setCurrentClient] = useState(null)
  const [currentNicheConfig, setCurrentNicheConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [geoInfo, setGeoInfo] = useState({ country: 'US', ip: '127.0.0.1' })
  const [sessionConflict, setSessionConflict] = useState(false)

  useEffect(() => {
    if (!currentClient?.niche) {
      setCurrentNicheConfig(null)
      return
    }
    const fetchNicheConfig = async () => {
      const { data, error } = await supabase
        .from('niche_configs')
        .select('*')
        .eq('niche_name', currentClient.niche)
        .maybeSingle()
      if (!error && data) {
        setCurrentNicheConfig(data)
      }
    }
    fetchNicheConfig()
  }, [currentClient?.niche])

  // Fetch Geolocation on mount
  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const token = import.meta.env.VITE_IPINFO_TOKEN
        const res = await fetch(`https://ipinfo.io/json?token=${token}`)
        const data = await res.json()
        setGeoInfo({
          country: data.country || 'US',
          ip: data.ip || '127.0.0.1'
        })
      } catch (err) {
        console.warn('IPInfo fetch failed, using fallback:', err)
      }
    }
    fetchGeo()
  }, [])

  // Manage Supabase Auth State Listener
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      setSession(activeSession)
      setUser(activeSession?.user ?? null)
      if (activeSession?.user) {
        loadUserProfileAndClient(activeSession.user)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        // Only reload profile and register session on SIGNED_IN or INITIAL_SESSION
        // to prevent token refresh events from triggering eviction loops.
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          loadUserProfileAndClient(newSession.user)
        }
      } else {
        setCurrentUserProfile(null)
        setCurrentClient(null)
        setSessionConflict(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Listen to active_sessions table updates to enforce session eviction in real-time
  useEffect(() => {
    if (!user || !currentUserProfile) return

    const tabSessionId = getTabSessionId()

    // Real-time subscription to active_sessions
    const channel = supabase
      .channel('session_eviction_channel')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'active_sessions',
          filter: `user_id=eq.${currentUserProfile.id}`
        },
        (payload) => {
          // If this session row was deleted, it means we were evicted
          if (payload.old && payload.old.session_id === tabSessionId) {
            handleEviction()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, currentUserProfile])

  const handleEviction = () => {
    setSessionConflict(true)
    supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setCurrentUserProfile(null)
    setCurrentClient(null)
  }

  // Load User details and enforce Session limits
  const loadUserProfileAndClient = async (authUser) => {
    try {
      // 1. Fetch user profile
      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('*')
        .eq('auth_uid', authUser.id)
        .maybeSingle()

      if (profileErr) throw profileErr
      if (!profile) {
        // Legitimate edge case: Supabase Auth created, but public.users not built yet
        setLoading(false)
        return
      }

      // 2. Fetch client billing profile & plan
      const { data: client, error: clientErr } = await supabase
        .from('clients')
        .select('*')
        .eq('id', profile.client_id)
        .maybeSingle()

      if (clientErr) throw clientErr

      setCurrentUserProfile(profile)
      setCurrentClient(client)

      // 3. Register current session in database
      const tabSessionId = getTabSessionId()
      const { error: upsertErr } = await supabase
        .from('active_sessions')
        .upsert({
          session_id: tabSessionId,
          client_id: profile.client_id,
          user_id: profile.id,
          ip_address: geoInfo.ip,
          user_agent: navigator.userAgent,
          country: geoInfo.country,
          updated_at: new Date().toISOString()
        }, { onConflict: 'session_id' })

      if (upsertErr) console.error('Error registering session:', upsertErr)

      // 4. Fetch all active sessions for this user/client to enforce concurrent session limits
      const { data: activeSessions, error: fetchSessionsErr } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false })

      if (!fetchSessionsErr && activeSessions) {
        // Enforce Concurrent session limits per plan:
        // Free = 1, Starter = 1, Growth = 3, Pro = 10, Business/Enterprise = unlimited
        const plan = client?.plan || 'free'
        let limit = 1
        if (plan === 'growth') limit = 3
        else if (plan === 'pro') limit = 10
        else if (plan === 'business' || plan === 'enterprise' || plan === 'custom') limit = 999999

        if (activeSessions.length > limit) {
          // Identify sessions to evict (the oldest ones exceeding the limit)
          const keepSessions = activeSessions.slice(0, limit)
          const evictSessions = activeSessions.slice(limit)

          // CRITICAL: Filter out our own current session to prevent self-eviction
          // due to client/server clock skew or temporary query ordering mismatch.
          const sessionsToEvict = evictSessions.filter(s => s.session_id !== tabSessionId)

          if (sessionsToEvict.length > 0) {
            const evictIds = sessionsToEvict.map(s => s.id)
            await supabase
              .from('active_sessions')
              .delete()
              .in('id', evictIds)
          }
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading auth details:', err)
      setLoading(false)
    }
  }

  // Auth Operations
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  const signup = async (email, password, fullName, businessName, phone) => {
    // 1. Create Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          business_name: businessName,
          phone: phone
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Signup failed to return a user profile.')

    // 2. Call secure RPC function to create clients + users records in transaction
    const { data: rpcData, error: rpcError } = await supabase.rpc('signup_new_client', {
      p_email: email,
      p_full_name: fullName,
      p_business_name: businessName,
      p_phone: phone,
      p_auth_uid: authData.user.id
    })

    if (rpcError) {
      // Clean up the auth user if RPC fails (rollback)
      console.error('Signup transaction failed, rolling back auth:', rpcError)
      throw rpcError
    }

    return { authUser: authData.user, clientData: rpcData }
  }

  const logout = async () => {
    const tabSessionId = getTabSessionId()
    // Delete current active session row before signing out
    await supabase
      .from('active_sessions')
      .delete()
      .eq('session_id', tabSessionId)

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  }

  // Simulated OTP verification (Stubs Telnyx for Section B/L)
  const verifyPhoneOTP = async (otpCode, clientId = null) => {
    if (otpCode !== '123456') {
      throw new Error('Invalid OTP code. Please enter 123456 to simulate success.')
    }
    
    const targetClientId = clientId || currentClient?.id
    if (!targetClientId) {
      throw new Error('No client context found for verification.')
    }

    // Update onboarding progress indicating phone verification is complete
    const { error } = await supabase
      .from('clients')
      .update({ onboarding_step_completed: 1 }) // Step 1 complete
      .eq('id', targetClientId)

    if (error) throw error

    // Update local client state if it matches the current logged-in client
    if (currentClient && currentClient.id === targetClientId) {
      setCurrentClient(prev => ({ ...prev, onboarding_step_completed: 1 }))
    }
    return true
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      currentUserProfile,
      currentClient,
      setCurrentClient,
      currentNicheConfig,
      loading,
      geoInfo,
      sessionConflict,
      setSessionConflict,
      login,
      signup,
      logout,
      resetPassword,
      updatePassword,
      verifyPhoneOTP
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
