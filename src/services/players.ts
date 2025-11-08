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
