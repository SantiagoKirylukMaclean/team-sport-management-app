-- 20251116000000_player_positions.sql
-- Sistema de posiciones de jugadores en partidos
-- Permite registrar en qué posición jugó cada jugador en cada cuarto

-- 1) Tabla de posiciones disponibles
create table if not exists public.positions (
  id bigserial primary key,
  name text not null,
  display_order smallint not null default 0,
  created_at timestamptz not null default now()
);

-- Insertar posiciones iniciales
insert into public.positions (name, display_order) values
  ('Portero', 1),
  ('Defensa Derecha', 2),
  ('Defensa Central', 3),
  ('Defensa Izquierda', 4),
  ('Volante Derecha', 5),
  ('Volante Central', 6),
  ('Volante Izquierda', 7),
  ('Delantero Centro', 8),
  ('Delantero Derecho', 9),
  ('Delantero Izquierdo', 10)
on conflict do nothing;

-- 2) Agregar columna de posición a match_player_periods
alter table public.match_player_periods 
  add column if not exists position_id bigint references public.positions(id) on delete set null;

create index if not exists idx_match_player_periods_position on public.match_player_periods(position_id);

-- 3) RLS para positions (solo lectura para coaches, escritura para superadmin)
alter table public.positions enable row level security;

-- Todos pueden leer posiciones
drop policy if exists "positions read all" on public.positions;
create policy "positions read all" on public.positions
  for select using (true);

-- Solo superadmin puede modificar posiciones
drop policy if exists "positions superadmin all" on public.positions;
create policy "positions superadmin all" on public.positions
  for all using ( public.is_superadmin() ) 
  with check ( public.is_superadmin() );
