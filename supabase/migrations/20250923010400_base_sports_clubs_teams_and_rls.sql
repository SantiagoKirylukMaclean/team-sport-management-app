-- 20250923010400_base_sports_clubs_teams_and_rls_STABLE.sql
-- Ajuste: helpers RLS con LANGUAGE sql STABLE (sin SECURITY DEFINER)
-- Supone que existen: enum app_role (super_admin, admin, coach, player) y tabla public.profiles(role app_role not null).

-- ========== Tablas base (idempotentes) ==========
create table if not exists public.sports (
  id bigserial primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);
alter table public.sports enable row level security;

create table if not exists public.clubs (
  id bigserial primary key,
  sport_id bigint not null references public.sports(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_clubs_sport on public.clubs(sport_id);
alter table public.clubs enable row level security;

create table if not exists public.teams (
  id bigserial primary key,
  club_id bigint not null references public.clubs(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_teams_club on public.teams(club_id);
alter table public.teams enable row level security;

create table if not exists public.user_team_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id bigint not null references public.teams(id) on delete cascade,
  role app_role not null check (role in ('admin','coach')),
  created_at timestamptz not null default now(),
  primary key(user_id, team_id, role)
);
alter table public.user_team_roles enable row level security;

-- ========== Helpers RLS (LANGUAGE sql STABLE) ==========
create or replace function public.is_superadmin()
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  );
$$;

create or replace function public.is_coach_of_team(p_team_id bigint)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.user_team_roles utr
    where utr.user_id = auth.uid()
      and utr.team_id = p_team_id
      and utr.role in ('coach','admin')
  );
$$;

-- ========== Policies RLS ==========
-- profiles se asume ya tiene sus policies

-- SPORTS
drop policy if exists "sports superadmin all" on public.sports;
create policy "sports superadmin all" on public.sports
  for all using ( public.is_superadmin() ) with check ( public.is_superadmin() );

-- Lectura transitiva de sports para coach/admin con teams del sport
drop policy if exists "sports coach read by team" on public.sports;
create policy "sports coach read by team" on public.sports
  for select using (
    exists (
      select 1
      from public.user_team_roles utr
      join public.teams t on t.id = utr.team_id
      join public.clubs c on c.id = t.club_id
      where utr.user_id = auth.uid()
        and c.sport_id = public.sports.id
    )
  );

-- CLUBS
drop policy if exists "clubs superadmin all" on public.clubs;
create policy "clubs superadmin all" on public.clubs
  for all using ( public.is_superadmin() ) with check ( public.is_superadmin() );

drop policy if exists "clubs coach read by team" on public.clubs;
create policy "clubs coach read by team" on public.clubs
  for select using (
    exists (
      select 1
      from public.user_team_roles utr
      join public.teams t on t.id = utr.team_id
      where utr.user_id = auth.uid()
        and t.club_id = public.clubs.id
    )
  );

-- TEAMS
drop policy if exists "teams superadmin all" on public.teams;
create policy "teams superadmin all" on public.teams
  for all using ( public.is_superadmin() ) with check ( public.is_superadmin() );

drop policy if exists "teams coach read own" on public.teams;
create policy "teams coach read own" on public.teams
  for select using ( public.is_coach_of_team(public.teams.id) );

-- USER_TEAM_ROLES
drop policy if exists "utr superadmin all" on public.user_team_roles;
create policy "utr superadmin all" on public.user_team_roles
  for all using ( public.is_superadmin() ) with check ( public.is_superadmin() );

drop policy if exists "utr self read" on public.user_team_roles;
create policy "utr self read" on public.user_team_roles
  for select using ( user_id = auth.uid() or public.is_superadmin() );

-- ========== Seeds (opcionales, idempotentes) ==========
insert into public.sports(name) values ('Fútbol') on conflict do nothing;

insert into public.clubs(sport_id, name)
select id, 'Monopol CE' from public.sports where name='Fútbol'
on conflict do nothing;

insert into public.teams(club_id, name)
select c.id, 'S9A'
from public.clubs c
join public.sports s on s.id = c.sport_id and s.name = 'Fútbol'
on conflict do nothing;
