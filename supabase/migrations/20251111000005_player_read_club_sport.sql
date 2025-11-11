-- 20251111000005_player_read_club_sport.sql
-- Allow players to read club and sport information for their team

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "clubs_player_read_own" ON public.clubs;
DROP POLICY IF EXISTS "sports_player_read_own" ON public.sports;

-- Create policy for players to read their club
-- A player can read a club if they have a player record linked to a team in that club
CREATE POLICY "clubs_player_read_own"
ON public.clubs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.players p
    JOIN public.teams t ON t.id = p.team_id
    WHERE t.club_id = clubs.id
    AND p.user_id = auth.uid()
  )
);

-- Create policy for players to read their sport
-- A player can read a sport if they have a player record linked to a team in a club of that sport
CREATE POLICY "sports_player_read_own"
ON public.sports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.players p
    JOIN public.teams t ON t.id = p.team_id
    JOIN public.clubs c ON c.id = t.club_id
    WHERE c.sport_id = sports.id
    AND p.user_id = auth.uid()
  )
);

-- Add comments for documentation
COMMENT ON POLICY "clubs_player_read_own" ON public.clubs IS 
'Allows players to read information about their own club';

COMMENT ON POLICY "sports_player_read_own" ON public.sports IS 
'Allows players to read information about their own sport';
