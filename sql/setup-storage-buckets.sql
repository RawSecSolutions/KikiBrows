-- ============================================================
-- Setup de Buckets de Storage para KikiBrows
-- ============================================================
-- Ejecutar este script en el SQL Editor de Supabase si los
-- buckets no existen. También se pueden crear manualmente
-- desde Supabase Dashboard > Storage > New Bucket.
-- ============================================================

-- 1. Bucket para imágenes de portada de cursos
INSERT INTO storage.buckets (id, name, public)
VALUES ('curso-portadas', 'curso-portadas', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Bucket para videos de clases
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Bucket para documentos PDF de clases
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Bucket para entregas de alumnos
INSERT INTO storage.buckets (id, name, public)
VALUES ('entregas', 'entregas', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Políticas de acceso público para lectura (SELECT)
-- ============================================================

-- Permitir lectura pública de portadas
CREATE POLICY IF NOT EXISTS "Lectura publica portadas"
ON storage.objects FOR SELECT
USING (bucket_id = 'curso-portadas');

-- Permitir lectura pública de videos
CREATE POLICY IF NOT EXISTS "Lectura publica videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Permitir lectura pública de documentos
CREATE POLICY IF NOT EXISTS "Lectura publica documentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos');

-- Permitir lectura pública de entregas
CREATE POLICY IF NOT EXISTS "Lectura publica entregas"
ON storage.objects FOR SELECT
USING (bucket_id = 'entregas');

-- ============================================================
-- Políticas de subida (INSERT) - usuarios autenticados
-- ============================================================

-- Permitir subida a portadas (usuarios autenticados)
CREATE POLICY IF NOT EXISTS "Subida autenticada portadas"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'curso-portadas' AND auth.role() = 'authenticated');

-- Permitir subida a videos (usuarios autenticados)
CREATE POLICY IF NOT EXISTS "Subida autenticada videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Permitir subida a documentos (usuarios autenticados)
CREATE POLICY IF NOT EXISTS "Subida autenticada documentos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos' AND auth.role() = 'authenticated');

-- Permitir subida a entregas (usuarios autenticados)
CREATE POLICY IF NOT EXISTS "Subida autenticada entregas"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'entregas' AND auth.role() = 'authenticated');
