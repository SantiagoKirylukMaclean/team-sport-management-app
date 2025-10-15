import { supabase } from '@/lib/supabase'

export type Team = {
  id: number;
  name: string;
  club_id: number;
  created_at: string;
}

export async function listTeams({ 
  from = 0, 
  to = 24, 
  clubId, 
  sportId 
}: { 
  from?: number; 
  to?: number; 
  clubId?: number; 
  sportId?: number; 
} = {}) {
  let q = supabase.from('teams')
    .select('id,name,created_at,club_id')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (clubId) q = q.eq('club_id', clubId)
  // Si pasás sportId, el front puede traducir a clubIds válidos y llamar de nuevo
  return q
}

export async function createTeam(values: { name: string; club_id: number }) {
  return supabase.from('teams').insert(values)
    .select('id,name,created_at,club_id').single()
}

export async function updateTeam(id: number, values: { name: string; club_id: number }) {
  return supabase.from('teams').update(values)
    .eq('id', id).select('id,name,created_at,club_id').single()
}

export async function deleteTeam(id: number) {
  return supabase.from('teams').delete().eq('id', id)
}