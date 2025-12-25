// js/gestorModulos.js - Lógica para Edición de Módulo

document.addEventListener('DOMContentLoaded', () => {
    
    // === DRAG AND DROP ===
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
            
            // Log nuevo orden
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
    
    // === ELEMENTOS ===
    const moduleEditForm = document.getElementById('moduleEditForm');
    const moduleNameInput = document.getElementById('moduleName');
    const clasesContainer = document.getElementById('clasesContainer');
    const addClaseBtn = document.getElementById('addClaseBtn');
    const saveModuleInfo = document.getElementById('saveModuleInfo');
    const saveSuccessAlert = document.getElementById('saveSuccessAlert');
    
    // Modales
    const claseTypeModalEl = document.getElementById('claseTypeModal');
    const claseTypeModal = claseTypeModalEl ? new bootstrap.Modal(claseTypeModalEl) : null;
    
    const editClaseModalEl = document.getElementById('editClaseModal');
    const editClaseModal = editClaseModalEl ? new bootstrap.Modal(editClaseModalEl) : null;
    
    const deleteClaseModalEl = document.getElementById('deleteClaseModal');
    const deleteClaseModal = deleteClaseModalEl ? new bootstrap.Modal(deleteClaseModalEl) : null;
    
    let claseCounter = 4;
    let editingClaseId = null;
    let deletingClaseId = null;
    
    // Inicializar drag and drop para clases
    if (clasesContainer) {
        initDragAndDrop(clasesContainer, '.clase-item');
        // Calcular duración inicial
        updateModuleDuration();
    }
    
    // === CALCULAR DURACIÓN DEL MÓDULO ===
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
    
    // === OBTENER ID DEL MÓDULO ===
    const urlParams = new URLSearchParams(window.location.search);
    const moduleId = urlParams.get('id');
    
    if (moduleId) {
        loadModuleData(moduleId);
    }
    
    function loadModuleData(id) {
        // Simular carga de datos
        if (moduleNameInput) {
            moduleNameInput.value = `Módulo ${id}: Introducción a la Técnica`;
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
    
    // === CREAR CLASE ===
    
    if (addClaseBtn && claseTypeModal) {
        addClaseBtn.addEventListener('click', () => {
            claseTypeModal.show();
        });
    }
    
    // Seleccionar tipo de clase
    document.querySelectorAll('.clase-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tipo = this.getAttribute('data-tipo');
            claseTypeModal.hide();
            
            // Abrir modal de edición para nueva clase
            editingClaseId = null;
            openEditClaseModal(tipo);
        });
    });
    
    function openEditClaseModal(tipo, claseData = null) {
        const modalTitle = document.getElementById('editClaseModalTitle');
        const editClaseName = document.getElementById('editClaseName');
        const editClaseDesc = document.getElementById('editClaseDesc');
        const editClaseDuration = document.getElementById('editClaseDuration');
        const claseContentArea = document.getElementById('claseContentArea');
        const deleteClaseBtn = document.getElementById('deleteClaseBtn');
        
        // Reset
        editClaseName.value = claseData ? claseData.name : '';
        editClaseDesc.value = claseData ? claseData.desc : '';
        editClaseDuration.value = claseData ? claseData.duration : '5';
        
        // Título según tipo
        const typeInfo = claseTypes[tipo];
        modalTitle.innerHTML = `<i class="fas ${typeInfo.icon} ${typeInfo.color} me-2"></i>${claseData ? 'Editar' : 'Nueva'} Clase - ${typeInfo.label}`;
        
        // Contenido específico según tipo
        claseContentArea.innerHTML = getContentAreaHTML(tipo);
        
        // Mostrar/ocultar botón eliminar
        deleteClaseBtn.style.display = editingClaseId ? 'inline-flex' : 'none';
        
        // Guardar tipo actual
        editClaseModal._tipo = tipo;
        editClaseModal.show();
    }
    
    function getContentAreaHTML(tipo) {
        switch(tipo) {
            case 'video':
                return `
                    <div class="mb-3">
                        <label class="form-label">Video de la clase</label>
                        <input type="file" class="form-control input-kikibrows" accept=".mp4,.webm">
                        <small class="text-muted">MP4, WEBM • Máx 500MB</small>
                    </div>
                `;
            case 'texto':
                return `
                    <div class="mb-3">
                        <label class="form-label">Contenido de la lección</label>
                        <textarea class="form-control input-kikibrows" rows="6" placeholder="Escribe el contenido teórico aquí..."></textarea>
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
    
    // === EDITAR CLASE EXISTENTE ===
    
    if (clasesContainer) {
        clasesContainer.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-clase-edit');
            if (editBtn) {
                const claseItem = editBtn.closest('.clase-item');
                editingClaseId = claseItem.getAttribute('data-clase-id');
                const tipo = claseItem.getAttribute('data-tipo');
                const name = claseItem.querySelector('.clase-name').textContent;
                
                openEditClaseModal(tipo, {
                    name: name.replace(/^Clase \d+: /, ''),
                    desc: '',
                    duration: claseItem.querySelector('.clase-duration')?.textContent.replace(' min.', '') || '5'
                });
            }
        });
    }
    
    // === GUARDAR CLASE ===
    
    const saveClaseBtn = document.getElementById('saveClaseBtn');
    if (saveClaseBtn) {
        saveClaseBtn.addEventListener('click', () => {
            const editClaseName = document.getElementById('editClaseName');
            const editClaseDuration = document.getElementById('editClaseDuration');
            const name = editClaseName.value.trim();
            
            if (!name) {
                editClaseName.classList.add('is-invalid');
                return;
            }
            
            editClaseName.classList.remove('is-invalid');
            const tipo = editClaseModal._tipo;
            const typeInfo = claseTypes[tipo];
            const duration = editClaseDuration.value || '5';
            
            if (editingClaseId) {
                // Editar existente
                const claseItem = document.querySelector(`.clase-item[data-clase-id="${editingClaseId}"]`);
                if (claseItem) {
                    claseItem.querySelector('.clase-name').textContent = name;
                    claseItem.querySelector('.clase-duration').textContent = duration + ' min.';
                }
            } else {
                // Crear nueva
                claseCounter++;
                const newClase = document.createElement('div');
                newClase.className = 'clase-item';
                newClase.setAttribute('data-clase-id', claseCounter);
                newClase.setAttribute('data-tipo', tipo);
                newClase.setAttribute('draggable', 'true');
                newClase.innerHTML = `
                    <div class="drag-handle" title="Arrastra para reordenar">
                        <i class="fas fa-grip-vertical"></i>
                    </div>
                    <div class="clase-info">
                        <i class="fas ${typeInfo.icon} clase-icon ${typeInfo.color}"></i>
                        <span class="clase-name">${name}</span>
                        <span class="clase-duration">${duration} min.</span>
                    </div>
                    <div class="clase-actions">
                        <button type="button" class="btn-clase-edit" title="Editar">
                            <i class="fas fa-pen"></i>
                        </button>
                    </div>
                `;
                clasesContainer.appendChild(newClase);
            }
            
            // Recalcular duración del módulo
            updateModuleDuration();
            
            editClaseModal.hide();
            editingClaseId = null;
        });
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
                
                // Recalcular duración del módulo
                updateModuleDuration();
            }
            deleteClaseModal.hide();
        });
    }
    
    // === GUARDAR MÓDULO ===
    
    if (saveModuleInfo) {
        saveModuleInfo.addEventListener('click', () => {
            if (saveSuccessAlert) {
                saveSuccessAlert.classList.remove('d-none');
                setTimeout(() => saveSuccessAlert.classList.add('d-none'), 3000);
            }
        });
    }
    
    if (moduleEditForm) {
        moduleEditForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const data = {
                id: moduleId,
                name: moduleNameInput.value,
                description: document.getElementById('moduleDescription')?.value,
                duration: document.getElementById('moduleDuration')?.value,
                clases: clasesContainer.children.length
            };
            
            console.log('Guardando módulo:', data);
            
            if (saveSuccessAlert) {
                saveSuccessAlert.classList.remove('d-none');
                setTimeout(() => saveSuccessAlert.classList.add('d-none'), 3000);
            }
        });
    }
    
});