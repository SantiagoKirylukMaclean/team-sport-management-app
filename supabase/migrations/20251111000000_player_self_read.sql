-- 20251111000000_player_self_read.sql
-- Add RLS policy to allow players to read their own record

-- Drop existing policy if it exists
drop policy if exists "players self read" on public.players;

-- Create policy for players to read their own record
create policy "players self read"
on public.players
for select
using (user_id = auth.uid());

-- Add comment for documentation
comment on policy "players self read" on public.players is 
'Allows authenticated users to read their own player record based on user_id';
