-- Script de prueba para el sistema de invitación de jugadores
-- Este script te ayuda a probar la funcionalidad completa

-- ============================================================
-- PASO 1: Verificar que la migración se aplicó correctamente
-- ============================================================

-- Verificar que la columna user_id existe en players
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'players' and column_name = 'user_id';

-- Verificar que la columna player_id existe en pending_invites
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'pending_invites' and column_name = 'player_id';

-- Verificar que el constraint de role incluye 'player'
select constraint_name, check_clause
from information_schema.check_constraints
where constraint_name = 'pending_invites_role_check';

-- ============================================================
-- PASO 2: Crear datos de prueba (si no existen)
-- ============================================================

-- Crear un deporte de prueba
insert into sports (name)
values ('Basketball Test')
on conflict do nothing
returning id;

-- Crear un club de prueba (usa el sport_id del paso anterior)
insert into clubs (name, sport_id)
select 'Test Club', id from sports where name = 'Basketball Test' limit 1
on conflict do nothing
returning id;

-- Crear un equipo de prueba (usa el club_id del paso anterior)
insert into teams (name, club_id)
select 'Test Team', id from clubs where name = 'Test Club' limit 1
on conflict do nothing
returning id;

-- Crear jugadores de prueba sin cuenta vinculada
insert into players (team_id, full_name, jersey_number)
select 
  t.id,
  'Juan Pérez',
  10
from teams t
where t.name = 'Test Team'
on conflict do nothing
returning id, full_name, jersey_number;

insert into players (team_id, full_name, jersey_number)
select 
  t.id,
  'María García',
  7
from teams t
where t.name = 'Test Team'
on conflict do nothing
returning id, full_name, jersey_number;

-- ============================================================
-- PASO 3: Ver jugadores disponibles para invitar
-- ============================================================

select 
  p.id,
  p.full_name,
  p.jersey_number,
  p.user_id,
  t.name as team_name,
  c.name as club_name,
  s.name as sport_name,
  case 
    when p.user_id is null then '✓ Disponible para invitar'
    else '✗ Ya tiene cuenta vinculada'
  end as status
from players p
join teams t on t.id = p.team_id
join clubs c on c.id = t.club_id
join sports s on s.id = c.sport_id
order by p.user_id nulls first, p.full_name;

-- ============================================================
-- PASO 4: Simular invitación (esto normalmente se hace desde la UI)
-- ============================================================

-- NOTA: En producción, esto se hace a través del Edge Function
-- Este es solo un ejemplo de cómo quedaría el registro

-- Obtener un jugador sin cuenta
do $
declare
  test_player_id bigint;
  test_team_id bigint;
  admin_user_id uuid;
begin
  -- Obtener un jugador sin cuenta
  select id, team_id into test_player_id, test_team_id
  from players
  where user_id is null
  limit 1;

  -- Obtener un admin para created_by
  select id into admin_user_id
  from profiles
  where role in ('super_admin', 'admin')
  limit 1;

  if test_player_id is not null and admin_user_id is not null then
    -- Crear invitación de prueba
    insert into pending_invites (
      email,
      display_name,
      role,
      team_ids,
      player_id,
      status,
      created_by
    )
    values (
      'test.player@example.com',
      'Test Player',
      'player',
      array[test_team_id],
      test_player_id,
      'pending',
      admin_user_id
    )
    on conflict (email) do update
    set 
      player_id = excluded.player_id,
      status = 'pending',
      created_at = now();

    raise notice 'Invitación de prueba creada para player_id: %', test_player_id;
  else
    raise notice 'No se pudo crear invitación de prueba. Verifica que existan jugadores sin cuenta y usuarios admin.';
  end if;
end $;

-- ============================================================
-- PASO 5: Ver invitaciones pendientes
-- ============================================================

select 
  pi.id,
  pi.email,
  pi.role,
  pi.status,
  pi.player_id,
  p.full_name as player_name,
  p.jersey_number,
  t.name as team_name,
  pi.created_at
from pending_invites pi
left join players p on p.id = pi.player_id
left join teams t on t.id = p.team_id
where pi.role = 'player'
order by pi.created_at desc;

-- ============================================================
-- PASO 6: Simular aceptación de invitación
-- ============================================================

-- NOTA: En producción, esto sucede automáticamente cuando el usuario
-- acepta la invitación y el trigger se ejecuta

-- Para probar manualmente:
do $
declare
  test_user_id uuid;
  test_player_id bigint;
  test_team_id bigint;
