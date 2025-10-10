import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest'
import TeamsPage from '../TeamsPage'
import type { Team } from '@/types/db'
import { useAsyncOperation } from '@/hooks/useAsyncOperation'

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

// Mock the useAsyncOperation hook
vi.mock('@/hooks/useAsyncOperation')

// Mock UI components
vi.mock('@/components/ui/page-loading', () => ({
  default: ({ title, description, message }: any) => (
    <div data-testid="page-loading">
      <h1>{title}</h1>
      <p>{description}</p>
      <p>{message}</p>
    </div>
  )
}))

vi.mock('@/components/ui/error-display', () => ({
  default: ({ error, title, onRetry, showDetails }: any) => (
    <div data-testid="error-display">
      <h2>{title}</h2>
      <p>{error?.message || 'Error occurred'}</p>
      {onRetry && (
        <button onClick={onRetry} data-testid="retry-button">
          Retry
        </button>
      )}
      {showDetails && <p data-testid="error-details">Details shown</p>}
    </div>
  )
}))

vi.mock('@/components/ui/empty-state', () => ({
  default: ({ icon, title, description, actionLabel, onAction }: any) => (
    <div data-testid="empty-state">
      <span>{icon}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {onAction && (
        <button onClick={onAction} data-testid="empty-action">
          {actionLabel}
        </button>
      )}
    </div>
  )
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  )
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size }: any) => (
    <button 
      onClick={onClick} 
      data-testid="button"
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  )
}))

const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Real Madrid Castilla',
    club_id: 'club-1',
    created_at: '2024-01-01T10:00:00Z',
    clubs: { name: 'Real Madrid' }
  },
  {
    id: '2',
    name: 'Lakers Reserve',
    club_id: 'club-2',
    created_at: '2024-01-02T11:00:00Z',
    clubs: { name: 'Lakers' }
  }
]

const mockTeamsWithoutClubs: Team[] = [
  {
    id: '1',
    name: 'Real Madrid Castilla',
    club_id: 'club-1',
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'Lakers Reserve',
    club_id: 'club-2',
    created_at: '2024-01-02T11:00:00Z'
  }
]

