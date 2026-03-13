/**
 * js/calendarAdmin.js
 * Gestión del Calendario de Consultas Zoom - Panel Admin
 * Conectado a Supabase (consulta_slots, consultas_reservas) + Edge Function zoom-create-meeting
 */

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {

    // --- REFERENCIAS DOM ---
    const totalResultsSpan = document.getElementById('total-results');
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toast-message');
    const toast = new bootstrap.Toast(toastEl);

    // --- HELPERS ---
    function showToast(msg, type = 'success') {
        toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
        toastBody.textContent = msg;
        toast.show();
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        const dia = String(d.getUTCDate()).padStart(2, '0');
        const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
        const año = d.getUTCFullYear();
        return `${dia}/${mes}/${año}`;
    }

    function formatTime(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('es-CL', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'UTC'
        });
    }

    function getBadge(estado) {
        if (estado === 'DISPONIBLE') return '<span class="badge bg-success rounded-pill">Disponible</span>';
        if (estado === 'LLENO') return '<span class="badge bg-warning text-dark rounded-pill">Lleno</span>';
        if (estado === 'COMPLETADO') return '<span class="badge bg-info text-dark rounded-pill">Completado</span>';
        if (estado === 'CANCELADO') return '<span class="badge bg-danger rounded-pill">Cancelado</span>';
        return `<span class="badge bg-secondary rounded-pill">${estado}</span>`;
    }

    function calculateDuration(inicio, fin) {
        const [h1, m1] = inicio.split(':').map(Number);
        const [h2, m2] = fin.split(':').map(Number);
        return (h2 * 60 + m2) - (h1 * 60 + m1);
    }

    // --- CARGAR SLOTS DESDE SUPABASE ---
    let slotsCache = [];

    async function loadSlots() {
        try {
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from('consulta_slots')
                .select('*')
                .gte('fecha_inicio', now)
                .order('fecha_inicio', { ascending: true });

            if (error) throw error;

            slotsCache = data || [];
            renderTable(slotsCache);
        } catch (err) {
            console.error('Error cargando slots:', err);
            showToast('Error al cargar los slots', 'danger');
        }
    }

    async function loadPastSlots() {
        try {
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from('consulta_slots')
                .select('*')
                .lt('fecha_inicio', now)
                .order('fecha_inicio', { ascending: false })
                .limit(50);

            if (error) throw error;

            renderPastTable(data || []);
        } catch (err) {
            console.error('Error cargando slots pasados:', err);
        }
    }

    // --- RENDERIZAR TABLA PRÓXIMAS ---
    function renderTable(slots) {
        if (totalResultsSpan) totalResultsSpan.textContent = slots.length;

        const tableBody = document.getElementById('calendar-table-body');
        if (!tableBody) return;

        if (slots.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-5 text-muted">No hay slots creados.</td></tr>';
            return;
        }

        let html = '';
        slots.forEach(slot => {
            html += `
                <tr data-id="${slot.id}">
                    <td class="fw-bold">${formatDate(slot.fecha_inicio)}</td>
                    <td>${formatTime(slot.fecha_inicio)} - ${formatTime(slot.fecha_fin)}</td>
                    <td>${slot.cupos_ocupados}/${slot.cupos_maximos}</td>
                    <td>${getBadge(slot.estado)}</td>
                    <td class="text-end">
                        <button class="btn btn-sm text-white btn-icon me-1" style="background-color: #8A835A;" title="Ver Detalles y Links" data-action="view">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-icon" title="Eliminar" data-action="delete">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    }

    // --- RENDERIZAR TABLA PASADAS ---
    function renderPastTable(slots) {
        const pastTableBody = document.getElementById('past-table-body');
        if (!pastTableBody) return;

        if (slots.length === 0) {
            pastTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted p-5 fst-italic">No hay historial disponible.</td></tr>';
            return;
        }

        let html = '';
        slots.forEach(slot => {
            html += `
                <tr>
                    <td class="fw-bold">${formatDate(slot.fecha_inicio)}</td>
                    <td>${formatTime(slot.fecha_inicio)} - ${formatTime(slot.fecha_fin)}</td>
                    <td>${slot.cupos_ocupados}/${slot.cupos_maximos}</td>
                    <td>${getBadge(slot.estado)}</td>
                </tr>
            `;
        });
        pastTableBody.innerHTML = html;
    }

    // --- ACCIONES DE TABLA ---
    const tableBodyUpcoming = document.getElementById('calendar-table-body');
    if (tableBodyUpcoming) {
        tableBodyUpcoming.addEventListener('click', async (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const tr = btn.closest('tr');
            if (!tr) return;
            
            const id = tr.dataset.id;
            const slot = slotsCache.find(s => s.id === id);
            if (!slot) return;

            if (btn.dataset.action === 'delete') {
                if (slot.cupos_ocupados > 0) {
                    if (!confirm(`¡OJO! Hay ${slot.cupos_ocupados} alumnas inscritas.\n¿Confirmas eliminar este slot?`)) return;
                } else {
                    if (!confirm('¿Borrar este slot vacío?')) return;
                }

                try {
                    // Eliminar reservas asociadas primero
                    const { error: resError } = await supabase
                        .from('consultas_reservas')
                        .delete()
                        .eq('slot_id', id);

                    if (resError) throw resError;

                    // Eliminar el slot
                    const { error } = await supabase
                        .from('consulta_slots')
                        .delete()
                        .eq('id', id);

                    if (error) throw error;

                    showToast('Slot eliminado correctamente.');
                    await loadSlots();
                } catch (err) {
                    console.error('Error eliminando slot:', err);
                    showToast('Error al eliminar el slot', 'danger');
                }
            }

            if (btn.dataset.action === 'view') {
                await openDetailModal(slot);
            }
        });
    }

    // --- MODAL DETALLE ---
    const viewModalElement = document.getElementById('viewSlotModal');
    let viewModal = null;
    if(viewModalElement) {
        viewModal = new bootstrap.Modal(viewModalElement);
    }

    async function openDetailModal(slot) {
        document.getElementById('detail-date').textContent = formatDate(slot.fecha_inicio);
        document.getElementById('detail-time').textContent = `${formatTime(slot.fecha_inicio)} - ${formatTime(slot.fecha_fin)}`;
        document.getElementById('detail-cupos').textContent = `${slot.cupos_ocupados}/${slot.cupos_maximos}`;
        document.getElementById('detail-badge').innerHTML = getBadge(slot.estado);

        // Barra progreso
        const percent = slot.cupos_maximos > 0 ? (slot.cupos_ocupados / slot.cupos_maximos) * 100 : 0;
        document.getElementById('detail-progress').style.width = `${percent}%`;

        // Links de Zoom (columnas directas)
        const hostUrl = slot.zoom_host_url;
        const joinUrl = slot.zoom_link;

        const btnJoin = document.getElementById('btn-join-now');
        btnJoin.href = hostUrl || '#';
        if (!hostUrl) btnJoin.classList.add('disabled');
        else btnJoin.classList.remove('disabled');

        // Botones de copiado (clonar para limpiar eventos previos)
        const btnAdmin = document.getElementById('btn-copy-admin');
        const btnStudent = document.getElementById('btn-copy-student');

        const newBtnAdmin = btnAdmin.cloneNode(true);
        const newBtnStudent = btnStudent.cloneNode(true);

        btnAdmin.parentNode.replaceChild(newBtnAdmin, btnAdmin);
        btnStudent.parentNode.replaceChild(newBtnStudent, btnStudent);

        newBtnAdmin.addEventListener('click', () => {
            if (hostUrl) {
                navigator.clipboard.writeText(hostUrl);
                showToast('Link de HOST (Tu link) copiado.');
            } else {
                showToast('No hay link de host disponible.', 'warning');
            }
        });

        newBtnStudent.addEventListener('click', () => {
            if (joinUrl) {
                navigator.clipboard.writeText(joinUrl);
                showToast('Link de ALUMNA (Para compartir) copiado.');
            } else {
                showToast('No hay link de alumna disponible.', 'warning');
            }
        });

        // Cargar lista de alumnas inscritas desde consultas_reservas
        const listBody = document.getElementById('detail-students-list');
        const noMsg = document.getElementById('no-students-msg');
        listBody.innerHTML = '';

        try {
            const { data: reservas, error } = await supabase
                .from('consultas_reservas')
                .select(`
                    id,
                    curso_nombre_snapshot,
                    estado,
                    created_at,
                    usuario_id
                `)
                .eq('slot_id', slot.id)
                // Ocultamos las que ya fueron canceladas para mantener tu lista limpia
                .neq('estado', 'CANCELADA') 
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (!reservas || reservas.length === 0) {
                noMsg.classList.remove('d-none');
            } else {
                noMsg.classList.add('d-none');

                // Obtener perfiles de los usuarios reservados
                const userIds = reservas.map(r => r.usuario_id);
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, email')
                    .in('id', userIds);

                const profileMap = {};
                (profiles || []).forEach(p => {
                    profileMap[p.id] = p;
                });

                reservas.forEach(r => {
                    const profile = profileMap[r.usuario_id];
                    const nombre = profile
                        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                        : 'Sin nombre';
                    const email = profile && profile.email ? profile.email : 'Sin email registrado';

                    // Agregamos un semáforo visual para saber si ya confirmaron
                    let estadoBadge = '';
                    if (r.estado === 'CONFIRMADA') {
                        estadoBadge = '<span class="badge bg-success ms-2" style="font-size: 0.7em;">Confirmada</span>';
                    } else if (r.estado === 'PENDIENTE') {
                        estadoBadge = '<span class="badge bg-warning text-dark ms-2" style="font-size: 0.7em;">Pendiente</span>';
                    }

                    listBody.innerHTML += `
                        <tr>
                            <td>
                                <div class="fw-bold">${nombre}</div>
                                <div>${estadoBadge}</div>
                            </td>
                            <td class="text-muted small">${email}</td>
                            <td><span class="badge bg-light text-dark border">${r.curso_nombre_snapshot || 'General'}</span></td>
                        </tr>
                    `;
                });
            }
        } catch (err) {
            console.error('Error cargando reservas:', err);
            noMsg.classList.remove('d-none');
        }
        
        if (viewModal) viewModal.show();
    }

    // --- CREAR SLOT (con Zoom API via Edge Function) ---
    const createSlotForm = document.getElementById('create-slot-form');
    if (createSlotForm) {
        createSlotForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fecha = document.getElementById('slot-date').value;
            const inicio = document.getElementById('start-time').value;
            const fin = document.getElementById('end-time').value;
            const cuposMax = parseInt(document.getElementById('max-slots').value);

            if (inicio >= fin) {
                alert('La hora de fin debe ser después del inicio.');
                return;
            }

            // Mostrar loading en el botón
            const submitBtn = e.target.querySelector('button[type="submit"]') || document.querySelector('[form="create-slot-form"][type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando...';

            try {
                // Construir las fechas con timezone de Chile
                const fechaInicio = `${fecha}T${inicio}:00`;
                const fechaFin = `${fecha}T${fin}:00`;
                const duration = calculateDuration(inicio, fin);
                const topic = `Consulta KikiBrows - ${fecha} ${inicio}-${fin}`;

                // Obtener sesión para el token de autenticación
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    throw new Error('Sesión expirada. Por favor recarga la página.');
                }

                // Llamar Edge Function para crear meeting en Zoom
                let zoomData = null;
                try {
                    const { data, error } = await supabase.functions.invoke('zoom-create-meeting', {
                        body: {
                            topic,
                            start_time: fechaInicio,
                            duration,
                            timezone: 'America/Santiago'
                        }
                    });

                    if (error) throw error;
                    if (data && data.success) {
                        zoomData = data;
                        console.log('✓ Meeting de Zoom creado - ID:', data.meeting_id);
                    }
                } catch (zoomErr) {
                    console.warn('⚠ No se pudo crear el meeting de Zoom:', zoomErr.message);
                    showToast('Slot creado sin meeting de Zoom (revisa la configuración)', 'warning');
                }

                // Insertar slot en Supabase con columnas separadas
                const { data: newSlot, error: insertError } = await supabase
                    .from('consulta_slots')
                    .insert([{
                        fecha_inicio: fechaInicio,
                        fecha_fin: fechaFin,
                        zoom_link: zoomData ? zoomData.join_url : null,
                        zoom_host_url: zoomData ? zoomData.start_url : null,
                        zoom_meeting_id: zoomData ? zoomData.meeting_id : null,
                        cupos_maximos: cuposMax,
                        cupos_ocupados: 0,
                        estado: 'DISPONIBLE'
                    }])
                    .select()
                    .single();

                if (insertError) throw insertError;

                // Cerrar modal y recargar
                bootstrap.Modal.getInstance(document.getElementById('createSlotModal')).hide();
                e.target.reset();

                if (zoomData) {
                    showToast('Slot creado exitosamente con meeting de Zoom.');
                } else {
                    showToast('Slot creado (sin enlace Zoom).', 'warning');
                }

                await loadSlots();

            } catch (err) {
                console.error('Error creando slot:', err);
                showToast(err.message || 'Error al crear el slot', 'danger');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // --- TAB DE CLASES PASADAS: cargar al hacer clic ---
    const pastTab = document.getElementById('past-tab');
    if (pastTab) {
        pastTab.addEventListener('shown.bs.tab', () => {
            loadPastSlots();
        });
    }

    // --- REALTIME: Auto-refresh cuando cambian los slots ---
    const slotsChannel = supabase
        .channel('admin-slots-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'consulta_slots' }, () => {
            console.log('Cambio detectado en consulta_slots, recargando...');
            loadSlots();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultas_reservas' }, () => {
            console.log('Nueva reserva detectada, recargando slots...');
            loadSlots();
        })
        .subscribe();

    // --- INIT ---
    await loadSlots();
});