import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import AdminGuard from '../AdminGuard'
import { AuthProvider, useAuth } from '../../../contexts/AuthContext'
import { createPermissionError } from '../../../lib/error-handling'
import type { AppRole, User } from '../../../types'
import type { AppError } from '../../../lib/error-handling'

// Mock the AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: vi.fn()
}))

// Mock the error handling utility
vi.mock('../../../lib/error-handling', () => ({
  createPermissionError: vi.fn((message: string) => ({
    message,
    code: 'PERMISSION_ERROR',
    isRetryable: false
  }))
}))

// Mock UI components
vi.mock('../../ui/loading-spinner', () => ({
  default: ({ message }: { message?: string }) => (
    <div data-testid="loading-spinner">{message}</div>
  )
}))

vi.mock('../../ui/error-display', () => ({
  default: ({ 
    error, 
    title, 
    onRetry, 
    showDetails 
  }: { 
    error: AppError
    title: string
    onRetry?: () => void
    showDetails?: boolean 
  }) => (
    <div data-testid="error-display">
      <h2>{title}</h2>
      <p>{error.message}</p>
      {onRetry && (
        <button onClick={onRetry} data-testid="retry-button">
          Retry
        </button>
      )}
      {showDetails && <div data-testid="error-details">Details shown</div>}
    </div>
  )
}))

// Mock window.location.href
const mockLocationHref = vi.fn()
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: mockLocationHref
  },
  writable: true
})

// Helper component to test AdminGuard
const TestComponent = () => <div data-testid="protected-content">Protected Content</div>

// Helper to render AdminGuard with router
const renderAdminGuard = (initialEntries = ['/admin']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AdminGuard>
        <TestComponent />
      </AdminGuard>
    </MemoryRouter>
  )
}

