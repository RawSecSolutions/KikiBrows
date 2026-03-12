// supabase/functions/cleanup-expired-courses/index.ts
// Edge Function: Limpia inscripciones expiradas hace más de 10 días.
// Se puede invocar manualmente o con un cron (pg_cron / pg_net).
//
// Lógica:
// 1. Busca inscripciones cuya fecha_expiracion + 10 días < ahora
// 2. Elimina esas inscripciones de la BD
// 3. Los certificados NO se tocan (persisten con snapshots)
//
// Invocación:
//   POST /functions/v1/cleanup-expired-courses
//   Header: Authorization: Bearer <service_role_key>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  try {
    // Crear cliente con service_role para bypass de RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Calcular fecha límite: 10 días antes de hoy
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 10);
    const fechaLimiteISO = fechaLimite.toISOString();

    // 1. Buscar inscripciones expiradas hace más de 10 días
    const { data: expiradas, error: fetchError } = await supabase
      .from("inscripciones")
      .select("id, usuario_id, curso_id, fecha_expiracion")
      .not("fecha_expiracion", "is", null)
      .lt("fecha_expiracion", fechaLimiteISO);

    if (fetchError) {
      throw new Error(`Error buscando inscripciones expiradas: ${fetchError.message}`);
    }

    if (!expiradas || expiradas.length === 0) {
      return new Response(
        JSON.stringify({ message: "No hay inscripciones expiradas para limpiar.", eliminadas: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const idsAEliminar = expiradas.map((i) => i.id);

    // 2. Eliminar inscripciones expiradas
    const { error: deleteError } = await supabase
      .from("inscripciones")
      .delete()
      .in("id", idsAEliminar);

    if (deleteError) {
      throw new Error(`Error eliminando inscripciones: ${deleteError.message}`);
    }

    // 3. También limpiar progreso_clases asociado (opcional, para mantener BD limpia)
    // Los certificados NO se eliminan ya que tienen snapshots independientes
    for (const inscripcion of expiradas) {
      // Obtener clases del curso para limpiar progreso
      const { data: modulos } = await supabase
        .from("modulos")
        .select("id")
        .eq("curso_id", inscripcion.curso_id);

      if (modulos && modulos.length > 0) {
        const moduloIds = modulos.map((m) => m.id);

        const { data: clases } = await supabase
          .from("clases")
          .select("id")
          .in("modulo_id", moduloIds);

        if (clases && clases.length > 0) {
          const claseIds = clases.map((c) => c.id);

          await supabase
            .from("progreso_clases")
            .delete()
            .eq("usuario_id", inscripcion.usuario_id)
            .in("clase_id", claseIds);
        }
      }
    }

    const resumen = expiradas.map((i) => ({
      inscripcion_id: i.id,
      usuario_id: i.usuario_id,
      curso_id: i.curso_id,
      fecha_expiracion: i.fecha_expiracion,
    }));

    return new Response(
      JSON.stringify({
        message: `Se eliminaron ${idsAEliminar.length} inscripciones expiradas.`,
        eliminadas: idsAEliminar.length,
        detalle: resumen,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
