# User Invitation System - Troubleshooting Guide

This guide helps diagnose and resolve common issues with the user invitation system.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Database Issues](#database-issues)
3. [Edge Function Issues](#edge-function-issues)
4. [Frontend Issues](#frontend-issues)
5. [Authentication & Authorization Issues](#authentication--authorization-issues)
6. [Performance Issues](#performance-issues)
7. [Integration Issues](#integration-issues)
8. [Common Error Messages](#common-error-messages)

## Quick Diagnostics

### System Health Check

Run this quick health check to identify potential issues:

```sql
-- 1. Check if invitation table exists and has data
select 
  count(*) as total_invitations,
  count(*) filter (where status = 'pending') as pending,
  count(*) filter (where status = 'accepted') as accepted,
  count(*) filter (where status = 'canceled') as canceled
from pending_invites;

-- 2. Check if trigger exists
select tgname, tgenabled 
from pg_trigger 
where tgname = 'trg_apply_pending_invite';

-- 3. Check RLS policies
select policyname, cmd, qual 
from pg_policies 
where tablename = 'pending_invites';

-- 4. Check recent invitation activity
select email, status, created_at, accepted_at
from pending_invites 
order by created_at desc 
limit 10;
```

### Edge Function Health Check

```bash
# Check if function is deployed
supabase functions list

# Test function with a simple request
curl -X POST 'https://your-project.supabase.co/functions/v1/invite-user' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"test": true}'
```

### Frontend Health Check

```typescript
// Test service connectivity
import { supabase } from '../lib/supabase';

const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('pending_invites').select('count');
    console.log('Database connection:', error ? 'Failed' : 'Success');
    
    const { data: funcData, error: funcError } = await supabase.functions.invoke('invite-user', {
      body: { test: true }
    });
    console.log('Edge function connection:', funcError ? 'Failed' : 'Success');
  } catch (error) {
    console.error('Connection test failed:', error);
  }
};
```

## Database Issues

### Issue: "Table pending_invites does not exist"

**Symptoms:**
- Error when querying invitation data
- Migration appears to have failed

**Diagnosis:**
```sql
-- Check if table exists
select exists (
  select from information_schema.tables 
  where table_schema = 'public' 
  and table_name = 'pending_invites'
);

-- Check migration history
select * from supabase_migrations.schema_migrations 
order by version desc;
```

**Solutions:**

1. **Re-run migration:**
```bash
supabase db reset
# or
supabase migration up
```

2. **Manual table creation:**
```sql
-- Create table manually (use migration content)
create table public.pending_invites (
  id bigserial primary key,
  email text not null unique,
  role app_role not null check (role in ('coach','admin')),
  team_ids bigint[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','accepted','canceled')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now(),
  accepted_at timestamptz
);
```

### Issue: "Permission denied for table pending_invites"

**Symptoms:**
- Users cannot access invitation data
- RLS blocking legitimate access

**Diagnosis:**
```sql
-- Check current user and role
select 
  auth.uid() as user_id,
  auth.role() as auth_role,
  (select role from profiles where id = auth.uid()) as user_role;

-- Test RLS policies
set role authenticated;
select * from pending_invites limit 1;
```

**Solutions:**

1. **Check user role:**
```sql
-- Verify user has SUPER_ADMIN role
update profiles set role = 'super_admin' where id = 'user-uuid';
```

2. **Review RLS policies:**
```sql
-- Check existing policies
select policyname, cmd, qual from pg_policies where tablename = 'pending_invites';

-- Temporarily disable RLS for testing
alter table pending_invites disable row level security;
-- Test access, then re-enable
alter table pending_invites enable row level security;
```

3. **Fix RLS policies:**
```sql
-- Drop and recreate policies
drop policy if exists "pi_superadmin_all" on public.pending_invites;
drop policy if exists "pi_owner_read" on public.pending_invites;

create policy "pi_superadmin_all" on public.pending_invites
  for all using (public.is_superadmin()) 
  with check (public.is_superadmin());

create policy "pi_owner_read" on public.pending_invites
  for select using (created_by = auth.uid() or public.is_superadmin());
```

### Issue: "Trigger not executing"

**Symptoms:**
- Users sign up but invitations remain pending
- Team assignments not created automatically

**Diagnosis:**
```sql
-- Check if trigger exists and is enabled
select 
  tgname,
  tgenabled,
  tgfoid::regproc as function_name
from pg_trigger 
where tgname = 'trg_apply_pending_invite';

-- Check trigger function exists
select proname, prosrc 
from pg_proc 
where proname = 'apply_pending_invite';

-- Test trigger manually
select public.apply_pending_invite();
```

**Solutions:**

1. **Recreate trigger:**
```sql
-- Drop and recreate trigger
drop trigger if exists trg_apply_pending_invite on auth.users;

create trigger trg_apply_pending_invite
  after insert on auth.users
  for each row execute function public.apply_pending_invite();
```

2. **Fix trigger function:**
```sql
-- Check function for errors
create or replace function public.apply_pending_invite()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  invite_record pending_invites%rowtype;
  team_id bigint;
begin
  -- Add logging for debugging
  raise notice 'Processing invitation for email: %', new.email;
  
  -- Your existing trigger logic here
  
  return new;
exception
  when others then
    raise notice 'Trigger error: %', sqlerrm;
    return new; -- Don't fail the user creation
end;
$$;
```

### Issue: "Foreign key constraint violation"

**Symptoms:**
- Error when creating invitations
- Team IDs don't exist

**Diagnosis:**
```sql
-- Check if team IDs exist
select id, name from teams where id = any(array[1,2,3]);

-- Check foreign key constraints
select 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints as tc
join information_schema.key_column_usage as kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage as ccu
  on ccu.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY' 
and tc.table_name = 'pending_invites';
```

**Solutions:**

1. **Validate team IDs before insertion:**
```typescript
// Frontend validation
const validateTeamIds = async (teamIds: number[]) => {
  const { data, error } = await supabase
    .from('teams')
    .select('id')
    .in('id', teamIds);
    
  if (error || data.length !== teamIds.length) {
    throw new Error('Some team IDs are invalid');
  }
};
```

2. **Fix data integrity:**
```sql
-- Remove invalid team IDs from existing invitations
update pending_invites 
set team_ids = array(
  select unnest(team_ids) 
  intersect 
  select id from teams
)
where array_length(team_ids, 1) > 0;
```

## Edge Function Issues

### Issue: "Function not found" or 404 Error

**Symptoms:**
- HTTP 404 when calling Edge Function
- Function appears not deployed

**Diagnosis:**
```bash
# Check deployed functions
supabase functions list

# Check function logs
supabase functions logs invite-user

# Test function endpoint
curl -I https://your-project.supabase.co/functions/v1/invite-user
```

**Solutions:**

1. **Deploy function:**
```bash
# Deploy function
supabase functions deploy invite-user

# Verify deployment
supabase functions list
```

2. **Check function code:**
```typescript
// Ensure function exports serve() correctly
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // Your function logic
  return new Response('OK')
})
```

### Issue: "Invalid JWT token" or Authentication Errors

**Symptoms:**
- 401 Unauthorized responses
- "Invalid token" errors

**Diagnosis:**
```typescript
// Check token format and expiration
const token = supabase.auth.session()?.access_token;
console.log('Token:', token);

// Decode JWT to check expiration
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires:', new Date(payload.exp * 1000));
```

**Solutions:**

1. **Refresh token:**
```typescript
// Ensure user is authenticated and token is fresh
const { data: { session }, error } = await supabase.auth.getSession();
if (!session) {
  // Redirect to login
}
```

2. **Check token in Edge Function:**
```typescript
// In Edge Function - improve token validation
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  throw new Error('Invalid authorization header format');
}

const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

if (error || !user) {
  throw new Error(`Token validation failed: ${error?.message}`);
}
```

### Issue: "Insufficient permissions" Error

**Symptoms:**
- Function rejects requests from valid users
- Role validation failing

**Diagnosis:**
```sql
-- Check user role in database
select id, email, role from profiles where id = 'user-uuid';

-- Check is_superadmin function
select public.is_superadmin();
```

**Solutions:**

1. **Fix user role:**
```sql
-- Grant SUPER_ADMIN role
update profiles set role = 'super_admin' where id = 'user-uuid';
```

2. **Check role validation logic:**
```typescript
// In Edge Function - improve role checking
const { data: profile, error: profileError } = await supabaseAdmin
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (profileError) {
  console.error('Profile lookup error:', profileError);
  throw new Error('Failed to verify user role');
}

if (profile?.role !== 'super_admin') {
  throw new Error(`Insufficient permissions. Required: super_admin, Got: ${profile?.role}`);
}
```

### Issue: "Failed to create user" Error

**Symptoms:**
- User creation fails in Edge Function
- Duplicate email errors

**Diagnosis:**
```typescript
// Check if user already exists
const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);
console.log('Existing user:', existingUser);
```

**Solutions:**

1. **Handle existing users:**
```typescript
// Improved user creation logic
let userId: string;

const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);

if (existingUser.user) {
  userId = existingUser.user.id;
  console.log('User already exists, using existing ID');
} else {
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name }
  });

  if (createError) {
    console.error('User creation error:', createError);
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  userId = newUser.user!.id;
}
```

## Frontend Issues

### Issue: "Network Error" or Request Failures

**Symptoms:**
- Requests to Edge Function fail
- CORS errors in browser

**Diagnosis:**
```typescript
// Check network connectivity
const testConnection = async () => {
  try {
    const response = await fetch('https://your-project.supabase.co/functions/v1/invite-user', {
      method: 'OPTIONS'
    });
    console.log('CORS preflight:', response.status);
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

**Solutions:**

1. **Fix CORS configuration:**
```typescript
// In Edge Function - ensure CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Handle OPTIONS requests
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

2. **Check request format:**
```typescript
// Ensure proper request format
const response = await supabase.functions.invoke('invite-user', {
  body: {
    email: 'test@example.com',
    role: 'coach',
    teamIds: [1, 2]
  }
});
```

### Issue: Form Validation Errors

**Symptoms:**
- Form won't submit
- Validation errors not clearing

**Diagnosis:**
```typescript
// Check form state
console.log('Form errors:', form.formState.errors);
console.log('Form values:', form.getValues());
console.log('Form valid:', form.formState.isValid);
```

**Solutions:**

1. **Fix validation schema:**
```typescript
// Ensure schema matches requirements
const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  display_name: z.string().min(2).optional(),
  role: z.enum(['coach', 'admin']),
  teamIds: z.array(z.number()).min(1, 'At least one team must be selected'),
  redirectTo: z.string().url().optional().or(z.literal(''))
});
```

2. **Clear errors properly:**
```typescript
// Clear errors when form resets
const resetForm = () => {
  form.reset();
  form.clearErrors();
};
```

### Issue: Team Selection Not Working

**Symptoms:**
- Teams not loading in multi-select
- Selection not updating form

**Diagnosis:**
```typescript
// Check team data loading
const { data: teams, error } = await supabase
  .from('teams')
  .select(`
    id,
    name,
    sport:sports(id, name),
    club:clubs(id, name)
  `);

console.log('Teams loaded:', teams?.length, 'Error:', error);
```

**Solutions:**

1. **Fix team query:**
```typescript
// Ensure proper team data structure
const loadTeams = async () => {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      sport_id,
      club_id,
      sports!inner(id, name),
      clubs!inner(id, name)
    `)
    .order('name');

  if (error) {
    console.error('Failed to load teams:', error);
    return [];
  }

  return data;
};
```

2. **Fix component state:**
```typescript
// Ensure proper state updates
const TeamMultiSelect = ({ value, onChange }) => {
  const handleTeamToggle = (teamId: number) => {
    const newValue = value.includes(teamId)
      ? value.filter(id => id !== teamId)
      : [...value, teamId];
    
    onChange(newValue);
  };
  
  // Rest of component
};
```

## Authentication & Authorization Issues

### Issue: "User not authenticated"

**Symptoms:**
- Redirected to login unexpectedly
- Auth state not persisting

**Diagnosis:**
```typescript
// Check auth state
const checkAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('Session:', session);
  console.log('User:', session?.user);
  console.log('Error:', error);
};
```

**Solutions:**

1. **Fix auth persistence:**
```typescript
// Ensure proper auth initialization
const initAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    // Update your auth context
  });
};
```

2. **Check auth guards:**
```typescript
// Ensure proper route protection
const AdminGuard = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/login" />;
  }
  
  return children;
};
```

### Issue: "Role verification failing"

**Symptoms:**
- Users with correct roles denied access
- Role checks inconsistent

**Diagnosis:**
```sql
-- Check user role in database
select 
  u.id,
  u.email,
  p.role,
  p.created_at,
  p.updated_at
