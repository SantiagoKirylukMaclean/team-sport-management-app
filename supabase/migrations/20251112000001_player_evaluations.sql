-- Player Evaluations System
-- Allows coaches to evaluate players based on specific criteria

-- Evaluation categories table
CREATE TABLE evaluation_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluation criteria table (subcategories)
CREATE TABLE evaluation_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES evaluation_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_score INTEGER DEFAULT 10,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player evaluations table
CREATE TABLE player_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual scores for each criterion
CREATE TABLE evaluation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES player_evaluations(id) ON DELETE CASCADE,
  criterion_id UUID REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(evaluation_id, criterion_id)
);

-- Insert default evaluation categories for 9-year-old football
INSERT INTO evaluation_categories (name, description, order_index) VALUES
  ('Coordinación Motriz', 'Coordinación general, óculo-pie, ritmo y balance', 1),
  ('Velocidad y Agilidad', 'Velocidad de reacción, aceleración y cambios de dirección', 2),
  ('Técnica con Balón', 'Control, conducción, pase, regate y tiro', 3),
  ('Toma de Decisiones', 'Lectura de espacios, visión de juego y timing', 4),
  ('Actitud y Concentración', 'Atención, respeto, resiliencia y autonomía', 5),
  ('Condición Física', 'Resistencia, saltabilidad, movilidad y core', 6),
  ('Habilidades Socioemocionales', 'Trabajo en equipo, liderazgo y juego limpio', 7);

-- Insert evaluation criteria for each category
INSERT INTO evaluation_criteria (category_id, name, description, order_index) 
SELECT id, 'Coordinación general', 'Saltos, giros, equilibrio', 1 FROM evaluation_categories WHERE name = 'Coordinación Motriz'
UNION ALL
SELECT id, 'Coordinación óculo-pie', 'Control y recepción del balón', 2 FROM evaluation_categories WHERE name = 'Coordinación Motriz'
UNION ALL
SELECT id, 'Ritmo', 'Ejercicios con escalera', 3 FROM evaluation_categories WHERE name = 'Coordinación Motriz'
UNION ALL
SELECT id, 'Balance', 'Frenadas y estabilidad', 4 FROM evaluation_categories WHERE name = 'Coordinación Motriz'

UNION ALL
SELECT id, 'Velocidad de reacción', 'Respuesta rápida a estímulos', 1 FROM evaluation_categories WHERE name = 'Velocidad y Agilidad'
UNION ALL
SELECT id, 'Aceleración', 'Velocidad en 5-10m', 2 FROM evaluation_categories WHERE name = 'Velocidad y Agilidad'
UNION ALL
SELECT id, 'Agilidad', 'Cambios de dirección', 3 FROM evaluation_categories WHERE name = 'Velocidad y Agilidad'
UNION ALL
SELECT id, 'Velocidad gestual', 'Rapidez con balón', 4 FROM evaluation_categories WHERE name = 'Velocidad y Agilidad'

UNION ALL
SELECT id, 'Control', 'Recepción bilateral', 1 FROM evaluation_categories WHERE name = 'Técnica con Balón'
UNION ALL
SELECT id, 'Conducción', 'Cabeza arriba, cambios de ritmo', 2 FROM evaluation_categories WHERE name = 'Técnica con Balón'
UNION ALL
SELECT id, 'Pase', 'Precisión corta', 3 FROM evaluation_categories WHERE name = 'Técnica con Balón'
UNION ALL
SELECT id, 'Regate', 'Creatividad y uso de ambos pies', 4 FROM evaluation_categories WHERE name = 'Técnica con Balón'
UNION ALL
SELECT id, 'Tiro', 'Precisión sobre fuerza', 5 FROM evaluation_categories WHERE name = 'Técnica con Balón'

UNION ALL
SELECT id, 'Lectura de espacios', 'Comprensión del juego', 1 FROM evaluation_categories WHERE name = 'Toma de Decisiones'
UNION ALL
SELECT id, 'Escaneo previo', 'Observación antes de recibir', 2 FROM evaluation_categories WHERE name = 'Toma de Decisiones'
UNION ALL
SELECT id, 'Timing de pase', 'Momento adecuado del pase', 3 FROM evaluation_categories WHERE name = 'Toma de Decisiones'
UNION ALL
SELECT id, 'Superioridades', 'Aprovechamiento 2v1 y 3v2', 4 FROM evaluation_categories WHERE name = 'Toma de Decisiones'
UNION ALL
SELECT id, 'Movilidad tras pase', 'Movimiento después de pasar', 5 FROM evaluation_categories WHERE name = 'Toma de Decisiones'

