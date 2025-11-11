-- 20251111000001_fix_player_rls.sql
-- Fix RLS policies for players to read their own data

-- Drop all existing player self-read policies
DROP POLICY IF EXISTS "players_own_read" ON public.players;
DROP POLICY IF EXISTS "players self read" ON public.players;

-- Create a single, clear policy for players to read their own record
CREATE POLICY "players_read_own"
ON public.players
FOR SELECT
USING (user_id = auth.uid());

-- Verify the policy was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'players' 
    AND policyname = 'players_read_own'
  ) THEN
    RAISE EXCEPTION 'Policy players_read_own was not created successfully';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON POLICY "players_read_own" ON public.players IS 
'Allows authenticated users to read their own player record based on user_id matching auth.uid()';
