document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN ZOOM API ---
    // Cargar configuración guardada
    function loadZoomConfig() {
        const token = localStorage.getItem('zoomAccessToken');
        const userId = localStorage.getItem('zoomUserId') || 'me';

        if (token) {
            document.getElementById('zoom-access-token').value = token;
        }
        if (userId) {
            document.getElementById('zoom-user-id').value = userId;
        }

        return { token, userId };
    }

    // Guardar configuración
    document.getElementById('btn-save-zoom-config').addEventListener('click', () => {
        const token = document.getElementById('zoom-access-token').value.trim();
        const userId = document.getElementById('zoom-user-id').value.trim() || 'me';
        const statusDiv = document.getElementById('zoom-status');

        if (!token) {
            statusDiv.className = 'alert alert-warning';
            statusDiv.textContent = 'Por favor ingresa un Access Token válido';
            statusDiv.classList.remove('d-none');
            return;
        }

        // Guardar en localStorage (en producción esto debería estar en el backend)
        localStorage.setItem('zoomAccessToken', token);
        localStorage.setItem('zoomUserId', userId);

        statusDiv.className = 'alert alert-success';
        statusDiv.textContent = '✓ Configuración guardada exitosamente';
        statusDiv.classList.remove('d-none');

        showToast('Configuración de Zoom guardada exitosamente');

        setTimeout(() => {
            bootstrap.Modal.getInstance(document.getElementById('zoomConfigModal')).hide();
        }, 1500);
    });

    // Cargar configuración al iniciar
    loadZoomConfig();

    // --- BASE DE DATOS LOCAL SIMULADA ---
    let slotsDB = [
        { 
            id: 1, 
            fecha: '2025-10-12', 
            inicio: '10:00', 
            fin: '11:00', 
            cuposMax: 5, 
            cuposOcupados: 2, 
            estado: 'available', 
            zoomStart: 'https://zoom.us/s/ejemplo-start', // Link para el Admin
            zoomJoin: 'https://zoom.us/j/ejemplo-join',   // Link para la Alumna
            reservas: [
                { nombre: "Ana García", email: "ana@mail.com", curso: "Microblading" },
                { nombre: "Luisa Lane", email: "luisa@mail.com", curso: "Lifting" }
            ]
        },
        { 
            id: 2, 
            fecha: '2025-10-15', 
            inicio: '15:00', 
            fin: '16:00', 
            cuposMax: 10, 
            cuposOcupados: 0, 
            estado: 'available', 
            zoomStart: 'https://zoom.us/s/ejemplo-start-2',
            zoomJoin: 'https://zoom.us/j/ejemplo-join-2',
            reservas: []
        }
    ];

    const tableContainer = document.getElementById('calendar-table-container');
    const totalResultsSpan = document.getElementById('total-results');
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toast-message');
    const toast = new bootstrap.Toast(toastEl);

    // Helpers
    function showToast(msg) {
        toastBody.textContent = msg;
        toast.show();
    }

    function formatDate(dateStr) {
        // Truco para evitar problemas de zona horaria al formatear
        const parts = dateStr.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function getBadge(estado) {
        if(estado === 'available') return '<span class="badge bg-success rounded-pill">Disponible</span>';
        if(estado === 'full') return '<span class="badge bg-warning text-dark rounded-pill">Lleno</span>';
        return '<span class="badge bg-secondary rounded-pill">Cerrado</span>';
    }

    // --- RENDERIZAR TABLA ---
    function renderTable() {
        if(totalResultsSpan) totalResultsSpan.textContent = slotsDB.length;

        if (slotsDB.length === 0) {
            tableContainer.innerHTML = '<div class="text-center p-5 text-muted">No hay slots creados.</div>';
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

        slotsDB.forEach(slot => {
            html += `
                <tr data-id="${slot.id}">
                    <td class="fw-bold">${formatDate(slot.fecha)}</td>
                    <td>${slot.inicio} - ${slot.fin}</td>
                    <td>${slot.cuposOcupados}/${slot.cuposMax}</td>
                    <td>${getBadge(slot.estado)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-icon me-1" title="Ver Detalles y Links" data-action="view">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-icon" title="Eliminar" data-action="delete">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        tableContainer.innerHTML = html;
    }

    // --- ACCIONES DE TABLA ---
    tableContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const id = parseInt(btn.closest('tr').dataset.id);
        const slot = slotsDB.find(s => s.id === id);

        if (btn.dataset.action === 'delete') {
            if (slot.cuposOcupados > 0) {
                if(!confirm(`¡OJO! Hay ${slot.cuposOcupados} alumnas inscritas.\nSi borras esto, el sistema les enviará un correo de cancelación.\n¿Confirmas?`)) return;
                showToast('Slot borrado y correos de cancelación enviados.');
            } else {
                if(!confirm('¿Borrar este slot vacío?')) return;
                showToast('Slot eliminado.');
            }
            slotsDB = slotsDB.filter(s => s.id !== id);
            renderTable();
        }

        if (btn.dataset.action === 'view') {
            openDetailModal(slot);
        }
    });

    // --- MODAL DETALLE (La parte clave para ver los links) ---
    const viewModal = new bootstrap.Modal(document.getElementById('viewSlotModal'));

    function openDetailModal(slot) {
        document.getElementById('detail-date').textContent = formatDate(slot.fecha);
        document.getElementById('detail-time').textContent = `${slot.inicio} - ${slot.fin}`;
        document.getElementById('detail-cupos').textContent = `${slot.cuposOcupados}/${slot.cuposMax}`;
        document.getElementById('detail-badge').innerHTML = getBadge(slot.estado);
        
        // Barra progreso
        const percent = (slot.cuposOcupados / slot.cuposMax) * 100;
        document.getElementById('detail-progress').style.width = `${percent}%`;

        // Botones links
        document.getElementById('btn-join-now').href = slot.zoomStart;

        // Configurar botones de copiado (Clonamos para limpiar eventos previos)
        const btnAdmin = document.getElementById('btn-copy-admin');
        const btnStudent = document.getElementById('btn-copy-student');
        
        const newBtnAdmin = btnAdmin.cloneNode(true);
        const newBtnStudent = btnStudent.cloneNode(true);
        
        btnAdmin.parentNode.replaceChild(newBtnAdmin, btnAdmin);
        btnStudent.parentNode.replaceChild(newBtnStudent, btnStudent);

        newBtnAdmin.addEventListener('click', () => {
            navigator.clipboard.writeText(slot.zoomStart);
            showToast('Link de HOST (Tu link) copiado.');
        });

        newBtnStudent.addEventListener('click', () => {
            navigator.clipboard.writeText(slot.zoomJoin);
            showToast('Link de ALUMNA (Para compartir) copiado.');
        });

        // Llenar lista alumnas
        const listBody = document.getElementById('detail-students-list');
        const noMsg = document.getElementById('no-students-msg');
        listBody.innerHTML = '';

        if (slot.reservas.length === 0) {
            noMsg.classList.remove('d-none');
        } else {
            noMsg.classList.add('d-none');
            slot.reservas.forEach(r => {
                listBody.innerHTML += `
                    <tr>
                        <td class="fw-bold">${r.nombre}</td>
                        <td class="text-muted small">${r.email}</td>
                        <td><span class="badge bg-light text-dark border">${r.curso}</span></td>
                    </tr>
                `;
            });
        }
        viewModal.show();
    }

    // --- CREAR SLOT ---
    document.getElementById('create-slot-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const fecha = document.getElementById('slot-date').value;
        const inicio = document.getElementById('start-time').value;
        const fin = document.getElementById('end-time').value;

        if(inicio >= fin) {
            alert('La hora de fin debe ser después del inicio.');
            return;
        }

        // Obtener configuración de Zoom
        const zoomConfig = loadZoomConfig();

        // --- INTEGRACIÓN CON ZOOM API (EJEMPLO) ---
        // Si tienes configurado el token de Zoom, aquí harías la llamada a la API
        let zoomStart = `https://zoom.us/s/${Date.now()}?role=host`;
        let zoomJoin = `https://zoom.us/j/${Date.now()}`;

        if (zoomConfig.token) {
            // En producción, esto sería una llamada a tu backend que usa Zoom API
            /*
            try {
                const response = await fetch('/api/zoom/create-meeting', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${zoomConfig.token}`
                    },
                    body: JSON.stringify({
                        topic: `Consulta ${fecha} ${inicio}-${fin}`,
                        type: 2, // Scheduled meeting
                        start_time: `${fecha}T${inicio}:00`,
                        duration: calculateDuration(inicio, fin),
                        timezone: 'America/Mexico_City',
                        settings: {
                            host_video: true,
                            participant_video: true,
                            join_before_host: false,
                            mute_upon_entry: true
                        }
                    })
                });

                const data = await response.json();
                zoomStart = data.start_url; // Link para el host
                zoomJoin = data.join_url;   // Link para participantes

                console.log('✓ Meeting de Zoom creado exitosamente');
                console.log('Meeting ID:', data.id);
            } catch (error) {
                console.error('Error al crear meeting de Zoom:', error);
                showToast('Advertencia: No se pudo crear el meeting de Zoom automáticamente');
            }
            */

            console.log('📝 Token de Zoom configurado. En producción, aquí se crearía el meeting automáticamente.');
        }

        const newSlot = {
            id: Date.now(),
            fecha: fecha,
            inicio: inicio,
            fin: fin,
            cuposMax: parseInt(document.getElementById('max-slots').value),
            cuposOcupados: 0,
            estado: 'available',
            zoomStart: zoomStart,
            zoomJoin: zoomJoin,
            reservas: []
        };

        slotsDB.push(newSlot);
        renderTable();
        bootstrap.Modal.getInstance(document.getElementById('createSlotModal')).hide();
        e.target.reset();
        showToast('Slot creado exitosamente.');
    });

    renderTable();
});