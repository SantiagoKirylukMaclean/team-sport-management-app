import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest'
import ClubsPage from '../ClubsPage'
import type { Club } from '@/types/db'
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

const mockClubs: Club[] = [
  {
    id: '1',
    name: 'Real Madrid',
    sport_id: 'sport-1',
    created_at: '2024-01-01T10:00:00Z',
    sports: { name: 'Fútbol' }
  },
  {
    id: '2',
    name: 'Lakers',
    sport_id: 'sport-2',
    created_at: '2024-01-02T11:00:00Z',
    sports: { name: 'Baloncesto' }
  }
]

const mockClubsWithoutSports: Club[] = [
  {
    id: '1',
    name: 'Real Madrid',
    sport_id: 'sport-1',
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'Lakers',
    sport_id: 'sport-2',
    created_at: '2024-01-02T11:00:00Z'
  }
]

describe('ClubsPage', () => {
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

      render(<ClubsPage />)

      expect(screen.getByTestId('page-loading')).toBeInTheDocument()
      expect(screen.getByText('Clubes')).toBeInTheDocument()
      expect(screen.getByText('Gestión de clubes del sistema')).toBeInTheDocument()
      expect(screen.getByText('Cargando clubes...')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error state with retry option', () => {
      const mockError = { message: 'Failed to fetch clubs', code: 'FETCH_ERROR' }
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: false,
        error: mockError,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: true
      })

      render(<ClubsPage />)

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Error al cargar clubes')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch clubs')).toBeInTheDocument()
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

      render(<ClubsPage />)

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument()
    })

    it('should call retry function when retry button is clicked', () => {
      const mockError = { message: 'Failed to fetch clubs', code: 'FETCH_ERROR' }
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: false,
        error: mockError,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: true
      })

      render(<ClubsPage />)

      const retryButton = screen.getByTestId('retry-button')
      fireEvent.click(retryButton)

      expect(mockRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no clubs are available', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { clubs: [], hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<ClubsPage />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('🏟️')).toBeInTheDocument()
      expect(screen.getByText('No hay clubes registrados')).toBeInTheDocument()
      expect(screen.getByText('Aún no se han registrado clubes en el sistema.')).toBeInTheDocument()
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

      render(<ClubsPage />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    it('should call execute function when empty state action is clicked', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { clubs: [], hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<ClubsPage />)

      const actionButton = screen.getByTestId('empty-action')
      fireEvent.click(actionButton)

      expect(mockExecute).toHaveBeenCalledTimes(2) // Once on mount, once on button click
    })
  })

  describe('Success State with Data', () => {
    it('should display clubs data with sport names correctly', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { clubs: mockClubs, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<ClubsPage />)

      expect(screen.getByText('Clubes')).toBeInTheDocument()
      expect(screen.getByText('Gestión de clubes del sistema (2 clubes)')).toBeInTheDocument()
      
      // Check if clubs are displayed
      expect(screen.getByText('Real Madrid')).toBeInTheDocument()
      expect(screen.getByText('Lakers')).toBeInTheDocument()
      
      // Check if IDs are displayed
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
      expect(screen.getByText('ID: 2')).toBeInTheDocument()
      
      // Check if sport names are displayed correctly
      expect(screen.getByText('Deporte: Fútbol')).toBeInTheDocument()
      expect(screen.getByText('Deporte: Baloncesto')).toBeInTheDocument()
      
      // Check if dates are formatted correctly (dates are formatted in Spanish locale)
      expect(screen.getByText('1 ene 2024, 11:00')).toBeInTheDocument()
      expect(screen.getByText('2 ene 2024, 12:00')).toBeInTheDocument()
      
      // Check for update button
      expect(screen.getByText('Actualizar')).toBeInTheDocument()
    })

    it('should display clubs data without sport names when sports data is not available', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { clubs: mockClubsWithoutSports, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<ClubsPage />)

      expect(screen.getByText('Real Madrid')).toBeInTheDocument()
      expect(screen.getByText('Lakers')).toBeInTheDocument()
      
      // Check if sport IDs are displayed as fallback
      expect(screen.getByText('Deporte: sport-1')).toBeInTheDocument()
      expect(screen.getByText('Deporte: sport-2')).toBeInTheDocument()
    })

    it('should display pagination message when hasMore is true', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { clubs: mockClubs, hasMore: true },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<ClubsPage />)

      expect(screen.getByText('Mostrando los primeros 25 clubes')).toBeInTheDocument()
      expect(screen.getByText('La paginación completa se implementará en futuras versiones')).toBeInTheDocument()
    })

    it('should not display pagination message when hasMore is false', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { clubs: mockClubs, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<ClubsPage />)

      expect(screen.queryByText('Mostrando los primeros 25 clubes')).not.toBeInTheDocument()
    })

    it('should call execute function when update button is clicked', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { clubs: mockClubs, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<ClubsPage />)

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

      render(<ClubsPage />)

      // Execute should be called on mount via useEffect
      expect(mockExecute).toHaveBeenCalledTimes(1)
    })
  })

  describe('Join Fallback Logic', () => {
    it('should handle clubs with mixed sport data availability', () => {
      const mixedClubs: Club[] = [
        {
          id: '1',
          name: 'Real Madrid',
          sport_id: 'sport-1',
          created_at: '2024-01-01T10:00:00Z',
          sports: { name: 'Fútbol' }
        },
        {
          id: '2',
          name: 'Lakers',
          sport_id: 'sport-2',
          created_at: '2024-01-02T11:00:00Z'
          // No sports data
        }
      ]

      mockUseAsyncOperation.mockReturnValue({
        data: { clubs: mixedClubs, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<ClubsPage />)

      // One club should show sport name, other should show sport ID
      expect(screen.getByText('Deporte: Fútbol')).toBeInTheDocument()
      expect(screen.getByText('Deporte: sport-2')).toBeInTheDocument()
    })

    it('should handle join query failures gracefully', () => {
      // This test simulates the scenario where join queries fail and fallback logic is used
      const clubsWithoutJoinData: Club[] = [
        {
          id: '1',
          name: 'Club without sport data',
          sport_id: 'sport-unknown',
          created_at: '2024-01-01T10:00:00Z'
          // No sports data - simulates join failure fallback
        }
      ]

      mockUseAsyncOperation.mockReturnValue({
        data: { clubs: clubsWithoutJoinData, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<ClubsPage />)

      expect(screen.getByText('Club without sport data')).toBeInTheDocument()
      expect(screen.getByText('Deporte: sport-unknown')).toBeInTheDocument()
    })

    it('should handle foreign key constraint errors', () => {
      const constraintError = { 
        message: 'Foreign key constraint violation', 
        code: 'FOREIGN_KEY_ERROR',
        details: 'Referenced sport does not exist'
      }
      
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: false,
        error: constraintError,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<ClubsPage />)

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Foreign key constraint violation')).toBeInTheDocument()
      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument()
    })

    it('should handle large datasets with proper pagination', () => {
      const largeClubsDataset = Array.from({ length: 25 }, (_, i) => ({
        id: `club-${i + 1}`,
        name: `Club ${i + 1}`,
        sport_id: `sport-${(i % 5) + 1}`,
        created_at: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        sports: { name: `Sport ${(i % 5) + 1}` }
      }))

      mockUseAsyncOperation.mockReturnValue({
        data: { clubs: largeClubsDataset, hasMore: true },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<ClubsPage />)

      expect(screen.getByText('Gestión de clubes del sistema (25 clubes)')).toBeInTheDocument()
      expect(screen.getByText('Mostrando los primeros 25 clubes')).toBeInTheDocument()
      expect(screen.getByText('Club 1')).toBeInTheDocument()
      expect(screen.getByText('Club 25')).toBeInTheDocument()
    })
  })
})