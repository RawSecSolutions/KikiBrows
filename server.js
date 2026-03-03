// server.js - Backend para integración Webpay Plus (Transbank)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors({
    origin: [
        'https://kikibrows.cl',
        'http://kikibrows.cl',
        'http://localhost',
        'http://127.0.0.1'
    ]
}));

// ==================== CONFIGURACIÓN TRANSBANK ====================

// Credenciales de INTEGRACIÓN (test). Cambiar a producción cuando corresponda.
const TBK_COMMERCE_CODE = process.env.TBK_COMMERCE_CODE || '597055555532';
const TBK_API_KEY = process.env.TBK_API_KEY || '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';

// URL integración: webpay3gstd | producción: webpay3g
const TBK_BASE_URL = process.env.TBK_ENV === 'production'
    ? 'https://webpay3g.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions'
    : 'https://webpay3gstd.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions';

const TBK_HEADERS = {
    'Tbk-Api-Key-Id': TBK_COMMERCE_CODE,
    'Tbk-Api-Key-Secret': TBK_API_KEY,
    'Content-Type': 'application/json'
};

// ==================== CONFIGURACIÓN SUPABASE (SERVICE ROLE) ====================

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://wrmelwftwumsfwzjjoxa.supabase.co',
    process.env.SUPABASE_SERVICE_KEY  // ← OBLIGATORIO: service_role key (no anon)
);

// ==================== ENDPOINT: CREAR TRANSACCIÓN ====================
// POST /api/webpay/create
// Body: { cursoId, cursoNombre, monto, usuarioId, returnUrl }
// Returns: { token, url }