begin
  -- Obtener una invitación pendiente de player
  select player_id into test_player_id
  from pending_invites
  where role = 'player' and status = 'pending'
  limit 1;

  if test_player_id is not null then
    -- Crear un usuario de prueba
    test_user_id := gen_random_uuid();
    
    -- Simular la creación del perfil (normalmente hecho por el trigger)
    insert into profiles (id, email, display_name, role)
    select 
      test_user_id,
      pi.email,
      pi.display_name,
      'player'
    from pending_invites pi
    where pi.player_id = test_player_id and pi.status = 'pending'
    limit 1;

    -- Vincular el jugador con el usuario
    update players
    set user_id = test_user_id
    where id = test_player_id;

    -- Obtener el team_id del jugador
    select team_id into test_team_id
    from players
    where id = test_player_id;

    -- Crear user_team_roles
    insert into user_team_roles (user_id, team_id, role)
    values (test_user_id, test_team_id, 'player')
    on conflict do nothing;

    -- Marcar invitación como aceptada
    update pending_invites
    set status = 'accepted', accepted_at = now()
    where player_id = test_player_id and status = 'pending';

    raise notice 'Invitación aceptada. Usuario vinculado al jugador: %', test_player_id;
  else
    raise notice 'No hay invitaciones pendientes de players para probar.';
  end if;
end $;

-- ============================================================
-- PASO 7: Verificar vinculación exitosa
-- ============================================================

select 
  p.id as player_id,
  p.full_name,
  p.jersey_number,
  p.user_id,
  pr.email,
  pr.role as user_role,
  t.name as team_name,
  utr.role as team_role,
  case 
    when p.user_id is not null then '✓ Vinculado correctamente'
    else '✗ Sin vincular'
  end as status
from players p
left join profiles pr on pr.id = p.user_id
left join teams t on t.id = p.team_id
left join user_team_roles utr on utr.user_id = p.user_id and utr.team_id = p.team_id
where p.full_name like '%Test%' or p.full_name like '%Pérez%' or p.full_name like '%García%'
order by p.id;

-- ============================================================
-- PASO 8: Ver historial de invitaciones
-- ============================================================

select 
  pi.id,
  pi.email,
  pi.role,
  pi.status,
  p.full_name as player_name,
  p.jersey_number,
  t.name as team_name,
  pi.created_at,
  pi.accepted_at,
  case 
    when pi.status = 'accepted' then '✓ Aceptada'
    when pi.status = 'pending' then '⏳ Pendiente'
    when pi.status = 'canceled' then '✗ Cancelada'
  end as status_display
from pending_invites pi
left join players p on p.id = pi.player_id
left join teams t on t.id = p.team_id
where pi.role = 'player'
order by pi.created_at desc;

-- ============================================================
-- PASO 9: Limpiar datos de prueba (opcional)
-- ============================================================

-- ADVERTENCIA: Esto eliminará todos los datos de prueba creados
-- Descomenta solo si quieres limpiar

/*
-- Eliminar invitaciones de prueba
delete from pending_invites where email like '%test%' or email like '%example.com';

-- Desvincular jugadores de prueba
update players set user_id = null where full_name like '%Test%';

-- Eliminar perfiles de prueba
delete from profiles where email like '%test%' or email like '%example.com';

-- Eliminar jugadores de prueba
delete from players where full_name in ('Juan Pérez', 'María García', 'Test Player');

-- Eliminar equipos de prueba
delete from teams where name = 'Test Team';

-- Eliminar clubs de prueba
delete from clubs where name = 'Test Club';

-- Eliminar deportes de prueba
delete from sports where name = 'Basketball Test';
*/

-- ============================================================
-- CONSULTAS ÚTILES PARA DEBUGGING
-- ============================================================

-- Ver todos los jugadores y su estado de vinculación
select 
  count(*) filter (where user_id is null) as sin_cuenta,
  count(*) filter (where user_id is not null) as con_cuenta,
  count(*) as total
from players;

-- Ver invitaciones por estado
select 
  role,
  status,
  count(*) as cantidad
from pending_invites
group by role, status
order by role, status;

-- Ver jugadores con cuenta pero sin user_team_roles
select 
  p.id,
  p.full_name,
  p.user_id,
  pr.email,
  t.name as team_name,
  utr.id as has_team_role
from players p
join profiles pr on pr.id = p.user_id
join teams t on t.id = p.team_id
left join user_team_roles utr on utr.user_id = p.user_id and utr.team_id = p.team_id
where p.user_id is not null and utr.id is null;
