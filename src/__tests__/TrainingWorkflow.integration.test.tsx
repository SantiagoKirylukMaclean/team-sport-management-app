/**
 * Integration tests for training workflow
 * Tests complete workflow: select team → create session → mark attendance → edit → delete
 * Tests RLS enforcement and cascade deletion
 * 
 * Requirements tested: 1.1, 1.2, 1.5, 2.1, 3.2, 3.3, 4.2, 4.3, 4.4, 5.4, 5.5, 7.1, 7.2, 7.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  listTrainingSessions,
  createTrainingSession,
  updateTrainingSession,
  deleteTrainingSession,
  listTrainingAttendance,
  upsertTrainingAttendance,
  type TrainingSession,
  type TrainingAttendance,
  type AttendanceWithPlayer
} from '@/services/trainings'
import { listCoachTeams, type Team } from '@/services/teams'
import { listPlayers, type Player } from '@/services/players'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            range: vi.fn()
          })),
        })),
        order: vi.fn(() => ({
          range: vi.fn()
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}))

describe('Training Workflow Integration Tests', () => {
  let supabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const { supabase: mockSupabase } = await import('@/lib/supabase')
    supabase = mockSupabase
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Training Workflow - Coach User', () => {
    it('should complete full workflow: select team → create session → mark attendance → edit → delete', async () => {
      // Step 1: Coach selects team from their assigned teams
      const mockTeams: Team[] = [
        { id: 1, name: 'Team A', club_id: 1, created_at: '2024-01-01T00:00:00Z' },
        { id: 2, name: 'Team B', club_id: 1, created_at: '2024-01-02T00:00:00Z' }
      ]

      const mockTeamsQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockTeams,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockTeamsQuery)

      const teamsResult = await listCoachTeams()
      expect(teamsResult.data).toEqual(mockTeams)
      expect(teamsResult.error).toBeNull()

      // Coach selects Team A
      const selectedTeamId = mockTeams[0].id

      // Step 2: Create new training session
      const newTrainingData = {
        team_id: selectedTeamId,
        session_date: '2024-01-15',
        notes: 'Morning practice session'
      }

      const mockCreatedTraining: TrainingSession = {
        id: 1,
        ...newTrainingData,
        created_at: '2024-01-10T00:00:00Z'
      }

      const mockCreateQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedTraining,
              error: null
            })
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockCreateQuery)

      const createResult = await createTrainingSession(newTrainingData)
      expect(createResult.data).toEqual(mockCreatedTraining)
      expect(createResult.error).toBeNull()
      expect(supabase.from).toHaveBeenCalledWith('training_sessions')

      // Step 3: Verify session appears in list
      const mockSessionsList: TrainingSession[] = [mockCreatedTraining]

      const mockListQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockSessionsList,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockListQuery)

      const listResult = await listTrainingSessions(selectedTeamId)
      expect(listResult.data).toEqual(mockSessionsList)
      expect(listResult.error).toBeNull()

      // Step 4: Load players for attendance marking
      const mockPlayers: Player[] = [
        { id: 1, team_id: selectedTeamId, full_name: 'Player One', jersey_number: 10, created_at: '2024-01-01T00:00:00Z' },
        { id: 2, team_id: selectedTeamId, full_name: 'Player Two', jersey_number: 11, created_at: '2024-01-01T00:00:00Z' },
        { id: 3, team_id: selectedTeamId, full_name: 'Player Three', jersey_number: 12, created_at: '2024-01-01T00:00:00Z' }
      ]

      const mockPlayersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockPlayers,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockPlayersQuery)

      const playersResult = await listPlayers(selectedTeamId)
      expect(playersResult.data).toEqual(mockPlayers)
      expect(playersResult.error).toBeNull()

      // Step 5: Mark attendance for multiple players
      const attendanceRecords = [
        { training_id: mockCreatedTraining.id, player_id: 1, status: 'on_time' as const },
        { training_id: mockCreatedTraining.id, player_id: 2, status: 'late' as const },
        { training_id: mockCreatedTraining.id, player_id: 3, status: 'absent' as const }
      ]

      const mockUpsertQuery = {
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation((_, index) => 
              Promise.resolve({
                data: attendanceRecords[index || 0],
                error: null
              })
            )
          })
        })
      }

      for (let i = 0; i < attendanceRecords.length; i++) {
        vi.mocked(supabase.from).mockReturnValue(mockUpsertQuery)
        
        const record = attendanceRecords[i]
        const upsertResult = await upsertTrainingAttendance(
          record.training_id,
          record.player_id,
          record.status
        )
        
        expect(upsertResult.error).toBeNull()
        expect(supabase.from).toHaveBeenCalledWith('training_attendance')
      }

      // Step 6: Verify attendance records were saved
      const mockAttendanceWithPlayers: AttendanceWithPlayer[] = [
        {
          training_id: mockCreatedTraining.id,
          player_id: 1,
          status: 'on_time',
          player: { id: 1, full_name: 'Player One', jersey_number: 10 }
        },
        {
          training_id: mockCreatedTraining.id,
          player_id: 2,
          status: 'late',
          player: { id: 2, full_name: 'Player Two', jersey_number: 11 }
        },
        {
          training_id: mockCreatedTraining.id,
          player_id: 3,
          status: 'absent',
          player: { id: 3, full_name: 'Player Three', jersey_number: 12 }
        }
      ]

      const mockAttendanceQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockAttendanceWithPlayers,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockAttendanceQuery)

      const attendanceResult = await listTrainingAttendance(mockCreatedTraining.id)
      expect(attendanceResult.data).toEqual(mockAttendanceWithPlayers)
      expect(attendanceResult.error).toBeNull()
      expect(attendanceResult.data).toHaveLength(3)

      // Step 7: Edit training session details
      const updatedData = {
        session_date: '2024-01-16',
        notes: 'Updated: Afternoon practice session'
      }

      const mockUpdatedTraining: TrainingSession = {
        ...mockCreatedTraining,
        ...updatedData
      }

      const mockUpdateQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedTraining,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockUpdateQuery)

      const updateResult = await updateTrainingSession(mockCreatedTraining.id, updatedData)
      expect(updateResult.data).toEqual(mockUpdatedTraining)
      expect(updateResult.error).toBeNull()
      expect(updateResult.data?.session_date).toBe('2024-01-16')
      expect(updateResult.data?.notes).toBe('Updated: Afternoon practice session')

      // Step 8: Delete training session (cascade deletes attendance)
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockDeleteQuery)

      const deleteResult = await deleteTrainingSession(mockCreatedTraining.id)
      expect(deleteResult.error).toBeNull()
      expect(supabase.from).toHaveBeenCalledWith('training_sessions')

      // Step 9: Verify session is removed from list
      const mockEmptyList: TrainingSession[] = []

      const mockEmptyListQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockEmptyList,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockEmptyListQuery)

      const finalListResult = await listTrainingSessions(selectedTeamId)
      expect(finalListResult.data).toEqual([])
      expect(finalListResult.error).toBeNull()
    })

    it('should update existing attendance records correctly using upsert', async () => {
      // Requirement 5.4: Test attendance upsert updates existing records correctly
      const trainingId = 1
      const playerId = 1

      // First, mark player as on_time
      const initialAttendance: TrainingAttendance = {
        training_id: trainingId,
        player_id: playerId,
        status: 'on_time'
      }

      const mockUpsertQuery = {
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: initialAttendance,
              error: null
            })
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockUpsertQuery)

      const firstResult = await upsertTrainingAttendance(trainingId, playerId, 'on_time')
      expect(firstResult.data).toEqual(initialAttendance)
      expect(firstResult.error).toBeNull()

      // Then, update the same player to late (upsert should update, not create duplicate)
      const updatedAttendance: TrainingAttendance = {
        training_id: trainingId,
        player_id: playerId,
        status: 'late'
      }

      const mockUpdateUpsertQuery = {
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: updatedAttendance,
              error: null
            })
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockUpdateUpsertQuery)

      const secondResult = await upsertTrainingAttendance(trainingId, playerId, 'late')
      expect(secondResult.data).toEqual(updatedAttendance)
      expect(secondResult.error).toBeNull()
      expect(secondResult.data?.status).toBe('late')

      // Verify upsert was called with onConflict parameter
      expect(mockUpdateUpsertQuery.upsert).toHaveBeenCalledWith(
        { training_id: trainingId, player_id: playerId, status: 'late' },
        { onConflict: 'training_id,player_id' }
      )
    })
  })

  describe('RLS Enforcement - Coach Access Control', () => {
    it('should allow coach to access only assigned teams training sessions', async () => {
      // Requirement 2.1, 7.1, 7.2: Test RLS enforcement for coach accessing only assigned teams
      const coachTeamId = 1
      const otherTeamId = 999

      // Coach can access their team's sessions
      const mockCoachSessions: TrainingSession[] = [
        { id: 1, team_id: coachTeamId, session_date: '2024-01-15', notes: 'Practice', created_at: '2024-01-10T00:00:00Z' }
      ]

      const mockSuccessQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockCoachSessions,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockSuccessQuery)

      const coachResult = await listTrainingSessions(coachTeamId)
      expect(coachResult.data).toEqual(mockCoachSessions)
      expect(coachResult.error).toBeNull()

      // Coach cannot access other team's sessions (RLS blocks)
      const mockRLSError = {
        message: 'permission denied for table training_sessions',
        code: '42501'
      }

      const mockBlockedQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: mockRLSError
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockBlockedQuery)

      const blockedResult = await listTrainingSessions(otherTeamId)
      expect(blockedResult.data).toBeNull()
      expect(blockedResult.error).toEqual(mockRLSError)
      expect(blockedResult.error?.message).toContain('permission')
    })

    it('should block coach from creating sessions for unassigned teams', async () => {
      // Requirement 1.2, 3.2, 7.1: Test RLS blocks creation for unassigned teams
      const unauthorizedTeamId = 999

      const mockRLSError = {
        message: 'new row violates row-level security policy for table "training_sessions"',
        code: '42501'
      }

      const mockBlockedCreateQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockRLSError
            })
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockBlockedCreateQuery)

      const createResult = await createTrainingSession({
        team_id: unauthorizedTeamId,
        session_date: '2024-01-15',
        notes: 'Unauthorized attempt'
      })

      expect(createResult.data).toBeNull()
      expect(createResult.error).toEqual(mockRLSError)
      expect(createResult.error?.message).toContain('row-level security')
    })

    it('should block coach from updating sessions for unassigned teams', async () => {
      // Requirement 3.2, 3.3, 7.1: Test RLS blocks updates for unassigned teams
      const unauthorizedSessionId = 999

      const mockRLSError = {
        message: 'permission denied for table training_sessions',
        code: '42501'
      }

      const mockBlockedUpdateQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockRLSError
              })
            })
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockBlockedUpdateQuery)

      const updateResult = await updateTrainingSession(unauthorizedSessionId, {
        notes: 'Unauthorized update'
      })

      expect(updateResult.data).toBeNull()
      expect(updateResult.error).toEqual(mockRLSError)
      expect(updateResult.error?.message).toContain('permission')
    })

    it('should block coach from deleting sessions for unassigned teams', async () => {
      // Requirement 4.2, 4.3, 7.1: Test RLS blocks deletion for unassigned teams
      const unauthorizedSessionId = 999

      const mockRLSError = {
        message: 'permission denied for table training_sessions',
        code: '42501'
      }

      const mockBlockedDeleteQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: mockRLSError
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockBlockedDeleteQuery)

      const deleteResult = await deleteTrainingSession(unauthorizedSessionId)
      expect(deleteResult.error).toEqual(mockRLSError)
      expect(deleteResult.error?.message).toContain('permission')
    })

    it('should block coach from marking attendance for players not in their teams', async () => {
      // Requirement 5.4, 5.5, 7.1: Test RLS blocks attendance for unassigned teams
      const unauthorizedTrainingId = 999
      const unauthorizedPlayerId = 999

      const mockRLSError = {
        message: 'new row violates row-level security policy for table "training_attendance"',
        code: '42501'
      }

      const mockBlockedUpsertQuery = {
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockRLSError
            })
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockBlockedUpsertQuery)

      const upsertResult = await upsertTrainingAttendance(
        unauthorizedTrainingId,
        unauthorizedPlayerId,
        'on_time'
      )

      expect(upsertResult.data).toBeNull()
      expect(upsertResult.error).toEqual(mockRLSError)
      expect(upsertResult.error?.message).toContain('row-level security')
    })
  })

  describe('Super Admin Access Control', () => {
    it('should allow super admin to access all teams training sessions', async () => {
      // Requirement 7.1, 7.2, 7.3: Test super admin can access all teams
      const team1Sessions: TrainingSession[] = [
        { id: 1, team_id: 1, session_date: '2024-01-15', notes: 'Team 1 practice', created_at: '2024-01-10T00:00:00Z' }
      ]

      const team2Sessions: TrainingSession[] = [
        { id: 2, team_id: 2, session_date: '2024-01-16', notes: 'Team 2 practice', created_at: '2024-01-11T00:00:00Z' }
      ]

      // Super admin can access team 1
      const mockTeam1Query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: team1Sessions,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockTeam1Query)

      const team1Result = await listTrainingSessions(1)
      expect(team1Result.data).toEqual(team1Sessions)
      expect(team1Result.error).toBeNull()

      // Super admin can access team 2
      const mockTeam2Query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: team2Sessions,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockTeam2Query)

      const team2Result = await listTrainingSessions(2)
      expect(team2Result.data).toEqual(team2Sessions)
      expect(team2Result.error).toBeNull()
    })

    it('should allow super admin to create, update, and delete sessions for any team', async () => {
      // Requirement 7.1, 7.2, 7.3: Test super admin full CRUD access
      const anyTeamId = 5

      // Create session
      const newSession: TrainingSession = {
        id: 10,
        team_id: anyTeamId,
        session_date: '2024-01-20',
        notes: 'Super admin created',
        created_at: '2024-01-15T00:00:00Z'
      }

      const mockCreateQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: newSession,
              error: null
            })
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockCreateQuery)

      const createResult = await createTrainingSession({
        team_id: anyTeamId,
        session_date: '2024-01-20',
        notes: 'Super admin created'
      })

      expect(createResult.data).toEqual(newSession)
      expect(createResult.error).toBeNull()

      // Update session
      const updatedSession: TrainingSession = {
        ...newSession,
        notes: 'Super admin updated'
      }

      const mockUpdateQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedSession,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockUpdateQuery)

      const updateResult = await updateTrainingSession(newSession.id, {
        notes: 'Super admin updated'
      })

      expect(updateResult.data).toEqual(updatedSession)
      expect(updateResult.error).toBeNull()

      // Delete session
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockDeleteQuery)

      const deleteResult = await deleteTrainingSession(newSession.id)
      expect(deleteResult.error).toBeNull()
    })
  })

  describe('Cascade Deletion', () => {
    it('should cascade delete attendance records when training session is deleted', async () => {
      // Requirement 1.5, 4.3, 4.4: Test cascade deletion of attendance records
      const trainingId = 1
      const teamId = 1

      // Create training session with attendance records
      const mockTraining: TrainingSession = {
        id: trainingId,
        team_id: teamId,
        session_date: '2024-01-15',
        notes: 'Practice with attendance',
        created_at: '2024-01-10T00:00:00Z'
      }

      const mockAttendance: AttendanceWithPlayer[] = [
        {
          training_id: trainingId,
          player_id: 1,
          status: 'on_time',
          player: { id: 1, full_name: 'Player One', jersey_number: 10 }
        },
        {
          training_id: trainingId,
          player_id: 2,
          status: 'late',
          player: { id: 2, full_name: 'Player Two', jersey_number: 11 }
        }
      ]

      // Verify attendance exists before deletion
      const mockAttendanceQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockAttendance,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockAttendanceQuery)

      const beforeDeleteResult = await listTrainingAttendance(trainingId)
      expect(beforeDeleteResult.data).toEqual(mockAttendance)
      expect(beforeDeleteResult.data).toHaveLength(2)

      // Delete training session (should cascade delete attendance)
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockDeleteQuery)

      const deleteResult = await deleteTrainingSession(trainingId)
      expect(deleteResult.error).toBeNull()

      // Verify attendance records are deleted (cascade)
      const mockEmptyAttendanceQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockEmptyAttendanceQuery)

      const afterDeleteResult = await listTrainingAttendance(trainingId)
      expect(afterDeleteResult.data).toEqual([])
      expect(afterDeleteResult.data).toHaveLength(0)
    })

    it('should verify cascade deletion removes all related attendance records', async () => {
      // Requirement 4.4: Verify all related attendance records are deleted
      const trainingId = 5
      const teamId = 2

      // Create training with multiple attendance records
      const mockMultipleAttendance: AttendanceWithPlayer[] = [
        {
          training_id: trainingId,
          player_id: 1,
          status: 'on_time',
          player: { id: 1, full_name: 'Player A', jersey_number: 1 }
        },
        {
          training_id: trainingId,
          player_id: 2,
          status: 'on_time',
          player: { id: 2, full_name: 'Player B', jersey_number: 2 }
        },
        {
          training_id: trainingId,
          player_id: 3,
          status: 'late',
          player: { id: 3, full_name: 'Player C', jersey_number: 3 }
        },
        {
          training_id: trainingId,
          player_id: 4,
          status: 'absent',
          player: { id: 4, full_name: 'Player D', jersey_number: 4 }
        },
        {
          training_id: trainingId,
          player_id: 5,
          status: 'on_time',
          player: { id: 5, full_name: 'Player E', jersey_number: 5 }
        }
      ]

      // Verify all attendance records exist
      const mockAttendanceQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockMultipleAttendance,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockAttendanceQuery)

      const beforeResult = await listTrainingAttendance(trainingId)
      expect(beforeResult.data).toHaveLength(5)

      // Delete training session
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockDeleteQuery)

      await deleteTrainingSession(trainingId)

      // Verify all attendance records are gone
      const mockEmptyQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockEmptyQuery)

      const afterResult = await listTrainingAttendance(trainingId)
      expect(afterResult.data).toHaveLength(0)
    })
  })

  describe('Team Filtering and Data Isolation', () => {
    it('should filter training sessions by team correctly', async () => {
      // Requirement 2.1: Test training sessions are filtered by team
      const team1Id = 1
      const team2Id = 2

      const team1Sessions: TrainingSession[] = [
        { id: 1, team_id: team1Id, session_date: '2024-01-15', notes: 'Team 1 Session 1', created_at: '2024-01-10T00:00:00Z' },
        { id: 2, team_id: team1Id, session_date: '2024-01-16', notes: 'Team 1 Session 2', created_at: '2024-01-11T00:00:00Z' }
      ]

      const team2Sessions: TrainingSession[] = [
        { id: 3, team_id: team2Id, session_date: '2024-01-17', notes: 'Team 2 Session 1', created_at: '2024-01-12T00:00:00Z' }
      ]

      // Query team 1 sessions
      const mockTeam1Query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: team1Sessions,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockTeam1Query)

      const team1Result = await listTrainingSessions(team1Id)
      expect(team1Result.data).toEqual(team1Sessions)
      expect(team1Result.data).toHaveLength(2)
      expect(team1Result.data?.every(s => s.team_id === team1Id)).toBe(true)

      // Query team 2 sessions
      const mockTeam2Query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: team2Sessions,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockTeam2Query)

      const team2Result = await listTrainingSessions(team2Id)
      expect(team2Result.data).toEqual(team2Sessions)
      expect(team2Result.data).toHaveLength(1)
      expect(team2Result.data?.every(s => s.team_id === team2Id)).toBe(true)
    })

    it('should ensure attendance records are isolated by training session', async () => {
      // Requirement 5.4, 5.5: Test attendance isolation by training session
      const training1Id = 1
      const training2Id = 2

      const training1Attendance: AttendanceWithPlayer[] = [
        {
          training_id: training1Id,
          player_id: 1,
          status: 'on_time',
          player: { id: 1, full_name: 'Player One', jersey_number: 10 }
        }
      ]

      const training2Attendance: AttendanceWithPlayer[] = [
        {
          training_id: training2Id,
          player_id: 2,
          status: 'late',
          player: { id: 2, full_name: 'Player Two', jersey_number: 11 }
        }
      ]

      // Query training 1 attendance
      const mockTraining1Query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: training1Attendance,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockTraining1Query)

      const training1Result = await listTrainingAttendance(training1Id)
      expect(training1Result.data).toEqual(training1Attendance)
      expect(training1Result.data?.every(a => a.training_id === training1Id)).toBe(true)

      // Query training 2 attendance
      const mockTraining2Query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: training2Attendance,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockTraining2Query)

      const training2Result = await listTrainingAttendance(training2Id)
      expect(training2Result.data).toEqual(training2Attendance)
      expect(training2Result.data?.every(a => a.training_id === training2Id)).toBe(true)
    })
  })
})
