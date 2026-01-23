// js/paymentConfirmation.js - Lógica para la página de confirmación de pago
// Maneja los diferentes estados de transacción y genera boletas

// ==================== OBTENER PARÁMETROS DE URL ====================

function obtenerParametrosUrl() {
    const urlParams = new URLSearchParams(window.location.search);

    return {
        estado: urlParams.get('status') || urlParams.get('estado'),
        transaccionId: urlParams.get('transactionId') || urlParams.get('transaccionId'),
        cursoId: urlParams.get('courseId') || urlParams.get('cursoId'),
        token: urlParams.get('token') || urlParams.get('TBK_TOKEN'),
        ordenCompra: urlParams.get('ordenCompra') || urlParams.get('buy_order')
    };
}

// ==================== CARGAR INFORMACIÓN DE TRANSACCIÓN ====================

function cargarTransaccion() {
    const params = obtenerParametrosUrl();

    // Si viene de Transbank o Mercado Pago, procesar respuesta
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
    // AQUÍ SE IMPLEMENTARÍA LA VERIFICACIÓN CON EL BACKEND
    // Ejemplo de flujo:
    // 1. Enviar token al backend
    // 2. Backend confirma con Transbank/Mercado Pago
    // 3. Backend devuelve el estado real de la transacción

    /*
    // Ejemplo de integración (descomentar cuando se configure el backend):
    fetch('/api/transaccion/confirmar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token: params.token,
            ordenCompra: params.ordenCompra
        })
    })
    .then(response => response.json())
    .then(data => {
        return {
            estado: data.status, // 'PAGADO', 'PENDIENTE', 'RECHAZADO'
            cursoId: data.cursoId,
            curso: data.curso,
            monto: data.monto,
            metodoPago: data.metodoPago,
            fecha: data.fecha,
            codigoAutorizacion: data.authCode,
            transaccionId: data.transactionId
        };
    })
    .catch(error => {
        console.error('Error al verificar transacción:', error);
        return null;
    });
    */

    // SIMULACIÓN TEMPORAL (reemplazar con la lógica real)
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
    document.getElementById('metodoPago').textContent = transaccion.metodoPago || 'Webpay Plus';
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
    document.getElementById('metodoPagoPendiente').textContent = transaccion.metodoPago || 'Método de Pago';

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
    doc.text(transaccion.metodoPago || 'Webpay Plus', 60, y);

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

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando paymentConfirmation.js');

    // Cargar información de la transacción
    const transaccion = cargarTransaccion();

    if (!transaccion) {
        mostrarEstadoError();
        return;
    }

    // Normalizar el estado (puede venir como 'PAGADO', 'pagado', 'approved', etc.)
    let estado = (transaccion.estado || '').toUpperCase();

    // Mapear estados de Mercado Pago a estados internos
    if (estado === 'APPROVED' || estado === 'PAGADO' || estado === 'SUCCESS') {
        estado = 'PAGADO';
    } else if (estado === 'PENDING' || estado === 'PENDIENTE' || estado === 'IN_PROCESS') {
        estado = 'PENDIENTE';
    } else if (estado === 'REJECTED' || estado === 'RECHAZADO' || estado === 'ANULADO' || estado === 'CANCELLED' || estado === 'FAILED') {
        estado = 'RECHAZADO';
    }

    // Mostrar el estado correspondiente
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

    // Limpiar la transacción del localStorage después de cargarla
    // (opcional, dependiendo de si quieres mantener el historial)
    // localStorage.removeItem('ultimaTransaccion');
});
