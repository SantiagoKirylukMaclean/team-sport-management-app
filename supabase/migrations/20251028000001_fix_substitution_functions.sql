-- 20251028000001_fix_substitution_functions.sql
-- Fix: Corregir delimitadores de funciones de sustituciones

-- Eliminar funciones existentes
drop function if exists public.apply_match_substitution(bigint, smallint, bigint, bigint);
drop function if exists public.remove_match_substitution(bigint, smallint, bigint, bigint);

-- Recrear función para aplicar un cambio
create or replace function public.apply_match_substitution(
  p_match_id bigint,
  p_period smallint,
  p_player_out bigint,
  p_player_in bigint
)
returns void
language plpgsql
security definer
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

-- Recrear función para remover un cambio
create or replace function public.remove_match_substitution(
  p_match_id bigint,
  p_period smallint,
  p_player_out bigint,
  p_player_in bigint
)
returns void
language plpgsql
security definer
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
