import { supabase } from '@/lib/supabase'

export type Position = {
  id: number
  name: string
  display_order: number
  created_at: string
}

export async function listPositions() {
  return supabase
    .from('positions')
    .select('*')
    .order('display_order', { ascending: true })
}

export async function createPosition(name: string, displayOrder: number) {
  return supabase
    .from('positions')
    .insert({ name, display_order: displayOrder })
    .select()
    .single()
}
