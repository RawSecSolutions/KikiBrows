// js/paymentSimulator.js - Simulador de diferentes estados de pago
// Este archivo es solo para propósitos de desarrollo y pruebas

// ==================== FUNCIONES DE SIMULACIÓN ====================

/**
 * Simula una compra exitosa
 * @param {Object} curso - Objeto del curso
 * @param {Object} usuario - Objeto del usuario
 * @param {string} metodoPago - Método de pago usado
 */
function simularPagoExitoso(cursoId, metodoPago = 'Webpay Plus') {
    // Inicializar CursosData
    if (typeof CursosData !== 'undefined' && CursosData.init) {
        CursosData.init();
    }

    const curso = CursosData.getCurso(cursoId);
    const usuario = JSON.parse(localStorage.getItem('usuarioActual'));

    if (!curso || !usuario) {
        console.error('Curso o usuario no encontrado');
        return;
    }

    const transaccionId = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    const codigoAutorizacion = Math.floor(100000 + Math.random() * 900000).toString();
    const fechaCompra = new Date();

    const transaccion = {
        estado: 'PAGADO',
        cursoId: curso.id,
        cursoNombre: curso.nombre,
        monto: curso.precio,
        metodoPago: metodoPago,
        fecha: fechaCompra.toISOString(),
        codigoAutorizacion: codigoAutorizacion,
        transaccionId: transaccionId,
        usuarioEmail: usuario.email,
        usuarioNombre: usuario.nombre
    };

    localStorage.setItem('ultimaTransaccion', JSON.stringify(transaccion));
    window.location.href = 'payment-confirmation.html';
}

/**
 * Simula una compra pendiente
 * @param {number} cursoId - ID del curso
 * @param {string} metodoPago - Método de pago usado
 */
function simularPagoPendiente(cursoId, metodoPago = 'Mercado Pago') {
    if (typeof CursosData !== 'undefined' && CursosData.init) {
        CursosData.init();
    }

    const curso = CursosData.getCurso(cursoId);
    const usuario = JSON.parse(localStorage.getItem('usuarioActual'));

    if (!curso || !usuario) {
        console.error('Curso o usuario no encontrado');
        return;
    }

    const transaccionId = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    const fechaCompra = new Date();

    const transaccion = {
        estado: 'PENDIENTE',
        cursoId: curso.id,
        cursoNombre: curso.nombre,
        monto: curso.precio,
        metodoPago: metodoPago,
        fecha: fechaCompra.toISOString(),
        transaccionId: transaccionId,
        usuarioEmail: usuario.email,
        usuarioNombre: usuario.nombre
    };

    localStorage.setItem('ultimaTransaccion', JSON.stringify(transaccion));
    window.location.href = 'payment-confirmation.html';
}

/**
 * Simula una compra rechazada
 * @param {number} cursoId - ID del curso
 * @param {string} metodoPago - Método de pago usado
 */
function simularPagoRechazado(cursoId, metodoPago = 'Webpay Plus') {
    if (typeof CursosData !== 'undefined' && CursosData.init) {
        CursosData.init();
    }

    const curso = CursosData.getCurso(cursoId);
    const usuario = JSON.parse(localStorage.getItem('usuarioActual'));

    if (!curso || !usuario) {
        console.error('Curso o usuario no encontrado');
        return;
    }

    const transaccionId = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    const fechaCompra = new Date();

    const transaccion = {
        estado: 'RECHAZADO',
        cursoId: curso.id,
        cursoNombre: curso.nombre,
        monto: curso.precio,
        metodoPago: metodoPago,
        fecha: fechaCompra.toISOString(),
        transaccionId: transaccionId,
        usuarioEmail: usuario.email,
        usuarioNombre: usuario.nombre
    };

    localStorage.setItem('ultimaTransaccion', JSON.stringify(transaccion));
    window.location.href = 'payment-confirmation.html';
}

// ==================== CONSOLA DE PRUEBAS ====================

console.log('%c🧪 Simulador de Pagos KIKIBROWS', 'background: #8A835A; color: white; font-size: 16px; padding: 10px; border-radius: 5px;');
console.log('%cFunciones disponibles:', 'font-weight: bold; font-size: 14px; color: #8A835A;');
console.log('%c- simularPagoExitoso(cursoId, metodoPago)', 'color: #6B8F71;');
console.log('%c- simularPagoPendiente(cursoId, metodoPago)', 'color: #B89968;');
console.log('%c- simularPagoRechazado(cursoId, metodoPago)', 'color: #B67676;');
console.log('%c\nEjemplo de uso:', 'font-weight: bold; font-size: 12px; margin-top: 10px;');
console.log('%csimularPagoExitoso(1, "Webpay Plus")', 'font-style: italic; color: #666;');
console.log('%csimularPagoPendiente(1, "Mercado Pago")', 'font-style: italic; color: #666;');
console.log('%csimularPagoRechazado(1, "Webpay Plus")', 'font-style: italic; color: #666;');