app.post('/api/webpay/create', async (req, res) => {
    const { cursoId, cursoNombre, monto, usuarioId, returnUrl } = req.body;

    if (!cursoId || !monto || !usuarioId || !returnUrl) {
        return res.status(400).json({ error: 'Faltan parámetros: cursoId, monto, usuarioId, returnUrl' });
    }

    // buy_order: máx 26 chars, solo alfanumérico
    const buyOrder = 'KKB' + Date.now().toString().slice(-10);
    // session_id: máx 61 chars
    const sessionId = 'U' + usuarioId.replace(/-/g, '').slice(0, 12) + Date.now().toString().slice(-8);

    try {
        // 1. Crear transacción en Transbank
        const tbkRes = await fetch(TBK_BASE_URL, {
            method: 'POST',
            headers: TBK_HEADERS,
            body: JSON.stringify({
                buy_order: buyOrder,
                session_id: sessionId,
                amount: parseInt(monto),
                return_url: returnUrl
            })
        });

        if (!tbkRes.ok) {
            const errText = await tbkRes.text();
            console.error('[Transbank] Error creando transacción:', errText);
            return res.status(502).json({ error: 'Transbank rechazó la solicitud', detail: errText });
        }

        const tbkData = await tbkRes.json();
        console.log('[Transbank] Transacción creada:', buyOrder, '→ token:', tbkData.token?.slice(0, 10) + '...');

        // 2. Guardar transacción PENDIENTE en Supabase
        const { data: txn, error: dbError } = await supabase
            .from('transacciones')
            .insert([{
                usuario_id: usuarioId,
                curso_id: cursoId,
                curso_titulo_snapshot: cursoNombre,
                monto: parseInt(monto),
                metodo_pago: 'Webpay Plus',
                estado: 'PENDIENTE',
                token_pasarela: tbkData.token
            }])
            .select('id')
            .single();

        if (dbError) {
            // No bloqueamos el flujo, pero lo registramos
            console.error('[Supabase] Error insertando transacción PENDIENTE:', dbError.message);
        }

        return res.json({
            token: tbkData.token,
            url: tbkData.url,
            transaccionId: txn?.id || null
        });

    } catch (err) {
        console.error('[webpay/create] Error:', err.message);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==================== ENDPOINT: CONFIRMAR TRANSACCIÓN ====================
// POST /api/webpay/confirm
// Body: { token_ws }
// Returns: { estado, cursoId, cursoNombre, monto, metodoPago, codigoAutorizacion, transaccionId, fecha }

app.post('/api/webpay/confirm', async (req, res) => {
    const { token_ws } = req.body;

    if (!token_ws) {
        return res.status(400).json({ error: 'token_ws requerido' });
    }

    try {
        // 1. Confirmar con Transbank (PUT)
        const tbkRes = await fetch(`${TBK_BASE_URL}/${token_ws}`, {
            method: 'PUT',
            headers: TBK_HEADERS
        });

        if (!tbkRes.ok) {
            const errText = await tbkRes.text();
            console.error('[Transbank] Error confirmando transacción:', errText);
            return res.status(502).json({ error: 'Error al confirmar con Transbank', detail: errText });
        }

        const tbkData = await tbkRes.json();
        console.log('[Transbank] Confirmación recibida:', {
            buy_order: tbkData.buy_order,
            status: tbkData.status,
            response_code: tbkData.response_code
        });

        // Transbank aprueba cuando: status === 'AUTHORIZED' y response_code === 0
        const aprobada = tbkData.status === 'AUTHORIZED' && tbkData.response_code === 0;
        const estado = aprobada ? 'PAGADO' : 'RECHAZADO';

        // 2. Actualizar transacción en Supabase
        const { data: txn, error: updateError } = await supabase
            .from('transacciones')
            .update({
                estado: estado,
                codigo_autorizacion: tbkData.authorization_code || null,
                updated_at: new Date().toISOString()
            })
            .eq('token_pasarela', token_ws)
            .select('id, usuario_id, curso_id, curso_titulo_snapshot, monto')
            .single();

        if (updateError) {
            console.error('[Supabase] Error actualizando transacción:', updateError.message);
        }

        // 3. Si fue aprobada, crear inscripción
        if (aprobada && txn) {
            const diasAcceso = 180;
            const fechaExp = new Date();
            fechaExp.setDate(fechaExp.getDate() + diasAcceso);

            // Verificar que no exista inscripción previa activa
            const { data: existente } = await supabase
                .from('inscripciones')
                .select('id')
                .eq('usuario_id', txn.usuario_id)
                .eq('curso_id', txn.curso_id)
                .maybeSingle();

            if (!existente) {
                const { error: inscError } = await supabase
                    .from('inscripciones')
                    .insert([{
                        usuario_id: txn.usuario_id,
                        curso_id: txn.curso_id,
                        origen_acceso: 'COMPRA',
                        estado: 'ACTIVO',
                        fecha_expiracion: fechaExp.toISOString(),
                        transaccion_id: txn.id
                    }]);

                if (inscError) {
                    console.error('[Supabase] Error creando inscripción:', inscError.message);
                } else {
                    console.log('[Supabase] Inscripción creada para usuario:', txn.usuario_id);
                }
            }
        }

        return res.json({
            estado,
            aprobada,
            cursoId: txn?.curso_id || null,
            cursoNombre: txn?.curso_titulo_snapshot || null,
            monto: txn?.monto || tbkData.amount,
            metodoPago: 'Webpay Plus',
            codigoAutorizacion: tbkData.authorization_code || null,
            transaccionId: `TXN-${tbkData.buy_order}`,
            fecha: tbkData.transaction_date || new Date().toISOString()
        });

    } catch (err) {
        console.error('[webpay/confirm] Error:', err.message);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==================== ENDPOINT: ABORTAR TRANSACCIÓN ====================
// POST /api/webpay/abort
// Body: { tbk_token } (cuando el usuario cancela el pago en Webpay)

app.post('/api/webpay/abort', async (req, res) => {
    const { tbk_token } = req.body;

    if (tbk_token) {
        await supabase
            .from('transacciones')
            .update({ estado: 'ANULADO', updated_at: new Date().toISOString() })
            .eq('token_pasarela', tbk_token);

        console.log('[webpay/abort] Transacción anulada por usuario, token:', tbk_token?.slice(0, 10) + '...');
    }

    return res.json({ estado: 'ANULADO' });
});

// ==================== HEALTHCHECK ====================
app.get('/api/webpay/ping', (req, res) => {
    res.json({ ok: true, env: process.env.TBK_ENV || 'integration' });
});

// ==================== INICIO ====================
const PORT = process.env.PORT || 3001;
app.listen(PORT, '127.0.0.1', () => {
    const env = process.env.TBK_ENV || 'integration';
    console.log(`\n✅ Servidor Webpay corriendo en puerto ${PORT}`);
    console.log(`   Ambiente Transbank: ${env === 'production' ? '🔴 PRODUCCIÓN' : '🟡 INTEGRACIÓN (test)'}`);
    console.log(`   Commerce code: ${TBK_COMMERCE_CODE}\n`);
});
