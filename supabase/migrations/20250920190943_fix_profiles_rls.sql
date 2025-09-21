-- =========================================================
-- fix_profiles_rls: elimina policy recursiva y la reemplaza
-- por una policy que usa función SECURITY DEFINER.
-- Idempotente y apta para CI/CD.
-- =========================================================

-- 1) Quitar la policy recursiva si existe
DROP POLICY IF EXISTS profiles_admin_can_select_all ON public.profiles;

-- 2) Función helper: verifica si uid es admin o super_admin
--    - SECURITY DEFINER para evitar RLS y recursión
--    - search_path fijado a public para evitar hijacking
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = uid AND p.role IN ('admin','super_admin')
);
$fn$;

-- Asegurar permisos de ejecución para clientes autenticados
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- 3) Crear la policy “admin puede seleccionar todo” sin recursión
CREATE POLICY profiles_admin_can_select_all
  ON public.profiles
  FOR SELECT
                                                          USING ( public.is_admin(auth.uid()) );
