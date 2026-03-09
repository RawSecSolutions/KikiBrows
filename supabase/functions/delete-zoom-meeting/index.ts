import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getZoomAccessToken(): Promise<string> {
  const accountId = Deno.env.get("ZOOM_ACCOUNT_ID")!;
  const clientId = Deno.env.get("ZOOM_CLIENT_ID")!;
  const clientSecret = Deno.env.get("ZOOM_CLIENT_SECRET")!;

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "account_credentials",
      account_id: accountId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error al obtener token de Zoom: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

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

    // Verificar usuario y rol admin
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

    const { slot_id } = await req.json();

    if (!slot_id) {
      return new Response(JSON.stringify({ error: "Falta slot_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obtener el slot con su zoom_meeting_id
    const { data: slot, error: fetchError } = await supabase
      .from("consulta_slots")
      .select("id, zoom_meeting_id, cupos_ocupados")
      .eq("id", slot_id)
      .single();

    if (fetchError || !slot) {
      return new Response(JSON.stringify({ error: "Slot no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Eliminar meeting en Zoom si existe
    if (slot.zoom_meeting_id) {
      try {
        const zoomToken = await getZoomAccessToken();
        const zoomRes = await fetch(`https://api.zoom.us/v2/meetings/${slot.zoom_meeting_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${zoomToken}` },
        });
        if (!zoomRes.ok && zoomRes.status !== 404) {
          console.warn("No se pudo eliminar meeting de Zoom:", zoomRes.status);
        }
      } catch (zoomErr) {
        console.warn("Error eliminando meeting de Zoom (continuando):", zoomErr);
      }
    }

    // Eliminar reservas asociadas
    const { error: delReservasError } = await supabase
      .from("consultas_reservas")
      .delete()
      .eq("slot_id", slot_id);

    if (delReservasError) {
      console.error("Error eliminando reservas:", delReservasError);
    }

    // Eliminar el slot
    const { error: delSlotError } = await supabase
      .from("consulta_slots")
      .delete()
      .eq("id", slot_id);

    if (delSlotError) {
      return new Response(JSON.stringify({ error: "Error al eliminar slot", detail: delSlotError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      had_reservations: slot.cupos_ocupados > 0,
    }), {
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
