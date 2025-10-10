import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import type { AppRole } from '../types'
import { mapSupabaseError, logError, createAuthError, type AppError } from '../lib/error-handling'

// Nota: En Supabase desactivar Email confirmations y agregar http://localhost:5173 en Redirect URLs.

type AuthContextType = {
  user: User | null
  session: Session | null
  role: AppRole | null
  loading: boolean
  error: AppError | null
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<AppRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)
  const navigate = useNavigate()

  const loadProfileRole = async (uid: string) => {
    try {
      setError(null) // Clear any previous errors
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .maybeSingle()
      
      if (error) {
        const appError = mapSupabaseError(error)
        logError(appError, 'loadProfileRole')
        setError(appError)
        setRole(null)
        return
      }
      
      setRole((data?.role as AppRole | null) ?? null)
    } catch (err: any) {
      const appError = createAuthError('Error inesperado al cargar el perfil de usuario')
      logError(appError, 'loadProfileRole')
      setError(appError)
      setRole(null)
    }
  }

  // Al montar: obtener sesión y usuario; luego cargar role
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          const appError = mapSupabaseError(error)
          logError(appError, 'getSession')
          if (mounted) {
            setError(appError)
          }
        }
        if (!mounted) return
        setSession(data.session ?? null)
        setUser(data.session?.user ?? null)
        if (data.session?.user) {
          // Cargar rol en segundo plano
          loadProfileRole(data.session.user.id)
        }
        setLoading(false)
      } catch (err: any) {
        const appError = createAuthError('Error inesperado al inicializar la autenticación')
        logError(appError, 'initializeAuth')
        if (mounted) {
          setError(appError)
          setLoading(false)
        }
      }
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
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        const appError = mapSupabaseError(error)
        logError(appError, 'signUp')
        setError(appError)
        setLoading(false)
        throw appError
      }
      
      // Actualizar estado inmediatamente para evitar parpadeos/redirecciones erróneas
      if (data.session) setSession(data.session)
      if (data.user) setUser(data.user)
      // Cargar rol en segundo plano y no bloquear navegación/loader
      if (data.user) loadProfileRole(data.user.id)
      navigate('/dashboard')
      setLoading(false)
    } catch (err: any) {
      if (err.message) {
        // Re-throw AppError
        throw err
      }
      const appError = createAuthError('Error inesperado durante el registro')
      logError(appError, 'signUp')
      setError(appError)
      setLoading(false)
      throw appError
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        const appError = mapSupabaseError(error)
        logError(appError, 'signIn')
        setError(appError)
        setLoading(false)
        throw appError
      }
      
      // Establecer sesión/usuario inmediatamente para que ProtectedRoute no rebote
      if (data.session) setSession(data.session)
      if (data.user) setUser(data.user)
      // Cargar rol en segundo plano y no bloquear navegación/loader
      if (data.user) loadProfileRole(data.user.id)
      navigate('/dashboard')
      setLoading(false)
    } catch (err: any) {
      if (err.message) {
        // Re-throw AppError
        throw err
      }
      const appError = createAuthError('Error inesperado durante el inicio de sesión')
      logError(appError, 'signIn')
      setError(appError)
      setLoading(false)
      throw appError
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        const appError = mapSupabaseError(error)
        logError(appError, 'signOut')
        setError(appError)
        setLoading(false)
        throw appError
      }
      
      // Limpiar estado local y navegar
      setUser(null)
      setSession(null)
      setRole(null)
      setError(null)
      navigate('/login')
      setLoading(false)
    } catch (err: any) {
      if (err.message) {
        // Re-throw AppError
        throw err
      }
      const appError = createAuthError('Error inesperado durante el cierre de sesión')
      logError(appError, 'signOut')
      setError(appError)
      setLoading(false)
      throw appError
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfileRole(user.id)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value = useMemo(
    () => ({ user, session, role, loading, error, signUp, signIn, signOut, refreshProfile, clearError }),
    [user, session, role, loading, error]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
