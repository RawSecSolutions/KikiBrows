// js/gestorModulos.js - Lógica para Edición de Módulo (Completo H4.1 + H4.3)

document.addEventListener('DOMContentLoaded', () => {
    
    // Variable global para la instancia del editor
    let quillEditor = null;

    // === DRAG AND DROP ===
    function initDragAndDrop(container, itemSelector) {
        let draggedItem = null;
        
        container.addEventListener('dragstart', (e) => {
            const item = e.target.closest(itemSelector);
            if (!item) return;
            
            draggedItem = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            // Importante: transferir datos básicos para compatibilidad
            e.dataTransfer.setData('text/plain', item.dataset.claseId);
        });
        
        container.addEventListener('dragend', (e) => {
            const item = e.target.closest(itemSelector);
            if (!item) return;
            
            item.classList.remove('dragging');
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            draggedItem = null;
            
            // Log nuevo orden (Simulación de guardado de orden)
            const newOrder = Array.from(container.querySelectorAll(itemSelector)).map((item, index) => ({
                id: item.getAttribute('data-clase-id'),
                position: index + 1
            }));
            console.log('Nuevo orden de clases:', newOrder);
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
        
        container.addEventListener('dragleave', (e) => {
            const item = e.target.closest(itemSelector);
            if (item) item.classList.remove('drag-over');
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
    
    // === ELEMENTOS DOM ===
    const moduleEditForm = document.getElementById('moduleEditForm');
    const moduleNameInput = document.getElementById('moduleName');
    const clasesContainer = document.getElementById('clasesContainer');
    const addClaseBtn = document.getElementById('addClaseBtn');
    const saveModuleInfo = document.getElementById('saveModuleInfo');
    const saveSuccessAlert = document.getElementById('saveSuccessAlert');
    
    // Modales Bootstrap
    const claseTypeModalEl = document.getElementById('claseTypeModal');
    const claseTypeModal = claseTypeModalEl ? new bootstrap.Modal(claseTypeModalEl) : null;
    
    const editClaseModalEl = document.getElementById('editClaseModal');
    const editClaseModal = editClaseModalEl ? new bootstrap.Modal(editClaseModalEl) : null;
    
    const deleteClaseModalEl = document.getElementById('deleteClaseModal');
    const deleteClaseModal = deleteClaseModalEl ? new bootstrap.Modal(deleteClaseModalEl) : null;
    
    // Variables de Estado
    let claseCounter = 4; // Empezamos en 4 porque hay 4 ejemplos estáticos
    let editingClaseId = null;
    let deletingClaseId = null;
    
    // Inicializar
    if (clasesContainer) {
        initDragAndDrop(clasesContainer, '.clase-item');
        updateModuleDuration();
    }
    
    // === DURACIÓN DEL MÓDULO ===
    function updateModuleDuration() {
        const clases = document.querySelectorAll('.clase-item');
        let totalMinutes = 0;
        
        clases.forEach(clase => {
            const durationEl = clase.querySelector('.clase-duration');
            if (durationEl) {
                const minutes = parseInt(durationEl.textContent) || 0;
                totalMinutes += minutes;
            }
        });
        
        const durationText = document.getElementById('moduleDurationText');
        if (durationText) {
            if (totalMinutes >= 60) {
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                durationText.textContent = mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
            } else {
                durationText.textContent = `${totalMinutes} min`;
            }
        }
    }
    
    // === TIPOS DE CLASE ===
    const claseTypes = {
        video: { icon: 'fa-play-circle', color: 'text-primary', label: 'Video' },
        texto: { icon: 'fa-file-alt', color: 'text-secondary', label: 'Texto' },
        pdf: { icon: 'fa-file-pdf', color: 'text-danger', label: 'PDF' },
        quiz: { icon: 'fa-question-circle', color: 'text-info', label: 'Quiz' },
        entrega: { icon: 'fa-upload', color: 'text-warning', label: 'Entrega' }
    };
    
    // === GESTIÓN DE MODALES ===
    
    if (addClaseBtn && claseTypeModal) {
        addClaseBtn.addEventListener('click', () => {
            claseTypeModal.show();
        });
    }
    
    // Click en tipo de clase (Nuevo)
    document.querySelectorAll('.clase-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tipo = this.getAttribute('data-tipo');
            claseTypeModal.hide();
            
            // Nueva clase
            editingClaseId = null;
            openEditClaseModal(tipo);
        });
    });
    
    // Función Principal: Abrir Modal de Edición
    function openEditClaseModal(tipo, claseData = null) {
        const modalTitle = document.getElementById('editClaseModalTitle');
        const editClaseName = document.getElementById('editClaseName');
        const editClaseDesc = document.getElementById('editClaseDesc');
        const editClaseDuration = document.getElementById('editClaseDuration');
        const claseContentArea = document.getElementById('claseContentArea');
        const deleteClaseBtn = document.getElementById('deleteClaseBtn');
        
        // Reset Inputs
        editClaseName.value = claseData ? claseData.name : '';
        editClaseDesc.value = claseData ? claseData.desc : '';
        editClaseDuration.value = claseData ? claseData.duration : '5';
        editClaseName.classList.remove('is-invalid');

        // Configurar Título y Botones
        const typeInfo = claseTypes[tipo];
        modalTitle.innerHTML = `<i class="fas ${typeInfo.icon} ${typeInfo.color} me-2"></i>${claseData ? 'Editar' : 'Nueva'} Clase - ${typeInfo.label}`;
        deleteClaseBtn.style.display = editingClaseId ? 'inline-flex' : 'none';
            
        // Inyectar HTML específico
        claseContentArea.innerHTML = getContentAreaHTML(tipo);
        editClaseModal._tipo = tipo; // Guardar tipo en instancia del modal
        
        // === H4.3 INICIALIZAR QUILL (Si es Texto) ===
        // Limpiar instancia previa
        if (quillEditor) {
            quillEditor = null;
        }

        if (tipo === 'texto') {
            // Timeout para asegurar que el DOM del modal está listo
            setTimeout(() => {
                // Verificar si existe el contenedor antes de crear
                const container = document.getElementById('editor-container');
                if (container) {
                    quillEditor = new Quill('#editor-container', {
                        theme: 'snow',
                        placeholder: 'Escribe el contenido de la lección aquí...',
                        modules: {
                            toolbar: [
                                ['bold', 'italic', 'underline'],
                                [{ 'header': [1, 2, 3, false] }],
                                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                ['link']
                            ]
                        }
                    });

                    // Si estamos editando, cargar el contenido guardado
                    if (claseData && claseData.content) {
                        quillEditor.root.innerHTML = claseData.content;
                    }
                }
            }, 100);
        }
        
        editClaseModal.show();
    }
    
    // HTML dinámico según tipo
    function getContentAreaHTML(tipo) {
        switch(tipo) {
            case 'video':
                // H4.1: Input de video + Barra de progreso oculta
                return `
                    <div class="mb-3">
                        <label class="form-label">Video de la clase</label>
                        <input type="file" class="form-control input-kikibrows" id="videoFileInput" accept=".mp4,.webm">
                        <small class="text-muted">MP4, WEBM • Máx 500MB</small>
                        <div id="videoValidationError" class="text-danger small mt-1 d-none"></div>
                    </div>
                    
                    <div class="upload-progress-container" id="uploadProgress" style="display: none;">
                        <div class="progress-label d-flex justify-content-between mb-1">
                            <span class="small">Subiendo video...</span>
                            <span class="small" id="progressPercent">0%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-success" role="progressbar" style="width: 0%"></div>
                        </div>
                    </div>
                `;
            case 'texto':
                // H4.3: Contenedor para Quill
                return `
                    <div class="mb-3">
                        <label class="form-label">Contenido de la lección</label>
                        <div id="editor-container" style="height: 200px; background: white;"></div>
                        <input type="hidden" id="quillContent">
                    </div>
                `;
            case 'pdf':
                return `
                    <div class="mb-3">
                        <label class="form-label">Archivo PDF</label>
                        <input type="file" class="form-control input-kikibrows" accept=".pdf">
                        <small class="text-muted">Solo archivos PDF</small>
                    </div>
                `;
            case 'quiz':
                return `
                    <div class="mb-3">
                        <label class="form-label">Configuración del Quiz</label>
                        <p class="text-muted small">La configuración detallada del quiz se realizará en una pantalla dedicada.</p>
                        <button type="button" class="btn btn-outline-primary btn-sm" disabled>
                            <i class="fas fa-cog me-1"></i>Configurar preguntas (próximamente)
                        </button>
                    </div>
                `;
            case 'entrega':
                return `
                    <div class="mb-3">
                        <label class="form-label">Instrucciones para la entrega</label>
                        <textarea class="form-control input-kikibrows" rows="4" placeholder="Describe qué debe entregar la alumna..."></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Puntos asignados</label>
                        <input type="number" class="form-control input-kikibrows" style="width: 100px;" value="10" min="1">
                    </div>
                `;
            default:
                return '';
        }
    }
    
    // === EDITAR CLASE EXISTENTE (Click en Lápiz) ===
    
    if (clasesContainer) {
        clasesContainer.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-clase-edit');
            if (editBtn) {
                const claseItem = editBtn.closest('.clase-item');
                editingClaseId = claseItem.getAttribute('data-clase-id');
                const tipo = claseItem.getAttribute('data-tipo');
                const name = claseItem.querySelector('.clase-name').textContent.trim();
                
                // Recuperar contenido enriquecido si existe (H4.3)
                const savedContent = claseItem.getAttribute('data-content') || '';
                
                // Extraer solo el nombre limpio (quitando prefijos si los hubiera)
                const cleanName = name.includes(': ') ? name.split(': ')[1] : name;

                openEditClaseModal(tipo, {
                    name: cleanName,
                    desc: '',
                    duration: claseItem.querySelector('.clase-duration')?.textContent.replace(' min.', '') || '5',
                    content: savedContent // Pasar contenido HTML a la función de apertura
                });
            }
        });
    }
    
    // === GUARDAR CLASE (Botón Modal) ===
    
    const saveClaseBtn = document.getElementById('saveClaseBtn');
    if (saveClaseBtn) {
        saveClaseBtn.addEventListener('click', () => {
            const editClaseName = document.getElementById('editClaseName');
            const editClaseDuration = document.getElementById('editClaseDuration');
            const name = editClaseName.value.trim();
            const tipo = editClaseModal._tipo;
            
            // Validación Básica
            if (!name) {
                editClaseName.classList.add('is-invalid');
                return;
            }
            editClaseName.classList.remove('is-invalid');

            // === H4.1 LÓGICA DE SUBIDA VIDEO ===
            if (tipo === 'video' && !editingClaseId) { // Solo simular subida si es nueva
                const fileInput = document.getElementById('videoFileInput');
                const errorMsg = document.getElementById('videoValidationError');
                const file = fileInput.files[0];

                if (!file) {
                    errorMsg.textContent = "Debes seleccionar un archivo.";
                    errorMsg.classList.remove('d-none');
                    return;
                }

                // Validación Tamaño
                if (file.size > 500 * 1024 * 1024) {
                    errorMsg.textContent = "El archivo supera los 500MB.";
                    errorMsg.classList.remove('d-none');
                    return;
                }

                // Validación Formato
                if (!['video/mp4', 'video/webm'].includes(file.type)) {
                    errorMsg.textContent = "Formato no válido. Solo MP4 o WEBM.";
                    errorMsg.classList.remove('d-none');
                    return;
                }
                errorMsg.classList.add('d-none');

                // Simulación Barra de Progreso
                const progressContainer = document.getElementById('uploadProgress');
                const progressBar = progressContainer.querySelector('.progress-bar');
                const progressPercent = document.getElementById('progressPercent');
                
                progressContainer.style.display = 'block';
                saveClaseBtn.disabled = true; 
                saveClaseBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Subiendo...';

                let width = 0;
                const interval = setInterval(() => {
                    if (width >= 100) {
                        clearInterval(interval);
                        finishSaveClase(name, editClaseDuration.value || '5', tipo);
                        
                        // Reset botón
                        saveClaseBtn.disabled = false;
                        saveClaseBtn.textContent = 'Guardar';
                    } else {
                        width += 5;
                        progressBar.style.width = width + '%';
                        progressPercent.textContent = width + '%';
                    }
                }, 100); // Velocidad simulación
                return; // Detener flujo, finishSaveClase se llama al terminar
            }

            // === H4.3 CAPTURA DE CONTENIDO TEXTO ===
            let richContent = null;
            if (tipo === 'texto' && quillEditor) {
                richContent = quillEditor.root.innerHTML;
            }

            // Guardado inmediato para otros tipos o edición
            finishSaveClase(name, editClaseDuration.value || '5', tipo, richContent);
        });
    }

    // === FUNCIÓN DE ACTUALIZACIÓN DEL DOM ===
    function finishSaveClase(name, duration, tipo, customContent = null) {
        const typeInfo = claseTypes[tipo];
        
        if (editingClaseId) {
            // --- EDITAR EXISTENTE ---
            const claseItem = document.querySelector(`.clase-item[data-clase-id="${editingClaseId}"]`);
            if (claseItem) {
                claseItem.querySelector('.clase-name').textContent = `Clase ${editingClaseId}: ${name}`;
                claseItem.querySelector('.clase-duration').textContent = duration + ' min.';
                
                // Actualizar contenido guardado (H4.3)
                if (customContent !== null) {
                    claseItem.setAttribute('data-content', customContent);
                }
            }
        } else {
            // --- CREAR NUEVA ---
            claseCounter++;
            const newClase = document.createElement('div');
            newClase.className = 'clase-item';
            newClase.setAttribute('data-clase-id', claseCounter);
            newClase.setAttribute('data-tipo', tipo);
            newClase.setAttribute('draggable', 'true');
            
            // Guardar contenido rico si existe (H4.3)
            if (customContent !== null) {
                newClase.setAttribute('data-content', customContent);
            }
            
            // Generar botones de acción
            let actionsHTML = '';
            
            // Botón Play si es video (H4.1)
            if (tipo === 'video') {
                actionsHTML += `
                    <button type="button" class="btn-clase-play" title="Previsualizar" onclick="previewVideo('${name}')">
                        <i class="fas fa-play"></i>
                    </button>
                `;
            }

            actionsHTML += `
                <button type="button" class="btn-clase-edit" title="Editar">
                    <i class="fas fa-pen"></i>
                </button>
            `;

            newClase.innerHTML = `
                <div class="drag-handle" title="Arrastra para reordenar">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="clase-info">
                    <i class="fas ${typeInfo.icon} clase-icon ${typeInfo.color}"></i>
                    <span class="clase-name">Clase ${claseCounter}: ${name}</span>
                    <span class="clase-duration">${duration} min.</span>
                </div>
                <div class="clase-actions">
                    ${actionsHTML}
                </div>
            `;
            clasesContainer.appendChild(newClase);
        }
        
        // Finalizar
        updateModuleDuration();
        editClaseModal.hide();
        editingClaseId = null;
    }
    
    // === ELIMINAR CLASE ===
    
    const deleteClaseBtn = document.getElementById('deleteClaseBtn');
    if (deleteClaseBtn && deleteClaseModal) {
        deleteClaseBtn.addEventListener('click', () => {
            deletingClaseId = editingClaseId;
            editClaseModal.hide();
            deleteClaseModal.show();
        });
    }
    
    const confirmDeleteClase = document.getElementById('confirmDeleteClase');
    if (confirmDeleteClase) {
        confirmDeleteClase.addEventListener('click', () => {
            if (deletingClaseId) {
                const claseItem = document.querySelector(`.clase-item[data-clase-id="${deletingClaseId}"]`);
                if (claseItem) claseItem.remove();
                deletingClaseId = null;
                updateModuleDuration();
            }
            deleteClaseModal.hide();
        });
    }
    
    // === GUARDAR MÓDULO (Simulación final) ===
    if (moduleEditForm) {
        moduleEditForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Aquí iría la lógica de envío al backend
            if (saveSuccessAlert) {
                saveSuccessAlert.classList.remove('d-none');
                setTimeout(() => saveSuccessAlert.classList.add('d-none'), 3000);
            }
        });
    }
    
    // === FUNCIÓN GLOBAL PREVIEW VIDEO (H4.1) ===
    window.previewVideo = function(title) {
        const videoModal = new bootstrap.Modal(document.getElementById('videoPreviewModal'));
        document.getElementById('videoPreviewTitle').textContent = title;
        // Aquí asignarías el src real del video subido o blob
        videoModal.show();
        
        // Pausar al cerrar
        const modalEl = document.getElementById('videoPreviewModal');
        modalEl.addEventListener('hidden.bs.modal', () => {
            const player = document.getElementById('videoPlayer');
            if(player) player.pause();
        }, { once: true });
    };
    
});