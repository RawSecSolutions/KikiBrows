-- Migración: Configurar cron job para limpiar inscripciones expiradas
-- Ejecutar en el SQL Editor de Supabase
--
-- Opción A: Usando pg_cron + pg_net (recomendado para Supabase)
-- Ejecuta la Edge Function cada día a las 3:00 AM UTC
--
-- IMPORTANTE: Reemplaza <TU_SERVICE_ROLE_KEY> con tu clave service_role real
-- y <TU_PROJECT_REF> con el ref de tu proyecto Supabase

-- Habilitar extensiones necesarias (ya suelen estar habilitadas)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- Opción A: Cron que invoca la Edge Function via HTTP
/*
SELECT cron.schedule(
    'cleanup-expired-courses',     -- nombre del job
    '0 3 * * *',                   -- cada día a las 3:00 AM UTC
    $$
    SELECT net.http_post(
        url := 'https://wrmelwftwumsfwzjjoxa.supabase.co/functions/v1/cleanup-expired-courses',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer <TU_SERVICE_ROLE_KEY>'
        ),
        body := '{}'::jsonb
    );
    $$
);
*/

-- Opción B: Cron que ejecuta SQL directamente (sin Edge Function)
-- Esta opción es más simple y no requiere deployar la Edge Function
SELECT cron.schedule(
    'cleanup-expired-courses-sql',
    '0 3 * * *',
    $$
    -- Eliminar progreso_clases de inscripciones expiradas hace +10 días
    DELETE FROM progreso_clases
    WHERE usuario_id IN (
        SELECT DISTINCT i.usuario_id
        FROM inscripciones i
        WHERE i.fecha_expiracion IS NOT NULL
          AND i.fecha_expiracion < NOW() - INTERVAL '10 days'
    )
    AND clase_id IN (
        SELECT c.id
        FROM clases c
        JOIN modulos m ON c.modulo_id = m.id
        WHERE m.curso_id IN (
            SELECT i2.curso_id
            FROM inscripciones i2
            WHERE i2.fecha_expiracion IS NOT NULL
              AND i2.fecha_expiracion < NOW() - INTERVAL '10 days'
        )
    );

    -- Eliminar inscripciones expiradas hace más de 10 días
    DELETE FROM inscripciones
    WHERE fecha_expiracion IS NOT NULL
      AND fecha_expiracion < NOW() - INTERVAL '10 days';
    $$
);
