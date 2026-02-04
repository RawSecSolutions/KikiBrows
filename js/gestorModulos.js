// js/gestorModulos.js - Gestor de Módulos conectado a Supabase
// Versión corregida: carga clases reales, botón confirmar funcional, sin duplicados

import { AdminCursosService } from './adminCursosService.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. VARIABLES GLOBALES Y ESTADO
    // ==========================================
    
    let quillEditor = null;
    let moduleId = null;      // ID del módulo actual (UUID de Supabase)
    let cursoId = null;       // ID del curso padre
    let editingClaseId = null; // ID de la clase que se está editando
    let deletingClaseId = null; // ID de la clase a eliminar
    let clasesData = [];       // Array de clases cargadas desde Supabase
    
    // Tipos de clase con sus iconos y colores
    const claseTypes = {
        video: { icon: 'fa-play-circle', color: 'text-primary', label: 'Video', dbType: 'VIDEO' },
        texto: { icon: 'fa-file-alt', color: 'text-secondary', label: 'Texto', dbType: 'TEXTO' },
        pdf: { icon: 'fa-file-pdf', color: 'text-danger', label: 'PDF', dbType: 'PDF' },
        quiz: { icon: 'fa-question-circle', color: 'text-info', label: 'Quiz', dbType: 'QUIZ' },
        entrega: { icon: 'fa-upload', color: 'text-warning', label: 'Entrega', dbType: 'ENTREGA' }
    };
    
    // Mapeo inverso: de tipo DB a tipo interno
    const dbTypeToInternal = {
        'VIDEO': 'video',
        'TEXTO': 'texto',
        'PDF': 'pdf',
        'QUIZ': 'quiz',
        'ENTREGA': 'entrega'
    };
    
    // ==========================================
    // 2. SELECCIÓN DE ELEMENTOS DOM
    // ==========================================
    
    const moduleNameInput = document.getElementById('moduleName');
    const clasesContainer = document.getElementById('clasesContainer');
    const clasesLoading = document.getElementById('clasesLoading');
    const clasesEmpty = document.getElementById('clasesEmpty');
    const addClaseBtn = document.getElementById('addClaseBtn');
    const saveModuleInfo = document.getElementById('saveModuleInfo');
    const saveSuccessAlert = document.getElementById('saveSuccessAlert');
    const saveSuccessMessage = document.getElementById('saveSuccessMessage');
    const backToCourse = document.getElementById('backToCourse');
    const btnVolverCurso = document.getElementById('btnVolverCurso');
    
    // Modales
    const claseTypeModalEl = document.getElementById('claseTypeModal');
    const claseTypeModal = claseTypeModalEl ? new bootstrap.Modal(claseTypeModalEl) : null;
    
    const editClaseModalEl = document.getElementById('editClaseModal');
    const editClaseModal = editClaseModalEl ? new bootstrap.Modal(editClaseModalEl) : null;
    
    const deleteClaseModalEl = document.getElementById('deleteClaseModal');
    const deleteClaseModal = deleteClaseModalEl ? new bootstrap.Modal(deleteClaseModalEl) : null;
    
    // ==========================================
    // 3. INICIALIZACIÓN - CARGAR DATOS
    // ==========================================
    
    async function init() {
        // Obtener IDs de la URL
        const urlParams = new URLSearchParams(window.location.search);
        moduleId = urlParams.get('id');
        cursoId = urlParams.get('curso');
        
        if (!moduleId) {
            showError('No se especificó el módulo a editar');
            return;
        }
        
        // Actualizar enlaces de "Volver"
        if (cursoId) {
            const volverUrl = `creaCurso.html?id=${cursoId}`;
            if (backToCourse) backToCourse.href = volverUrl;
            if (btnVolverCurso) btnVolverCurso.href = volverUrl;
        }
        
        // Cargar datos del módulo
        await cargarModulo();
        
        // Cargar clases del módulo
        await cargarClases();
        
        // Inicializar drag and drop
        if (clasesContainer) {
            initDragAndDrop(clasesContainer, '.clase-item');
        }
    }
    
    // Cargar información del módulo desde Supabase
    async function cargarModulo() {
        try {
            // Usar el servicio para obtener el módulo
            const { data, error } = await window.AdminCursosService.supabase
                .from('modulos')
                .select('id, nombre, curso_id, orden')
                .eq('id', moduleId)
                .single();
            
            if (error) throw error;
            
            if (data) {
                moduleNameInput.value = data.nombre || '';
                cursoId = data.curso_id; // Actualizar cursoId si no venía en URL
                
                // Actualizar enlaces de volver
                if (cursoId) {
                    const volverUrl = `creaCurso.html?id=${cursoId}`;
                    if (backToCourse) backToCourse.href = volverUrl;
                    if (btnVolverCurso) btnVolverCurso.href = volverUrl;
                }
            }
        } catch (error) {
            console.error('Error al cargar módulo:', error);
            showError('Error al cargar el módulo');
        }
    }
    
    // Cargar clases del módulo desde Supabase
    async function cargarClases() {
        try {
            clasesLoading.classList.remove('d-none');
            clasesContainer.classList.add('d-none');
            clasesEmpty.classList.add('d-none');
            
            const { data, error } = await window.AdminCursosService.supabase
                .from('clases')
                .select('*')
                .eq('modulo_id', moduleId)
                .order('orden', { ascending: true });
            
            if (error) throw error;
            
            clasesData = data || [];
            
            // Ocultar loading
            clasesLoading.classList.add('d-none');
            
            if (clasesData.length === 0) {
                // Mostrar estado vacío
                clasesEmpty.classList.remove('d-none');
            } else {
                // Renderizar clases
                renderClases();
                clasesContainer.classList.remove('d-none');
            }
            
            updateModuleDuration();
            
        } catch (error) {
            console.error('Error al cargar clases:', error);
            clasesLoading.classList.add('d-none');
            showError('Error al cargar las clases');
        }
    }
    
    // Renderizar lista de clases en el DOM
    function renderClases() {
        clasesContainer.innerHTML = '';
        
        clasesData.forEach((clase, index) => {
            const tipoInterno = dbTypeToInternal[clase.tipo] || 'video';
            const typeInfo = claseTypes[tipoInterno];
            
            const claseEl = document.createElement('div');
            claseEl.className = 'clase-item';
            claseEl.setAttribute('data-clase-id', clase.id);
            claseEl.setAttribute('data-tipo', tipoInterno);
            claseEl.setAttribute('draggable', 'true');
            
            // Guardar datos adicionales
            if (clase.contenido_texto) {
                claseEl.setAttribute('data-content', clase.contenido_texto);
            }
            if (clase.contenido_url) {
                claseEl.setAttribute('data-contenido-url', clase.contenido_url);
            }
            if (clase.metadata) {
                claseEl.setAttribute('data-metadata', JSON.stringify(clase.metadata));
            }
            
            // Botones de acción
            let actionsHTML = '';
            if (tipoInterno === 'video' || tipoInterno === 'entrega') {
                if (clase.contenido_url) {
                    actionsHTML += `
                        <button type="button" class="btn-clase-play" title="Previsualizar Video">
                            <i class="fas fa-play"></i>
                        </button>
                    `;
                }
            }
            actionsHTML += `
                <button type="button" class="btn-clase-edit" title="Editar">
                    <i class="fas fa-pen"></i>
                </button>
            `;
            
            claseEl.innerHTML = `
                <div class="drag-handle" title="Arrastra para reordenar">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="clase-info">
                    <i class="fas ${typeInfo.icon} clase-icon ${typeInfo.color}"></i>
                    <span class="clase-name">${clase.nombre}</span>
                    <span class="clase-duration">${clase.duracion || 5} min.</span>
                </div>
                <div class="clase-actions">
                    ${actionsHTML}
                </div>
            `;
            
            clasesContainer.appendChild(claseEl);
        });
    }
    
    // ==========================================
    // 4. BOTÓN CONFIRMAR - GUARDAR NOMBRE MÓDULO
    // ==========================================
    
    if (saveModuleInfo) {
        saveModuleInfo.addEventListener('click', async () => {
            const nombre = moduleNameInput.value.trim();
            
            if (!nombre) {
                moduleNameInput.classList.add('is-invalid');
                return;
            }
            moduleNameInput.classList.remove('is-invalid');
            
            // Deshabilitar botón mientras guarda
            saveModuleInfo.disabled = true;
            saveModuleInfo.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            
            try {
                const result = await AdminCursosService.actualizarModulo(moduleId, {
                    nombre: nombre
                });
                
                if (result.success) {
                    showSuccess('Nombre del módulo actualizado');
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Error al guardar módulo:', error);
                showError('Error al guardar el nombre del módulo');
            } finally {
                saveModuleInfo.disabled = false;
                saveModuleInfo.innerHTML = '<i class="fas fa-check me-2"></i>Confirmar';
            }
        });
    }
    
    // ==========================================
    // 5. CREAR NUEVA CLASE
    // ==========================================
    
    // Botón "Crear" -> Abre selector de tipo
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
    
    // ==========================================
    // 6. MODAL DE EDICIÓN DE CLASE
    // ==========================================
    
    function openEditClaseModal(tipo, claseData = null) {
        const modalTitle = document.getElementById('editClaseModalTitle');
        const editClaseName = document.getElementById('editClaseName');
        const editClaseDesc = document.getElementById('editClaseDesc');
        const editClaseDuration = document.getElementById('editClaseDuration');
        const claseContentArea = document.getElementById('claseContentArea');
        const deleteClaseBtn = document.getElementById('deleteClaseBtn');
        
        // Resetear inputs
        editClaseName.value = claseData ? claseData.nombre : '';
        editClaseDesc.value = claseData ? (claseData.descripcion || '') : '';
        editClaseDuration.value = claseData ? (claseData.duracion || 5) : '5';
        editClaseName.classList.remove('is-invalid');
        
        // Configurar UI del modal
        const typeInfo = claseTypes[tipo];
        modalTitle.innerHTML = `<i class="fas ${typeInfo.icon} ${typeInfo.color} me-2"></i>${claseData ? 'Editar' : 'Nueva'} Clase - ${typeInfo.label}`;
        deleteClaseBtn.style.display = editingClaseId ? 'inline-flex' : 'none';
        
        // Inyectar HTML específico según tipo
        claseContentArea.innerHTML = getContentAreaHTML(tipo);
        editClaseModal._tipo = tipo;
        
        // Limpiar editor Quill previo
        if (quillEditor) quillEditor = null;
        
        // Lógica específica por tipo
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
                    if (claseData && claseData.contenido_texto) {
                        quillEditor.root.innerHTML = claseData.contenido_texto;
                    }
                }
            }, 100);
        }
        
        if (tipo === 'quiz') {
            initQuizBuilder();
            if (claseData && claseData.metadata) {
                try {
                    const quizData = typeof claseData.metadata === 'string' 
                        ? JSON.parse(claseData.metadata) 
                        : claseData.metadata;
                    
                    const passScore = document.getElementById('quizPassingScore');
                    const instructions = document.getElementById('quizInstructions');
                    
                    if (passScore) passScore.value = quizData.passingScore || 70;
                    if (instructions) instructions.value = quizData.instructions || '';
                    
                    if (quizData.questions && quizData.questions.length > 0) {
                        const emptyMsg = document.querySelector('.empty-quiz-msg');
                        if (emptyMsg) emptyMsg.style.display = 'none';
                        quizData.questions.forEach(q => addQuestionToDOM(q));
                        updateQuizTotalPoints();
                    }
                } catch (e) {
                    console.error("Error cargando quiz:", e);
                }
            }
        }
        
        if (tipo === 'entrega') {
            if (claseData && claseData.metadata) {
                try {
                    const entregaData = typeof claseData.metadata === 'string'
                        ? JSON.parse(claseData.metadata)
                        : claseData.metadata;
                    
                    const instructions = document.getElementById('entregaInstructions');
                    const points = document.getElementById('entregaPoints');
                    const passing = document.getElementById('entregaPassing');
                    
                    if (instructions) instructions.value = entregaData.instructions || '';
                    if (points) points.value = entregaData.points || 10;
                    if (passing) passing.value = entregaData.passingScore || 70;
                } catch (e) {
                    console.error("Error cargando entrega:", e);
                }
            }
        }
        
        editClaseModal.show();
    }
    
    // Generador de HTML dinámico para el contenido del modal
    function getContentAreaHTML(tipo) {
        switch(tipo) {
            case 'video':
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
                return `
                    <div class="mb-3">
                        <label class="form-label">Contenido de la lección</label>
                        <div id="editor-container" style="height: 200px; background: white;"></div>
                    </div>
                `;
            case 'pdf':
                return `
                    <div class="mb-3">
                        <label class="form-label">Archivo PDF</label>
                        <input type="file" class="form-control input-kikibrows" id="pdfFileInput" accept=".pdf">
                        <small class="text-muted">Solo archivos PDF • Máx 50MB</small>
                        <div id="pdfValidationError" class="text-danger small mt-1 d-none"></div>
                    </div>
                    <div class="upload-progress-container" id="uploadProgress" style="display: none;">
                        <div class="progress-label d-flex justify-content-between mb-1">
                            <span class="small">Subiendo PDF...</span>
                            <span class="small" id="progressPercent">0%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-success" role="progressbar" style="width: 0%"></div>
                        </div>
                    </div>
                `;
            case 'quiz':
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
                return `
                    <div class="alert alert-info small border-0 bg-light">
                        <i class="fas fa-info-circle me-2"></i>
                        Esta clase incluirá un video demostrativo y una casilla para que la alumna suba su práctica.
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
    // 7. EDITAR CLASE EXISTENTE
    // ==========================================
    
    if (clasesContainer) {
        clasesContainer.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-clase-edit');
            const playBtn = e.target.closest('.btn-clase-play');
            
            if (editBtn) {
                const claseItem = editBtn.closest('.clase-item');
                editingClaseId = claseItem.getAttribute('data-clase-id');
                const tipoInterno = claseItem.getAttribute('data-tipo');
                
                // Buscar datos completos de la clase
                const claseData = clasesData.find(c => c.id === editingClaseId);
                
                if (claseData) {
                    openEditClaseModal(tipoInterno, claseData);
                }
            }
            
            if (playBtn) {
                const claseItem = playBtn.closest('.clase-item');
                const videoUrl = claseItem.getAttribute('data-contenido-url');
                const nombre = claseItem.querySelector('.clase-name').textContent;
                
                if (videoUrl) {
                    previewVideo(nombre, videoUrl);
                }
            }
        });
    }
    
    // ==========================================
    // 8. GUARDAR CLASE (CREAR O ACTUALIZAR)
    // ==========================================
    
    const saveClaseBtn = document.getElementById('saveClaseBtn');
    if (saveClaseBtn) {
        saveClaseBtn.addEventListener('click', async () => {
            const editClaseName = document.getElementById('editClaseName');
            const editClaseDesc = document.getElementById('editClaseDesc');
            const editClaseDuration = document.getElementById('editClaseDuration');
            const nombre = editClaseName.value.trim();
            const descripcion = editClaseDesc.value.trim();
            const duracion = parseInt(editClaseDuration.value) || 5;
            const tipo = editClaseModal._tipo;
            
            // Validación básica
            if (!nombre) {
                editClaseName.classList.add('is-invalid');
                return;
            }
            editClaseName.classList.remove('is-invalid');
            
            // Preparar datos según tipo
            let contenidoTexto = null;
            let contenidoUrl = null;
            let metadata = null;
            
            // Texto - Editor Quill
            if (tipo === 'texto' && quillEditor) {
                contenidoTexto = quillEditor.root.innerHTML;
            }
            
            // Quiz
            if (tipo === 'quiz') {
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
                    questions.push({ title: qTitle, points: parseInt(qPoints) || 0, options });
                });
                
                metadata = {
                    passingScore: document.getElementById('quizPassingScore').value,
                    instructions: document.getElementById('quizInstructions').value,
                    questions: questions
                };
            }
            
            // Entrega
            if (tipo === 'entrega') {
                metadata = {
                    instructions: document.getElementById('entregaInstructions').value,
                    points: document.getElementById('entregaPoints').value,
                    passingScore: document.getElementById('entregaPassing').value
                };
            }
            
            // Manejar subida de archivos (Video o PDF)
            const videoInput = document.getElementById('videoFileInput');
            const pdfInput = document.getElementById('pdfFileInput');
            
            if ((tipo === 'video' || tipo === 'entrega') && videoInput && videoInput.files[0]) {
                // Subir video
                const result = await handleVideoUpload(videoInput.files[0]);
                if (!result.success) return;
                contenidoUrl = result.url;
            }
            
            if (tipo === 'pdf' && pdfInput && pdfInput.files[0]) {
                // Subir PDF
                const result = await handlePdfUpload(pdfInput.files[0]);
                if (!result.success) return;
                contenidoUrl = result.url;
            }
            
            // Guardar en Supabase
            saveClaseBtn.disabled = true;
            saveClaseBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            
            try {
                const clasePayload = {
                    nombre: nombre,
                    descripcion: descripcion || null,
                    duracion: duracion,
                    tipo: claseTypes[tipo].dbType,
                    contenido_texto: contenidoTexto,
                    metadata: metadata
                };
                
                // Solo incluir contenido_url si hay uno nuevo
                if (contenidoUrl) {
                    clasePayload.contenido_url = contenidoUrl;
                }
                
                let result;
                
                if (editingClaseId) {
                    // Actualizar clase existente
                    result = await AdminCursosService.actualizarClase(editingClaseId, clasePayload);
                } else {
                    // Crear nueva clase
                    clasePayload.modulo_id = moduleId;
                    clasePayload.orden = clasesData.length + 1;
                    result = await AdminCursosService.crearClase(clasePayload);
                }
                
                if (result.success) {
                    editClaseModal.hide();
                    await cargarClases(); // Recargar lista
                    showSuccess(editingClaseId ? 'Clase actualizada' : 'Clase creada');
                } else {
                    throw new Error(result.error);
                }
                
            } catch (error) {
                console.error('Error al guardar clase:', error);
                showError('Error al guardar la clase');
            } finally {
                saveClaseBtn.disabled = false;
                saveClaseBtn.innerHTML = 'Guardar';
                editingClaseId = null;
            }
        });
    }
    
    // Manejar subida de video
    async function handleVideoUpload(file) {
        const errorMsg = document.getElementById('videoValidationError');
        const progressContainer = document.getElementById('uploadProgress');
        const progressBar = progressContainer?.querySelector('.progress-bar');
        const progressPercent = document.getElementById('progressPercent');
        
        // Validaciones
        if (file.size > 500 * 1024 * 1024) {
            errorMsg.textContent = "El archivo supera los 500MB permitidos.";
            errorMsg.classList.remove('d-none');
            return { success: false };
        }
        if (!['video/mp4', 'video/webm'].includes(file.type)) {
            errorMsg.textContent = "Formato no válido. Solo MP4 o WEBM.";
            errorMsg.classList.remove('d-none');
            return { success: false };
        }
        errorMsg.classList.add('d-none');
        
        // Mostrar progreso
        if (progressContainer) progressContainer.style.display = 'block';
        
        try {
            const result = await AdminCursosService.subirVideo(file, cursoId || 'general', 'clase_' + Date.now());
            
            if (progressBar) progressBar.style.width = '100%';
            if (progressPercent) progressPercent.textContent = '100%';
            
            if (!result.success) {
                errorMsg.textContent = result.error || 'Error al subir video';
                errorMsg.classList.remove('d-none');
                if (progressContainer) progressContainer.style.display = 'none';
                return { success: false };
            }
            
            return { success: true, url: result.url };
            
        } catch (error) {
            console.error('Error subiendo video:', error);
            errorMsg.textContent = 'Error de conexión al subir video';
            errorMsg.classList.remove('d-none');
            if (progressContainer) progressContainer.style.display = 'none';
            return { success: false };
        }
    }
    
    // Manejar subida de PDF
    async function handlePdfUpload(file) {
        const errorMsg = document.getElementById('pdfValidationError');
        const progressContainer = document.getElementById('uploadProgress');
        const progressBar = progressContainer?.querySelector('.progress-bar');
        const progressPercent = document.getElementById('progressPercent');
        
        // Validaciones
        if (file.size > 50 * 1024 * 1024) {
            errorMsg.textContent = "El archivo supera los 50MB permitidos.";
            errorMsg.classList.remove('d-none');
            return { success: false };
        }
        if (file.type !== 'application/pdf') {
            errorMsg.textContent = "El archivo debe ser PDF.";
            errorMsg.classList.remove('d-none');
            return { success: false };
        }
        errorMsg.classList.add('d-none');
        
        // Mostrar progreso
        if (progressContainer) progressContainer.style.display = 'block';
        
        try {
            const result = await AdminCursosService.subirPDF(file, cursoId || 'general', 'clase_' + Date.now());
            
            if (progressBar) progressBar.style.width = '100%';
            if (progressPercent) progressPercent.textContent = '100%';
            
            if (!result.success) {
                errorMsg.textContent = result.error || 'Error al subir PDF';
                errorMsg.classList.remove('d-none');
                if (progressContainer) progressContainer.style.display = 'none';
                return { success: false };
            }
            
            return { success: true, url: result.url };
            
        } catch (error) {
            console.error('Error subiendo PDF:', error);
            errorMsg.textContent = 'Error de conexión al subir PDF';
            errorMsg.classList.remove('d-none');
            if (progressContainer) progressContainer.style.display = 'none';
            return { success: false };
        }
    }
    
    // ==========================================
    // 9. ELIMINAR CLASE
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
        confirmDeleteClase.addEventListener('click', async () => {
            if (!deletingClaseId) return;
            
            confirmDeleteClase.disabled = true;
            confirmDeleteClase.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Eliminando...';
            
            try {
                const result = await AdminCursosService.eliminarClase(deletingClaseId);
                
                if (result.success) {
                    deleteClaseModal.hide();
                    await cargarClases();
                    showSuccess('Clase eliminada');
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Error al eliminar clase:', error);
                showError('Error al eliminar la clase');
            } finally {
                confirmDeleteClase.disabled = false;
                confirmDeleteClase.innerHTML = 'Eliminar';
                deletingClaseId = null;
            }
        });
    }
    
    // ==========================================
    // 10. DRAG AND DROP - REORDENAR CLASES
    // ==========================================
    
    function initDragAndDrop(container, itemSelector) {
        let draggedItem = null;
        
        container.addEventListener('dragstart', (e) => {
            const item = e.target.closest(itemSelector);
            if (!item) return;
            draggedItem = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        container.addEventListener('dragend', async (e) => {
            const item = e.target.closest(itemSelector);
            if (!item) return;
            
            item.classList.remove('dragging');
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            draggedItem = null;
            
            // Guardar nuevo orden en Supabase
            const newOrder = Array.from(container.querySelectorAll(itemSelector)).map((item, index) => ({
                id: item.getAttribute('data-clase-id'),
                orden: index + 1
            }));
            
            try {
                await AdminCursosService.actualizarOrdenClases(newOrder);
                console.log('Orden actualizado:', newOrder);
            } catch (error) {
                console.error('Error al actualizar orden:', error);
            }
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
    
    // ==========================================
    // 11. UTILIDADES
    // ==========================================
    
    function updateModuleDuration() {
        let totalMinutes = 0;
        
        clasesData.forEach(clase => {
            totalMinutes += clase.duracion || 0;
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
    
    function showSuccess(message) {
        if (saveSuccessAlert && saveSuccessMessage) {
            saveSuccessMessage.textContent = message;
            saveSuccessAlert.classList.remove('d-none');
            setTimeout(() => saveSuccessAlert.classList.add('d-none'), 3000);
        }
    }
    
    function showError(message) {
        console.error(message);
        // Podrías mostrar un toast o alert aquí
        alert(message);
    }
    
    // Previsualizar video
    function previewVideo(title, videoUrl) {
        const videoModal = new bootstrap.Modal(document.getElementById('videoPreviewModal'));
        document.getElementById('videoPreviewTitle').textContent = title;
        
        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.src = videoUrl;
        
        videoModal.show();
        
        document.getElementById('videoPreviewModal').addEventListener('hidden.bs.modal', () => {
            videoPlayer.pause();
            videoPlayer.src = '';
        }, { once: true });
    }
    
    // Exponer función globalmente
    window.previewVideo = previewVideo;
    
    // ==========================================
    // 12. CONSTRUCTOR DE QUIZ
    // ==========================================
    
    function initQuizBuilder() {
        const btnAdd = document.getElementById('btnAddQuestion');
        if (btnAdd) {
            const newBtn = btnAdd.cloneNode(true);
            btnAdd.parentNode.replaceChild(newBtn, btnAdd);
            
            newBtn.addEventListener('click', () => {
                const emptyMsg = document.querySelector('.empty-quiz-msg');
                if (emptyMsg) emptyMsg.style.display = 'none';
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
                <div class="options-container ps-3 border-start border-3 border-secondary-subtle"></div>
                <button type="button" class="btn btn-sm btn-link text-decoration-none p-0 mt-2 btn-add-option">+ Agregar Opción</button>
            </div>
        `;
        
        card.querySelector('.btn-remove-question').addEventListener('click', () => {
            card.remove();
            updateQuizTotalPoints();
        });
        
        const optionsContainer = card.querySelector('.options-container');
        
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
        
        if (data && data.options) {
            data.options.forEach(opt => addOption(opt));
        } else {
            addOption();
            addOption();
        }
        
        card.querySelector('.question-points-input').addEventListener('input', updateQuizTotalPoints);
        
        container.appendChild(card);
        updateQuizTotalPoints();
    }
    
    function updateQuizTotalPoints() {
        let total = 0;
        document.querySelectorAll('.question-points-input').forEach(input => {
            total += parseInt(input.value) || 0;
        });
        const totalInput = document.getElementById('quizTotalPoints');
        if (totalInput) totalInput.value = total;
    }
    
    // ==========================================
    // INICIAR APLICACIÓN
    // ==========================================
    
    init();
    
});