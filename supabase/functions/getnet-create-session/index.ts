// supabase/functions/getnet-create-session/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GETNET_CONFIG = {
  // PRUEBAS (cambiar a producción cuando tenga credenciales productivas)
  endpoint: "https://checkout.test.getnet.cl",
  login: "7ffbb7bf1f7361b1200b2e8d74e1d76f",
  secretKey: "SnZP3D63n3I9dH9O",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function generarAuth() {
  const seed = new Date().toISOString();
  const nonceRaw = crypto.getRandomValues(new Uint8Array(16));
  const nonceStr = Array.from(nonceRaw)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const nonceBase64 = btoa(nonceStr);

  const encoder = new TextEncoder();
  const data = encoder.encode(nonceStr + seed + GETNET_CONFIG.secretKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  let binary = "";
  hashArray.forEach((byte) => (binary += String.fromCharCode(byte)));
  const tranKey = btoa(binary);

  return {
    login: GETNET_CONFIG.login,
    tranKey,
    nonce: nonceBase64,
    seed,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { reference, description, amount, returnUrl, buyer, userAgent, clientIp } =
      await req.json();

    if (!reference || !amount || !returnUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Faltan campos obligatorios: reference, amount, returnUrl",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const auth = await generarAuth();

    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 15);

    // Prioridad IP: clientIp del body > x-forwarded-for header > fallback
    const ipAddress =
      clientIp ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    const requestBody = {
      auth,
      locale: "es_CL",
      buyer: {
        name: buyer?.name || "Cliente",
        surname: buyer?.surname || "",
        email: buyer?.email || "",
        document: buyer?.document || "",
        documentType: buyer?.documentType || "CLRUT",
        mobile: buyer?.mobile || "",
      },
      payment: {
        reference,
        description: description || "Pago KIKIBROWS",
        amount: {
          currency: "CLP",
          total: amount,
        },
      },
      expiration: expiration.toISOString(),
      returnUrl,
      ipAddress,
      userAgent: userAgent || "Mozilla/5.0",
      skipResult: false,
    };

    const response = await fetch(`${GETNET_CONFIG.endpoint}/api/session/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (data.status && data.status.status === "OK") {
      return new Response(
        JSON.stringify({
          success: true,
          requestId: data.requestId,
          processUrl: data.processUrl,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.status?.message || "Error al crear sesión de pago",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error en getnet-create-session:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