UNION ALL
SELECT id, 'Atención continua', 'Concentración durante ejercicios', 1 FROM evaluation_categories WHERE name = 'Actitud y Concentración'
UNION ALL
SELECT id, 'Respeto y escucha', 'Actitud hacia compañeros y entrenador', 2 FROM evaluation_categories WHERE name = 'Actitud y Concentración'
UNION ALL
SELECT id, 'Resiliencia', 'Manejo del error', 3 FROM evaluation_categories WHERE name = 'Actitud y Concentración'
UNION ALL
SELECT id, 'Autonomía', 'Independencia en tareas', 4 FROM evaluation_categories WHERE name = 'Actitud y Concentración'
UNION ALL
SELECT id, 'Intensidad emocional', 'Control emocional equilibrado', 5 FROM evaluation_categories WHERE name = 'Actitud y Concentración'

UNION ALL
SELECT id, 'Resistencia', 'Capacidad aeróbica básica', 1 FROM evaluation_categories WHERE name = 'Condición Física'
UNION ALL
SELECT id, 'Saltabilidad', 'Salto horizontal y vertical', 2 FROM evaluation_categories WHERE name = 'Condición Física'
UNION ALL
SELECT id, 'Movilidad articular', 'Flexibilidad y rango de movimiento', 3 FROM evaluation_categories WHERE name = 'Condición Física'
UNION ALL
SELECT id, 'Core y equilibrio', 'Estabilidad central', 4 FROM evaluation_categories WHERE name = 'Condición Física'

UNION ALL
SELECT id, 'Trabajo en equipo', 'Colaboración con compañeros', 1 FROM evaluation_categories WHERE name = 'Habilidades Socioemocionales'
UNION ALL
SELECT id, 'Liderazgo positivo', 'Influencia constructiva', 2 FROM evaluation_categories WHERE name = 'Habilidades Socioemocionales'
UNION ALL
SELECT id, 'Gestión de frustración', 'Manejo de situaciones adversas', 3 FROM evaluation_categories WHERE name = 'Habilidades Socioemocionales'
UNION ALL
SELECT id, 'Juego limpio', 'Fair play y deportividad', 4 FROM evaluation_categories WHERE name = 'Habilidades Socioemocionales';

-- RLS Policies

-- Evaluation categories (public read)
ALTER TABLE evaluation_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view evaluation categories" ON evaluation_categories FOR SELECT USING (true);

-- Evaluation criteria (public read)
ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view evaluation criteria" ON evaluation_criteria FOR SELECT USING (true);

-- Player evaluations
ALTER TABLE player_evaluations ENABLE ROW LEVEL SECURITY;

-- Coaches can create evaluations for their team players
CREATE POLICY "Coaches can create evaluations" ON player_evaluations 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      JOIN user_team_roles utr ON p.team_id = utr.team_id
      WHERE p.id = player_id 
        AND utr.user_id = auth.uid()
        AND utr.role IN ('coach', 'admin')
    )
  );

-- Coaches can view evaluations of their team players
CREATE POLICY "Coaches can view their team evaluations" ON player_evaluations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM players p
      JOIN user_team_roles utr ON p.team_id = utr.team_id
      WHERE p.id = player_id 
        AND utr.user_id = auth.uid()
        AND utr.role IN ('coach', 'admin')
    )
  );

-- Coaches can update evaluations they created
CREATE POLICY "Coaches can update their evaluations" ON player_evaluations 
  FOR UPDATE 
  USING (coach_id = auth.uid());

-- Coaches can delete evaluations they created
CREATE POLICY "Coaches can delete their evaluations" ON player_evaluations 
  FOR DELETE 
  USING (coach_id = auth.uid());

-- Players can view their own evaluations
CREATE POLICY "Players can view their own evaluations" ON player_evaluations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_id 
        AND p.user_id = auth.uid()
    )
  );

-- Evaluation scores
ALTER TABLE evaluation_scores ENABLE ROW LEVEL SECURITY;

-- Coaches can manage scores for evaluations they created
CREATE POLICY "Coaches can manage evaluation scores" ON evaluation_scores 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM player_evaluations pe
      WHERE pe.id = evaluation_id 
        AND pe.coach_id = auth.uid()
    )
  );

-- Players can view their own evaluation scores
CREATE POLICY "Players can view their own scores" ON evaluation_scores 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM player_evaluations pe
      JOIN players p ON pe.player_id = p.id
      WHERE pe.id = evaluation_id 
        AND p.user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT SELECT ON evaluation_categories TO authenticated;
GRANT SELECT ON evaluation_criteria TO authenticated;
GRANT ALL ON player_evaluations TO authenticated;
GRANT ALL ON evaluation_scores TO authenticated;

-- Indexes for performance
CREATE INDEX idx_evaluation_criteria_category ON evaluation_criteria(category_id);
CREATE INDEX idx_player_evaluations_player ON player_evaluations(player_id);
CREATE INDEX idx_player_evaluations_coach ON player_evaluations(coach_id);
CREATE INDEX idx_player_evaluations_date ON player_evaluations(evaluation_date);
CREATE INDEX idx_evaluation_scores_evaluation ON evaluation_scores(evaluation_id);
CREATE INDEX idx_evaluation_scores_criterion ON evaluation_scores(criterion_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_player_evaluation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_evaluations_updated_at
  BEFORE UPDATE ON player_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_player_evaluation_updated_at();
