// js/gestorModulos.js - Lógica para Edición de Módulo (Completo H4.1 - H4.5)

document.addEventListener('DOMContentLoaded', () => {
    
    // Variable global para la instancia del editor de texto
    let quillEditor = null;

    // ==========================================
    // 1. SISTEMA DRAG AND DROP (Reordenamiento con soporte táctil)
    // ==========================================
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
            // Transferir ID para compatibilidad
            e.dataTransfer.setData('text/plain', item.dataset.claseId);
        });

        container.addEventListener('dragend', (e) => {
            const item = e.target.closest(itemSelector);
            if (!item) return;

            item.classList.remove('dragging');
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            draggedItem = null;

            // Log del nuevo orden (Simulación de persistencia de orden)
            const newOrder = Array.from(container.querySelectorAll(itemSelector)).map((item, index) => ({
                id: item.getAttribute('data-clase-id'),
                position: index + 1
            }));
            console.log('Nuevo orden guardado:', newOrder);
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necesario para permitir el drop
            e.dataTransfer.dropEffect = 'move';

            const afterElement = getDragAfterElement(container, e.clientY, itemSelector);
            const dragging = container.querySelector('.dragging');

            if (!dragging) return;

            // Limpiar clases visuales previas
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

            // Limpiar clases visuales previas
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

            // Log del nuevo orden (Simulación de persistencia de orden)
            const newOrder = Array.from(container.querySelectorAll(itemSelector)).map((item, index) => ({
                id: item.getAttribute('data-clase-id'),
                position: index + 1
            }));
            console.log('Nuevo orden guardado (táctil):', newOrder);

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
    
    // Cálculo de la posición del drop
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
    
    // ==========================================
    // 2. SELECCIÓN DE ELEMENTOS DOM
    // ==========================================
    const moduleEditForm = document.getElementById('moduleEditForm');
    const moduleNameInput = document.getElementById('moduleName');
    const clasesContainer = document.getElementById('clasesContainer');
    const addClaseBtn = document.getElementById('addClaseBtn');
    const saveModuleInfo = document.getElementById('saveModuleInfo');
    const saveSuccessAlert = document.getElementById('saveSuccessAlert');
    
    // Inicialización de Modales Bootstrap
    const claseTypeModalEl = document.getElementById('claseTypeModal');
    const claseTypeModal = claseTypeModalEl ? new bootstrap.Modal(claseTypeModalEl) : null;
    
    const editClaseModalEl = document.getElementById('editClaseModal');
    const editClaseModal = editClaseModalEl ? new bootstrap.Modal(editClaseModalEl) : null;
    
    const deleteClaseModalEl = document.getElementById('deleteClaseModal');
    const deleteClaseModal = deleteClaseModalEl ? new bootstrap.Modal(deleteClaseModalEl) : null;
    
    // Variables de Estado
    let claseCounter = 4; // ID autoincremental simulado (inicia en 4 por los ejemplos estáticos)
    let editingClaseId = null; // ID de la clase que se está editando actualmente
    let deletingClaseId = null; // ID de la clase a eliminar
    
    // Inicialización al cargar la página
    if (clasesContainer) {
        initDragAndDrop(clasesContainer, '.clase-item');
        updateModuleDuration();
    }
    
    // ==========================================
    // 3. FUNCIONES AUXILIARES GENERALES
    // ==========================================
    
    // Calcular duración total del módulo sumando las clases
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
    
    // Cargar datos simulados del módulo desde URL
    const urlParams = new URLSearchParams(window.location.search);
    const moduleId = urlParams.get('id');
    if (moduleId && moduleNameInput) {
        moduleNameInput.value = `Módulo ${moduleId}: Introducción a la Técnica`;
    }
    
    // Definición de Tipos de Clase (Iconos y Colores)
    const claseTypes = {
        video: { icon: 'fa-play-circle', color: 'text-primary', label: 'Video' },
        texto: { icon: 'fa-file-alt', color: 'text-secondary', label: 'Texto' },
        pdf: { icon: 'fa-file-pdf', color: 'text-danger', label: 'PDF' },
        quiz: { icon: 'fa-question-circle', color: 'text-info', label: 'Quiz' },
        entrega: { icon: 'fa-upload', color: 'text-warning', label: 'Entrega' }
    };
    
    // ==========================================
    // 4. GESTIÓN DE MODALES Y APERTURA
    // ==========================================
    
    // Botón "Agregar Clase" -> Abre selector de tipo
    if (addClaseBtn && claseTypeModal) {
        addClaseBtn.addEventListener('click', () => {
            claseTypeModal.show();
        });
    }
    
    // Click en una opción del selector de tipo
    document.querySelectorAll('.clase-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tipo = this.getAttribute('data-tipo');
            claseTypeModal.hide();
            
            // Configurar para CREAR nueva clase
            editingClaseId = null;
            openEditClaseModal(tipo);
        });
    });
    
    // Función Principal: Abrir Modal de Edición (Crear o Editar)
    function openEditClaseModal(tipo, claseData = null) {
        const modalTitle = document.getElementById('editClaseModalTitle');
        const editClaseName = document.getElementById('editClaseName');
        const editClaseDesc = document.getElementById('editClaseDesc');
        const editClaseDuration = document.getElementById('editClaseDuration');
        const claseContentArea = document.getElementById('claseContentArea');
        const deleteClaseBtn = document.getElementById('deleteClaseBtn');
        
        // Resetear Inputs Básicos
        editClaseName.value = claseData ? claseData.name : '';
        editClaseDesc.value = claseData ? claseData.desc : '';
        editClaseDuration.value = claseData ? claseData.duration : '5';
        editClaseName.classList.remove('is-invalid');

        // Configurar UI del Modal
        const typeInfo = claseTypes[tipo];
        modalTitle.innerHTML = `<i class="fas ${typeInfo.icon} ${typeInfo.color} me-2"></i>${claseData ? 'Editar' : 'Nueva'} Clase - ${typeInfo.label}`;
        deleteClaseBtn.style.display = editingClaseId ? 'inline-flex' : 'none';
            
        // Inyectar el HTML específico según el tipo
        claseContentArea.innerHTML = getContentAreaHTML(tipo);
        editClaseModal._tipo = tipo; // Guardar referencia del tipo actual
        
        // === LÓGICA ESPECÍFICA POR TIPO ===

        // H4.3: Editor Quill (Texto)
        if (quillEditor) quillEditor = null; // Limpiar instancia previa
        if (tipo === 'texto') {
            setTimeout(() => {
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
                    // Cargar contenido si existe
                    if (claseData && claseData.content) {
                        quillEditor.root.innerHTML = claseData.content;
                    }
                }
            }, 100); // Pequeño delay para asegurar renderizado del DOM
        }

        // H4.4: Constructor de Quiz
        if (tipo === 'quiz') {
            initQuizBuilder(); // Inicializar listeners del quiz
            if (claseData && claseData.content) {
                try {
                    const quizData = JSON.parse(claseData.content);
                    const passScore = document.getElementById('quizPassingScore');
                    const instructions = document.getElementById('quizInstructions');
                    
                    if(passScore) passScore.value = quizData.passingScore || 70;
                    if(instructions) instructions.value = quizData.instructions || '';
                    
                    if (quizData.questions && quizData.questions.length > 0) {
                        const emptyMsg = document.querySelector('.empty-quiz-msg');
                        if(emptyMsg) emptyMsg.style.display = 'none';
                        // Reconstruir preguntas guardadas
                        quizData.questions.forEach(q => addQuestionToDOM(q));
                        updateQuizTotalPoints();
                    }
                } catch(e) {
                    console.error("Error cargando quiz:", e);
                }
            }
        }

        // H4.5: Configuración de Entrega Práctica
        if (tipo === 'entrega') {
            if (claseData && claseData.content) {
                try {
                    const entregaData = JSON.parse(claseData.content);
                    const instructions = document.getElementById('entregaInstructions');
                    const points = document.getElementById('entregaPoints');
                    const passing = document.getElementById('entregaPassing');

                    if(instructions) instructions.value = entregaData.instructions || '';
                    if(points) points.value = entregaData.points || 10;
                    if(passing) passing.value = entregaData.passingScore || 70;
                } catch(e) {
                    console.error("Error cargando entrega:", e);
                }
            }
        }
        
        editClaseModal.show();
    }
    
    // Generador de HTML dinámico para el cuerpo del modal
    function getContentAreaHTML(tipo) {
        switch(tipo) {
            case 'video':
                // H4.1: Video simple
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
                // H4.3: Editor enriquecido
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
                // H4.4: Constructor de Quiz
                return `
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Porcentaje de Aprobación</label>
                            <div class="input-group">
                                <input type="number" class="form-control input-kikibrows" id="quizPassingScore" value="70" min="1" max="100">
                                <span class="input-group-text">%</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Puntos Totales</label>
                            <input type="text" class="form-control input-kikibrows bg-light" id="quizTotalPoints" value="0" readonly>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Instrucciones del Quiz</label>
                        <textarea class="form-control input-kikibrows" id="quizInstructions" rows="2" placeholder="Instrucciones para la alumna..."></textarea>
                    </div>
                    <hr class="my-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <label class="form-label mb-0 fw-bold">Preguntas</label>
                        <button type="button" class="btn btn-sm btn-outline-primary" id="btnAddQuestion">
                            <i class="fas fa-plus me-1"></i>Agregar Pregunta
                        </button>
                    </div>
                    <div id="quizQuestionsContainer" class="quiz-questions-list">
                        <div class="text-center text-muted py-3 empty-quiz-msg">No hay preguntas añadidas.</div>
                    </div>
                `;
            case 'entrega': 
                // H4.5: Entrega Práctica (Con Video Demo)
                return `
                    <div class="alert alert-info small border-0 bg-light">
                        <i class="fas fa-info-circle me-2"></i>
                        Esta clase incluirá un video demostrativo tuyo y una casilla para que la alumna suba su video práctico.
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label fw-bold">1. Video Demostrativo (Instructora)</label>
                        <input type="file" class="form-control input-kikibrows" id="videoFileInput" accept=".mp4,.webm">
                        <small class="text-muted">Sube el ejemplo que las alumnas deben imitar.</small>
                        <div id="videoValidationError" class="text-danger small mt-1 d-none"></div>
                    </div>
                    
                    <div class="upload-progress-container mb-4" id="uploadProgress" style="display: none;">
                        <div class="progress-label d-flex justify-content-between mb-1">
                            <span class="small">Subiendo demostración...</span>
                            <span class="small" id="progressPercent">0%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-success" role="progressbar" style="width: 0%"></div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">2. Configuración de la Tarea</label>
                        <label class="form-label small text-muted">Instrucciones para la alumna</label>
                        <textarea class="form-control input-kikibrows" id="entregaInstructions" rows="3" placeholder="Ej: Graba un video de 2 min realizando el perfilado..."></textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label small text-muted">Puntos totales</label>
                            <input type="number" class="form-control input-kikibrows" id="entregaPoints" value="10" min="1">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label small text-muted">Aprobación (%)</label>
                            <div class="input-group">
                                <input type="number" class="form-control input-kikibrows" id="entregaPassing" value="70" min="1" max="100">
                                <span class="input-group-text">%</span>
                            </div>
                        </div>
                    </div>
                `;
            default:
                return '';
        }
    }
    
    // ==========================================
    // 5. EVENTOS: EDITAR Y GUARDAR
    // ==========================================
    
    // Delegación de eventos para el botón "Editar" en la lista
    if (clasesContainer) {
        clasesContainer.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-clase-edit');
            if (editBtn) {
                const claseItem = editBtn.closest('.clase-item');
                
                // Extraer datos actuales del DOM
                editingClaseId = claseItem.getAttribute('data-clase-id');
                const tipo = claseItem.getAttribute('data-tipo');
                const name = claseItem.querySelector('.clase-name').textContent.trim();
                const savedContent = claseItem.getAttribute('data-content') || '';
                
                // Limpiar prefijo "Clase X: " del nombre si existe
                const cleanName = name.includes(': ') ? name.split(': ')[1] : name;

                openEditClaseModal(tipo, {
                    name: cleanName,
                    desc: '', // Descripción simplificada en este MVP
                    duration: claseItem.querySelector('.clase-duration')?.textContent.replace(' min.', '') || '5',
                    content: savedContent 
                });
            }
        });
    }
    
    // Botón GUARDAR en el Modal
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

            // --- 5.1 PREPARAR CONTENIDO ESPECIAL (JSON) ---
            let contentData = null;

            if (tipo === 'texto' && quillEditor) {
                contentData = quillEditor.root.innerHTML;
            } 
            else if (tipo === 'quiz') {
                // Recopilar estructura del Quiz
                const questions = [];
                document.querySelectorAll('.quiz-question-card').forEach(card => {
                    const qTitle = card.querySelector('.question-title-input').value;
                    const qPoints = card.querySelector('.question-points-input').value;
                    const options = [];
                    card.querySelectorAll('.option-item').forEach(opt => {
                        options.push({
                            text: opt.querySelector('.option-text-input').value,
                            isCorrect: opt.querySelector('.option-correct-input').checked
                        });
                    });
                    questions.push({ title: qTitle, points: parseInt(qPoints) || 0, options: options });
                });

                const quizData = {
                    passingScore: document.getElementById('quizPassingScore').value,
                    instructions: document.getElementById('quizInstructions').value,
                    questions: questions
                };
                contentData = JSON.stringify(quizData);
            }
            else if (tipo === 'entrega') {
                // Recopilar configuración de Entrega
                const entregaData = {
                    instructions: document.getElementById('entregaInstructions').value,
                    points: document.getElementById('entregaPoints').value,
                    passingScore: document.getElementById('entregaPassing').value,
                    hasVideo: true // Flag indicando que se subió (o se subirá) video demo
                };
                contentData = JSON.stringify(entregaData);
            }

            // --- 5.2 VALIDACIÓN Y SUBIDA DE VIDEO (H4.1 + H4.5) ---
            // Aplica si es 'video' o 'entrega' Y si es una creación nueva (para simplificar MVP)
            const needsUpload = (tipo === 'video' || tipo === 'entrega') && !editingClaseId;

            if (needsUpload) {
                const fileInput = document.getElementById('videoFileInput');
                const errorMsg = document.getElementById('videoValidationError');
                const file = fileInput.files[0];

                // Validaciones de Archivo
                if (!file) {
                    errorMsg.textContent = "Debes seleccionar un archivo de video.";
                    errorMsg.classList.remove('d-none');
                    return;
                }
                if (file.size > 500 * 1024 * 1024) { // 500MB
                    errorMsg.textContent = "El archivo supera los 500MB permitidos.";
                    errorMsg.classList.remove('d-none');
                    return;
                }
                if (!['video/mp4', 'video/webm'].includes(file.type)) {
                    errorMsg.textContent = "Formato no válido. Solo MP4 o WEBM.";
                    errorMsg.classList.remove('d-none');
                    return;
                }
                errorMsg.classList.add('d-none');

                // Mostrar progreso de subida
                const progressContainer = document.getElementById('uploadProgress');
                const progressBar = progressContainer.querySelector('.progress-bar');
                const progressPercent = document.getElementById('progressPercent');

                progressContainer.style.display = 'block';
                saveClaseBtn.disabled = true;
                saveClaseBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Subiendo...';

                // Obtener cursoId de la URL o usar 'general'
                const urlParams = new URLSearchParams(window.location.search);
                const cursoId = urlParams.get('curso') || 'general';

                // Subida real a Supabase Storage (si el servicio está disponible)
                if (typeof window.AdminCursosService !== 'undefined') {
                    // Usar servicio real
                    window.AdminCursosService.subirVideo(file, cursoId, 'clase_' + Date.now())
                        .then(result => {
                            progressBar.style.width = '100%';
                            progressPercent.textContent = '100%';

                            if (result.success) {
                                console.log('Video subido a Supabase:', result.url);
                                // Guardar URL del contenido en contentData
                                const claseDataWithVideo = {
                                    ...JSON.parse(contentData || '{}'),
                                    contenido_url: result.url
                                };
                                finishSaveClase(name, editClaseDuration.value || '5', tipo, JSON.stringify(claseDataWithVideo), result.url);
                            } else {
                                errorMsg.textContent = result.error || 'Error al subir video';
                                errorMsg.classList.remove('d-none');
                                progressContainer.style.display = 'none';
                            }

                            saveClaseBtn.disabled = false;
                            saveClaseBtn.textContent = 'Guardar';
                        })
                        .catch(err => {
                            console.error('Error subiendo video:', err);
                            errorMsg.textContent = 'Error de conexión al subir video';
                            errorMsg.classList.remove('d-none');
                            progressContainer.style.display = 'none';
                            saveClaseBtn.disabled = false;
                            saveClaseBtn.textContent = 'Guardar';
                        });
                } else {
                    // Fallback: Simulación visual si el servicio no está cargado
                    console.warn('AdminCursosService no disponible, usando simulación');
                    let width = 0;
                    const interval = setInterval(() => {
                        if (width >= 100) {
                            clearInterval(interval);
                            finishSaveClase(name, editClaseDuration.value || '5', tipo, contentData);
                            saveClaseBtn.disabled = false;
                            saveClaseBtn.textContent = 'Guardar';
                        } else {
                            width += 5;
                            progressBar.style.width = width + '%';
                            progressPercent.textContent = width + '%';
                        }
                    }, 100);
                }
                return; // IMPORTANTE: Detener ejecución aquí, finishSaveClase se llama en el callback
            }

            // --- 5.3 GUARDADO INMEDIATO (Si no hay subida) ---
            finishSaveClase(name, editClaseDuration.value || '5', tipo, contentData);
        });
    }

    // ==========================================
    // 6. ACTUALIZACIÓN DE LA LISTA EN EL DOM
    // ==========================================
    function finishSaveClase(name, duration, tipo, customContent = null, videoUrl = null) {
        const typeInfo = claseTypes[tipo];

        if (editingClaseId) {
            // --- EDITANDO ---
            const claseItem = document.querySelector(`.clase-item[data-clase-id="${editingClaseId}"]`);
            if (claseItem) {
                claseItem.querySelector('.clase-name').textContent = `Clase ${editingClaseId}: ${name}`;
                claseItem.querySelector('.clase-duration').textContent = duration + ' min.';
                // Actualizar metadata guardada
                if (customContent !== null) {
                    claseItem.setAttribute('data-content', customContent);
                }
                // Actualizar URL del contenido si existe
                if (videoUrl) {
                    claseItem.setAttribute('data-contenido-url', videoUrl);
                }
            }
        } else {
            // --- CREANDO ---
            claseCounter++;
            const newClase = document.createElement('div');
            newClase.className = 'clase-item';
            newClase.setAttribute('data-clase-id', claseCounter);
            newClase.setAttribute('data-tipo', tipo);
            newClase.setAttribute('draggable', 'true');

            // Guardar contenido rico
            if (customContent !== null) {
                newClase.setAttribute('data-content', customContent);
            }

            // Guardar URL del contenido si se subió a Supabase
            if (videoUrl) {
                newClase.setAttribute('data-contenido-url', videoUrl);
                console.log('Contenido URL guardada en elemento:', videoUrl);
            }

            let actionsHTML = '';

            // Agregar botón Play si tiene video asociado (Video o Entrega)
            if (tipo === 'video' || tipo === 'entrega') {
                actionsHTML += `
                    <button type="button" class="btn-clase-play" title="Previsualizar Video" onclick="previewVideo('${name}', this)">
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
        
        updateModuleDuration();
        editClaseModal.hide();
        editingClaseId = null;
    }
    
    // ==========================================
    // 7. ELIMINAR CLASE
    // ==========================================
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
    
    // Guardar Todo el Módulo (Simulación Final)
    if (moduleEditForm) {
        moduleEditForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (saveSuccessAlert) {
                saveSuccessAlert.classList.remove('d-none');
                setTimeout(() => saveSuccessAlert.classList.add('d-none'), 3000);
            }
        });
    }
    
    // ==========================================
    // 8. PREVISUALIZACIÓN DE VIDEO (GLOBAL)
    // ==========================================
    window.previewVideo = function(title) {
        const videoModal = new bootstrap.Modal(document.getElementById('videoPreviewModal'));
        document.getElementById('videoPreviewTitle').textContent = title;
        // Aquí asignarías el src real. Para demo está vacío o estático.
        // document.getElementById('videoPlayer').src = "URL_DEL_VIDEO";
        
        videoModal.show();
        
        // Pausar video al cerrar modal
        document.getElementById('videoPreviewModal').addEventListener('hidden.bs.modal', () => {
            const player = document.getElementById('videoPlayer');
            if(player) player.pause();
        }, { once: true });
    };

    // ==========================================
    // 9. LOGICA DEL CONSTRUCTOR DE QUIZ
    // ==========================================
    
    function initQuizBuilder() {
        const btnAdd = document.getElementById('btnAddQuestion');
        if (btnAdd) {
            // Clonar para limpiar listeners antiguos y evitar duplicados
            const newBtn = btnAdd.cloneNode(true);
            btnAdd.parentNode.replaceChild(newBtn, btnAdd);
            
            newBtn.addEventListener('click', () => {
                const emptyMsg = document.querySelector('.empty-quiz-msg');
                if(emptyMsg) emptyMsg.style.display = 'none';
                addQuestionToDOM();
            });
        }
    }

    function addQuestionToDOM(data = null) {
        const container = document.getElementById('quizQuestionsContainer');
        const qId = Date.now() + Math.random().toString(16).slice(2);
        const title = data ? data.title : '';
        const points = data ? data.points : 10;
        
        const card = document.createElement('div');
        card.className = 'card quiz-question-card mb-3 border-light shadow-sm';
        card.innerHTML = `
            <div class="card-body p-3 bg-light rounded">
                <div class="d-flex justify-content-between mb-2">
                    <h6 class="fw-bold text-muted mb-0"><i class="fas fa-question-circle me-1"></i>Pregunta</h6>
                    <button type="button" class="btn btn-sm text-danger btn-remove-question"><i class="fas fa-trash"></i></button>
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-9">
                        <input type="text" class="form-control form-control-sm question-title-input" placeholder="Escribe el enunciado..." value="${title}">
                    </div>
                    <div class="col-3">
                        <div class="input-group input-group-sm">
                            <input type="number" class="form-control question-points-input" placeholder="Pts" value="${points}" min="1">
                            <span class="input-group-text">pts</span>
                        </div>
                    </div>
                </div>
                <div class="options-container ps-3 border-start border-3 border-secondary-subtle">
                    </div>
                <button type="button" class="btn btn-sm btn-link text-decoration-none p-0 mt-2 btn-add-option">+ Agregar Opción</button>
            </div>
        `;

        // Eliminar Pregunta
        card.querySelector('.btn-remove-question').addEventListener('click', () => {
            card.remove();
            updateQuizTotalPoints();
        });

        const optionsContainer = card.querySelector('.options-container');
        
        // Función Agregar Opción
        const addOption = (optData = null) => {
            const optText = optData ? optData.text : '';
            const isCorrect = optData ? optData.isCorrect : false;
            
            const optRow = document.createElement('div');
            optRow.className = 'option-item d-flex align-items-center mb-2';
            optRow.innerHTML = `
                <input type="radio" name="correct_${qId}" class="form-check-input me-2 option-correct-input" ${isCorrect ? 'checked' : ''} title="Respuesta Correcta">
                <input type="text" class="form-control form-control-sm me-2 option-text-input" placeholder="Respuesta..." value="${optText}">
                <button type="button" class="btn btn-sm text-muted py-0 px-1 btn-remove-option"><i class="fas fa-times"></i></button>
            `;
            
            optRow.querySelector('.btn-remove-option').addEventListener('click', () => optRow.remove());
            optionsContainer.appendChild(optRow);
        };

        card.querySelector('.btn-add-option').addEventListener('click', () => addOption());

        // Cargar opciones iniciales
        if (data && data.options) {
            data.options.forEach(opt => addOption(opt));
        } else {
            addOption();
            addOption();
        }

        // Escuchar cambios en puntos para actualizar total
        card.querySelector('.question-points-input').addEventListener('input', updateQuizTotalPoints);

        container.appendChild(card);
        updateQuizTotalPoints();
    }

    // Calcular puntos totales del quiz
    function updateQuizTotalPoints() {
        let total = 0;
        document.querySelectorAll('.question-points-input').forEach(input => {
            total += parseInt(input.value) || 0;
        });
        const totalInput = document.getElementById('quizTotalPoints');
        if(totalInput) totalInput.value = total;
    }
    
});