describe('AdminGuard', () => {
  const mockUseAuth = useAuth as ReturnType<typeof vi.fn>
  const mockCreatePermissionError = createPermissionError as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocationHref.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Loading States', () => {
    it('should show loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        loading: true,
        error: null,
        clearError: vi.fn(),
        refreshProfile: vi.fn()
      })

      renderAdminGuard()

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Verificando permisos...')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should show loading spinner when user exists but role is null and no error', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {}
      }

      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: null,
        loading: false,
        error: null,
        clearError: vi.fn(),
        refreshProfile: vi.fn()
      })

      renderAdminGuard()

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Verificando permisos...')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should not show loading when user exists with role determined', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {}
      }

      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: 'super_admin' as AppRole,
        loading: false,
        error: null,
        clearError: vi.fn(),
        refreshProfile: vi.fn()
      })

      renderAdminGuard()

      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should show error display when there is an authentication error', () => {
      const mockError: AppError = {
        message: 'Authentication failed',
        code: 'AUTH_ERROR',
        isRetryable: true
      }

      const mockClearError = vi.fn()
      const mockRefreshProfile = vi.fn()

      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        loading: false,
        error: mockError,
        clearError: mockClearError,
        refreshProfile: mockRefreshProfile
      })

      renderAdminGuard()

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Error de autenticación')).toBeInTheDocument()
      expect(screen.getByText('Authentication failed')).toBeInTheDocument()
      expect(screen.getByTestId('error-details')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should call clearError and refreshProfile when retry is clicked with user', () => {
      const mockError: AppError = {
        message: 'Profile loading failed',
        code: 'PROFILE_ERROR',
        isRetryable: true
      }

      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {}
      }

      const mockClearError = vi.fn()
      const mockRefreshProfile = vi.fn()

      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: null,
        loading: false,
        error: mockError,
        clearError: mockClearError,
        refreshProfile: mockRefreshProfile
      })

      renderAdminGuard()

      const retryButton = screen.getByTestId('retry-button')
      retryButton.click()

      expect(mockClearError).toHaveBeenCalledTimes(1)
      expect(mockRefreshProfile).toHaveBeenCalledTimes(1)
    })

    it('should only call clearError when retry is clicked without user', () => {
      const mockError: AppError = {
        message: 'Authentication failed',
        code: 'AUTH_ERROR',
        isRetryable: true
      }

      const mockClearError = vi.fn()
      const mockRefreshProfile = vi.fn()

      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        loading: false,
        error: mockError,
        clearError: mockClearError,
        refreshProfile: mockRefreshProfile
      })

      renderAdminGuard()

      const retryButton = screen.getByTestId('retry-button')
      retryButton.click()

      expect(mockClearError).toHaveBeenCalledTimes(1)
      expect(mockRefreshProfile).not.toHaveBeenCalled()
    })
  })

  describe('Role-based Access Control', () => {
    it('should redirect to login when no user is present', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        loading: false,
        error: null,
        clearError: vi.fn(),
        refreshProfile: vi.fn()
      })

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AdminGuard>
            <TestComponent />
          </AdminGuard>
        </MemoryRouter>
      )

      // Should redirect to login, so protected content should not be visible
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should allow access for super_admin role', () => {
      const mockUser: User = {
        id: '1',
        email: 'admin@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {}
      }

      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: 'super_admin' as AppRole,
        loading: false,
        error: null,
        clearError: vi.fn(),
        refreshProfile: vi.fn()
      })

      renderAdminGuard()

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument()
    })

    it('should deny access for admin role', () => {
      const mockUser: User = {
        id: '2',
        email: 'admin@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {}
      }

      const mockPermissionError: AppError = {
        message: 'Necesitas permisos de super administrador para acceder a esta sección.',
        code: 'PERMISSION_ERROR',
        isRetryable: false
      }

      mockCreatePermissionError.mockReturnValue(mockPermissionError)

      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: 'admin' as AppRole,
        loading: false,
        error: null,
        clearError: vi.fn(),
        refreshProfile: vi.fn()
      })

      renderAdminGuard()

      expect(mockCreatePermissionError).toHaveBeenCalledWith(
        'Necesitas permisos de super administrador para acceder a esta sección.'
      )
      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
      expect(screen.getByText('Necesitas permisos de super administrador para acceder a esta sección.')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should deny access for coach role', () => {
      const mockUser: User = {
        id: '3',
        email: 'coach@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {}
      }

      const mockPermissionError: AppError = {
        message: 'Necesitas permisos de super administrador para acceder a esta sección.',
        code: 'PERMISSION_ERROR',
        isRetryable: false
      }

      mockCreatePermissionError.mockReturnValue(mockPermissionError)

      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: 'coach' as AppRole,
        loading: false,
        error: null,
        clearError: vi.fn(),
        refreshProfile: vi.fn()
      })

      renderAdminGuard()

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should deny access for player role', () => {
      const mockUser: User = {
        id: '4',
        email: 'player@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {}
      }

      const mockPermissionError: AppError = {
        message: 'Necesitas permisos de super administrador para acceder a esta sección.',
        code: 'PERMISSION_ERROR',
        isRetryable: false
      }

      mockCreatePermissionError.mockReturnValue(mockPermissionError)

      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: 'player' as AppRole,
        loading: false,
        error: null,
        clearError: vi.fn(),
        refreshProfile: vi.fn()
      })

      renderAdminGuard()

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should show loading when user exists but role is null (role still being determined)', () => {
      const mockUser: User = {
        id: '5',
        email: 'norole@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {}
      }

      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: null,
        loading: false,
        error: null,
        clearError: vi.fn(),
        refreshProfile: vi.fn()
      })

      renderAdminGuard()

      // When user exists but role is null and no error, it shows loading
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Verificando permisos...')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should deny access when role determination fails with error', () => {
      const mockUser: User = {
        id: '5',
        email: 'norole@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {}
      }

      const mockError: AppError = {
        message: 'Failed to load user role',
        code: 'PROFILE_ERROR',
        isRetryable: true
      }

      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: null,
        loading: false,
        error: mockError,
        clearError: vi.fn(),
        refreshProfile: vi.fn()
      })

      renderAdminGuard()

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Error de autenticación')).toBeInTheDocument()
      expect(screen.getByText('Failed to load user role')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Redirect Behavior', () => {
    it('should redirect to home page when retry is clicked on permission error', () => {
      const mockUser: User = {
        id: '2',
        email: 'admin@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {}
      }

      const mockPermissionError: AppError = {
        message: 'Necesitas permisos de super administrador para acceder a esta sección.',
        code: 'PERMISSION_ERROR',
        isRetryable: false
      }

      mockCreatePermissionError.mockReturnValue(mockPermissionError)

      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: 'admin' as AppRole,
        loading: false,
        error: null,
        clearError: vi.fn(),
        refreshProfile: vi.fn()
      })

      renderAdminGuard()

      const retryButton = screen.getByTestId('retry-button')
      retryButton.click()

      expect(window.location.href).toBe('/')
    })
  })

  describe('Component Rendering', () => {
    it('should render children when user has super_admin role', () => {
      const mockUser: User = {
        id: '1',
        email: 'admin@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {}
      }

      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: 'super_admin' as AppRole,
        loading: false,
        error: null,
        clearError: vi.fn(),
        refreshProfile: vi.fn()
      })

      renderAdminGuard()

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should not render children when access is denied', () => {
      const mockUser: User = {
        id: '2',
        email: 'admin@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {}
      }

      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: 'admin' as AppRole,
        loading: false,
        error: null,
        clearError: vi.fn(),
        refreshProfile: vi.fn()
      })

      renderAdminGuard()

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple retry attempts on error', () => {
      const mockError: AppError = {
        message: 'Network error',
        code: 'NETWORK_ERROR',
        isRetryable: true
      }

      const mockClearError = vi.fn()
      const mockRefreshProfile = vi.fn()

      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        loading: false,
        error: mockError,
        clearError: mockClearError,
        refreshProfile: mockRefreshProfile
      })

      renderAdminGuard()

      const retryButton = screen.getByTestId('retry-button')
      
      // Click retry multiple times
      retryButton.click()
      retryButton.click()
      retryButton.click()

      expect(mockClearError).toHaveBeenCalledTimes(3)
      expect(mockRefreshProfile).not.toHaveBeenCalled() // No user present
    })

    it('should handle error state with user present and call refreshProfile on retry', () => {
      const mockUser: User = {
        id: '1',
        email: 'admin@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {}
      }

      const mockError: AppError = {
        message: 'Profile loading failed',
        code: 'PROFILE_ERROR',
        isRetryable: true
      }

      const mockClearError = vi.fn()
      const mockRefreshProfile = vi.fn()

      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: null,
        loading: false,
        error: mockError,
        clearError: mockClearError,
        refreshProfile: mockRefreshProfile
      })

      renderAdminGuard()

      const retryButton = screen.getByTestId('retry-button')
      retryButton.click()

      expect(mockClearError).toHaveBeenCalledTimes(1)
      expect(mockRefreshProfile).toHaveBeenCalledTimes(1)
    })

    it('should show permission error for undefined role (not null)', () => {
      const mockUser: User = {
        id: '1',
        email: 'admin@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2023-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {}
      }

      const mockPermissionError: AppError = {
        message: 'Necesitas permisos de super administrador para acceder a esta sección.',
        code: 'PERMISSION_ERROR',
        isRetryable: false
      }

      mockCreatePermissionError.mockReturnValue(mockPermissionError)

      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: undefined as any, // Simulate undefined role
        loading: false,
        error: null,
        clearError: vi.fn(),
        refreshProfile: vi.fn()
      })

      renderAdminGuard()

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })
})