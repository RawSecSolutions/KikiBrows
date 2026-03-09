-- Agregar columnas para Zoom API en consulta_slots
-- zoom_host_url: Link start_url para que el admin inicie la reunion
-- zoom_meeting_id: ID del meeting en Zoom para poder eliminarlo despues

ALTER TABLE consulta_slots
ADD COLUMN IF NOT EXISTS zoom_host_url text,
ADD COLUMN IF NOT EXISTS zoom_meeting_id bigint;

-- Comentarios para documentar
COMMENT ON COLUMN consulta_slots.zoom_link IS 'Join URL para las alumnas (participantes)';
COMMENT ON COLUMN consulta_slots.zoom_host_url IS 'Start URL para el admin (host) - contiene token temporal';
COMMENT ON COLUMN consulta_slots.zoom_meeting_id IS 'ID del meeting en Zoom API para gestionar/eliminar';
