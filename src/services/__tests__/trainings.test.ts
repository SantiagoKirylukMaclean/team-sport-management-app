import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listTrainingSessions,
  createTrainingSession,
  updateTrainingSession,
  deleteTrainingSession,
  listTrainingAttendance,
  upsertTrainingAttendance,
  type TrainingSession,
  type TrainingAttendance
} from '../trainings'

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

// Import the mocked supabase after mocking
const { supabase } = await import('@/lib/supabase')

describe('Training Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listTrainingSessions', () => {
    const mockSessions: TrainingSession[] = [
      {
        id: 1,
        team_id: 10,
        session_date: '2025-10-25',
        notes: 'Focus on defense',
        created_at: '2025-10-20T10:00:00Z'
      },
      {
        id: 2,
        team_id: 10,
        session_date: '2025-10-22',
        notes: null,
        created_at: '2025-10-19T10:00:00Z'
      }
    ]

    let mockQueryBuilder: any

    beforeEach(() => {
      mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn()
      }
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)
    })

    it('should fetch training sessions filtered by team ID', async () => {
      mockQueryBuilder.order.mockResolvedValue({
        data: mockSessions,
        error: null
      })

      const result = await listTrainingSessions(10)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockSessions)
      expect(supabase.from).toHaveBeenCalledWith('training_sessions')
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('id,team_id,session_date,notes,created_at')
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('team_id', 10)
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('session_date', { ascending: false })
    })

    it('should handle empty results', async () => {
      mockQueryBuilder.order.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await listTrainingSessions(999)

      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    })

    it('should handle database errors', async () => {
      mockQueryBuilder.order.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied', code: 'RLS_ERROR' }
      })

      const result = await listTrainingSessions(10)

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: 'Permission denied', code: 'RLS_ERROR' })
    })
  })

  describe('createTrainingSession', () => {
    const mockSession: TrainingSession = {
      id: 1,
      team_id: 10,
      session_date: '2025-10-25',
      notes: 'Focus on defense',
      created_at: '2025-10-20T10:00:00Z'
    }

    let mockQueryBuilder: any

    beforeEach(() => {
      mockQueryBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn()
      }
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)
    })

    it('should create training session with required fields', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: mockSession,
        error: null
      })

      const result = await createTrainingSession({
        team_id: 10,
        session_date: '2025-10-25'
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockSession)
      expect(supabase.from).toHaveBeenCalledWith('training_sessions')
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        team_id: 10,
        session_date: '2025-10-25'
      })
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('id,team_id,session_date,notes,created_at')
    })

    it('should create training session with optional notes', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: mockSession,
        error: null
      })

      const result = await createTrainingSession({
        team_id: 10,
        session_date: '2025-10-25',
        notes: 'Focus on defense'
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockSession)
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        team_id: 10,
        session_date: '2025-10-25',
        notes: 'Focus on defense'
      })
    })

    it('should handle RLS policy violations', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'new row violates row-level security policy', code: '42501' }
      })

      const result = await createTrainingSession({
        team_id: 10,
        session_date: '2025-10-25'
      })

      expect(result.data).toBeNull()
      expect(result.error).toEqual({
        message: 'new row violates row-level security policy',
        code: '42501'
      })
    })

    it('should handle foreign key constraint violations', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'foreign key constraint violated', code: '23503' }
      })

      const result = await createTrainingSession({
        team_id: 999,
        session_date: '2025-10-25'
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('23503')
    })
  })

  describe('updateTrainingSession', () => {
    const mockUpdatedSession: TrainingSession = {
      id: 1,
      team_id: 10,
      session_date: '2025-10-26',
      notes: 'Updated notes',
      created_at: '2025-10-20T10:00:00Z'
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

    it('should update training session with partial data', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: mockUpdatedSession,
        error: null
      })

      const result = await updateTrainingSession(1, {
        session_date: '2025-10-26'
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockUpdatedSession)
      expect(supabase.from).toHaveBeenCalledWith('training_sessions')
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ session_date: '2025-10-26' })
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1)
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('id,team_id,session_date,notes,created_at')
    })

    it('should update both session_date and notes', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: mockUpdatedSession,
        error: null
      })

      const result = await updateTrainingSession(1, {
        session_date: '2025-10-26',
        notes: 'Updated notes'
      })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockUpdatedSession)
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        session_date: '2025-10-26',
        notes: 'Updated notes'
      })
    })

    it('should handle RLS policy violations', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied', code: '42501' }
      })

      const result = await updateTrainingSession(1, {
        notes: 'Unauthorized update'
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('42501')
    })

    it('should handle non-existent training session', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found', code: 'PGRST116' }
      })

      const result = await updateTrainingSession(999, {
        notes: 'Update non-existent'
      })

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('PGRST116')
    })
  })

  describe('deleteTrainingSession', () => {
    let mockQueryBuilder: any

    beforeEach(() => {
      mockQueryBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn()
      }
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)
    })

    it('should delete training session by ID', async () => {
      mockQueryBuilder.eq.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await deleteTrainingSession(1)

      expect(result.error).toBeNull()
      expect(supabase.from).toHaveBeenCalledWith('training_sessions')
      expect(mockQueryBuilder.delete).toHaveBeenCalled()
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1)
    })

    it('should handle RLS policy violations', async () => {
      mockQueryBuilder.eq.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied', code: '42501' }
      })

      const result = await deleteTrainingSession(1)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('42501')
    })

    it('should handle cascade deletion of attendance records', async () => {
      mockQueryBuilder.eq.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await deleteTrainingSession(1)

      expect(result.error).toBeNull()
      // Cascade deletion is handled by database, just verify delete was called
      expect(mockQueryBuilder.delete).toHaveBeenCalled()
    })
  })

  describe('listTrainingAttendance', () => {
    const mockAttendance: any[] = [
      {
        training_id: 1,
        player_id: 5,
        status: 'on_time',
        player: {
          id: 5,
          full_name: 'John Doe',
          jersey_number: 10
        }
      },
      {
        training_id: 1,
        player_id: 6,
        status: 'late',
        player: {
          id: 6,
          full_name: 'Jane Smith',
          jersey_number: 7
        }
      }
    ]

    let mockQueryBuilder: any

    beforeEach(() => {
      mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn()
      }
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)
    })

    it('should fetch attendance with player details joined', async () => {
      mockQueryBuilder.order.mockResolvedValue({
        data: mockAttendance,
        error: null
      })

      const result = await listTrainingAttendance(1)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockAttendance)
      expect(supabase.from).toHaveBeenCalledWith('training_attendance')
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(`
      training_id,
      player_id,
      status,
      player:players(id,full_name,jersey_number)
    `)
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('training_id', 1)
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('player(jersey_number)', { ascending: true })
    })

    it('should handle empty attendance records', async () => {
      mockQueryBuilder.order.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await listTrainingAttendance(999)

      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    })

    it('should handle RLS policy violations', async () => {
      mockQueryBuilder.order.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied', code: '42501' }
      })

      const result = await listTrainingAttendance(1)

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('42501')
    })

    it('should verify player data is included in response', async () => {
      mockQueryBuilder.order.mockResolvedValue({
        data: mockAttendance,
        error: null
      })

      const result = await listTrainingAttendance(1)

      expect(result.data).toBeDefined()
      if (result.data && result.data.length > 0) {
        const firstRecord = result.data[0] as any
        expect(firstRecord.player).toBeDefined()
        expect(firstRecord.player.full_name).toBe('John Doe')
        expect(firstRecord.player.jersey_number).toBe(10)
      }
    })
  })

  describe('upsertTrainingAttendance', () => {
    const mockAttendance: TrainingAttendance = {
      training_id: 1,
      player_id: 5,
      status: 'on_time'
    }

    let mockQueryBuilder: any

    beforeEach(() => {
      mockQueryBuilder = {
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn()
      }
      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder)
    })

    it('should insert new attendance record', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: mockAttendance,
        error: null
      })

      const result = await upsertTrainingAttendance(1, 5, 'on_time')

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockAttendance)
      expect(supabase.from).toHaveBeenCalledWith('training_attendance')
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
        { training_id: 1, player_id: 5, status: 'on_time' },
        { onConflict: 'training_id,player_id' }
      )
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('training_id,player_id,status')
    })

    it('should update existing attendance record', async () => {
      const updatedAttendance: TrainingAttendance = {
        training_id: 1,
        player_id: 5,
        status: 'late'
      }

      mockQueryBuilder.single.mockResolvedValue({
        data: updatedAttendance,
        error: null
      })

      const result = await upsertTrainingAttendance(1, 5, 'late')

      expect(result.error).toBeNull()
      expect(result.data).toEqual(updatedAttendance)
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
        { training_id: 1, player_id: 5, status: 'late' },
        { onConflict: 'training_id,player_id' }
      )
    })

    it('should handle all attendance status values', async () => {
      const statuses: Array<'on_time' | 'late' | 'absent'> = ['on_time', 'late', 'absent']

      for (const status of statuses) {
        mockQueryBuilder.single.mockResolvedValue({
          data: { training_id: 1, player_id: 5, status },
          error: null
        })

        const result = await upsertTrainingAttendance(1, 5, status)

        expect(result.error).toBeNull()
        expect(result.data?.status).toBe(status)
      }
    })

    it('should handle RLS policy violations', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied', code: '42501' }
      })

      const result = await upsertTrainingAttendance(1, 5, 'on_time')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('42501')
    })

    it('should handle foreign key constraint violations', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'foreign key constraint violated', code: '23503' }
      })

      const result = await upsertTrainingAttendance(999, 999, 'on_time')

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('23503')
    })
  })
})
