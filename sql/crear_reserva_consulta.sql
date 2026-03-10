-- RPC: crear_reserva_consulta
-- Crea una reserva y actualiza los cupos del slot de forma atómica (server-side).
-- Esto evita problemas de RLS donde el alumno no puede hacer UPDATE en consulta_slots
-- y también elimina race conditions entre verificar cupos e insertarlos.
--
-- Ejecutar este SQL en el SQL Editor de Supabase Dashboard.

CREATE OR REPLACE FUNCTION crear_reserva_consulta(
    p_slot_id UUID,
    p_usuario_id UUID,
    p_curso_id UUID DEFAULT NULL,
    p_curso_nombre_snapshot TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slot RECORD;
    v_reserva RECORD;
    v_nuevos_cupos INT;
    v_nuevo_estado TEXT;
BEGIN
    -- 1. Obtener el slot con bloqueo para evitar race conditions
    SELECT cupos_maximos, cupos_ocupados, estado
    INTO v_slot
    FROM consulta_slots
    WHERE id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El horario seleccionado no existe.';
    END IF;

    -- 2. Verificar disponibilidad
    IF v_slot.estado != 'DISPONIBLE' OR v_slot.cupos_ocupados >= v_slot.cupos_maximos THEN
        RAISE EXCEPTION 'Lo sentimos, este horario ya no tiene cupos disponibles.';
    END IF;

    -- 3. Insertar la reserva
    INSERT INTO consultas_reservas (slot_id, usuario_id, curso_id, curso_nombre_snapshot)
    VALUES (p_slot_id, p_usuario_id, p_curso_id, p_curso_nombre_snapshot)
    RETURNING * INTO v_reserva;

    -- 4. Actualizar cupos atómicamente
    v_nuevos_cupos := v_slot.cupos_ocupados + 1;
    v_nuevo_estado := CASE WHEN v_nuevos_cupos >= v_slot.cupos_maximos THEN 'LLENO' ELSE 'DISPONIBLE' END;

    UPDATE consulta_slots
    SET cupos_ocupados = v_nuevos_cupos,
        estado = v_nuevo_estado
    WHERE id = p_slot_id;

    -- 5. Retornar la reserva creada
    RETURN jsonb_build_object(
        'id', v_reserva.id,
        'slot_id', v_reserva.slot_id,
        'usuario_id', v_reserva.usuario_id,
        'curso_id', v_reserva.curso_id,
        'curso_nombre_snapshot', v_reserva.curso_nombre_snapshot,
        'created_at', v_reserva.created_at
    );

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Ya tienes una reserva para este horario.';
END;
$$;
