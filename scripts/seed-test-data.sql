-- Script para crear datos de prueba para el sistema de invitación de jugadores
-- Ejecutar este script si no tienes datos en tu base de datos

-- Insertar deportes de prueba
INSERT INTO sports (id, name) VALUES
  (gen_random_uuid(), 'Basketball'),
  (gen_random_uuid(), 'Football'),
  (gen_random_uuid(), 'Volleyball')
ON CONFLICT DO NOTHING;

-- Insertar clubs de prueba
INSERT INTO clubs (id, name, sport_id)
SELECT 
  gen_random_uuid(),
  'Lakers',
  id
FROM sports WHERE name = 'Basketball'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO clubs (id, name, sport_id)
SELECT 
  gen_random_uuid(),
  'Bulls',
  id
FROM sports WHERE name = 'Basketball'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO clubs (id, name, sport_id)
SELECT 
  gen_random_uuid(),
  'Real Madrid',
  id
FROM sports WHERE name = 'Football'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insertar equipos de prueba
INSERT INTO teams (id, name, club_id)
SELECT 
  gen_random_uuid(),
  'Lakers U18',
  id
FROM clubs WHERE name = 'Lakers'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO teams (id, name, club_id)
SELECT 
  gen_random_uuid(),
  'Lakers U21',
  id
FROM clubs WHERE name = 'Lakers'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO teams (id, name, club_id)
SELECT 
  gen_random_uuid(),
  'Bulls Senior',
  id
FROM clubs WHERE name = 'Bulls'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insertar jugadores de prueba (sin cuenta vinculada)
INSERT INTO players (team_id, full_name, jersey_number, user_id)
SELECT 
  t.id,
  'Juan Pérez',
  10,
  NULL
FROM teams t
WHERE t.name = 'Lakers U18'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO players (team_id, full_name, jersey_number, user_id)
SELECT 
  t.id,
  'María García',
  7,
  NULL
FROM teams t
WHERE t.name = 'Lakers U18'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO players (team_id, full_name, jersey_number, user_id)
SELECT 
  t.id,
  'Carlos López',
  23,
  NULL
FROM teams t
WHERE t.name = 'Lakers U21'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO players (team_id, full_name, jersey_number, user_id)
SELECT 
  t.id,
  'Ana Martínez',
  15,
  NULL
FROM teams t
WHERE t.name = 'Bulls Senior'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Verificar datos insertados
SELECT 'Sports' as table_name, count(*) as count FROM sports
UNION ALL
SELECT 'Clubs', count(*) FROM clubs
UNION ALL
SELECT 'Teams', count(*) FROM teams
UNION ALL
SELECT 'Players', count(*) FROM players
UNION ALL
SELECT 'Players sin cuenta', count(*) FROM players WHERE user_id IS NULL;

-- Mostrar estructura completa
SELECT 
  s.name as sport,
  c.name as club,
  t.name as team,
  p.full_name as player,
  p.jersey_number,
  CASE WHEN p.user_id IS NULL THEN 'Sin cuenta' ELSE 'Con cuenta' END as status
FROM sports s
JOIN clubs c ON c.sport_id = s.id
JOIN teams t ON t.club_id = c.id
LEFT JOIN players p ON p.team_id = t.id
ORDER BY s.name, c.name, t.name, p.full_name;
