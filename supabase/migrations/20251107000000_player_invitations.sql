-- 20251107000000_player_invitations.sql
-- Extend invitation system to support player invitations with player linkage

-- ========== Add user_id to players table ==========
-- This links a player record to an authenticated user (profile)
alter table public.players 
add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Create index for performance
create index if not exists idx_players_user_id on public.players(user_id);

-- Add unique constraint to ensure one user per player
alter table public.players 
drop constraint if exists uniq_players_user_id;

alter table public.players 
add constraint uniq_players_user_id unique (user_id);

-- ========== Extend pending_invites to support player role ==========
-- Drop the old constraint that only allowed coach/admin
alter table public.pending_invites 
drop constraint if exists pending_invites_role_check;

-- Add new constraint that includes player
alter table public.pending_invites 
add constraint pending_invites_role_check 
check (role in ('coach', 'admin', 'player'));

-- Add player_id column to link invitation to specific player
alter table public.pending_invites 
add column if not exists player_id bigint references public.players(id) on delete cascade;

-- Create index for player_id lookups
create index if not exists idx_pending_invites_player_id on public.pending_invites(player_id);

-- ========== Update trigger function to handle player invitations ==========
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
  
  -- Handle player-specific logic
  if invite_record.role = 'player' and invite_record.player_id is not null then
    -- Link the player record to this user
    update public.players
    set user_id = NEW.id
    where id = invite_record.player_id;
    
    -- Also create user_team_roles entry for the player's team
    insert into public.user_team_roles (user_id, team_id, role)
    select NEW.id, p.team_id, 'player'
    from public.players p
    where p.id = invite_record.player_id
    on conflict (user_id, team_id, role) do nothing;
  else
    -- Handle coach/admin: assign to all specified teams
    foreach team_id in array invite_record.team_ids
    loop
      -- Verify team exists before creating assignment
      if exists (select 1 from public.teams where id = team_id) then
        insert into public.user_team_roles (user_id, team_id, role)
        values (NEW.id, team_id, invite_record.role)
        on conflict (user_id, team_id, role) do nothing;
      end if;
    end loop;
  end if;
  
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

-- ========== Add RLS policy for players to see their own data ==========
-- Players can read their own player record
drop policy if exists "players_own_read" on public.players;
create policy "players_own_read"
on public.players
for select
using (user_id = auth.uid());

-- ========== Comments for documentation ==========
comment on column public.players.user_id is 'Links player to authenticated user profile. Null if player has no account yet.';
comment on column public.pending_invites.player_id is 'For player invitations, specifies which player record to link to the new user.';
