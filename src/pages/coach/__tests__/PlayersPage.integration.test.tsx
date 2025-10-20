import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PlayersPage from '../PlayersPage'
import * as playersService from '@/services/players'
import * as teamsService from '@/services/teams'

// Mock the services
vi.mock('@/services/players')
vi.mock('@/services/teams')

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <PlayersPage />
    </MemoryRouter>
  )
}

describe('PlayersPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing and loads data', async () => {
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

    renderComponent()
    
    // Should show loading initially
    expect(screen.getByText('Cargando equipos...')).toBeInTheDocument()
    
    // Should load and show content
    await waitFor(() => {
      expect(screen.getByText('Gestión de Jugadores')).toBeInTheDocument()
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })
    
    // Verify services were called
    expect(teamsService.listCoachTeams).toHaveBeenCalled()
    expect(playersService.listPlayers).toHaveBeenCalledWith(1)
  })

  it('handles errors gracefully', async () => {
    vi.mocked(teamsService.listCoachTeams).mockResolvedValue({
      data: null,
      error: { message: 'Network error' }
    })

    renderComponent()
    
    await waitFor(() => {
      // Should not crash and should handle error gracefully
      expect(screen.queryByText('Cargando equipos...')).not.toBeInTheDocument()
    })
  })
})