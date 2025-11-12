-- Fix RLS policies for player evaluations
-- Make them work with the actual user_team_roles structure

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can create evaluations" ON player_evaluations;
DROP POLICY IF EXISTS "Coaches can view their team evaluations" ON player_evaluations;
DROP POLICY IF EXISTS "Coaches can update their evaluations" ON player_evaluations;
DROP POLICY IF EXISTS "Coaches can delete their evaluations" ON player_evaluations;
DROP POLICY IF EXISTS "Players can view their own evaluations" ON player_evaluations;

-- Recreate policies with better logic

-- Super admins can do everything
CREATE POLICY "Super admins can manage all evaluations" ON player_evaluations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Coaches and admins can create evaluations for players in their teams
CREATE POLICY "Coaches can create evaluations" ON player_evaluations 
  FOR INSERT 
  WITH CHECK (
    -- Check if user is super_admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin')
    )
    OR
    -- Or check if user has coach/admin role for the player's team
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
    -- Super admins can see all
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin')
    )
    OR
    -- Coaches can see their team's evaluations
    EXISTS (
      SELECT 1 FROM players p
      JOIN user_team_roles utr ON p.team_id = utr.team_id
      WHERE p.id = player_id 
        AND utr.user_id = auth.uid()
        AND utr.role IN ('coach', 'admin')
    )
    OR
    -- Players can see their own
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_id 
        AND p.user_id = auth.uid()
    )
  );

-- Coaches can update evaluations they created or if they're admin
CREATE POLICY "Coaches can update evaluations" ON player_evaluations 
  FOR UPDATE 
  USING (
    coach_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Coaches can delete evaluations they created or if they're admin
CREATE POLICY "Coaches can delete evaluations" ON player_evaluations 
  FOR DELETE 
  USING (
    coach_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Update evaluation_scores policies
DROP POLICY IF EXISTS "Coaches can manage evaluation scores" ON evaluation_scores;
DROP POLICY IF EXISTS "Players can view their own scores" ON evaluation_scores;

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

-- Coaches can manage scores for evaluations they have access to
CREATE POLICY "Coaches can manage evaluation scores" ON evaluation_scores 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM player_evaluations pe
      WHERE pe.id = evaluation_id 
        AND (
          pe.coach_id = auth.uid()
          OR
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('super_admin', 'admin')
          )
        )
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
