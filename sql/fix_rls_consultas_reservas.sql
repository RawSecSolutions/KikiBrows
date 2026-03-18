-- ============================================================
-- FIX: RLS en consultas_reservas bloqueando lecturas de admin
-- ============================================================
-- PROBLEMA: La politica SELECT de consultas_reservas hace un subquery
-- a "profiles" para verificar el rol admin, pero "profiles" tambien
-- tiene RLS habilitado. PostgreSQL evalua el subquery bajo RLS,
-- lo que puede bloquear silenciosamente (0 filas, sin error).
--
-- SOLUCION: Crear una funcion SECURITY DEFINER que bypasea RLS
-- al verificar el rol, y usarla en las politicas.
-- ============================================================

-- 1. Crear funcion helper que verifica si el usuario actual es admin.
--    SECURITY DEFINER = se ejecuta con permisos del owner (postgres),
--    por lo tanto NO es afectada por RLS en la tabla profiles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  );
$$;

-- 2. Recrear politicas de consultas_reservas usando is_admin()

-- SELECT: Usuarios ven sus propias reservas, admins ven todas
DROP POLICY IF EXISTS "Users and admins can read reservations" ON consultas_reservas;
CREATE POLICY "Users and admins can read reservations" ON consultas_reservas
FOR SELECT USING (
    auth.uid() = usuario_id
    OR public.is_admin()
);

-- INSERT: Usuarios pueden crear sus propias reservas
DROP POLICY IF EXISTS "Users can create reservations" ON consultas_reservas;
CREATE POLICY "Users can create reservations" ON consultas_reservas
FOR INSERT WITH CHECK (
    auth.uid() = usuario_id
);

-- UPDATE: Usuarios actualizan sus reservas, admins actualizan todas
DROP POLICY IF EXISTS "Users and admins can update reservations" ON consultas_reservas;
CREATE POLICY "Users and admins can update reservations" ON consultas_reservas
FOR UPDATE USING (
    auth.uid() = usuario_id
    OR public.is_admin()
);

-- DELETE: Solo admins pueden eliminar reservas
DROP POLICY IF EXISTS "Admins can delete reservations" ON consultas_reservas;
CREATE POLICY "Admins can delete reservations" ON consultas_reservas
FOR DELETE USING (
    public.is_admin()
);

-- 3. Tambien arreglar profiles para que admins puedan leer todos los perfiles
DROP POLICY IF EXISTS "Users and admins can read profiles" ON profiles;
CREATE POLICY "Users and admins can read profiles" ON profiles
FOR SELECT USING (
    auth.uid() = id
    OR public.is_admin()
);
