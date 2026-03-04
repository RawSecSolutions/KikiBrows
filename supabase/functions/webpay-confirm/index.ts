// Edge Function: webpay-confirm
// Confirma la transacción con Transbank, actualiza el estado en Supabase
// y crea la inscripción si el pago fue aprobado.
// También maneja el caso de abort (usuario cancela en Webpay → TBK_TOKEN).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TBK_COMMERCE_CODE = Deno.env.get('TBK_COMMERCE_CODE') ?? '597055555532'
const TBK_API_KEY = Deno.env.get('TBK_API_KEY') ?? '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C'
const TBK_URL = 'https://webpay3gstd.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const DIAS_ACCESO_DEFAULT = 180

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { token_ws, tbk_token } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── CASO: Usuario abortó el pago (Transbank devuelve TBK_TOKEN sin token_ws) ──
    if (tbk_token && !token_ws) {
      await supabase
        .from('transacciones')
        .update({ estado: 'ANULADO', updated_at: new Date().toISOString() })
        .eq('token_pasarela', tbk_token)

      console.log('[webpay-confirm] Pago abortado por el usuario')
      return new Response(
        JSON.stringify({ estado: 'ANULADO', aprobada: false }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    if (!token_ws) {
      return new Response(
        JSON.stringify({ error: 'token_ws requerido' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // ── CASO: Confirmar transacción con Transbank (PUT) ──
    const tbkRes = await fetch(`${TBK_URL}/${token_ws}`, {
      method: 'PUT',
      headers: {
        'Tbk-Api-Key-Id': TBK_COMMERCE_CODE,
        'Tbk-Api-Key-Secret': TBK_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!tbkRes.ok) {
      const errText = await tbkRes.text()
      console.error('[Transbank] Error confirmando:', errText)
      return new Response(
        JSON.stringify({ error: 'Error al confirmar con Transbank', detail: errText }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const tbkData = await tbkRes.json()
    console.log('[Transbank] Confirmación:', {
      buy_order: tbkData.buy_order,
      status: tbkData.status,
      response_code: tbkData.response_code,
    })

    // Transbank aprueba cuando status=AUTHORIZED y response_code=0
    const aprobada = tbkData.status === 'AUTHORIZED' && tbkData.response_code === 0
    const estado = aprobada ? 'PAGADO' : 'RECHAZADO'

    // Actualizar transacción en Supabase
    const { data: txn, error: updateError } = await supabase
      .from('transacciones')
      .update({
        estado,
        codigo_autorizacion: tbkData.authorization_code ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('token_pasarela', token_ws)
      .select('id, usuario_id, curso_id, curso_titulo_snapshot, monto')
      .single()

    if (updateError) {
      console.error('[Supabase] Error actualizando transacción:', updateError.message)
    }

    // Si fue aprobada, crear inscripción al curso
    if (aprobada && txn) {
      const fechaExp = new Date()
      fechaExp.setDate(fechaExp.getDate() + DIAS_ACCESO_DEFAULT)

      // Verificar que no exista ya una inscripción activa
      const { data: existente } = await supabase
        .from('inscripciones')
        .select('id')
        .eq('usuario_id', txn.usuario_id)
        .eq('curso_id', txn.curso_id)
        .maybeSingle()

      if (!existente) {
        const { error: inscError } = await supabase.from('inscripciones').insert([{
          usuario_id: txn.usuario_id,
          curso_id: txn.curso_id,
          origen_acceso: 'COMPRA',
          estado: 'ACTIVO',
          fecha_expiracion: fechaExp.toISOString(),
          transaccion_id: txn.id,
        }])

        if (inscError) {
          console.error('[Supabase] Error creando inscripción:', inscError.message)
        } else {
          console.log('[Supabase] Inscripción creada para usuario:', txn.usuario_id)
        }
      }
    }

    return new Response(
      JSON.stringify({
        estado,
        aprobada,
        cursoId: txn?.curso_id ?? null,
        cursoNombre: txn?.curso_titulo_snapshot ?? null,
        monto: txn?.monto ?? tbkData.amount,
        metodoPago: 'Webpay Plus',
        codigoAutorizacion: tbkData.authorization_code ?? null,
        transaccionId: `TXN-${tbkData.buy_order}`,
        fecha: tbkData.transaction_date ?? new Date().toISOString(),
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[webpay-confirm] Error:', err)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
