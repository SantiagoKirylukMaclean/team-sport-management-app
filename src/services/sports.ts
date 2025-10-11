import { supabase } from '@/lib/supabase'

export type Sport = {
  id: number
  name: string
  created_at: string
}

export async function listSports({ from = 0, to = 24 } = {}) {
  return supabase
    .from('sports')
    .select('id,name,created_at')
    .order('created_at', { ascending: false })
    .range(from, to)
}

export async function createSport(values: { name: string }) {
  return supabase
    .from('sports')
    .insert(values)
    .select('id,name,created_at')
    .single()
}

export async function updateSport(id: number, values: { name: string }) {
  return supabase
    .from('sports')
    .update(values)
    .eq('id', id)
    .select('id,name,created_at')
    .single()
}

export async function deleteSport(id: number) {
  return supabase.from('sports').delete().eq('id', id)
}