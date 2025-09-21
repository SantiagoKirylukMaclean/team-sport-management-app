import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'

// Nota: En Supabase desactivar Email confirmations y agregar http://localhost:5173 en Redirect URLs.

export type AppRole = 'super_admin' | 'admin' | 'coach' | 'player'

type AuthContextType = {
  user: User | null
  session: Session | null
  role: AppRole | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<AppRole | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadProfileRole = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', uid)
      .maybeSingle()
    if (error) {
      console.error('Error leyendo profiles.role', error)
      setRole(null)
      return
    }
    setRole((data?.role as AppRole | null) ?? null)
  }

  // Al montar: obtener sesión y usuario; luego cargar role
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        // Cargar rol en segundo plano
        loadProfileRole(data.session.user.id)
      }
      setLoading(false)
    })()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      const newUser = newSession?.user ?? null
      setUser(newUser)
      if (newUser) {
        // Cargar rol en segundo plano para no bloquear la UI
        loadProfileRole(newUser.id)
      } else {
        setRole(null)
      }
      // Aseguramos que loading se desactive también en cambios de auth
      setLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setLoading(false)
      throw error
    }
    // Actualizar estado inmediatamente para evitar parpadeos/redirecciones erróneas
    if (data.session) setSession(data.session)
    if (data.user) setUser(data.user)
    // Cargar rol en segundo plano y no bloquear navegación/loader
    if (data.user) loadProfileRole(data.user.id)
    navigate('/app')
    setLoading(false)
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      throw error
    }
    // Establecer sesión/usuario inmediatamente para que ProtectedRoute no rebote
    if (data.session) setSession(data.session)
    if (data.user) setUser(data.user)
    // Cargar rol en segundo plano y no bloquear navegación/loader
    if (data.user) loadProfileRole(data.user.id)
    navigate('/app')
    setLoading(false)
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setLoading(false)
      throw error
    }
    // Limpiar estado local y navegar
    setUser(null)
    setSession(null)
    setRole(null)
    navigate('/login')
    setLoading(false)
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfileRole(user.id)
    }
  }

  const value = useMemo(
    () => ({ user, session, role, loading, signUp, signIn, signOut, refreshProfile }),
    [user, session, role, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
