import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token invalido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
      return new Response(JSON.stringify({ error: "Solo administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obtener slots con sus reservas
    const { data: slots, error: slotsError } = await supabase
      .from("consulta_slots")
      .select(`
        *,
        consultas_reservas (
          id,
          usuario_id,
          curso_id,
          curso_nombre_snapshot,
          created_at
        )
      `)
      .order("fecha_inicio", { ascending: true });

    if (slotsError) {
      return new Response(JSON.stringify({ error: "Error al obtener slots", detail: slotsError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Para cada reserva, obtener datos del perfil del usuario
    // (consultas_reservas.usuario_id -> auth.users.id -> profiles.id)
    const allUserIds = new Set<string>();
    for (const slot of slots || []) {
      for (const reserva of slot.consultas_reservas || []) {
        allUserIds.add(reserva.usuario_id);
      }
    }

    let profilesMap: Record<string, { first_name: string; last_name: string; email: string }> = {};

    if (allUserIds.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", Array.from(allUserIds));

      if (profiles) {
        for (const p of profiles) {
          profilesMap[p.id] = { first_name: p.first_name, last_name: p.last_name, email: p.email };
        }
      }
    }

    // Enriquecer reservas con datos de perfil
    const enrichedSlots = (slots || []).map(slot => ({
      ...slot,
      consultas_reservas: (slot.consultas_reservas || []).map((r: any) => ({
        ...r,
        alumna_nombre: profilesMap[r.usuario_id]
          ? `${profilesMap[r.usuario_id].first_name} ${profilesMap[r.usuario_id].last_name}`
          : "Sin nombre",
        alumna_email: profilesMap[r.usuario_id]?.email || "Sin email",
      })),
    }));

    return new Response(JSON.stringify({ success: true, data: enrichedSlots }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
