-- Script para insertar entrenamientos de Septiembre 2025
-- Reemplaza TEAM_ID con el ID real de tu equipo
-- Reemplaza los IDs de jugadores con los valores reales de tu base de datos

-- IMPORTANTE: Primero necesitas obtener los IDs de los jugadores
-- SELECT id, full_name FROM public.players WHERE team_id = YOUR_TEAM_ID ORDER BY full_name;
-- Asumiendo el orden: Ibai, Marc, Liam, Unai, Biel, Alex, Niki, Alexis, Daniel, Jack

DO $$
DECLARE
  v_team_id bigint := 1; -- REEMPLAZA CON TU TEAM_ID
  v_training_id bigint;
  
  -- REEMPLAZA ESTOS IDs CON LOS REALES DE TU BASE DE DATOS
  v_ibai_id bigint := 2;
  v_marc_id bigint := 6;
  v_liam_id bigint := 4;
  v_unai_id bigint := 3;
  v_biel_id bigint := 8;
  v_alex_id bigint := 7;
  v_niki_id bigint := 1;
  v_alexis_id bigint := 10;
  v_daniel_id bigint := 5;
  v_jack_id bigint := 9;
BEGIN

  -- Entrenamiento 1: 2/9/2025 - Todos asistieron
  INSERT INTO public.training_sessions (team_id, session_date, notes)
  VALUES (v_team_id, '2025-09-02', 'Entrenamiento completo')
  RETURNING id INTO v_training_id;
  
  INSERT INTO public.training_attendance (training_id, player_id, status) VALUES
    (v_training_id, v_ibai_id, 'on_time'),
    (v_training_id, v_marc_id, 'on_time'),
    (v_training_id, v_liam_id, 'on_time'),
    (v_training_id, v_unai_id, 'on_time'),
    (v_training_id, v_biel_id, 'on_time'),
    (v_training_id, v_alex_id, 'on_time'),
    (v_training_id, v_niki_id, 'on_time'),
    (v_training_id, v_alexis_id, 'on_time'),
    (v_training_id, v_daniel_id, 'absent'),
    (v_training_id, v_jack_id, 'absent');

  -- Entrenamiento 2: 4/9/2025
  INSERT INTO public.training_sessions (team_id, session_date, notes)
  VALUES (v_team_id, '2025-09-04', 'Entrenamiento')
  RETURNING id INTO v_training_id;
  
  INSERT INTO public.training_attendance (training_id, player_id, status) VALUES
    (v_training_id, v_ibai_id, 'on_time'),
    (v_training_id, v_liam_id, 'on_time'),
    (v_training_id, v_unai_id, 'on_time'),
    (v_training_id, v_biel_id, 'on_time'),
    (v_training_id, v_alex_id, 'on_time'),
    (v_training_id, v_niki_id, 'on_time'),
    (v_training_id, v_alexis_id, 'on_time'),
    (v_training_id, v_jack_id, 'on_time'),
    (v_training_id, v_marc_id, 'absent'),
    (v_training_id, v_daniel_id, 'absent');

  -- Entrenamiento 3: 9/9/2025
  INSERT INTO public.training_sessions (team_id, session_date, notes)
  VALUES (v_team_id, '2025-09-09', 'Entrenamiento')
  RETURNING id INTO v_training_id;
  
  INSERT INTO public.training_attendance (training_id, player_id, status) VALUES
    (v_training_id, v_ibai_id, 'on_time'),
    (v_training_id, v_liam_id, 'on_time'),
    (v_training_id, v_unai_id, 'on_time'),
    (v_training_id, v_biel_id, 'on_time'),
    (v_training_id, v_alex_id, 'on_time'),
    (v_training_id, v_niki_id, 'on_time'),
    (v_training_id, v_alexis_id, 'on_time'),
    (v_training_id, v_daniel_id, 'on_time'),
    (v_training_id, v_jack_id, 'on_time'),
    (v_training_id, v_marc_id, 'absent');

  -- 11/9/2025 - DÍA SIN ENTRENAMIENTO (fila naranja) - NO SE INSERTA

  -- Entrenamiento 4: 16/9/2025 - Todos asistieron
  INSERT INTO public.training_sessions (team_id, session_date, notes)
  VALUES (v_team_id, '2025-09-16', 'Entrenamiento completo')
  RETURNING id INTO v_training_id;
  
  INSERT INTO public.training_attendance (training_id, player_id, status) VALUES
    (v_training_id, v_ibai_id, 'on_time'),
    (v_training_id, v_marc_id, 'on_time'),
    (v_training_id, v_liam_id, 'on_time'),
    (v_training_id, v_unai_id, 'on_time'),
    (v_training_id, v_biel_id, 'on_time'),
    (v_training_id, v_alex_id, 'on_time'),
    (v_training_id, v_niki_id, 'on_time'),
    (v_training_id, v_alexis_id, 'on_time'),
    (v_training_id, v_daniel_id, 'on_time'),
    (v_training_id, v_jack_id, 'on_time');

  -- Entrenamiento 5: 18/9/2025 - Todos asistieron
  INSERT INTO public.training_sessions (team_id, session_date, notes)
  VALUES (v_team_id, '2025-09-18', 'Entrenamiento completo')
  RETURNING id INTO v_training_id;
  
  INSERT INTO public.training_attendance (training_id, player_id, status) VALUES
    (v_training_id, v_ibai_id, 'on_time'),
    (v_training_id, v_marc_id, 'on_time'),
    (v_training_id, v_liam_id, 'on_time'),
    (v_training_id, v_unai_id, 'on_time'),
    (v_training_id, v_biel_id, 'on_time'),
    (v_training_id, v_alex_id, 'on_time'),
    (v_training_id, v_niki_id, 'on_time'),
    (v_training_id, v_alexis_id, 'on_time'),
    (v_training_id, v_daniel_id, 'on_time'),
    (v_training_id, v_jack_id, 'on_time');

  -- Entrenamiento 6: 23/9/2025
  INSERT INTO public.training_sessions (team_id, session_date, notes)
  VALUES (v_team_id, '2025-09-23', 'Entrenamiento')
  RETURNING id INTO v_training_id;
  
  INSERT INTO public.training_attendance (training_id, player_id, status) VALUES
    (v_training_id, v_ibai_id, 'on_time'),
    (v_training_id, v_marc_id, 'on_time'),
    (v_training_id, v_liam_id, 'on_time'),
    (v_training_id, v_unai_id, 'on_time'),
    (v_training_id, v_alex_id, 'on_time'),
    (v_training_id, v_niki_id, 'on_time'),
    (v_training_id, v_alexis_id, 'on_time'),
    (v_training_id, v_daniel_id, 'on_time'),
    (v_training_id, v_jack_id, 'on_time'),
    (v_training_id, v_biel_id, 'absent');

  -- Entrenamiento 7: 25/9/2025
  INSERT INTO public.training_sessions (team_id, session_date, notes)
  VALUES (v_team_id, '2025-09-25', 'Entrenamiento')
  RETURNING id INTO v_training_id;
  
  INSERT INTO public.training_attendance (training_id, player_id, status) VALUES
    (v_training_id, v_ibai_id, 'on_time'),
    (v_training_id, v_marc_id, 'on_time'),
    (v_training_id, v_liam_id, 'on_time'),
    (v_training_id, v_unai_id, 'on_time'),
    (v_training_id, v_alex_id, 'on_time'),
    (v_training_id, v_niki_id, 'on_time'),
    (v_training_id, v_alexis_id, 'on_time'),
    (v_training_id, v_daniel_id, 'on_time'),
    (v_training_id, v_jack_id, 'on_time'),
    (v_training_id, v_biel_id, 'absent');

  -- Entrenamiento 8: 30/9/2025
  INSERT INTO public.training_sessions (team_id, session_date, notes)
  VALUES (v_team_id, '2025-09-30', 'Entrenamiento')
  RETURNING id INTO v_training_id;
  
  INSERT INTO public.training_attendance (training_id, player_id, status) VALUES
    (v_training_id, v_ibai_id, 'on_time'),
    (v_training_id, v_marc_id, 'on_time'),
    (v_training_id, v_unai_id, 'on_time'),
    (v_training_id, v_biel_id, 'on_time'),
    (v_training_id, v_alex_id, 'on_time'),
    (v_training_id, v_niki_id, 'on_time'),
    (v_training_id, v_alexis_id, 'on_time'),
    (v_training_id, v_daniel_id, 'on_time'),
    (v_training_id, v_jack_id, 'on_time'),
    (v_training_id, v_liam_id, 'absent');

  RAISE NOTICE 'Entrenamientos de Septiembre 2025 insertados correctamente';
END $$;
