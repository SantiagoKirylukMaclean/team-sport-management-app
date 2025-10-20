import { supabase } from '@/lib/supabase'

export type Player = {
  id: number
  team_id: number
  full_name: string
  jersey_number: number | null
  created_at: string
}

export async function listPlayers(teamId: number) {
  return supabase
    .from('players')
    .select('id,team_id,full_name,jersey_number,created_at')
    .eq('team_id', teamId)
    .order('jersey_number', { ascending: true })
}

export async function createPlayer(values: { team_id: number; full_name: string; jersey_number?: number | null }) {
  return supabase
    .from('players')
    .insert(values)
    .select('id,team_id,full_name,jersey_number,created_at')
    .single()
}

export async function updatePlayer(id: number, values: { full_name?: string; jersey_number?: number | null }) {
  return supabase
    .from('players')
    .update(values)
    .eq('id', id)
    .select('id,team_id,full_name,jersey_number,created_at')
    .single()
}

export async function deletePlayer(id: number) {
  return supabase.from('players').delete().eq('id', id)
}