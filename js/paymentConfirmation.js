// js/paymentConfirmation.js - Lógica para la página de confirmación de pago
// Maneja los diferentes estados de transacción y genera boletas

// ==================== MAPEO DE MÉTODO DE PAGO (DB → Display) ====================

function formatearMetodoPago(metodo) {
    const nombres = { 'GETNET': 'Getnet Web Checkout', 'TRANSBANK': 'Webpay Plus', 'MERCADOPAGO': 'Mercado Pago' };
    return nombres[metodo] || metodo || 'Getnet';
}

// ==================== OBTENER PARÁMETROS DE URL ====================

function obtenerParametrosUrl() {
    const urlParams = new URLSearchParams(window.location.search);

    return {
        estado: urlParams.get('status') || urlParams.get('estado'),
        transaccionId: urlParams.get('transactionId') || urlParams.get('transaccionId'),
        cursoId: urlParams.get('courseId') || urlParams.get('cursoId'),
        token: urlParams.get('token'),
        ordenCompra: urlParams.get('ordenCompra') || urlParams.get('reference')
    };
}

// ==================== CARGAR INFORMACIÓN DE TRANSACCIÓN ====================

function cargarTransaccion() {
    const params = obtenerParametrosUrl();

    // Si viene de una pasarela con token, procesar respuesta
    if (params.token) {
        return procesarRespuestaPasarela(params);
    }

    // Si no, buscar en localStorage
    const transaccionData = JSON.parse(localStorage.getItem('ultimaTransaccion'));

    if (!transaccionData) {
        mostrarEstadoError();
        return null;
    }

    return transaccionData;
}

// ==================== PROCESAR RESPUESTA DE PASARELA ====================

function procesarRespuestaPasarela(params) {
    // La verificación con Getnet se hace en procesarGetnetReturn()
    // Este método queda como fallback para flujos legacy
    return JSON.parse(localStorage.getItem('ultimaTransaccion'));
}

// ==================== MOSTRAR ESTADOS ====================

function mostrarEstadoExitoso(transaccion) {
    const estadoDiv = document.getElementById('estadoExitoso');
    estadoDiv.style.display = 'block';

    // Cargar información del curso
    if (typeof CursosData !== 'undefined' && CursosData.init) {
        CursosData.init();
        const curso = CursosData.getCurso(transaccion.cursoId);

        if (curso) {
            document.getElementById('cursoNombre').textContent = curso.nombre;
        }
    } else {
        document.getElementById('cursoNombre').textContent = transaccion.cursoNombre || 'Nombre del Curso';
    }

    // Cargar detalles de la transacción
    document.getElementById('fechaCompra').textContent = formatearFecha(transaccion.fecha);
    document.getElementById('metodoPago').textContent = formatearMetodoPago(transaccion.metodoPago);
    document.getElementById('codigoTransaccion').textContent = transaccion.codigoAutorizacion || transaccion.transaccionId || 'N/A';
    document.getElementById('montoPagado').textContent = formatearPrecio(transaccion.monto);

    // Configurar botones
    configurarBotonesExitoso(transaccion);
}

function mostrarEstadoPendiente(transaccion) {
    const estadoDiv = document.getElementById('estadoPendiente');
    estadoDiv.style.display = 'block';

    // Cargar información del curso
    if (typeof CursosData !== 'undefined' && CursosData.init) {
        CursosData.init();
        const curso = CursosData.getCurso(transaccion.cursoId);

        if (curso) {
            document.getElementById('cursoNombrePendiente').textContent = curso.nombre;
        }
    } else {
        document.getElementById('cursoNombrePendiente').textContent = transaccion.cursoNombre || 'Nombre del Curso';
    }

    // Cargar detalles
    document.getElementById('fechaCompraPendiente').textContent = formatearFecha(transaccion.fecha);
    document.getElementById('metodoPagoPendiente').textContent = formatearMetodoPago(transaccion.metodoPago);

    // Configurar botones
    configurarBotonesPendiente();
}

function mostrarEstadoRechazado(transaccion) {
    const estadoDiv = document.getElementById('estadoRechazado');
    estadoDiv.style.display = 'block';

    // Configurar botones
    configurarBotonesRechazado(transaccion);
}

function mostrarEstadoError() {
    const estadoDiv = document.getElementById('estadoError');
    estadoDiv.style.display = 'block';

    // Configurar botones
    configurarBotonesError();
}

// ==================== CONFIGURAR BOTONES ====================

