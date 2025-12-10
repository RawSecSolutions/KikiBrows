// js/revisionesAdmin.js

document.addEventListener('DOMContentLoaded', () => {
    
    const revisionModal = document.getElementById('revisionModal');
    const calificacionDropdown = document.getElementById('calificacionDropdown');
    const feedbackArea = document.getElementById('feedbackArea');
    const revisionForm = document.getElementById('revision-form');
    const historicoSection = document.getElementById('historico-revision');
    const btnEditarRevision = document.getElementById('btn-editar-revision');
    const btnSubmitRevision = document.getElementById('btn-submit-revision');


    // 1. LÓGICA DE VALIDACIÓN (Escenario 6: Feedback obligatorio al rechazar)
    function validateForm(event) {
        // Validación obligatoria
        const isRejected = calificacionDropdown.value === 'rechazada';
        
        if (isRejected && feedbackArea.value.trim() === '') {
            event.preventDefault(); // Evita el envío del formulario
            feedbackArea.classList.add('is-invalid');
            // Muestra una alerta (Se recomienda usar un Toast o Alert global para mejor UX)
            alert('¡Atención! El feedback es obligatorio al rechazar una entrega.'); 
            return false;
        }

        feedbackArea.classList.remove('is-invalid');
        // Si la validación pasa, simular el envío
        if (event.type === 'submit') {
            event.preventDefault();
            alert(`¡Éxito! Calificación enviada como: ${calificacionDropdown.value}. El alumno recibirá un email.`);
            // Aquí se cerraría el modal y se recargaría la tabla
            const modalInstance = bootstrap.Modal.getInstance(revisionModal);
            modalInstance.hide();
        }
        return true;
    }

    // Listener para el cambio en el Dropdown
    calificacionDropdown.addEventListener('change', () => {
        // Limpia el error visual al cambiar la opción
        feedbackArea.classList.remove('is-invalid'); 
    });

    // Listener para el envío del formulario
    revisionForm.addEventListener('submit', validateForm);

    
    // 2. LÓGICA DEL MODAL DE REVISIÓN (Escenarios 1, 4, 7)
    revisionModal.addEventListener('show.bs.modal', (event) => {
        const button = event.relatedTarget;
        const estado = button.getAttribute('data-estado'); 
        
        // Mock data para llenar el modal
        const mockData = {
            'pendiente': {
                curso: "Microblading Avanzado", 
                modulo: "Entrega Práctica: Diseño", 
                usuario: "Ana García", 
                fecha: "01/08/2025",
                calificada: false,
            },
            'aprobada': {
                curso: "Lifting de Pestañas", 
                modulo: "Evaluación Final", 
                usuario: "Javier Soto", 
                fecha: "28/07/2025",
                calificada: true,
                historicoCal: "Aprobada",
                historicoFeed: "Excelente manejo de la técnica y proporciones."
            },
            'rechazada': {
                curso: "Piel y Pigmentos", 
                modulo: "Entrega Práctica: Color", 
                usuario: "Laura Pérez", 
                fecha: "01/08/2025",
                calificada: true,
                historicoCal: "Rechazada",
                historicoFeed: "El tono del pigmento es incorrecto. Revisar lección 3. Por favor, reenviar."
            }
        };

        const data = mockData[estado];

        // Llenar información general
        document.getElementById('modal-curso-modulo').textContent = `${data.curso} - ${data.modulo}`;
        document.getElementById('modal-usuario').textContent = data.usuario;
        document.getElementById('modal-fecha').textContent = data.fecha;
        document.getElementById('modal-puntos').textContent = '5'; // Valor fijo

        // Resetear campos del formulario
        feedbackArea.value = '';
        calificacionDropdown.value = '';
        feedbackArea.classList.remove('is-invalid'); 
        
        // Manejo del estado 'Ya Calificada' (Escenario 7)
        if (data.calificada) {
            historicoSection.classList.remove('d-none');
            document.getElementById('historico-calificacion').textContent = `Estado: ${data.historicoCal}`;
            document.getElementById('historico-feedback').textContent = `Feedback: "${data.historicoFeed}"`;
            
            // Modo Solo Lectura (Por defecto)
            feedbackArea.setAttribute('readonly', true);
            calificacionDropdown.setAttribute('disabled', true);
            btnSubmitRevision.classList.add('d-none'); // Ocultar botón de calificación

            // Pre-llenar el formulario con los datos históricos para un posible "Editar"
            feedbackArea.value = data.historicoFeed;
            calificacionDropdown.value = data.historicoCal.toLowerCase();
            
        } else {
            // Modo Calificación (Para Pendientes)
            historicoSection.classList.add('d-none');
            feedbackArea.removeAttribute('readonly');
            calificacionDropdown.removeAttribute('disabled');
            btnSubmitRevision.classList.remove('d-none');
        }
    });
    
    // Listener para el botón "Editar y Recalificar" (Escenario 7)
    btnEditarRevision.addEventListener('click', () => {
        feedbackArea.removeAttribute('readonly');
        calificacionDropdown.removeAttribute('disabled');
        btnSubmitRevision.classList.remove('d-none'); // Mostrar botón de Calificar
        historicoSection.classList.add('d-none'); // Ocultar histórico
        
        alert('Modo edición activado. Ya puede modificar la calificación.');
    });


    // 3. LÓGICA DE TABS (Pendientes vs Finalizadas)
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover 'active' de todos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Agregar 'active' al clickeado
            this.classList.add('active');
            
            // (Aquí iría la lógica AJAX para cargar los datos de la tabla)
            const tabName = this.getAttribute('data-tab');
            console.log(`Cambiando a la vista: ${tabName}`);
            
            // Simulación visual: si estás en 'finalizadas', el botón de 'editar' debería cambiar a 'visualizar' o el badge cambia, pero ya lo manejamos con el atributo data-estado.
        });
    });

});