describe('TeamsPage', () => {
  const mockExecute = vi.fn()
  const mockRetry = vi.fn()
  const mockUseAsyncOperation = useAsyncOperation as Mock
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAsyncOperation.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      execute: mockExecute,
      retry: mockRetry,
      canRetry: false
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Loading State', () => {
    it('should display loading state correctly', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<TeamsPage />)

      expect(screen.getByTestId('page-loading')).toBeInTheDocument()
      expect(screen.getByText('Equipos')).toBeInTheDocument()
      expect(screen.getByText('Gestión de equipos del sistema')).toBeInTheDocument()
      expect(screen.getByText('Cargando equipos...')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error state with retry option', () => {
      const mockError = { message: 'Failed to fetch teams', code: 'FETCH_ERROR' }
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: false,
        error: mockError,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: true
      })

      render(<TeamsPage />)

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Error al cargar equipos')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch teams')).toBeInTheDocument()
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
      expect(screen.getByTestId('error-details')).toBeInTheDocument()
    })

    it('should display error state without retry option when canRetry is false', () => {
      const mockError = { message: 'Permanent error', code: 'PERM_ERROR' }
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: false,
        error: mockError,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<TeamsPage />)

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument()
    })

    it('should call retry function when retry button is clicked', () => {
      const mockError = { message: 'Failed to fetch teams', code: 'FETCH_ERROR' }
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: false,
        error: mockError,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: true
      })

      render(<TeamsPage />)

      const retryButton = screen.getByTestId('retry-button')
      fireEvent.click(retryButton)

      expect(mockRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no teams are available', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { teams: [], hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<TeamsPage />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('⚽')).toBeInTheDocument()
      expect(screen.getByText('No hay equipos registrados')).toBeInTheDocument()
      expect(screen.getByText('Aún no se han registrado equipos en el sistema.')).toBeInTheDocument()
      expect(screen.getByTestId('empty-action')).toBeInTheDocument()
      expect(screen.getByText('Actualizar')).toBeInTheDocument()
    })

    it('should display empty state when data is null', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<TeamsPage />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    it('should call execute function when empty state action is clicked', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { teams: [], hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<TeamsPage />)

      const actionButton = screen.getByTestId('empty-action')
      fireEvent.click(actionButton)

      expect(mockExecute).toHaveBeenCalledTimes(2) // Once on mount, once on button click
    })
  })

  describe('Success State with Data', () => {
    it('should display teams data with club names correctly', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { teams: mockTeams, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<TeamsPage />)

      expect(screen.getByText('Equipos')).toBeInTheDocument()
      expect(screen.getByText('Gestión de equipos del sistema (2 equipos)')).toBeInTheDocument()
      
      // Check if teams are displayed
      expect(screen.getByText('Real Madrid Castilla')).toBeInTheDocument()
      expect(screen.getByText('Lakers Reserve')).toBeInTheDocument()
      
      // Check if IDs are displayed
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
      expect(screen.getByText('ID: 2')).toBeInTheDocument()
      
      // Check if club names are displayed correctly
      expect(screen.getByText('Club: Real Madrid')).toBeInTheDocument()
      expect(screen.getByText('Club: Lakers')).toBeInTheDocument()
      
      // Check if dates are formatted correctly (dates are formatted in Spanish locale)
      expect(screen.getByText('1 ene 2024, 11:00')).toBeInTheDocument()
      expect(screen.getByText('2 ene 2024, 12:00')).toBeInTheDocument()
      
      // Check for update button
      expect(screen.getByText('Actualizar')).toBeInTheDocument()
    })

    it('should display teams data without club names when clubs data is not available', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { teams: mockTeamsWithoutClubs, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<TeamsPage />)

      expect(screen.getByText('Real Madrid Castilla')).toBeInTheDocument()
      expect(screen.getByText('Lakers Reserve')).toBeInTheDocument()
      
      // Check if club IDs are displayed as fallback
      expect(screen.getByText('Club: club-1')).toBeInTheDocument()
      expect(screen.getByText('Club: club-2')).toBeInTheDocument()
    })

    it('should display pagination message when hasMore is true', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { teams: mockTeams, hasMore: true },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<TeamsPage />)

      expect(screen.getByText('Mostrando los primeros 25 equipos')).toBeInTheDocument()
      expect(screen.getByText('La paginación completa se implementará en futuras versiones')).toBeInTheDocument()
    })

    it('should not display pagination message when hasMore is false', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { teams: mockTeams, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<TeamsPage />)

      expect(screen.queryByText('Mostrando los primeros 25 equipos')).not.toBeInTheDocument()
    })

    it('should call execute function when update button is clicked', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { teams: mockTeams, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<TeamsPage />)

      const updateButton = screen.getByText('Actualizar')
      fireEvent.click(updateButton)

      expect(mockExecute).toHaveBeenCalledTimes(2) // Once on mount, once on button click
    })
  })

  describe('Data Fetching Logic', () => {
    it('should call execute on component mount', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<TeamsPage />)

      // Execute should be called on mount via useEffect
      expect(mockExecute).toHaveBeenCalledTimes(1)
    })
  })

  describe('Relationship Data Handling', () => {
    it('should handle teams with mixed club data availability', () => {
      const mixedTeams: Team[] = [
        {
          id: '1',
          name: 'Real Madrid Castilla',
          club_id: 'club-1',
          created_at: '2024-01-01T10:00:00Z',
          clubs: { name: 'Real Madrid' }
        },
        {
          id: '2',
          name: 'Lakers Reserve',
          club_id: 'club-2',
          created_at: '2024-01-02T11:00:00Z'
          // No clubs data
        }
      ]

      mockUseAsyncOperation.mockReturnValue({
        data: { teams: mixedTeams, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<TeamsPage />)

      // One team should show club name, other should show club ID
      expect(screen.getByText('Club: Real Madrid')).toBeInTheDocument()
      expect(screen.getByText('Club: club-2')).toBeInTheDocument()
    })

    it('should handle join fallback logic correctly', () => {
      // This test verifies that the component handles the fallback logic correctly
      // The actual fallback logic is tested through the data fetching function
      // which is mocked in these tests, but the component should handle both scenarios
      
      const teamsWithPartialData: Team[] = [
        {
          id: '1',
          name: 'Team with club data',
          club_id: 'club-1',
          created_at: '2024-01-01T10:00:00Z',
          clubs: { name: 'Club Name' }
        },
        {
          id: '2',
          name: 'Team without club data',
          club_id: 'club-2',
          created_at: '2024-01-02T11:00:00Z'
          // No clubs data - simulates fallback scenario
        }
      ]

      mockUseAsyncOperation.mockReturnValue({
        data: { teams: teamsWithPartialData, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<TeamsPage />)

      // Should display both teams correctly
      expect(screen.getByText('Team with club data')).toBeInTheDocument()
      expect(screen.getByText('Team without club data')).toBeInTheDocument()
      
      // One should show club name, other should show club ID
      expect(screen.getByText('Club: Club Name')).toBeInTheDocument()
      expect(screen.getByText('Club: club-2')).toBeInTheDocument()
    })

    it('should handle network errors during data fetching', () => {
      const networkError = { 
        message: 'Network error occurred', 
        code: 'NETWORK_ERROR',
        details: 'Connection timeout'
      }
      
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: false,
        error: networkError,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: true
      })

      render(<TeamsPage />)

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Error al cargar equipos')).toBeInTheDocument()
      expect(screen.getByText('Network error occurred')).toBeInTheDocument()
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    })

    it('should handle database constraint errors', () => {
      const dbError = { 
        message: 'Foreign key constraint failed', 
        code: 'DB_CONSTRAINT_ERROR'
      }
      
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: false,
        error: dbError,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<TeamsPage />)

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Foreign key constraint failed')).toBeInTheDocument()
      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument()
    })
  })
})