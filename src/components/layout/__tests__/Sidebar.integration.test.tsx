import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Sidebar } from '../Sidebar'
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
      })),
    })),
  },
}))

// Mock AuthContext with different user roles
const createMockAuthContext = (user: any = null, role: any = null, loading = false) => ({
  user,
  session: user ? { user } : null,
  role,
  loading,
  error: null,
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

// Custom render with auth context
const renderWithAuth = (component: React.ReactElement, authContext: any, initialRoute = '/') => {
  mockUseAuth.mockReturnValue(authContext)

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {component}
    </MemoryRouter>
  )
}

describe('Sidebar Integration Tests - Role-based Navigation', () => {
  const mockOnToggle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Admin menu visibility based on user roles', () => {
    it('should show admin section for super_admin users', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext
      )

      // Admin section should be visible
      expect(screen.getByText('Admin')).toBeInTheDocument()
      
      // Admin dropdown button should be present
      const adminButton = screen.getByRole('button', { name: /admin/i })
      expect(adminButton).toBeInTheDocument()
    })

    it('should hide admin section for admin users', async () => {
      const authContext = createMockAuthContext(mockUsers.admin, 'admin')
      
      renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext
      )

      // Admin section should not be visible
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('should hide admin section for coach users', async () => {
      const authContext = createMockAuthContext(mockUsers.coach, 'coach')
      
      renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext
      )

      // Admin section should not be visible
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('should hide admin section for player users', async () => {
      const authContext = createMockAuthContext(mockUsers.player, 'player')
      
      renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext
      )

      // Admin section should not be visible
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('should hide admin section when user has no role', async () => {
      const authContext = createMockAuthContext(mockUsers.player, null)
      
      renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext
      )

      // Admin section should not be visible
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('should hide admin section when no user is logged in', async () => {
      const authContext = createMockAuthContext(null, null)
      
      renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext
      )

      // Admin section should not be visible
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })
  })

  describe('Admin dropdown functionality', () => {
    it('should expand admin dropdown when clicked', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext
      )

      const adminButton = screen.getByRole('button', { name: /admin/i })
      
      // Initially, admin items should not be visible
      expect(screen.queryByText('Sports')).not.toBeInTheDocument()
      expect(screen.queryByText('Clubs')).not.toBeInTheDocument()
      expect(screen.queryByText('Teams')).not.toBeInTheDocument()

      // Click to expand
      fireEvent.click(adminButton)

      // Admin items should now be visible
      await waitFor(() => {
        expect(screen.getByText('Sports')).toBeInTheDocument()
        expect(screen.getByText('Clubs')).toBeInTheDocument()
        expect(screen.getByText('Teams')).toBeInTheDocument()
      })
    })

    it('should collapse admin dropdown when clicked again', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext
      )

      const adminButton = screen.getByRole('button', { name: /admin/i })
      
      // Expand first
      fireEvent.click(adminButton)
      await waitFor(() => {
        expect(screen.getByText('Sports')).toBeInTheDocument()
      })

      // Collapse
      fireEvent.click(adminButton)
      await waitFor(() => {
        expect(screen.queryByText('Sports')).not.toBeInTheDocument()
      })
    })

    it('should not show admin dropdown items when sidebar is collapsed', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      renderWithAuth(
        <Sidebar collapsed={true} onToggle={mockOnToggle} />,
        authContext
      )

      // When collapsed, the admin button should still be visible but text should not be
      const adminButtons = screen.getAllByRole('button')
      const adminButton = adminButtons.find(button => 
        button.querySelector('svg[class*="lucide-shield"]')
      )
      expect(adminButton).toBeInTheDocument()

      if (adminButton) {
        fireEvent.click(adminButton)
      }

      // Admin items should not be visible when sidebar is collapsed
      expect(screen.queryByText('Sports')).not.toBeInTheDocument()
      expect(screen.queryByText('Clubs')).not.toBeInTheDocument()
      expect(screen.queryByText('Teams')).not.toBeInTheDocument()
    })
  })

  describe('Admin navigation links', () => {
    it('should render correct admin navigation links', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext
      )

      // Expand admin dropdown
      const adminButton = screen.getByRole('button', { name: /admin/i })
      fireEvent.click(adminButton)

      await waitFor(() => {
        // Check that admin links have correct href attributes
        const sportsLink = screen.getByRole('link', { name: /sports/i })
        const clubsLink = screen.getByRole('link', { name: /clubs/i })
        const teamsLink = screen.getByRole('link', { name: /teams/i })

        expect(sportsLink).toHaveAttribute('href', '/admin/sports')
        expect(clubsLink).toHaveAttribute('href', '/admin/clubs')
        expect(teamsLink).toHaveAttribute('href', '/admin/teams')
      })
    })

    it('should highlight active admin route', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext,
        '/admin/sports'
      )

      // Expand admin dropdown
      const adminButton = screen.getByRole('button', { name: /admin/i })
      fireEvent.click(adminButton)

      await waitFor(() => {
        const sportsLink = screen.getByRole('link', { name: /sports/i })
        // Should have active styling class
        expect(sportsLink).toHaveClass('bg-accent')
      })
    })
  })

  describe('Session management and role persistence', () => {
    it('should handle role changes dynamically', async () => {
      let authContext = createMockAuthContext(mockUsers.player, 'player')
      
      const { rerender } = renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext
      )

      // Initially no admin section
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()

      // Update to super_admin role
      authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      mockUseAuth.mockReturnValue(authContext)
      
      rerender(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar collapsed={false} onToggle={mockOnToggle} />
        </MemoryRouter>
      )

      // Admin section should now be visible
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('should handle user logout properly', async () => {
      let authContext = createMockAuthContext(mockUsers.superAdmin, 'super_admin')
      
      const { rerender } = renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext
      )

      // Initially admin section visible
      expect(screen.getByText('Admin')).toBeInTheDocument()

      // Simulate logout
      authContext = createMockAuthContext(null, null)
      mockUseAuth.mockReturnValue(authContext)
      
      rerender(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar collapsed={false} onToggle={mockOnToggle} />
        </MemoryRouter>
      )

      // Admin section should be hidden
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('should handle loading state during role determination', async () => {
      const authContext = createMockAuthContext(mockUsers.superAdmin, null, true)
      
      renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext
      )

      // During loading, admin section should not be visible
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })
  })

  describe('Regular navigation items', () => {
    it('should always show regular navigation items regardless of role', async () => {
      const authContext = createMockAuthContext(mockUsers.player, 'player')
      
      renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext
      )

      // Regular navigation items should be visible
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Jugadores')).toBeInTheDocument()
      expect(screen.getByText('Equipos')).toBeInTheDocument()
      expect(screen.getByText('Entrenamiento')).toBeInTheDocument()
      expect(screen.getByText('Asistencia')).toBeInTheDocument()
      expect(screen.getByText('Campeonato')).toBeInTheDocument()
      expect(screen.getByText('Notes')).toBeInTheDocument()
    })

    it('should show profile and logout options for all authenticated users', async () => {
      const authContext = createMockAuthContext(mockUsers.coach, 'coach')
      
      renderWithAuth(
        <Sidebar collapsed={false} onToggle={mockOnToggle} />,
        authContext
      )

      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Logout')).toBeInTheDocument()
    })
  })
})