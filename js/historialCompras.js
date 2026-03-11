/**
 * js/historialCompras.js
 * Controlador de la página Historial de Compras.
 * Carga transacciones reales desde Supabase y genera boletas PDF.
 */

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CursosData } from './cursosData.js';
import { CursosService } from './cursosService.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", async () => {

    // --- 1. Inicialización de Componentes UI (Navbar, Sidebar, etc.) ---
    if (typeof UI !== 'undefined' && UI.initNavbar) {
        UI.initNavbar();
    } else {
        console.warn("UI no está definido o initNavbar no existe.");
    }

    // --- 2. Lógica de Historial de Compras ---
    const container = document.getElementById("purchases-list");
    const searchInput = document.getElementById('searchHistory');

    if (!container) return;

    // Mostrar estado de carga
    container.innerHTML = '<div class="text-center py-5 text-muted fw-bold">Cargando compras...</div>';

    // Obtener usuario autenticado y cargar transacciones
    let transactions = [];

    try {
        await CursosData.init();
        await CursosData.initStudent();

        const student = CursosData.getStudent();
        if (!student || !student.id) {
            container.innerHTML = '<div class="text-center py-5 text-muted fw-bold">Debes iniciar sesión para ver tus compras.</div>';
            return;
        }

        const result = await CursosService.getTransaccionesUsuario(student.id);

        if (!result.success || !result.data || result.data.length === 0) {
            container.innerHTML = '<div class="text-center py-5 text-muted fw-bold">No se encontraron compras.</div>';
            return;
        }

        // Filtrar solo las transacciones pagadas
        const comprasExitosas = result.data.filter(t => t.estado === 'PAGADO');

        if (comprasExitosas.length === 0) {
            container.innerHTML = '<div class="text-center py-5 text-muted fw-bold">No se encontraron compras.</div>';
            return;
        }

        // Mapear datos de la BD al formato que usa el render
        transactions = comprasExitosas.map(trx => {
            const fechaCompra = new Date(trx.fecha_compra);
            const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                           'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
            const dateLabel = `${fechaCompra.getDate()} DE ${meses[fechaCompra.getMonth()]}`;

            const nombreCurso = trx.cursos?.nombre || trx.curso_titulo_snapshot || 'Curso KikiBrows';
            const portada = trx.cursos?.portada_url || 'https://via.placeholder.com/150';
            const cursoId = trx.cursos?.id || trx.curso_id;

            return {
                id: trx.id,
                date: dateLabel,
                title: nombreCurso,
                author: "KikiBrows Academy",
                image: portada,
                url: cursoId ? `claseAlumn.html?id=${cursoId}` : 'cursosAlumn.html',
                // Datos para la boleta PDF
                transaccionId: trx.folio_visual ? `BOL-${trx.folio_visual}` : trx.id,
                cursoId: cursoId,
                cursoNombre: nombreCurso,
                monto: trx.monto,
                metodoPago: trx.metodo_pago,
                codigoAutorizacion: trx.codigo_autorizacion,
                fecha: fechaCompra
            };
        });

        renderHistory(transactions);

    } catch (error) {
        console.error("Error cargando historial de compras:", error);
        container.innerHTML = '<div class="text-center py-5 text-muted fw-bold">Error al cargar las compras. Intenta recargar la página.</div>';
        return;
    }

    function renderHistory(data) {
        container.innerHTML = "";

        if (data.length === 0) {
            container.innerHTML = '<div class="text-center py-5 text-muted fw-bold">No se encontraron compras.</div>';
            return;
        }

        data.forEach(item => {
            const html = `
                <div class="purchase-card-item p-4">
                    <div class="purchase-date">
                        ${item.date}
                    </div>

                    <div class="row align-items-center">
                        <div class="col-auto">
                            <img src="${item.image}" alt="${item.title}" class="purchase-thumb">
                        </div>

                        <div class="col">
                            <div class="status-text">Compra exitosa</div>
                            <h3 class="course-title-history">${item.title}</h3>
                            <p class="mb-0 small text-muted">Instructor: ${item.author}</p>
                        </div>

                        <div class="col-12 col-md-auto mt-3 mt-md-0 text-end">
                            <div class="d-flex flex-column gap-2">
                                <a href="${item.url}" class="btn-kiki-outline">Ir al curso</a>
                                <button class="btn-kiki-outline btn-descargar-boleta" data-transaction-id="${item.transaccionId}">
                                    <i class="fa-solid fa-download me-2"></i>Descargar Boleta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });

        // Agregar event listeners a los botones de descargar boleta
        attachDownloadListeners(data);
    }

    function attachDownloadListeners(data) {
        const btnsDescargar = document.querySelectorAll('.btn-descargar-boleta');
        btnsDescargar.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const transaccionId = btn.getAttribute('data-transaction-id');
                const transaccion = data.find(t => t.transaccionId === transaccionId);
                if (transaccion) {
                    generarBoleta(transaccion);
                }
            });
        });
    }

    // Funcionalidad Buscador
    if(searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = transactions.filter(t =>
                t.title.toLowerCase().includes(term) ||
                t.author.toLowerCase().includes(term)
            );
            renderHistory(filtered);
        });
    }

    // ==================== FUNCIONES PARA GENERAR BOLETA ====================

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
        let cursoNombre = transaccion.cursoNombre || transaccion.title || 'Nombre del Curso';

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
        const nombres = { 'TRANSBANK': 'Webpay Plus', 'MERCADOPAGO': 'Mercado Pago' };
        doc.text(nombres[transaccion.metodoPago] || transaccion.metodoPago || 'Webpay Plus', 60, y);

        y += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Código de Autorización:', 20, y);
        doc.setFont('helvetica', 'normal');
        doc.text(transaccion.codigoAutorizacion || transaccion.transaccionId || 'N/A', 80, y);

        y += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('ID de Transacción:', 20, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(transaccion.transaccionId || 'N/A'), 60, y);

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
});