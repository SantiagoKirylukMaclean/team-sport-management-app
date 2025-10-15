-- 20250923020000_invites_and_trigger.sql
-- User invitation system: pending_invites table, RLS policies, and automatic processing trigger

-- ========== Create pending_invites table ==========
create table if not exists public.pending_invites (
  id bigserial primary key,
  email text not null unique,
  display_name text,
  role app_role not null check (role in ('coach','admin')),
  team_ids bigint[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','accepted','canceled')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  
  -- Constraints
  constraint pending_invites_email_format check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  constraint pending_invites_team_ids_not_empty check (array_length(team_ids, 1) > 0)
);

-- ========== Create indexes for performance ==========
create index if not exists idx_pending_invites_email on public.pending_invites(email);
create index if not exists idx_pending_invites_status on public.pending_invites(status);
create index if not exists idx_pending_invites_created_by on public.pending_invites(created_by);
create index if not exists idx_pending_invites_created_at on public.pending_invites(created_at);

-- ========== Enable RLS ==========
alter table public.pending_invites enable row level security;

-- ========== RLS Policies ==========
-- SUPER_ADMIN has full access to all invitations
drop policy if exists "pi_superadmin_all" on public.pending_invites;
create policy "pi_superadmin_all" on public.pending_invites
  for all using (public.is_superadmin()) 
  with check (public.is_superadmin());

-- Users can read invitations they created
drop policy if exists "pi_owner_read" on public.pending_invites;
create policy "pi_owner_read" on public.pending_invites
  for select using (created_by = auth.uid() or public.is_superadmin());

-- Only SUPER_ADMIN can insert invitations (enforced by application logic)
drop policy if exists "pi_superadmin_insert" on public.pending_invites;
create policy "pi_superadmin_insert" on public.pending_invites
  for insert with check (public.is_superadmin());

-- Only SUPER_ADMIN can update invitations (for status changes)
drop policy if exists "pi_superadmin_update" on public.pending_invites;
create policy "pi_superadmin_update" on public.pending_invites
  for update using (public.is_superadmin()) 
  with check (public.is_superadmin());

-- ========== Trigger function to process invitations ==========
create or replace function public.apply_pending_invite()
returns trigger 
language plpgsql 
security definer 
set search_path = public
as $function$
declare
  invite_record public.pending_invites%rowtype;
  team_id bigint;
begin
  -- Find matching pending invitation by email (case-insensitive)
  select * into invite_record
  from public.pending_invites
  where lower(email) = lower(NEW.email)
    and status = 'pending'
  limit 1;
  
  -- If no pending invitation found, exit early
  if invite_record is null then
    return NEW;
  end if;
  
  -- Create or update profile with the invitation role
  insert into public.profiles (id, email, display_name, role)
  values (
    NEW.id, 
    NEW.email, 
    coalesce(invite_record.display_name, NEW.email), 
    invite_record.role
  )
  on conflict (id) do update set
    role = excluded.role,
    display_name = coalesce(excluded.display_name, profiles.display_name),
    email = excluded.email;
  
  -- Assign user to all specified teams
  foreach team_id in array invite_record.team_ids
  loop
    -- Verify team exists before creating assignment
    if exists (select 1 from public.teams where id = team_id) then
      insert into public.user_team_roles (user_id, team_id, role)
      values (NEW.id, team_id, invite_record.role)
      on conflict (user_id, team_id, role) do nothing;
    end if;
  end loop;
  
  -- Mark invitation as accepted
  update public.pending_invites
  set 
    status = 'accepted',
    accepted_at = now()
  where id = invite_record.id;
  
  return NEW;
exception
  when others then
    -- Log error but don't fail the user creation
    raise warning 'Error processing pending invitation for %: %', NEW.email, SQLERRM;
    return NEW;
end;
$function$;

-- ========== Create trigger ==========
drop trigger if exists trg_apply_pending_invite on auth.users;
create trigger trg_apply_pending_invite
  after insert on auth.users
  for each row execute function public.apply_pending_invite();

-- ========== Grant necessary permissions ==========
-- Grant usage on the sequence to authenticated users (needed for RLS)
grant usage on sequence public.pending_invites_id_seq to authenticated;

-- Grant select on pending_invites to authenticated users (RLS will filter)
grant select on public.pending_invites to authenticated;

-- Grant insert/update/delete to authenticated users (RLS will filter)
grant insert, update, delete on public.pending_invites to authenticated;