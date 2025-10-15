import { supabase } from '@/lib/supabase'

// role: 'coach' | 'admin'
export type UserTeamRole = {
  user_id: string;
  team_id: number;
  role: 'coach' | 'admin';
  created_at: string;
}

export type EnrichedUserTeamRole = UserTeamRole & {
  display_name: string | null;
}

export async function listAssignments(teamId: number) {
  // Devolver asignaciones y el display_name desde profiles para mostrar en UI
  const { data, error } = await supabase
    .from('user_team_roles')
    .select('user_id, team_id, role, created_at')
    .eq('team_id', teamId)

  if (error) return { data: null, error }

  // Enriquecer con perfiles:
  const userIds = [...new Set((data ?? []).map(r => r.user_id))]
  let profilesMap: Record<string, { display_name: string | null }> = {}
  
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)
    profiles?.forEach(p => { 
      profilesMap[p.id] = { display_name: p.display_name ?? null } 
    })
  }

  const enriched = (data ?? []).map(r => ({ 
    ...r, 
    display_name: profilesMap[r.user_id]?.display_name ?? null 
  }))
  
  return { data: enriched, error: null }
}

export async function addAssignment(values: { 
  user_id: string; 
  team_id: number; 
  role: 'coach' | 'admin' 
}) {
  return supabase
    .from('user_team_roles')
    .insert(values)
    .select('user_id,team_id,role,created_at')
    .single()
}

export async function removeAssignment(values: { 
  user_id: string; 
  team_id: number; 
  role: 'coach' | 'admin' 
}) {
  return supabase
    .from('user_team_roles')
    .delete()
    .match(values)
}

// Búsqueda de usuarios (para asignar) — usar profiles
export async function searchProfiles(query: string) {
  // Buscar por display_name ilike; si querés exact match por UUID también
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role, created_at')
    .ilike('display_name', `%${query}%`)
    .limit(20)
  return { data, error }
}