import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import {
  createInvitation,
  listInvitations,
  cancelInvitation,
  getInvitation,
  getTeamDetails,
  type InviteServiceError,
  type InviteServiceResult
} from '../invites'
import type {
  InviteUserRequest,
  InviteUserResponse,
  PendingInvite
} from '@/types/db'

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    },
    functions: {
      invoke: vi.fn()
    },
    from: vi.fn()
  }
}))

// Import the mocked supabase after mocking
const { supabase } = await import('@/lib/supabase')

describe('Invitation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createInvitation', () => {
    const mockRequest: InviteUserRequest = {
      email: 'test@example.com',
      display_name: 'Test User',
      role: 'coach',
      teamIds: [1, 2],
      redirectTo: 'https://example.com/dashboard'
    }

    const mockSession = {
      access_token: 'mock-jwt-token',
      user: { id: 'user-123' }
    }

    const mockSuccessResponse: InviteUserResponse = {
      ok: true,
      action_link: 'https://example.com/invite/abc123'
    }

    it('should successfully create an invitation', async () => {
      // Mock successful session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock successful Edge Function call
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockSuccessResponse,
        error: null
      })

      const result = await createInvitation(mockRequest)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockSuccessResponse)
      expect(supabase.functions.invoke).toHaveBeenCalledWith('invite-user', {
        body: mockRequest,
        headers: {
          Authorization: `Bearer ${mockSession.access_token}`
        }
      })
    })

    it('should handle authentication errors', async () => {
      // Mock session error
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' } as any
      })

      const result = await createInvitation(mockRequest)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Authentication required',
        details: 'Session expired',
        code: 'AUTH_ERROR'
      })
      expect(supabase.functions.invoke).not.toHaveBeenCalled()
    })

    it('should handle missing session', async () => {
      // Mock no session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await createInvitation(mockRequest)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Authentication required',
        details: 'No active session found. Please log in again.',
        code: 'AUTH_ERROR'
      })
    })

    it('should handle Edge Function errors', async () => {
      // Mock successful session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock Edge Function error (without timeout/network keywords)
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Function error' }
      })

      const result = await createInvitation(mockRequest)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Failed to create invitation',
        details: 'Function error',
        code: 'EDGE_FUNCTION_ERROR'
      })
    })

    it('should handle Edge Function returning error response', async () => {
      // Mock successful session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock Edge Function returning error (using 'role' keyword triggers specific logic)
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: false, error: 'Invalid role specified' },
        error: null
      })

      const result = await createInvitation(mockRequest)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Role validation failed',
        details: 'The selected role is invalid.',
        code: 'ROLE_ERROR'
      })
    })

    it('should handle Edge Function returning error response without error message', async () => {
      // Mock successful session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock Edge Function returning error without message
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: false },
        error: null
      })

      const result = await createInvitation(mockRequest)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Failed to create invitation',
        details: 'Unknown error occurred',
        code: 'INVITATION_ERROR'
      })
    })

    it('should handle network failures and unexpected errors', async () => {
      // Mock successful session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock network error
      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('Network error'))

      const result = await createInvitation(mockRequest)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Unexpected error creating invitation',
        details: 'Network error',
        code: 'UNEXPECTED_ERROR'
      })
    })

    it('should handle non-Error exceptions', async () => {
      // Mock successful session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock non-Error exception
      vi.mocked(supabase.functions.invoke).mockRejectedValue('String error')

      const result = await createInvitation(mockRequest)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Unexpected error creating invitation',
        details: 'An unexpected error occurred. Please try again.',
        code: 'UNEXPECTED_ERROR'
      })
    })
  })

  describe('listInvitations', () => {
    const mockInvitations: PendingInvite[] = [
      {
        id: 1,
        email: 'user1@example.com',
        role: 'coach',
        team_ids: [1, 2],
        status: 'pending',
        created_by: 'user-123',
        created_at: '2023-01-01T00:00:00Z'
      },
      {
        id: 2,
        email: 'user2@example.com',
        role: 'admin',
        team_ids: [3],
        status: 'accepted',
        created_by: 'user-123',
        created_at: '2023-01-02T00:00:00Z',
        accepted_at: '2023-01-03T00:00:00Z'
      }
    ]

    let mockQueryBuilder: any

    beforeEach(() => {
      mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis()
      }
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)
    })

    it('should successfully fetch invitations with default options', async () => {
      // Mock the final method in the chain to return the result
      mockQueryBuilder.range.mockResolvedValue({
        data: mockInvitations,
        error: null
      })

      const result = await listInvitations()

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockInvitations)
      expect(supabase.from).toHaveBeenCalledWith('pending_invites')
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*')
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 24)
    })

    it('should apply status filter when provided', async () => {
      // Mock the final method in the chain to return the result
      mockQueryBuilder.eq.mockResolvedValue({
        data: [mockInvitations[0]],
        error: null
      })

      const result = await listInvitations({ status: 'pending' })

      expect(result.error).toBeNull()
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'pending')
    })

    it('should apply email filter when provided', async () => {
      // Mock the final method in the chain to return the result
      mockQueryBuilder.ilike.mockResolvedValue({
        data: [mockInvitations[0]],
        error: null
      })

      const result = await listInvitations({ email: 'user1' })

      expect(result.error).toBeNull()
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('email', '%user1%')
    })

    it('should apply custom pagination', async () => {
      mockQueryBuilder.range.mockResolvedValue({
        data: mockInvitations,
        error: null
      })

      const result = await listInvitations({ from: 10, to: 19 })

      expect(result.error).toBeNull()
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(10, 19)
    })

    it('should apply multiple filters', async () => {
      mockQueryBuilder.ilike.mockResolvedValue({
        data: [mockInvitations[0]],
        error: null
      })

      const result = await listInvitations({
        status: 'pending',
        email: 'user1',
        from: 5,
        to: 14
      })

      expect(result.error).toBeNull()
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'pending')
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('email', '%user1%')
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(5, 14)
    })

    it('should handle database errors', async () => {
      mockQueryBuilder.range.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed', code: 'CONNECTION_ERROR' }
      })

      const result = await listInvitations()

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Failed to fetch invitations',
        details: 'Connection failed',
        code: 'CONNECTION_ERROR'
      })
    })

    it('should handle database errors without code', async () => {
      mockQueryBuilder.range.mockResolvedValue({
        data: null,
        error: { message: 'Unknown database error' }
      })

      const result = await listInvitations()

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Failed to fetch invitations',
        details: 'Unknown database error',
        code: 'DATABASE_ERROR'
      })
    })

    it('should handle null data response', async () => {
      mockQueryBuilder.range.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await listInvitations()

      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    })

    it('should handle unexpected errors', async () => {
      mockQueryBuilder.range.mockRejectedValue(new Error('Unexpected error'))

      const result = await listInvitations()

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Unexpected error fetching invitations',
        details: 'Unexpected error',
        code: 'UNEXPECTED_ERROR'
      })
    })
  })

  describe('cancelInvitation', () => {
    const mockInvitation: PendingInvite = {
      id: 1,
      email: 'user@example.com',
      role: 'coach',
      team_ids: [1, 2],
      status: 'canceled',
      created_by: 'user-123',
      created_at: '2023-01-01T00:00:00Z'
    }

    let mockQueryBuilder: any

    beforeEach(() => {
      mockQueryBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn()
      }
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)
    })

    it('should successfully cancel a pending invitation', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: mockInvitation,
        error: null
      })

      const result = await cancelInvitation(1)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockInvitation)
      expect(supabase.from).toHaveBeenCalledWith('pending_invites')
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ status: 'canceled' })
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1)
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'pending')
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*')
    })

    it('should handle invitation not found', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await cancelInvitation(999)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Invitation not found or cannot be canceled',
        details: 'The invitation may not exist or is not in pending status',
        code: 'NOT_FOUND'
      })
    })

    it('should handle database errors', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied', code: 'PERMISSION_DENIED' }
      })

      const result = await cancelInvitation(1)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Failed to cancel invitation',
        details: 'Permission denied',
        code: 'PERMISSION_DENIED'
      })
    })

    it('should handle database errors without code', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await cancelInvitation(1)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Failed to cancel invitation',
        details: 'Database error',
        code: 'DATABASE_ERROR'
      })
    })

    it('should handle unexpected errors', async () => {
      mockQueryBuilder.single.mockRejectedValue(new Error('Network failure'))

      const result = await cancelInvitation(1)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Unexpected error canceling invitation',
        details: 'Network failure',
        code: 'UNEXPECTED_ERROR'
      })
    })

    it('should handle non-Error exceptions', async () => {
      mockQueryBuilder.single.mockRejectedValue('String error')

      const result = await cancelInvitation(1)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Unexpected error canceling invitation',
        details: 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      })
    })
  })

  describe('getInvitation', () => {
    const mockInvitation: PendingInvite = {
      id: 1,
      email: 'user@example.com',
      role: 'coach',
      team_ids: [1, 2],
      status: 'pending',
      created_by: 'user-123',
      created_at: '2023-01-01T00:00:00Z'
    }

    let mockQueryBuilder: any

    beforeEach(() => {
      mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
      }
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)
    })

    it('should successfully fetch an invitation by ID', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: mockInvitation,
        error: null
      })

      const result = await getInvitation(1)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockInvitation)
      expect(supabase.from).toHaveBeenCalledWith('pending_invites')
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*')
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1)
    })

    it('should handle database errors', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Record not found', code: 'PGRST116' }
      })

      const result = await getInvitation(999)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Failed to fetch invitation',
        details: 'Record not found',
        code: 'PGRST116'
      })
    })

    it('should handle database errors without code', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const result = await getInvitation(1)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Failed to fetch invitation',
        details: 'Database connection failed',
        code: 'DATABASE_ERROR'
      })
    })

    it('should handle unexpected errors', async () => {
      mockQueryBuilder.single.mockRejectedValue(new Error('Timeout'))

      const result = await getInvitation(1)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Unexpected error fetching invitation',
        details: 'Timeout',
        code: 'UNEXPECTED_ERROR'
      })
    })

    it('should handle non-Error exceptions', async () => {
      mockQueryBuilder.single.mockRejectedValue('String error')

      const result = await getInvitation(1)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Unexpected error fetching invitation',
        details: 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      })
    })
  })

  describe('getTeamDetails', () => {
    const mockTeamDetails = [
      {
        id: 1,
        name: 'Team A',
        club_name: 'Club Alpha',
        sport_name: 'Football'
      },
      {
        id: 2,
        name: 'Team B',
        club_name: 'Club Beta',
        sport_name: 'Basketball'
      }
    ]

    const mockDatabaseResponse = [
      {
        id: 1,
        name: 'Team A',
        clubs: {
          name: 'Club Alpha',
          sports: {
            name: 'Football'
          }
        }
      },
      {
        id: 2,
        name: 'Team B',
        clubs: {
          name: 'Club Beta',
          sports: {
            name: 'Basketball'
          }
        }
      }
    ]

    let mockQueryBuilder: any

    beforeEach(() => {
      mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn()
      }
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)
    })

    it('should successfully fetch team details', async () => {
      mockQueryBuilder.in.mockResolvedValue({
        data: mockDatabaseResponse,
        error: null
      })

      const result = await getTeamDetails([1, 2])

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockTeamDetails)
      expect(supabase.from).toHaveBeenCalledWith('teams')
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(`
        id,
        name,
        clubs!inner(
          name,
          sports!inner(
            name
          )
        )
      `)
      expect(mockQueryBuilder.in).toHaveBeenCalledWith('id', [1, 2])
    })

    it('should handle empty team IDs array', async () => {
      const result = await getTeamDetails([])

      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('should handle null data response', async () => {
      mockQueryBuilder.in.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await getTeamDetails([1, 2])

      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    })

    it('should transform database response correctly', async () => {
      const singleTeamResponse = [{
        id: 3,
        name: 'Team C',
        clubs: {
          name: 'Club Gamma',
          sports: {
            name: 'Tennis'
          }
        }
      }]

      mockQueryBuilder.in.mockResolvedValue({
        data: singleTeamResponse,
        error: null
      })

      const result = await getTeamDetails([3])

      expect(result.error).toBeNull()
      expect(result.data).toEqual([{
        id: 3,
        name: 'Team C',
        club_name: 'Club Gamma',
        sport_name: 'Tennis'
      }])
    })

    it('should handle database errors', async () => {
      mockQueryBuilder.in.mockResolvedValue({
        data: null,
        error: { message: 'Foreign key constraint failed', code: 'FOREIGN_KEY_VIOLATION' }
      })

      const result = await getTeamDetails([1, 2])

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Failed to fetch team details',
        details: 'Foreign key constraint failed',
        code: 'FOREIGN_KEY_VIOLATION'
      })
    })

    it('should handle database errors without code', async () => {
      mockQueryBuilder.in.mockResolvedValue({
        data: null,
        error: { message: 'Query timeout' }
      })

      const result = await getTeamDetails([1, 2])

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Failed to fetch team details',
        details: 'Query timeout',
        code: 'DATABASE_ERROR'
      })
    })

    it('should handle unexpected errors', async () => {
      mockQueryBuilder.in.mockRejectedValue(new Error('Connection lost'))

      const result = await getTeamDetails([1, 2])

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Unexpected error fetching team details',
        details: 'Connection lost',
        code: 'UNEXPECTED_ERROR'
      })
    })

    it('should handle non-Error exceptions', async () => {
      mockQueryBuilder.in.mockRejectedValue('String error')

      const result = await getTeamDetails([1, 2])

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Unexpected error fetching team details',
        details: 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      })
    })

    it('should handle malformed database response', async () => {
      const malformedResponse = [{
        id: 1,
        name: 'Team A',
        clubs: null // Null clubs property
      }]

      mockQueryBuilder.in.mockResolvedValue({
        data: malformedResponse,
        error: null
      })

      // This should not throw an error but handle gracefully
      const result = await getTeamDetails([1])

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('UNEXPECTED_ERROR')
    })
  })

  describe('Error handling edge cases', () => {
    it('should handle service functions with invalid input types', async () => {
      // Test with invalid invitation ID type
      const result = await cancelInvitation(null as any)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('UNEXPECTED_ERROR')
    })

    it('should handle service functions with undefined parameters', async () => {
      const result = await createInvitation(undefined as any)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('UNEXPECTED_ERROR')
    })
  })

  describe('Data transformation and validation', () => {
    it('should preserve invitation data structure in createInvitation', async () => {
      const mockSession = {
        access_token: 'mock-jwt-token',
        user: { id: 'user-123' }
      }

      const mockResponse: InviteUserResponse = {
        ok: true,
        action_link: 'https://example.com/invite/abc123'
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null
      })

      const request: InviteUserRequest = {
        email: 'test@example.com',
        role: 'coach',
        teamIds: [1, 2, 3]
      }

      const result = await createInvitation(request)

      expect(result.data).toEqual(mockResponse)
      expect(result.data?.ok).toBe(true)
      expect(result.data?.action_link).toBe('https://example.com/invite/abc123')
    })

    it('should handle invitation data with all optional fields', async () => {
      const mockSession = {
        access_token: 'mock-jwt-token',
        user: { id: 'user-123' }
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: true, action_link: 'https://example.com/invite/xyz789' },
        error: null
      })

      const requestWithAllFields: InviteUserRequest = {
        email: 'full@example.com',
        display_name: 'Full Name',
        role: 'admin',
        teamIds: [1, 2, 3, 4, 5],
        redirectTo: 'https://custom-redirect.com/dashboard'
      }

      const result = await createInvitation(requestWithAllFields)

      expect(result.error).toBeNull()
      expect(supabase.functions.invoke).toHaveBeenCalledWith('invite-user', {
        body: requestWithAllFields,
        headers: {
          Authorization: `Bearer ${mockSession.access_token}`
        }
      })
    })

    it('should validate team details transformation with nested data', async () => {
      const complexDatabaseResponse = [
        {
          id: 1,
          name: 'Team Alpha',
          clubs: {
            name: 'Elite Sports Club',
            sports: {
              name: 'Professional Football'
            }
          }
        }
      ]

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: complexDatabaseResponse,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any)

      const result = await getTeamDetails([1])

      expect(result.error).toBeNull()
      expect(result.data).toEqual([{
        id: 1,
        name: 'Team Alpha',
        club_name: 'Elite Sports Club',
        sport_name: 'Professional Football'
      }])
    })
  })
})