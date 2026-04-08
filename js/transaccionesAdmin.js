// js/transaccionesAdmin.js - Transacciones Admin con datos reales de Supabase

import { supabase, ensureFreshSession } from './sessionManager.js';
import { authReady } from './authGuardAdmin.js';

document.addEventListener('DOMContentLoaded', async () => {

    const transactionsPerPage = 8;
    let currentPage = 1;
    let allTransactions = [];
    let filteredTransactions = [];
    let totalPages = 0;

    const listBody = document.getElementById('transaction-list');
    const modalDetails = document.getElementById('modal-details');
    const searchInput = document.getElementById('transaction-search');
    const monthFilter = document.getElementById('month-filter');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    // Toast
    const toastEl = document.getElementById('transaToast');
    const toastBody = document.getElementById('transa-toast-msg');
    let toast = null;
    if (toastEl) toast = new bootstrap.Toast(toastEl);

    function showToast(msg, type = 'success') {
        if (!toastEl || !toast) return;
        toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
        toastBody.textContent = msg;
        toast.show();
    }

    // Poblar filtro de meses dinámicamente desde los datos
    function populateMonthFilter() {
        if (!monthFilter) return;
        const months = new Set();
        allTransactions.forEach(t => {
            if (t.fechaRaw) {
                const d = new Date(t.fechaRaw);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                months.add(key);
            }
        });

        const sortedMonths = [...months].sort().reverse();
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        monthFilter.innerHTML = '<option value="all">Todos los Meses</option>';
        sortedMonths.forEach(m => {
            const [year, mon] = m.split('-');
            const label = `${monthNames[parseInt(mon) - 1]} ${year}`;
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = label;
            monthFilter.appendChild(opt);
        });
    }

    // Cargar transacciones reales desde Supabase
    async function loadTransactions() {
        console.log('[Transacciones] Iniciando loadTransactions()...');

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
            // Asegurar que el JWT sea válido antes de consultar (evita RLS bloqueando por token expirado)
            const session = await ensureFreshSession();
            console.log('[Transacciones] Sesión activa:', !!session, session ? `| uid: ${session.user.id}` : '');

            if (!session) {
                console.error('[Transacciones] No hay sesión válida. Las queries serán bloqueadas por RLS.');
            }

            console.log('[Transacciones] Consultando tabla "transacciones" con filtro estado=PAGADO...');
            const { data, error, status, statusText } = await supabase
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
                .eq('estado', 'PAGADO')
                .order('fecha_compra', { ascending: false });

            console.log('[Transacciones] Respuesta:', { status, statusText, filas: data?.length ?? 0, error: error || 'ninguno' });

            if (error) {
                console.error('[Transacciones] Error de Supabase:', { mensaje: error.message, codigo: error.code, detalles: error.details, hint: error.hint });
                throw error;
            }

            if (!data || data.length === 0) {
                console.warn('[Transacciones] 0 filas devueltas. Posibles causas: RLS bloqueando, tabla vacía, o ninguna transacción con estado PAGADO.');
                // Prueba sin filtro para descartar que el filtro sea el problema
                const { data: testData, error: testErr } = await supabase
                    .from('transacciones')
                    .select('id, estado')
                    .limit(5);
                console.log('[Transacciones] Test sin filtro estado:', { filas: testData?.length ?? 0, estados: testData?.map(t => t.estado), error: testErr?.message || 'ninguno' });
            } else {
                console.log(`[Transacciones] ${data.length} transacciones PAGADO cargadas OK.`);
            }

            // Fetch profiles separately since there's no FK relationship
            const usuarioIds = [...new Set((data || []).map(t => t.usuario_id).filter(Boolean))];
            let profilesMap = {};
            if (usuarioIds.length > 0) {
                console.log(`[Transacciones] Cargando perfiles para ${usuarioIds.length} usuarios...`);
                const { data: profiles, error: profErr } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, email')
                    .in('id', usuarioIds);

                if (profErr) {
                    console.error('[Transacciones] Error cargando profiles:', { mensaje: profErr.message, codigo: profErr.code });
                } else {
                    console.log(`[Transacciones] ${(profiles || []).length} perfiles cargados.`);
                }
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

            console.log(`[Transacciones] ${allTransactions.length} transacciones mapeadas. Renderizando tabla...`);
            populateMonthFilter();
            applyFilters();

        } catch (err) {
            console.error('[Transacciones] Error CATCH cargando transacciones:', err.message || err, err);
            if (listBody) {
                listBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-danger py-4">
                            <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                            <p class="mb-0">Error al cargar transacciones. Intenta recargar la página.</p>
                            <p class="small text-muted mt-1">${err.message || 'Error desconocido'}</p>
                        </td>
                    </tr>
                `;
            }
        }
    }

    // Aplicar todos los filtros (búsqueda + mes + estado)
    function applyFilters() {
        const searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const selectedMonth = monthFilter ? monthFilter.value : 'all';

        filteredTransactions = allTransactions.filter(t => {
            // Filtro de búsqueda
            let matchesSearch = true;
            if (searchTerm) {
                const matchesName = t.usuario.toLowerCase().includes(searchTerm);
                const matchesFolio = t.folio && String(t.folio).includes(searchTerm);
                const matchesId = t.id.toLowerCase().includes(searchTerm);
                const matchesAuthCode = t.codigo_autorizacion.toLowerCase().includes(searchTerm);
                const matchesProduct = t.producto.toLowerCase().includes(searchTerm);
                matchesSearch = matchesName || matchesFolio || matchesId || matchesAuthCode || matchesProduct;
            }

            // Filtro de mes
            let matchesMonth = true;
            if (selectedMonth !== 'all' && t.fechaRaw) {
                const d = new Date(t.fechaRaw);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                matchesMonth = key === selectedMonth;
            }

            return matchesSearch && matchesMonth;
        });

        currentPage = 1;
        renderTable();
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
                        <p class="mb-0">No se encontraron transacciones.</p>
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

            // Badge de estado en la tabla
            const statusBadges = {
                'PAGADO': '<span class="badge bg-success">Pagado</span>',
                'PENDIENTE': '<span class="badge bg-warning text-dark">Pendiente</span>',
                'RECHAZADO': '<span class="badge bg-danger">Rechazado</span>'
            };
            const estadoBadge = statusBadges[t.estado] || `<span class="badge bg-secondary">${t.estado}</span>`;

            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.innerHTML = `
                <td>${t.producto}</td>
                <td class="fw-bold">$ ${t.valor.toLocaleString('es-CL')}</td>
                <td>${t.usuario}</td>
                <td>${t.fecha}</td>
                <td>${displayId} ${estadoBadge}</td>
                <td>
                    <button class="btn-kikibrows btn-sm"
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

    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('input', () => applyFilters());
    }

    if (monthFilter) {
        monthFilter.addEventListener('change', () => applyFilters());
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
            if (!btn) return;
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
                        showToast('Copiado al portapapeles.');
                    });
                });
            }
        });
    }

    // Esperar a que la autenticación esté lista antes de cargar datos
    console.log('[Transacciones] Esperando authReady...');
    await authReady;
    console.log('[Transacciones] Auth lista. Iniciando carga de datos.');

    // Iniciar carga
    loadTransactions();
});
