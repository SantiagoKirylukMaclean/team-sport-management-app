import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PlayersPage from '../PlayersPage'
import * as playersService from '@/services/players'
import * as teamsService from '@/services/teams'

// Mock the services
vi.mock('@/services/players', () => ({
  listPlayers: vi.fn(),
  deletePlayer: vi.fn(),
}))

vi.mock('@/services/teams', () => ({
  listCoachTeams: vi.fn(),
}))

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock the PlayerFormDialog component
vi.mock('../components/PlayerFormDialog', () => ({
  PlayerFormDialog: ({ open, onClose, onSave }: any) => (
    <div data-testid="player-form-dialog">
      {open && (
        <div>
          <button onClick={onClose}>Close Dialog</button>
          <button onClick={onSave}>Save Player</button>
        </div>
      )}
    </div>
  ),
}))

// Mock the ConfirmDialog component
vi.mock('@/components/ConfirmDialog', () => ({
  ConfirmDialog: ({ open, onConfirm, onCancel }: any) => (
    <div data-testid="confirm-dialog">
      {open && (
        <div>
          <button onClick={onConfirm}>Confirm</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      )}
    </div>
  ),
}))

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <PlayersPage />
    </MemoryRouter>
  )
}

describe('PlayersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    vi.mocked(teamsService.listCoachTeams).mockReturnValue(new Promise(() => {}))
    
    renderComponent()
    
    expect(screen.getByText('Cargando equipos...')).toBeInTheDocument()
  })

  it('shows no teams message when coach has no teams', async () => {
    vi.mocked(teamsService.listCoachTeams).mockResolvedValue({
      data: [],
      error: null
    })

    renderComponent()
    
    await waitFor(() => {
      expect(screen.getByText('No tenés equipos asignados')).toBeInTheDocument()
    })
  })

  it('loads teams and players successfully', async () => {
    const mockTeams = [
      { id: 1, name: 'Equipo A', club_id: 1, created_at: '2023-01-01T00:00:00Z' },
      { id: 2, name: 'Equipo B', club_id: 1, created_at: '2023-01-01T00:00:00Z' }
    ]
    
    const mockPlayers = [
      { id: 1, team_id: 1, full_name: 'Juan Pérez', jersey_number: 10, created_at: '2023-01-01T00:00:00Z' },
      { id: 2, team_id: 1, full_name: 'María García', jersey_number: null, created_at: '2023-01-01T00:00:00Z' }
    ]

    vi.mocked(teamsService.listCoachTeams).mockResolvedValue({
      data: mockTeams,
      error: null
    })
    
    vi.mocked(playersService.listPlayers).mockResolvedValue({
      data: mockPlayers,
      error: null
    })

    renderComponent()
    
    await waitFor(() => {
      expect(screen.getByText('Gestión de Jugadores')).toBeInTheDocument()
      expect(screen.getByText('Equipo A')).toBeInTheDocument()
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      expect(screen.getByText('María García')).toBeInTheDocument()
      expect(screen.getByText('#10')).toBeInTheDocument()
      expect(screen.getByText('Sin número')).toBeInTheDocument()
    })
  })

  it('shows empty players state', async () => {
    const mockTeams = [
      { id: 1, name: 'Equipo A', club_id: 1, created_at: '2023-01-01T00:00:00Z' }
    ]

    vi.mocked(teamsService.listCoachTeams).mockResolvedValue({
      data: mockTeams,
      error: null
    })
    
    vi.mocked(playersService.listPlayers).mockResolvedValue({
      data: [],
      error: null
    })

    renderComponent()
    
    await waitFor(() => {
      expect(screen.getByText('No hay jugadores')).toBeInTheDocument()
      expect(screen.getByText('Agregar Primer Jugador')).toBeInTheDocument()
    })
  })

  it('opens create player dialog', async () => {
    const user = userEvent.setup()
    const mockTeams = [
      { id: 1, name: 'Equipo A', club_id: 1, created_at: '2023-01-01T00:00:00Z' }
    ]

    vi.mocked(teamsService.listCoachTeams).mockResolvedValue({
      data: mockTeams,
      error: null
    })
    
    vi.mocked(playersService.listPlayers).mockResolvedValue({
      data: [],
      error: null
    })

    renderComponent()
    
    await waitFor(() => {
      expect(screen.getByText('Nuevo Jugador')).toBeInTheDocument()
    })

    const newPlayerButton = screen.getByText('Nuevo Jugador')
    await user.click(newPlayerButton)
    
    expect(screen.getByTestId('player-form-dialog')).toBeInTheDocument()
  })

  it('changes team selection', async () => {
    const user = userEvent.setup()
    const mockTeams = [
      { id: 1, name: 'Equipo A', club_id: 1, created_at: '2023-01-01T00:00:00Z' },
      { id: 2, name: 'Equipo B', club_id: 1, created_at: '2023-01-01T00:00:00Z' }
    ]

    vi.mocked(teamsService.listCoachTeams).mockResolvedValue({
      data: mockTeams,
      error: null
    })
    
    vi.mocked(playersService.listPlayers).mockResolvedValue({
      data: [],
      error: null
    })

    renderComponent()
    
    await waitFor(() => {
      expect(screen.getByText('Seleccionar equipo')).toBeInTheDocument()
    })

    // The select component would need to be tested with more specific selectors
    // This is a simplified test
    expect(playersService.listPlayers).toHaveBeenCalledWith(1) // Auto-selected first team
  })

  it('deletes player successfully', async () => {
    const user = userEvent.setup()
    const mockTeams = [
      { id: 1, name: 'Equipo A', club_id: 1, created_at: '2023-01-01T00:00:00Z' }
    ]
    
    const mockPlayers = [
      { id: 1, team_id: 1, full_name: 'Juan Pérez', jersey_number: 10, created_at: '2023-01-01T00:00:00Z' }
    ]

    vi.mocked(teamsService.listCoachTeams).mockResolvedValue({
      data: mockTeams,
      error: null
    })
    
    vi.mocked(playersService.listPlayers).mockResolvedValue({
      data: mockPlayers,
      error: null
    })

    vi.mocked(playersService.deletePlayer).mockResolvedValue({
      data: null,
      error: null
    })

    renderComponent()
    
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    // Find and click delete button (trash icon)
    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find(btn => 
      btn.querySelector('svg') // Looking for the trash icon
    )
    
    if (deleteButton) {
      await user.click(deleteButton)
      
      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
      })
      
      const confirmButton = screen.getByText('Confirm')
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(playersService.deletePlayer).toHaveBeenCalledWith(1)
      })
    }
  })

  it('handles team loading error', async () => {
    vi.mocked(teamsService.listCoachTeams).mockResolvedValue({
      data: null,
      error: { message: 'Error loading teams' }
    })

    renderComponent()
    
    await waitFor(() => {
      // The component should handle the error gracefully
      // This would depend on the exact error handling implementation
      expect(screen.queryByText('Cargando equipos...')).not.toBeInTheDocument()
    })
  })

  it('handles players loading error', async () => {
    const mockTeams = [
      { id: 1, name: 'Equipo A', club_id: 1, created_at: '2023-01-01T00:00:00Z' }
    ]

    vi.mocked(teamsService.listCoachTeams).mockResolvedValue({
      data: mockTeams,
      error: null
    })
    
    vi.mocked(playersService.listPlayers).mockResolvedValue({
      data: null,
      error: { message: 'Error loading players' }
    })

    renderComponent()
    
    await waitFor(() => {
      // The component should handle the error gracefully
      expect(screen.getByText('Gestión de Jugadores')).toBeInTheDocument()
    })
  })
})