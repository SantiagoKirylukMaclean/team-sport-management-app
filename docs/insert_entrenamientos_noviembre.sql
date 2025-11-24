-- Script para insertar entrenamientos de Noviembre 2025
-- Listo para ejecutar en Supabase SQL Editor

DO $$
DECLARE
  v_team_id bigint := 1;
  v_training_id bigint;
  
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

  -- Entrenamiento 1: 4/11/2025 - Todos asistieron
  INSERT INTO public.training_sessions (team_id, session_date, notes)
  VALUES (v_team_id, '2025-11-04', 'Entrenamiento completo')
  RETURNING id INTO v_training_id;
  
  INSERT INTO public.training_attendance (training_id, player_id, status) VALUES
    (v_training_id, v_ibai_id, 'on_time'),
    (v_training_id, v_marc_id, 'on_time'),
    (v_training_id, v_liam_id, 'on_time'),
    (v_training_id, v_biel_id, 'on_time'),
    (v_training_id, v_alex_id, 'on_time'),
    (v_training_id, v_niki_id, 'on_time'),
    (v_training_id, v_alexis_id, 'on_time'),
    (v_training_id, v_daniel_id, 'on_time'),
    (v_training_id, v_jack_id, 'on_time'),
    (v_training_id, v_unai_id, 'absent');

  -- Entrenamiento 2: 6/11/2025
  INSERT INTO public.training_sessions (team_id, session_date, notes)
  VALUES (v_team_id, '2025-11-06', 'Entrenamiento')
  RETURNING id INTO v_training_id;
  
  INSERT INTO public.training_attendance (training_id, player_id, status) VALUES
    (v_training_id, v_ibai_id, 'on_time'),
    (v_training_id, v_marc_id, 'on_time'),
    (v_training_id, v_liam_id, 'on_time'),
    (v_training_id, v_unai_id, 'on_time'),
    (v_training_id, v_biel_id, 'on_time'),
    (v_training_id, v_niki_id, 'on_time'),
    (v_training_id, v_alexis_id, 'on_time'),
    (v_training_id, v_daniel_id, 'on_time'),
    (v_training_id, v_jack_id, 'on_time'),
    (v_training_id, v_alex_id, 'absent');

  RAISE NOTICE 'Entrenamientos de Noviembre 2025 insertados correctamente';
END $$;
