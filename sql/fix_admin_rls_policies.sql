-- ============================================================
-- FIX: Admin RLS Policies for transacciones and consultas_reservas
-- ============================================================
-- Problem: Admin users see 0 rows in admin tables because RLS policies
-- only allow users to see their own records (auth.uid() = usuario_id).
-- Admin/superadmin users need to see ALL records.
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor).
-- ============================================================

-- Helper function to check if the current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  );
$$;

-- ============================================================
-- TRANSACCIONES: Allow admins to read all transactions
-- ============================================================

-- Drop existing select policy if it only allows own records
DO $$
BEGIN
  -- Try to drop common policy names (won't error if they don't exist)
  BEGIN
    DROP POLICY IF EXISTS "Users can view own transactions" ON public.transacciones;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "Usuarios pueden ver sus transacciones" ON public.transacciones;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "Enable read access for users" ON public.transacciones;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Create new policy: users see own records, admins see all
CREATE POLICY "Users and admins can read transactions"
ON public.transacciones
FOR SELECT
TO authenticated
USING (
  auth.uid() = usuario_id
  OR public.is_admin()
);

-- ============================================================
-- CONSULTAS_RESERVAS: Allow admins to read/manage all reservations
-- ============================================================

DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Users can view own reservations" ON public.consultas_reservas;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "Usuarios pueden ver sus reservas" ON public.consultas_reservas;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "Enable read access for users" ON public.consultas_reservas;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- SELECT: users see own, admins see all
CREATE POLICY "Users and admins can read reservations"
ON public.consultas_reservas
FOR SELECT
TO authenticated
USING (
  auth.uid() = usuario_id
  OR public.is_admin()
);

-- DELETE: admins can delete any reservation (needed for slot deletion)
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Admins can delete reservations" ON public.consultas_reservas;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

CREATE POLICY "Admins can delete reservations"
ON public.consultas_reservas
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

-- ============================================================
-- PROFILES: Allow admins to read all profiles (for user names in tables)
-- ============================================================

DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "Usuarios pueden ver su perfil" ON public.profiles;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "Enable read access for users" ON public.profiles;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

CREATE POLICY "Users and admins can read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR public.is_admin()
);

-- ============================================================
-- VERIFICATION: Check that policies were created
-- ============================================================
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('transacciones', 'consultas_reservas', 'profiles')
ORDER BY tablename, policyname;
