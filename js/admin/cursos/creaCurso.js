// js/creaCurso.js - Lógica para Creación y Edición de Curso
// Actualizado: Calcula contenido total (suma de duraciones de clases)

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
    const courseDurationText = document.getElementById('courseDurationText');

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
        imageUploadedDisplay.style.color = '#ffffff';
        imageUploadedDisplay.style.textShadow = '0 2px 4px rgba(0,0,0,0.9)';
        
        const icons = imageUploadedDisplay.querySelectorAll('i, span, p');
        icons.forEach(icon => {
            icon.style.color = '#ffffff';
            icon.style.textShadow = '0 2px 4px rgba(0,0,0,0.9)';
        });
        
        if (btnAddImage) btnAddImage.classList.add('d-none');
        if (imageFileName) imageFileName.textContent = 'Imagen actual guardada';
    }

    // ======================================================
    // NUEVO: CALCULAR CONTENIDO TOTAL DEL CURSO
    // ======================================================
    
    /**
     * Calcula la duración total del curso sumando las duraciones de todas las clases
     * de todos los módulos
     */
    async function calcularContenidoTotal() {
        if (!cursoIdEditar) {
            // Si no hay curso guardado, mostrar 0
            actualizarDisplayDuracion(0);
            return;
        }
        
        try {
            // 1. Obtener todos los módulos del curso
            const { data: modulos, error: errorModulos } = await AdminCursosService.supabase
                .from('modulos')
                .select('id')
                .eq('curso_id', cursoIdEditar);
            
            if (errorModulos) throw errorModulos;
            
            if (!modulos || modulos.length === 0) {
                actualizarDisplayDuracion(0);
                return;
            }
            
            // 2. Obtener los IDs de todos los módulos
            const moduloIds = modulos.map(m => m.id);
            
            // 3. Obtener todas las clases de esos módulos y sumar duraciones
            const { data: clases, error: errorClases } = await AdminCursosService.supabase
                .from('clases')
                .select('duracion')
                .in('modulo_id', moduloIds);
            
            if (errorClases) throw errorClases;
            
            // 4. Sumar todas las duraciones
            let totalMinutos = 0;
            if (clases && clases.length > 0) {
                totalMinutos = clases.reduce((sum, clase) => {
                    return sum + (clase.duracion || 0);
                }, 0);
            }
            
            // 5. Actualizar el display
            actualizarDisplayDuracion(totalMinutos);
            
        } catch (error) {
            console.error('Error al calcular contenido total:', error);
            actualizarDisplayDuracion(0);
        }
    }
    
    /**
     * Actualiza el texto del display de duración con formato legible
     */
    function actualizarDisplayDuracion(totalMinutos) {
        if (!courseDurationText) return;
        
        if (totalMinutos >= 60) {
            const horas = Math.floor(totalMinutos / 60);
            const minutos = totalMinutos % 60;
            if (minutos > 0) {
                courseDurationText.textContent = `${horas}h ${minutos}min`;
            } else {
                courseDurationText.textContent = `${horas}h`;
            }
        } else {
            courseDurationText.textContent = `${totalMinutos} min`;
        }
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
            if (courseDurationInput) courseDurationInput.value = curso.dias_duracion_acceso || 180;
            if (courseStatus) courseStatus.value = curso.estado || 'BORRADOR';
            
            // Carrusel
            if (showInCarousel && curso.en_carrusel !== undefined) {
                showInCarousel.checked = curso.en_carrusel;
                if (carouselPosition) {
                    carouselPosition.disabled = !curso.en_carrusel;
                    if (curso.posicion_carrusel) {
                        carouselPosition.value = curso.posicion_carrusel;
                    }
                }
            }

            // Mostrar imagen existente con estilo corregido
            if (curso.portada_url) {
                applyPreviewStyles(curso.portada_url);
            }

            // Cargar módulos existentes visualmente
            if (curso.modulos && curso.modulos.length > 0) {
                curso.modulos.sort((a, b) => (a.orden || 0) - (b.orden || 0));
                
                curso.modulos.forEach(mod => {
                    agregarModuloAlDOM(mod.nombre, mod.id);
                });
                
                const maxId = curso.modulos.reduce((max, m) => Math.max(max, typeof m.id === 'number' ? m.id : 0), 0);
                moduleCounter = maxId;
            }

            // NUEVO: Calcular y mostrar contenido total
            await calcularContenidoTotal();

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
    
    // === LÓGICA DE CARRUSEL ===
    
    if (showInCarousel) {
        showInCarousel.addEventListener('change', function() {
            if (carouselPosition) {
                carouselPosition.disabled = !this.checked;
                if (this.checked && !carouselPosition.value) {
                    carouselPosition.value = 1;
                }
            }
        });
    }
    
    // === LÓGICA DE MÓDULOS (UI) ===
    
    function agregarModuloAlDOM(nombre, idReal = null) {
        if (!idReal) {
            moduleCounter++;
        }
        
        const displayId = idReal || `temp-${moduleCounter}`;
        
        const newModule = document.createElement('div');
        newModule.className = 'modulo-item';
        newModule.setAttribute('data-modulo-id', displayId);
        newModule.setAttribute('draggable', 'true');
        
        // Link al gestor de módulos - CORREGIDO: usar 'curso' en lugar de 'cursoId'
        const editButton = idReal 
            ? `<a href="gestorModulos.html?id=${idReal}&curso=${cursoIdEditar}" class="btn-modulo-edit" title="Gestionar contenido"><i class="fas fa-layer-group"></i></a>`
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
            agregarModuloAlDOM(name, null);
            moduleNameModal.hide();
        });
    }

    // Drag and Drop
    if (modulosContainer) {
        initDragAndDrop(modulosContainer, '.modulo-item');
    }

    // === LÓGICA DE ELIMINAR MÓDULO ===

    if (modulosContainer) {
        modulosContainer.addEventListener('click', async (e) => {
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
        confirmDeleteModulo.addEventListener('click', async () => {
            if (moduloToDelete) {
                const moduloId = moduloToDelete.getAttribute('data-modulo-id');
                
                // Si es un módulo guardado (no temporal), eliminarlo de la BD
                if (moduloId && !moduloId.startsWith('temp-')) {
                    try {
                        confirmDeleteModulo.disabled = true;
                        confirmDeleteModulo.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Eliminando...';
                        
                        const result = await AdminCursosService.eliminarModulo(moduloId);
                        
                        if (!result.success) {
                            console.error('Error al eliminar módulo:', result.error);
                            alert('Error al eliminar el módulo');
                            confirmDeleteModulo.disabled = false;
                            confirmDeleteModulo.innerHTML = 'Eliminar';
                            return;
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Error al eliminar el módulo');
                        confirmDeleteModulo.disabled = false;
                        confirmDeleteModulo.innerHTML = 'Eliminar';
                        return;
                    }
                }
                
                // Eliminar del DOM
                moduloToDelete.remove();
                moduloToDelete = null;
                
                // Recalcular contenido total después de eliminar
                await calcularContenidoTotal();
                
                confirmDeleteModulo.disabled = false;
                confirmDeleteModulo.innerHTML = 'Eliminar';
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

            // Validar imagen
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

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';

            try {
                const courseData = {
                    nombre: document.getElementById('courseName').value.trim(),
                    descripcion: document.getElementById('courseDescription').value.trim(),
                    precio: parseFloat(document.getElementById('coursePrice').value) || 0,
                    dias_duracion_acceso: parseInt(document.getElementById('courseAccessDuration').value) || 180,
                    estado: courseStatus.value,
                    en_carrusel: showInCarousel ? showInCarousel.checked : false,
                    posicion_carrusel: (showInCarousel && showInCarousel.checked && carouselPosition) 
                        ? parseInt(carouselPosition.value) || 1 
                        : null
                };

                // Subir nueva imagen si el usuario seleccionó una
                if (hasNewFile) {
                    console.log('Subiendo imagen de portada...');
                    const imageResult = await AdminCursosService.subirImagenPortada(imageInput.files[0]);

                    if (!imageResult.success) {
                        throw new Error(imageResult.error || 'Error al subir la imagen');
                    }
                    courseData.portada_url = imageResult.url;
                }

                let result;

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

                // GESTIÓN DE MÓDULOS
                const cursoIdFinal = cursoIdEditar || result.data.id;
                
                // Buscar módulos nuevos (IDs temporales)
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
                        const orden = Array.from(modulosVisuales).indexOf(el) + 1;
                        
                        await AdminCursosService.crearModulo({
                            curso_id: cursoIdFinal,
                            nombre: nombre,
                            orden: orden
                        });
                    }
                }
                
                // Actualizar orden de módulos existentes si se reordenaron
                const modulosExistentes = modulosVisuales.filter(el => {
                    const id = el.getAttribute('data-modulo-id');
                    return id && !id.toString().startsWith('temp-');
                });
                
                if (modulosExistentes.length > 0) {
                    const ordenArray = modulosExistentes.map((el, index) => ({
                        id: el.getAttribute('data-modulo-id'),
                        orden: index + 1
                    }));
                    await AdminCursosService.actualizarOrdenModulos(ordenArray);
                }

                console.log('Proceso completado con éxito');

                if(successAlert) {
                    successAlert.classList.remove('d-none');
                    const accion = cursoIdEditar ? 'actualizado' : 'creado';
                    successAlert.innerHTML = `<i class="fas fa-check-circle me-2"></i>Curso ${accion} exitosamente.`;
                }

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

    // === FUNCIÓN DRAG AND DROP ===
    function initDragAndDrop(container, itemSelector) {
        let draggedItem = null;

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
    checkEditMode();
    
});