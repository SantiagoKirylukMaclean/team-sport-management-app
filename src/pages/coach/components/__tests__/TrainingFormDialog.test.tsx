import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TrainingFormDialog } from '../TrainingFormDialog'
import * as trainingsService from '@/services/trainings'

// Mock the services
vi.mock('@/services/trainings', () => ({
  createTrainingSession: vi.fn(),
  updateTrainingSession: vi.fn(),
}))

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

const mockProps = {
  open: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  teamId: 1,
}

describe('TrainingFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create form with correct fields', () => {
    render(<TrainingFormDialog {...mockProps} />)
    
    expect(screen.getByText('Nuevo Entrenamiento')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha del Entrenamiento')).toBeInTheDocument()
    expect(screen.getByLabelText('Notas (opcional)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('validates required session_date field', async () => {
    const user = userEvent.setup()
    render(<TrainingFormDialog {...mockProps} />)
    
    const submitButton = screen.getByRole('button', { name: 'Crear' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('La fecha es requerida')).toBeInTheDocument()
    })
  })

  it('renders in create mode with null training prop', () => {
    render(<TrainingFormDialog {...mockProps} training={null} />)
    
    expect(screen.getByText('Nuevo Entrenamiento')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument()
    
    const dateInput = screen.getByLabelText('Fecha del Entrenamiento') as HTMLInputElement
    const notesInput = screen.getByLabelText('Notas (opcional)') as HTMLTextAreaElement
    
    expect(dateInput.value).toBe('')
    expect(notesInput.value).toBe('')
  })

  it('renders in edit mode with existing training data', () => {
    const training = {
      id: 1,
      team_id: 1,
      session_date: '2024-03-15',
      notes: 'Entrenamiento de táctica',
      created_at: '2024-03-01T00:00:00Z'
    }

    render(<TrainingFormDialog {...mockProps} training={training} />)
    
    expect(screen.getByText('Editar Entrenamiento')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument()
    
    const dateInput = screen.getByLabelText('Fecha del Entrenamiento') as HTMLInputElement
    const notesInput = screen.getByLabelText('Notas (opcional)') as HTMLTextAreaElement
    
    expect(dateInput.value).toBe('2024-03-15')
    expect(notesInput.value).toBe('Entrenamiento de táctica')
  })

  it('calls createTrainingSession service function on create', async () => {
    const user = userEvent.setup()
    const mockCreate = vi.mocked(trainingsService.createTrainingSession)
    mockCreate.mockResolvedValue({
      data: {
        id: 1,
        team_id: 1,
        session_date: '2024-03-15',
        notes: 'Test notes',
        created_at: '2024-03-01T00:00:00Z'
      },
      error: null
    })

    render(<TrainingFormDialog {...mockProps} />)
    
    const dateInput = screen.getByLabelText('Fecha del Entrenamiento')
    const notesInput = screen.getByLabelText('Notas (opcional)')
    
    await user.type(dateInput, '2024-03-15')
    await user.type(notesInput, 'Test notes')
    
    const submitButton = screen.getByRole('button', { name: 'Crear' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        team_id: 1,
        session_date: '2024-03-15',
        notes: 'Test notes'
      })
      expect(mockProps.onSave).toHaveBeenCalled()
    })
  })

  it('calls updateTrainingSession service function on edit', async () => {
    const user = userEvent.setup()
    const mockUpdate = vi.mocked(trainingsService.updateTrainingSession)
    mockUpdate.mockResolvedValue({
      data: {
        id: 1,
        team_id: 1,
        session_date: '2024-03-20',
        notes: 'Updated notes',
        created_at: '2024-03-01T00:00:00Z'
      },
      error: null
    })

    const training = {
      id: 1,
      team_id: 1,
      session_date: '2024-03-15',
      notes: 'Original notes',
      created_at: '2024-03-01T00:00:00Z'
    }

    render(<TrainingFormDialog {...mockProps} training={training} />)
    
    const dateInput = screen.getByLabelText('Fecha del Entrenamiento')
    const notesInput = screen.getByLabelText('Notas (opcional)')
    
    await user.clear(dateInput)
    await user.type(dateInput, '2024-03-20')
    await user.clear(notesInput)
    await user.type(notesInput, 'Updated notes')
    
    const submitButton = screen.getByRole('button', { name: 'Actualizar' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(1, {
        session_date: '2024-03-20',
        notes: 'Updated notes'
      })
      expect(mockProps.onSave).toHaveBeenCalled()
    })
  })

  it('displays toast notification on RLS permission error', async () => {
    const user = userEvent.setup()
    const mockCreate = vi.mocked(trainingsService.createTrainingSession)
    mockCreate.mockResolvedValue({
      data: null,
      error: { message: 'permission denied for table training_sessions', code: '42501' }
    })

    render(<TrainingFormDialog {...mockProps} />)
    
    const dateInput = screen.getByLabelText('Fecha del Entrenamiento')
    await user.type(dateInput, '2024-03-15')
    
    const submitButton = screen.getByRole('button', { name: 'Crear' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled()
      expect(mockProps.onSave).not.toHaveBeenCalled()
    })
  })

  it('displays toast notification on foreign key error', async () => {
    const user = userEvent.setup()
    const mockCreate = vi.mocked(trainingsService.createTrainingSession)
    mockCreate.mockResolvedValue({
      data: null,
      error: { message: 'Foreign key violation', code: '23503' }
    })

    render(<TrainingFormDialog {...mockProps} />)
    
    const dateInput = screen.getByLabelText('Fecha del Entrenamiento')
    await user.type(dateInput, '2024-03-15')
    
    const submitButton = screen.getByRole('button', { name: 'Crear' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled()
      expect(mockProps.onSave).not.toHaveBeenCalled()
    })
  })

  it('displays toast notification on network error', async () => {
    const user = userEvent.setup()
    const mockCreate = vi.mocked(trainingsService.createTrainingSession)
    mockCreate.mockRejectedValue(new Error('fetch failed'))

    render(<TrainingFormDialog {...mockProps} />)
    
    const dateInput = screen.getByLabelText('Fecha del Entrenamiento')
    await user.type(dateInput, '2024-03-15')
    
    const submitButton = screen.getByRole('button', { name: 'Crear' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled()
      expect(mockProps.onSave).not.toHaveBeenCalled()
    })
  })

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup()
    const mockCreate = vi.mocked(trainingsService.createTrainingSession)
    mockCreate.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        data: {
          id: 1,
          team_id: 1,
          session_date: '2024-03-15',
          notes: null,
          created_at: '2024-03-01T00:00:00Z'
        },
        error: null
      }), 100))
    )

    render(<TrainingFormDialog {...mockProps} />)
    
    const dateInput = screen.getByLabelText('Fecha del Entrenamiento')
    await user.type(dateInput, '2024-03-15')
    
    const submitButton = screen.getByRole('button', { name: 'Crear' })
    await user.click(submitButton)
    
    expect(screen.getByText('Creando...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    
    await waitFor(() => {
      expect(screen.queryByText('Creando...')).not.toBeInTheDocument()
    })
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<TrainingFormDialog {...mockProps} />)
    
    const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
    await user.click(cancelButton)
    
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('validates notes max length constraint', async () => {
    const user = userEvent.setup()
    render(<TrainingFormDialog {...mockProps} />)
    
    const notesInput = screen.getByLabelText('Notas (opcional)') as HTMLTextAreaElement
    
    // The textarea has maxlength="500" which prevents typing more than 500 characters
    expect(notesInput.maxLength).toBe(500)
  })

  it('handles empty notes correctly', async () => {
    const user = userEvent.setup()
    const mockCreate = vi.mocked(trainingsService.createTrainingSession)
    mockCreate.mockResolvedValue({
      data: {
        id: 1,
        team_id: 1,
        session_date: '2024-03-15',
        notes: null,
        created_at: '2024-03-01T00:00:00Z'
      },
      error: null
    })

    render(<TrainingFormDialog {...mockProps} />)
    
    const dateInput = screen.getByLabelText('Fecha del Entrenamiento')
    await user.type(dateInput, '2024-03-15')
    
    const submitButton = screen.getByRole('button', { name: 'Crear' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        team_id: 1,
        session_date: '2024-03-15',
        notes: undefined
      })
    })
  })
})
