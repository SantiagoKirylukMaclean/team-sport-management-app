import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest'
import SportsPage from '../SportsPage'
import type { Sport } from '@/types/db'
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

const mockSports: Sport[] = [
  {
    id: '1',
    name: 'Fútbol',
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'Baloncesto',
    created_at: '2024-01-02T11:00:00Z'
  }
]

describe('SportsPage', () => {
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

      render(<SportsPage />)

      expect(screen.getByTestId('page-loading')).toBeInTheDocument()
      expect(screen.getByText('Deportes')).toBeInTheDocument()
      expect(screen.getByText('Gestión de deportes del sistema')).toBeInTheDocument()
      expect(screen.getByText('Cargando deportes...')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error state with retry option', () => {
      const mockError = { message: 'Failed to fetch sports', code: 'FETCH_ERROR' }
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: false,
        error: mockError,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: true
      })

      render(<SportsPage />)

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Error al cargar deportes')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch sports')).toBeInTheDocument()
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

      render(<SportsPage />)

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument()
    })

    it('should call retry function when retry button is clicked', () => {
      const mockError = { message: 'Failed to fetch sports', code: 'FETCH_ERROR' }
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: false,
        error: mockError,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: true
      })

      render(<SportsPage />)

      const retryButton = screen.getByTestId('retry-button')
      fireEvent.click(retryButton)

      expect(mockRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no sports are available', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { sports: [], hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<SportsPage />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('🏆')).toBeInTheDocument()
      expect(screen.getByText('No hay deportes registrados')).toBeInTheDocument()
      expect(screen.getByText('Aún no se han registrado deportes en el sistema.')).toBeInTheDocument()
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

      render(<SportsPage />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    it('should call execute function when empty state action is clicked', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { sports: [], hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<SportsPage />)

      const actionButton = screen.getByTestId('empty-action')
      fireEvent.click(actionButton)

      expect(mockExecute).toHaveBeenCalledTimes(2) // Once on mount, once on button click
    })
  })

  describe('Success State with Data', () => {
    it('should display sports data correctly', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { sports: mockSports, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<SportsPage />)

      expect(screen.getByText('Deportes')).toBeInTheDocument()
      expect(screen.getByText('Gestión de deportes del sistema (2 deportes)')).toBeInTheDocument()
      
      // Check if sports are displayed
      expect(screen.getByText('Fútbol')).toBeInTheDocument()
      expect(screen.getByText('Baloncesto')).toBeInTheDocument()
      
      // Check if IDs are displayed
      expect(screen.getByText('ID: 1')).toBeInTheDocument()
      expect(screen.getByText('ID: 2')).toBeInTheDocument()
      
      // Check if dates are formatted correctly (dates are formatted in Spanish locale)
      expect(screen.getByText('1 ene 2024, 11:00')).toBeInTheDocument()
      expect(screen.getByText('2 ene 2024, 12:00')).toBeInTheDocument()
      
      // Check for update button
      expect(screen.getByText('Actualizar')).toBeInTheDocument()
    })

    it('should display pagination message when hasMore is true', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { sports: mockSports, hasMore: true },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<SportsPage />)

      expect(screen.getByText('Mostrando los primeros 25 deportes')).toBeInTheDocument()
      expect(screen.getByText('La paginación completa se implementará en futuras versiones')).toBeInTheDocument()
    })

    it('should not display pagination message when hasMore is false', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { sports: mockSports, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<SportsPage />)

      expect(screen.queryByText('Mostrando los primeros 25 deportes')).not.toBeInTheDocument()
    })

    it('should call execute function when update button is clicked', () => {
      mockUseAsyncOperation.mockReturnValue({
        data: { sports: mockSports, hasMore: false },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<SportsPage />)

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

      render(<SportsPage />)

      // Execute should be called on mount via useEffect
      expect(mockExecute).toHaveBeenCalledTimes(1)
    })

    it('should handle network timeout errors', () => {
      const timeoutError = { 
        message: 'Request timeout', 
        code: 'TIMEOUT_ERROR',
        details: 'Network request timed out after 30 seconds'
      }
      
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: false,
        error: timeoutError,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: true
      })

      render(<SportsPage />)

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Error al cargar deportes')).toBeInTheDocument()
      expect(screen.getByText('Request timeout')).toBeInTheDocument()
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    })

    it('should handle database connection errors', () => {
      const dbError = { 
        message: 'Database connection failed', 
        code: 'DB_CONNECTION_ERROR'
      }
      
      mockUseAsyncOperation.mockReturnValue({
        data: null,
        loading: false,
        error: dbError,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<SportsPage />)

      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Database connection failed')).toBeInTheDocument()
      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument()
    })

    it('should handle large datasets with pagination correctly', () => {
      const largeSportsDataset = Array.from({ length: 25 }, (_, i) => ({
        id: `sport-${i + 1}`,
        name: `Sport ${i + 1}`,
        created_at: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`
      }))

      mockUseAsyncOperation.mockReturnValue({
        data: { sports: largeSportsDataset, hasMore: true },
        loading: false,
        error: null,
        execute: mockExecute,
        retry: mockRetry,
        canRetry: false
      })

      render(<SportsPage />)

      expect(screen.getByText('Gestión de deportes del sistema (25 deportes)')).toBeInTheDocument()
      expect(screen.getByText('Mostrando los primeros 25 deportes')).toBeInTheDocument()
      expect(screen.getByText('Sport 1')).toBeInTheDocument()
      expect(screen.getByText('Sport 25')).toBeInTheDocument()
    })
  })
})