-- 1) Enum de roles (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','coach','player');
END IF;
END $$;

-- 2) Tabla profiles (si no existe)
CREATE TABLE IF NOT EXISTS public.profiles (
                                               id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE,
    display_name text,
    role public.app_role NOT NULL DEFAULT 'player',
    created_at timestamptz DEFAULT now()
    );

-- 3) Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4) Políticas RLS (drop + create para ser idempotentes)
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
                      USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
                      USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admin/SuperAdmin pueden leer todas
DROP POLICY IF EXISTS profiles_admin_can_select_all ON public.profiles;
CREATE POLICY profiles_admin_can_select_all
  ON public.profiles
  FOR SELECT
                                  USING (
                                  EXISTS (
                                  SELECT 1
                                  FROM public.profiles p
                                  WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
                                  )
                                  );

-- 5) Trigger: crear profile al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
INSERT INTO public.profiles (id, email, role)
VALUES (NEW.id, NEW.email, 'player')
    ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
