import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface InviteUserRequest {
  email: string;
  display_name?: string;
  role: 'coach' | 'admin' | 'player';
  teamIds: number[];
  playerId?: number; // For player invitations
  redirectTo?: string;
}

interface InviteUserResponse {
  ok: boolean;
  action_link?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Validate JWT and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify SUPER_ADMIN role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || (profile.role !== 'super_admin' && profile.role !== 'admin')) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Insufficient permissions. Admin or Super Admin role required.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const body: InviteUserRequest = await req.json()
    
    // Validate required fields
    if (!body.email || !body.role || !body.teamIds || body.teamIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Missing required fields: email, role, and teamIds are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate role
    if (!['coach', 'admin', 'player'].includes(body.role)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid role. Must be "coach", "admin", or "player"' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate player-specific requirements
    if (body.role === 'player') {
      if (!body.playerId) {
        return new Response(
          JSON.stringify({ ok: false, error: 'playerId is required for player invitations' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Verify player exists and is not already linked
      const { data: player, error: playerError } = await supabaseAdmin
        .from('players')
        .select('id, user_id, team_id')
        .eq('id', body.playerId)
        .single()

      if (playerError || !player) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Player not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (player.user_id) {
        return new Response(
          JSON.stringify({ ok: false, error: 'This player already has a linked account' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // For players, teamIds should match the player's team
      if (body.teamIds.length !== 1 || body.teamIds[0] !== player.team_id) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Player must be assigned to their team only' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate team IDs exist
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('id')
      .in('id', body.teamIds)

    if (teamsError) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to validate team IDs' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (teams.length !== body.teamIds.length) {
      return new Response(
        JSON.stringify({ ok: false, error: 'One or more team IDs are invalid' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user already exists by querying profiles table
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .single()
    
    let userId: string

    if (existingProfile) {
      // User exists, use existing user ID
      userId = existingProfile.id
    } else {
      // Create new user
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        email_confirm: true,
        user_metadata: {
          display_name: body.display_name || body.email.split('@')[0]
        }
      })

      if (createUserError || !newUser.user) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: `Failed to create user: ${createUserError?.message || 'Unknown error'}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      userId = newUser.user.id
    }

    // Generate magic link for invitation
    // Default to localhost:5173 for development, or use provided redirectTo
    const defaultRedirect = Deno.env.get('REDIRECT_URL') || 'http://localhost:5173'
    const redirectTo = body.redirectTo || defaultRedirect
    
    const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: body.email,
      options: {
        redirectTo: redirectTo
      }
    })

    if (magicLinkError || !magicLinkData.properties?.action_link) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Failed to generate invitation link: ${magicLinkError?.message || 'Unknown error'}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Upsert pending invitation
    const inviteData: any = {
      email: body.email.toLowerCase(),
      display_name: body.display_name,
      role: body.role,
      team_ids: body.teamIds,
      status: 'pending',
      created_by: user.id
    }

    // Add player_id for player invitations
    if (body.role === 'player' && body.playerId) {
      inviteData.player_id = body.playerId
    }

    const { error: inviteError } = await supabaseAdmin
      .from('pending_invites')
      .upsert(inviteData, {
        onConflict: 'email'
      })

    if (inviteError) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Failed to create invitation record: ${inviteError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Return success response with action link
    const response: InviteUserResponse = {
      ok: true,
      action_link: magicLinkData.properties.action_link
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in invite-user function:', error)
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})