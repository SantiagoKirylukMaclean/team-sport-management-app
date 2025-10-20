-- 20251020010000_training.sql
-- Training sessions and attendance tracking
-- Requires: public.is_superadmin(), public.is_coach_of_team(bigint)

-- ========== Enum Type (idempotent) ==========
do $$
begin
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type attendance_status as enum ('on_time', 'late', 'absent');
  end if;
end $$;

-- ========== Training Sessions Table ==========
create table if not exists public.training_sessions (
  id bigserial primary key,
  team_id bigint not null references public.teams(id) on delete cascade,
  session_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_training_sessions_team on public.training_sessions(team_id);

alter table public.training_sessions enable row level security;

-- ========== Training Attendance Table ==========
create table if not exists public.training_attendance (
  training_id bigint not null references public.training_sessions(id) on delete cascade,
  player_id bigint not null references public.players(id) on delete cascade,
  status attendance_status not null,
  primary key (training_id, player_id)
);

alter table public.training_attendance enable row level security;

-- ========== RLS Policies for training_sessions ==========
-- IMPORTANTE: Postgres no tiene CREATE POLICY IF NOT EXISTS -> usar DROP/CREATE

-- super_admin: all
drop policy if exists "ts superadmin all" on public.training_sessions;
create policy "ts superadmin all"
on public.training_sessions
for all
using (public.is_superadmin())
with check (public.is_superadmin());

-- coach/admin del equipo: CRUD
drop policy if exists "ts coach crud" on public.training_sessions;
create policy "ts coach crud"
on public.training_sessions
for all
using ( public.is_coach_of_team(team_id) )
with check ( public.is_coach_of_team(team_id) );

-- ========== RLS Policies for training_attendance ==========

-- super_admin: all
drop policy if exists "ta superadmin all" on public.training_attendance;
create policy "ta superadmin all"
on public.training_attendance
for all
using (public.is_superadmin())
with check (public.is_superadmin());

-- coach/admin: CRUD only for training sessions of their teams
-- AND players that belong to their teams
drop policy if exists "ta coach crud" on public.training_attendance;
create policy "ta coach crud"
on public.training_attendance
for all
using (
  exists (
    select 1
    from public.training_sessions ts
    where ts.id = training_attendance.training_id
      and public.is_coach_of_team(ts.team_id)
  )
  and exists (
    select 1
    from public.players p
    where p.id = training_attendance.player_id
      and public.is_coach_of_team(p.team_id)
  )
)
with check (
  exists (
    select 1
    from public.training_sessions ts
    where ts.id = training_attendance.training_id
      and public.is_coach_of_team(ts.team_id)
  )
  and exists (
    select 1
    from public.players p
    where p.id = training_attendance.player_id
      and public.is_coach_of_team(p.team_id)
  )
);
