import { supabase } from '@/lib/supabase'
import type {
  PendingInvite,
  InviteUserRequest,
  InviteUserResponse
} from '@/types/db'

/**
 * Service error type for consistent error handling
 */
export interface InviteServiceError {
  message: string
  details?: string
  code?: string
}

/**
 * Result type for service functions
 */
export type InviteServiceResult<T> = {
  data: T
  error: null
} | {
  data: null
  error: InviteServiceError
}

/**
 * Creates a new invitation by calling the Edge Function
 * 
 * @param request - The invitation request data
 * @returns Promise with the invitation result containing the action link
 */
export async function createInvitation(
  request: InviteUserRequest
): Promise<InviteServiceResult<InviteUserResponse>> {
  try {
    // Validate request data
    if (!request.email || !request.role || !request.teamIds?.length) {
      return {
        data: null,
        error: {
          message: 'Invalid request data',
          details: 'Email, role, and at least one team are required',
          code: 'VALIDATION_ERROR'
        }
      }
    }

    // Get the current session to include the JWT token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return {
        data: null,
        error: {
          message: 'Authentication required',
          details: sessionError?.message || 'No active session found. Please log in again.',
          code: 'AUTH_ERROR'
        }
      }
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: request,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      clearTimeout(timeoutId)

      if (error) {
        // Enhanced error handling based on error type
        let message = 'Failed to create invitation'
        let details = error.message
        let code = 'EDGE_FUNCTION_ERROR'

        if (error.message?.includes('timeout')) {
          message = 'Request timed out'
          details = 'The server took too long to respond. Please try again.'
          code = 'TIMEOUT_ERROR'
        } else if (error.message?.includes('network')) {
          message = 'Network error'
          details = 'Please check your internet connection and try again.'
          code = 'NETWORK_ERROR'
        } else if (error.message?.includes('unauthorized')) {
          message = 'Unauthorized access'
          details = 'You do not have permission to create invitations.'
          code = 'UNAUTHORIZED_ERROR'
        }

        return {
          data: null,
          error: { message, details, code }
        }
      }

      // Check if the Edge Function returned an error
      if (!data || !data.ok) {
        const errorMessage = data?.error || 'Unknown error occurred'
        let message = 'Failed to create invitation'
        let details = errorMessage
        let code = 'INVITATION_ERROR'

        if (errorMessage.includes('email')) {
          message = 'Email validation failed'
          details = 'Please check the email address and try again.'
          code = 'EMAIL_ERROR'
        } else if (errorMessage.includes('team')) {
          message = 'Team validation failed'
          details = 'One or more selected teams are invalid or no longer exist.'
          code = 'TEAM_ERROR'
        } else if (errorMessage.includes('role')) {
          message = 'Role validation failed'
          details = 'The selected role is invalid.'
          code = 'ROLE_ERROR'
        }

        return {
          data: null,
          error: { message, details, code }
        }
      }

      return {
        data: data as InviteUserResponse,
        error: null
      }

    } catch (timeoutError: any) {
      clearTimeout(timeoutId)
      if (timeoutError?.name === 'AbortError') {
        return {
          data: null,
          error: {
            message: 'Request timed out',
            details: 'The invitation creation took too long. Please try again.',
            code: 'TIMEOUT_ERROR'
          }
        }
      }
      throw timeoutError
    }

  } catch (err) {
    let message = 'Unexpected error creating invitation'
    let details = 'An unexpected error occurred. Please try again.'
    let code = 'UNEXPECTED_ERROR'

    if (err instanceof Error) {
      details = err.message

      if (err.message.includes('fetch')) {
        message = 'Network error'
        details = 'Failed to connect to the server. Please check your internet connection.'
        code = 'NETWORK_ERROR'
      } else if (err.message.includes('JSON')) {
        message = 'Data parsing error'
        details = 'Invalid response from server. Please try again.'
        code = 'PARSE_ERROR'
      }
    }

    return {
      data: null,
      error: { message, details, code }
    }
  }
}

/**
 * Fetches invitation history with optional filtering
 * 
 * @param options - Query options for filtering and pagination
 * @returns Promise with the list of invitations
 */
export async function listInvitations(options: {
  status?: 'pending' | 'accepted' | 'canceled'
  from?: number
  to?: number
  email?: string
} = {}): Promise<InviteServiceResult<PendingInvite[]>> {
  try {
    const { status, from = 0, to = 24, email } = options

    let query = supabase
      .from('pending_invites')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (email) {
      query = query.ilike('email', `%${email}%`)
    }

    const { data, error } = await query

    if (error) {
      return {
        data: null,
        error: {
          message: 'Failed to fetch invitations',
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
        message: 'Unexpected error fetching invitations',
        details: err instanceof Error ? err.message : 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      }
    }
  }
}

/**
 * Cancels a pending invitation by updating its status
 * 
 * @param invitationId - The ID of the invitation to cancel
 * @returns Promise with the updated invitation
 */
export async function cancelInvitation(
  invitationId: number
): Promise<InviteServiceResult<PendingInvite>> {
  try {
    const { data, error } = await supabase
      .from('pending_invites')
      .update({ status: 'canceled' })
      .eq('id', invitationId)
      .eq('status', 'pending') // Only allow canceling pending invitations
      .select('*')
      .single()

    if (error) {
      return {
        data: null,
        error: {
          message: 'Failed to cancel invitation',
          details: error.message,
          code: error.code || 'DATABASE_ERROR'
        }
      }
    }

    if (!data) {
      return {
        data: null,
        error: {
          message: 'Invitation not found or cannot be canceled',
          details: 'The invitation may not exist or is not in pending status',
          code: 'NOT_FOUND'
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
        message: 'Unexpected error canceling invitation',
        details: err instanceof Error ? err.message : 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      }
    }
  }
}

/**
 * Gets a single invitation by ID
 * 
 * @param invitationId - The ID of the invitation to fetch
 * @returns Promise with the invitation data
 */
export async function getInvitation(
  invitationId: number
): Promise<InviteServiceResult<PendingInvite>> {
  try {
    const { data, error } = await supabase
      .from('pending_invites')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (error) {
      return {
        data: null,
        error: {
          message: 'Failed to fetch invitation',
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
        message: 'Unexpected error fetching invitation',
        details: err instanceof Error ? err.message : 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      }
    }
  }
}

/**
 * Team details for invitation display
 */
export interface TeamDetails {
  id: number
  name: string
  club_name: string
  sport_name: string
}

/**
 * Gets team details for multiple team IDs
 * 
 * @param teamIds - Array of team IDs to fetch details for
 * @returns Promise with team details
 */
export async function getTeamDetails(
  teamIds: number[]
): Promise<InviteServiceResult<TeamDetails[]>> {
  try {
    if (teamIds.length === 0) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        clubs!inner(
          name,
          sports!inner(
            name
          )
        )
      `)
      .in('id', teamIds)

    if (error) {
      return {
        data: null,
        error: {
          message: 'Failed to fetch team details',
          details: error.message,
          code: error.code || 'DATABASE_ERROR'
        }
      }
    }

    const teamDetails: TeamDetails[] = (data || []).map((team: any) => ({
      id: team.id,
      name: team.name,
      club_name: team.clubs.name,
      sport_name: team.clubs.sports.name
    }))

    return {
      data: teamDetails,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: {
        message: 'Unexpected error fetching team details',
        details: err instanceof Error ? err.message : 'Unknown error',
        code: 'UNEXPECTED_ERROR'
      }
    }
  }
}