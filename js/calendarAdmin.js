// js/calendarAdmin.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DATOS DE EJEMPLO (Simulan una respuesta de API) ---
    const slotsData = [
        { fecha: '12 Oct 2024', horario: '10:00 - 11:00', cupos: '3/5', estado: 'available', link: '#', acciones: true },
        { fecha: '14 Oct 2024', horario: '15:00 - 16:00', cupos: '5/5', estado: 'full', link: '#', acciones: true },
        { fecha: '18 Oct 2024', horario: '11:00 - 12:00', cupos: '0/5', estado: 'cancelled', link: '#', acciones: true },
        { fecha: '20 Oct 2024', horario: '09:00 - 10:00', cupos: '4/4', estado: 'completed', link: '#', acciones: true },
        { fecha: '22 Oct 2024', horario: '16:00 - 17:00', cupos: '1/5', estado: 'available', link: '#', acciones: true },
        { fecha: '23 Oct 2024', horario: '10:00 - 11:00', cupos: '2/5', estado: 'available', link: '#', acciones: true },
        { fecha: '24 Oct 2024', horario: '15:00 - 16:00', cupos: '5/5', estado: 'full', link: '#', acciones: true },
        { fecha: '25 Oct 2024', horario: '11:00 - 12:00', cupos: '0/5', estado: 'cancelled', link: '#', acciones: true },
        { fecha: '26 Oct 2024', horario: '09:00 - 10:00', cupos: '3/4', estado: 'available', link: '#', acciones: true },
        { fecha: '27 Oct 2024', horario: '16:00 - 17:00', cupos: '1/5', estado: 'available', link: '#', acciones: true },
        { fecha: '28 Oct 2024', horario: '10:00 - 11:00', cupos: '4/5', estado: 'available', link: '#', acciones: true },
        { fecha: '29 Oct 2024', horario: '15:00 - 16:00', cupos: '5/5', estado: 'full', link: '#', acciones: true },
    ];

    const tableContainer = document.getElementById('calendar-table-container');
    const totalResultsSpan = document.getElementById('total-results');
    
    if (totalResultsSpan) {
         totalResultsSpan.textContent = slotsData.length;
    }


    // --- 2. FUNCIONES DE RENDERIZADO ---

    function getStatusBadge(estado) {
        let text = estado.charAt(0).toUpperCase() + estado.slice(1);
        if (estado === 'available') text = 'Disponible';
        if (estado === 'full') text = 'Lleno';
        if (estado === 'cancelled') text = 'Cancelada';
        if (estado === 'completed') text = 'Completa';
        
        return `<span class="status-badge ${estado}">${text}</span>`;
    }

    function renderTable(data) {
        let tableHTML = `
            <table class="table calendar-table">
                <thead>
                    <tr>
                        <th>FECHA</th>
                        <th>HORARIO</th>
                        <th>CUPOS</th>
                        <th>ESTADO</th>
                        <th>LINK ZOOM</th>
                        <th>ACCIONES</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach((slot, index) => {
            tableHTML += `
                <tr data-slot-id="${index + 1}">
                    <td>${slot.fecha}</td>
                    <td>${slot.horario}</td>
                    <td>${slot.cupos}</td>
                    <td>${getStatusBadge(slot.estado)}</td>
                    <td><a href="${slot.link}" target="_blank">Zoom</a></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-icon btn-edit" title="Editar Slot" data-action="edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-icon btn-delete" title="Eliminar Slot" data-action="delete" data-bs-toggle="modal" data-bs-target="#deleteSlotModal" data-slot-id="${index + 1}">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                            <div class="dropdown">
                                <button class="btn btn-icon btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="Más Acciones">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end" data-slot-id="${index + 1}">
                                    <li><button class="dropdown-item" data-action="edit">Editar Clase</button></li>
                                    <li><button class="dropdown-item" data-action="cancel">Cancelar Clase</button></li>
                                    <li><button class="dropdown-item" data-action="zoom">Ver en Zoom</button></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><button class="dropdown-item text-danger" data-bs-toggle="modal" data-bs-target="#deleteSlotModal" data-slot-id="${index + 1}">Eliminar Slot</button></li>
                                </ul>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;
        
        if (tableContainer) {
            tableContainer.innerHTML = tableHTML;
        }
    }

    // Renderizar la tabla inicial
    renderTable(slotsData);


    // --- 3. LÓGICA DE INTERACCIÓN ---

    // a) Modal de Creación/Edición (ESCENARIO 1)
    const addSlotBtn = document.getElementById('add-slot-btn');
    const createSlotModalElement = document.getElementById('createSlotModal');
    const createSlotModal = new bootstrap.Modal(createSlotModalElement);
    const saveSlotBtn = document.getElementById('save-slot-btn');

    if (addSlotBtn) {
         addSlotBtn.addEventListener('click', () => {
             createSlotModal.show();
             
             // Focus inicial, simulando la UX
             setTimeout(() => {
                 document.getElementById('slot-date').focus();
             }, 300);
         });
    }
    
    if (saveSlotBtn) {
        saveSlotBtn.addEventListener('click', (e) => {
             e.preventDefault();
             
             // Captura de datos
             const date = document.getElementById('slot-date').value;
             const startTime = document.getElementById('start-time').value;
             const endTime = document.getElementById('end-time').value;
             const maxCupos = document.getElementById('max-slots').value;
             
             if (!date || !startTime || !endTime || !maxCupos) {
                 alert('Por favor, rellena todos los campos.');
                 return;
             }
             
             // Lógica de Guardado Simulada
             console.log('Datos a guardar:', { date, startTime, endTime, maxCupos });
             alert(`Slot guardado! Se inició la integración con Zoom para: ${date} de ${startTime} a ${endTime}`);
             
             createSlotModal.hide();
             
             // Limpiar el formulario
             document.getElementById('create-slot-form').reset();
        });
    }

    // b) Modal de Confirmación de Eliminación (ESCENARIO 4)
    const deleteModal = document.getElementById('deleteSlotModal');
    if (deleteModal) {
        deleteModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const slotId = button.getAttribute('data-slot-id') || button.closest('ul')?.getAttribute('data-slot-id');
            
            const confirmButton = this.querySelector('.btn-confirm-delete');
            confirmButton.dataset.slotIdToDelete = slotId;
        });

        const confirmButton = deleteModal.querySelector('.btn-confirm-delete');
        if (confirmButton) {
            confirmButton.addEventListener('click', () => {
                const slotId = confirmButton.dataset.slotIdToDelete;
                
                // Lógica de eliminación simulada
                console.log(`Eliminando slot con ID: ${slotId}...`);
                alert(`Slot ${slotId} eliminado y marcado como CANCELADO (simulado).`);
                
                // Cerrar el modal
                const modalInstance = bootstrap.Modal.getInstance(deleteModal);
                modalInstance.hide();
            });
        }
    }
    
    // c) Delegación de eventos para las acciones de la tabla
    tableContainer.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (target) {
            const action = target.getAttribute('data-action');
            const slotRow = target.closest('tr');
            const slotId = slotRow ? slotRow.dataset.slotId : target.closest('ul')?.dataset.slotId;
            
            if (!slotId) return;

            switch (action) {
                case 'edit':
                    alert(`Simulación de Edición para Slot ID: ${slotId}`);
                    // En un entorno real, abrirías el modal de creación, pero con datos cargados
                    break;
                case 'cancel':
                    alert(`Simulación de Cancelación para Slot ID: ${slotId}`);
                    break;
                case 'zoom':
                    alert(`Abriendo link de Zoom para Slot ID: ${slotId}`);
                    break;
            }
        }
    });

});