from auth.users u
left join profiles p on u.id = p.id
where u.email = 'user@example.com';
```

**Solutions:**

1. **Sync user roles:**
```sql
-- Ensure profile exists for user
insert into profiles (id, email, role)
select id, email, 'super_admin'
from auth.users
where email = 'admin@example.com'
on conflict (id) do update set role = 'super_admin';
```

2. **Fix role checking function:**
```sql
-- Improve is_superadmin function
create or replace function public.is_superadmin()
returns boolean language sql security definer
as $$
  select exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'super_admin'
  );
$$;
```

## Performance Issues

### Issue: "Slow invitation creation"

**Symptoms:**
- Long delays when creating invitations
- Timeouts in Edge Function

**Diagnosis:**
```sql
-- Check database performance
explain analyze
select * from pending_invites where email = 'test@example.com';

-- Check for missing indexes
select schemaname, tablename, attname, n_distinct, correlation
from pg_stats
where tablename = 'pending_invites';
```

**Solutions:**

1. **Add database indexes:**
```sql
-- Add performance indexes
create index if not exists idx_pending_invites_email_status 
on pending_invites(email, status);

create index if not exists idx_pending_invites_created_by_status 
on pending_invites(created_by, status);
```

2. **Optimize Edge Function:**
```typescript
// Use connection pooling and optimize queries
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false
    }
  }
);
```

### Issue: "Trigger performance problems"

**Symptoms:**
- Slow user registration
- Database locks during signup

**Diagnosis:**
```sql
-- Check trigger performance
explain analyze
select public.apply_pending_invite();

