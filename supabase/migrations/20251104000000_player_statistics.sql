-- 20251104000000_player_statistics.sql
-- Vista y función para calcular estadísticas de jugadores
-- Incluye: % asistencia entrenamientos, % asistencia partidos, promedio períodos jugados

-- Vista con estadísticas completas por jugador
create or replace view public.player_statistics as
with player_match_periods as (
  -- Calcular períodos totales por jugador por partido
  select 
    mcu.player_id,
    mcu.match_id,
    sum(case 
      when mpp.fraction = 'FULL' then 1.0
      when mpp.fraction = 'HALF' then 0.5
      else 0
    end) as periods_in_match
  from public.match_call_ups mcu
  left join public.match_player_periods mpp 
    on mpp.match_id = mcu.match_id 
    and mpp.player_id = mcu.player_id
  group by mcu.player_id, mcu.match_id
)
select 
  p.id as player_id,
  p.team_id,
  p.full_name,
  p.jersey_number,
  
  -- Estadísticas de entrenamientos
  count(distinct ts.id) as total_trainings,
  count(distinct case 
    when ta.status in ('on_time', 'late') then ts.id 
  end) as trainings_attended,
  case 
    when count(distinct ts.id) > 0 then
      round((count(distinct case when ta.status in ('on_time', 'late') then ts.id end)::numeric / 
             count(distinct ts.id)::numeric * 100), 1)
    else 0
  end as training_attendance_pct,
  
  -- Estadísticas de partidos (convocatorias)
  count(distinct m.id) as total_matches,
  count(distinct mcu.match_id) as matches_called_up,
  case 
    when count(distinct m.id) > 0 then
      round((count(distinct mcu.match_id)::numeric / 
             count(distinct m.id)::numeric * 100), 1)
    else 0
  end as match_attendance_pct,
  
  -- Promedio de períodos jugados (solo partidos convocados)
  coalesce(
    round((select avg(pmp.periods_in_match) 
           from player_match_periods pmp 
           where pmp.player_id = p.id), 2),
    0
  ) as avg_periods_played

from public.players p
left join public.training_sessions ts on ts.team_id = p.team_id
left join public.training_attendance ta on ta.training_id = ts.id and ta.player_id = p.id
left join public.matches m on m.team_id = p.team_id
left join public.match_call_ups mcu on mcu.match_id = m.id and mcu.player_id = p.id

group by p.id, p.team_id, p.full_name, p.jersey_number;

-- Función para obtener estadísticas de jugadores por equipo
create or replace function public.get_team_player_statistics(p_team_id bigint)
returns table (
  player_id bigint,
  team_id bigint,
  full_name text,
  jersey_number int,
  total_trainings bigint,
  trainings_attended bigint,
  training_attendance_pct numeric,
  total_matches bigint,
  matches_called_up bigint,
  match_attendance_pct numeric,
  avg_periods_played numeric
)
language sql
stable
security definer
as $$
  select 
    player_id,
    team_id,
    full_name,
    jersey_number,
    total_trainings,
    trainings_attended,
    training_attendance_pct,
    total_matches,
    matches_called_up,
    match_attendance_pct,
    avg_periods_played
  from public.player_statistics
  where team_id = p_team_id
  order by full_name;
$$;
