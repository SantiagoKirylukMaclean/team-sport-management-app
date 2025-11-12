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
