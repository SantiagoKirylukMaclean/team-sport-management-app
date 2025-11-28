import { supabase } from '@/lib/supabase'

export interface EvaluationCategory {
  id: string
  name: string
  description: string | null
  order_index: number
}

export interface EvaluationCriterion {
  id: string
  category_id: string
  name: string
  description: string | null
  max_score: number
  order_index: number
  evaluation_method: string | null
  example_video_url: string | null
}

export interface PlayerEvaluation {
  id: string
  player_id: string
  coach_id: string | null
  evaluation_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface EvaluationScore {
  id: string
  evaluation_id: string
  criterion_id: string
  score: number
  notes: string | null
  example_video_url: string | null
}

export interface EvaluationWithScores extends PlayerEvaluation {
  scores: EvaluationScore[]
  coach?: {
    display_name: string
  }
}

export interface CategoryWithCriteria extends EvaluationCategory {
  criteria: EvaluationCriterion[]
}

// Get all evaluation categories with their criteria
export async function getEvaluationStructure(): Promise<CategoryWithCriteria[]> {
  const { data: categories, error: catError } = await supabase
    .from('evaluation_categories')
    .select('*')
    .order('order_index')

  if (catError) throw catError

  const { data: criteria, error: critError } = await supabase
    .from('evaluation_criteria')
    .select('*')
    .order('order_index')

  if (critError) throw critError

  return categories.map(cat => ({
    ...cat,
    criteria: criteria.filter(c => c.category_id === cat.id)
  }))
}

// Get player evaluations
export async function getPlayerEvaluations(playerId: number): Promise<EvaluationWithScores[]> {
  const { data, error } = await supabase
    .from('player_evaluations')
    .select('*')
    .eq('player_id', playerId)
    .order('evaluation_date', { ascending: false })

  if (error) throw error

  // Get scores and coach info for each evaluation
  const evaluationsWithScores = await Promise.all(
    data.map(async (evaluation) => {
      const [scoresResult, coachResult] = await Promise.all([
        supabase
          .from('evaluation_scores')
          .select('*')
          .eq('evaluation_id', evaluation.id),
        evaluation.coach_id
          ? supabase
            .from('profiles')
            .select('display_name')
            .eq('id', evaluation.coach_id)
            .single()
          : Promise.resolve({ data: null, error: null })
      ])

      if (scoresResult.error) throw scoresResult.error

      return {
        ...evaluation,
        scores: scoresResult.data || [],
        coach: coachResult.data ? { display_name: coachResult.data.display_name } : undefined
      }
    })
  )

  return evaluationsWithScores
}

// Create a new evaluation
export async function createEvaluation(
  playerId: number,
  evaluationDate: string,
  notes: string | null
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('player_evaluations')
    .insert({
      player_id: playerId,
      coach_id: user.id,
      evaluation_date: evaluationDate,
      notes
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

// Update evaluation
export async function updateEvaluation(
  evaluationId: string,
  evaluationDate: string,
  notes: string | null
): Promise<void> {
  const { error } = await supabase
    .from('player_evaluations')
    .update({
      evaluation_date: evaluationDate,
      notes
    })
    .eq('id', evaluationId)

  if (error) throw error
}

// Delete evaluation
export async function deleteEvaluation(evaluationId: string): Promise<void> {
  const { error } = await supabase
    .from('player_evaluations')
    .delete()
    .eq('id', evaluationId)

  if (error) throw error
}

// Save evaluation scores
export async function saveEvaluationScores(
  evaluationId: string,
  scores: { criterion_id: string; score: number; notes?: string; example_video_url?: string }[]
): Promise<void> {
  // Delete existing scores
  await supabase
    .from('evaluation_scores')
    .delete()
    .eq('evaluation_id', evaluationId)

  // Insert new scores
  const { error } = await supabase
    .from('evaluation_scores')
    .insert(
      scores.map(s => ({
        evaluation_id: evaluationId,
        criterion_id: s.criterion_id,
        score: s.score,
        notes: s.notes || null,
        example_video_url: s.example_video_url || null
      }))
    )

  if (error) throw error
}

// Get evaluation by ID
export async function getEvaluationById(evaluationId: string): Promise<EvaluationWithScores> {
  const { data, error } = await supabase
    .from('player_evaluations')
    .select('*')
    .eq('id', evaluationId)
    .single()

  if (error) throw error

  const [scoresResult, coachResult] = await Promise.all([
    supabase
      .from('evaluation_scores')
      .select('*')
      .eq('evaluation_id', evaluationId),
    data.coach_id
      ? supabase
        .from('profiles')
        .select('display_name')
        .eq('id', data.coach_id)
        .single()
      : Promise.resolve({ data: null, error: null })
  ])

  if (scoresResult.error) throw scoresResult.error

  return {
    ...data,
    scores: scoresResult.data || [],
    coach: coachResult.data ? { display_name: coachResult.data.display_name } : undefined
  }
}

import { listCoachTeams } from '@/services/teams'

// Get players who have evaluations (for coach view)
export async function getPlayersWithEvaluations(): Promise<{
  player_id: number
  full_name: string
  jersey_number: number | null
  team_name: string
  team_id: number
  evaluation_count: number
  last_evaluation_date: string
}[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // First get all teams where the user is a coach
  const { data: coachTeams, error: teamsError } = await listCoachTeams()

  if (teamsError) throw teamsError

  const teamIds = coachTeams.map(t => t.id)

  if (teamIds.length === 0) return []

  // Get all players from these teams
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select(`
      id,
      full_name,
      jersey_number,
      team_id,
      teams (
        id,
        name
      )
    `)
    .in('team_id', teamIds)

  if (playersError) throw playersError

  // Get evaluation counts and last dates for these players
  const { data: evaluations, error: evalError } = await supabase
    .from('player_evaluations')
    .select('player_id, evaluation_date')
    .in('player_id', players.map(p => p.id))
    .order('evaluation_date', { ascending: false })

  if (evalError) throw evalError

  // Group evaluations by player
  const playerStats = new Map<number, { count: number, lastDate: string }>()

  evaluations.forEach(ev => {
    const current = playerStats.get(ev.player_id) || { count: 0, lastDate: ev.evaluation_date }
    playerStats.set(ev.player_id, {
      count: current.count + 1,
      lastDate: ev.evaluation_date > current.lastDate ? ev.evaluation_date : current.lastDate
    })
  })

  // Filter players who have at least one evaluation and format the result
  return players
    .filter(p => playerStats.has(p.id))
    .map(p => {
      const stats = playerStats.get(p.id)!
      // Handle teams as an array or object depending on return
      const teamData = Array.isArray(p.teams) ? p.teams[0] : p.teams

      return {
        player_id: p.id,
        full_name: p.full_name,
        jersey_number: p.jersey_number,
        team_name: teamData?.name || 'Unknown Team',
        team_id: teamData?.id || 0,
        evaluation_count: stats.count,
        last_evaluation_date: stats.lastDate
      }
    })
    .sort((a, b) => new Date(b.last_evaluation_date).getTime() - new Date(a.last_evaluation_date).getTime())
}
