import { supabase } from '@/lib/supabase'
import type { Player } from '@/types/db'

/**
 * Service error type for consistent error handling
 */
export interface PlayerServiceError {
  message: string
  details?: string
  code?: string
}

/**
 * Result type for service functions
 */
export type PlayerServiceResult<T> = {
  data: T
  error: null
} | {
  data: null
  error: PlayerServiceError
}

/**
 * Player with team information for display
 */
export interface PlayerWithTeam extends Player {
  teams?: {
    name: string
    clubs?: {
      name: string
      sports?: {
        name: string
      }
    }
  }
}

/**
 * Fetches all players for a specific team
 * 
 * @param teamId - The ID of the team
 * @returns Promise with the list of players
 */
export async function getPlayersByTeam(
  teamId: number
): Promise<PlayerServiceResult<PlayerWithTeam[]>> {
  try {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        teams!inner(
          name,
          clubs!inner(
            name,
            sports!inner(
              name
            )
          )
        )
      `)
      .eq('team_id', teamId)
      .order('jersey_number', { ascending: true, nullsFirst: false })
      .order('full_name', { ascending: true })

    if (error) {
      return {
        data: null,
        error: {
          message: 'Failed to fetch players',
          details: error.message,
          code: error.code || 'DATABASE_ERROR'
        }
      }
    }

    return {
      data: data || [],
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: 'Unexpected error fetching players',
        details: err instanceof Error ? err.message : 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      }
    }
  }
}

/**
 * Fetches players without linked user accounts (available for invitation)
 * 
 * @param teamId - Optional team ID to filter by
 * @returns Promise with the list of unlinked players
 */
export async function getUnlinkedPlayers(
  teamId?: number
): Promise<PlayerServiceResult<PlayerWithTeam[]>> {
  try {
    let query = supabase
      .from('players')
      .select(`
        *,
        teams!inner(
          name,
          clubs!inner(
            name,
            sports!inner(
              name
            )
          )
        )
      `)
      .is('user_id', null)

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    // Apply ordering - Supabase doesn't support ordering by nested fields in the query
    // We'll sort in memory after fetching
    const { data, error } = await query

    if (error) {
      return {
        data: null,
        error: {
          message: 'Failed to fetch unlinked players',
          details: error.message,
          code: error.code || 'DATABASE_ERROR'
        }
      }
    }

    // Sort in memory since Supabase doesn't support nested field ordering
    const sortedData = (data || []).sort((a, b) => {
      // Sort by team name first
      const teamCompare = (a.teams?.name || '').localeCompare(b.teams?.name || '')
      if (teamCompare !== 0) return teamCompare
      
      // Then by jersey number (nulls last)
      if (a.jersey_number === null && b.jersey_number !== null) return 1
      if (a.jersey_number !== null && b.jersey_number === null) return -1
      if (a.jersey_number !== null && b.jersey_number !== null) {
        const jerseyCompare = a.jersey_number - b.jersey_number
        if (jerseyCompare !== 0) return jerseyCompare
      }
      
      // Finally by full name
      return a.full_name.localeCompare(b.full_name)
    })

    return {
      data: sortedData,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: 'Unexpected error fetching unlinked players',
        details: err instanceof Error ? err.message : 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      }
    }
  }
}

/**
 * Gets a single player by ID
 * 
 * @param playerId - The ID of the player
 * @returns Promise with the player data
 */
export async function getPlayer(
  playerId: number
): Promise<PlayerServiceResult<PlayerWithTeam>> {
  try {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        teams!inner(
          name,
          clubs!inner(
            name,
            sports!inner(
              name
            )
          )
        )
      `)
      .eq('id', playerId)
      .single()

    if (error) {
      return {
        data: null,
        error: {
          message: 'Failed to fetch player',
          details: error.message,
          code: error.code || 'DATABASE_ERROR'
        }
      }
    }

    return {
      data,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: 'Unexpected error fetching player',
        details: err instanceof Error ? err.message : 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      }
    }
  }
}

/**
 * Player statistics type
 */
export interface PlayerStatistics {
  player_id: number
  training_attendance_pct: number
  trainings_attended: number
  total_trainings: number
  match_attendance_pct: number
  matches_called_up: number
  total_matches: number
  avg_periods_played: number
}

/**
 * Deletes a player by ID
 * 
 * @param playerId - The ID of the player to delete
 * @returns Promise with the result
 */
export async function deletePlayer(
  playerId: number
): Promise<PlayerServiceResult<null>> {
  try {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId)

    if (error) {
      return {
        data: null,
        error: {
          message: 'Failed to delete player',
          details: error.message,
          code: error.code || 'DATABASE_ERROR'
        }
      }
    }

    return {
      data: null,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: 'Unexpected error deleting player',
        details: err instanceof Error ? err.message : 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      }
    }
  }
}

/**
 * Gets statistics for all players in a team
 * 
 * @param teamId - The ID of the team
 * @returns Promise with player statistics
 */
