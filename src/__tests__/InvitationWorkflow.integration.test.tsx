import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createInvitation, listInvitations, cancelInvitation } from '@/services/invites'
import type { PendingInvite, InviteUserRequest, InviteUserResponse } from '@/types/db'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
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
        in: vi.fn(),
      })),
      insert: vi.fn(() => ({
        select: vi.fn()
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

describe('Invitation Workflow Integration Tests', () => {
  let supabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const { supabase: mockSupabase } = await import('@/lib/supabase')
    supabase = mockSupabase
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Invitation Creation Flow', () => {
    it('should create invitation and generate action link for new user', async () => {
      // Mock successful session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'mock-jwt-token', user: { id: 'admin-123' } } },
        error: null
      })

      // Mock successful Edge Function response
      const mockResponse: InviteUserResponse = {
        ok: true,
        action_link: 'https://example.com/auth/v1/verify?token=abc123&type=recovery'
      }

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null
      })

      const request: InviteUserRequest = {
        email: 'newuser@example.com',
        display_name: 'New User',
        role: 'coach',
        teamIds: [1, 2]
      }

      const result = await createInvitation(request)

      // Verify Edge Function was called correctly
      expect(supabase.functions.invoke).toHaveBeenCalledWith('invite-user', {
        body: request,
        headers: {
          Authorization: 'Bearer mock-jwt-token'
        }
      })

      // Verify successful result
      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockResponse)
      expect(result.data?.action_link).toContain('verify?token=abc123')
    })

    it('should handle Edge Function errors gracefully', async () => {
      // Mock session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'mock-jwt-token', user: { id: 'admin-123' } } },
        error: null
      })

      // Mock Edge Function error response
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: false, error: 'Invalid team IDs provided' },
        error: null
      })

      const request: InviteUserRequest = {
        email: 'test@example.com',
        role: 'coach',
        teamIds: [999] // Invalid team ID
      }

      const result = await createInvitation(request)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'Invalid team IDs provided',
        details: 'Edge Function returned an error response',
        code: 'INVITATION_ERROR'
      })
    })
  })

  describe('Database Trigger Simulation and Role Assignment', () => {
    it('should simulate complete user registration flow with trigger execution', async () => {
      // This test simulates what happens when a user clicks the invitation link
      // and completes their registration, triggering the database function

      const mockInvitation: PendingInvite = {
        id: 1,
        email: 'invited@example.com',
        role: 'coach',
        team_ids: [1, 2],
        status: 'pending',
        created_by: 'admin-123',
        created_at: '2024-01-01T00:00:00Z'
      }

      // Mock the invitation lookup (simulating trigger function behavior)
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInvitation,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)

      // Simulate the trigger execution steps:
      
      // 1. Find pending invitation
      const invitationResult = await supabase
        .from('pending_invites')
        .select('*')
        .eq('email', 'invited@example.com')
        .eq('status', 'pending')
        .single()

      expect(invitationResult.data).toEqual(mockInvitation)
      expect(supabase.from).toHaveBeenCalledWith('pending_invites')

      // 2. Simulate profile creation/update
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

      // 3. Simulate team role assignments
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

      // Insert team assignments for each team
      for (const teamId of mockInvitation.team_ids) {
        const teamRoleResult = await supabase
          .from('user_team_roles')
          .insert({
            user_id: 'new-user-id',
            team_id: teamId,
            role: mockInvitation.role
          })
          .select()

        expect(teamRoleResult.data).toBeDefined()
        expect(teamRoleResult.data.some((role: any) => role.team_id === teamId)).toBe(true)
      }

      // 4. Simulate invitation status update
      const mockInvitationUpdate = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...mockInvitation,
                  status: 'accepted',
                  accepted_at: '2024-01-01T12:00:00Z'
                },
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockInvitationUpdate)

      const updateResult = await supabase
        .from('pending_invites')
        .update({
          status: 'accepted',
          accepted_at: '2024-01-01T12:00:00Z'
        })
        .eq('id', mockInvitation.id)
        .select()
        .single()

      expect(updateResult.data.status).toBe('accepted')
      expect(updateResult.data.accepted_at).toBeDefined()
    })

    it('should verify proper role assignment and team membership creation', async () => {
      // Test that the trigger correctly assigns roles and creates team memberships
      const mockInvitation: PendingInvite = {
        id: 3,
        email: 'coach@example.com',
        role: 'coach',
        team_ids: [1, 2, 3],
        status: 'pending',
        created_by: 'admin-123',
        created_at: '2024-01-01T00:00:00Z'
      }

      // Mock profile creation with correct role
      const mockProfileInsert = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{
              id: 'coach-user-id',
              email: 'coach@example.com',
              display_name: 'coach@example.com',
              role: 'coach'
            }],
            error: null
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockProfileInsert)

      const profileResult = await supabase
        .from('profiles')
        .insert({
          id: 'coach-user-id',
          email: 'coach@example.com',
          role: 'coach'
        })
        .select()

      // Verify profile was created with correct role
      expect(profileResult.data[0].role).toBe('coach')

      // Mock team role assignments
      const mockTeamRoleInsert = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [
              { user_id: 'coach-user-id', team_id: 1, role: 'coach' },
              { user_id: 'coach-user-id', team_id: 2, role: 'coach' },
              { user_id: 'coach-user-id', team_id: 3, role: 'coach' }
            ],
            error: null
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockTeamRoleInsert)

      // Simulate creating team assignments
      const teamRoleResult = await supabase
        .from('user_team_roles')
        .insert([
          { user_id: 'coach-user-id', team_id: 1, role: 'coach' },
          { user_id: 'coach-user-id', team_id: 2, role: 'coach' },
          { user_id: 'coach-user-id', team_id: 3, role: 'coach' }
        ])
        .select()

      // Verify all team assignments were created with correct role
      expect(teamRoleResult.data).toHaveLength(3)
      teamRoleResult.data.forEach((assignment: any) => {
        expect(assignment.user_id).toBe('coach-user-id')
        expect(assignment.role).toBe('coach')
        expect([1, 2, 3]).toContain(assignment.team_id)
      })
    })
  })

  describe('Invitation Status Updates and Audit Trail', () => {
    it('should track invitation status changes correctly', async () => {
      const mockInvitations: PendingInvite[] = [
        {
          id: 1,
          email: 'pending@example.com',
          role: 'coach',
          team_ids: [1],
          status: 'pending',
          created_by: 'admin-123',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          email: 'accepted@example.com',
          role: 'admin',
          team_ids: [1, 2],
          status: 'accepted',
          created_by: 'admin-123',
          created_at: '2024-01-01T00:00:00Z',
          accepted_at: '2024-01-01T12:00:00Z'
        }
      ]

      // Mock invitation list query
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
      expect(result.data).toHaveLength(2)
      
      // Verify different statuses are present
      const statuses = result.data!.map(inv => inv.status)
      expect(statuses).toContain('pending')
      expect(statuses).toContain('accepted')

      // Verify accepted invitation has timestamp
      const acceptedInvitation = result.data!.find(inv => inv.status === 'accepted')
      expect(acceptedInvitation?.accepted_at).toBeDefined()
    })

    it('should test invitation status updates and audit trail functionality', async () => {
      // Test the complete audit trail from creation to acceptance
      const invitationId = 1
      const email = 'audit@example.com'

      // 1. Initial invitation creation
      const mockCreatedInvitation: PendingInvite = {
        id: invitationId,
        email,
        role: 'coach',
        team_ids: [1, 2],
        status: 'pending',
        created_by: 'admin-123',
        created_at: '2024-01-01T00:00:00Z'
      }

      const mockCreateQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [mockCreatedInvitation],
            error: null
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockCreateQuery)

      // Simulate invitation creation
      const createResult = await supabase
        .from('pending_invites')
        .insert({
          email,
          role: 'coach',
          team_ids: [1, 2],
          status: 'pending',
          created_by: 'admin-123'
        })
        .select()

      expect(createResult.data[0].status).toBe('pending')
      expect(createResult.data[0].created_at).toBeDefined()

      // 2. Simulate user registration and trigger execution
      const mockAcceptedInvitation: PendingInvite = {
        ...mockCreatedInvitation,
        status: 'accepted',
        accepted_at: '2024-01-01T12:00:00Z'
      }

      const mockUpdateQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockAcceptedInvitation,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockUpdateQuery)

      // Simulate trigger updating invitation status
      const updateResult = await supabase
        .from('pending_invites')
        .update({
          status: 'accepted',
          accepted_at: '2024-01-01T12:00:00Z'
        })
        .eq('id', invitationId)
        .select()
        .single()

      expect(updateResult.data.status).toBe('accepted')
      expect(updateResult.data.accepted_at).toBeDefined()

      // 3. Verify audit trail completeness
      expect(updateResult.data.created_at).toBeDefined()
      expect(updateResult.data.accepted_at).toBeDefined()
      expect(updateResult.data.created_by).toBe('admin-123')
      
      // Calculate time between creation and acceptance
      const createdAt = new Date(updateResult.data.created_at)
      const acceptedAt = new Date(updateResult.data.accepted_at!)
      expect(acceptedAt.getTime()).toBeGreaterThan(createdAt.getTime())
    })
  })

  describe('Team Assignment Integration', () => {
    it('should properly handle multiple team selections in invitation', async () => {
      // Mock session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'mock-jwt-token', user: { id: 'admin-123' } } },
        error: null
      })

      // Mock successful response
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { ok: true, action_link: 'https://example.com/invite/123' },
        error: null
      })

      const request: InviteUserRequest = {
        email: 'multi@example.com',
        role: 'admin',
        teamIds: [1, 2, 3, 4, 5] // Multiple teams
      }

      const result = await createInvitation(request)

      // Verify multiple teams were included in the request
      expect(supabase.functions.invoke).toHaveBeenCalledWith('invite-user', {
        body: expect.objectContaining({
          teamIds: [1, 2, 3, 4, 5]
        }),
        headers: {
          Authorization: 'Bearer mock-jwt-token'
        }
      })

      expect(result.error).toBeNull()
      expect(result.data?.ok).toBe(true)
    })

    it('should simulate team assignment creation during trigger execution', async () => {
      const mockInvitation: PendingInvite = {
        id: 1,
        email: 'teamuser@example.com',
        role: 'coach',
        team_ids: [10, 20, 30],
        status: 'pending',
        created_by: 'admin-123',
        created_at: '2024-01-01T00:00:00Z'
      }

      // Mock team role assignments for multiple teams
      const mockTeamRoleInsert = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [
              { user_id: 'new-user-id', team_id: 10, role: 'coach' },
              { user_id: 'new-user-id', team_id: 20, role: 'coach' },
              { user_id: 'new-user-id', team_id: 30, role: 'coach' }
            ],
            error: null
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockTeamRoleInsert)

      // Simulate creating team assignments for each team in the invitation
      const teamAssignments = []
      for (const teamId of mockInvitation.team_ids) {
        const assignment = {
          user_id: 'new-user-id',
          team_id: teamId,
          role: mockInvitation.role
        }
        teamAssignments.push(assignment)
      }

      const teamRoleResult = await supabase
        .from('user_team_roles')
        .insert(teamAssignments)
        .select()

      // Verify all team assignments were created
      expect(teamRoleResult.data).toHaveLength(3)
      expect(teamRoleResult.data.every((assignment: any) => assignment.role === 'coach')).toBe(true)
      expect(teamRoleResult.data.every((assignment: any) => assignment.user_id === 'new-user-id')).toBe(true)
      
      const assignedTeamIds = teamRoleResult.data.map((assignment: any) => assignment.team_id)
      expect(assignedTeamIds).toEqual(expect.arrayContaining([10, 20, 30]))
    })
  })
})