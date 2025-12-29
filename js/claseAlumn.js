// js/claseAlumn.js - Lógica de LMS, Progreso y Validación (H6.3 + H4.x)

document.addEventListener('DOMContentLoaded', () => {

    // === 1. DATOS DEL CURSO (Simulación DB) ===
    // Estados: 'locked', 'active', 'completed', 'pending_review'
    const courseData = {
        id: 1,
        title: "Microblading Expert",
        modules: [
            {
                id: 1,
                title: "Fundamentos Teóricos",
                lessons: [
                    // H4.1 Video (Debe verse completo)
                    { id: 101, type: 'video', title: 'Bienvenida e Introducción', src: 'assets/video_demo.mp4', duration: '5 min', status: 'completed' },
                    // H4.3 Texto (Lectura)
                    { id: 102, type: 'texto', title: 'Anatomía de la Piel', content: '<h3>La Dermis y Epidermis</h3><p>Lectura obligatoria...</p>', duration: '10 min', status: 'active' },
                    // H4.2 PDF (Visualización obligatoria)
                    { id: 103, type: 'pdf', title: 'Manual de Higiene', src: 'assets/manual.pdf', duration: '15 min', status: 'locked' }
                ]
            },
            {
                id: 2,
                title: "Evaluación y Práctica",
                lessons: [
                    // H4.4 Quiz (Debe aprobarse)
                    { id: 201, type: 'quiz', title: 'Examen Teórico', passingScore: 70, questions: 3, status: 'locked' },
                    // H4.5 Entrega Práctica (Video Demo + Upload)
                    { id: 202, type: 'entrega', title: 'Práctica en Látex', demoVideo: 'assets/demo_latex.mp4', instructions: 'Sube tu video replicando la técnica.', status: 'locked' }
                ]
            }
        ]
    };

    // Estado actual
    let currentLesson = null;
    let currentModuleIndex = 0;
    let currentLessonIndex = 1; // Empezamos en la 102 (Texto) para probar

    // Elementos DOM
    const dynamicContainer = document.getElementById('dynamic-content-area');
    const contentTitle = document.getElementById('contentTitle');
    const badge = document.getElementById('lessonTypeBadge');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const accordion = document.getElementById('courseAccordion');
    const progressText = document.getElementById('global-progress-text');
    const progressBar = document.getElementById('global-progress-bar');
    const completionMsg = document.getElementById('completion-message');

    // === 2. INICIALIZACIÓN ===
    renderSidebar();
    loadLesson(currentModuleIndex, currentLessonIndex);

    // === 3. RENDERIZADO SIDEBAR ===
    function renderSidebar() {
        accordion.innerHTML = '';
        let totalLessons = 0;
        let completedLessons = 0;

        courseData.modules.forEach((mod, mIdx) => {
            let lessonsHTML = '';
            
            mod.lessons.forEach((lesson, lIdx) => {
                totalLessons++;
                if (lesson.status === 'completed') completedLessons++;

                // Iconos según estado (H6.3)
                let icon = '<i class="far fa-circle text-muted"></i>'; // Default
                if (lesson.status === 'completed') icon = '<i class="fas fa-check-circle status-completed"></i>';
                if (lesson.status === 'pending_review') icon = '<i class="fas fa-clock status-pending"></i>'; // H4.5
                if (lesson.status === 'locked') icon = '<i class="fas fa-lock status-locked"></i>';
                if (mIdx === currentModuleIndex && lIdx === currentLessonIndex) icon = '<i class="fas fa-play-circle text-primary"></i>';

                // Clases CSS
                const isActive = (mIdx === currentModuleIndex && lIdx === currentLessonIndex) ? 'active' : '';
                const isLocked = lesson.status === 'locked' ? 'locked' : '';

                lessonsHTML += `
                    <div class="lesson-item list-group-item d-flex align-items-center justify-content-between p-3 ${isActive} ${isLocked}" 
                         onclick="tryLoadLesson(${mIdx}, ${lIdx})">
                        <div class="d-flex align-items-center">
                            <div class="status-icon me-3">${icon}</div>
                            <div>
                                <div class="fw-semibold">${lesson.title}</div>
                                <div class="small text-muted"><i class="far fa-clock me-1"></i> ${lesson.duration || '5 min'}</div>
                            </div>
                        </div>
                    </div>
                `;
            });

            const showClass = mIdx === currentModuleIndex ? 'show' : ''; // Expandir módulo actual
            
            const moduleHTML = `
                <div class="accordion-item border-0">
                    <h2 class="accordion-header">
                        <button class="accordion-button ${showClass ? '' : 'collapsed'} bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#mod-${mIdx}">
                            <strong>${mod.title}</strong>
                        </button>
                    </h2>
                    <div id="mod-${mIdx}" class="accordion-collapse collapse ${showClass}" data-bs-parent="#courseAccordion">
                        <div class="list-group list-group-flush">
                            ${lessonsHTML}
                        </div>
                    </div>
                </div>
            `;
            accordion.insertAdjacentHTML('beforeend', moduleHTML);
        });

        // Actualizar Barra Global
        const percent = Math.round((completedLessons / totalLessons) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.innerText = `${percent}%`;
    }

    // === 4. LÓGICA DE CARGA DE CONTENIDOS (POR TIPO) ===
    window.tryLoadLesson = (mIdx, lIdx) => {
        const targetLesson = courseData.modules[mIdx].lessons[lIdx];
        if (targetLesson.status === 'locked') {
            alert("Debes completar las lecciones anteriores para desbloquear esta.");
            return;
        }
        loadLesson(mIdx, lIdx);
    };

    function loadLesson(mIdx, lIdx) {
        currentModuleIndex = mIdx;
        currentLessonIndex = lIdx;
        currentLesson = courseData.modules[mIdx].lessons[lIdx];

        // UI Updates
        contentTitle.innerText = currentLesson.title;
        badge.innerText = currentLesson.type.toUpperCase();
        renderSidebar(); // Refrescar active state
        
        // Reset Footer state
        btnNext.disabled = true; // POR DEFECTO BLOQUEADO
        completionMsg.classList.add('d-none');
        
        // Si ya estaba completada, habilitar siguiente
        if (currentLesson.status === 'completed' || currentLesson.status === 'pending_review') {
            btnNext.disabled = false;
            completionMsg.classList.remove('d-none');
        }

        // RENDERIZAR SEGÚN TIPO (H4.x)
        dynamicContainer.innerHTML = ''; // Limpiar

        switch(currentLesson.type) {
            
            case 'video': // H4.1
                dynamicContainer.innerHTML = `
                    <div class="video-wrapper">
                        <video id="mainVideo" controls width="100%" height="100%">
                            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4"> </video>
                    </div>`;
                
                const video = document.getElementById('mainVideo');
                // LOGICA AUTOMÁTICA: Al terminar video -> Desbloquear Siguiente
                video.addEventListener('ended', () => {
                    markAsComplete();
                });
                break;

            case 'texto': // H4.3
                dynamicContainer.innerHTML = `<div class="p-5">${currentLesson.content}</div>`;
                // Texto: Se considera "visto" al cargar, pero forzamos al usuario a dar clic en siguiente
                // Opcional: Detectar scroll al final
                btnNext.disabled = false; // En texto permitimos avanzar (User request "al apretar siguiente")
                break;

            case 'pdf': // H4.2 (Visualizar NO Descargar)
                dynamicContainer.innerHTML = `
                    <iframe src="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" class="pdf-viewer"></iframe>
                `;
                // PDF: Permitimos avanzar tras cargar
                btnNext.disabled = false; 
                break;

            case 'quiz': // H4.4 (Lógica Real de Aprobación)
                dynamicContainer.innerHTML = `
                    <div class="p-5">
                        <h4><i class="fas fa-question-circle text-primary"></i> Evaluación Teórica</h4>
                        <p>Responde correctamente para avanzar. Aprobación: ${currentLesson.passingScore}%</p>
                        <hr>
                        <form id="quizForm">
                            <div class="mb-3">
                                <label class="fw-bold">1. ¿Cuál es la capa superficial de la piel?</label><br>
                                <input type="radio" name="q1" value="wrong"> Dermis<br>
                                <input type="radio" name="q1" value="correct"> Epidermis<br>
                            </div>
                            <button type="button" class="btn btn-success" onclick="submitQuiz()">Enviar Respuestas</button>
                        </form>
                        <div id="quizResult" class="mt-3"></div>
                    </div>`;
                break;

            case 'entrega': // H4.5 (Video Demo + Upload)
                const uploadStatus = currentLesson.status === 'pending_review' 
                    ? '<div class="alert alert-warning"><i class="fas fa-clock"></i> Tu entrega está siendo revisada. Puedes avanzar.</div>' 
                    : '';

                dynamicContainer.innerHTML = `
                    <div class="p-4">
                        <h5>1. Video Demostrativo (Instructora)</h5>
                        <div class="ratio ratio-16x9 mb-4 rounded overflow-hidden">
                            <video controls><source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4"></video>
                        </div>
                        
                        <h5>2. Tu Turno: Sube tu Práctica</h5>
                        <p class="text-muted small">${currentLesson.instructions}</p>
                        ${uploadStatus}
                        
                        <div class="border dashed p-4 text-center bg-light rounded" id="uploadZone">
                            <i class="fas fa-cloud-upload-alt fa-2x text-muted mb-2"></i><br>
                            <button class="btn btn-outline-primary btn-sm" onclick="triggerUpload()">Seleccionar Video</button>
                        </div>
                    </div>`;
                break;
        }
    }

    // === 5. FUNCIONES DE COMPLETITUD (Lógica de Negocio) ===

    // Función genérica para marcar completado y habilitar botón
    function markAsComplete() {
        if (currentLesson.status !== 'completed') {
            currentLesson.status = 'completed';
            completionMsg.classList.remove('d-none');
            completionMsg.innerHTML = '<i class="fas fa-check-circle"></i> ¡Lección Completada!';
            btnNext.disabled = false;
            renderSidebar(); // Actualiza checks en sidebar
        }
    }

    // H4.4: Lógica de Quiz
    window.submitQuiz = () => {
        // Simulación: Validar respuestas
        const q1 = document.querySelector('input[name="q1"]:checked');
        const resultDiv = document.getElementById('quizResult');
        
        if (!q1) { alert("Responde todas las preguntas"); return; }

        if (q1.value === 'correct') {
            resultDiv.innerHTML = '<div class="alert alert-success">¡Aprobado! (100%)</div>';
            markAsComplete(); // DESBLOQUEA EL BOTÓN SIGUIENTE
        } else {
            resultDiv.innerHTML = '<div class="alert alert-danger">Reprobado. Intenta de nuevo.</div>';
            btnNext.disabled = true; // Mantiene bloqueado
        }
    };

    // H4.5: Lógica de Entrega
    window.triggerUpload = () => {
        // Simulación de subida
        const uploadZone = document.getElementById('uploadZone');
        uploadZone.innerHTML = '<div class="spinner-border text-primary" role="status"></div> Subiendo...';
        
        setTimeout(() => {
            uploadZone.innerHTML = '<div class="text-success fw-bold"><i class="fas fa-check"></i> Archivo enviado</div>';
            
            // Lógica especial: Entrega no es "completed" sino "pending_review"
            // Pero permitimos avanzar para no bloquear el curso entero (Regla de negocio común)
            currentLesson.status = 'pending_review';
            completionMsg.classList.remove('d-none');
            completionMsg.innerHTML = '<i class="fas fa-clock"></i> Pendiente de Revisión';
            btnNext.disabled = false; // Habilitamos siguiente
            renderSidebar();
        }, 1500);
    };

    // === 6. NAVEGACIÓN (Botón Siguiente) ===
    btnNext.addEventListener('click', () => {
        // Al dar click, primero aseguramos que el estado actual se guarde (si aplica)
        // Y calculamos cuál es la siguiente lección
        
        // Lógica para desbloquear la SIGUIENTE lección en la data
        let nextM = currentModuleIndex;
        let nextL = currentLessonIndex + 1;

        // Si se acaba el módulo, saltar al siguiente
        if (nextL >= courseData.modules[currentModuleIndex].lessons.length) {
            nextM++;
            nextL = 0;
        }

        // Validar si existe esa siguiente lección
        if (courseData.modules[nextM] && courseData.modules[nextM].lessons[nextL]) {
            // DESBLOQUEO AUTOMÁTICO (H6.3)
            courseData.modules[nextM].lessons[nextL].status = 'active'; // Quitar candado
            loadLesson(nextM, nextL);
        } else {
            alert("¡Felicidades! Has terminado todo el curso.");
        }
    });

    btnPrev.addEventListener('click', () => {
        // Lógica inversa simple para retroceder
        // ... (Implementación similar restando índices)
    });

});