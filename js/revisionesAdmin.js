// js/revisionesAdmin.js

document.addEventListener('DOMContentLoaded', () => {
    
    const revisionModal = document.getElementById('revisionModal');
    const calificacionDropdown = document.getElementById('calificacionDropdown');
    const feedbackArea = document.getElementById('feedbackArea');
    const revisionForm = document.getElementById('revision-form');

    // 1. VALIDACIÓN FORMULARIO
    if (revisionForm) {
        revisionForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const isRejected = calificacionDropdown.value === 'rechazada';
            
            // Regla: Si se rechaza, el feedback es obligatorio
            if (isRejected && feedbackArea.value.trim() === '') {
                feedbackArea.classList.add('is-invalid'); // Clase Bootstrap para error
                alert('El feedback es obligatorio si rechazas la entrega.');
                return;
            }

            // Éxito
            feedbackArea.classList.remove('is-invalid');
            alert(`Calificación guardada: ${calificacionDropdown.value.toUpperCase()}`);
            
            // Cerrar modal
            const modalInstance = bootstrap.Modal.getInstance(revisionModal);
            modalInstance.hide();
        });
    }

    // Limpiar error al cambiar selección
    if (calificacionDropdown) {
        calificacionDropdown.addEventListener('change', () => {
            feedbackArea.classList.remove('is-invalid');
        });
    }

    // 2. CARGAR DATOS EN EL MODAL (Simulación)
    if (revisionModal) {
        revisionModal.addEventListener('show.bs.modal', (event) => {
            // Botón que abrió el modal
            const button = event.relatedTarget;
            // Datos simulados (en real vendrían de atributos data-* o fetch)
            // Aquí usamos el texto de la fila para simular
            const row = button.closest('.row') || button; // El 'a' tag es la fila en el HTML nuevo
            
            if (row) {
                const curso = row.querySelector('.col-3:nth-child(2)')?.textContent || 'Curso Ejemplo';
                const modulo = row.querySelector('.col-3:nth-child(3)')?.textContent || 'Módulo Ejemplo';
                const fecha = row.querySelector('.col-2:nth-child(4)')?.textContent || '01/01/2025';
                const usuario = row.querySelector('.col-2:nth-child(5)')?.textContent || 'Usuario';
                
                // Llenar modal
                document.getElementById('modal-curso-modulo').textContent = `${curso} - ${modulo}`;
                document.getElementById('modal-usuario').textContent = usuario;
                document.getElementById('modal-fecha').textContent = fecha;
                
                // Resetear form
                revisionForm.reset();
            }
        });
    }

    // 3. PESTAÑAS (TABS)
    const tabButtons = document.querySelectorAll('#tab-pendientes, #tab-finalizadas');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Reset estilos
            tabButtons.forEach(b => {
                b.style.borderBottom = 'none';
                b.classList.add('text-muted');
                b.classList.remove('text-dark');
            });
            
            // Activar actual
            e.target.style.borderBottom = '3px solid #8FA888';
            e.target.classList.remove('text-muted');
            e.target.classList.add('text-dark');
            
            console.log('Filtrando tabla por:', e.target.id);
            // Aquí iría la lógica para ocultar/mostrar filas según estado
        });
    });

});