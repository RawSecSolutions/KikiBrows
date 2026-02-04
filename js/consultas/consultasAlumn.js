// Portal de Consultas - Alumnas
// Conectado directamente con el calendario del admin via API Zoom

document.addEventListener('DOMContentLoaded', () => {

    // --- SIMULACIÓN DE CONEXIÓN CON CALENDARIO ADMIN ---
    // En producción, estos datos vendrían de una API que consulta la misma base de datos
    // que el calendario del admin (adminCalendar.html / calendarAdmin.js)
    let slotsDisponibles = [
        {
            id: 1,
            fecha: '2025-10-12',
            inicio: '10:00',
            fin: '11:00',
            cuposMax: 5,
            cuposOcupados: 2,
            estado: 'available',
            zoomJoin: 'https://zoom.us/j/ejemplo-join-1'
        },
        {
            id: 2,
            fecha: '2025-10-15',
            inicio: '15:00',
            fin: '16:00',
            cuposMax: 10,
            cuposOcupados: 9,
            estado: 'available',
            zoomJoin: 'https://zoom.us/j/ejemplo-join-2'
        },
        {
            id: 3,
            fecha: '2025-10-18',
            inicio: '11:00',
            fin: '12:00',
            cuposMax: 8,
            cuposOcupados: 0,
            estado: 'available',
            zoomJoin: 'https://zoom.us/j/ejemplo-join-3'
        }
    ];

    const slotsContainer = document.getElementById('slots-container');
    const emptyState = document.getElementById('empty-state');
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmReservationModal'));
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));

    let selectedSlot = null;

    // --- HELPERS ---
    function formatDate(dateStr) {
        const parts = dateStr.split('-');
        const fecha = new Date(parts[0], parts[1] - 1, parts[2]);
        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${dias[fecha.getDay()]} ${fecha.getDate()} ${meses[fecha.getMonth()]}`;
    }

    function formatFullDate(dateStr) {
        const parts = dateStr.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function getAvailabilityBadge(slot) {
        const cuposLibres = slot.cuposMax - slot.cuposOcupados;

        if (cuposLibres === 0) {
            return '<span class="availability-badge bg-danger text-white">Lleno</span>';
        } else if (cuposLibres <= 2) {
            return `<span class="availability-badge bg-warning text-dark">Últimos ${cuposLibres} cupos</span>`;
        } else {
            return `<span class="availability-badge bg-success text-white">${cuposLibres} cupos disponibles</span>`;
        }
    }

    function isSlotAvailable(slot) {
        return slot.cuposOcupados < slot.cuposMax;
    }

    // --- RENDERIZAR SLOTS ---
    function renderSlots() {
        // Filtrar solo slots disponibles
        const availableSlots = slotsDisponibles.filter(s => isSlotAvailable(s));

        if (availableSlots.length === 0) {
            slotsContainer.classList.add('d-none');
            emptyState.classList.remove('d-none');
            return;
        }

        slotsContainer.classList.remove('d-none');
        emptyState.classList.add('d-none');

        slotsContainer.innerHTML = availableSlots.map(slot => `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="consultation-card p-4">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <div class="date-badge mb-2">
                                <i class="far fa-calendar-alt me-2"></i>${formatDate(slot.fecha)}
                            </div>
                            <div class="time-slot mt-2">
                                <i class="far fa-clock me-2"></i>${slot.inicio} - ${slot.fin}
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        ${getAvailabilityBadge(slot)}
                    </div>

                    <div class="d-flex align-items-center justify-content-between">
                        <div class="text-muted small">
                            <i class="fas fa-users me-1"></i>
                            ${slot.cuposOcupados}/${slot.cuposMax} reservados
                        </div>
                        <button
                            class="btn btn-reserve btn-sm"
                            onclick="selectSlot(${slot.id})"
                            ${!isSlotAvailable(slot) ? 'disabled' : ''}>
                            ${isSlotAvailable(slot) ? 'Reservar' : 'Lleno'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // --- SELECCIONAR SLOT ---
    window.selectSlot = function(slotId) {
        selectedSlot = slotsDisponibles.find(s => s.id === slotId);
        if (!selectedSlot) return;

        document.getElementById('confirm-date').textContent = formatFullDate(selectedSlot.fecha);
        document.getElementById('confirm-time').textContent = `${selectedSlot.inicio} - ${selectedSlot.fin}`;

        confirmModal.show();
    };

    // --- CONFIRMAR RESERVA ---
    document.getElementById('btn-confirm-reservation').addEventListener('click', () => {
        const curso = document.getElementById('select-course').value;

        if (!curso) {
            alert('Por favor selecciona tu curso');
            return;
        }

        if (!selectedSlot) return;

        // Obtener datos del usuario
        const userName = localStorage.getItem('userName') || 'Alumna';
        const userEmail = localStorage.getItem('userEmail') || 'alumna@example.com';

        // Simular actualización en el calendario admin
        // En producción, esto sería una llamada a la API que actualiza la base de datos compartida
        selectedSlot.cuposOcupados += 1;
        if (selectedSlot.cuposOcupados >= selectedSlot.cuposMax) {
            selectedSlot.estado = 'full';
        }

        // En produccion, aqui se enviaria el correo con el link de Zoom
        // Los datos sensibles no se loguean por seguridad

        // En producción, aquí harías:
        // fetch('/api/reservations', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         slotId: selectedSlot.id,
        //         userName: userName,
        //         userEmail: userEmail,
        //         curso: curso
        //     })
        // });

        // Cerrar modal de confirmación
        confirmModal.hide();

        // Mostrar modal de éxito
        setTimeout(() => {
            successModal.show();
            renderSlots(); // Actualizar vista
        }, 300);

        // Limpiar formulario
        document.getElementById('select-course').value = '';
    });

    // --- INICIALIZAR ---
    UI.initNavbar();
    renderSlots();

    // --- NOTA PARA INTEGRACIÓN CON API ZOOM ---
    // Para integración completa con Zoom API:
    //
    // 1. En el backend, configurar Zoom OAuth o Server-to-Server OAuth
    // 2. Almacenar el Access Token de Zoom en el servidor (NO en el frontend)
    // 3. Cuando el admin crea un slot en adminCalendar.html:
    //    - Hacer POST a tu backend: /api/admin/create-zoom-meeting
    //    - El backend usa Zoom API para crear meeting:
    //      POST https://api.zoom.us/v2/users/me/meetings
    //    - Guardar zoomStart (start_url) y zoomJoin (join_url) en la BD
    //
    // 4. Cuando la alumna reserva aquí:
    //    - Hacer POST a tu backend: /api/reservations/create
    //    - El backend envía email con el join_url
    //    - Actualizar cupos en la BD
    //
    // 5. Ambos calendarios (admin y alumnas) consultan la misma API/BD
    //    - GET /api/slots (para listar slots disponibles)
    //    - GET /api/slots/:id (para ver detalle)
    //
    // Recursos:
    // - Zoom API Docs: https://marketplace.zoom.us/docs/api-reference/zoom-api
    // - Create Meeting: https://marketplace.zoom.us/docs/api-reference/zoom-api/methods/#operation/meetingCreate
});
