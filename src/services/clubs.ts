import { supabase } from '@/lib/supabase'

export type Club = {
  id: number
  name: string
  sport_id: number
  created_at: string
  sports?: { name: string }
}

export async function listClubs({ 
  from = 0, 
  to = 24, 
  sportId 
}: { 
  from?: number
  to?: number
  sportId?: number 
} = {}) {
  let query = supabase
    .from('clubs')
    .select('id,name,created_at,sport_id')
    .order('created_at', { ascending: false })
    .range(from, to)
  
  if (sportId) {
    query = query.eq('sport_id', sportId)
  }
  
  return query
}

export async function createClub(values: { name: string; sport_id: number }) {
  return supabase
    .from('clubs')
    .insert(values)
    .select('id,name,created_at,sport_id')
    .single()
}

export async function updateClub(id: number, values: { name: string; sport_id: number }) {
  return supabase
    .from('clubs')
    .update(values)
    .eq('id', id)
    .select('id,name,created_at,sport_id')
    .single()
}

export async function deleteClub(id: number) {
  return supabase.from('clubs').delete().eq('id', id)
}