-- ============================================================
-- KIKIBROWS - Creación de tablas: progreso_clases y entregas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- TABLA 1: progreso_clases
-- ============================================================
-- Registra el progreso individual del alumno en cada clase.
-- Escenarios:
--   1. Barra de progreso en "Mis Cursos" (contar completadas / total clases)
--   2. Reanudar curso (guardar segundo_actual del video, respuestas del quiz)
--   3. Guardar calificación de quizzes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.progreso_clases (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    clase_id        UUID NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
    completada      BOOLEAN DEFAULT FALSE,
    segundo_actual  INTEGER DEFAULT 0,          -- Posición del video en segundos (para reanudar)
    calificacion    REAL DEFAULT NULL,           -- Nota del quiz (0-100), NULL si no aplica
    respuestas_usuario JSONB DEFAULT NULL,       -- JSON con respuestas del quiz: [{questionId, selected, correct, isCorrect, puntos}]
    fecha_completado TIMESTAMPTZ DEFAULT NULL,   -- Cuándo se completó la clase
    ultimo_acceso   TIMESTAMPTZ DEFAULT NOW(),   -- Última vez que el alumno accedió a esta clase
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    -- Un solo registro por usuario por clase
    CONSTRAINT progreso_clases_usuario_clase_unique UNIQUE(usuario_id, clase_id)
);

-- Comentarios descriptivos
COMMENT ON TABLE public.progreso_clases IS 'Progreso del alumno por clase. Permite barra de progreso, reanudar curso y guardar intentos de quiz.';
COMMENT ON COLUMN public.progreso_clases.segundo_actual IS 'Posición actual del video en segundos para reanudar reproducción';
COMMENT ON COLUMN public.progreso_clases.calificacion IS 'Calificación del quiz (0-100). NULL para clases que no son QUIZ';
COMMENT ON COLUMN public.progreso_clases.respuestas_usuario IS 'JSON con las respuestas del alumno al quiz';

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_progreso_clases_usuario
    ON public.progreso_clases(usuario_id);

CREATE INDEX IF NOT EXISTS idx_progreso_clases_clase
    ON public.progreso_clases(clase_id);

CREATE INDEX IF NOT EXISTS idx_progreso_clases_usuario_completada
    ON public.progreso_clases(usuario_id, completada)
    WHERE completada = TRUE;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_progreso_clases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_progreso_clases_updated_at ON public.progreso_clases;
CREATE TRIGGER trigger_progreso_clases_updated_at
    BEFORE UPDATE ON public.progreso_clases
    FOR EACH ROW
    EXECUTE FUNCTION public.update_progreso_clases_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.progreso_clases ENABLE ROW LEVEL SECURITY;

-- Política: El alumno puede ver su propio progreso
CREATE POLICY "Alumnos pueden ver su propio progreso"
    ON public.progreso_clases
    FOR SELECT
    USING (auth.uid() = usuario_id);

-- Política: El alumno puede insertar su propio progreso
CREATE POLICY "Alumnos pueden insertar su propio progreso"
    ON public.progreso_clases
    FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

-- Política: El alumno puede actualizar su propio progreso
CREATE POLICY "Alumnos pueden actualizar su propio progreso"
    ON public.progreso_clases
    FOR UPDATE
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- Política: Admins pueden ver todo el progreso (para reportes/dashboard)
CREATE POLICY "Admins pueden ver todo el progreso"
    ON public.progreso_clases
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin')
        )
    );


-- ============================================================
-- TABLA 2: entregas
-- ============================================================
-- NOTA: Esta tabla YA EXISTE en tu base de datos.
-- El siguiente código usa IF NOT EXISTS para que no falle si ya está creada.
-- Si necesitas agregar columnas faltantes, usa ALTER TABLE al final.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.entregas (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clase_id            UUID NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
    usuario_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    archivo_url         TEXT NOT NULL,                   -- URL del archivo en Storage bucket 'entregas'
    tipo_archivo        VARCHAR(20) NOT NULL,            -- Extensión: 'pdf', 'mp4', 'jpg', etc.
    comentario_alumno   TEXT DEFAULT NULL,               -- Comentario opcional del alumno al entregar
    estado              VARCHAR(20) DEFAULT 'PENDIENTE'  -- 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'
                        CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')),
    feedback_instructor TEXT DEFAULT NULL,               -- Corrección/feedback del admin/instructor
    calificacion        REAL DEFAULT NULL,               -- Nota numérica (0-100) asignada por instructor
    intento_numero      INTEGER DEFAULT 1,               -- Número de intento: 1, 2, 3...
    fecha_entrega       TIMESTAMPTZ DEFAULT NOW(),       -- Cuándo el alumno hizo la entrega
    fecha_revision      TIMESTAMPTZ DEFAULT NULL,        -- Cuándo el instructor revisó
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.entregas IS 'Entregas prácticas de los alumnos. El instructor revisa y da feedback/calificación.';

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_entregas_usuario
    ON public.entregas(usuario_id);

CREATE INDEX IF NOT EXISTS idx_entregas_clase
    ON public.entregas(clase_id);

CREATE INDEX IF NOT EXISTS idx_entregas_estado
    ON public.entregas(estado);

CREATE INDEX IF NOT EXISTS idx_entregas_clase_usuario
    ON public.entregas(clase_id, usuario_id);

-- Índice para la página de revisiones del admin (pendientes primero)
CREATE INDEX IF NOT EXISTS idx_entregas_estado_fecha
    ON public.entregas(estado, fecha_entrega DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_entregas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_entregas_updated_at ON public.entregas;
CREATE TRIGGER trigger_entregas_updated_at
    BEFORE UPDATE ON public.entregas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_entregas_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

-- Política: El alumno puede ver sus propias entregas
CREATE POLICY "Alumnos pueden ver sus propias entregas"
    ON public.entregas
    FOR SELECT
    USING (auth.uid() = usuario_id);

-- Política: El alumno puede insertar sus propias entregas
CREATE POLICY "Alumnos pueden insertar sus propias entregas"
    ON public.entregas
    FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

-- Política: El alumno puede eliminar sus entregas PENDIENTES
CREATE POLICY "Alumnos pueden eliminar sus entregas pendientes"
    ON public.entregas
    FOR DELETE
    USING (auth.uid() = usuario_id AND estado = 'PENDIENTE');

-- Política: Admins pueden ver todas las entregas (para revisiones)
CREATE POLICY "Admins pueden ver todas las entregas"
    ON public.entregas
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin')
        )
    );

