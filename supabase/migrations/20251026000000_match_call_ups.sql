-- 20251026000000_match_call_ups.sql
-- Sistema de convocatorias para partidos
-- Permite marcar qué jugadores están convocados para cada partido
-- Requiere: public.is_superadmin(), public.is_coach_of_team(bigint)

-- 1) Tabla de convocatorias
create table if not exists public.match_call_ups (
  match_id bigint not null references public.matches(id) on delete cascade,
  player_id bigint not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (match_id, player_id)
);

create index if not exists idx_match_call_ups_match on public.match_call_ups(match_id);
create index if not exists idx_match_call_ups_player on public.match_call_ups(player_id);

alter table public.match_call_ups enable row level security;

-- 2) Policies RLS

-- super_admin: acceso total
drop policy if exists "mcu superadmin all" on public.match_call_ups;
create policy "mcu superadmin all" on public.match_call_ups
  for all using ( public.is_superadmin() ) 
  with check ( public.is_superadmin() );

-- coach/admin: CRUD solo si es coach del equipo del partido Y del jugador
drop policy if exists "mcu coach crud" on public.match_call_ups;
create policy "mcu coach crud" on public.match_call_ups
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

-- 3) Vista helper: jugadores convocados con conteo de períodos jugados
create or replace view public.match_call_ups_with_periods as
select 
  c.match_id,
  c.player_id,
  c.created_at as called_up_at,
  coalesce(count(p.period), 0)::int as periods_played
from public.match_call_ups c
left join public.match_player_periods p 
  on p.match_id = c.match_id 
  and p.player_id = c.player_id
group by c.match_id, c.player_id, c.created_at;

-- 4) Función de validación: retorna jugadores convocados que no cumplen mínimo 2 períodos
create or replace function public.validate_match_minimum_periods(p_match_id bigint)
returns table (
  player_id bigint,
  full_name text,
  periods_played int
)
language sql
stable
as $$
  select 
    p.id as player_id,
    p.full_name,
    coalesce(count(mpp.period), 0)::int as periods_played
  from public.match_call_ups mcu
  join public.players p on p.id = mcu.player_id
  left join public.match_player_periods mpp 
    on mpp.match_id = mcu.match_id 
    and mpp.player_id = mcu.player_id
  where mcu.match_id = p_match_id
  group by p.id, p.full_name
  having coalesce(count(mpp.period), 0) < 2;
$$;

