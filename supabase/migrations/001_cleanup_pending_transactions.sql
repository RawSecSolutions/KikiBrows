-- ============================================================
-- LIMPIEZA AUTOMATICA DE TRANSACCIONES PENDIENTES (>30 min)
-- ============================================================
-- Este script crea:
-- 1. Una funcion que elimina transacciones PENDIENTES con mas de 30 minutos
-- 2. Un job de pg_cron que ejecuta la funcion cada 5 minutos
--
-- INSTRUCCIONES: Ejecutar este SQL en el SQL Editor de Supabase Dashboard
-- ============================================================

-- ── 1. Habilitar la extension pg_cron (si no esta habilitada) ──
-- NOTA: En Supabase, pg_cron ya viene pre-instalado.
-- Solo necesitas habilitarla desde Dashboard > Database > Extensions > pg_cron
-- O ejecutar:
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Dar permisos al schema cron
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ── 2. Crear la funcion de limpieza ──
CREATE OR REPLACE FUNCTION public.limpiar_transacciones_pendientes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    filas_eliminadas integer;
BEGIN
    -- Eliminar transacciones que llevan mas de 30 minutos en estado PENDIENTE
    DELETE FROM public.transacciones
    WHERE estado = 'PENDIENTE'
      AND fecha_compra < NOW() - INTERVAL '30 minutes';

    GET DIAGNOSTICS filas_eliminadas = ROW_COUNT;

    -- Log para monitoreo (visible en Supabase Logs)
    IF filas_eliminadas > 0 THEN
        RAISE LOG 'limpiar_transacciones_pendientes: % transacciones eliminadas', filas_eliminadas;
    END IF;

    RETURN filas_eliminadas;
END;
$$;

-- Comentario descriptivo
COMMENT ON FUNCTION public.limpiar_transacciones_pendientes()
IS 'Elimina transacciones en estado PENDIENTE que tienen mas de 30 minutos desde su creacion. Ejecutada automaticamente por pg_cron cada 5 minutos.';

-- ── 3. Programar el job con pg_cron (cada 5 minutos) ──
-- Primero eliminar el job si ya existe (para evitar duplicados)
SELECT cron.unschedule('limpiar-transacciones-pendientes')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'limpiar-transacciones-pendientes'
);

-- Crear el job: ejecutar cada 5 minutos
SELECT cron.schedule(
    'limpiar-transacciones-pendientes',        -- nombre del job
    '*/5 * * * *',                              -- cada 5 minutos
    $$SELECT public.limpiar_transacciones_pendientes()$$
);

-- ── 4. Verificar que el job fue creado ──
-- SELECT * FROM cron.job WHERE jobname = 'limpiar-transacciones-pendientes';

-- ── 5. (Opcional) Ejecutar manualmente para probar ──
-- SELECT public.limpiar_transacciones_pendientes();
