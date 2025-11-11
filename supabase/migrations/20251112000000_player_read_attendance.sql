-- 20251112000000_player_read_attendance.sql
-- Allow players to read their own attendance records

-- ========== Training Sessions - Players can read sessions of their team ==========
DROP POLICY IF EXISTS "training_sessions_player_read_own" ON public.training_sessions;

CREATE POLICY "training_sessions_player_read_own"
ON public.training_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.players p
    WHERE p.team_id = training_sessions.team_id
    AND p.user_id = auth.uid()
  )
);

COMMENT ON POLICY "training_sessions_player_read_own" ON public.training_sessions IS 
'Allows players to read training sessions of their own team';

-- ========== Training Attendance - Players can read their own attendance ==========
DROP POLICY IF EXISTS "training_attendance_player_read_own" ON public.training_attendance;

CREATE POLICY "training_attendance_player_read_own"
ON public.training_attendance
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.players p
    WHERE p.id = training_attendance.player_id
    AND p.user_id = auth.uid()
  )
);

COMMENT ON POLICY "training_attendance_player_read_own" ON public.training_attendance IS 
'Allows players to read their own training attendance records';

-- ========== Match Call Ups - Players can read their own call ups ==========
DROP POLICY IF EXISTS "match_call_ups_player_read_own" ON public.match_call_ups;

CREATE POLICY "match_call_ups_player_read_own"
ON public.match_call_ups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.players p
    WHERE p.id = match_call_ups.player_id
    AND p.user_id = auth.uid()
  )
);

COMMENT ON POLICY "match_call_ups_player_read_own" ON public.match_call_ups IS 
'Allows players to read their own match call up records';
