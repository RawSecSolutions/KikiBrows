-- Función RPC para que un admin pueda cambiar el rol de otro usuario.
-- Ejecutar en el SQL Editor de Supabase Dashboard.
--
-- Usa SECURITY DEFINER para bypasear RLS (mismo patrón que
-- admin_toggle_bloqueo y admin_delete_user).

CREATE OR REPLACE FUNCTION admin_set_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_role TEXT;
BEGIN
    -- Verificar que el llamador es admin o superadmin
    SELECT role INTO caller_role
    FROM profiles
    WHERE id = auth.uid();

    IF caller_role IS NULL OR caller_role NOT IN ('admin', 'superadmin') THEN
        RAISE EXCEPTION 'Solo administradores pueden cambiar roles';
    END IF;

    -- No permitir cambiar el rol de un superadmin
    IF EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id AND role = 'superadmin') THEN
        RAISE EXCEPTION 'No se puede cambiar el rol de un Super Admin';
    END IF;

    -- Validar que el nuevo rol sea válido
    IF new_role NOT IN ('admin', 'student') THEN
        RAISE EXCEPTION 'Rol inválido: %', new_role;
    END IF;

    -- Actualizar el rol
    UPDATE profiles
    SET role = new_role
    WHERE id = target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil no encontrado';
    END IF;
END;
$$;
