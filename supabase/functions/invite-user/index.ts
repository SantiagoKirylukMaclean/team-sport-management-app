import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface InviteUserRequest {
  email: string;
  display_name?: string;
  role: 'coach' | 'admin';
  teamIds: number[];
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

    if (profileError || !profile || profile.role !== 'SUPER_ADMIN') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Insufficient permissions. SUPER_ADMIN role required.' }),
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
    if (!['coach', 'admin'].includes(body.role)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid role. Must be "coach" or "admin"' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
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

    // Check if user already exists
    const { data: existingUser, error: userLookupError } = await supabaseAdmin.auth.admin.getUserByEmail(body.email)
    
    let userId: string

    if (existingUser?.user) {
      // User exists, use existing user ID
      userId = existingUser.user.id
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

    // Generate recovery link
    const redirectTo = body.redirectTo || `${Deno.env.get('SUPABASE_URL')?.replace('/supabase', '')}/reset-password`
    
    const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: body.email,
      options: {
        redirectTo: redirectTo
      }
    })

    if (recoveryError || !recoveryData.properties?.action_link) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Failed to generate recovery link: ${recoveryError?.message || 'Unknown error'}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Upsert pending invitation
    const { error: inviteError } = await supabaseAdmin
      .from('pending_invites')
      .upsert({
        email: body.email.toLowerCase(),
        display_name: body.display_name,
        role: body.role,
        team_ids: body.teamIds,
        status: 'pending',
        created_by: user.id
      }, {
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
      action_link: recoveryData.properties.action_link
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