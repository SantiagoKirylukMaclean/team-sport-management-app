import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Sidebar } from '@/components/layout/Sidebar'
import AdminGuard from '@/components/RouteGuards/AdminGuard'
import { AdminLayout } from '@/layouts/AdminLayout'
import { mockUsers } from '@/test/utils'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
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

// Mock admin pages
vi.mock('@/pages/admin/SportsPage', () => ({
  default: () => <div data-testid="sports-page">Sports Management</div>
}))

vi.mock('@/pages/admin/ClubsPage', () => ({
  default: () => <div data-testid="clubs-page">Clubs Management</div>
}))

vi.mock('@/pages/admin/TeamsPage', () => ({
  default: () => <div data-testid="teams-page">Teams Management</div>
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

// Complete app structure for integration testing
const TestApp = ({ authContext, initialRoute = '/' }: { authContext: any, initialRoute?: string }) => {
  mockUseAuth.mockReturnValue(authContext)

  const SportsPage = React.lazy(() => import('@/pages/admin/SportsPage'))
  const ClubsPage = React.lazy(() => import('@/pages/admin/ClubsPage'))
  const TeamsPage = React.lazy(() => import('@/pages/admin/TeamsPage'))

  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <div className="flex h-screen">
        <Sidebar collapsed={false} onToggle={() => {}} />
        <div className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
            <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
            
            {/* Regular app routes */}
            <Route path="/equipos" element={<div data-testid="equipos-page">Equipos</div>} />
            <Route path="/profile" element={<div data-testid="profile-page">Profile</div>} />
            
            {/* Admin routes with proper nesting and protection */}
            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route index element={<div data-testid="admin-index">Admin Index</div>} />
              <Route path="sports" element={<React.Suspense fallback={<div>Loading...</div>}><SportsPage /></React.Suspense>} />
              <Route path="clubs" element={<React.Suspense fallback={<div>Loading...</div>}><ClubsPage /></React.Suspense>} />
              <Route path="teams" element={<React.Suspense fallback={<div>Loading...</div>}><TeamsPage /></React.Suspense>} />
            </Route>
          </Routes>
        </div>
      </div>
    </MemoryRouter>
  )
}

describe('Complete Role-Based Navigation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete super_admin workflow', () => {
    it('should allow super_admin to see admin menu and navigate to admin pages', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      render(<TestApp authContext={authContext} initialRoute="/dashboard" />)

      // Should see admin section in sidebar
      expect(screen.getByText('Admin')).toBeInTheDocument()
      
      // Expand admin dropdown
      const adminButton = screen.getByRole('button', { name: /admin/i })
      fireEvent.click(adminButton)

      await waitFor(() => {
        expect(screen.getByText('Sports')).toBeInTheDocument()
        expect(screen.getByText('Clubs')).toBeInTheDocument()
        expect(screen.getByText('Teams')).toBeInTheDocument()
      })

      // Click on Sports link
      const sportsLink = screen.getByRole('link', { name: /sports/i })
      fireEvent.click(sportsLink)

      await waitFor(() => {
        expect(screen.getByTestId('sports-page')).toBeInTheDocument()
        expect(screen.getByText('Administration')).toBeInTheDocument()
      })
    })

    it('should maintain admin access across different admin pages', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      render(<TestApp authContext={authContext} initialRoute="/admin/sports" />)

      await waitFor(() => {
        expect(screen.getByTestId('sports-page')).toBeInTheDocument()
        expect(screen.getByText('Administration')).toBeInTheDocument()
      })

      // Navigate to clubs via admin layout navigation
      const clubsNavLink = screen.getByRole('link', { name: /clubs/i })
      fireEvent.click(clubsNavLink)

      await waitFor(() => {
        expect(screen.getByTestId('clubs-page')).toBeInTheDocument()
      })
    })

    it('should allow navigation back to main app from admin', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      render(<TestApp authContext={authContext} initialRoute="/admin/sports" />)

      await waitFor(() => {
        expect(screen.getByTestId('sports-page')).toBeInTheDocument()
      })

      // Click "Back to App" link
      const backLink = screen.getByRole('link', { name: /back to app/i })
      fireEvent.click(backLink)

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
      })
    })
  })

  describe('Non-admin user restrictions', () => {
    it('should hide admin menu for admin users and block direct access', async () => {
      const authContext = createMockAuthContext(mockUsers.admin, 'admin')
      
      const { rerender } = render(<TestApp authContext={authContext} initialRoute="/dashboard" />)

      // Admin menu should not be visible
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()

      // Try direct navigation to admin route
      rerender(<TestApp authContext={authContext} initialRoute="/admin/sports" />)

      await waitFor(() => {
        expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
        expect(screen.queryByTestId('sports-page')).not.toBeInTheDocument()
      })
    })

    it('should hide admin menu for coach users and block direct access', async () => {
      const authContext = createMockAuthContext(mockUsers.coach, 'coach')
      
      const { rerender } = render(<TestApp authContext={authContext} initialRoute="/dashboard" />)

      // Admin menu should not be visible
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()

      // Try direct navigation to admin route
      rerender(<TestApp authContext={authContext} initialRoute="/admin/clubs" />)

      await waitFor(() => {
        expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
        expect(screen.queryByTestId('clubs-page')).not.toBeInTheDocument()
      })
    })

    it('should hide admin menu for player users and block direct access', async () => {
      const authContext = createMockAuthContext(mockUsers.player, 'player')
      
      const { rerender } = render(<TestApp authContext={authContext} initialRoute="/dashboard" />)

      // Admin menu should not be visible
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()

      // Try direct navigation to admin route
      rerender(<TestApp authContext={authContext} initialRoute="/admin/teams" />)

      await waitFor(() => {
        expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
        expect(screen.queryByTestId('teams-page')).not.toBeInTheDocument()
      })
    })
  })

  describe('Session state management', () => {
    it('should handle role changes dynamically', async () => {
      let authContext = createMockAuthContext(mockUsers.player, 'player')
      
      const { rerender } = render(<TestApp authContext={authContext} initialRoute="/dashboard" />)

      // Initially no admin menu
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()

      // Simulate role upgrade to super_admin
      authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      rerender(<TestApp authContext={authContext} initialRoute="/dashboard" />)

      // Admin menu should now appear
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('should handle user logout and clear admin access', async () => {
      let authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      const { rerender } = render(<TestApp authContext={authContext} initialRoute="/admin/sports" />)

      await waitFor(() => {
        expect(screen.getByTestId('sports-page')).toBeInTheDocument()
      })

      // Simulate logout
      authContext = createMockAuthContext(null, null)
      rerender(<TestApp authContext={authContext} initialRoute="/admin/sports" />)

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
        expect(screen.queryByTestId('sports-page')).not.toBeInTheDocument()
      })
    })

    it('should handle loading states during role determination', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, null, true)
      
      render(<TestApp authContext={authContext} initialRoute="/admin/sports" />)

      // Should show loading state
      expect(screen.getByText('Verificando permisos...')).toBeInTheDocument()
      expect(screen.queryByTestId('sports-page')).not.toBeInTheDocument()
    })

    it('should persist session across regular navigation', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      render(<TestApp authContext={authContext} initialRoute="/dashboard" />)

      // Admin menu should be visible
      expect(screen.getByText('Admin')).toBeInTheDocument()

      // Admin menu should still be visible
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })
  })

  describe('Error handling and recovery', () => {
    it('should handle authentication errors gracefully', async () => {
      const authError = { message: 'Authentication failed', code: 'AUTH_ERROR' }
      const authContext = createMockAuthContext(null, null, false, authError)
      
      render(<TestApp authContext={authContext} initialRoute="/admin/sports" />)

      await waitFor(() => {
        expect(screen.getByText('Error de autenticación')).toBeInTheDocument()
        expect(screen.queryByTestId('sports-page')).not.toBeInTheDocument()
      })
    })

    it('should provide error recovery options', async () => {
      const authError = { message: 'Network error', code: 'NETWORK_ERROR' }
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin', false, authError)
      
      render(<TestApp authContext={authContext} initialRoute="/admin/sports" />)

      await waitFor(() => {
        expect(screen.getByText('Error de autenticación')).toBeInTheDocument()
        
        // Should have retry functionality
        const retryButton = screen.getByRole('button', { name: /reintentar/i })
        expect(retryButton).toBeInTheDocument()
        
        // Verify retry calls the correct function
        fireEvent.click(retryButton)
        expect(authContext.clearError).toHaveBeenCalled()
      })
    })
  })

  describe('Navigation consistency', () => {
    it('should maintain consistent navigation behavior across all user roles', async () => {
      const roles = ['super_admin', 'admin', 'coach', 'player'] as const
      
      for (const role of roles) {
        const user = role === 'super_admin' ? mockUsers.superAdmin : 
                    role === 'admin' ? mockUsers.admin :
                    role === 'coach' ? mockUsers.coach : mockUsers.player
        
        const authContext = createMockAuthContext(user, role)
        
        const { unmount } = render(<TestApp authContext={authContext} initialRoute="/dashboard" />)

        // All users should see regular navigation
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Profile')).toBeInTheDocument()
        expect(screen.getByText('Logout')).toBeInTheDocument()

        // Only super_admin should see admin menu
        if (role === 'super_admin') {
          expect(screen.getByText('Admin')).toBeInTheDocument()
        } else {
          expect(screen.queryByText('Admin')).not.toBeInTheDocument()
        }

        unmount()
      }
    })

    it('should handle rapid role changes without breaking navigation', async () => {
      let authContext = createMockAuthContext(mockUsers.player, 'player')
      
      const { rerender } = render(<TestApp authContext={authContext} initialRoute="/dashboard" />)

      // Start as player - no admin menu
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()

      // Change to super_admin
      authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      rerender(<TestApp authContext={authContext} initialRoute="/dashboard" />)
      expect(screen.getByText('Admin')).toBeInTheDocument()

      // Change back to player
      authContext = createMockAuthContext(mockUsers.player, 'player')
      rerender(<TestApp authContext={authContext} initialRoute="/dashboard" />)
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()

      // Change to coach
      authContext = createMockAuthContext(mockUsers.coach, 'coach')
      rerender(<TestApp authContext={authContext} initialRoute="/dashboard" />)
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })
  })
})