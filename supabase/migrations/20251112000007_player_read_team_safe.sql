-- 20251112000007_player_read_team_safe.sql
-- Permitir a los jugadores leer otros jugadores de su equipo sin recursión

-- Función helper para obtener el team_id del usuario actual
create or replace function public.get_user_team_id()
returns bigint
language sql
stable
security definer
as $$
  select team_id 
  from public.players 
  where user_id = auth.uid() 
  limit 1;
$$;

-- Política para que los jugadores puedan leer otros jugadores de su equipo
drop policy if exists "players read team members" on public.players;
create policy "players read team members" on public.players
  for select using (
    team_id = public.get_user_team_id()
  );

-- Comentario para documentación
comment on policy "players read team members" on public.players is 
'Allows players to read information about other players in their team using a helper function';
