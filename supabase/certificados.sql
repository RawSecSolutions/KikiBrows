-- =====================================================
-- Tabla: certificados
-- Almacena los certificados emitidos a los alumnos
-- cuando completan un curso al 100%.
-- =====================================================

CREATE TABLE certificados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    nombre_alumno_snapshot TEXT NOT NULL,
    nombre_curso_snapshot TEXT NOT NULL,
    url_descarga TEXT,
    codigo_verificacion TEXT NOT NULL UNIQUE,
    fecha_emision TIMESTAMPTZ DEFAULT NOW(),

    -- Un alumno solo puede tener un certificado por curso
    UNIQUE(usuario_id, curso_id)
);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;

-- Los alumnos pueden ver sus propios certificados
CREATE POLICY "Alumnos pueden ver sus certificados"
    ON certificados
    FOR SELECT
    USING (auth.uid() = usuario_id);

-- Los alumnos pueden generar su propio certificado
CREATE POLICY "Alumnos pueden crear su certificado"
    ON certificados
    FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

-- Los admins pueden ver todos los certificados
CREATE POLICY "Admins pueden ver todos los certificados"
    ON certificados
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin')
        )
    );

-- Indice para búsquedas por código de verificación
CREATE INDEX idx_certificados_codigo ON certificados(codigo_verificacion);

-- Indice para búsquedas por usuario
CREATE INDEX idx_certificados_usuario ON certificados(usuario_id);
