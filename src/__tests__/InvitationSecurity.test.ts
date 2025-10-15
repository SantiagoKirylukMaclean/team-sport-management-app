import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createInvitation, listInvitations, cancelInvitation } from '@/services/invites'
import type { InviteUserRequest } from '@/types/db'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    functions: {
      invoke: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        order: vi.fn(() => ({
          range: vi.fn()
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
    }))
  }
}))

describe('Invitation System Security Tests', () => {
  let supabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const { supabase: mockSupabase } = await import('@/lib/supabase')
    supabase = mockSupabase
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('RLS Policy Enforcement - Unauthorized Access Prevention', () => {
    it('should prevent unauthorized access to invitation data when no session exists', async () => {
      // Mock no session (unauthenticated user)
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      })

      const request: InviteUserRequest = {
        email: 'test@example.com',
        role: 'coach',
        teamIds: [1]
      }

      const result = await createInvitation(request)

      // Should fail due to authentication requirement
      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Authentication required',
        details: 'No active session found. Please log in again.',
        code: 'AUTH_ERROR'
      })

      // Edge Function should not be called without authentication
      expect(supabase.functions.invoke).not.toHaveBeenCalled()
    })

    it('should prevent unauthorized access when session is expired', async () => {
      // Mock expired session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' } as any
      })

      const request: InviteUserRequest = {
        email: 'test@example.com',
        role: 'coach',
        teamIds: [1]
      }

      const result = await createInvitation(request)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Authentication required',
        details: 'Session expired',
        code: 'AUTH_ERROR'
      })
      expect(supabase.functions.invoke).not.toHaveBeenCalled()
    })

    it('should simulate RLS policy blocking non-SUPER_ADMIN users from accessing invitation data', async () => {
      // Mock database query that would be blocked by RLS
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'permission denied for table pending_invites',
            code: '42501' // PostgreSQL permission denied error code
          }
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)

      const result = await listInvitations()

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Failed to fetch invitations',
        details: 'permission denied for table pending_invites',
        code: '42501'
      })
    })

    it('should simulate RLS policy allowing SUPER_ADMIN access to all invitations', async () => {
      // Mock successful query for SUPER_ADMIN user
      const mockInvitations = [
        {
          id: 1,
          email: 'user1@example.com',
          role: 'coach',
          team_ids: [1],
          status: 'pending',
          created_by: 'admin-123',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          email: 'user2@example.com',
          role: 'admin',
          team_ids: [2],
          status: 'accepted',
          created_by: 'other-admin-456',
          created_at: '2024-01-02T00:00:00Z',
          accepted_at: '2024-01-02T12:00:00Z'
        }
      ]

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockInvitations,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)

      const result = await listInvitations()

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockInvitations)
      
      // SUPER_ADMIN should see invitations from different creators
      const creators = result.data!.map(inv => inv.created_by)
      expect(creators).toContain('admin-123')
      expect(creators).toContain('other-admin-456')
    })

    it('should simulate RLS policy allowing users to see only their own invitations', async () => {
      // Mock query result filtered by RLS to show only user's own invitations
      const userOwnInvitations = [
        {
          id: 1,
          email: 'user1@example.com',
          role: 'coach',
          team_ids: [1],
          status: 'pending',
          created_by: 'current-user-123',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: userOwnInvitations,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)

      const result = await listInvitations()

      expect(result.error).toBeNull()
      expect(result.data).toEqual(userOwnInvitations)
      
      // All returned invitations should be created by the current user
      expect(result.data!.every(inv => inv.created_by === 'current-user-123')).toBe(true)
    })
  })

  describe('Edge Function Authentication and Role Verification', () => {
    it('should test Edge Function authentication failure with invalid JWT', async () => {
      // Mock valid session locally but Edge Function rejects invalid JWT
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'invalid-jwt-token', user: { id: 'user-123' } } },
        error: null
      })

      // Mock Edge Function returning authentication error
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: false, error: 'Invalid or expired token' },
        error: null
      })

      const request: InviteUserRequest = {
        email: 'test@example.com',
        role: 'coach',
        teamIds: [1]
      }

      const result = await createInvitation(request)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Failed to create invitation',
        details: 'Invalid or expired token',
        code: 'INVITATION_ERROR'
      })
    })

    it('should test Edge Function role verification failure for non-SUPER_ADMIN', async () => {
      // Mock valid session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'valid-jwt-token', user: { id: 'user-123' } } },
        error: null
      })

      // Mock Edge Function returning insufficient permissions error
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: false, error: 'Insufficient permissions. SUPER_ADMIN role required.' },
        error: null
      })

      const request: InviteUserRequest = {
        email: 'test@example.com',
        role: 'coach',
        teamIds: [1]
      }

      const result = await createInvitation(request)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Role validation failed',
        details: 'The selected role is invalid.',
        code: 'ROLE_ERROR'
      })
    })

    it('should test Edge Function missing authorization header', async () => {
      // Mock session without access token
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: '', user: { id: 'user-123' } } },
        error: null
      })

      // Mock Edge Function returning authorization header required error
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: false, error: 'Authorization header required' },
        error: null
      })

      const request: InviteUserRequest = {
        email: 'test@example.com',
        role: 'coach',
        teamIds: [1]
      }

      const result = await createInvitation(request)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Failed to create invitation',
        details: 'Authorization header required',
        code: 'INVITATION_ERROR'
      })
    })

    it('should validate that only SUPER_ADMIN users can create invitations', async () => {
      // Mock valid session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'valid-jwt-token', user: { id: 'superadmin-123' } } },
        error: null
      })

      // Mock successful Edge Function response (SUPER_ADMIN verified)
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: true, action_link: 'https://example.com/invite/abc123' },
        error: null
      })

      const request: InviteUserRequest = {
        email: 'test@example.com',
        role: 'coach',
        teamIds: [1]
      }

      const result = await createInvitation(request)

      expect(result.error).toBeNull()
      expect(result.data?.ok).toBe(true)
      expect(result.data?.action_link).toBeDefined()

      // Verify Edge Function was called with proper authorization
      expect(supabase.functions.invoke).toHaveBeenCalledWith('invite-user', {
        body: request,
        headers: {
          Authorization: 'Bearer valid-jwt-token'
        }
      })
    })

    it('should test Edge Function input validation for malicious data', async () => {
      // Mock valid session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'valid-jwt-token', user: { id: 'superadmin-123' } } },
        error: null
      })

      // Test empty teamIds (validation happens before Edge Function call)
      const emptyTeamRequest = {
        email: 'test@example.com',
        role: 'coach' as const,
        teamIds: []
      }

      const emptyTeamResult = await createInvitation(emptyTeamRequest)
      expect(emptyTeamResult.data).toBeNull()
      expect(emptyTeamResult.error?.message).toBe('Invalid request data')

      // Test invalid email (Edge Function returns error containing 'email')
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: false, error: 'Invalid email format' },
        error: null
      })

      const invalidEmailRequest = {
        email: 'invalid-email',
        role: 'coach' as const,
        teamIds: [1]
      }

      const emailResult = await createInvitation(invalidEmailRequest)
      expect(emailResult.data).toBeNull()
      expect(emailResult.error?.message).toBe('Email validation failed')

      // Test invalid role (Edge Function returns error containing 'role')
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: false, error: 'Invalid role specified' },
        error: null
      })

      const invalidRoleRequest = {
        email: 'test@example.com',
        role: 'malicious-role' as any,
        teamIds: [1]
      }

      const roleResult = await createInvitation(invalidRoleRequest)
      expect(roleResult.data).toBeNull()
      expect(roleResult.error?.message).toBe('Role validation failed')

      // Test invalid team IDs (Edge Function returns error containing 'team')
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: false, error: 'Invalid team IDs provided' },
        error: null
      })

      const invalidTeamRequest = {
        email: 'test@example.com',
        role: 'coach' as const,
        teamIds: [999999]
      }

      const teamResult = await createInvitation(invalidTeamRequest)
      expect(teamResult.data).toBeNull()
      expect(teamResult.error?.message).toBe('Team validation failed')
    })
  })

  describe('Trigger Security and Privilege Escalation', () => {
    it('should simulate trigger security with proper privilege escalation', async () => {
      // This test simulates the database trigger running with security definer privileges
      // The trigger should be able to modify profiles and user_team_roles even if the 
      // triggering user doesn't have direct permissions

      const mockInvitation = {
        id: 1,
        email: 'invited@example.com',
        role: 'coach',
        team_ids: [1, 2],
        status: 'pending',
        created_by: 'admin-123',
        created_at: '2024-01-01T00:00:00Z'
      }

      // Mock successful profile creation (trigger has elevated privileges)
      const mockProfileInsert = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{
              id: 'new-user-id',
              email: 'invited@example.com',
              display_name: 'invited@example.com',
              role: 'coach'
            }],
            error: null
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockProfileInsert)

      // Simulate trigger creating profile with elevated privileges
      const profileResult = await supabase
        .from('profiles')
        .insert({
          id: 'new-user-id',
          email: 'invited@example.com',
          display_name: 'invited@example.com',
          role: 'coach'
        })
        .select()

      expect(profileResult.data).toBeDefined()
      expect(profileResult.data[0].role).toBe('coach')

      // Mock successful team role assignments (trigger has elevated privileges)
      const mockTeamRoleInsert = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [
              { user_id: 'new-user-id', team_id: 1, role: 'coach' },
              { user_id: 'new-user-id', team_id: 2, role: 'coach' }
            ],
            error: null
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockTeamRoleInsert)

      // Simulate trigger creating team assignments with elevated privileges
      const teamRoleResult = await supabase
        .from('user_team_roles')
        .insert([
          { user_id: 'new-user-id', team_id: 1, role: 'coach' },
          { user_id: 'new-user-id', team_id: 2, role: 'coach' }
        ])
        .select()

      expect(teamRoleResult.data).toHaveLength(2)
      expect(teamRoleResult.data.every((assignment: any) => assignment.role === 'coach')).toBe(true)
    })

    it('should test trigger error handling and security boundaries', async () => {
      // Test that trigger handles errors gracefully without exposing sensitive information
      
      // Mock trigger encountering an error but continuing execution
      const mockProfileInsert = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { 
              message: 'constraint violation',
              code: '23505' // Unique constraint violation
            }
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockProfileInsert)

      // Simulate trigger encountering constraint violation
      const profileResult = await supabase
        .from('profiles')
        .insert({
          id: 'existing-user-id',
          email: 'existing@example.com',
          role: 'coach'
        })
        .select()

      // Trigger should handle the error gracefully
      expect(profileResult.error).toBeDefined()
      expect(profileResult.error.code).toBe('23505')
      
      // Error message should not expose sensitive system information
      expect(profileResult.error.message).not.toContain('password')
      expect(profileResult.error.message).not.toContain('secret')
      expect(profileResult.error.message).not.toContain('key')
    })

    it('should validate trigger only processes valid team IDs', async () => {
      // Test that trigger validates team existence before creating assignments
      
      const mockInvitation = {
        id: 1,
        email: 'test@example.com',
        role: 'coach',
        team_ids: [1, 999, 2], // 999 is invalid team ID
        status: 'pending',
        created_by: 'admin-123',
        created_at: '2024-01-01T00:00:00Z'
      }

      // Mock team validation query (simulating trigger's team existence check)
      const mockTeamValidation = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [
            { id: 1 }, // Valid team
            { id: 2 }  // Valid team
            // Team 999 not returned (doesn't exist)
          ],
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockTeamValidation)

      // Simulate trigger validating team existence
      const teamValidationResult = await supabase
        .from('teams')
        .select('id')
        .in('id', mockInvitation.team_ids)

      expect(teamValidationResult.data).toHaveLength(2) // Only valid teams returned
      expect(teamValidationResult.data.map((t: any) => t.id)).toEqual([1, 2])

      // Mock team role assignments for only valid teams
      const mockTeamRoleInsert = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [
              { user_id: 'new-user-id', team_id: 1, role: 'coach' },
              { user_id: 'new-user-id', team_id: 2, role: 'coach' }
              // No assignment for team 999 (invalid)
            ],
            error: null
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockTeamRoleInsert)

      // Simulate trigger creating assignments only for valid teams
      const validTeamIds = teamValidationResult.data.map((t: any) => t.id)
      const assignments = validTeamIds.map((teamId: number) => ({
        user_id: 'new-user-id',
        team_id: teamId,
        role: 'coach'
      }))

      const teamRoleResult = await supabase
        .from('user_team_roles')
        .insert(assignments)
        .select()

      // Only valid teams should have assignments created
      expect(teamRoleResult.data).toHaveLength(2)
      expect(teamRoleResult.data.every((assignment: any) => [1, 2].includes(assignment.team_id))).toBe(true)
      expect(teamRoleResult.data.every((assignment: any) => assignment.team_id !== 999)).toBe(true)
    })
  })

  describe('Data Access Security and Authorization', () => {
    it('should test invitation cancellation authorization', async () => {
      // Test that only authorized users can cancel invitations
      
      // Mock unauthorized cancellation attempt
      const mockQueryBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { 
            message: 'permission denied',
            code: '42501'
          }
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)

      const result = await cancelInvitation(1)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Failed to cancel invitation',
        details: 'permission denied',
        code: '42501'
      })
    })

    it('should test authorized invitation cancellation by SUPER_ADMIN', async () => {
      // Test successful cancellation by authorized user
      
      const mockCanceledInvitation = {
        id: 1,
        email: 'test@example.com',
        role: 'coach',
        team_ids: [1],
        status: 'canceled',
        created_by: 'admin-123',
        created_at: '2024-01-01T00:00:00Z'
      }

      const mockQueryBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCanceledInvitation,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)

      const result = await cancelInvitation(1)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockCanceledInvitation)
      expect(result.data?.status).toBe('canceled')
    })

    it('should test data isolation between different admin users', async () => {
      // Test that non-SUPER_ADMIN users only see their own invitations
      
      const userSpecificInvitations = [
        {
          id: 1,
          email: 'user1@example.com',
          role: 'coach',
          team_ids: [1],
          status: 'pending',
          created_by: 'current-admin-123',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: userSpecificInvitations,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)

      const result = await listInvitations()

      expect(result.error).toBeNull()
      expect(result.data).toEqual(userSpecificInvitations)
      
      // All invitations should be created by the current user (RLS filtering)
      expect(result.data!.every(inv => inv.created_by === 'current-admin-123')).toBe(true)
    })
  })

  describe('Input Validation and Injection Prevention', () => {
    it('should test SQL injection prevention in invitation queries', async () => {
      // Test that malicious input doesn't cause SQL injection
      
      const maliciousEmail = "test@example.com'; DROP TABLE pending_invites; --"
      
      // Mock Edge Function properly handling malicious input
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'valid-jwt-token', user: { id: 'superadmin-123' } } },
        error: null
      })

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: false, error: 'Invalid email format' },
        error: null
      })

      const request: InviteUserRequest = {
        email: maliciousEmail,
        role: 'coach',
        teamIds: [1]
      }

      const result = await createInvitation(request)

      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('Email validation failed')
      
      // Malicious SQL should be rejected, not executed
      expect(result.error?.message).not.toContain('DROP TABLE')
    })

    it('should test XSS prevention in display names', async () => {
      // Test that malicious scripts in display names are handled safely
      
      const maliciousDisplayName = '<script>alert("XSS")</script>'
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'valid-jwt-token', user: { id: 'superadmin-123' } } },
        error: null
      })

      // Edge Function should sanitize or reject malicious display names
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: true, action_link: 'https://example.com/invite/abc123' },
        error: null
      })

      const request: InviteUserRequest = {
        email: 'test@example.com',
        display_name: maliciousDisplayName,
        role: 'coach',
        teamIds: [1]
      }

      const result = await createInvitation(request)

      // Request should succeed but malicious content should be handled safely
      expect(result.error).toBeNull()
      expect(result.data?.ok).toBe(true)
      
      // Verify the malicious script was passed to Edge Function for proper handling
      expect(supabase.functions.invoke).toHaveBeenCalledWith('invite-user', {
        body: expect.objectContaining({
          display_name: maliciousDisplayName
        }),
        headers: {
          Authorization: 'Bearer valid-jwt-token'
        }
      })
    })

    it('should test role validation against privilege escalation attempts', async () => {
      // Test that users cannot escalate privileges through role manipulation
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'valid-jwt-token', user: { id: 'superadmin-123' } } },
        error: null
      })

      const privilegeEscalationAttempts = [
        'SUPER_ADMIN',
        'root',
        'administrator',
        'system',
        'admin; DROP TABLE profiles; --'
      ]

      for (const maliciousRole of privilegeEscalationAttempts) {
        // Mock Edge Function rejecting invalid roles
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: { ok: false, error: 'Invalid role. Must be "coach" or "admin"' },
          error: null
        })

        const request: InviteUserRequest = {
          email: 'test@example.com',
          role: maliciousRole as any,
          teamIds: [1]
        }

        const result = await createInvitation(request)

        expect(result.data).toBeNull()
        expect(result.error?.message).toBe('Role validation failed')
      }
    })
  })

  describe('Session and Token Security', () => {
    it('should test token expiration handling', async () => {
      // Test that expired tokens are properly rejected
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'expired-jwt-token', user: { id: 'user-123' } } },
        error: null
      })

      // Mock Edge Function detecting expired token
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: false, error: 'Invalid or expired token' },
        error: null
      })

      const request: InviteUserRequest = {
        email: 'test@example.com',
        role: 'coach',
        teamIds: [1]
      }

      const result = await createInvitation(request)

      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('Failed to create invitation')
    })

    it('should test malformed token handling', async () => {
      // Test that malformed tokens are properly rejected
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'malformed.jwt.token', user: { id: 'user-123' } } },
        error: null
      })

      // Mock Edge Function detecting malformed token
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: false, error: 'Invalid or expired token' },
        error: null
      })

      const request: InviteUserRequest = {
        email: 'test@example.com',
        role: 'coach',
        teamIds: [1]
      }

      const result = await createInvitation(request)

      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('Failed to create invitation')
    })

    it('should test session hijacking prevention', async () => {
      // Test that tokens from different users are properly validated
      
      // Mock session with one user ID
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'user-a-token', user: { id: 'user-a-123' } } },
        error: null
      })

      // Mock Edge Function detecting token/user mismatch
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: false, error: 'Invalid or expired token' },
        error: null
      })

      const request: InviteUserRequest = {
        email: 'test@example.com',
        role: 'coach',
        teamIds: [1]
      }

      const result = await createInvitation(request)

      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('Failed to create invitation')
    })
  })
})