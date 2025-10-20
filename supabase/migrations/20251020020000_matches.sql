-- 20251020020000_matches.sql
-- Partidos + períodos FULL/HALF, con RLS por equipo.
-- Requiere helpers: public.is_superadmin(), public.is_coach_of_team(bigint)

-- 1) Enum de fracción de periodo
do $$ begin
  if not exists (select 1 from pg_type where typname = 'period_fraction') then
    create type period_fraction as enum ('FULL','HALF');
  else
    -- asegurar valores (en mayúscula por definición de negocio)
    if not exists (select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid
                   where t.typname='period_fraction' and e.enumlabel='FULL') then
      alter type period_fraction add value 'FULL';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid
                   where t.typname='period_fraction' and e.enumlabel='HALF') then
      alter type period_fraction add value 'HALF';
    end if;
  end if;
end $$;

-- 2) Tabla de partidos
create table if not exists public.matches (
  id bigserial primary key,
  team_id bigint not null references public.teams(id) on delete cascade,
  opponent text not null,
  match_date date not null,
  location text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_matches_team on public.matches(team_id);
alter table public.matches enable row level security;

-- 3) Tabla de participación por período
create table if not exists public.match_player_periods (
  match_id bigint not null references public.matches(id) on delete cascade,
  player_id bigint not null references public.players(id) on delete cascade,
  period smallint not null check (period between 1 and 4),
  fraction period_fraction not null,
  created_at timestamptz not null default now(),
  primary key (match_id, player_id, period)
);
alter table public.match_player_periods enable row level security;

-- 4) Policies
-- matches: super_admin all
drop policy if exists "m superadmin all" on public.matches;
create policy "m superadmin all" on public.matches
  for all using ( public.is_superadmin() ) with check ( public.is_superadmin() );

-- matches: coach/admin CRUD si es coach del team
drop policy if exists "m coach crud" on public.matches;
create policy "m coach crud" on public.matches
  for all using ( public.is_coach_of_team(team_id) )
  with check ( public.is_coach_of_team(team_id) );

-- match_player_periods: super_admin all
drop policy if exists "mpp superadmin all" on public.match_player_periods;
create policy "mpp superadmin all" on public.match_player_periods
  for all using ( public.is_superadmin() ) with check ( public.is_superadmin() );

-- match_player_periods: coach/admin CRUD sólo si el match.team_id coincide con el player.team_id y es coach de ese team
drop policy if exists "mpp coach crud" on public.match_player_periods;
create policy "mpp coach crud" on public.match_player_periods
  for all using (
    exists (
      select 1
      from public.matches m
      join public.players p on p.team_id = m.team_id
      where m.id = match_id
        and p.id = player_id
        and public.is_coach_of_team(m.team_id)
    )
  )
  with check (
    exists (
      select 1
      from public.matches m
      join public.players p on p.team_id = m.team_id
      where m.id = match_id
        and p.id = player_id
        and public.is_coach_of_team(m.team_id)
    )
  );
