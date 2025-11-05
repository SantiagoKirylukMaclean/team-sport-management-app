import { supabase } from '@/lib/supabase'

export type Match = {
  id: number
  team_id: number
  opponent: string
  match_date: string
  location: string | null
  notes: string | null
  created_at: string
}

export async function listMatches(teamId: number) {
  return supabase
    .from('matches')
    .select('id,team_id,opponent,match_date,location,notes,created_at')
    .eq('team_id', teamId)
    .order('match_date', { ascending: false })
}

export async function createMatch(values: {
  team_id: number
  opponent: string
  match_date: string
  location?: string | null
  notes?: string | null
}) {
  return supabase
    .from('matches')
    .insert(values)
    .select('id,team_id,opponent,match_date,location,notes,created_at')
    .single()
}

export async function updateMatch(
  id: number,
  values: Partial<Omit<Match, 'id' | 'team_id' | 'created_at'>>
) {
  return supabase
    .from('matches')
    .update(values)
    .eq('id', id)
    .select('id,team_id,opponent,match_date,location,notes,created_at')
    .single()
}

export async function deleteMatch(id: number) {
  return supabase.from('matches').delete().eq('id', id)
}

// ---- Periods / minutes ----
export type PeriodFraction = 'FULL' | 'HALF'

export type MatchPlayerPeriod = {
  match_id: number
  player_id: number
  period: number
  fraction: PeriodFraction
  created_at: string
}

export async function listMatchPeriods(matchId: number) {
  return supabase
    .from('match_player_periods')
    .select('match_id,player_id,period,fraction,created_at')
    .eq('match_id', matchId)
}

export async function upsertMatchPeriod(
  matchId: number,
  playerId: number,
  period: 1 | 2 | 3 | 4,
  fraction: PeriodFraction
) {
  // Upsert manual por PK compuesta
  const { error: delErr } = await supabase
    .from('match_player_periods')
    .delete()
    .match({ match_id: matchId, player_id: playerId, period })
  if (delErr) {
    // si la política de delete no aplica, intentaremos update; sino insert directo
  }
  return supabase
    .from('match_player_periods')
    .insert({ match_id: matchId, player_id: playerId, period, fraction })
    .select('match_id,player_id,period,fraction,created_at')
    .single()
}

// ---- Call-ups (Convocatorias) ----
export type MatchCallUp = {
  match_id: number
  player_id: number
  created_at: string
}

export async function listMatchCallUps(matchId: number) {
  return supabase
    .from('match_call_ups')
    .select('match_id,player_id,created_at')
    .eq('match_id', matchId)
}

export async function addPlayerToCallUp(matchId: number, playerId: number) {
  return supabase
    .from('match_call_ups')
    .insert({ match_id: matchId, player_id: playerId })
    .select('match_id,player_id,created_at')
    .single()
}

export async function removePlayerFromCallUp(matchId: number, playerId: number) {
  return supabase
    .from('match_call_ups')
    .delete()
    .match({ match_id: matchId, player_id: playerId })
}

export async function setMatchCallUps(matchId: number, playerIds: number[]) {
  // Primero eliminar todas las convocatorias existentes
  await supabase.from('match_call_ups').delete().eq('match_id', matchId)
  
  // Luego insertar las nuevas
  if (playerIds.length === 0) {
    return { data: [], error: null }
  }
  
  return supabase
    .from('match_call_ups')
    .insert(playerIds.map(playerId => ({ match_id: matchId, player_id: playerId })))
    .select('match_id,player_id,created_at')
}

export type CallUpWithPeriods = {
  match_id: number
  player_id: number
  called_up_at: string
  periods_played: number
}

export async function listMatchCallUpsWithPeriods(matchId: number) {
  return supabase
    .from('match_call_ups_with_periods')
    .select('match_id,player_id,called_up_at,periods_played')
    .eq('match_id', matchId)
}

export type ValidationResult = {
  player_id: number
  full_name: string
  periods_played: number
}

export async function validateMatchMinimumPeriods(matchId: number) {
  return supabase.rpc('validate_match_minimum_periods', { p_match_id: matchId })
}

// ---- Substitutions (Cambios) ----
export type MatchSubstitution = {
  id: number
  match_id: number
  period: number
  player_out: number
  player_in: number
  created_at: string
}

export async function listMatchSubstitutions(matchId: number, period?: number) {
  let query = supabase
    .from('match_substitutions')
    .select('id,match_id,period,player_out,player_in,created_at')
    .eq('match_id', matchId)
  
  if (period !== undefined) {
    query = query.eq('period', period)
  }
  
  return query.order('created_at', { ascending: true })
}

export async function applyMatchSubstitution(
  matchId: number,
  period: number,
  playerOut: number,
  playerIn: number
) {
  return supabase.rpc('apply_match_substitution', {
    p_match_id: matchId,
    p_period: period,
    p_player_out: playerOut,
    p_player_in: playerIn
  })
}

export async function removeMatchSubstitution(
  matchId: number,
  period: number,
  playerOut: number,
  playerIn: number
) {
  return supabase.rpc('remove_match_substitution', {
    p_match_id: matchId,
    p_period: period,
    p_player_out: playerOut,
    p_player_in: playerIn
  })
}