export async function getTeamPlayerStatistics(
  teamId: number
): Promise<PlayerServiceResult<PlayerStatistics[]>> {
  try {
    // Get all players for the team
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id')
      .eq('team_id', teamId)

    if (playersError) {
      return {
        data: null,
        error: {
          message: 'Failed to fetch players',
          details: playersError.message,
          code: playersError.code || 'DATABASE_ERROR'
        }
      }
    }

    if (!players || players.length === 0) {
      return {
        data: [],
        error: null
      }
    }

    const playerIds = players.map(p => p.id)

    // Get all trainings for the team
    const { data: trainings } = await supabase
      .from('training_sessions')
      .select('id')
      .eq('team_id', teamId)

    const totalTrainings = trainings?.length || 0
    const trainingIds = trainings?.map(t => t.id) || []

    // Get training attendance for all players
    let trainingAttendance: any[] = []
    if (trainingIds.length > 0 && playerIds.length > 0) {
      const { data } = await supabase
        .from('training_attendance')
        .select('player_id, status, training_id')
        .in('player_id', playerIds)
        .in('training_id', trainingIds)
      
      trainingAttendance = data || []
    }

    // Get all matches for the team
    const { data: matches } = await supabase
      .from('matches')
      .select('id')
      .eq('team_id', teamId)

    const totalMatches = matches?.length || 0
    const matchIds = matches?.map(m => m.id) || []

    // Get match call-ups for all players
    let callUps: any[] = []
    if (matchIds.length > 0 && playerIds.length > 0) {
      const { data } = await supabase
        .from('match_call_ups')
        .select('player_id, match_id')
        .in('player_id', playerIds)
        .in('match_id', matchIds)
      
      callUps = data || []
    }

    // Get match periods played
    let periods: any[] = []
    if (matchIds.length > 0 && playerIds.length > 0) {
      const { data } = await supabase
        .from('match_player_periods')
        .select('player_id, period, fraction, match_id')
        .in('player_id', playerIds)
        .in('match_id', matchIds)
      
      periods = data || []
    }

    // Calculate statistics for each player
    const statistics: PlayerStatistics[] = playerIds.map(playerId => {
      // Training stats
      const playerTrainings = trainingAttendance.filter(ta => ta.player_id === playerId)
      const trainingsAttended = playerTrainings.filter(ta => ta.status === 'on_time' || ta.status === 'late').length
      const trainingPct = totalTrainings > 0 ? Math.round((trainingsAttended / totalTrainings) * 100) : 0

      // Match stats
      const playerCallUps = callUps.filter(cu => cu.player_id === playerId)
      const matchesCalledUp = playerCallUps.length
      const matchPct = totalMatches > 0 ? Math.round((matchesCalledUp / totalMatches) * 100) : 0

      // Periods played
      const playerPeriods = periods.filter(p => p.player_id === playerId)
      let totalPeriods = 0
      playerPeriods.forEach(p => {
        if (p.fraction === 'FULL') totalPeriods += 1
        else if (p.fraction === 'HALF') totalPeriods += 0.5
      })
      const avgPeriods = matchesCalledUp > 0 ? parseFloat((totalPeriods / matchesCalledUp).toFixed(1)) : 0

      return {
        player_id: playerId,
        training_attendance_pct: trainingPct,
        trainings_attended: trainingsAttended,
        total_trainings: totalTrainings,
        match_attendance_pct: matchPct,
        matches_called_up: matchesCalledUp,
        total_matches: totalMatches,
        avg_periods_played: avgPeriods
      }
    })

    return {
      data: statistics,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: 'Unexpected error fetching statistics',
        details: err instanceof Error ? err.message : 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      }
    }
  }
}

/**
 * Data for creating a new player
 */
export interface CreatePlayerData {
  team_id: number
  full_name: string
  jersey_number?: number | null
}

/**
 * Data for updating a player
 */
export interface UpdatePlayerData {
  full_name?: string
  jersey_number?: number | null
}

/**
 * Creates a new player
 * 
 * @param data - The player data
 * @returns Promise with the created player
 */
export async function createPlayer(
  data: CreatePlayerData
): Promise<PlayerServiceResult<Player>> {
  try {
    const { data: player, error } = await supabase
      .from('players')
      .insert({
        team_id: data.team_id,
        full_name: data.full_name,
        jersey_number: data.jersey_number
      })
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: {
          message: 'Failed to create player',
          details: error.message,
          code: error.code || 'DATABASE_ERROR'
        }
      }
    }

    return {
      data: player,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: 'Unexpected error creating player',
        details: err instanceof Error ? err.message : 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      }
    }
  }
}

/**
 * Updates a player
 * 
 * @param playerId - The ID of the player to update
 * @param data - The updated player data
 * @returns Promise with the updated player
 */
export async function updatePlayer(
  playerId: number,
  data: UpdatePlayerData
): Promise<PlayerServiceResult<Player>> {
  try {
    const updateData: any = {}
    
    if (data.full_name !== undefined) {
      updateData.full_name = data.full_name
    }
    
    if (data.jersey_number !== undefined) {
      updateData.jersey_number = data.jersey_number
    }

    const { data: player, error } = await supabase
      .from('players')
      .update(updateData)
      .eq('id', playerId)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: {
          message: 'Failed to update player',
          details: error.message,
          code: error.code || 'DATABASE_ERROR'
        }
      }
    }

    return {
      data: player,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: 'Unexpected error updating player',
        details: err instanceof Error ? err.message : 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      }
    }
  }
}
