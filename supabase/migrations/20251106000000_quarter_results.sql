-- 20251106000000_quarter_results.sql
-- Sistema de resultados por cuarto: goles del equipo, goles del oponente, goleadores y asistidores

-- 1) Tabla de resultados por cuarto
create table if not exists public.match_quarter_results (
  id bigserial primary key,
  match_id bigint not null references public.matches(id) on delete cascade,
  quarter smallint not null check (quarter between 1 and 4),
  team_goals smallint not null default 0 check (team_goals >= 0),
  opponent_goals smallint not null default 0 check (opponent_goals >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(match_id, quarter)
);

create index if not exists idx_match_quarter_results_match on public.match_quarter_results(match_id);

-- 2) Tabla de goles (goleador y asistidor)
create table if not exists public.match_goals (
  id bigserial primary key,
  match_id bigint not null references public.matches(id) on delete cascade,
  quarter smallint not null check (quarter between 1 and 4),
  scorer_id bigint not null references public.players(id) on delete cascade,
  assister_id bigint references public.players(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_match_goals_match on public.match_goals(match_id);
create index if not exists idx_match_goals_scorer on public.match_goals(scorer_id);
create index if not exists idx_match_goals_assister on public.match_goals(assister_id);

-- 3) RLS para match_quarter_results
alter table public.match_quarter_results enable row level security;

-- super_admin all
drop policy if exists "mqr superadmin all" on public.match_quarter_results;
create policy "mqr superadmin all" on public.match_quarter_results
  for all using ( public.is_superadmin() ) with check ( public.is_superadmin() );

-- coach CRUD si es coach del team del match
drop policy if exists "mqr coach crud" on public.match_quarter_results;
create policy "mqr coach crud" on public.match_quarter_results
  for all using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and public.is_coach_of_team(m.team_id)
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and public.is_coach_of_team(m.team_id)
    )
  );

-- 4) RLS para match_goals
alter table public.match_goals enable row level security;

-- super_admin all
drop policy if exists "mg superadmin all" on public.match_goals;
create policy "mg superadmin all" on public.match_goals
  for all using ( public.is_superadmin() ) with check ( public.is_superadmin() );

-- coach CRUD si es coach del team del match y los jugadores pertenecen al mismo team
drop policy if exists "mg coach crud" on public.match_goals;
create policy "mg coach crud" on public.match_goals
  for all using (
    exists (
      select 1 from public.matches m
      join public.players p on p.team_id = m.team_id
      where m.id = match_id
        and p.id = scorer_id
        and public.is_coach_of_team(m.team_id)
        and (assister_id is null or exists (
          select 1 from public.players p2
          where p2.id = assister_id and p2.team_id = m.team_id
        ))
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      join public.players p on p.team_id = m.team_id
      where m.id = match_id
        and p.id = scorer_id
        and public.is_coach_of_team(m.team_id)
        and (assister_id is null or exists (
          select 1 from public.players p2
          where p2.id = assister_id and p2.team_id = m.team_id
        ))
    )
  );

-- 5) Función para actualizar updated_at
create or replace function public.update_match_quarter_results_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_match_quarter_results_updated_at on public.match_quarter_results;
create trigger trigger_update_match_quarter_results_updated_at
  before update on public.match_quarter_results
  for each row
  execute function public.update_match_quarter_results_updated_at();
