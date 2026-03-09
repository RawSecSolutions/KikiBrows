import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Obtener access token de Zoom usando Server-to-Server OAuth
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
    const errorText = await response.text();
    throw new Error(`Error al obtener token de Zoom: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar autenticacion via Supabase JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar que es admin usando Supabase
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

    // Verificar rol admin en profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
      return new Response(JSON.stringify({ error: "Solo administradores pueden crear slots" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parsear body
    const { fecha, inicio, fin, cupos_maximos } = await req.json();

    if (!fecha || !inicio || !fin || !cupos_maximos) {
      return new Response(JSON.stringify({ error: "Faltan campos requeridos: fecha, inicio, fin, cupos_maximos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calcular duracion en minutos
    const [hInicio, mInicio] = inicio.split(":").map(Number);
    const [hFin, mFin] = fin.split(":").map(Number);
    const duration = (hFin * 60 + mFin) - (hInicio * 60 + mInicio);

    if (duration <= 0) {
      return new Response(JSON.stringify({ error: "La hora de fin debe ser posterior a la de inicio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Crear meeting en Zoom
    const zoomToken = await getZoomAccessToken();

    const zoomResponse = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${zoomToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: `Consulta KikiBrows - ${fecha}`,
        type: 2, // Scheduled meeting
        start_time: `${fecha}T${inicio}:00`,
        duration: duration,
        timezone: "America/Santiago",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          approval_type: 0, // Automatically approve
        },
      }),
    });

    if (!zoomResponse.ok) {
      const zoomError = await zoomResponse.text();
      console.error("Zoom API error:", zoomError);
      return new Response(JSON.stringify({ error: "Error al crear meeting en Zoom", detail: zoomError }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const zoomMeeting = await zoomResponse.json();

    // 2. Insertar slot en la BD con los links reales de Zoom
    const fechaInicio = `${fecha}T${inicio}:00-03:00`; // Chile timezone offset
    const fechaFin = `${fecha}T${fin}:00-03:00`;

    const { data: slot, error: dbError } = await supabase
      .from("consulta_slots")
      .insert({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        zoom_link: zoomMeeting.join_url,
        zoom_host_url: zoomMeeting.start_url,
        zoom_meeting_id: zoomMeeting.id,
        cupos_maximos: cupos_maximos,
        cupos_ocupados: 0,
        estado: "DISPONIBLE",
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      // Intentar eliminar el meeting de Zoom si falla la BD
      await fetch(`https://api.zoom.us/v2/meetings/${zoomMeeting.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${zoomToken}` },
      });
      return new Response(JSON.stringify({ error: "Error al guardar slot en base de datos", detail: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: slot }), {
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
