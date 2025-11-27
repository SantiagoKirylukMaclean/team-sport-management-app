-- Fix infinite recursion in RLS policies by using SECURITY DEFINER
-- This allows the functions to bypass RLS checks when querying the profiles table

-- Fix is_superadmin
create or replace function public.is_superadmin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  );
$$;

-- Fix is_coach_of_team (good practice to fix this one too)
create or replace function public.is_coach_of_team(p_team_id bigint)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1
    from public.user_team_roles utr
    where utr.user_id = auth.uid()
      and utr.team_id = p_team_id
      and utr.role in ('coach','admin')
  );
$$;
