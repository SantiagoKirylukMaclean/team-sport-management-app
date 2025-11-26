import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'

// Mock Supabase client for testing
const mockSupabaseClient = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    })
  })
}

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock user with different roles for testing
export const mockUsers = {
  superAdmin: {
    id: '1',
    email: 'admin@test.com',
    role: 'super_admin' as const,
    display_name: 'Super Admin'
  },
  admin: {
    id: '2',
    email: 'admin@test.com',
    role: 'admin' as const,
    display_name: 'Admin'
  },
  coach: {
    id: '3',
    email: 'coach@test.com',
    role: 'coach' as const,
    display_name: 'Coach'
  },
  player: {
    id: '4',
    email: 'player@test.com',
    role: 'player' as const,
    display_name: 'Player'
  }
}

export { mockSupabaseClient }