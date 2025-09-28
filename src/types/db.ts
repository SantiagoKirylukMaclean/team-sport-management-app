export type AppRole = 'super_admin' | 'admin' | 'coach' | 'player'

export interface Sport {
  id: number
  name: string
  created_at: string
}

export interface Club {
  id: number
  sport_id: number
  name: string
  created_at: string
  updated_at: string
  sports?: {
    name: string
  }
}

export interface Team {
  id: number
  club_id: number
  name: string
  created_at: string
  updated_at: string
  clubs?: {
    name: string
  }
}

export interface UserTeamRole {
  user_id: string
  team_id: number
  role: AppRole
  created_at: string
}