function configurarBotonesExitoso(transaccion) {
    // Botón descargar boleta
    const btnDescargarBoleta = document.getElementById('btnDescargarBoleta');
    btnDescargarBoleta.addEventListener('click', () => {
        generarBoleta(transaccion);
    });

    // Botón volver a mis cursos
    const btnVolverCursos = document.getElementById('btnVolverCursos');
    btnVolverCursos.addEventListener('click', () => {
        window.location.href = 'cursosAlumn.html';
    });
}

function configurarBotonesPendiente() {
    // Botón volver al sitio
    const btnVolverSitio = document.getElementById('btnVolverSitioPendiente');
    btnVolverSitio.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // Botón ver historial
    const btnVerHistorial = document.getElementById('btnVerHistorial');
    btnVerHistorial.addEventListener('click', () => {
        window.location.href = 'historialCompras.html';
    });
}

function configurarBotonesRechazado(transaccion) {
    // Botón intentar nuevamente
    const btnIntentarNuevamente = document.getElementById('btnIntentarNuevamente');
    btnIntentarNuevamente.addEventListener('click', () => {
        if (transaccion && transaccion.cursoId) {
            window.location.href = `course-preview.html?id=${transaccion.cursoId}`;
        } else {
            window.location.href = 'index.html#cursos';
        }
    });

    // Botón volver al catálogo
    const btnVolverCatalogo = document.getElementById('btnVolverCatalogo');
    btnVolverCatalogo.addEventListener('click', () => {
        window.location.href = 'index.html#cursos';
    });
}

function configurarBotonesError() {
    // Botón volver al inicio
    const btnVolverInicio = document.getElementById('btnVolverInicio');
    btnVolverInicio.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // Botón contactar soporte
    const btnContactarSoporte = document.getElementById('btnContactarSoporte');
    btnContactarSoporte.addEventListener('click', () => {
        window.location.href = 'mailto:soporte@kikibrows.com';
    });
}

// ==================== GENERAR BOLETA PDF ====================

function generarBoleta(transaccion) {
    // Verificar que jsPDF esté disponible
    if (typeof window.jspdf === 'undefined') {
        console.error('jsPDF no está cargado');
        alert('Error al generar la boleta. Por favor, intenta nuevamente.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Obtener información del curso
    let cursoNombre = transaccion.cursoNombre || 'Nombre del Curso';

    if (typeof CursosData !== 'undefined' && CursosData.init) {
        CursosData.init();
        const curso = CursosData.getCurso(transaccion.cursoId);
        if (curso) {
            cursoNombre = curso.nombre;
        }
    }

    // Configuración de colores (usando la paleta KIKIBROWS)
    const primaryColor = [138, 131, 90];      // #8A835A
    const secondaryColor = [216, 182, 177];   // #D8B6B1
    const textDark = [44, 42, 37];            // #2C2A25
    const lightBg = [240, 234, 224];          // #F0EAE0

    // Encabezado
    doc.setFillColor(...lightBg);
    doc.rect(0, 0, 210, 50, 'F');

    doc.setFontSize(24);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('KIKIBROWS', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'normal');
    doc.text('Boleta de Compra', 105, 30, { align: 'center' });

    // Línea separadora
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);

    // Información de la transacción
    let y = 60;

    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalles de la Compra', 20, y);

    y += 15;
    doc.setFontSize(11);
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'normal');

    // Información del curso
    doc.setFont('helvetica', 'bold');
    doc.text('Curso:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(cursoNombre, 60, y);

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de Compra:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatearFecha(transaccion.fecha), 60, y);

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Método de Pago:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatearMetodoPago(transaccion.metodoPago), 60, y);

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Código de Autorización:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(transaccion.codigoAutorizacion || transaccion.transaccionId || 'N/A', 80, y);

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('ID de Transacción:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(transaccion.transaccionId || 'N/A', 60, y);

    // Línea separadora
    y += 15;
    doc.setDrawColor(...secondaryColor);
    doc.line(20, y, 190, y);

    // Total
    y += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Total Pagado:', 20, y);
    doc.text(formatearPrecio(transaccion.monto), 190, y, { align: 'right' });

    // Información del usuario
    y += 20;
    doc.setFontSize(11);
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'normal');

    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'));
    if (usuarioActual) {
        doc.text('Cliente:', 20, y);
        y += 7;
        doc.text(`${usuarioActual.nombre || 'Usuario'} - ${usuarioActual.email}`, 20, y);
    }

    // Pie de página
    y = 270;
    doc.setFillColor(...lightBg);
    doc.rect(0, y, 210, 27, 'F');

    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.text('Este documento es una boleta de compra válida.', 105, y, { align: 'center' });

    y += 7;
    doc.text('Para cualquier consulta, contacta a soporte@kikibrows.com', 105, y, { align: 'center' });

    y += 7;
    doc.setTextColor(...primaryColor);
    doc.text('© 2025 KIKIBROWS - Todos los derechos reservados', 105, y, { align: 'center' });

    // Guardar el PDF
    const nombreArchivo = `Boleta_KIKIBROWS_${transaccion.transaccionId || Date.now()}.pdf`;
    doc.save(nombreArchivo);

    console.log('Boleta generada:', nombreArchivo);
}

