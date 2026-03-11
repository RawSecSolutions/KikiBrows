/**
 * js/consultasAlumn.js
 * Portal de Consultas - Alumnas
 * Conectado directamente con la base de datos Supabase
 */

import { CursosService } from './cursosService.js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUserId = null;
let selectedSlotId = null;
let slotsDisponibles = []; // Caché local de los slots
let confirmModal = null;
let successModal = null;

document.addEventListener('DOMContentLoaded', async () => {

    // Inicializar UI (Navbar)
    if (typeof UI !== 'undefined' && UI.initNavbar) {
        UI.initNavbar();
    }

    // Inicializar Modales de Bootstrap
    const confirmModalEl = document.getElementById('confirmReservationModal');
    const successModalEl = document.getElementById('successModal');
    
    if (confirmModalEl) confirmModal = new bootstrap.Modal(confirmModalEl);
    if (successModalEl) successModal = new bootstrap.Modal(successModalEl);

    // Configurar listener del botón de confirmación
    const btnConfirm = document.getElementById('btn-confirm-reservation');
    if (btnConfirm) {
        btnConfirm.addEventListener('click', handleConfirmReservation);
    }

    // Cargar datos
    await initData();
});

async function initData() {
    // 1. Obtener usuario autenticado
    const { user } = await CursosService.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUserId = user.id;

    // 2. Cargar los cursos reales del alumno en el desplegable
    await loadUserCourses();

    // 3. Cargar horarios disponibles en pantalla
    await loadSlots();

    // 4. Suscribirse a cambios en tiempo real para actualizar cupos automáticamente
    supabase
        .channel('student-slots-changes')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'consulta_slots' }, () => {
            loadSlots();
        })
        .subscribe();
}

// --- HELPERS DE FECHA Y DISEÑO ---

