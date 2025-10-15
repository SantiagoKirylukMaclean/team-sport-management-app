import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import InviteUserPage from '../InviteUserPage'
import * as invitesService from '@/services/invites'
import * as teamsService from '@/services/teams'
import * as clubsService from '@/services/clubs'
import * as sportsService from '@/services/sports'

// Mock the services
vi.mock('@/services/invites')
vi.mock('@/services/teams')
vi.mock('@/services/clubs')
vi.mock('@/services/sports')

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}))

// Mock the page title hook
vi.mock('@/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}))

// Mock data
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

const mockSuccessResponse = {
  data: {
    ok: true,
    action_link: 'https://example.com/invite/abc123'
  },
  error: null
}

const mockErrorResponse = {
  data: null,
  error: {
    message: 'Failed to create invitation',
    details: 'Invalid email address',
    code: 'VALIDATION_ERROR'
  }
}

describe('InviteUserPage', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default successful mock responses
    vi.mocked(teamsService.listTeams).mockResolvedValue({ data: mockTeams, error: null })
    vi.mocked(clubsService.listClubs).mockResolvedValue({ data: mockClubs, error: null })
    vi.mocked(sportsService.listSports).mockResolvedValue({ data: mockSports, error: null })
    vi.mocked(invitesService.createInvitation).mockResolvedValue(mockSuccessResponse)
  })

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <InviteUserPage />
      </MemoryRouter>
    )
  }

  describe('Form Rendering', () => {
    it('renders the invitation form with all required fields', () => {
      renderComponent()

      expect(screen.getByText('Invite User')).toBeInTheDocument()
      expect(screen.getByText('Invite coaches and admins to join teams')).toBeInTheDocument()
      expect(screen.getByText('Create Invitation')).toBeInTheDocument()
      
      // Check form fields
      expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Display Name/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Role/)).toBeInTheDocument()
      expect(screen.getByText(/Teams \*/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Redirect URL/)).toBeInTheDocument()
      
      // Check buttons
      expect(screen.getByRole('button', { name: /Create Invitation/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Reset/ })).toBeInTheDocument()
    })

    it('displays field descriptions and help text', () => {
      renderComponent()

      expect(screen.getByText('The email address of the person you want to invite')).toBeInTheDocument()
      expect(screen.getByText('Optional display name for the user')).toBeInTheDocument()
      expect(screen.getByText('The role that will be assigned to the user')).toBeInTheDocument()
      expect(screen.getByText('Select one or more teams that the user will be assigned to')).toBeInTheDocument()
      expect(screen.getByText('Optional URL to redirect the user after they complete registration')).toBeInTheDocument()
    })

    it('displays information card with instructions', () => {
      renderComponent()

      expect(screen.getByText('How it works:')).toBeInTheDocument()
      expect(screen.getByText(/The system generates a one-time recovery link/)).toBeInTheDocument()
      expect(screen.getByText(/Share this link through any communication channel/)).toBeInTheDocument()
      expect(screen.getByText(/When clicked, the invitee sets their password/)).toBeInTheDocument()
      expect(screen.getByText(/They are automatically assigned to the selected teams/)).toBeInTheDocument()
    })
  })

  describe('Form Validation - Requirements 1.1, 1.2', () => {
    it('validates required email field', async () => {
      renderComponent()

      const submitButton = screen.getByRole('button', { name: /Create Invitation/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      renderComponent()

      const emailInput = screen.getByLabelText(/Email Address/)
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /Create Invitation/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
    })

    it('validates required role selection', async () => {
      renderComponent()

      const emailInput = screen.getByLabelText(/Email Address/)
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: /Create Invitation/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please select a role')).toBeInTheDocument()
      })
    })

    it('validates display name length constraints', async () => {
      renderComponent()

      const displayNameInput = screen.getByLabelText(/Display Name/)
      await user.type(displayNameInput, 'a') // Too short

      const submitButton = screen.getByRole('button', { name: /Create Invitation/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Display name must be at least 2 characters')).toBeInTheDocument()
      })

      // Test max length
      await user.clear(displayNameInput)
      await user.type(displayNameInput, 'a'.repeat(101)) // Too long

      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Display name must be less than 100 characters')).toBeInTheDocument()
      })
    })

    it('validates redirect URL format when provided', async () => {
      renderComponent()

      const redirectInput = screen.getByLabelText(/Redirect URL/)
      await user.type(redirectInput, 'invalid-url')

      const submitButton = screen.getByRole('button', { name: /Create Invitation/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument()
      })
    })

    it('accepts valid form data', async () => {
      renderComponent()

      // Fill in valid data
      const emailInput = screen.getByLabelText(/Email Address/)
      await user.type(emailInput, 'test@example.com')

      const displayNameInput = screen.getByLabelText(/Display Name/)
      await user.type(displayNameInput, 'Test User')

      // Select role
      const roleSelect = screen.getByRole('combobox', { name: /Role/ })
      await user.click(roleSelect)
      await waitFor(() => {
        const coachOption = screen.getByText('Coach')
        expect(coachOption).toBeInTheDocument()
      })
      await user.click(screen.getByText('Coach'))

      const redirectInput = screen.getByLabelText(/Redirect URL/)
      await user.type(redirectInput, 'https://example.com/dashboard')

      // Wait for teams to load and select a team
      await waitFor(() => {
        const teamsButton = screen.getByText(/Select teams/)
        expect(teamsButton).toBeInTheDocument()
      })

      const teamsButton = screen.getByText(/Select teams/)
      await user.click(teamsButton)

      await waitFor(() => {
        const teamOption = screen.getByText('Team A')
        expect(teamOption).toBeInTheDocument()
      })
      await user.click(screen.getByText('Team A'))

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create Invitation/ })
      await user.click(submitButton)

      // Should call the service with correct data
      await waitFor(() => {
        expect(invitesService.createInvitation).toHaveBeenCalledWith({
          email: 'test@example.com',
          display_name: 'Test User',
          role: 'coach',
          teamIds: [1],
          redirectTo: 'https://example.com/dashboard'
        })
      })
    })
  })

  describe('Form Submission - Requirements 1.3, 1.4', () => {
    it('shows loading state during submission', async () => {
      // Mock a delayed response
      vi.mocked(invitesService.createInvitation).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockSuccessResponse), 100))
      )

      renderComponent()

      // Fill in minimal valid data
      const emailInput = screen.getByLabelText(/Email Address/)
      await user.type(emailInput, 'test@example.com')

      const roleSelect = screen.getByRole('combobox', { name: /Role/ })
      await user.click(roleSelect)
      await user.click(screen.getByText('Coach'))

      // Wait for teams to load and select a team
      await waitFor(() => {
        const teamsCombobox = screen.getByRole('combobox', { name: /Teams/ })
        expect(teamsCombobox).toBeInTheDocument()
      })

      const teamsCombobox = screen.getByRole('combobox', { name: /Teams/ })
      await user.click(teamsCombobox)
      await user.click(screen.getByText('Team A'))

      const submitButton = screen.getByRole('button', { name: /Create Invitation/ })
      await user.click(submitButton)

      // Check loading state
      expect(screen.getByText('Creating Invitation...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Creating Invitation...')).not.toBeInTheDocument()
      })
    })

    it('displays success result after successful submission', async () => {
      renderComponent()

      // Fill and submit form
      await fillAndSubmitForm()

      // Should show success result
      await waitFor(() => {
        expect(screen.getByText('Invitation Created Successfully')).toBeInTheDocument()
        expect(screen.getByDisplayValue('https://example.com/invite/abc123')).toBeInTheDocument()
      })
    })

    it('displays error message on submission failure', async () => {
      vi.mocked(invitesService.createInvitation).mockResolvedValue(mockErrorResponse)

      renderComponent()

      await fillAndSubmitForm()

      await waitFor(() => {
        expect(screen.getByText('Invitation Failed')).toBeInTheDocument()
        expect(screen.getByText('Failed to create invitation')).toBeInTheDocument()
      })
    })

    it('handles different error types with appropriate messages', async () => {
      const authError = {
        data: null,
        error: { message: 'Authentication failed', code: 'AUTH_ERROR' }
      }
      vi.mocked(invitesService.createInvitation).mockResolvedValue(authError)

      renderComponent()
      await fillAndSubmitForm()

      await waitFor(() => {
        expect(screen.getByText('You are not authorized to create invitations.')).toBeInTheDocument()
      })
    })

    it('trims whitespace from form inputs', async () => {
      renderComponent()

      const emailInput = screen.getByLabelText(/Email Address/)
      await user.type(emailInput, '  test@example.com  ')

      const displayNameInput = screen.getByLabelText(/Display Name/)
      await user.type(displayNameInput, '  Test User  ')

      const redirectInput = screen.getByLabelText(/Redirect URL/)
      await user.type(redirectInput, '  https://example.com/dashboard  ')

      // Complete form and submit
      const roleSelect = screen.getByRole('combobox', { name: /Role/ })
      await user.click(roleSelect)
      await user.click(screen.getByText('Coach'))

      await waitFor(() => {
        const teamsButton = screen.getByText(/Select teams/)
        expect(teamsButton).toBeInTheDocument()
      })

      const teamsButton = screen.getByText(/Select teams/)
      await user.click(teamsButton)
      
      await waitFor(() => {
        expect(screen.getByText('Team A')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Team A'))

      const submitButton = screen.getByRole('button', { name: /Create Invitation/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(invitesService.createInvitation).toHaveBeenCalledWith({
          email: 'test@example.com',
          display_name: 'Test User',
          role: 'coach',
          teamIds: [1],
          redirectTo: 'https://example.com/dashboard'
        })
      })
    })
  })

  describe('Form Reset and Navigation', () => {
    it('resets form when reset button is clicked', async () => {
      renderComponent()

      // Fill in some data
      const emailInput = screen.getByLabelText(/Email Address/)
      await user.type(emailInput, 'test@example.com')

      const displayNameInput = screen.getByLabelText(/Display Name/)
      await user.type(displayNameInput, 'Test User')

      // Reset form
      const resetButton = screen.getByRole('button', { name: /Reset/ })
      await user.click(resetButton)

      // Check that fields are cleared
      expect(emailInput).toHaveValue('')
      expect(displayNameInput).toHaveValue('')
    })

    it('allows creating another invitation after success', async () => {
      renderComponent()

      await fillAndSubmitForm()

      // Should show success result
      await waitFor(() => {
        expect(screen.getByText('Create Another Invitation')).toBeInTheDocument()
      })

      // Click to create another
      const createAnotherButton = screen.getByText('Create Another Invitation')
      await user.click(createAnotherButton)

      // Should return to form
      await waitFor(() => {
        expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Create Invitation/ })).toBeInTheDocument()
      })
    })

    it('allows trying again after error', async () => {
      vi.mocked(invitesService.createInvitation).mockResolvedValue(mockErrorResponse)

      renderComponent()
      await fillAndSubmitForm()

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })

      const tryAgainButton = screen.getByText('Try Again')
      await user.click(tryAgainButton)

      // Should return to form
      await waitFor(() => {
        expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility - Requirement 6.1', () => {
    it('has proper form labels and descriptions', () => {
      renderComponent()

      // Check that all form fields have proper labels
      expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Display Name/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Role/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Redirect URL/)).toBeInTheDocument()

      // Check that required fields are marked
      expect(screen.getByText('Email Address *')).toBeInTheDocument()
      expect(screen.getByText('Role *')).toBeInTheDocument()
      expect(screen.getByText('Teams *')).toBeInTheDocument()
    })

    it('has proper button labels and states', async () => {
      renderComponent()

      const submitButton = screen.getByRole('button', { name: /Create Invitation/ })
      const resetButton = screen.getByRole('button', { name: /Reset/ })

      expect(submitButton).toBeInTheDocument()
      expect(resetButton).toBeInTheDocument()

      // Check disabled state during submission
      vi.mocked(invitesService.createInvitation).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockSuccessResponse), 100))
      )

      await fillAndSubmitForm()

      expect(submitButton).toBeDisabled()
      expect(resetButton).toBeDisabled()
    })

    it('provides proper error announcements', async () => {
      renderComponent()

      const submitButton = screen.getByRole('button', { name: /Create Invitation/ })
      await user.click(submitButton)

      await waitFor(() => {
        // Error messages should be associated with form fields
        const emailError = screen.getByText('Please enter a valid email address')
        expect(emailError).toBeInTheDocument()
        
        const roleError = screen.getByText('Please select a role')
        expect(roleError).toBeInTheDocument()
      })
    })

    it('supports keyboard navigation', async () => {
      renderComponent()

      const emailInput = screen.getByLabelText(/Email Address/)
      const displayNameInput = screen.getByLabelText(/Display Name/)
      const roleSelect = screen.getByRole('combobox')
      const redirectInput = screen.getByLabelText(/Redirect URL/)
      const resetButton = screen.getByRole('button', { name: /Reset/ })
      const submitButton = screen.getByRole('button', { name: /Create Invitation/ })

      // Test tab navigation
      emailInput.focus()
      expect(document.activeElement).toBe(emailInput)

      await user.tab()
      expect(document.activeElement).toBe(displayNameInput)

      await user.tab()
      expect(document.activeElement).toBe(roleSelect)

      // Skip teams component for now as it's complex

      await user.tab()
      await user.tab() // Skip teams
      expect(document.activeElement).toBe(redirectInput)

      await user.tab()
      expect(document.activeElement).toBe(resetButton)

      await user.tab()
      expect(document.activeElement).toBe(submitButton)
    })
  })

  // Helper function to fill and submit form with valid data
  async function fillAndSubmitForm() {
    const emailInput = screen.getByLabelText(/Email Address/)
    await user.type(emailInput, 'test@example.com')

    const roleSelect = screen.getByRole('combobox')
    await user.click(roleSelect)
    await waitFor(() => {
      expect(screen.getByText('Coach')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Coach'))

    // Wait for teams component to load
    await waitFor(() => {
      const teamsButton = screen.getByText(/Select teams/)
      expect(teamsButton).toBeInTheDocument()
    })

    const teamsButton = screen.getByText(/Select teams/)
    await user.click(teamsButton)
    
    await waitFor(() => {
      expect(screen.getByText('Team A')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Team A'))

    const submitButton = screen.getByRole('button', { name: /Create Invitation/ })
    await user.click(submitButton)
  }
})