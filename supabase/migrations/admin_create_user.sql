-- ============================================================
-- Funcion: admin_create_user
-- Descripcion: Crea un usuario directamente en auth.users
--              SIN enviar email de confirmacion/verificacion.
--              El email queda marcado como confirmado inmediatamente.
--
-- USO: Ejecutar este SQL en el SQL Editor de Supabase Dashboard.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_create_user(
    p_email TEXT,
    p_password TEXT,
    p_first_name TEXT DEFAULT '',
    p_last_name TEXT DEFAULT '',
    p_role TEXT DEFAULT 'student'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, extensions
AS $$
DECLARE
    new_user_id uuid;
    calling_user_role TEXT;
BEGIN
    -- Verificar que el usuario que llama es admin o superadmin
    SELECT role INTO calling_user_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF calling_user_role IS NULL OR calling_user_role NOT IN ('admin', 'superadmin') THEN
        RAISE EXCEPTION 'Solo administradores pueden crear usuarios';
    END IF;

    -- Verificar que el email no exista ya
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(p_email)) THEN
        RAISE EXCEPTION 'Ya existe un usuario con este email';
    END IF;

    -- Generar nuevo UUID
    new_user_id := gen_random_uuid();

    -- Insertar en auth.users con email_confirmed_at = now() (sin envio de email)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        raw_app_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        lower(p_email),
        crypt(p_password, gen_salt('bf')),
        now(),  -- Email confirmado inmediatamente
        jsonb_build_object(
            'first_name', p_first_name,
            'last_name', p_last_name,
            'role', p_role
        ),
        jsonb_build_object(
            'provider', 'email',
            'providers', ARRAY['email']
        ),
        now(),
        now(),
        '',
        false
    );

    -- Insertar en auth.identities (requerido para login con email/password)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        new_user_id,
        jsonb_build_object(
            'sub', new_user_id::text,
            'email', lower(p_email),
            'email_verified', true,
            'phone_verified', false
        ),
        'email',
        new_user_id::text,
        now(),
        now(),
        now()
    );

    RETURN new_user_id;
END;
$$;

-- Dar permisos para que usuarios autenticados puedan llamar la funcion
-- (la funcion internamente verifica que sea admin)
GRANT EXECUTE ON FUNCTION public.admin_create_user TO authenticated;