// ==================== FUNCIONES AUXILIARES ====================

function formatearPrecio(precio) {
    if (!precio) return '$0 CLP';
    return `$${parseInt(precio).toLocaleString('es-CL')} CLP`;
}

function formatearFecha(fecha) {
    if (!fecha) {
        fecha = new Date();
    } else if (typeof fecha === 'string') {
        fecha = new Date(fecha);
    }

    const opciones = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    return fecha.toLocaleDateString('es-CL', opciones);
}

// ==================== GETNET: CONFIRMAR ESTADO DE SESIÓN ====================

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { supabase as supabaseConfirm, initAuthListener } from './sessionManager.js';

// Reutilizar la sesión existente (no crear nuevo GoTrueClient)
initAuthListener();

// Esperar a que la sesión esté lista (máx 5 segundos)
async function waitForSession() {
    const { data: { session } } = await supabaseConfirm.auth.getSession();
    if (session) return session;

    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 5000);
        supabaseConfirm.auth.onAuthStateChange((event, session) => {
            if (session) {
                clearTimeout(timeout);
                resolve(session);
            }
        });
    });
}

function mostrarCargandoConfirmacion() {
    ['estadoExitoso', 'estadoPendiente', 'estadoRechazado', 'estadoError'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const container = document.querySelector('.confirmation-container');
    if (container && !document.getElementById('estadoCargando')) {
        const div = document.createElement('div');
        div.id = 'estadoCargando';
        div.className = 'confirmation-content text-center';
        div.style.display = 'block';
        div.innerHTML = `
            <div class="spinner-border mb-4" role="status" style="width:3rem;height:3rem;color:#8A835A;">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <h1 class="confirmation-title">Verificando tu pago...</h1>
            <p class="confirmation-message">Estamos confirmando tu transacción con Getnet. Un momento por favor.</p>
        `;
        container.appendChild(div);
    }
}

async function procesarGetnetReturn(sessionData) {
    mostrarCargandoConfirmacion();

    try {
        // Esperar a que la sesión de auth esté lista antes de operar con DB
        const authSession = await waitForSession();
        if (!authSession) {
            console.error('[paymentConfirmation] No se pudo obtener sesión de usuario');
        }

        // Consultar el estado de la sesión en Getnet (via Edge Function segura)
        const edgeResponse = await fetch(`${SUPABASE_URL}/functions/v1/getnet-check-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({ requestId: sessionData.requestId })
        });

        const result = await edgeResponse.json();

        // Ocultar spinner
        const spinner = document.getElementById('estadoCargando');
        if (spinner) spinner.style.display = 'none';

        if (!result.success) {
            mostrarEstadoError();
            return;
        }

        const getnetData = result.data;
        const sessionStatus = getnetData.status?.status;
        // Mapear estado Getnet a estado interno
        const statusMap = { 'APPROVED': 'PAGADO', 'REJECTED': 'RECHAZADO', 'PENDING': 'PENDIENTE', 'FAILED': 'RECHAZADO', 'REFUNDED': 'REEMBOLSADO' };
        const internalStatus = statusMap[sessionStatus] || 'PENDIENTE';

        // Extraer datos del pago si existe
        const payment = getnetData.payment?.[0];
        const authorization = payment?.authorization || '';
        const paymentMethodName = payment?.paymentMethodName || 'Getnet';

        if (internalStatus === 'PAGADO') {
            // Actualizar transacción en Supabase
            if (sessionData.transaccionId) {
                const { error: updateError } = await supabaseConfirm
                    .from('transacciones')
                    .update({
                        estado: 'PAGADO',
                        codigo_autorizacion: authorization,
                        token_pasarela: sessionData.requestId,
                        metodo_pago: 'GETNET'
                    })
                    .eq('id', sessionData.transaccionId);

                if (updateError) {
                    console.error('[paymentConfirmation] Error actualizando transacción:', updateError);
                }

                // Crear inscripción
                const { data: cursoData } = await supabaseConfirm
                    .from('cursos')
                    .select('dias_duracion_acceso')
                    .eq('id', sessionData.cursoId)
                    .single();

                const diasAcceso = cursoData?.dias_duracion_acceso || 180;
                const fechaExp = new Date();
                fechaExp.setDate(fechaExp.getDate() + diasAcceso);

                if (authSession?.user) {
                    const { error: inscError } = await supabaseConfirm
                        .from('inscripciones')
                        .insert([{
                            usuario_id: authSession.user.id,
                            curso_id: sessionData.cursoId,
                            origen_acceso: 'COMPRA',
                            estado: 'ACTIVO',
                            fecha_expiracion: fechaExp.toISOString(),
                            transaccion_id: sessionData.transaccionId
                        }]);

                    if (inscError) {
                        console.error('[paymentConfirmation] Error creando inscripción:', inscError);
                    }
                } else {
                    console.error('[paymentConfirmation] No hay sesión de usuario activa para crear inscripción');
                }
            }

            mostrarEstadoExitoso({
                estado: 'PAGADO',
                cursoNombre: sessionData.cursoNombre,
                monto: sessionData.monto,
                metodoPago: 'GETNET',
                fecha: new Date().toISOString(),
                codigoAutorizacion: authorization,
                transaccionId: sessionData.transaccionId || `GETNET-${sessionData.requestId}`
            });

        } else if (internalStatus === 'PENDIENTE') {
            mostrarEstadoPendiente({
                cursoNombre: sessionData.cursoNombre,
                monto: sessionData.monto,
                metodoPago: 'GETNET',
                fecha: new Date().toISOString()
            });

        } else {
            // RECHAZADO
            if (sessionData.transaccionId) {
                const { error: rejError } = await supabaseConfirm
                    .from('transacciones')
                    .update({
                        estado: 'RECHAZADO',
                        token_pasarela: sessionData.requestId
                    })
                    .eq('id', sessionData.transaccionId);

                if (rejError) {
                    console.error('[paymentConfirmation] Error actualizando transacción rechazada:', rejError);
                }
            }
            mostrarEstadoRechazado({ cursoId: sessionData.cursoId });
        }

        // Limpiar sesión guardada
        localStorage.removeItem('getnetSession');

    } catch (err) {
        console.error('[paymentConfirmation] Error confirmando con Getnet:', err);
        const spinner = document.getElementById('estadoCargando');
        if (spinner) spinner.style.display = 'none';
        mostrarEstadoError();
    }
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando paymentConfirmation.js');

    // ── Detectar retorno de Getnet (verificar si hay sesión guardada) ──
    const getnetSession = localStorage.getItem('getnetSession');

    if (getnetSession) {
        try {
            const sessionData = JSON.parse(getnetSession);
            // Viene de Getnet: consultar estado de la sesión
            procesarGetnetReturn(sessionData);
            return;
        } catch (e) {
            console.error('Error parseando sesión Getnet:', e);
            localStorage.removeItem('getnetSession');
        }
    }

    // ── Flujo legacy: localStorage (simulador / Mercado Pago) ──
    const transaccion = cargarTransaccion();

    if (!transaccion) {
        mostrarEstadoError();
        return;
    }

    // Normalizar el estado
    let estado = (transaccion.estado || '').toUpperCase();

    if (estado === 'APPROVED' || estado === 'PAGADO' || estado === 'SUCCESS') {
        estado = 'PAGADO';
    } else if (estado === 'PENDING' || estado === 'PENDIENTE' || estado === 'IN_PROCESS') {
        estado = 'PENDIENTE';
    } else if (estado === 'REJECTED' || estado === 'RECHAZADO' || estado === 'ANULADO' || estado === 'CANCELLED' || estado === 'FAILED') {
        estado = 'RECHAZADO';
    }

    switch (estado) {
        case 'PAGADO':
            mostrarEstadoExitoso(transaccion);
            break;
        case 'PENDIENTE':
            mostrarEstadoPendiente(transaccion);
            break;
        case 'RECHAZADO':
            mostrarEstadoRechazado(transaccion);
            break;
        default:
            console.error('Estado de transacción desconocido:', estado);
            mostrarEstadoError();
    }
});
