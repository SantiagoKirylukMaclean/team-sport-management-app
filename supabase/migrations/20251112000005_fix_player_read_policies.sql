-- 20251112000005_fix_player_read_policies.sql
-- Consolidar y corregir políticas de lectura de jugadores

-- Eliminar políticas existentes de lectura
drop policy if exists "players_read_own" on public.players;
drop policy if exists "players read team members" on public.players;
drop policy if exists "players self read" on public.players;
drop policy if exists "players_own_read" on public.players;

-- Política unificada: los jugadores pueden leer su propio registro Y otros jugadores de su equipo
create policy "players read own team" on public.players
  for select using (
    -- Puede leer su propio registro
    user_id = auth.uid()
    OR
    -- O puede leer jugadores de su mismo equipo
    exists (
      select 1 from public.players p
      where p.team_id = players.team_id
        and p.user_id = auth.uid()
    )
  );

-- Comentario para documentación
comment on policy "players read own team" on public.players is 
'Allows players to read their own record and other players in their team';