function formatShortDate(dateObj) {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[dateObj.getDay()]} ${dateObj.getDate()} ${meses[dateObj.getMonth()]}`;
}

function formatFullDate(dateObj) {
    const dia = String(dateObj.getDate()).padStart(2, '0');
    const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
    const año = dateObj.getFullYear();
    return `${dia}/${mes}/${año}`;
}

function formatTime(dateObj) {
    return dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function getAvailabilityBadge(slot) {
    const cuposLibres = slot.cupos_maximos - slot.cupos_ocupados;

    if (cuposLibres <= 0) {
        return '<span class="availability-badge bg-danger text-white">Lleno</span>';
    } else if (cuposLibres <= 2 && slot.cupos_maximos > 2) {
        return `<span class="availability-badge bg-warning text-dark">Últimos ${cuposLibres} cupos</span>`;
    } else {
        return `<span class="availability-badge bg-success text-white">${cuposLibres} cupos disponibles</span>`;
    }
}

function isSlotAvailable(slot) {
    return slot.cupos_ocupados < slot.cupos_maximos && slot.estado === 'DISPONIBLE';
}

// --- RENDERIZAR DATOS ---

/**
 * Carga los cursos que el alumno ha adquirido y los pone en el select
 */
async function loadUserCourses() {
    const select = document.getElementById('select-course');
    if (!select) return;

    const { success, data: cursos } = await CursosService.getCursosAdquiridos(currentUserId);
    
    select.innerHTML = '<option value="">Selecciona un curso</option>';
    
    if (success && cursos && cursos.length > 0) {
        cursos.forEach(curso => {
            select.innerHTML += `<option value="${curso.id}">${curso.nombre}</option>`;
        });
    }
    // Siempre dejamos la opción general al final
    select.innerHTML += `<option value="general">Consulta General / Otro</option>`;
}

/**
 * Carga los slots desde la base de datos y los pinta en el HTML
 */
async function loadSlots() {
    const container = document.getElementById('slots-container');
    const emptyState = document.getElementById('empty-state');
    
    if (!container || !emptyState) return;

    // Estado de carga
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border" style="color: var(--primary-color);" role="status"></div>
            <h5 class="text-muted mt-3">Buscando horarios disponibles...</h5>
        </div>
    `;
    emptyState.classList.add('d-none');
    container.classList.remove('d-none');
    
    // Obtener datos de Supabase
    const { success, data: slots } = await CursosService.getSlotsDisponibles();

    if (!success || !slots || slots.length === 0) {
        container.classList.add('d-none');
        emptyState.classList.remove('d-none');
        return;
    }

    // Guardar en caché para usar al abrir el modal
    slotsDisponibles = slots;

    // Limpiar contenedor
    container.innerHTML = '';

    // Filtrar solo los que aún tienen cupo (por seguridad adicional)
    const availableSlots = slots.filter(s => isSlotAvailable(s));

    if (availableSlots.length === 0) {
        container.classList.add('d-none');
        emptyState.classList.remove('d-none');
        return;
    }

    // Dibujar cada tarjeta manteniendo tu diseño exacto
    availableSlots.forEach(slot => {
        const fechaInicio = new Date(slot.fecha_inicio);
        const fechaFin = new Date(slot.fecha_fin);
        
        const fechaCorta = formatShortDate(fechaInicio);
        const horaInicioStr = formatTime(fechaInicio);
        const horaFinStr = formatTime(fechaFin);

        container.innerHTML += `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="consultation-card p-4">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <div class="date-badge mb-2">
                                <i class="far fa-calendar-alt me-2"></i>${fechaCorta}
                            </div>
                            <div class="time-slot mt-2">
                                <i class="far fa-clock me-2"></i>${horaInicioStr} - ${horaFinStr}
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        ${getAvailabilityBadge(slot)}
                    </div>

                    <div class="d-flex align-items-center justify-content-between">
                        <div class="text-muted small">
                            <i class="fas fa-users me-1"></i>
                            ${slot.cupos_ocupados}/${slot.cupos_maximos} reservados
                        </div>
                        <button
                            class="btn btn-reserve btn-sm"
                            onclick="window.selectSlot('${slot.id}')">
                            Reservar
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

// --- ACCIONES ---

/**
 * Función global para seleccionar un slot y abrir el modal
 */
window.selectSlot = function(slotId) {
    const slot = slotsDisponibles.find(s => s.id === slotId);
    if (!slot) return;

    selectedSlotId = slot.id;

    const fechaInicio = new Date(slot.fecha_inicio);
    const fechaFin = new Date(slot.fecha_fin);

    document.getElementById('confirm-date').textContent = formatFullDate(fechaInicio);
    document.getElementById('confirm-time').textContent = `${formatTime(fechaInicio)} - ${formatTime(fechaFin)}`;
    
    // Resetear el select de curso por si ya había abierto el modal antes
    document.getElementById('select-course').selectedIndex = 0;

    confirmModal.show();
};

/**
 * Procesa la reserva al darle a "Confirmar"
 */
async function handleConfirmReservation() {
    const select = document.getElementById('select-course');
    const cursoId = select.value;
    const cursoNombre = select.options[select.selectedIndex].text;

    // Validación
    if (!cursoId) {
        alert('Por favor selecciona el curso sobre el cual deseas consultar.');
        return;
    }

    if (!selectedSlotId) return;

    // Efecto de carga en el botón
    const btn = document.getElementById('btn-confirm-reservation');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Confirmando...';

    // Preparar objeto de envío
    const reservaData = {
        slotId: selectedSlotId,
        usuarioId: currentUserId,
        cursoId: cursoId === 'general' ? null : cursoId,
        cursoNombreSnapshot: cursoNombre
    };

    // Llamada a Supabase
    const result = await CursosService.crearReservaConsulta(reservaData);

    // Restaurar botón
    btn.disabled = false;
    btn.innerHTML = originalText;

    if (result.success) {
        // Enviar email con zoom link (fire-and-forget, no bloquea UI)
        const reservaId = result.data?.id;
        if (reservaId) {
            CursosService.enviarEmailConsulta(reservaId, 'booking');
        }

        confirmModal.hide();
        setTimeout(() => {
            successModal.show();
        }, 300); // Pequeño delay visual para que no choquen las animaciones

        // Recargar los slots para actualizar los cupos en pantalla (ej: si se llenó, desaparecerá)
        await loadSlots();
    } else {
        alert(result.error?.message || 'Error al procesar la reserva. Es posible que el horario ya se haya llenado.');
        confirmModal.hide();
        await loadSlots(); // Recargamos por si los datos estaban desactualizados
    }
}