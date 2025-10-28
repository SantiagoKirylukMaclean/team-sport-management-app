-- 20251028000000_match_substitutions.sql
-- Sistema de cambios/sustituciones en partidos
-- Permite registrar cambios entre jugadores titulares y del banco
-- Un cambio hace que ambos jugadores tengan HALF en ese período

-- 1) Tabla de cambios
create table if not exists public.match_substitutions (
  id bigserial primary key,
  match_id bigint not null references public.matches(id) on delete cascade,
  period smallint not null check (period between 1 and 4),
  player_out bigint not null references public.players(id) on delete cascade,
  player_in bigint not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Evitar cambios duplicados en el mismo período
  unique(match_id, period, player_out, player_in)
);

create index if not exists idx_match_substitutions_match on public.match_substitutions(match_id);
create index if not exists idx_match_substitutions_period on public.match_substitutions(match_id, period);

alter table public.match_substitutions enable row level security;

-- 2) Policies RLS

-- super_admin: acceso total
drop policy if exists "msub superadmin all" on public.match_substitutions;
create policy "msub superadmin all" on public.match_substitutions
  for all using ( public.is_superadmin() ) 
  with check ( public.is_superadmin() );

-- coach/admin: CRUD solo si es coach del equipo del partido
drop policy if exists "msub coach crud" on public.match_substitutions;
create policy "msub coach crud" on public.match_substitutions
  for all using (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and public.is_coach_of_team(m.team_id)
    )
  )
  with check (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and public.is_coach_of_team(m.team_id)
    )
  );

-- 3) Función para aplicar un cambio
-- Actualiza automáticamente los períodos de ambos jugadores a HALF
create or replace function public.apply_match_substitution(
  p_match_id bigint,
  p_period smallint,
  p_player_out bigint,
  p_player_in bigint
)
returns void
language plpgsql
as $$
begin
  -- Validar que el período sea válido
  if p_period not between 1 and 4 then
    raise exception 'Período inválido: debe estar entre 1 y 4';
  end if;

  -- Validar que ambos jugadores estén convocados
  if not exists (
    select 1 from public.match_call_ups 
    where match_id = p_match_id and player_id = p_player_out
  ) then
    raise exception 'El jugador que sale no está convocado';
  end if;

  if not exists (
    select 1 from public.match_call_ups 
    where match_id = p_match_id and player_id = p_player_in
  ) then
    raise exception 'El jugador que entra no está convocado';
  end if;

  -- Registrar el cambio
  insert into public.match_substitutions (match_id, period, player_out, player_in)
  values (p_match_id, p_period, p_player_out, p_player_in)
  on conflict (match_id, period, player_out, player_in) do nothing;

  -- Actualizar períodos a HALF para ambos jugadores
  -- Eliminar registros existentes
  delete from public.match_player_periods
  where match_id = p_match_id 
    and period = p_period 
    and player_id in (p_player_out, p_player_in);

  -- Insertar HALF para ambos
  insert into public.match_player_periods (match_id, player_id, period, fraction)
  values 
    (p_match_id, p_player_out, p_period, 'HALF'),
    (p_match_id, p_player_in, p_period, 'HALF');
end;
$$;

-- 4) Función para remover un cambio
-- Restaura el estado anterior (el que salió vuelve a FULL, el que entró se elimina)
create or replace function public.remove_match_substitution(
  p_match_id bigint,
  p_period smallint,
  p_player_out bigint,
  p_player_in bigint
)
returns void
language plpgsql
as $$
begin
  -- Eliminar el registro del cambio
  delete from public.match_substitutions
  where match_id = p_match_id 
    and period = p_period 
    and player_out = p_player_out 
    and player_in = p_player_in;

  -- Restaurar período FULL para el jugador que salió
  delete from public.match_player_periods
  where match_id = p_match_id 
    and period = p_period 
    and player_id = p_player_out;

  insert into public.match_player_periods (match_id, player_id, period, fraction)
  values (p_match_id, p_player_out, p_period, 'FULL');

  -- Eliminar período del jugador que entró
  delete from public.match_player_periods
  where match_id = p_match_id 
    and period = p_period 
    and player_id = p_player_in;
end;
$$;
