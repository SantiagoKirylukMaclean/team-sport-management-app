-- Change evaluation scale from 1-5 to 1-10
-- This provides more granularity in player evaluations

-- Update all criteria to use max_score of 10
UPDATE evaluation_criteria SET max_score = 10;

-- Update the comment to reflect new scale
COMMENT ON COLUMN evaluation_criteria.max_score IS 'Escala de puntuación de 1 a 10: 1-2=Muy bajo, 3-4=Bajo, 5-6=Aceptable, 7-8=Bueno, 9-10=Muy bueno';

-- Note: Existing scores will remain as they are (1-5)
-- New evaluations will use the 1-10 scale
-- If you want to scale existing scores proportionally, uncomment the following:
-- UPDATE evaluation_scores SET score = score * 2;
