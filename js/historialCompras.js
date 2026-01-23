document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. Inicialización de Componentes UI (Navbar, Sidebar, etc.) ---
    // Esto reemplaza al script que tenías en el HTML
    if (typeof UI !== 'undefined' && UI.initNavbar) {
        UI.initNavbar();
    } else {
        console.warn("UI no está definido o initNavbar no existe.");
    }

    // --- 2. Lógica de Historial de Compras ---
    
    // Simulación de datos
    const transactions = [
        {
            id: "#TRX-001",
            date: "15 DE DICIEMBRE",
            title: "Microblading Expert",
            author: "KikiBrows Academy",
            image: "https://via.placeholder.com/150",
            url: "claseAlumn.html",
            // Datos adicionales para la boleta
            transaccionId: "TRX-001-2024",
            cursoId: "microblading-expert",
            cursoNombre: "Microblading Expert",
            monto: 350000,
            metodoPago: "Webpay Plus",
            codigoAutorizacion: "1234567890",
            fecha: new Date("2024-12-15T14:30:00")
        },
        {
            id: "#TRX-002",
            date: "20 DE NOVIEMBRE",
            title: "Diseño de Mirada Pro",
            author: "KikiBrows Academy",
            image: "https://via.placeholder.com/150",
            url: "claseAlumn.html",
            // Datos adicionales para la boleta
            transaccionId: "TRX-002-2024",
            cursoId: "diseno-mirada-pro",
            cursoNombre: "Diseño de Mirada Pro",
            monto: 280000,
            metodoPago: "Transbank",
            codigoAutorizacion: "0987654321",
            fecha: new Date("2024-11-20T16:45:00")
        }
    ];

    const container = document.getElementById("purchases-list");
    const searchInput = document.getElementById('searchHistory');

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

    // Inicializar renderizado
    renderHistory(transactions);

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