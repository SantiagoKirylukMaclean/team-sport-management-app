# User Invitation System - Migration Guide

This document provides detailed instructions for implementing and migrating the user invitation system in your application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Migration](#database-migration)
3. [Edge Function Deployment](#edge-function-deployment)
4. [Frontend Integration](#frontend-integration)
5. [Configuration](#configuration)
6. [Testing the Migration](#testing-the-migration)
7. [Rollback Procedures](#rollback-procedures)
8. [Post-Migration Tasks](#post-migration-tasks)

## Prerequisites

Before starting the migration, ensure you have:

- [ ] Supabase project set up with authentication enabled
- [ ] Local development environment configured
- [ ] Database access with appropriate permissions
- [ ] Supabase CLI installed and configured
- [ ] Node.js and npm/yarn installed
- [ ] Existing user roles system (`app_role` enum with 'coach' and 'admin')

### Required Existing Schema

The invitation system assumes the following tables exist:

```sql
-- Users table (managed by Supabase Auth)
-- auth.users

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id),
  email text unique not null,
  display_name text,
  role app_role not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Teams table
create table public.teams (
  id bigserial primary key,
  name text not null,
  sport_id bigint references sports(id),
  club_id bigint references clubs(id),
  created_at timestamptz default now()
);

-- User team roles junction table
create table public.user_team_roles (
  id bigserial primary key,
  user_id uuid references profiles(id),
  team_id bigint references teams(id),
  role app_role not null,
  created_at timestamptz default now(),
  unique(user_id, team_id)
);
```

## Database Migration

### Step 1: Create Migration File

Create a new migration file in your Supabase project:

```bash
supabase migration new invitation_system
```

### Step 2: Add Migration Content

Copy the following SQL to your migration file:

```sql
-- Migration: User Invitation System
-- File: supabase/migrations/YYYYMMDD_invitation_system.sql

-- Create pending_invites table
create table public.pending_invites (
  id bigserial primary key,
  email text not null unique,
  role app_role not null check (role in ('coach','admin')),
  team_ids bigint[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','accepted','canceled')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now(),
  accepted_at timestamptz,
  expires_at timestamptz -- Optional: for invitation expiration
);

-- Create indexes for performance
create index idx_pending_invites_email on public.pending_invites(email);
create index idx_pending_invites_status on public.pending_invites(status);
create index idx_pending_invites_created_by on public.pending_invites(created_by);
create index idx_pending_invites_created_at on public.pending_invites(created_at);

-- Enable RLS
alter table public.pending_invites enable row level security;

-- Create RLS policies
-- SUPER_ADMIN users have full access
create policy "pi_superadmin_all" on public.pending_invites
  for all using (public.is_superadmin()) 
  with check (public.is_superadmin());

-- Users can read invitations they created
create policy "pi_owner_read" on public.pending_invites
  for select using (created_by = auth.uid() or public.is_superadmin());

-- Create trigger function for automatic invitation processing
create or replace function public.apply_pending_invite()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  invite_record pending_invites%rowtype;
  team_id bigint;
begin
  -- Find matching pending invitation (case-insensitive email)
  select * into invite_record 
  from pending_invites 
  where lower(email) = lower(new.email) 
  and status = 'pending'
  and (expires_at is null or expires_at > now())
  limit 1;
  
  -- If invitation found, process it
  if found then
    -- Create or update profile
    insert into profiles (id, email, display_name, role)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), invite_record.role)
    on conflict (id) do update set
      role = invite_record.role,
      display_name = coalesce(excluded.display_name, profiles.display_name),
      updated_at = now();
    
    -- Assign user to teams
    foreach team_id in array invite_record.team_ids
    loop
      insert into user_team_roles (user_id, team_id, role)
      values (new.id, team_id, invite_record.role)
      on conflict (user_id, team_id) do update set
        role = invite_record.role;
    end loop;
    
    -- Mark invitation as accepted
    update pending_invites 
    set status = 'accepted', accepted_at = now()
    where id = invite_record.id;
  end if;
  
  return new;
end;
$$;

-- Create trigger
create trigger trg_apply_pending_invite
  after insert on auth.users
  for each row execute function public.apply_pending_invite();

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant select, insert, update on public.pending_invites to authenticated;
grant usage, select on sequence pending_invites_id_seq to authenticated;

-- Add helpful comments
comment on table public.pending_invites is 'Stores pending user invitations with team assignments';
comment on function public.apply_pending_invite() is 'Automatically processes invitations when users sign up';
comment on trigger trg_apply_pending_invite on auth.users is 'Triggers invitation processing on user creation';
```

### Step 3: Apply Migration

Apply the migration to your local development environment:

```bash
# Reset local database (if safe to do so)
supabase db reset

# Or apply specific migration
supabase migration up
```

### Step 4: Verify Migration

Check that all objects were created successfully:

```sql
-- Verify table exists
\d public.pending_invites

-- Check indexes
\di public.idx_pending_invites_*

-- Verify RLS policies
select schemaname, tablename, policyname, cmd, qual 
from pg_policies 
where tablename = 'pending_invites';

-- Check trigger exists
select tgname, tgrelid::regclass, tgfoid::regproc 
from pg_trigger 
where tgname = 'trg_apply_pending_invite';
```

## Edge Function Deployment

### Step 1: Create Edge Function

Create the Edge Function directory and files:

```bash
mkdir -p supabase/functions/invite-user
```

### Step 2: Add Function Code

Create `supabase/functions/invite-user/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface InviteUserRequest {
  email: string
  display_name?: string
  role: 'coach' | 'admin'
  teamIds: number[]
  redirectTo?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user is SUPER_ADMIN
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid token')
    }

    // Check user role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'super_admin') {
      throw new Error('Insufficient permissions')
    }

    // Parse request body
    const { email, display_name, role, teamIds, redirectTo }: InviteUserRequest = await req.json()

    // Validate input
    if (!email || !role || !teamIds || teamIds.length === 0) {
      throw new Error('Missing required fields')
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email)

    let userId: string
    
    if (existingUser.user) {
      userId = existingUser.user.id
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { display_name }
      })

      if (createError || !newUser.user) {
        throw new Error(`Failed to create user: ${createError?.message}`)
      }

      userId = newUser.user.id
    }

    // Generate recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: redirectTo || `${req.headers.get('origin')}/auth/callback`
      }
    })

    if (linkError || !linkData.properties?.action_link) {
      throw new Error(`Failed to generate link: ${linkError?.message}`)
    }

    // Store/update pending invitation
    const { error: inviteError } = await supabaseAdmin
      .from('pending_invites')
      .upsert({
        email,
        role,
        team_ids: teamIds,
        status: 'pending',
        created_by: user.id
      }, {
        onConflict: 'email'
      })

    if (inviteError) {
      throw new Error(`Failed to store invitation: ${inviteError.message}`)
    }

    return new Response(
      JSON.stringify({
        ok: true,
        action_link: linkData.properties.action_link
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Invitation error:', error)
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
```

### Step 3: Create CORS Helper

Create `supabase/functions/_shared/cors.ts`:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### Step 4: Deploy Edge Function

Deploy the function to your Supabase project:

```bash
# Deploy to local development
supabase functions serve

# Deploy to production
supabase functions deploy invite-user
```

### Step 5: Test Edge Function

Test the function locally:

```bash
curl -X POST 'http://localhost:54321/functions/v1/invite-user' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "role": "coach",
    "teamIds": [1, 2]
  }'
```

## Frontend Integration

### Step 1: Install Dependencies

Add required dependencies to your project:

```bash
npm install @hookform/resolvers zod react-hook-form
```

### Step 2: Add Service Layer

Create `src/services/invites.ts`:

```typescript
import { supabase } from '../lib/supabase';

export interface InviteUserRequest {
  email: string;
  display_name?: string;
  role: 'coach' | 'admin';
  teamIds: number[];
  redirectTo?: string;
}

export interface InviteUserResponse {
  ok: boolean;
  action_link?: string;
  error?: string;
}

export interface PendingInvite {
  id: number;
  email: string;
  role: 'coach' | 'admin';
  team_ids: number[];
  status: 'pending' | 'accepted' | 'canceled';
  created_by: string;
  created_at: string;
  accepted_at?: string;
}

export const createInvitation = async (data: InviteUserRequest): Promise<InviteUserResponse> => {
  const { data: result, error } = await supabase.functions.invoke('invite-user', {
    body: data
  });

  if (error) {
    throw new Error(error.message);
  }

  return result;
};

export const listInvitations = async (status?: string): Promise<PendingInvite[]> => {
  let query = supabase
    .from('pending_invites')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};
```

### Step 3: Add Type Definitions

Update `src/types/db.ts` to include invitation types:

```typescript
export interface PendingInvite {
  id: number;
  email: string;
  role: 'coach' | 'admin';
  team_ids: number[];
  status: 'pending' | 'accepted' | 'canceled';
  created_by: string;
  created_at: string;
  accepted_at?: string;
  expires_at?: string;
}

export interface InviteUserRequest {
  email: string;
  display_name?: string;
  role: 'coach' | 'admin';
  teamIds: number[];
  redirectTo?: string;
}

export interface InviteUserResponse {
  ok: boolean;
  action_link?: string;
  error?: string;
}
```

### Step 4: Add Components

The invitation components should already be implemented. If not, refer to the existing files:

- `src/pages/admin/InviteUserPage.tsx`
- `src/components/ui/team-multi-select.tsx`
- `src/components/ui/invitation-result.tsx`

### Step 5: Update Routing

Add invitation routes to your admin routing:

```typescript
// src/routes/AdminRoutes.tsx
import { InviteUserPage } from '../pages/admin/InviteUserPage';
import { InvitationManagementPage } from '../pages/admin/InvitationManagementPage';

// Add to your route configuration
{
  path: '/admin/invite',
  element: <InviteUserPage />
},
{
  path: '/admin/invitations',
  element: <InvitationManagementPage />
}
```

## Configuration

### Step 1: Environment Variables

Ensure the following environment variables are set:

**Local Development (.env.local):**
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Supabase Edge Function Environment:**
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 2: Supabase Configuration

Update your Supabase configuration if needed:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 3: Authentication Configuration

Ensure your authentication flow supports the invitation system:

```typescript
// Update your auth callback handler to support recovery links
// This should redirect users to password setup after clicking invitation links
```

## Testing the Migration

### Step 1: Database Tests

Test the database components:

```sql
-- Test invitation creation
insert into pending_invites (email, role, team_ids, created_by)
values ('test@example.com', 'coach', array[1,2], auth.uid());

-- Test trigger (simulate user signup)
insert into auth.users (id, email, email_confirmed_at)
values (gen_random_uuid(), 'test@example.com', now());

-- Verify results
select * from profiles where email = 'test@example.com';
select * from user_team_roles where user_id = (select id from profiles where email = 'test@example.com');
select * from pending_invites where email = 'test@example.com';
```

### Step 2: Edge Function Tests

Test the Edge Function:

```bash
# Test with valid SUPER_ADMIN token
curl -X POST 'http://localhost:54321/functions/v1/invite-user' \
  -H 'Authorization: Bearer YOUR_SUPER_ADMIN_JWT' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "newcoach@example.com",
    "display_name": "New Coach",
    "role": "coach",
    "teamIds": [1, 2, 3]
  }'

# Test with invalid token (should fail)
curl -X POST 'http://localhost:54321/functions/v1/invite-user' \
  -H 'Authorization: Bearer invalid_token' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "role": "coach",
    "teamIds": [1]
  }'
```

### Step 3: Frontend Tests

Run the existing test suite:

```bash
# Run all tests
npm test

# Run specific invitation tests
npm test -- --grep "invitation"

# Run integration tests
npm test -- src/__tests__/InvitationWorkflow.integration.test.tsx
```

### Step 4: End-to-End Testing

1. **Create Invitation**: Use the admin interface to create an invitation
2. **Receive Link**: Verify the invitation link is generated
3. **Accept Invitation**: Click the link and complete signup
4. **Verify Assignment**: Check that user is assigned to correct teams with correct role

## Rollback Procedures

### Step 1: Rollback Database Changes

If you need to rollback the database migration:

```sql
-- Remove trigger
drop trigger if exists trg_apply_pending_invite on auth.users;

-- Remove function
drop function if exists public.apply_pending_invite();

-- Remove RLS policies
drop policy if exists "pi_superadmin_all" on public.pending_invites;
drop policy if exists "pi_owner_read" on public.pending_invites;

-- Remove table
drop table if exists public.pending_invites;
```

### Step 2: Rollback Edge Function

Remove the Edge Function:

```bash
# This will remove the function from Supabase
supabase functions delete invite-user
```

### Step 3: Rollback Frontend Changes

1. Remove invitation routes from routing configuration
2. Remove invitation service files
3. Remove invitation components
4. Remove invitation-related types

### Step 4: Clean Up Data

If you need to clean up any test data:

```sql
-- Remove test invitations
delete from pending_invites where email like '%test%';

-- Remove test user assignments (be careful!)
delete from user_team_roles where user_id in (
  select id from profiles where email like '%test%'
);
```

## Post-Migration Tasks

### Step 1: Documentation Updates

- [ ] Update API documentation
- [ ] Update user guides
- [ ] Update admin documentation
- [ ] Create troubleshooting guides

### Step 2: Monitoring Setup

Set up monitoring for:

- [ ] Invitation creation rates
- [ ] Invitation acceptance rates
- [ ] Edge Function performance
- [ ] Database trigger performance
- [ ] Error rates and types

### Step 3: Security Review

- [ ] Review RLS policies
- [ ] Test permission boundaries
- [ ] Audit invitation access logs
- [ ] Review Edge Function security

### Step 4: Performance Optimization

- [ ] Monitor database query performance
- [ ] Optimize indexes if needed
- [ ] Monitor Edge Function cold starts
- [ ] Set up caching if appropriate

### Step 5: User Training

- [ ] Train SUPER_ADMIN users on invitation system
- [ ] Create user guides and tutorials
- [ ] Set up support processes
- [ ] Document common issues and solutions

## Troubleshooting Common Migration Issues

### Issue: Migration Fails with Permission Error

**Solution:**
```sql
-- Ensure you have the right permissions
grant usage on schema public to postgres;
grant all on all tables in schema public to postgres;
```

### Issue: Edge Function Deploy Fails

**Solution:**
```bash
# Check Supabase CLI is logged in
supabase login

# Verify project is linked
supabase projects list
supabase link --project-ref YOUR_PROJECT_REF
```

### Issue: Trigger Not Executing

**Solution:**
```sql
-- Check trigger exists and is enabled
select * from pg_trigger where tgname = 'trg_apply_pending_invite';

-- Check function exists
select * from pg_proc where proname = 'apply_pending_invite';

-- Test manually
select public.apply_pending_invite();
```

### Issue: RLS Blocking Access

**Solution:**
```sql
-- Temporarily disable RLS for testing
alter table pending_invites disable row level security;

-- Test queries
select * from pending_invites;

-- Re-enable RLS
alter table pending_invites enable row level security;

-- Check policies
select * from pg_policies where tablename = 'pending_invites';
```

This migration guide provides a comprehensive approach to implementing the user invitation system. Follow each step carefully and test thoroughly before deploying to production.