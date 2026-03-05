// js/transaccionesAdmin.js - Transacciones Admin con datos reales de Supabase

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {

    const transactionsPerPage = 8;
    let currentPage = 1;
    let allTransactions = [];
    let filteredTransactions = [];
    let totalPages = 0;

    const listBody = document.getElementById('transaction-list');
    const modalDetails = document.getElementById('modal-details');
    const searchInput = document.getElementById('transaction-search');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    // Cargar transacciones reales desde Supabase
    async function loadTransactions() {
        if (listBody) {
            listBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                        Cargando transacciones...
                    </td>
                </tr>
            `;
        }

        try {
            const { data, error } = await supabase
                .from('transacciones')
                .select(`
                    id,
                    folio_visual,
                    curso_titulo_snapshot,
                    monto,
                    metodo_pago,
                    estado,
                    token_pasarela,
                    codigo_autorizacion,
                    fecha_compra,
                    usuario_id,
                    curso_id
                `)
                .order('fecha_compra', { ascending: false });

            if (error) throw error;

            // Fetch profiles separately since there's no FK relationship
            const usuarioIds = [...new Set((data || []).map(t => t.usuario_id).filter(Boolean))];
            let profilesMap = {};
            if (usuarioIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, email')
                    .in('id', usuarioIds);
                (profiles || []).forEach(p => { profilesMap[p.id] = p; });
            }

            allTransactions = (data || []).map(t => {
                const profile = profilesMap[t.usuario_id];
                const nombre = profile
                    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                    : 'Usuario desconocido';
                const email = profile?.email || '';

                // Formatear fecha
                const fecha = t.fecha_compra
                    ? new Date(t.fecha_compra).toLocaleDateString('es-CL', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                    })
                    : 'Sin fecha';

                return {
                    id: t.id,
                    folio: t.folio_visual || null,
                    producto: t.curso_titulo_snapshot || 'Producto sin nombre',
                    valor: Number(t.monto) || 0,
                    usuario: nombre,
                    email: email,
                    fecha: fecha,
                    fechaRaw: t.fecha_compra,
                    estado: t.estado || 'PENDIENTE',
                    metodo_pago: t.metodo_pago || '',
                    codigo_autorizacion: t.codigo_autorizacion || '',
                    token_pasarela: t.token_pasarela || ''
                };
            });

            filteredTransactions = [...allTransactions];
            renderTable();

        } catch (err) {
            console.error('Error cargando transacciones:', err);
            if (listBody) {
                listBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-danger py-4">
                            <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                            <p class="mb-0">Error al cargar transacciones. Intenta recargar la página.</p>
                        </td>
                    </tr>
                `;
            }
        }
    }

    function renderTable() {
        if (!listBody) return;
        listBody.innerHTML = '';

        totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

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
            const displayId = t.folio ? `#${t.folio}` : `#${t.id.substring(0, 8)}`;
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.innerHTML = `
                <td>${t.producto}</td>
                <td class="fw-bold">$ ${t.valor.toLocaleString('es-CL')}</td>
                <td>${t.usuario}</td>
                <td>${t.fecha}</td>
                <td>${displayId}</td>
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

        if (currentPage === 1) prevBtn.classList.add('disabled');
        else prevBtn.classList.remove('disabled');

        if (currentPage === totalPages || totalPages === 0) nextBtn.classList.add('disabled');
        else nextBtn.classList.remove('disabled');
    }

    // Búsqueda inteligente
    function searchTransactions(query) {
        const searchTerm = query.toLowerCase().trim();

        if (!searchTerm) {
            filteredTransactions = [...allTransactions];
        } else {
            filteredTransactions = allTransactions.filter(t => {
                const matchesName = t.usuario.toLowerCase().includes(searchTerm);
                const matchesFolio = t.folio && String(t.folio).includes(searchTerm);
                const matchesId = t.id.toLowerCase().includes(searchTerm);
                const matchesAuthCode = t.codigo_autorizacion.toLowerCase().includes(searchTerm);
                const matchesProduct = t.producto.toLowerCase().includes(searchTerm);

                return matchesName || matchesFolio || matchesId || matchesAuthCode || matchesProduct;
            });
        }

        currentPage = 1;
        renderTable();
    }

    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTransactions(e.target.value);
        });
    }

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

    // Modal Detalle
    const detailModal = document.getElementById('transactionDetailModal');
    if (detailModal) {
        detailModal.addEventListener('show.bs.modal', (event) => {
            const btn = event.relatedTarget;
            const id = btn.getAttribute('data-id');
            const t = allTransactions.find(x => x.id === id);

            if (t && modalDetails) {
                const statusColors = {
                    'PAGADO': 'success',
                    'PENDIENTE': 'warning',
                    'RECHAZADO': 'danger'
                };
                const statusColor = statusColors[t.estado] || 'secondary';
                const displayId = t.folio ? `#${t.folio}` : `#${t.id.substring(0, 8)}`;

                modalDetails.innerHTML = `
                    <h5 class="fw-bold mb-1">${t.producto}</h5>
                    <p class="text-muted mb-3">Total: <span class="text-danger fw-bold">$ ${t.valor.toLocaleString('es-CL')}</span></p>
                    <hr>
                    <p class="text-success fw-bold mb-1">Cliente</p>
                    <p class="mb-0">${t.usuario}</p>
                    <p class="text-muted small">${t.email}</p>
                    <hr>

                    <!-- Datos del Banco (Trazabilidad) -->
                    <div class="bank-details-section p-3 rounded mb-3" style="background-color: rgba(138, 131, 90, 0.08); border-left: 3px solid #8A835A;">
                        <p class="fw-bold mb-2" style="color: #8A835A; font-size: 0.9rem;">
                            <i class="fas fa-university me-2"></i>DATOS DEL BANCO (TRAZABILIDAD)
                        </p>

                        <div class="row g-2 small">
                            <div class="col-12">
                                <span class="text-muted">Estado:</span>
                                <span class="badge bg-${statusColor} ms-2">${t.estado}</span>
                            </div>
                            ${t.metodo_pago ? `
                            <div class="col-12">
                                <span class="text-muted">Método de Pago:</span>
                                <strong class="ms-2">${t.metodo_pago}</strong>
                            </div>` : ''}
                            ${t.codigo_autorizacion ? `
                            <div class="col-12">
                                <span class="text-muted">Cód. Autorización:</span>
                                <strong class="ms-2 text-primary">${t.codigo_autorizacion}</strong>
                                <i class="fas fa-copy ms-1 text-muted" style="cursor: pointer;"
                                   title="Copiar código"></i>
                            </div>` : ''}
                            ${t.token_pasarela ? `
                            <div class="col-12">
                                <span class="text-muted">Token Pasarela:</span>
                                <code class="ms-2 small" style="font-size: 0.7rem; color: #6c757d; background-color: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 3px;">${t.token_pasarela}</code>
                                <i class="fas fa-copy ms-1 text-muted" style="cursor: pointer;"
                                   title="Copiar token"></i>
                            </div>` : ''}
                        </div>
                    </div>

                    <div class="d-flex justify-content-between text-muted small">
                        <span>ID: <strong>${displayId}</strong></span>
                        <span>Fecha: <strong>${t.fecha}</strong></span>
                    </div>
                `;

                // Event listeners para copiar al portapapeles
                modalDetails.querySelectorAll('.fa-copy').forEach(icon => {
                    icon.addEventListener('click', () => {
                        const textToCopy = icon.previousElementSibling.textContent.trim();
                        navigator.clipboard.writeText(textToCopy);
                    });
                });
            }
        });
    }

    // Iniciar carga
    loadTransactions();
});
