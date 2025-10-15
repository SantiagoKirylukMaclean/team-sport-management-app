import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TeamMultiSelect } from '../team-multi-select'
import * as teamsService from '@/services/teams'
import * as clubsService from '@/services/clubs'
import * as sportsService from '@/services/sports'

// Mock the services
vi.mock('@/services/teams')
vi.mock('@/services/clubs')
vi.mock('@/services/sports')

const mockTeams = [
  { id: 1, name: 'Team A', club_id: 1, created_at: '2023-01-01' },
  { id: 2, name: 'Team B', club_id: 2, created_at: '2023-01-02' }
]

const mockClubs = [
  { id: 1, name: 'Club A', sport_id: 1, created_at: '2023-01-01' },
  { id: 2, name: 'Club B', sport_id: 2, created_at: '2023-01-02' }
]

const mockSports = [
  { id: 1, name: 'Football', created_at: '2023-01-01' },
  { id: 2, name: 'Basketball', created_at: '2023-01-02' }
]

describe('TeamMultiSelect Integration', () => {
  const mockOnChange = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup successful mock responses
    vi.mocked(teamsService.listTeams).mockResolvedValue({ data: mockTeams, error: null })
    vi.mocked(clubsService.listClubs).mockResolvedValue({ data: mockClubs, error: null })
    vi.mocked(sportsService.listSports).mockResolvedValue({ data: mockSports, error: null })
  })

  describe('Complete Team Selection Workflow - Requirement 5.1', () => {
    it('allows complete team selection workflow', async () => {
      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Select teams...')).toBeInTheDocument()
      })

      // Open dropdown
      const triggerButton = screen.getByRole('combobox')
      await user.click(triggerButton)

      // Wait for teams to appear
      await waitFor(() => {
        expect(screen.getByText('Team A')).toBeInTheDocument()
      })

      // Select a team
      await user.click(screen.getByText('Team A'))

      // Verify onChange was called
      expect(mockOnChange).toHaveBeenCalledWith([1])
    })

    it('displays selected teams with proper information', async () => {
      render(
        <TeamMultiSelect
          value={[1]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('1 team selected')).toBeInTheDocument()
        expect(screen.getByText('Selected Teams (1)')).toBeInTheDocument()
        expect(screen.getByText('Team A')).toBeInTheDocument()
        expect(screen.getByText('Football • Club A')).toBeInTheDocument()
      })
    })

    it('allows removing selected teams', async () => {
      render(
        <TeamMultiSelect
          value={[1]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        const removeButton = screen.getByLabelText('Remove Team A')
        expect(removeButton).toBeInTheDocument()
      })

      const removeButton = screen.getByLabelText('Remove Team A')
      await user.click(removeButton)

      expect(mockOnChange).toHaveBeenCalledWith([])
    })
  })

  describe('Data Loading and Error Handling', () => {
    it('handles service errors gracefully', async () => {
      vi.mocked(teamsService.listTeams).mockRejectedValue(new Error('Service unavailable'))

      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Service unavailable')).toBeInTheDocument()
      })
    })

    it('shows loading state during data fetch', () => {
      // Mock services to never resolve
      vi.mocked(teamsService.listTeams).mockImplementation(() => new Promise(() => {}))

      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Loading teams...')).toBeInTheDocument()
    })
  })

  describe('Validation Requirements - Requirement 5.3', () => {
    it('validates team selection requirements', async () => {
      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('At least one team must be selected')).toBeInTheDocument()
      })
    })

    it('handles invalid team IDs', async () => {
      render(
        <TeamMultiSelect
          value={[999]} // Invalid team ID
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        // Should automatically clean up invalid IDs
        expect(mockOnChange).toHaveBeenCalledWith([])
      })
    })
  })
})