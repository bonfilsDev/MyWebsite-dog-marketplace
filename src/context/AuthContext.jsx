import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

function fallbackProfile(user) {
  if (!user) return null
  return {
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'PawMarket user',
    phone: user.user_metadata?.phone || '',
    email: user.email || '',
    role: user.user_metadata?.role === 'seller' ? 'seller' : 'buyer',
    avatar_url: null,
    created_at: user.created_at,
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (user) => {
    if (!user || !isSupabaseConfigured) {
      setProfile(user ? fallbackProfile(user) : null)
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email, role, avatar_url, created_at')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      setProfile(fallbackProfile(user))
      return null
    }

    const nextProfile = data || fallbackProfile(user)
    setProfile(nextProfile)
    return nextProfile
  }, [])

  useEffect(() => {
    let active = true

    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) {
        await fetchProfile(data.session.user)
      }
      if (active) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)

      if (nextSession?.user) {
        setLoading(true)
        setTimeout(async () => {
          if (!active) return
          await fetchProfile(nextSession.user)
          if (active) setLoading(false)
        }, 0)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signUp = useCallback(async ({ email, password, fullName, phone, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role: role === 'seller' ? 'seller' : 'buyer',
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const updateProfile = useCallback(
    async (updates) => {
      if (!session?.user) throw new Error('You must be signed in.')
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id)
        .select('id, full_name, phone, email, role, avatar_url, created_at')
        .single()
      if (error) throw error
      setProfile(data)
      return data
    },
    [session],
  )

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      profile,
      loading,
      role: profile?.role || null,
      isAdmin: profile?.role === 'admin',
      isSeller: profile?.role === 'seller' || profile?.role === 'admin',
      signIn,
      signUp,
      signOut,
      updateProfile,
      refreshProfile: () => fetchProfile(session?.user),
    }),
    [session, profile, loading, signIn, signUp, signOut, updateProfile, fetchProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
