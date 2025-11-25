import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { Sidebar } from '@/components/layout/Sidebar'
import AdminGuard from '@/components/RouteGuards/AdminGuard'
import SportsPage from '@/pages/admin/SportsPage'
import ClubsPage from '@/pages/admin/ClubsPage'
import { mockUsers } from '@/test/utils'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
        })),
      })),
    })),
  },
}))

// Mock AuthContext
const createMockAuthContext = (user: any = null, role: any = null, loading = false, error: any = null) => ({
  user,
  session: user ? { user } : null,
  role,
  loading,
  error,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
  clearError: vi.fn(),
})

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: vi.fn(),
}))

import { useAuth } from '@/contexts/AuthContext'
const mockUseAuth = useAuth as any

describe('Admin Workflow End-to-End Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Admin Workflow - Super Admin User', () => {
    it('should show admin menu for super admin and allow navigation', async () => {
      mockUseAuth.mockReturnValue(createMockAuthContext(mockUsers.superAdmin, 'super_admin'))

      render(
        <MemoryRouter>
          <Sidebar collapsed={false} onToggle={() => { }} />
        </MemoryRouter>
      )

      // Verify admin section is visible
      expect(screen.getByText('Admin')).toBeInTheDocument()

      // Expand admin menu
      const adminButton = screen.getByText('Admin')
      fireEvent.click(adminButton)

      // Verify admin menu items are visible
      await waitFor(() => {
        expect(screen.getByText('Sports')).toBeInTheDocument()
        expect(screen.getByText('Clubs')).toBeInTheDocument()
        expect(screen.getByText('Teams')).toBeInTheDocument()
      })
    })

    it('should display sports data correctly for super admin', async () => {
      mockUseAuth.mockReturnValue(createMockAuthContext(mockUsers.superAdmin, 'super_admin'))

      // Mock sports data
      const mockSportsData = [
        { id: '1', name: 'Football', created_at: '2024-01-01T00:00:00Z' },
        { id: '2', name: 'Basketball', created_at: '2024-01-02T00:00:00Z' }
      ]

      const { supabase } = await import('@/lib/supabase')
      const mockSupabase = supabase as any

      mockSupabase.from.mockReturnValue({
        select: () => ({
          order: () => ({
            limit: () => Promise.resolve({
              data: mockSportsData,
              error: null,
              count: 2
            })
          })
        })
      })

      render(
        <MemoryRouter>
          <SportsPage />
        </MemoryRouter>
      )

      // Wait for data to load and verify display
      await waitFor(() => {
        expect(screen.getByText('Deportes')).toBeInTheDocument()
        expect(screen.getByText('Football')).toBeInTheDocument()
        expect(screen.getByText('Basketball')).toBeInTheDocument()
        expect(screen.getByText('(2 deportes)')).toBeInTheDocument()
      })

      // Verify data formatting
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
      expect(screen.getByText('ID: 2')).toBeInTheDocument()
    })

    it('should handle data fetching errors gracefully', async () => {
      mockUseAuth.mockReturnValue(createMockAuthContext(mockUsers.superAdmin, 'super_admin'))

      const { supabase } = await import('@/lib/supabase')
      const mockSupabase = supabase as any

      // Mock error in data fetching
      const mockError = new Error('Database connection failed')
      mockSupabase.from.mockReturnValue({
        select: () => ({
          order: () => ({
            limit: () => Promise.reject(mockError)
          })
        })
      })

      render(
        <MemoryRouter>
          <SportsPage />
        </MemoryRouter>
      )

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Error al cargar deportes')).toBeInTheDocument()
      })

      // Verify error details are shown
      expect(screen.getByText(/Database connection failed/)).toBeInTheDocument()

      // Verify retry button is available
      const retryButton = screen.getByRole('button', { name: /reintentar/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('should handle empty data states properly', async () => {
      mockUseAuth.mockReturnValue(createMockAuthContext(mockUsers.superAdmin, 'super_admin'))

      const { supabase } = await import('@/lib/supabase')
      const mockSupabase = supabase as any

      // Mock empty data response
      mockSupabase.from.mockReturnValue({
        select: () => ({
          order: () => ({
            limit: () => Promise.resolve({
              data: [],
              error: null,
              count: 0
            })
          })
        })
      })

      render(
        <MemoryRouter>
          <SportsPage />
        </MemoryRouter>
      )

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText('No hay deportes registrados')).toBeInTheDocument()
        expect(screen.getByText('Aún no se han registrado deportes en el sistema.')).toBeInTheDocument()
      })

      // Verify refresh action is available
      expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument()
    })
  })

  describe('Unauthorized Access Prevention', () => {
    it('should redirect non-super admin users from admin routes', async () => {
      mockUseAuth.mockReturnValue(createMockAuthContext(mockUsers.admin, 'admin'))

      render(
        <MemoryRouter initialEntries={['/admin/sports']}>
          <AdminGuard>
            <SportsPage />
          </AdminGuard>
        </MemoryRouter>
      )

      // Verify permission error is shown
      await waitFor(() => {
        expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
        expect(screen.getByText(/Necesitas permisos de super administrador/)).toBeInTheDocument()
      })
    })

    it('should show loading state while role is being determined', async () => {
      mockUseAuth.mockReturnValue(createMockAuthContext(mockUsers.superAdmin, null, true))

      render(
        <MemoryRouter initialEntries={['/admin/sports']}>
          <AdminGuard>
            <SportsPage />
          </AdminGuard>
        </MemoryRouter>
      )

      expect(screen.getByText('Verificando permisos...')).toBeInTheDocument()
      expect(screen.queryByText('Deportes')).not.toBeInTheDocument()
    })

    it('should handle authentication errors gracefully', async () => {
      const mockError = { message: 'Authentication failed', code: 'AUTH_ERROR' }
      mockUseAuth.mockReturnValue(createMockAuthContext(mockUsers.superAdmin, null, false, mockError))

      render(
        <MemoryRouter initialEntries={['/admin/sports']}>
          <AdminGuard>
            <SportsPage />
          </AdminGuard>
        </MemoryRouter>
      )

      // Verify error display
      await waitFor(() => {
        expect(screen.getByText('Error de autenticación')).toBeInTheDocument()
        expect(screen.getByText(/Authentication failed/)).toBeInTheDocument()
      })

      // Verify retry functionality
      const retryButton = screen.getByRole('button', { name: /reintentar/i })
      expect(retryButton).toBeInTheDocument()
    })
  })

  describe('Admin Menu Visibility Based on User Roles', () => {
    it('should show admin menu for super admin users', () => {
      mockUseAuth.mockReturnValue(createMockAuthContext(mockUsers.superAdmin, 'super_admin'))

      render(
        <MemoryRouter>
          <Sidebar collapsed={false} onToggle={() => { }} />
        </MemoryRouter>
      )

      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('should hide admin menu for non-super admin users', () => {
      mockUseAuth.mockReturnValue(createMockAuthContext(mockUsers.admin, 'admin'))

      render(
        <MemoryRouter>
          <Sidebar collapsed={false} onToggle={() => { }} />
        </MemoryRouter>
      )

      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('should hide admin menu for coach users', () => {
      mockUseAuth.mockReturnValue(createMockAuthContext(mockUsers.coach, 'coach'))

      render(
        <MemoryRouter>
          <Sidebar collapsed={false} onToggle={() => { }} />
        </MemoryRouter>
      )

      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('should hide admin menu for player users', () => {
      mockUseAuth.mockReturnValue(createMockAuthContext(mockUsers.player, 'player'))

      render(
        <MemoryRouter>
          <Sidebar collapsed={false} onToggle={() => { }} />
        </MemoryRouter>
      )

      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('should hide admin menu when user has no role', () => {
      mockUseAuth.mockReturnValue(createMockAuthContext(mockUsers.superAdmin, null))

      render(
        <MemoryRouter>
          <Sidebar collapsed={false} onToggle={() => { }} />
        </MemoryRouter>
      )

      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })
  })

  describe('Complex Admin Data Scenarios', () => {
    it('should handle admin pages with relationship data', async () => {
      mockUseAuth.mockReturnValue(createMockAuthContext(mockUsers.superAdmin, 'super_admin'))

      // Mock clubs with sport relationships
      const mockClubsWithSports = [
        {
          id: '1',
          name: 'FC Barcelona',
          sport_id: '1',
          created_at: '2024-01-01T00:00:00Z',
          sports: { name: 'Football' }
        },
        {
          id: '2',
          name: 'Lakers',
          sport_id: '2',
          created_at: '2024-01-02T00:00:00Z',
          sports: { name: 'Basketball' }
        }
      ]

      const { supabase } = await import('@/lib/supabase')
      const mockSupabase = supabase as any

      mockSupabase.from.mockReturnValue({
        select: () => ({
          order: () => ({
            limit: () => Promise.resolve({
              data: mockClubsWithSports,
              error: null,
              count: 2
            })
          })
        })
      })

      render(
        <MemoryRouter>
          <ClubsPage />
        </MemoryRouter>
      )

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('FC Barcelona')).toBeInTheDocument()
        expect(screen.getByText('Lakers')).toBeInTheDocument()
        expect(screen.getByText('Football')).toBeInTheDocument()
        expect(screen.getByText('Basketball')).toBeInTheDocument()
      })
    })

    it('should verify complete admin workflow integration', async () => {
      // This test verifies the complete workflow from authentication to data display

      // Step 1: Set super admin user
      mockUseAuth.mockReturnValue(createMockAuthContext(mockUsers.superAdmin, 'super_admin'))

      // Step 2: Mock successful data fetching
      const mockSportsData = [
        { id: '1', name: 'Football', created_at: '2024-01-01T00:00:00Z' }
      ]

      const { supabase } = await import('@/lib/supabase')
      const mockSupabase = supabase as any

      mockSupabase.from.mockReturnValue({
        select: () => ({
          order: () => ({
            limit: () => Promise.resolve({
              data: mockSportsData,
              error: null,
              count: 1
            })
          })
        })
      })

      // Step 3: Render admin guard with sports page
      render(
        <MemoryRouter initialEntries={['/admin/sports']}>
          <AdminGuard>
            <SportsPage />
          </AdminGuard>
        </MemoryRouter>
      )

      // Step 4: Verify successful access and data display
      await waitFor(() => {
        expect(screen.getByText('Deportes')).toBeInTheDocument()
        expect(screen.getByText('Football')).toBeInTheDocument()
        expect(screen.getByText('(1 deportes)')).toBeInTheDocument()
      })

      // Step 5: Verify no access denied message
      expect(screen.queryByText('Acceso denegado')).not.toBeInTheDocument()
      expect(screen.queryByText('Verificando permisos...')).not.toBeInTheDocument()
    })
  })
})