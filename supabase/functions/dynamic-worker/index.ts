// Edge Function: webpay-create
// Crea una transacción en Transbank Webpay Plus y guarda el registro PENDIENTE en Supabase.
// Secrets requeridos en Supabase dashboard:
//   TBK_COMMERCE_CODE  → 597055555532 (integración)
//   TBK_API_KEY        → 579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C (integración)
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son inyectados automáticamente por Supabase.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Credenciales Transbank (se leen de Secrets; fallback = integración/test)
const TBK_COMMERCE_CODE = Deno.env.get('TBK_COMMERCE_CODE') ?? '597055555532'
const TBK_API_KEY = Deno.env.get('TBK_API_KEY') ?? '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C'

// URL de integración (test). Para producción: webpay3g.transbank.cl
// integración: webpay3gint | producción: webpay3g
const TBK_URL = 'https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { cursoId, cursoNombre, monto, usuarioId, returnUrl } = await req.json()

    if (!cursoId || !monto || !usuarioId || !returnUrl) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros: cursoId, monto, usuarioId, returnUrl' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // buy_order: máx 26 chars alfanumérico
    const buyOrder = 'KKB' + Date.now().toString().slice(-10)
    // session_id: máx 61 chars
    const sessionId = 'U' + usuarioId.replace(/-/g, '').slice(0, 12) + Date.now().toString().slice(-8)

    // 1. Crear transacción en Transbank
    const tbkRes = await fetch(TBK_URL, {
      method: 'POST',
      headers: {
        'Tbk-Api-Key-Id': TBK_COMMERCE_CODE,
        'Tbk-Api-Key-Secret': TBK_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buy_order: buyOrder,
        session_id: sessionId,
        amount: parseInt(monto),
        return_url: returnUrl,
      }),
    })

    if (!tbkRes.ok) {
      const errText = await tbkRes.text()
      console.error('[Transbank] Error creando transacción:', errText)
      return new Response(
        JSON.stringify({ error: 'Transbank rechazó la solicitud', detail: errText }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const tbkData = await tbkRes.json()
    console.log('[Transbank] Transacción creada:', buyOrder)

    // 2. Insertar registro PENDIENTE en Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: dbError } = await supabase.from('transacciones').insert([{
      usuario_id: usuarioId,
      curso_id: cursoId,
      curso_titulo_snapshot: cursoNombre,
      monto: parseInt(monto),
      metodo_pago: 'Webpay Plus',
      estado: 'PENDIENTE',
      token_pasarela: tbkData.token,
    }])

    if (dbError) {
      console.error('[Supabase] Error insertando transacción:', dbError.message)
      // No bloqueamos el flujo; el usuario igual puede pagar
    }

    return new Response(
      JSON.stringify({ token: tbkData.token, url: tbkData.url }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[webpay-create] Excepción:', msg)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor', detail: msg }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
