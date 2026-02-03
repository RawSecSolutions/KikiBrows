// js/creaCurso.js - Lógica para Creación de Curso

import { AdminCursosService } from './adminCursosService.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // === ELEMENTOS ===
    const courseForm = document.getElementById('courseCreationForm');

    // Campos del formulario
    const courseStatus = document.getElementById('courseStatus');

    // Imagen
    const imageInput = document.getElementById('courseImage');
    const btnAddImage = document.getElementById('btnAddImage');
    const imageUploadedDisplay = document.getElementById('imageUploadedDisplay');
    const imageFileName = document.getElementById('imageFileName');
    const changeImage = document.getElementById('changeImage');
    const deleteImage = document.getElementById('deleteImage');
    const imageAlert = document.getElementById('imageAlert');
    const imageAlertText = document.getElementById('imageAlertText');
    
    // Carrusel
    const showInCarousel = document.getElementById('showInCarousel');
    const carouselPosition = document.getElementById('carouselPosition');
    
    // Módulos
    const modulosContainer = document.getElementById('modulosContainer');
    const addModuloBtn = document.getElementById('addModuloBtn');
    const moduleNameModalEl = document.getElementById('moduleNameModal');
    const moduleNameModal = moduleNameModalEl ? new bootstrap.Modal(moduleNameModalEl) : null;
    const moduleNameInput = document.getElementById('moduleNameInput');
    const saveModuleName = document.getElementById('saveModuleName');
    
    // Modales de confirmación
    const deleteImageModalEl = document.getElementById('deleteImageModal');
    const deleteImageModal = deleteImageModalEl ? new bootstrap.Modal(deleteImageModalEl) : null;
    const confirmDeleteImage = document.getElementById('confirmDeleteImage');

    // Modal de confirmación para eliminar módulo
    const deleteModuloModalEl = document.getElementById('deleteModuloModal');
    const deleteModuloModal = deleteModuloModalEl ? new bootstrap.Modal(deleteModuloModalEl) : null;
    const confirmDeleteModulo = document.getElementById('confirmDeleteModulo');
    let moduloToDelete = null;
    
    let moduleCounter = 0;
    
    // === LÓGICA DE IMAGEN ===
    
    if (btnAddImage) {
        btnAddImage.addEventListener('click', () => imageInput.click());
    }
    if (changeImage) {
        changeImage.addEventListener('click', () => imageInput.click());
    }
    
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
            const maxSize = 2 * 1024 * 1024;
            
            imageAlert.classList.add('d-none');
            
            if (!allowedTypes.includes(file.type)) {
                imageAlertText.textContent = 'Formato no válido. Solo PNG, JPG, WEBP.';
                imageAlert.classList.remove('d-none');
                this.value = '';
                return;
            }
            
            if (file.size > maxSize) {
                imageAlertText.textContent = 'La imagen supera el tamaño máximo de 2MB.';
                imageAlert.classList.remove('d-none');
                this.value = '';
                return;
            }
            
            imageFileName.textContent = file.name;
            btnAddImage.classList.add('d-none');
            imageUploadedDisplay.classList.remove('d-none');
        });
    }
    
    if (deleteImage) {
        deleteImage.addEventListener('click', () => deleteImageModal.show());
    }
    
    if (confirmDeleteImage) {
        confirmDeleteImage.addEventListener('click', () => {
            imageInput.value = '';
            imageUploadedDisplay.classList.add('d-none');
            btnAddImage.classList.remove('d-none');
            deleteImageModal.hide();
        });
    }
    
    // === LÓGICA DE CARRUSEL ===
    
    if (showInCarousel) {
        showInCarousel.addEventListener('change', function() {
            carouselPosition.disabled = !this.checked;
            if (!this.checked) carouselPosition.value = '';
        });
    }
    
    // === LÓGICA DE MÓDULOS ===
    
    // Drag and Drop para módulos (con soporte táctil)
    function initDragAndDrop(container, itemSelector) {
        let draggedItem = null;
        let touchDraggedItem = null;
        let touchStartY = 0;
        let touchCurrentY = 0;

        // === EVENTOS MOUSE (Desktop) ===
        container.addEventListener('dragstart', (e) => {
            const item = e.target.closest(itemSelector);
            if (!item) return;

            draggedItem = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', item.innerHTML);
        });

        container.addEventListener('dragend', (e) => {
            const item = e.target.closest(itemSelector);
            if (!item) return;

            item.classList.remove('dragging');
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            draggedItem = null;

            // Log nuevo orden
            const newOrder = Array.from(container.querySelectorAll(itemSelector)).map((item, index) => ({
                id: item.getAttribute('data-modulo-id') || item.getAttribute('data-clase-id'),
                position: index + 1
            }));
            console.log('Nuevo orden:', newOrder);
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const afterElement = getDragAfterElement(container, e.clientY, itemSelector);
            const dragging = container.querySelector('.dragging');

            if (!dragging) return;

            // Limpiar estados previos
            container.querySelectorAll(itemSelector).forEach(item => item.classList.remove('drag-over'));

            if (afterElement) {
                afterElement.classList.add('drag-over');
                container.insertBefore(dragging, afterElement);
            } else {
                container.appendChild(dragging);
            }
        });

        container.addEventListener('dragleave', (e) => {
            const item = e.target.closest(itemSelector);
            if (item) item.classList.remove('drag-over');
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        });

        // === EVENTOS TÁCTILES (Móviles iOS y Android) ===
        container.addEventListener('touchstart', (e) => {
            const handle = e.target.closest('.drag-handle');
            if (!handle) return;

            const item = handle.closest(itemSelector);
            if (!item) return;

            touchDraggedItem = item;
            touchStartY = e.touches[0].clientY;
            touchCurrentY = touchStartY;

            item.classList.add('dragging');
            item.style.opacity = '0.5';
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (!touchDraggedItem) return;

            e.preventDefault();
            touchCurrentY = e.touches[0].clientY;

            const afterElement = getDragAfterElement(container, touchCurrentY, itemSelector);

            // Limpiar estados previos
            container.querySelectorAll(itemSelector).forEach(item => item.classList.remove('drag-over'));

            if (afterElement) {
                afterElement.classList.add('drag-over');
                container.insertBefore(touchDraggedItem, afterElement);
            } else {
                const lastItem = container.querySelector(`${itemSelector}:last-child`);
                if (lastItem !== touchDraggedItem) {
                    container.appendChild(touchDraggedItem);
                }
            }
        }, { passive: false });

        container.addEventListener('touchend', (e) => {
            if (!touchDraggedItem) return;

            touchDraggedItem.classList.remove('dragging');
            touchDraggedItem.style.opacity = '';
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

            // Log nuevo orden
            const newOrder = Array.from(container.querySelectorAll(itemSelector)).map((item, index) => ({
                id: item.getAttribute('data-modulo-id') || item.getAttribute('data-clase-id'),
                position: index + 1
            }));
            console.log('Nuevo orden (táctil):', newOrder);

            touchDraggedItem = null;
            touchStartY = 0;
            touchCurrentY = 0;
        });

        container.addEventListener('touchcancel', (e) => {
            if (!touchDraggedItem) return;

            touchDraggedItem.classList.remove('dragging');
            touchDraggedItem.style.opacity = '';
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

            touchDraggedItem = null;
            touchStartY = 0;
            touchCurrentY = 0;
        });
    }
    
    function getDragAfterElement(container, y, itemSelector) {
        const draggableElements = [...container.querySelectorAll(`${itemSelector}:not(.dragging)`)];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    // Inicializar drag and drop para módulos
    if (modulosContainer) {
        initDragAndDrop(modulosContainer, '.modulo-item');
    }
    
    if (addModuloBtn && moduleNameModal) {
        addModuloBtn.addEventListener('click', () => {
            moduleNameInput.value = '';
            moduleNameModal.show();
            setTimeout(() => moduleNameInput.focus(), 300);
        });
    }
    
    if (saveModuleName) {
        saveModuleName.addEventListener('click', () => {
            const name = moduleNameInput.value.trim();
            if (!name) {
                moduleNameInput.classList.add('is-invalid');
                return;
            }

            moduleNameInput.classList.remove('is-invalid');
            moduleCounter++;

            const newModule = document.createElement('div');
            newModule.className = 'modulo-item';
            newModule.setAttribute('data-modulo-id', moduleCounter);
            newModule.setAttribute('draggable', 'true');
            newModule.innerHTML = `
                <div class="drag-handle" title="Arrastra para reordenar">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <span class="modulo-name">${name}</span>
                <div class="modulo-actions">
                    <a href="gestorModulos.html?id=${moduleCounter}" class="btn-modulo-edit" title="Editar">
                        <i class="fas fa-pen"></i>
                    </a>
                    <button type="button" class="btn-modulo-delete" title="Eliminar módulo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            modulosContainer.appendChild(newModule);
            moduleNameModal.hide();
        });
    }

    // === LÓGICA DE ELIMINAR MÓDULO ===

    // Event delegation para botones de eliminar módulo
    if (modulosContainer) {
        modulosContainer.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-modulo-delete');
            if (deleteBtn) {
                e.preventDefault();
                moduloToDelete = deleteBtn.closest('.modulo-item');
                if (deleteModuloModal) {
                    deleteModuloModal.show();
                }
            }
        });
    }

    // Confirmar eliminación de módulo
    if (confirmDeleteModulo) {
        confirmDeleteModulo.addEventListener('click', () => {
            if (moduloToDelete) {
                moduloToDelete.remove();
                moduloToDelete = null;
            }
            if (deleteModuloModal) {
                deleteModuloModal.hide();
            }
        });
    }
    
    if (moduleNameInput) {
        moduleNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveModuleName.click();
            }
        });
        
        moduleNameInput.addEventListener('input', function() {
            this.classList.remove('is-invalid');
        });
    }
    
    // === VALIDACIÓN Y ENVÍO ===

    if (courseForm) {
        courseForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const incompleteAlert = document.getElementById('incompleteFieldsAlert');
            const successAlert = document.getElementById('successAlert');
            const submitBtn = courseForm.querySelector('button[type="submit"]');

            incompleteAlert.classList.add('d-none');
            successAlert.classList.add('d-none');

            let valid = true;

            const requiredFields = courseForm.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    valid = false;
                    field.classList.add('is-invalid');
                } else {
                    field.classList.remove('is-invalid');
                }
            });

            // Validar imagen
            if (!imageInput.files.length && imageUploadedDisplay.classList.contains('d-none')) {
                valid = false;
                imageAlertText.textContent = 'Debes subir una imagen de portada.';
                imageAlert.classList.remove('d-none');
            }

            if (!valid) {
                incompleteAlert.classList.remove('d-none');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            // Deshabilitar botón mientras se procesa
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

            try {
                // Obtener valores del formulario
                const courseName = document.getElementById('courseName').value.trim();
                const courseDescription = document.getElementById('courseDescription').value.trim();
                const coursePrice = parseFloat(document.getElementById('coursePrice').value) || 0;
                const courseAccessDuration = parseInt(document.getElementById('courseAccessDuration').value) || 180;
                const status = courseStatus.value;

                // Subir imagen de portada
                let portadaUrl = null;
                if (imageInput.files.length > 0) {
                    console.log('Subiendo imagen de portada...');
                    const imageResult = await AdminCursosService.subirImagenPortada(imageInput.files[0]);

                    if (!imageResult.success) {
                        throw new Error(imageResult.error || 'Error al subir la imagen de portada');
                    }
                    portadaUrl = imageResult.url;
                    console.log('Imagen subida:', portadaUrl);
                }

                // Crear el curso en Supabase
                console.log('Creando curso en la base de datos...');
                const cursoData = {
                    nombre: courseName,
                    descripcion: courseDescription,
                    portada_url: portadaUrl,
                    precio: coursePrice,
                    estado: status,
                    dias_duracion_acceso: courseAccessDuration
                };

                const result = await AdminCursosService.crearCurso(cursoData);

                if (!result.success) {
                    throw new Error(result.error?.message || result.error || 'Error al crear el curso');
                }

                console.log('Curso creado exitosamente:', result.data);

                // Mostrar éxito
                successAlert.classList.remove('d-none');
                successAlert.innerHTML = `<i class="fas fa-check-circle me-2"></i>Curso "${courseName}" creado exitosamente como ${status === 'publicado' ? 'Publicado' : 'Borrador'}`;

                // Redirigir a gestión de cursos
                setTimeout(() => {
                    window.location.href = 'gestionCursos.html';
                }, 2000);

            } catch (error) {
                console.error('Error al crear curso:', error);
                incompleteAlert.classList.remove('d-none');
                incompleteAlert.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${error.message || 'Error al crear el curso. Inténtalo de nuevo.'}`;
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Rehabilitar botón
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Confirmar';
            }
        });
    }
    
    document.querySelectorAll('.input-kikibrows').forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('is-invalid');
        });
    });
    
});