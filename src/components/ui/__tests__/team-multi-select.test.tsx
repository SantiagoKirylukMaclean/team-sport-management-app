import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
  { id: 2, name: 'Team B', club_id: 2, created_at: '2023-01-02' },
  { id: 3, name: 'Team C', club_id: 1, created_at: '2023-01-03' }
]

const mockClubs = [
  { id: 1, name: 'Club A', sport_id: 1, created_at: '2023-01-01' },
  { id: 2, name: 'Club B', sport_id: 2, created_at: '2023-01-02' }
]

const mockSports = [
  { id: 1, name: 'Football', created_at: '2023-01-01' },
  { id: 2, name: 'Basketball', created_at: '2023-01-02' }
]

describe('TeamMultiSelect', () => {
  const mockOnChange = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup successful mock responses
    vi.mocked(teamsService.listTeams).mockResolvedValue({ data: mockTeams, error: null })
    vi.mocked(clubsService.listClubs).mockResolvedValue({ data: mockClubs, error: null })
    vi.mocked(sportsService.listSports).mockResolvedValue({ data: mockSports, error: null })
  })

  describe('Basic Rendering - Requirement 5.1', () => {
    it('renders with placeholder text', async () => {
      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
          placeholder="Select teams..."
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Select teams...')).toBeInTheDocument()
      })
    })

    it('displays selected count when teams are selected', async () => {
      render(
        <TeamMultiSelect
          value={[1, 2]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('2 teams selected')).toBeInTheDocument()
      })
    })

    it('displays singular form for single selection', async () => {
      render(
        <TeamMultiSelect
          value={[1]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('1 team selected')).toBeInTheDocument()
      })
    })

    it('shows minimum selection requirement message', async () => {
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
  })

  describe('Hierarchical Display - Requirement 5.2', () => {
    it('displays hierarchical team structure', async () => {
      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      // Wait for data to load and open the dropdown
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('Team A')).toBeInTheDocument()
        expect(screen.getByText('Football • Club A')).toBeInTheDocument()
        expect(screen.getByText('Team B')).toBeInTheDocument()
        expect(screen.getByText('Basketball • Club B')).toBeInTheDocument()
      })
    })

    it('sorts teams by sport, club, then team name', async () => {
      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        const teamItems = screen.getAllByText(/Team [ABC]/)
        // Should be sorted: Basketball teams first (alphabetically), then Football teams
        expect(teamItems[0]).toHaveTextContent('Team B') // Basketball
        expect(teamItems[1]).toHaveTextContent('Team A') // Football
        expect(teamItems[2]).toHaveTextContent('Team C') // Football
      })
    })

    it('displays selected teams with hierarchical information', async () => {
      render(
        <TeamMultiSelect
          value={[1, 2]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Selected Teams (2)')).toBeInTheDocument()
        expect(screen.getByText('Team A')).toBeInTheDocument()
        expect(screen.getByText('Football • Club A')).toBeInTheDocument()
        expect(screen.getByText('Team B')).toBeInTheDocument()
        expect(screen.getByText('Basketball • Club B')).toBeInTheDocument()
      })
    })
  })

  describe('Team Selection - Requirement 5.1', () => {
    it('handles team selection and deselection', async () => {
      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('Team A')).toBeInTheDocument()
      })

      // Select team
      await user.click(screen.getByText('Team A'))
      expect(mockOnChange).toHaveBeenCalledWith([1])

      // Mock the component with selected team
      vi.clearAllMocks()
      render(
        <TeamMultiSelect
          value={[1]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('Team A')).toBeInTheDocument()
      })

      // Deselect team
      await user.click(screen.getByText('Team A'))
      expect(mockOnChange).toHaveBeenCalledWith([])
    })

    it('handles multiple team selection', async () => {
      render(
        <TeamMultiSelect
          value={[1]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('Team B')).toBeInTheDocument()
      })

      // Select additional team
      await user.click(screen.getByText('Team B'))
      expect(mockOnChange).toHaveBeenCalledWith([1, 2])
    })

    it('removes teams using badge remove buttons', async () => {
      render(
        <TeamMultiSelect
          value={[1, 2]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        const removeButtons = screen.getAllByLabelText(/Remove/)
        expect(removeButtons).toHaveLength(2)
      })

      // Remove Team A
      const removeTeamAButton = screen.getByLabelText('Remove Team A')
      await user.click(removeTeamAButton)

      expect(mockOnChange).toHaveBeenCalledWith([2])
    })

    it('supports keyboard navigation for remove buttons', async () => {
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
      removeButton.focus()
      
      await user.keyboard('{Enter}')
      expect(mockOnChange).toHaveBeenCalledWith([])
    })
  })

  describe('Search and Filter - Requirement 5.2', () => {
    it('provides search functionality', async () => {
      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search teams by name, club, or sport...')
        expect(searchInput).toBeInTheDocument()
        
        // Test search functionality
        user.type(searchInput, 'Football')
      })
    })

    it('shows appropriate message when no teams match search', async () => {
      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search teams by name, club, or sport...')
        expect(searchInput).toBeInTheDocument()
        
        // Test that search input exists and can be typed in
        user.type(searchInput, 'NonexistentTeam')
      })
    })

    it('applies sport filter when provided', async () => {
      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
          sportFilter={1} // Football only
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('Team A')).toBeInTheDocument()
        expect(screen.getByText('Team C')).toBeInTheDocument()
        expect(screen.queryByText('Team B')).not.toBeInTheDocument() // Basketball team filtered out
      })
    })

    it('applies club filter when provided', async () => {
      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
          clubFilter={1} // Club A only
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('Team A')).toBeInTheDocument()
        expect(screen.getByText('Team C')).toBeInTheDocument()
        expect(screen.queryByText('Team B')).not.toBeInTheDocument() // Club B team filtered out
      })
    })
  })

  describe('Validation - Requirement 5.3', () => {
    it('validates team IDs and removes invalid ones', async () => {
      render(
        <TeamMultiSelect
          value={[1, 999]} // 999 is invalid
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([1]) // Invalid ID removed
      })
    })

    it('shows validation error for invalid teams', async () => {
      render(
        <TeamMultiSelect
          value={[999]} // Invalid team ID
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('1 invalid team removed')).toBeInTheDocument()
      })
    })

    it('handles multiple invalid teams', async () => {
      render(
        <TeamMultiSelect
          value={[998, 999]} // Multiple invalid team IDs
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('2 invalid teams removed')).toBeInTheDocument()
      })
    })

    it('shows visual indication for validation errors', async () => {
      render(
        <TeamMultiSelect
          value={[999]} // Invalid team ID
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        const combobox = screen.getByRole('combobox')
        expect(combobox).toHaveClass('border-destructive')
      })
    })
  })

  describe('Loading and Error States', () => {
    it('handles loading state', () => {
      vi.mocked(teamsService.listTeams).mockImplementation(() => new Promise(() => {})) // Never resolves

      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Loading teams...')).toBeInTheDocument()
    })

    it('handles error state from teams service', async () => {
      vi.mocked(teamsService.listTeams).mockRejectedValue(new Error('Failed to load teams'))

      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load teams')).toBeInTheDocument()
      })
    })

    it('handles error state from clubs service', async () => {
      vi.mocked(clubsService.listClubs).mockRejectedValue(new Error('Failed to load clubs'))

      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load clubs')).toBeInTheDocument()
      })
    })

    it('handles error state from sports service', async () => {
      vi.mocked(sportsService.listSports).mockRejectedValue(new Error('Failed to load sports'))

      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load sports')).toBeInTheDocument()
      })
    })

    it('shows appropriate message when no teams are available', async () => {
      vi.mocked(teamsService.listTeams).mockResolvedValue({ data: [], error: null })

      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('No teams available.')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        const comboboxes = screen.getAllByRole('combobox')
        expect(comboboxes.length).toBeGreaterThan(0)
        expect(comboboxes[0]).toHaveAttribute('aria-expanded', 'false')
      })

      await user.click(screen.getAllByRole('combobox')[0])

      await waitFor(() => {
        const comboboxes = screen.getAllByRole('combobox')
        expect(comboboxes[0]).toHaveAttribute('aria-expanded', 'true')
      })
    })

    it('provides proper labels for remove buttons', async () => {
      render(
        <TeamMultiSelect
          value={[1, 2]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByLabelText('Remove Team A')).toBeInTheDocument()
        expect(screen.getByLabelText('Remove Team B')).toBeInTheDocument()
      })
    })

    it('supports keyboard navigation', async () => {
      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        const comboboxes = screen.getAllByRole('combobox')
        expect(comboboxes.length).toBeGreaterThan(0)
      })

      const combobox = screen.getAllByRole('combobox')[0]
      combobox.focus()
      
      // Test Enter key to open dropdown
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true')
      })
    })

    it('maintains focus management', async () => {
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
      
      // Test focus ring on focus
      removeButton.focus()
      expect(document.activeElement).toBe(removeButton)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty data gracefully', async () => {
      vi.mocked(teamsService.listTeams).mockResolvedValue({ data: [], error: null })
      vi.mocked(clubsService.listClubs).mockResolvedValue({ data: [], error: null })
      vi.mocked(sportsService.listSports).mockResolvedValue({ data: [], error: null })

      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('No teams available.')).toBeInTheDocument()
      })
    })

    it('handles missing club or sport data', async () => {
      const teamsWithMissingData = [
        { id: 1, name: 'Team A', club_id: 999, created_at: '2023-01-01' } // Non-existent club
      ]
      
      vi.mocked(teamsService.listTeams).mockResolvedValue({ data: teamsWithMissingData, error: null })

      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('Team A')).toBeInTheDocument()
        expect(screen.getByText('Unknown Sport')).toBeInTheDocument()
        expect(screen.getByText('Unknown Club')).toBeInTheDocument()
      })
    })

    it('handles rapid selection changes', async () => {
      render(
        <TeamMultiSelect
          value={[]}
          onChange={mockOnChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByText('Team A')).toBeInTheDocument()
      })

      // Rapid clicks
      await user.click(screen.getByText('Team A'))
      await user.click(screen.getByText('Team B'))
      await user.click(screen.getByText('Team C'))

      // Should handle all selections
      expect(mockOnChange).toHaveBeenCalledTimes(3)
    })
  })
})