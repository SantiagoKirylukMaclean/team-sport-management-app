-- Refactor evaluation policies to use is_coach_of_team helper
-- This makes them consistent with players, matches, and training policies
-- Requires: public.is_superadmin(), public.is_coach_of_team(bigint)

-- ========== player_evaluations ==========

-- Drop all existing policies
DROP POLICY IF EXISTS "Super admins can manage all evaluations" ON player_evaluations;
DROP POLICY IF EXISTS "Coaches can create evaluations" ON player_evaluations;
DROP POLICY IF EXISTS "Coaches can view their team evaluations" ON player_evaluations;
DROP POLICY IF EXISTS "Coaches can update evaluations" ON player_evaluations;
DROP POLICY IF EXISTS "Coaches can delete evaluations" ON player_evaluations;

-- Super admins can do everything
DROP POLICY IF EXISTS "pe superadmin all" ON player_evaluations;
CREATE POLICY "pe superadmin all" ON player_evaluations
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- Coaches can INSERT evaluations for players in their teams
DROP POLICY IF EXISTS "pe coach insert" ON player_evaluations;
CREATE POLICY "pe coach insert" ON player_evaluations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_id
        AND public.is_coach_of_team(p.team_id)
    )
  );

-- Coaches can SELECT evaluations for players in their teams
DROP POLICY IF EXISTS "pe coach select" ON player_evaluations;
CREATE POLICY "pe coach select" ON player_evaluations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_id
        AND public.is_coach_of_team(p.team_id)
    )
  );

-- Coaches can UPDATE/DELETE only evaluations they created
DROP POLICY IF EXISTS "pe coach update own" ON player_evaluations;
CREATE POLICY "pe coach update own" ON player_evaluations
  FOR UPDATE
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "pe coach delete own" ON player_evaluations;
CREATE POLICY "pe coach delete own" ON player_evaluations
  FOR DELETE
  USING (coach_id = auth.uid());

-- Players can view their own evaluations
DROP POLICY IF EXISTS "pe player view own" ON player_evaluations;
CREATE POLICY "pe player view own" ON player_evaluations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_id
        AND p.user_id = auth.uid()
    )
  );

-- ========== evaluation_scores ==========

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage all scores" ON evaluation_scores;
DROP POLICY IF EXISTS "Coaches can manage their evaluation scores" ON evaluation_scores;
DROP POLICY IF EXISTS "Coaches can view team evaluation scores" ON evaluation_scores;
DROP POLICY IF EXISTS "Players can view their own scores" ON evaluation_scores;

-- Super admins can do everything
DROP POLICY IF EXISTS "es superadmin all" ON evaluation_scores;
CREATE POLICY "es superadmin all" ON evaluation_scores
  FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- Coaches can INSERT/UPDATE/DELETE scores for evaluations they created
DROP POLICY IF EXISTS "es coach manage own" ON evaluation_scores;
CREATE POLICY "es coach manage own" ON evaluation_scores
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

-- Coaches can SELECT scores for any evaluation of players in their teams
DROP POLICY IF EXISTS "es coach select team" ON evaluation_scores;
CREATE POLICY "es coach select team" ON evaluation_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM player_evaluations pe
      JOIN players p ON pe.player_id = p.id
      WHERE pe.id = evaluation_id
        AND public.is_coach_of_team(p.team_id)
    )
  );

-- Players can view their own evaluation scores
DROP POLICY IF EXISTS "es player view own" ON evaluation_scores;
CREATE POLICY "es player view own" ON evaluation_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM player_evaluations pe
      JOIN players p ON pe.player_id = p.id
      WHERE pe.id = evaluation_id
        AND p.user_id = auth.uid()
    )
  );

-- ========== evaluation_categories and evaluation_criteria ==========
-- These should be publicly readable (no changes needed, but let's ensure they're set)

DROP POLICY IF EXISTS "Anyone can view evaluation categories" ON evaluation_categories;
CREATE POLICY "Anyone can view evaluation categories" ON evaluation_categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can view evaluation criteria" ON evaluation_criteria;
CREATE POLICY "Anyone can view evaluation criteria" ON evaluation_criteria
  FOR SELECT
  USING (true);
