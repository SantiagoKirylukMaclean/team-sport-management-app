-- Agregar columna field_zone a match_player_periods para guardar la zona específica en la cancha

alter table public.match_player_periods 
  add column if not exists field_zone text;

-- Crear índice para mejorar consultas
create index if not exists idx_match_player_periods_field_zone 
  on public.match_player_periods(field_zone);

-- Comentario explicativo
comment on column public.match_player_periods.field_zone is 
  'Zona específica en la cancha: PORTERO, DEFENSA_IZQUIERDA, DEFENSA_CENTRAL, DEFENSA_DERECHA, VOLANTE_IZQUIERDO, VOLANTE_CENTRAL, VOLANTE_DERECHO, DELANTERO_IZQUIERDO, DELANTERO_CENTRO, DELANTERO_DERECHO';
