// js/transaccionesAdmin.js

document.addEventListener('DOMContentLoaded', () => {

    // Simulación de datos con trazabilidad bancaria
    const allTransactions = [
        {
            id: 1,
            producto: 'Curso Microblading',
            valor: 30000,
            usuario: 'Maria Castillo',
            fecha: '12/12/2024',
            email: 'maria@gmail.com',
            estado: 'Completada',
            // Datos bancarios
            paymentStatus: 'PAGADO',
            bank: 'Webpay Plus',
            paymentMethod: 'Débito',
            authCode: '182930',
            gatewayToken: '01ab23cd-45ef-6789-90ab-cdef12345678'
        },
        {
            id: 2,
            producto: 'Lifting Pestañas',
            valor: 15000,
            usuario: 'Javier Pérez',
            fecha: '12/12/2024',
            email: 'javier@mail.com',
            estado: 'Completada',
            // Datos bancarios
            paymentStatus: 'PAGADO',
            bank: 'Mercado Pago',
            paymentMethod: 'Crédito',
            authCode: '998877',
            gatewayToken: 'mp-3d4e5f67-89ab-cdef-0123-456789abcdef'
        },
        {
            id: 3,
            producto: 'Diseño de Cejas',
            valor: 45000,
            usuario: 'Andrea Soto',
            fecha: '11/12/2024',
            email: 'andrea@mail.com',
            estado: 'Completada',
            // Datos bancarios
            paymentStatus: 'PAGADO',
            bank: 'Webpay Plus',
            paymentMethod: 'Prepago',
            authCode: '445521',
            gatewayToken: '02bc34de-56fa-7890-12bc-def345678901'
        },
        // Generar más datos para probar paginación
        ...Array(15).fill().map((_, i) => {
            const statuses = ['PAGADO', 'PAGADO', 'PAGADO', 'PENDIENTE', 'RECHAZADO'];
            const banks = ['Webpay Plus', 'Mercado Pago'];
            const methods = ['Débito', 'Crédito', 'Prepago'];

            return {
                id: i + 4,
                producto: `Servicio ${i + 4}`,
                valor: (i + 1) * 2000,
                usuario: `Cliente ${i + 4}`,
                fecha: `10/12/2024`,
                email: `cliente${i + 4}@mail.com`,
                estado: 'Completada',
                // Datos bancarios
                paymentStatus: statuses[i % statuses.length],
                bank: banks[i % banks.length],
                paymentMethod: methods[i % methods.length],
                authCode: String(100000 + i * 11111).substring(0, 6),
                gatewayToken: `${i}abc${i}def-${i}ghi-${i}jkl-${i}mno-${i}pqr${i}stu${i}vwx`
            };
        })
    ];

    const transactionsPerPage = 8;
    let currentPage = 1;
    let filteredTransactions = [...allTransactions]; // Transacciones filtradas por búsqueda
    let totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

    const listBody = document.getElementById('transaction-list');
    const modalDetails = document.getElementById('modal-details');
    const searchInput = document.getElementById('transaction-search');

    // Elementos de paginación
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    function renderTable() {
        if (!listBody) return;
        listBody.innerHTML = '';

        // Recalcular paginación basada en datos filtrados
        totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

        // Si no hay resultados, mostrar mensaje
        if (filteredTransactions.length === 0) {
            listBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-search fa-2x mb-2"></i>
                        <p class="mb-0">No se encontraron transacciones que coincidan con tu búsqueda</p>
                    </td>
                </tr>
            `;
            updatePagination();
            return;
        }

        const start = (currentPage - 1) * transactionsPerPage;
        const end = start + transactionsPerPage;
        const displayData = filteredTransactions.slice(start, end);

        displayData.forEach(t => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.innerHTML = `
                <td>${t.producto}</td>
                <td class="fw-bold">$ ${t.valor.toLocaleString('es-CL')}</td>
                <td>${t.usuario}</td>
                <td>${t.fecha}</td>
                <td>#${t.id}</td>
                <td>
                    <button class="btn btn-sm text-white" style="background-color: #8A835A;"
                            data-id="${t.id}" data-bs-toggle="modal" data-bs-target="#transactionDetailModal">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            listBody.appendChild(row);
        });

        updatePagination();
    }
    
    function updatePagination() {
        if (!prevBtn || !nextBtn) return;

        // Estado botones
        if (currentPage === 1) prevBtn.classList.add('disabled');
        else prevBtn.classList.remove('disabled');

        if (currentPage === totalPages || totalPages === 0) nextBtn.classList.add('disabled');
        else nextBtn.classList.remove('disabled');

        // Listeners simples (se recomienda removerlos y re-agregar o usar clonación para evitar duplicados en SPA, aquí simple)
        // Nota: En una app real, gestiona los listeners mejor.
    }

    // Función de búsqueda inteligente
    function searchTransactions(query) {
        const searchTerm = query.toLowerCase().trim();

        if (!searchTerm) {
            // Si no hay búsqueda, mostrar todas
            filteredTransactions = [...allTransactions];
        } else {
            // Buscar en nombre, ID y código de autorización
            filteredTransactions = allTransactions.filter(t => {
                const matchesName = t.usuario.toLowerCase().includes(searchTerm);
                const matchesId = String(t.id).includes(searchTerm) || `#${t.id}`.includes(searchTerm);
                const matchesAuthCode = t.authCode.toLowerCase().includes(searchTerm);
                const matchesProduct = t.producto.toLowerCase().includes(searchTerm);

                return matchesName || matchesId || matchesAuthCode || matchesProduct;
            });
        }

        // Resetear a la primera página después de buscar
        currentPage = 1;
        renderTable();
    }

    // Event listener para búsqueda
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTransactions(e.target.value);
        });
    }

    // Eventos Paginación
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
    }
    
    // Evento Modal Detalle
    const detailModal = document.getElementById('transactionDetailModal');
    if (detailModal) {
        detailModal.addEventListener('show.bs.modal', (event) => {
            const btn = event.relatedTarget;
            const id = btn.getAttribute('data-id');
            const t = allTransactions.find(x => x.id == id);

            if (t && modalDetails) {
                // Determinar color del badge según estado
                const statusColors = {
                    'PAGADO': 'success',
                    'PENDIENTE': 'warning',
                    'RECHAZADO': 'danger'
                };
                const statusColor = statusColors[t.paymentStatus] || 'secondary';

                modalDetails.innerHTML = `
                    <h5 class="fw-bold mb-1">${t.producto}</h5>
                    <p class="text-muted mb-3">Total: <span class="text-danger fw-bold">$ ${t.valor.toLocaleString('es-CL')}</span></p>
                    <hr>
                    <p class="text-success fw-bold mb-1">Cliente</p>
                    <p class="mb-0">${t.usuario}</p>
                    <p class="text-muted small">${t.email}</p>
                    <hr>

                    <!-- Sección de Datos del Banco (Trazabilidad) -->
                    <div class="bank-details-section p-3 rounded mb-3" style="background-color: rgba(138, 131, 90, 0.08); border-left: 3px solid #8A835A;">
                        <p class="fw-bold mb-2" style="color: #8A835A; font-size: 0.9rem;">
                            <i class="fas fa-university me-2"></i>DATOS DEL BANCO (TRAZABILIDAD)
                        </p>

                        <div class="row g-2 small">
                            <div class="col-12">
                                <span class="text-muted">Estado:</span>
                                <span class="badge bg-${statusColor} ms-2">${t.paymentStatus}</span>
                            </div>
                            <div class="col-12">
                                <span class="text-muted">Banco:</span>
                                <strong class="ms-2">${t.bank} (${t.paymentMethod})</strong>
                            </div>
                            <div class="col-12">
                                <span class="text-muted">Cód. Autorización:</span>
                                <strong class="ms-2 text-primary">${t.authCode}</strong>
                                <i class="fas fa-copy ms-1 text-muted" style="cursor: pointer;"
                                   onclick="navigator.clipboard.writeText('${t.authCode}')"
                                   title="Copiar código"></i>
                            </div>
                            <div class="col-12">
                                <span class="text-muted">Método de Pago:</span>
                                <strong class="ms-2">${t.paymentMethod}</strong>
                            </div>
                            <div class="col-12">
                                <span class="text-muted">Token Pasarela:</span>
                                <code class="ms-2 small" style="font-size: 0.7rem; color: #6c757d; background-color: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 3px;">${t.gatewayToken}</code>
                                <i class="fas fa-copy ms-1 text-muted" style="cursor: pointer;"
                                   onclick="navigator.clipboard.writeText('${t.gatewayToken}')"
                                   title="Copiar token"></i>
                            </div>
                        </div>
                    </div>

                    <div class="d-flex justify-content-between text-muted small">
                        <span>ID: <strong>#${t.id}</strong></span>
                        <span>Fecha: <strong>${t.fecha}</strong></span>
                    </div>
                `;
            }
        });
    }

    renderTable();
});