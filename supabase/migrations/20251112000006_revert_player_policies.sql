-- 20251112000006_revert_player_policies.sql
-- Revertir la política problemática y restaurar las políticas originales

-- Eliminar la política problemática que causa recursión infinita
drop policy if exists "players read own team" on public.players;

-- Restaurar las políticas originales que funcionaban

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

-- Jugador puede leer su propio registro
drop policy if exists "players_read_own" on public.players;
create policy "players_read_own"
on public.players
for select
using (user_id = auth.uid());

-- Comentario para documentación
comment on policy "players_read_own" on public.players is 
'Allows authenticated users to read their own player record based on user_id matching auth.uid()';
