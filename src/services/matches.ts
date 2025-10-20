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
