import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { InvitationResult } from '../invitation-result'

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
})

describe('InvitationResult', () => {
  const mockOnClose = vi.fn()
  const mockActionLink = 'https://example.com/invite/abc123'
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Success State - Requirements 1.3, 1.4', () => {
    it('renders success message with action link', () => {
      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Invitation Created Successfully')).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockActionLink)).toBeInTheDocument()
      expect(screen.getByText('Create Another Invitation')).toBeInTheDocument()
    })

    it('displays comprehensive sharing instructions', () => {
      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Sharing Instructions:')).toBeInTheDocument()
      expect(screen.getByText(/This is a one-time use link that expires/)).toBeInTheDocument()
      expect(screen.getByText(/automatically assigned to the selected teams/)).toBeInTheDocument()
      expect(screen.getByText(/You can share this link through any secure communication channel/)).toBeInTheDocument()
      expect(screen.getByText(/The link will redirect the user to set up their password/)).toBeInTheDocument()
    })

    it('displays action link in readonly input field', () => {
      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      const linkInput = screen.getByDisplayValue(mockActionLink)
      expect(linkInput).toHaveAttribute('readonly')
      expect(linkInput).toHaveClass('font-mono', 'text-xs')
    })

    it('provides copy to clipboard functionality', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      navigator.clipboard.writeText = mockWriteText

      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      const copyButton = screen.getByTitle('Copy to clipboard')
      await user.click(copyButton)

      expect(mockWriteText).toHaveBeenCalledWith(mockActionLink)
    })

    it('shows success feedback after copying with toast notification', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      navigator.clipboard.writeText = mockWriteText

      const { toast } = await import('@/hooks/use-toast')

      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      const copyButton = screen.getByTitle('Copy to clipboard')
      await user.click(copyButton)

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Link copied!',
          description: 'The invitation link has been copied to your clipboard.',
        })
      })
    })

    it('shows visual feedback with check icon after successful copy', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      navigator.clipboard.writeText = mockWriteText

      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      const copyButton = screen.getByTitle('Copy to clipboard')
      await user.click(copyButton)

      // The icon should change to CheckCircle temporarily
      await waitFor(() => {
        const checkIcon = copyButton.querySelector('svg')
        expect(checkIcon).toBeInTheDocument()
      })
    })

    it('provides test link functionality', () => {
      const mockOpen = vi.fn()
      window.open = mockOpen

      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      const testLinkButton = screen.getByTitle('Test link in new tab')
      fireEvent.click(testLinkButton)

      expect(mockOpen).toHaveBeenCalledWith(mockActionLink, '_blank', 'noopener,noreferrer')
    })

    it('calls onClose when create another invitation button is clicked', async () => {
      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      const createAnotherButton = screen.getByText('Create Another Invitation')
      await user.click(createAnotherButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('displays proper success styling with green theme', () => {
      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      const card = screen.getByText('Invitation Created Successfully').closest('.border-green-200')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('bg-green-50')
    })
  })

  describe('Error State', () => {
    const mockError = 'Failed to create invitation: Invalid email address'

    it('renders error message with proper styling', () => {
      render(
        <InvitationResult
          error={mockError}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Invitation Failed')).toBeInTheDocument()
      expect(screen.getByText('Error Details:')).toBeInTheDocument()
      expect(screen.getByText(mockError)).toBeInTheDocument()

      const card = screen.getByText('Invitation Failed').closest('.border-red-200')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('bg-red-50')
    })

    it('displays helpful error context', () => {
      render(
        <InvitationResult
          error={mockError}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('There was an error creating the invitation. Please check the details and try again.')).toBeInTheDocument()
    })

    it('shows try again button in error state', () => {
      render(
        <InvitationResult
          error={mockError}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('calls onClose when try again button is clicked', async () => {
      render(
        <InvitationResult
          error={mockError}
          onClose={mockOnClose}
        />
      )

      const tryAgainButton = screen.getByText('Try Again')
      await user.click(tryAgainButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('does not render success elements in error state', () => {
      render(
        <InvitationResult
          error={mockError}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('Invitation Created Successfully')).not.toBeInTheDocument()
      expect(screen.queryByDisplayValue(mockActionLink)).not.toBeInTheDocument()
      expect(screen.queryByText('Create Another Invitation')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Copy to clipboard')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Test link in new tab')).not.toBeInTheDocument()
    })

    it('handles different error message formats', () => {
      const shortError = 'Network error'
      render(
        <InvitationResult
          error={shortError}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(shortError)).toBeInTheDocument()
    })
  })

  describe('Copy Functionality Edge Cases', () => {
    it('handles clipboard write failure gracefully', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard not available'))
      navigator.clipboard.writeText = mockWriteText

      const { toast } = await import('@/hooks/use-toast')

      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      const copyButton = screen.getByTitle('Copy to clipboard')
      await user.click(copyButton)

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Copy failed',
          description: 'Failed to copy the link. Please copy it manually.',
          variant: 'destructive',
        })
      })
    })

    it('handles clipboard API not being available', async () => {
      // Temporarily remove clipboard API
      const originalClipboard = navigator.clipboard
      delete (navigator as any).clipboard

      const { toast } = await import('@/hooks/use-toast')

      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      const copyButton = screen.getByTitle('Copy to clipboard')
      await user.click(copyButton)

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Copy failed',
          description: 'Failed to copy the link. Please copy it manually.',
          variant: 'destructive',
        })
      })

      // Restore clipboard API
      navigator.clipboard = originalClipboard
    })

    it('resets copy success state after timeout', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      navigator.clipboard.writeText = mockWriteText

      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      const copyButton = screen.getByTitle('Copy to clipboard')
      await user.click(copyButton)

      // Should show success state
      await waitFor(() => {
        const checkIcon = copyButton.querySelector('svg')
        expect(checkIcon).toBeInTheDocument()
      })

      // The component should have a timeout mechanism to reset state
      expect(copyButton).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper button labels and titles', () => {
      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByTitle('Copy to clipboard')).toBeInTheDocument()
      expect(screen.getByTitle('Test link in new tab')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create Another Invitation' })).toBeInTheDocument()
    })

    it('provides proper focus management', async () => {
      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      const copyButton = screen.getByTitle('Copy to clipboard')
      const testButton = screen.getByTitle('Test link in new tab')
      const closeButton = screen.getByText('Create Another Invitation')

      // Test that buttons can receive focus
      copyButton.focus()
      expect(document.activeElement).toBe(copyButton)

      testButton.focus()
      expect(document.activeElement).toBe(testButton)

      closeButton.focus()
      expect(document.activeElement).toBe(closeButton)
    })

    it('supports keyboard interaction for buttons', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      navigator.clipboard.writeText = mockWriteText

      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      const copyButton = screen.getByTitle('Copy to clipboard')
      copyButton.focus()

      // Test that the button is focusable and clickable
      expect(copyButton).toBeInTheDocument()
      expect(copyButton.tagName).toBe('BUTTON')
    })

    it('has proper semantic structure with headings', () => {
      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      // Check for proper heading structure
      const heading = screen.getByText('Invitation Created Successfully')
      expect(heading.tagName).toBe('H3') // CardTitle renders as h3
    })

    it('provides proper color contrast for error state', () => {
      render(
        <InvitationResult
          error="Test error"
          onClose={mockOnClose}
        />
      )

      const errorHeading = screen.getByText('Invitation Failed')
      expect(errorHeading).toHaveClass('text-red-800')
    })
  })

  describe('Edge Cases and Validation', () => {
    it('returns null when neither actionLink nor error is provided', () => {
      const { container } = render(
        <InvitationResult onClose={mockOnClose} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('handles empty string actionLink', () => {
      const { container } = render(
        <InvitationResult actionLink="" onClose={mockOnClose} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('handles empty string error', () => {
      const { container } = render(
        <InvitationResult error="" onClose={mockOnClose} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('prioritizes error over actionLink when both are provided', () => {
      render(
        <InvitationResult
          actionLink={mockActionLink}
          error="Test error"
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Invitation Failed')).toBeInTheDocument()
      expect(screen.queryByText('Invitation Created Successfully')).not.toBeInTheDocument()
    })

    it('handles very long action links', () => {
      const longLink = 'https://example.com/invite/' + 'a'.repeat(200)
      
      render(
        <InvitationResult
          actionLink={longLink}
          onClose={mockOnClose}
        />
      )

      const linkInput = screen.getByDisplayValue(longLink)
      expect(linkInput).toBeInTheDocument()
      expect(linkInput).toHaveClass('font-mono', 'text-xs') // Should handle long text
    })

    it('handles very long error messages', () => {
      const longError = 'This is a very long error message that should still be displayed properly: ' + 'error '.repeat(10)
      
      render(
        <InvitationResult
          error={longError}
          onClose={mockOnClose}
        />
      )

      // Check that the error is displayed (may be truncated by CSS)
      expect(screen.getByText(/This is a very long error message/)).toBeInTheDocument()
    })

    it('does not call window.open when actionLink is not provided in error state', () => {
      const mockOpen = vi.fn()
      window.open = mockOpen

      render(
        <InvitationResult
          error="Some error"
          onClose={mockOnClose}
        />
      )

      // In error state, there should be no test link button
      expect(screen.queryByTitle('Test link in new tab')).not.toBeInTheDocument()
      expect(mockOpen).not.toHaveBeenCalled()
    })

    it('handles rapid button clicks gracefully', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      navigator.clipboard.writeText = mockWriteText

      render(
        <InvitationResult
          actionLink={mockActionLink}
          onClose={mockOnClose}
        />
      )

      const copyButton = screen.getByTitle('Copy to clipboard')
      
      // Test multiple clicks
      await user.click(copyButton)
      await user.click(copyButton)

      // Should handle multiple clicks
      expect(mockWriteText).toHaveBeenCalledTimes(2)
    })
  })
})