// js/gestorCursos.js - Lógica para el Gestor de Cursos (Módulos/Clases)

document.addEventListener('DOMContentLoaded', () => {
    const addModuleBtn = document.getElementById('add-module-btn');
    const moduleModal = document.getElementById('module-modal');
    const cancelModuleBtn = document.getElementById('cancel-module-btn');
    const saveModuleBtn = document.getElementById('save-module-btn');
    const moduleNameInput = document.getElementById('module-name-input');
    const moduleFormTitle = document.getElementById('module-form-title');
    const moduleList = document.getElementById('module-list');

    let isEditing = false;
    let currentModuleId = null;

    // Función para abrir el modal (Escenario 1)
    if (addModuleBtn) {
        addModuleBtn.addEventListener('click', () => {
            isEditing = false;
            currentModuleId = null;
            moduleFormTitle.textContent = 'Nombre del módulo'; // Texto por defecto
            saveModuleBtn.textContent = 'Crear'; // Acción de crear
            moduleNameInput.value = '';
            moduleModal.classList.add('visible');
            moduleNameInput.focus();
        });
    }

    // Función para cerrar el modal
    function closeModal() {
        moduleModal.classList.remove('visible');
    }

    // Listener para el botón Cancelar
    if (cancelModuleBtn) {
        cancelModuleBtn.addEventListener('click', closeModal);
    }

    // Lógica para guardar/actualizar módulo (Escenario 1 y 2)
    if (saveModuleBtn) {
        saveModuleBtn.addEventListener('click', () => {
            const moduleName = moduleNameInput.value.trim();
            if (!moduleName) {
                alert("Por favor, introduce un nombre para el módulo.");
                return;
            }

            if (isEditing) {
                // Lógica de Edición (Escenario 2)
                const moduleItem = moduleList.querySelector(`.module-item[data-module-id="${currentModuleId}"]`);
                if (moduleItem) {
                    moduleItem.querySelector('.module-title').textContent = moduleName;
                    
                    // Lógica para redirigir/guardar datos a otra vista (Esperado 2)
                    console.log(`Módulo ID ${currentModuleId} actualizado a: ${moduleName}. Redirección/Guardado a vista de edición de clases.`);
                    // En un entorno real, aquí se haría un AJAX y se redirigiría o recargaría la lista.
                }

            } else {
                // Lógica de Creación (Escenario 1)
                const newId = Date.now(); // Generar un ID único (temporal)
                const newModuleHTML = `
                    <div class="module-item" data-module-id="${newId}">
                        <span class="module-title">${moduleName}</span>
                        <div class="module-actions">
                            <i class="fas fa-pen-square edit-icon" data-action="edit"></i>
                            <i class="fas fa-trash-alt delete-icon" data-action="delete"></i>
                            <i class="fas fa-grip-vertical reorder-icon"></i>
                        </div>
                    </div>
                `;
                moduleList.insertAdjacentHTML('beforeend', newModuleHTML);

                // Lógica para redirigir/guardar datos a otra vista (Esperado 1)
                console.log(`Módulo creado: ${moduleName}. Redirección/Guardado a vista de edición de clases con ID: ${newId}.`);
                // En un entorno real, aquí se haría un AJAX para crear el módulo y se navegaría a la siguiente vista (Escenario 3)
            }
            
            closeModal();
        });
    }

    // Listener para los iconos de la lista de módulos (Escenario 2 y 4)
    if (moduleList) {
        moduleList.addEventListener('click', (e) => {
            const target = e.target;
            const moduleItem = target.closest('.module-item');
            if (!moduleItem) return;

            const moduleId = moduleItem.getAttribute('data-module-id');

            if (target.getAttribute('data-action') === 'edit') {
                // Escenario 2: Edición del Módulo
                isEditing = true;
                currentModuleId = moduleId;
                const moduleTitle = moduleItem.querySelector('.module-title').textContent;
                
                moduleFormTitle.textContent = `Editar: ${moduleTitle}`;
                saveModuleBtn.textContent = 'Guardar';
                moduleNameInput.value = moduleTitle;
                
                moduleModal.classList.add('visible');
                moduleNameInput.focus();

            } else if (target.getAttribute('data-action') === 'delete') {
                // Lógica de Eliminación (Escenario 4)
                if (confirm(`¿Estás seguro de que quieres eliminar el módulo "${moduleItem.querySelector('.module-title').textContent}"?`)) {
                    moduleItem.remove();
                    console.log(`Módulo ID ${moduleId} eliminado. (Escenario 4)`);
                }
            }
            // La lógica de reordenamiento (Escenario 4) requeriría una librería como SortableJS
            // y una persistencia en el backend. Aquí solo se da la apariencia con el cursor 'grab'.
        });
    }
});
