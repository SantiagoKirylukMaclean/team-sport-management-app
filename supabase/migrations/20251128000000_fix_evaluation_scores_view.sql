-- Fix evaluation_scores RLS to allow coaches to view all scores for their team players
-- Not just the ones they created

DROP POLICY IF EXISTS "Coaches can manage evaluation scores" ON evaluation_scores;
DROP POLICY IF EXISTS "Admins can manage all scores" ON evaluation_scores;

-- Super admins can manage all scores
CREATE POLICY "Admins can manage all scores" ON evaluation_scores
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Coaches can INSERT/UPDATE/DELETE scores for evaluations they created
CREATE POLICY "Coaches can manage their evaluation scores" ON evaluation_scores
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM player_evaluations pe
      WHERE pe.id = evaluation_id
        AND pe.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM player_evaluations pe
      WHERE pe.id = evaluation_id
        AND pe.coach_id = auth.uid()
    )
  );

-- Coaches can VIEW scores for any evaluation of players in their teams
CREATE POLICY "Coaches can view team evaluation scores" ON evaluation_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM player_evaluations pe
      JOIN players p ON pe.player_id = p.id
      JOIN user_team_roles utr ON p.team_id = utr.team_id
      WHERE pe.id = evaluation_id
        AND utr.user_id = auth.uid()
        AND utr.role IN ('coach', 'admin')
    )
  );
