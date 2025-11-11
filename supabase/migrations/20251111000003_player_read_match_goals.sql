-- 20251111000003_player_read_match_goals.sql
-- Permitir a los jugadores leer los goles y partidos de su equipo

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

-- Política para que los jugadores puedan leer match_goals de su equipo
drop policy if exists "mg player read own team" on public.match_goals;
create policy "mg player read own team" on public.match_goals
  for select using (
    exists (
      select 1 from public.matches m
      join public.players p on p.team_id = m.team_id
      where m.id = match_id
        and p.user_id = auth.uid()
    )
  );

-- Política para que los jugadores puedan leer match_quarter_results de su equipo
drop policy if exists "mqr player read own team" on public.match_quarter_results;
create policy "mqr player read own team" on public.match_quarter_results
  for select using (
    exists (
      select 1 from public.matches m
      join public.players p on p.team_id = m.team_id
      where m.id = match_id
        and p.user_id = auth.uid()
    )
  );
