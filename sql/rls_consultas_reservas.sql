-- RLS Policies para consultas_reservas
-- Ejecutar este SQL en el SQL Editor de Supabase Dashboard.
--
-- IMPORTANTE: La policy "Usuarios pueden crear reservas" tenía with check (7)
-- lo cual es un literal numérico inválido como condición booleana.
-- Se corrige para que solo usuarios autenticados puedan crear reservas para sí mismos.

-- Corregir policy INSERT: solo usuarios autenticados pueden crear reservas para sí mismos
ALTER POLICY "Usuarios pueden crear reservas"
ON "public"."consultas_reservas"
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

-- Verificar que las demás policies estén correctas:

-- SELECT: usuarios solo ven sus propias reservas
-- ALTER POLICY "Usuarios pueden ver sus propias reservas"
-- ON "public"."consultas_reservas"
-- TO authenticated
-- USING (auth.uid() = usuario_id);

-- UPDATE: usuarios solo pueden actualizar sus propias reservas
-- ALTER POLICY "Usuarios pueden actualizar sus reservas"
-- ON "public"."consultas_reservas"
-- TO authenticated
-- USING (auth.uid() = usuario_id)
-- WITH CHECK (auth.uid() = usuario_id);
