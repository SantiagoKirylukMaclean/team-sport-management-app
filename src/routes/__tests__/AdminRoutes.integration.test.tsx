import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter, Routes, Route, MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import AdminGuard from '@/components/RouteGuards/AdminGuard'
import { AdminLayout } from '@/layouts/AdminLayout'
import SportsPage from '@/pages/admin/SportsPage'
import ClubsPage from '@/pages/admin/ClubsPage'
import TeamsPage from '@/pages/admin/TeamsPage'
import { mockUsers } from '@/test/utils'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}))

// Mock the admin pages to avoid complex data fetching in integration tests
vi.mock('@/pages/admin/SportsPage', () => ({
  default: () => <div data-testid="sports-page">Sports Page</div>
}))

vi.mock('@/pages/admin/ClubsPage', () => ({
  default: () => <div data-testid="clubs-page">Clubs Page</div>
}))

vi.mock('@/pages/admin/TeamsPage', () => ({
  default: () => <div data-testid="teams-page">Teams Page</div>
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

// Mock useAuth hook
const mockUseAuth = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// Custom render with auth context and routing
const renderWithAuthAndRouting = (
  initialEntries: string[],
  authContext: any
) => {
  mockUseAuth.mockReturnValue(authContext)

  const TestApp = () => (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard Page</div>} />
        
        {/* Admin routes with proper nesting and protection */}
        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index element={<div data-testid="admin-redirect">Redirecting to Sports...</div>} />
          <Route path="sports" element={<SportsPage />} />
          <Route path="clubs" element={<ClubsPage />} />
          <Route path="teams" element={<TeamsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

  return render(<TestApp />)
}

describe('Admin Routes Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Admin route protection', () => {
    it('should allow super_admin users to access admin routes', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      renderWithAuthAndRouting(['/admin/sports'], authContext)

      await waitFor(() => {
        expect(screen.getByTestId('sports-page')).toBeInTheDocument()
      })
    })

    it('should redirect admin users away from admin routes', async () => {
      const authContext = createMockAuthContext(mockUsers.admin, 'admin')
      
      renderWithAuthAndRouting(['/admin/sports'], authContext)

      await waitFor(() => {
        // Should show permission error instead of the sports page
        expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
        expect(screen.queryByTestId('sports-page')).not.toBeInTheDocument()
      })
    })

    it('should redirect coach users away from admin routes', async () => {
      const authContext = createMockAuthContext(mockUsers.coach, 'coach')
      
      renderWithAuthAndRouting(['/admin/clubs'], authContext)

      await waitFor(() => {
        expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
        expect(screen.queryByTestId('clubs-page')).not.toBeInTheDocument()
      })
    })

    it('should redirect player users away from admin routes', async () => {
      const authContext = createMockAuthContext(mockUsers.player, 'player')
      
      renderWithAuthAndRouting(['/admin/teams'], authContext)

      await waitFor(() => {
        expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
        expect(screen.queryByTestId('teams-page')).not.toBeInTheDocument()
      })
    })

    it('should redirect unauthenticated users to login', async () => {
      const authContext = createMockAuthContext(null, null)
      
      renderWithAuthAndRouting(['/admin/sports'], authContext)

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
        expect(screen.queryByTestId('sports-page')).not.toBeInTheDocument()
      })
    })

    it('should show loading state while determining user role', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, null, true)
      
      renderWithAuthAndRouting(['/admin/sports'], authContext)

      expect(screen.getByText('Verificando permisos...')).toBeInTheDocument()
      expect(screen.queryByTestId('sports-page')).not.toBeInTheDocument()
    })

    it('should handle authentication errors gracefully', async () => {
      const authError = { message: 'Authentication failed', code: 'AUTH_ERROR' }
      const authContext = createMockAuthContext(null, null, false, authError)
      
      renderWithAuthAndRouting(['/admin/sports'], authContext)

      await waitFor(() => {
        expect(screen.getByText('Error de autenticación')).toBeInTheDocument()
        expect(screen.queryByTestId('sports-page')).not.toBeInTheDocument()
      })
    })
  })

  describe('Admin route navigation', () => {
    it('should navigate to different admin pages for super_admin users', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      // Test navigation to sports page
      const { rerender } = renderWithAuthAndRouting(['/admin/sports'], authContext)
      await waitFor(() => {
        expect(screen.getByTestId('sports-page')).toBeInTheDocument()
      })

      // Test navigation to clubs page
      rerender(
        <MemoryRouter initialEntries={['/admin/clubs']}>
          <Routes>
            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route path="clubs" element={<ClubsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('clubs-page')).toBeInTheDocument()
      })

      // Test navigation to teams page
      rerender(
        <MemoryRouter initialEntries={['/admin/teams']}>
          <Routes>
            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route path="teams" element={<TeamsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('teams-page')).toBeInTheDocument()
      })
    })

    it('should handle admin index route redirect', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      renderWithAuthAndRouting(['/admin'], authContext)

      // Should show the admin layout with redirect message
      await waitFor(() => {
        expect(screen.getByText('Administration')).toBeInTheDocument()
      })
    })

    it('should maintain admin layout structure across different admin pages', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      renderWithAuthAndRouting(['/admin/sports'], authContext)

      await waitFor(() => {
        // Admin layout elements should be present
        expect(screen.getByText('Administration')).toBeInTheDocument()
        expect(screen.getByText('Super Admin Panel')).toBeInTheDocument()
        expect(screen.getByText('Back to App')).toBeInTheDocument()
        
        // Sports page content should be present
        expect(screen.getByTestId('sports-page')).toBeInTheDocument()
      })
    })
  })

  describe('Session management across navigation', () => {
    it('should persist role information during navigation', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      // Start at sports page
      const { rerender } = renderWithAuthAndRouting(['/admin/sports'], authContext)
      
      await waitFor(() => {
        expect(screen.getByTestId('sports-page')).toBeInTheDocument()
      })

      // Navigate to clubs page - role should persist
      rerender(
        <MemoryRouter initialEntries={['/admin/clubs']}>
          <Routes>
            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route path="clubs" element={<ClubsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('clubs-page')).toBeInTheDocument()
      })
    })

    it('should handle role changes during navigation', async () => {
      let authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      const { rerender } = renderWithAuthAndRouting(['/admin/sports'], authContext)
      
      await waitFor(() => {
        expect(screen.getByTestId('sports-page')).toBeInTheDocument()
      })

      // Simulate role change to non-admin
      authContext = createMockAuthContext(mockUsers.player, 'player')
      
      rerender(
        <MemoryRouter initialEntries={['/admin/sports']}>
          <Routes>
            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route path="sports" element={<SportsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
        expect(screen.queryByTestId('sports-page')).not.toBeInTheDocument()
      })
    })

    it('should handle session expiration during admin navigation', async () => {
      let authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      const { rerender } = renderWithAuthAndRouting(['/admin/sports'], authContext)
      
      await waitFor(() => {
        expect(screen.getByTestId('sports-page')).toBeInTheDocument()
      })

      // Simulate session expiration
      authContext = createMockAuthContext(null, null)
      
      rerender(
        <MemoryRouter initialEntries={['/admin/sports']}>
          <Routes>
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route path="sports" element={<SportsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
        expect(screen.queryByTestId('sports-page')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error handling during navigation', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = { message: 'Network error', code: 'NETWORK_ERROR' }
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin', false, networkError)
      
      renderWithAuthAndRouting(['/admin/sports'], authContext)

      await waitFor(() => {
        expect(screen.getByText('Error de autenticación')).toBeInTheDocument()
        expect(screen.queryByTestId('sports-page')).not.toBeInTheDocument()
      })
    })

    it('should provide retry functionality for authentication errors', async () => {
      const authError = { message: 'Auth error', code: 'AUTH_ERROR' }
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin', false, authError)
      
      renderWithAuthAndRouting(['/admin/sports'], authContext)

      await waitFor(() => {
        expect(screen.getByText('Error de autenticación')).toBeInTheDocument()
        
        // Should have retry button
        const retryButton = screen.getByRole('button', { name: /reintentar/i })
        expect(retryButton).toBeInTheDocument()
      })
    })
  })
})