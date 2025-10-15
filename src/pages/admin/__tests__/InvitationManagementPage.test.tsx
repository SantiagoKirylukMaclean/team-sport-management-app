import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import InvitationManagementPage from '../InvitationManagementPage'
import * as invitesService from '@/services/invites'

// Mock the services
vi.mock('@/services/invites')
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

const mockInvitations = [
  {
    id: 1,
    email: 'test@example.com',
    role: 'coach' as const,
    team_ids: [1, 2],
    status: 'pending' as const,
    created_by: 'user-1',
    created_at: '2024-01-01T10:00:00Z',
    accepted_at: null
  },
  {
    id: 2,
    email: 'admin@example.com',
    role: 'admin' as const,
    team_ids: [3],
    status: 'accepted' as const,
    created_by: 'user-1',
    created_at: '2024-01-02T10:00:00Z',
    accepted_at: '2024-01-02T11:00:00Z'
  }
]

const mockTeamDetails = [
  { id: 1, name: 'Team A', club_name: 'Club A', sport_name: 'Football' },
  { id: 2, name: 'Team B', club_name: 'Club B', sport_name: 'Basketball' },
  { id: 3, name: 'Team C', club_name: 'Club C', sport_name: 'Tennis' }
]

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <InvitationManagementPage />
    </MemoryRouter>
  )
}

describe('InvitationManagementPage', () => {
  beforeEach(() => {
    vi.mocked(invitesService.listInvitations).mockResolvedValue({
      data: mockInvitations,
      error: null
    })
    vi.mocked(invitesService.getTeamDetails).mockResolvedValue({
      data: mockTeamDetails,
      error: null
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title and new invitation button', async () => {
    renderComponent()

    expect(screen.getByText('Gestión de Invitaciones')).toBeInTheDocument()
    expect(screen.getByText('Nueva Invitación')).toBeInTheDocument()
  })

  it('loads and displays invitations', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    })

    expect(invitesService.listInvitations).toHaveBeenCalledWith({
      status: undefined,
      email: undefined
    })
  })

  it('displays invitation status badges correctly', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Pendiente')).toBeInTheDocument()
      expect(screen.getByText('Aceptada')).toBeInTheDocument()
    })
  })

  it('shows team details for invitations', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Football > Club A > Team A/)).toBeInTheDocument()
      expect(screen.getByText(/Tennis > Club C > Team C/)).toBeInTheDocument()
    })

    expect(invitesService.getTeamDetails).toHaveBeenCalledWith([1, 2, 3])
  })

  it('filters invitations by status', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    // Change status filter to pending
    const statusSelect = screen.getByDisplayValue('Todos los estados')
    fireEvent.click(statusSelect)
    
    const pendingOption = screen.getByText('Pendientes')
    fireEvent.click(pendingOption)

    await waitFor(() => {
      expect(invitesService.listInvitations).toHaveBeenCalledWith({
        status: 'pending',
        email: undefined
      })
    })
  })

  it('filters invitations by email search', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Buscar por email...')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    await waitFor(() => {
      expect(invitesService.listInvitations).toHaveBeenCalledWith({
        status: undefined,
        email: 'test'
      })
    })
  })

  it('shows cancel button only for pending invitations', async () => {
    renderComponent()

    await waitFor(() => {
      const cancelButtons = screen.getAllByText('Cancelar')
      expect(cancelButtons).toHaveLength(1) // Only one pending invitation
    })
  })

  it('handles invitation cancellation', async () => {
    vi.mocked(invitesService.cancelInvitation).mockResolvedValue({
      data: { ...mockInvitations[0], status: 'canceled' },
      error: null
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    const cancelButton = screen.getByText('Cancelar')
    fireEvent.click(cancelButton)

    // Confirm cancellation dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Cancelar Invitación')).toBeInTheDocument()
    })

    const confirmButton = screen.getByText('Cancelar Invitación')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(invitesService.cancelInvitation).toHaveBeenCalledWith(1)
    })
  })

  it('handles loading state', () => {
    vi.mocked(invitesService.listInvitations).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    renderComponent()

    expect(screen.getByText('Cargando invitaciones...')).toBeInTheDocument()
  })

  it('handles error state', async () => {
    vi.mocked(invitesService.listInvitations).mockResolvedValue({
      data: null,
      error: { message: 'Failed to load', code: 'ERROR' }
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to load/)).toBeInTheDocument()
      expect(screen.getByText('Reintentar')).toBeInTheDocument()
    })
  })

  it('displays empty state when no invitations found', async () => {
    vi.mocked(invitesService.listInvitations).mockResolvedValue({
      data: [],
      error: null
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('No se encontraron invitaciones con los filtros aplicados.')).toBeInTheDocument()
    })
  })
})