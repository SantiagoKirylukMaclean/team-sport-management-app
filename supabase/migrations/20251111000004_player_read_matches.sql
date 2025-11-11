-- 20251111000004_player_read_matches.sql
-- Permitir a los jugadores leer los partidos de su equipo

-- Política para que los jugadores puedan leer matches de su equipo
drop policy if exists "m player read own team" on public.matches;
create policy "m player read own team" on public.matches
  for select using (
    exists (
      select 1 from public.players p
      where p.team_id = matches.team_id
        and p.user_id = auth.uid()
    )
  );
