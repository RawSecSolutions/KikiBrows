import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

document.addEventListener('DOMContentLoaded', async () => {

    // --- STATE ---
    let slotsDB = [];
    let isLoading = false;

    const tableContainer = document.getElementById('calendar-table-container');
    const totalResultsSpan = document.getElementById('total-results');
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toast-message');
    const toast = new bootstrap.Toast(toastEl);

    // --- HELPERS ---
    function showToast(msg) {
        toastBody.textContent = msg;
        toast.show();
    }

    function formatDateFromTimestamp(ts) {
        const d = new Date(ts);
        return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function formatTimeFromTimestamp(ts) {
        const d = new Date(ts);
        return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    function getBadge(estado) {
        if (estado === 'DISPONIBLE') return '<span class="badge bg-success rounded-pill">Disponible</span>';
        if (estado === 'LLENO') return '<span class="badge bg-warning text-dark rounded-pill">Lleno</span>';
        return '<span class="badge bg-secondary rounded-pill">Cerrado</span>';
    }

    async function getAuthToken() {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token;
    }

    function showLoadingTable() {
        tableContainer.innerHTML = `
            <div class="text-center p-5">
                <div class="spinner-border" style="color: #8A835A;" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="text-muted mt-2">Cargando slots...</p>
            </div>`;
    }

    // --- CARGAR SLOTS DESDE SUPABASE ---
    async function loadSlots() {
        if (isLoading) return;
        isLoading = true;
        showLoadingTable();

        try {
            const token = await getAuthToken();
            if (!token) {
                tableContainer.innerHTML = '<div class="text-center p-5 text-danger">Sesion expirada. Inicia sesion nuevamente.</div>';
                return;
            }

            const response = await fetch(`${FUNCTIONS_URL}/get-admin-slots`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                },
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error al cargar slots');
            }

            slotsDB = result.data;
            renderTable();
        } catch (error) {
            console.error('Error cargando slots:', error);
            tableContainer.innerHTML = `<div class="text-center p-5 text-danger">Error al cargar: ${error.message}</div>`;
        } finally {
            isLoading = false;
        }
    }

    // --- RENDERIZAR TABLA ---
    function renderTable() {
        const now = new Date();
        // Separar en proximas y pasadas
        const upcoming = slotsDB.filter(s => new Date(s.fecha_inicio) >= now);
        const past = slotsDB.filter(s => new Date(s.fecha_inicio) < now);

        if (totalResultsSpan) totalResultsSpan.textContent = upcoming.length;

        renderSlotTable(upcoming, 'calendar-table-container', 'No hay slots programados.');
        renderSlotTable(past, 'past-classes', 'No hay historial disponible.', true);
    }

    function renderSlotTable(slots, containerId, emptyMsg, isPast = false) {
        const container = containerId === 'past-classes'
            ? document.getElementById(containerId)
            : tableContainer;

        if (!container) return;

        if (slots.length === 0) {
            container.innerHTML = `<div class="text-center p-5 text-muted fst-italic">${emptyMsg}</div>`;
            return;
        }

        let html = `
            <div class="table-responsive">
            <table class="table calendar-table table-hover align-middle">
                <thead>
                    <tr>
                        <th>FECHA</th>
                        <th>HORARIO</th>
                        <th>CUPOS</th>
                        <th>ESTADO</th>
                        <th>ACCIONES</th>
                    </tr>
                </thead>
                <tbody>
        `;

        slots.forEach(slot => {
            const estado = isPast ? 'PASADO' : slot.estado;
            html += `
                <tr data-id="${slot.id}">
                    <td class="fw-bold">${formatDateFromTimestamp(slot.fecha_inicio)}</td>
                    <td>${formatTimeFromTimestamp(slot.fecha_inicio)} - ${formatTimeFromTimestamp(slot.fecha_fin)}</td>
                    <td>${slot.cupos_ocupados}/${slot.cupos_maximos}</td>
                    <td>${getBadge(estado)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-icon me-1" title="Ver Detalles y Links" data-action="view">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${!isPast ? `<button class="btn btn-sm btn-danger btn-icon" title="Eliminar" data-action="delete">
                            <i class="fas fa-trash-alt"></i>
                        </button>` : ''}
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }

    // --- ACCIONES DE TABLA ---
    tableContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.closest('tr').dataset.id;
        const slot = slotsDB.find(s => s.id === id);
        if (!slot) return;

        if (btn.dataset.action === 'delete') {
            await handleDelete(slot);
        }

        if (btn.dataset.action === 'view') {
            openDetailModal(slot);
        }
    });

    // Tambien escuchar clicks en la tabla de pasadas
    const pastContainer = document.getElementById('past-classes');
    if (pastContainer) {
        pastContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn || btn.dataset.action !== 'view') return;
            const id = btn.closest('tr').dataset.id;
            const slot = slotsDB.find(s => s.id === id);
            if (slot) openDetailModal(slot);
        });
    }

    // --- ELIMINAR SLOT ---
    async function handleDelete(slot) {
        const reservas = slot.consultas_reservas || [];

        if (reservas.length > 0) {
            if (!confirm(`Hay ${reservas.length} alumna(s) inscrita(s).\nSe eliminara el slot y el meeting de Zoom.\n\nConfirmas?`)) return;
        } else {
            if (!confirm('Borrar este slot vacio?')) return;
        }

        try {
            const token = await getAuthToken();
            const response = await fetch(`${FUNCTIONS_URL}/delete-zoom-meeting`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                },
                body: JSON.stringify({ slot_id: slot.id }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error al eliminar');
            }

            showToast(result.had_reservations
                ? 'Slot eliminado. Las alumnas inscritas ya no tendran acceso.'
                : 'Slot eliminado.');

            await loadSlots();
        } catch (error) {
            console.error('Error eliminando slot:', error);
            showToast('Error al eliminar: ' + error.message);
        }
    }

    // --- MODAL DETALLE ---
    const viewModal = new bootstrap.Modal(document.getElementById('viewSlotModal'));

    function openDetailModal(slot) {
        document.getElementById('detail-date').textContent = formatDateFromTimestamp(slot.fecha_inicio);
        document.getElementById('detail-time').textContent = `${formatTimeFromTimestamp(slot.fecha_inicio)} - ${formatTimeFromTimestamp(slot.fecha_fin)}`;
        document.getElementById('detail-cupos').textContent = `${slot.cupos_ocupados}/${slot.cupos_maximos}`;
        document.getElementById('detail-badge').innerHTML = getBadge(slot.estado);

        // Barra progreso
        const percent = slot.cupos_maximos > 0 ? (slot.cupos_ocupados / slot.cupos_maximos) * 100 : 0;
        document.getElementById('detail-progress').style.width = `${percent}%`;

        // Botones links de Zoom
        const hostUrl = slot.zoom_host_url || '#';
        const joinUrl = slot.zoom_link || '#';

        document.getElementById('btn-join-now').href = hostUrl;

        // Configurar botones de copiado (Clonar para limpiar eventos previos)
        const btnAdmin = document.getElementById('btn-copy-admin');
        const btnStudent = document.getElementById('btn-copy-student');

        const newBtnAdmin = btnAdmin.cloneNode(true);
        const newBtnStudent = btnStudent.cloneNode(true);

        btnAdmin.parentNode.replaceChild(newBtnAdmin, btnAdmin);
        btnStudent.parentNode.replaceChild(newBtnStudent, btnStudent);

        newBtnAdmin.addEventListener('click', () => {
            navigator.clipboard.writeText(hostUrl);
            showToast('Link de HOST (Tu link) copiado.');
        });

        newBtnStudent.addEventListener('click', () => {
            navigator.clipboard.writeText(joinUrl);
            showToast('Link de ALUMNA (Para compartir) copiado.');
        });

        // Llenar lista alumnas desde consultas_reservas enriquecidas
        const listBody = document.getElementById('detail-students-list');
        const noMsg = document.getElementById('no-students-msg');
        listBody.innerHTML = '';

        const reservas = slot.consultas_reservas || [];

        if (reservas.length === 0) {
            noMsg.classList.remove('d-none');
        } else {
            noMsg.classList.add('d-none');
            reservas.forEach(r => {
                listBody.innerHTML += `
                    <tr>
                        <td class="fw-bold">${r.alumna_nombre || 'Sin nombre'}</td>
                        <td class="text-muted small">${r.alumna_email || 'Sin email'}</td>
                        <td><span class="badge bg-light text-dark border">${r.curso_nombre_snapshot || 'General'}</span></td>
                    </tr>
                `;
            });
        }
        viewModal.show();
    }

    // --- CREAR SLOT (via Edge Function + Zoom API) ---
    document.getElementById('create-slot-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const fecha = document.getElementById('slot-date').value;
        const inicio = document.getElementById('start-time').value;
        const fin = document.getElementById('end-time').value;
        const cuposMax = parseInt(document.getElementById('max-slots').value);

        if (inicio >= fin) {
            alert('La hora de fin debe ser despues del inicio.');
            return;
        }

        // Deshabilitar boton mientras se crea
        const submitBtn = e.target.querySelector('button[type="submit"], [form="create-slot-form"][type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Creando...';
        }

        try {
            const token = await getAuthToken();
            const response = await fetch(`${FUNCTIONS_URL}/create-zoom-meeting`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                },
                body: JSON.stringify({
                    fecha,
                    inicio,
                    fin,
                    cupos_maximos: cuposMax,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error al crear slot');
            }

            bootstrap.Modal.getInstance(document.getElementById('createSlotModal')).hide();
            e.target.reset();
            showToast('Slot creado con meeting de Zoom real!');

            await loadSlots();
        } catch (error) {
            console.error('Error creando slot:', error);
            alert('Error al crear slot: ' + error.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    });

    // --- INICIALIZAR ---
    await loadSlots();
});