-- Check for locks
select 
  pid,
  usename,
  query,
  state,
  query_start
from pg_stat_activity
where state = 'active';
```

**Solutions:**

1. **Optimize trigger logic:**
```sql
-- Use more efficient queries
create or replace function public.apply_pending_invite()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  invite_record pending_invites%rowtype;
begin
  -- Use single query with lock
  select * into invite_record 
  from pending_invites 
  where lower(email) = lower(new.email) 
  and status = 'pending'
  for update skip locked
  limit 1;
  
  if found then
    -- Process efficiently with batch operations
    -- ... rest of logic
  end if;
  
  return new;
end;
$$;
```

## Common Error Messages

### "duplicate key value violates unique constraint"

**Cause:** Trying to create invitation for existing email
**Solution:** Use UPSERT or check for existing invitations first

```sql
-- Use upsert instead of insert
insert into pending_invites (email, role, team_ids, created_by)
values ('test@example.com', 'coach', array[1,2], auth.uid())
on conflict (email) do update set
  role = excluded.role,
  team_ids = excluded.team_ids,
  status = 'pending',
  created_at = now();
```

### "function is_superadmin() does not exist"

**Cause:** Missing helper function for role checking
**Solution:** Create the function

```sql
create or replace function public.is_superadmin()
returns boolean language sql security definer
as $$
  select exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'super_admin'
  );
$$;
```

### "column team_ids does not exist"

**Cause:** Migration not applied or column name mismatch
**Solution:** Check migration and fix column name

```sql
-- Check actual column names
\d pending_invites

-- Fix if needed
alter table pending_invites rename column team_id to team_ids;
```

### "relation auth.users does not exist"

**Cause:** Trying to access auth schema without proper permissions
**Solution:** Use proper schema reference or service role

```sql
-- Use service role key for auth operations
-- Or reference through public schema if available
```

This troubleshooting guide covers the most common issues you'll encounter with the invitation system. For each issue, follow the diagnosis steps first to understand the root cause, then apply the appropriate solution.