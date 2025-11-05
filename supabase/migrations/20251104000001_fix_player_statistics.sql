-- 20251104000001_fix_player_statistics.sql
-- Corrección del cálculo de promedio de períodos jugados
-- El problema era que sumaba todos los períodos en lugar de promediar por partido

-- Recrear la vista con el cálculo correcto
drop view if exists public.player_statistics;

create view public.player_statistics as
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
