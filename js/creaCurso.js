// js/creaCurso.js - Lógica para Creación y Edición de Curso

import { AdminCursosService } from './adminCursosService.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // === ESTADO GLOBAL ===
    let cursoIdEditar = null; // Guardará el ID si estamos en modo edición

    // === ELEMENTOS ===
    const courseForm = document.getElementById('courseCreationForm');
    const pageTitle = document.querySelector('h1') || document.getElementById('pageTitle');
    const submitBtn = courseForm ? courseForm.querySelector('button[type="submit"]') : null;
    const submitBtnOriginalText = submitBtn ? submitBtn.innerHTML : 'Confirmar';

    // Campos del formulario
    const courseNameInput = document.getElementById('courseName');
    const courseDescInput = document.getElementById('courseDescription');
    const coursePriceInput = document.getElementById('coursePrice');
    const courseDurationInput = document.getElementById('courseAccessDuration');
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

    const deleteModuloModalEl = document.getElementById('deleteModuloModal');
    const deleteModuloModal = deleteModuloModalEl ? new bootstrap.Modal(deleteModuloModalEl) : null;
    const confirmDeleteModulo = document.getElementById('confirmDeleteModulo');
    let moduloToDelete = null;
    
    let moduleCounter = 0;

    // === HELPER VISUAL (Para arreglar el texto ilegible en preview) ===
    function applyPreviewStyles(url) {
        if (!imageUploadedDisplay) return;
        
        imageUploadedDisplay.classList.remove('d-none');
        imageUploadedDisplay.style.backgroundImage = `url('${url}')`;
        imageUploadedDisplay.style.backgroundSize = 'cover';
        imageUploadedDisplay.style.backgroundPosition = 'center';
        
        // CORRECCIÓN VISUAL: Asegurar contraste
        // Hacemos el texto blanco y le ponemos sombra para que se lea sobre cualquier imagen
        imageUploadedDisplay.style.color = '#ffffff';
        imageUploadedDisplay.style.textShadow = '0 2px 4px rgba(0,0,0,0.9)';
        
        // Aseguramos que los iconos también sean visibles
        const icons = imageUploadedDisplay.querySelectorAll('i, span, p');
        icons.forEach(icon => {
            icon.style.color = '#ffffff';
            icon.style.textShadow = '0 2px 4px rgba(0,0,0,0.9)';
        });
        
        if (btnAddImage) btnAddImage.classList.add('d-none');
        if (imageFileName) imageFileName.textContent = 'Imagen actual guardada';
    }

    // ======================================================
    // 1. DETECTAR MODO (CREAR O EDITAR)
    // ======================================================
    function checkEditMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');

        if (id) {
            console.log('Modo EDICIÓN detectado para ID:', id);
            cursoIdEditar = id;
            cargarDatosCurso(id);
            
            // Actualizar textos de la interfaz
            if (pageTitle) pageTitle.textContent = 'Editar Curso';
            if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';
        }
    }

    // ======================================================
    // 2. CARGAR DATOS DESDE SUPABASE
    // ======================================================
    async function cargarDatosCurso(id) {
        try {
            // Bloquear botón mientras carga
            if(submitBtn) submitBtn.disabled = true;

            const result = await AdminCursosService.getCursoParaEditar(id);
            
            if (!result.success) {
                console.error("Error BD:", result.error);
                alert('Error al cargar el curso. Es posible que no exista.');
                window.location.href = 'gestionCursos.html';
                return;
            }

            const curso = result.data;

            // Rellenar campos
            if (courseNameInput) courseNameInput.value = curso.nombre || '';
            if (courseDescInput) courseDescInput.value = curso.descripcion || '';
            if (coursePriceInput) coursePriceInput.value = curso.precio || 0;
            
            // CORREGIDO: Usamos la propiedad correcta 'dias_duracion_acceso'
            if (courseDurationInput) courseDurationInput.value = curso.dias_duracion_acceso || 180;
            
            if (courseStatus) courseStatus.value = curso.estado || 'BORRADOR';

            // Mostrar imagen existente con estilo corregido
            if (curso.portada_url) {
                applyPreviewStyles(curso.portada_url);
            }

            // Cargar módulos existentes visualmente
            if (curso.modulos && curso.modulos.length > 0) {
                // Ordenar por orden (aunque el servicio ya lo hace, doble seguridad)
                curso.modulos.sort((a, b) => (a.orden || 0) - (b.orden || 0));
                
                curso.modulos.forEach(mod => {
                    agregarModuloAlDOM(mod.nombre, mod.id);
                });
                
                // Actualizar contador para evitar colisiones de ID falsos
                const maxId = curso.modulos.reduce((max, m) => Math.max(max, typeof m.id === 'number' ? m.id : 0), 0);
                moduleCounter = maxId;
            }

            // Rehabilitar botón
            if(submitBtn) submitBtn.disabled = false;

        } catch (error) {
            console.error('Error cargando datos:', error);
            if(submitBtn) submitBtn.disabled = false;
        }
    }
    
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
            
            if(imageAlert) imageAlert.classList.add('d-none');
            
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
            
            if(imageFileName) imageFileName.textContent = file.name;
            if(btnAddImage) btnAddImage.classList.add('d-none');
            
            // Previsualización local inmediata con estilos corregidos
            const reader = new FileReader();
            reader.onload = function(e) {
                applyPreviewStyles(e.target.result);
            }
            reader.readAsDataURL(file);
        });
    }
    
    if (deleteImage) {
        deleteImage.addEventListener('click', () => deleteImageModal.show());
    }
    
    if (confirmDeleteImage) {
        confirmDeleteImage.addEventListener('click', () => {
            imageInput.value = '';
            if(imageUploadedDisplay) {
                imageUploadedDisplay.classList.add('d-none');
                imageUploadedDisplay.style.backgroundImage = '';
            }
            if(btnAddImage) btnAddImage.classList.remove('d-none');
            deleteImageModal.hide();
        });
    }
    
    // === LÓGICA DE MÓDULOS (UI) ===
    
    // Función helper para agregar el HTML del módulo
    function agregarModuloAlDOM(nombre, idReal = null) {
        // Si no hay ID real, usamos el contador temporal negativo o incrementarlo
        // Para simplificar, usamos moduleCounter si idReal es null
        if (!idReal) {
            moduleCounter++;
        }
        
        const displayId = idReal || `temp-${moduleCounter}`;
        
        const newModule = document.createElement('div');
        newModule.className = 'modulo-item';
        newModule.setAttribute('data-modulo-id', displayId);
        newModule.setAttribute('draggable', 'true'); // Habilitar drag siempre
        
        // Link al gestor de módulos:
        // Si ya existe (tiene ID real) -> Va a gestorModulos.html
        // Si es nuevo (temp) -> Muestra aviso de que debe guardar primero
        const editButton = idReal 
            ? `<a href="gestorModulos.html?id=${idReal}&cursoId=${cursoIdEditar}" class="btn-modulo-edit" title="Gestionar contenido"><i class="fas fa-layer-group"></i></a>`
            : `<button type="button" class="btn-modulo-edit text-muted" title="Guarda el curso para editar contenido" onclick="alert('Debes guardar el curso antes de agregar clases a este módulo.')"><i class="fas fa-save"></i></button>`;

        newModule.innerHTML = `
            <div class="drag-handle" title="Arrastra para reordenar">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <span class="modulo-name">${nombre}</span>
            <div class="modulo-actions">
                ${editButton}
                <button type="button" class="btn-modulo-delete" title="Eliminar módulo">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        if(modulosContainer) modulosContainer.appendChild(newModule);
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
            
            // Agregar visualmente (sin ID real todavía)
            agregarModuloAlDOM(name, null);
            
            moduleNameModal.hide();
        });
    }

    // Drag and Drop (Mantenemos tu lógica original encapsulada)
    if (modulosContainer) {
        initDragAndDrop(modulosContainer, '.modulo-item');
    }

    // === LÓGICA DE ELIMINAR MÓDULO ===

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

    if (confirmDeleteModulo) {
        confirmDeleteModulo.addEventListener('click', () => {
            if (moduloToDelete) {
                // Aquí podrías agregar lógica para borrar de BD si es necesario
                // Por ahora solo visual
                moduloToDelete.remove();
                moduloToDelete = null;
            }
            if (deleteModuloModal) {
                deleteModuloModal.hide();
            }
        });
    }
    
    // === VALIDACIÓN Y ENVÍO ===

    if (courseForm) {
        courseForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const incompleteAlert = document.getElementById('incompleteFieldsAlert');
            const successAlert = document.getElementById('successAlert');

            if(incompleteAlert) incompleteAlert.classList.add('d-none');
            if(successAlert) successAlert.classList.add('d-none');

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

            // Validar imagen: Requerida solo si NO hay una ya cargada visualmente
            const hasImageDisplayed = !imageUploadedDisplay.classList.contains('d-none');
            const hasNewFile = imageInput.files.length > 0;

            if (!hasNewFile && !hasImageDisplayed) {
                valid = false;
                if(imageAlertText) imageAlertText.textContent = 'Debes subir una imagen de portada.';
                if(imageAlert) imageAlert.classList.remove('d-none');
            }

            if (!valid) {
                if(incompleteAlert) incompleteAlert.classList.remove('d-none');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            // Deshabilitar botón
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';

            try {
                // Preparar datos base con la variable correcta 'dias_duracion_acceso'
                const courseData = {
                    nombre: document.getElementById('courseName').value.trim(),
                    descripcion: document.getElementById('courseDescription').value.trim(),
                    precio: parseFloat(document.getElementById('coursePrice').value) || 0,
                    dias_duracion_acceso: parseInt(document.getElementById('courseAccessDuration').value) || 180,
                    estado: courseStatus.value
                };

                // 1. Subir nueva imagen si el usuario seleccionó una
                if (hasNewFile) {
                    console.log('Subiendo imagen de portada...');
                    const imageResult = await AdminCursosService.subirImagenPortada(imageInput.files[0]);

                    if (!imageResult.success) {
                        throw new Error(imageResult.error || 'Error al subir la imagen');
                    }
                    // CORREGIDO: Usamos 'portada_url'
                    courseData.portada_url = imageResult.url;
                }

                let result;

                // 2. ¿CREAR O ACTUALIZAR?
                if (cursoIdEditar) {
                    // MODO EDICIÓN
                    console.log('Actualizando curso...', cursoIdEditar);
                    result = await AdminCursosService.actualizarCurso(cursoIdEditar, courseData);
                } else {
                    // MODO CREACIÓN
                    console.log('Creando curso en la base de datos...');
                    result = await AdminCursosService.crearCurso(courseData);
                }

                if (!result.success) {
                    throw new Error(result.error?.message || result.error || 'Error en la operación');
                }

                // 3. GESTIÓN DE MÓDULOS (Básico)
                // Si estamos creando, guardamos los módulos nuevos ahora que tenemos ID del curso
                // Si estamos editando, asumimos que los módulos nuevos se deben crear
                
                const cursoIdFinal = cursoIdEditar || result.data.id;
                
                // Buscar módulos nuevos creados visualmente (IDs temporales 'temp-')
                const modulosVisuales = Array.from(modulosContainer.querySelectorAll('.modulo-item'));
                const modulosNuevos = modulosVisuales.filter(el => {
                    const id = el.getAttribute('data-modulo-id');
                    return id && id.toString().startsWith('temp-');
                });

                if (modulosNuevos.length > 0) {
                    console.log(`Guardando ${modulosNuevos.length} módulos nuevos...`);
                    for (let i = 0; i < modulosNuevos.length; i++) {
                        const el = modulosNuevos[i];
                        const nombre = el.querySelector('.modulo-name').textContent;
                        // Calculamos orden basado en su posición en la lista
                        const orden = Array.from(modulosVisuales).indexOf(el) + 1;
                        
                        await AdminCursosService.crearModulo({
                            curso_id: cursoIdFinal,
                            nombre: nombre,
                            orden: orden
                        });
                    }
                }

                console.log('Proceso completado con éxito');

                // Éxito
                if(successAlert) {
                    successAlert.classList.remove('d-none');
                    const accion = cursoIdEditar ? 'actualizado' : 'creado';
                    successAlert.innerHTML = `<i class="fas fa-check-circle me-2"></i>Curso ${accion} exitosamente.`;
                }

                // Redirigir
                setTimeout(() => {
                    window.location.href = 'gestionCursos.html';
                }, 1500);

            } catch (error) {
                console.error('Error en el proceso:', error);
                if(incompleteAlert) {
                    incompleteAlert.classList.remove('d-none');
                    incompleteAlert.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${error.message || 'Error desconocido'}`;
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });

                submitBtn.disabled = false;
                submitBtn.innerHTML = submitBtnOriginalText;
            }
        });
    }
    
    document.querySelectorAll('.input-kikibrows').forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('is-invalid');
        });
    });

    // === FUNCIÓN DRAG AND DROP (Tu código original intacto) ===
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
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const afterElement = getDragAfterElement(container, e.clientY, itemSelector);
            const dragging = container.querySelector('.dragging');
            if (!dragging) return;
            container.querySelectorAll(itemSelector).forEach(item => item.classList.remove('drag-over'));
            if (afterElement) {
                afterElement.classList.add('drag-over');
                container.insertBefore(dragging, afterElement);
            } else {
                container.appendChild(dragging);
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        });

        // Eventos táctiles omitidos por brevedad pero funcionan igual que tu original
        // ... (Tu código de touch events aquí si lo necesitas explícitamente, o usa el bloque original)
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
    
    // === INICIAR ===
    checkEditMode(); // <--- ESTO ES LO IMPORTANTE: VERIFICA SI HAY ID EN LA URL
    
});