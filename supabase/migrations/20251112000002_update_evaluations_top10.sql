-- Update evaluations to use Top 10 criteria with 1-5 scale
-- Add evaluation method and video example fields

-- First, drop existing data and constraints
TRUNCATE TABLE evaluation_scores CASCADE;
TRUNCATE TABLE evaluation_criteria CASCADE;
TRUNCATE TABLE evaluation_categories CASCADE;
TRUNCATE TABLE player_evaluations CASCADE;

-- Update criteria to support max_score of 5 and add new fields
ALTER TABLE evaluation_criteria 
  ADD COLUMN IF NOT EXISTS evaluation_method TEXT,
  ADD COLUMN IF NOT EXISTS example_video_url TEXT;

-- Update scores to support video examples per score
ALTER TABLE evaluation_scores
  ADD COLUMN IF NOT EXISTS example_video_url TEXT;

-- Insert Top 10 evaluation categories (simplified, one category)
INSERT INTO evaluation_categories (name, description, order_index) VALUES
  ('Evaluación Top 10', 'Los 10 indicadores más importantes para evaluar a un niño de 9 años en fútbol', 1);

-- Get the category ID for inserting criteria
DO $$
DECLARE
  cat_id UUID;
BEGIN
  SELECT id INTO cat_id FROM evaluation_categories WHERE name = 'Evaluación Top 10';

  -- Insert the 10 criteria with evaluation methods
  INSERT INTO evaluation_criteria (category_id, name, description, max_score, evaluation_method, order_index) VALUES
    (cat_id, 'Control de balón', 'Recibe sin que rebote, orienta el control, usa ambos pies', 5, 
     '10 pelotas lanzadas a media altura. Puntuar cuántas controla sin perderla y si orienta bien el primer toque.', 1),
    
    (cat_id, 'Conducción con cabeza arriba', 'Control en carrera, cambios de ritmo, visión periférica', 5,
     'Slalom de conos cronometrado. Sumar puntos si mira alrededor antes del último cono.', 2),
    
    (cat_id, 'Pase corto preciso', 'Fuerza correcta, dirección, pie dominante y no dominante', 5,
     '10 pases a un cuadrado marcado. Evaluar cuántos entran y si mantiene postura corporal correcta.', 3),
    
    (cat_id, 'Toma de decisiones básicas', 'Elige bien entre pase, tiro o conducción en situaciones simples', 5,
     'Ejercicio 2 vs 1. Valorar si toma decisiones rápidas y adecuadas tres de cada cinco veces.', 4),
    
    (cat_id, 'Juego sin balón', 'Desmarques, apoyos, no quedarse quieto después del pase', 5,
     'Partidito 4 vs 4. Contar cuántas veces ofrece línea de pase después de soltar el balón.', 5),
    
    (cat_id, 'Dominio corporal', 'Equilibrio, frenadas, giros, control del cuerpo', 5,
     'Circuito de cambios de dirección. Puntuar estabilidad en frenadas y fluidez en giros.', 6),
    
    (cat_id, 'Velocidad de reacción', 'Rapidez ante estímulos (pelota suelta, rebote, señal del entrenador)', 5,
     'Salidas a 5 metros con estímulo visual o sonoro. Medir tiempo de reacción.', 7),
    
    (cat_id, 'Regate funcional', 'Regate que permite seguir la jugada, no adorno', 5,
     '1 vs 1 en espacio pequeño. Contar cuántas veces supera al rival y mantiene posesión.', 8),
    
    (cat_id, 'Actitud y concentración', 'Escucha, sigue instrucciones, mantiene foco', 5,
     'Observación directa durante ejercicios. Registrar interrupciones o desconexiones.', 9),
    
    (cat_id, 'Trabajo en equipo', 'Colabora, anima, respeta rival y compañeros, comparte balón', 5,
     'Partidito 5 vs 5. Registrar comportamientos positivos y negativos.', 10);
END $$;

-- Add comment to explain scoring scale
COMMENT ON COLUMN evaluation_criteria.max_score IS 'Escala de puntuación: 1=Muy bajo, 2=Bajo, 3=Aceptable, 4=Bueno, 5=Muy bueno';
COMMENT ON COLUMN evaluation_criteria.evaluation_method IS 'Descripción de cómo evaluar este criterio con ejercicios específicos';
COMMENT ON COLUMN evaluation_criteria.example_video_url IS 'URL de video de ejemplo para este criterio (opcional)';
COMMENT ON COLUMN evaluation_scores.example_video_url IS 'URL de video de ejemplo específico para esta evaluación (opcional)';
