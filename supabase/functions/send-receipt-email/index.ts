// supabase/functions/send-receipt-email/index.ts
// Edge Function para enviar boleta de compra por correo usando Resend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SMTP_FROM = Deno.env.get("SMTP_FROM") || "KIKIBROWS <no-reply@kikibrows.cl>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { transaccionId } = await req.json();

    if (!transaccionId) {
      return new Response(
        JSON.stringify({ success: false, error: "transaccionId es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Crear cliente Supabase con service_role key para bypassear RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Obtener datos de la transaccion con el curso y el usuario
    const { data: transaccion, error: trxError } = await supabase
      .from("transacciones")
      .select(`
        id,
        usuario_id,
        curso_id,
        monto,
        estado,
        metodo_pago,
        codigo_autorizacion,
        fecha_compra,
        folio_visual,
        curso_titulo_snapshot,
        cursos ( nombre )
      `)
      .eq("id", transaccionId)
      .single();

    if (trxError || !transaccion) {
      console.error("Error obteniendo transaccion:", trxError);
      return new Response(
        JSON.stringify({ success: false, error: "Transaccion no encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Solo enviar boleta para transacciones PAGADAS
    if (transaccion.estado !== "PAGADO") {
      return new Response(
        JSON.stringify({ success: false, error: "Solo se envian boletas para transacciones PAGADAS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obtener email del usuario desde auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      transaccion.usuario_id
    );

    if (userError || !userData?.user?.email) {
      console.error("Error obteniendo usuario:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "No se pudo obtener el email del usuario" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obtener nombre del usuario desde profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", transaccion.usuario_id)
      .single();

    const userEmail = userData.user.email;
    const userName = profile
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
      : "Cliente";

    const cursoNombre =
      transaccion.cursos?.nombre ||
      transaccion.curso_titulo_snapshot ||
      "Curso KikiBrows";

    const folioVisual = transaccion.folio_visual
      ? `BOL-${transaccion.folio_visual}`
      : transaccion.id;

    const fechaCompra = new Date(transaccion.fecha_compra);
    const fechaFormateada = fechaCompra.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const montoFormateado = `$${parseInt(transaccion.monto).toLocaleString("es-CL")} CLP`;

    const metodoPagoNombres: Record<string, string> = {
      BANCHILE: "Banchile Pagos",
      GETNET: "Getnet Web Checkout",
      TRANSBANK: "Webpay Plus",
      MERCADOPAGO: "Mercado Pago",
    };
    const metodoPagoDisplay =
      metodoPagoNombres[transaccion.metodo_pago] || transaccion.metodo_pago || "Banchile Pagos";

    // Generar HTML del email con branding KIKIBROWS
    const emailHtml = generarHtmlBoleta({
      userName,
      cursoNombre,
      fechaFormateada,
      metodoPagoDisplay,
      codigoAutorizacion: transaccion.codigo_autorizacion || "N/A",
      folioVisual: String(folioVisual),
      montoFormateado,
    });

    // Enviar email con Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: SMTP_FROM,
        to: [userEmail],
        subject: `Boleta de Compra - ${cursoNombre} | KIKIBROWS`,
        html: emailHtml,
      }),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Error enviando email con Resend:", resendResult);
      return new Response(
        JSON.stringify({ success: false, error: "Error enviando email", details: resendResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Boleta enviada exitosamente a ${userEmail} para transaccion ${transaccionId}`);

    return new Response(
      JSON.stringify({ success: true, emailId: resendResult.id, to: userEmail }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error inesperado en send-receipt-email:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== GENERADOR DE HTML PARA EMAIL ====================

interface BoletaData {
  userName: string;
  cursoNombre: string;
  fechaFormateada: string;
  metodoPagoDisplay: string;
  codigoAutorizacion: string;
  folioVisual: string;
  montoFormateado: string;
}

function generarHtmlBoleta(data: BoletaData): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boleta de Compra - KIKIBROWS</title>
</head>
<body style="margin:0; padding:0; background-color:#F5F0E8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F5F0E8; padding:30px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#FFFFFF; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#F0EAE0; padding:30px 40px; text-align:center;">
              <h1 style="margin:0; font-size:28px; color:#8A835A; font-weight:700; letter-spacing:2px;">KIKIBROWS</h1>
              <p style="margin:8px 0 0; font-size:14px; color:#6B6550;">Boleta de Compra</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:30px 40px 10px;">
              <p style="margin:0; font-size:16px; color:#2C2A25;">
                Hola <strong>${data.userName}</strong>,
              </p>
              <p style="margin:10px 0 0; font-size:15px; color:#555; line-height:1.6;">
                Tu compra ha sido procesada exitosamente. A continuacion encontraras los detalles de tu transaccion.
              </p>
            </td>
          </tr>

          <!-- Course Name Banner -->
          <tr>
            <td style="padding:15px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#8A835A; border-radius:8px; padding:18px 24px; text-align:center;">
                    <p style="margin:0; font-size:11px; color:#D8C9A0; text-transform:uppercase; letter-spacing:1px;">Curso adquirido</p>
                    <h2 style="margin:6px 0 0; font-size:18px; color:#FFFFFF; font-weight:600;">${data.cursoNombre}</h2>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Transaction Details -->
          <tr>
            <td style="padding:10px 40px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #E8E3D8; border-radius:8px; overflow:hidden;">
                <tr>
                  <td style="padding:14px 20px; border-bottom:1px solid #E8E3D8; background-color:#FDFBF7;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size:13px; color:#8A835A; font-weight:600;">Folio</td>
                        <td style="font-size:13px; color:#2C2A25; text-align:right;">${data.folioVisual}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px; border-bottom:1px solid #E8E3D8;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size:13px; color:#8A835A; font-weight:600;">Fecha de Compra</td>
                        <td style="font-size:13px; color:#2C2A25; text-align:right;">${data.fechaFormateada}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px; border-bottom:1px solid #E8E3D8; background-color:#FDFBF7;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size:13px; color:#8A835A; font-weight:600;">Metodo de Pago</td>
                        <td style="font-size:13px; color:#2C2A25; text-align:right;">${data.metodoPagoDisplay}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size:13px; color:#8A835A; font-weight:600;">Cod. Autorizacion</td>
                        <td style="font-size:13px; color:#2C2A25; text-align:right;">${data.codigoAutorizacion}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Total -->
          <tr>
            <td style="padding:0 40px 25px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #8A835A 0%, #6B6550 100%); border-radius:8px; padding:18px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size:14px; color:#D8C9A0;">Total Pagado:</td>
                        <td style="font-size:22px; color:#FFFFFF; font-weight:700; text-align:right;">${data.montoFormateado}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 30px; text-align:center;">
              <a href="https://kikibrows.cl/cursosAlumn.html"
                 style="display:inline-block; background-color:#8A835A; color:#FFFFFF; text-decoration:none; padding:14px 40px; border-radius:8px; font-size:15px; font-weight:600; letter-spacing:0.5px;">
                Ir a Mis Cursos
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none; border-top:1px solid #E8E3D8; margin:0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:25px 40px 30px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#999; line-height:1.6;">
                Este correo es una confirmacion automatica de tu compra.<br>
                Para cualquier consulta, contactanos en
                <a href="mailto:soporte@kikibrows.com" style="color:#8A835A; text-decoration:none;">soporte@kikibrows.com</a>
              </p>
              <p style="margin:15px 0 0; font-size:11px; color:#BBB;">
                &copy; 2025 KIKIBROWS. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
