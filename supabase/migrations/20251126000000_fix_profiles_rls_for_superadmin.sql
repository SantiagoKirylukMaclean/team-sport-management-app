-- Add policy to allow super_admins to update any profile
-- This is needed for the admin users page to work properly

drop policy if exists "profiles_superadmin_all" on public.profiles;
create policy "profiles_superadmin_all" on public.profiles
  for all using ( public.is_superadmin() ) with check ( public.is_superadmin() );
