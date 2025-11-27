import { supabase } from '@/lib/supabase'

export type TrainingSession = {
  id: number
  team_id: number
  session_date: string
  notes: string | null
  created_at: string
}

export type TrainingAttendance = {
  training_id: number
  player_id: number
  status: 'on_time' | 'late' | 'absent'
}

export type AttendanceWithPlayer = TrainingAttendance & {
  player: {
    id: number
    full_name: string
    jersey_number: number | null
  }
}

export async function listTrainingSessions(teamId: number) {
  return supabase
    .from('training_sessions')
    .select('id,team_id,session_date,notes,created_at')
    .eq('team_id', teamId)
    .order('session_date', { ascending: false })
}

export async function createTrainingSession(values: { team_id: number; session_date: string; notes?: string }) {
  return supabase
    .from('training_sessions')
    .insert(values)
    .select('id,team_id,session_date,notes,created_at')
    .single()
}

export async function updateTrainingSession(id: number, values: { session_date?: string; notes?: string }) {
  return supabase
    .from('training_sessions')
    .update(values)
    .eq('id', id)
    .select('id,team_id,session_date,notes,created_at')
    .single()
}

export async function deleteTrainingSession(id: number) {
  return supabase.from('training_sessions').delete().eq('id', id)
}

export async function listTrainingAttendance(trainingId: number) {
  return supabase
    .from('training_attendance')
    .select(`
      training_id,
      player_id,
      status,
      player:players(id,full_name,jersey_number)
    `)
    .eq('training_id', trainingId)
    .order('player(jersey_number)', { ascending: true })
}

export async function upsertTrainingAttendance(
  trainingId: number,
  playerId: number,
  status: 'on_time' | 'late' | 'absent'
) {
  return supabase
    .from('training_attendance')
    .upsert(
      { training_id: trainingId, player_id: playerId, status },
      { onConflict: 'training_id,player_id' }
    )
    .select('training_id,player_id,status')
    .single()
}

export async function getTeamAttendanceStats(teamId: number) {
  // Get all trainings for the team
  const { data: trainings, error: trainingError } = await supabase
    .from('training_sessions')
    .select('id')
    .eq('team_id', teamId)

  if (trainingError) return { error: trainingError }

  const trainingIds = trainings.map(t => t.id)

  if (trainingIds.length === 0) return { data: [] }

  // Get all attendance records for these trainings
  return supabase
    .from('training_attendance')
    .select(`
      training_id,
      player_id,
      status,
      player:players(id,full_name,jersey_number)
    `)
    .in('training_id', trainingIds)
}
