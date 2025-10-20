-- 20251020000000_players.sql
-- Tabla de jugadores + RLS por equipo.
-- Requiere: public.is_superadmin(), public.is_coach_of_team(bigint)

create table if not exists public.players (
  id bigserial primary key,
  team_id bigint not null references public.teams(id) on delete cascade,
  full_name text not null,
  jersey_number int,
  created_at timestamptz not null default now()
);

create index if not exists idx_players_team on public.players(team_id);

-- (Opcional) número de camiseta único por equipo
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'uniq_players_team_jersey'
      and conrelid = 'public.players'::regclass
  ) then
    alter table public.players
      add constraint uniq_players_team_jersey unique (team_id, jersey_number);
  end if;
exception when others then
  -- si falla por datos nulos previos, ignorar
  null;
end $$;

alter table public.players enable row level security;

-- Policies
-- IMPORTANTE: Postgres no tiene CREATE POLICY IF NOT EXISTS -> usar DROP/CREATE

-- super_admin: all
drop policy if exists "players superadmin all" on public.players;
create policy "players superadmin all"
on public.players
for all
using (public.is_superadmin())
with check (public.is_superadmin());

-- coach/admin del equipo: CRUD
drop policy if exists "players coach crud" on public.players;
create policy "players coach crud"
on public.players
for all
using ( public.is_coach_of_team(team_id) )
with check ( public.is_coach_of_team(team_id) );