-- Política: Admins pueden actualizar entregas (para dar feedback/calificar)
CREATE POLICY "Admins pueden actualizar entregas"
    ON public.entregas
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin')
        )
    );


-- ============================================================
-- COLUMNAS ADICIONALES EN ENTREGAS (si la tabla ya existe)
-- ============================================================
-- Ejecuta estas líneas SOLO si la tabla entregas ya existe
-- y le faltan columnas. Si alguna ya existe, dará un aviso
-- inofensivo (no error fatal).
-- ============================================================

DO $$
BEGIN
    -- Agregar fecha_entrega si no existe (tu tabla actual usa created_at)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'entregas'
        AND column_name = 'fecha_entrega'
    ) THEN
        ALTER TABLE public.entregas ADD COLUMN fecha_entrega TIMESTAMPTZ DEFAULT NOW();
        -- Poblar con created_at existente
        UPDATE public.entregas SET fecha_entrega = created_at WHERE fecha_entrega IS NULL;
    END IF;

    -- Agregar comentario_alumno si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'entregas'
        AND column_name = 'comentario_alumno'
    ) THEN
        ALTER TABLE public.entregas ADD COLUMN comentario_alumno TEXT DEFAULT NULL;
    END IF;

    -- Agregar CHECK constraint en estado si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'entregas'
        AND constraint_type = 'CHECK'
        AND constraint_name = 'entregas_estado_check'
    ) THEN
        BEGIN
            ALTER TABLE public.entregas
                ADD CONSTRAINT entregas_estado_check
                CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA'));
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Ignorar si ya existe con otro nombre
        END;
    END IF;
END $$;


-- ============================================================
-- FUNCIÓN AUXILIAR: Calcular porcentaje de progreso de un curso
-- ============================================================
-- Uso: SELECT calcular_progreso_curso('uuid-curso', 'uuid-usuario');
-- Retorna: porcentaje (0-100) de clases completadas en el curso
-- ============================================================

CREATE OR REPLACE FUNCTION public.calcular_progreso_curso(
    p_curso_id UUID,
    p_usuario_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    total_clases INTEGER;
    clases_completadas INTEGER;
BEGIN
    -- Total de clases en el curso (a través de módulos)
    SELECT COUNT(c.id) INTO total_clases
    FROM public.clases c
    INNER JOIN public.modulos m ON c.modulo_id = m.id
    WHERE m.curso_id = p_curso_id;

    IF total_clases = 0 THEN
        RETURN 0;
    END IF;

    -- Clases completadas por el usuario
    SELECT COUNT(pc.id) INTO clases_completadas
    FROM public.progreso_clases pc
    INNER JOIN public.clases c ON pc.clase_id = c.id
    INNER JOIN public.modulos m ON c.modulo_id = m.id
    WHERE m.curso_id = p_curso_id
    AND pc.usuario_id = p_usuario_id
    AND pc.completada = TRUE;

    RETURN ROUND((clases_completadas::NUMERIC / total_clases::NUMERIC) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- FUNCIÓN AUXILIAR: Obtener última clase accedida (para reanudar)
-- ============================================================
-- Uso: SELECT * FROM obtener_ultima_clase_curso('uuid-curso', 'uuid-usuario');
-- Retorna: clase_id, modulo_id, segundo_actual de la última clase accedida
-- ============================================================

CREATE OR REPLACE FUNCTION public.obtener_ultima_clase_curso(
    p_curso_id UUID,
    p_usuario_id UUID
)
RETURNS TABLE (
    clase_id UUID,
    modulo_id UUID,
    nombre_clase TEXT,
    nombre_modulo TEXT,
    segundo_actual INTEGER,
    completada BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS clase_id,
        m.id AS modulo_id,
        c.nombre::TEXT AS nombre_clase,
        m.nombre::TEXT AS nombre_modulo,
        COALESCE(pc.segundo_actual, 0) AS segundo_actual,
        COALESCE(pc.completada, FALSE) AS completada
    FROM public.progreso_clases pc
    INNER JOIN public.clases c ON pc.clase_id = c.id
    INNER JOIN public.modulos m ON c.modulo_id = m.id
    WHERE m.curso_id = p_curso_id
    AND pc.usuario_id = p_usuario_id
    ORDER BY pc.ultimo_acceso DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
