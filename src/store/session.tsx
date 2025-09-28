import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { AppRole } from '@/types/db'

interface SessionState {
  user: User | null
  role: AppRole | null
  loading: boolean
}

interface SessionContextType extends SessionState {
  refreshProfile: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SessionState>({
    user: null,
    role: null,
    loading: true
  })

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setState({ user: null, role: null, loading: false })
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        setState({ user, role: null, loading: false })
        return
      }

      setState({ 
        user, 
        role: profile.role as AppRole, 
        loading: false 
      })
    } catch (error) {
      console.error('Unexpected error loading profile:', error)
      setState({ user: null, role: null, loading: false })
    }
  }

  const refreshProfile = async () => {
    if (state.user) {
      setState(prev => ({ ...prev, loading: true }))
      await loadUserProfile()
    }
  }

  useEffect(() => {
    loadUserProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        setState({ user: null, role: null, loading: false })
      } else {
        await loadUserProfile()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <SessionContext.Provider value={{ ...state, refreshProfile }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}