-- 20251111000002_player_read_team.sql
-- Allow players to read their own team information

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "teams_player_read_own" ON public.teams;

-- Create policy for players to read their own team
-- A player can read a team if they have a player record linked to that team
CREATE POLICY "teams_player_read_own"
ON public.teams
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.players p
    WHERE p.team_id = teams.id
    AND p.user_id = auth.uid()
  )
);

-- Add comment for documentation
COMMENT ON POLICY "teams_player_read_own" ON public.teams IS 
'Allows players to read information about their own team';
