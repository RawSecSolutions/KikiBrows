// supabase/functions/zoom-delete-meeting/index.ts
// Edge Function para eliminar un meeting de Zoom
// Requiere scope: meeting:delete:meeting:admin

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Obtener Access Token de Zoom usando Server-to-Server OAuth
async function getZoomAccessToken(): Promise<string> {
  const accountId = Deno.env.get('ZOOM_ACCOUNT_ID');
  const clientId = Deno.env.get('ZOOM_CLIENT_ID');
  const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Faltan credenciales de Zoom en variables de entorno');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error obteniendo token de Zoom: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticación del usuario
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No autorizado');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar que el usuario es admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('No autorizado');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      throw new Error('No tienes permisos de administrador');
    }

    // Obtener meeting_id del body
    const { meeting_id } = await req.json();

    if (!meeting_id) {
      throw new Error('meeting_id es requerido');
    }

    // Obtener token de Zoom
    const accessToken = await getZoomAccessToken();

    // Eliminar el meeting en Zoom
    const zoomResponse = await fetch(
      `https://api.zoom.us/v2/meetings/${meeting_id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 204 = eliminado exitosamente, 404 = ya no existe (ok también)
    if (zoomResponse.status === 204 || zoomResponse.status === 404) {
      return new Response(
        JSON.stringify({
          success: true,
          message: zoomResponse.status === 204
            ? 'Meeting eliminado de Zoom'
            : 'Meeting ya no existía en Zoom',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Error de Zoom
    const errorBody = await zoomResponse.text();
    console.error('Error de Zoom API:', zoomResponse.status, errorBody);

    return new Response(
      JSON.stringify({
        success: false,
        error: `Error de Zoom: ${zoomResponse.status}`,
        details: errorBody,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  } catch (err) {
    console.error('Error en zoom-delete-meeting:', err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
