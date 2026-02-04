// js/claseAlumn.js - Aula Virtual LMS Completo (H6.2-H6.6)

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar datos
    CursosData.init();
    CursosData.initStudent();

    // Helper para parsear IDs (soporta tanto UUIDs como integers)
    const parseId = (value) => {
        if (!value) return null;
        // Si es un UUID (contiene guiones), mantenerlo como string
        if (typeof value === 'string' && value.includes('-')) {
            return value;
        }
        // Si es un número o string numérico, parsearlo
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? value : parsed;
    };

    // Estado global
    // Verificar si hay un parámetro de curso en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const cursoIdFromUrl = urlParams.get('curso');
    let currentCursoId = cursoIdFromUrl
        ? parseId(cursoIdFromUrl)
        : parseId(localStorage.getItem('activeCourseId')) || null;

    let currentModuloId = parseId(localStorage.getItem('activeModuloId')) || null;
    let currentClaseId = parseId(localStorage.getItem('activeClaseId')) || null;
    let currentClase = null;
    let videoWatchProgress = 0;

    // Referencias DOM
    const courseName = document.getElementById('course-name');
    const globalProgressText = document.getElementById('global-progress-text');
    const globalProgressBar = document.getElementById('global-progress-bar');
    const sidebarProgressText = document.getElementById('sidebar-progress-text');
    const sidebarProgressBar = document.getElementById('sidebar-progress-bar');
    const modulesAccordion = document.getElementById('modulesAccordion');
    const contentTypeBadge = document.getElementById('contentTypeBadge');
    const contentTitle = document.getElementById('contentTitle');
    const dynamicContent = document.getElementById('dynamicContent');
    const contentDescription = document.getElementById('contentDescription');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const completionStatus = document.getElementById('completionStatus');
    const completionText = document.getElementById('completionText');
    const certificateItem = document.getElementById('certificateItem');
    const certStatus = document.getElementById('certStatus');
    const certLock = document.getElementById('certLock');

    // Sidebar Mobile
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebar = document.getElementById('closeSidebar');

    // Datos de quiz para simulación
    const quizQuestions = {
        4: [ // Quiz del módulo 1
            {
                id: 1,
                pregunta: '¿Cuál es la capa superficial de la piel donde se realiza el microblading?',
                opciones: ['Hipodermis', 'Dermis', 'Epidermis', 'Subcutánea'],
                correcta: 2,
                puntos: 25
            },
            {
                id: 2,
                pregunta: '¿Cuánto tiempo dura aproximadamente el microblading?',
                opciones: ['6 meses', '1-2 años', '5 años', 'Permanente'],
                correcta: 1,
                puntos: 25
            },
            {
                id: 3,
                pregunta: '¿Qué instrumento se utiliza principalmente en microblading?',
                opciones: ['Máquina rotativa', 'Aguja individual', 'Tebori/Microhoja', 'Dermógrafo'],
                correcta: 2,
                puntos: 25
            },
            {
                id: 4,
                pregunta: '¿Cuál es el porcentaje de retoque recomendado después del primer procedimiento?',
                opciones: ['No se necesita retoque', '10-20%', '40-60%', '80-100%'],
                correcta: 2,
                puntos: 25
            }
        ],
        12: [ // Quiz del módulo 3
            {
                id: 1,
                pregunta: '¿Cuál es el ángulo correcto para realizar trazos de microblading?',
                opciones: ['15-20 grados', '30-45 grados', '60-75 grados', '90 grados'],
                correcta: 1,
                puntos: 33
            },
            {
                id: 2,
                pregunta: '¿En qué dirección deben ir los trazos en la cola de la ceja?',
                opciones: ['Hacia arriba', 'Horizontal', 'Hacia abajo diagonal', 'En espiral'],
                correcta: 2,
                puntos: 33
            },
            {
                id: 3,
                pregunta: '¿Cuántas pasadas se recomiendan por trazo?',
                opciones: ['1 pasada', '2-3 pasadas', '5-6 pasadas', '10 pasadas'],
                correcta: 1,
                puntos: 34
            }
        ]
    };

    // Inicialización
    init();

    function init() {
        const curso = CursosData.getCurso(currentCursoId);
        if (!curso) {
            window.location.href = '/pages/cursos/cursosAlumn.html';
            return;
        }

        // Actualizar localStorage con el curso actual
        localStorage.setItem('activeCourseId', currentCursoId);

        // Mostrar nombre del curso
        courseName.textContent = curso.nombre;
        document.title = `${curso.nombre} | KIKIBROWS`;

        // Si no hay clase seleccionada, obtener la última
        if (!currentClaseId || !currentModuloId) {
            const ultima = CursosData.getUltimaClase(currentCursoId);
            if (ultima) {
                currentClaseId = ultima.claseId;
                currentModuloId = ultima.moduloId;
            }
        }

        // Renderizar sidebar
        renderSidebar();

        // Cargar contenido inicial
        if (currentClaseId && currentModuloId) {
            loadClase(currentModuloId, currentClaseId);
        }

        // Actualizar estado del certificado
        updateCertificateStatus();

        // Event listeners
        setupEventListeners();

        // Verificar si se debe mostrar el certificado automáticamente
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('showCertificate') === 'true') {
            setTimeout(() => {
                showCertificate();
            }, 500);
        }
    }

    function setupEventListeners() {
        // Navegación
        btnPrev.addEventListener('click', navigatePrev);
        btnNext.addEventListener('click', navigateNext);

        // Sidebar Mobile
        sidebarToggle?.addEventListener('click', () => {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('show');
        });

        closeSidebar?.addEventListener('click', closeSidebarMobile);
        sidebarOverlay?.addEventListener('click', closeSidebarMobile);
    }

    function closeSidebarMobile() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
    }

    // ==================== SIDEBAR ====================

    function renderSidebar() {
        const modulos = CursosData.getModulosByCurso(currentCursoId);
        const progresoGlobal = CursosData.calcularProgresoCurso(currentCursoId);

        // Actualizar barras de progreso globales
        updateProgressBars(progresoGlobal.porcentaje);

        // Renderizar módulos
        modulesAccordion.innerHTML = modulos.map((modulo, index) => {
            const clases = CursosData.getClasesByModulo(modulo.id);
            const progresoModulo = CursosData.calcularProgresoModulo(currentCursoId, modulo.id);
            const isExpanded = modulo.id === currentModuloId;

            const clasesHTML = clases.map(clase => {
                const estado = CursosData.getEstadoClase(currentCursoId, modulo.id, clase.id);
                const isDesbloqueada = CursosData.isClaseDesbloqueada(currentCursoId, modulo.id, clase.id);
                const isActive = clase.id === currentClaseId;
                const ultimaEntrega = clase.tipo === 'entrega' ? CursosData.getUltimaEntrega(clase.id) : null;

                let statusIcon = '<i class="far fa-circle"></i>';
                let statusClass = '';
                let pendingBadge = '';

                if (estado.completado) {
                    statusIcon = '<i class="fas fa-check-circle"></i>';
                    statusClass = 'completed';
                } else if (ultimaEntrega?.estado === 'pendiente') {
                    statusIcon = '<i class="fas fa-clock"></i>';
                    pendingBadge = '<span class="pending-badge">Pendiente</span>';
                } else if (!isDesbloqueada) {
                    statusIcon = '<i class="fas fa-lock"></i>';
                    statusClass = 'locked';
                }

                if (isActive) {
                    statusIcon = '<i class="fas fa-play-circle text-primary"></i>';
                }

                const tipoIcon = getTypeIcon(clase.tipo);

                return `
                    <div class="lesson-item ${statusClass} ${isActive ? 'active' : ''}"
                         onclick="window.selectClase(${modulo.id}, ${clase.id})"
                         data-clase-id="${clase.id}">
                        <div class="lesson-status">${statusIcon}</div>
                        <div class="lesson-info">
                            <div class="lesson-title">${clase.nombre}</div>
                            <div class="lesson-meta">
                                <span class="lesson-type-icon"><i class="fas ${tipoIcon}"></i></span>
                                <span>${clase.duracion || 5} min</span>
                                ${pendingBadge}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button ${isExpanded ? '' : 'collapsed'}"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#module-${modulo.id}">
                            <div class="w-100">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span>${index + 1}. ${modulo.nombre}</span>
                                </div>
                                <div class="module-progress">
                                    <div class="progress">
                                        <div class="progress-bar" style="width: ${progresoModulo.porcentaje}%"></div>
                                    </div>
                                    <span>${progresoModulo.completados}/${progresoModulo.total}</span>
                                </div>
                            </div>
                        </button>
                    </h2>
                    <div id="module-${modulo.id}" class="accordion-collapse collapse ${isExpanded ? 'show' : ''}"
                         data-bs-parent="#modulesAccordion">
                        <div class="lessons-list">
                            ${clasesHTML}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function updateProgressBars(percentage) {
        globalProgressText.textContent = `${percentage}%`;
        globalProgressBar.style.width = `${percentage}%`;
        sidebarProgressText.textContent = `${percentage}%`;
        sidebarProgressBar.style.width = `${percentage}%`;
    }

    function getTypeIcon(tipo) {
        const icons = {
            video: 'fa-play-circle',
            texto: 'fa-file-alt',
            pdf: 'fa-file-pdf',
            quiz: 'fa-question-circle',
            entrega: 'fa-upload'
        };
        return icons[tipo] || 'fa-file';
    }

    function getTypeBadge(tipo) {
        const badges = {
            video: 'VIDEO',
            texto: 'LECTURA',
            pdf: 'PDF',
            quiz: 'CUESTIONARIO',
            entrega: 'ENTREGA PRÁCTICA'
        };
        return badges[tipo] || tipo.toUpperCase();
    }

    // ==================== CARGA DE CONTENIDO ====================

    window.selectClase = (moduloId, claseId) => {
        const isDesbloqueada = CursosData.isClaseDesbloqueada(currentCursoId, moduloId, claseId);
        if (!isDesbloqueada) {
            alert('Debes completar las lecciones anteriores para desbloquear esta.');
            return;
        }
        loadClase(moduloId, claseId);
        closeSidebarMobile();
    };

    async function loadClase(moduloId, claseId) {
        currentModuloId = moduloId;
        currentClaseId = claseId;
        currentClase = CursosData.getClase(claseId);

        if (!currentClase) return;

        // Guardar posición actual
        localStorage.setItem('activeModuloId', moduloId);
        localStorage.setItem('activeClaseId', claseId);

        // Actualizar UI del sidebar
        renderSidebar();

        // Actualizar header
        contentTypeBadge.textContent = getTypeBadge(currentClase.tipo);
        contentTitle.textContent = currentClase.nombre;

        // Reset estado de navegación
        btnNext.disabled = true;
        completionStatus.classList.add('d-none');

        // Verificar si ya está completada
        const estado = CursosData.getEstadoClase(currentCursoId, moduloId, claseId);
        if (estado.completado) {
            enableNext();
            showCompletionStatus('Completado');
        }

        // Actualizar última actividad
        const student = CursosData.getStudent();
        if (!student.progreso[currentCursoId]) {
            student.progreso[currentCursoId] = { modulos: {} };
        }
        student.progreso[currentCursoId].ultimaActividad = new Date().toISOString();
        student.progreso[currentCursoId].ultimaClaseId = claseId;
        student.progreso[currentCursoId].ultimoModuloId = moduloId;
        CursosData.saveStudent(student);

        // Cargar contenido según tipo
        switch (currentClase.tipo) {
            case 'video':
                renderVideoContent();
                break;
            case 'texto':
                renderTextContent();
                break;
            case 'pdf':
                renderPDFContent();
                break;
            case 'quiz':
                renderQuizContent();
                break;
            case 'entrega':
                await renderEntregaContent();
                break;
            default:
                dynamicContent.innerHTML = '<div class="p-5 text-center">Contenido no disponible</div>';
        }

        // Actualizar descripción
        contentDescription.innerHTML = currentClase.descripcion || '';

        // Actualizar navegación
        updateNavigation();
    }

    // ==================== CONTENIDO: VIDEO ====================

    function renderVideoContent() {
        // Leer configuración desde metadata si existe (para Vimeo/YouTube)
        const metadata = currentClase.metadata || {};

        // Determinar la fuente del video
        let videoHTML = '';

        if (metadata.proveedor === 'vimeo' && metadata.video_id) {
            // Video de Vimeo embebido
            const allowDownload = metadata.permitir_descarga ? '' : '&download=0';
            videoHTML = `
                <div class="video-container video-embed">
                    <iframe
                        src="https://player.vimeo.com/video/${metadata.video_id}?badge=0&autopause=0&player_id=0${allowDownload}"
                        frameborder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowfullscreen
                        id="vimeoPlayer">
                    </iframe>
                </div>
            `;
            // Para Vimeo, habilitar siguiente después de un tiempo mínimo
            setTimeout(() => {
                if (!isClaseCompleted()) {
                    enableNext();
                }
            }, 30000); // 30 segundos mínimo

        } else if (metadata.proveedor === 'youtube' && metadata.video_id) {
            // Video de YouTube embebido
            videoHTML = `
                <div class="video-container video-embed">
                    <iframe
                        src="https://www.youtube.com/embed/${metadata.video_id}?rel=0&modestbranding=1"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        id="youtubePlayer">
                    </iframe>
                </div>
            `;
            // Para YouTube, habilitar siguiente después de un tiempo mínimo
            setTimeout(() => {
                if (!isClaseCompleted()) {
                    enableNext();
                }
            }, 30000); // 30 segundos mínimo

        } else {
            // Video directo (subido a Supabase Storage o URL externa)
            const videoSrc = currentClase.contenido_url || currentClase.src || '';

            if (!videoSrc) {
                dynamicContent.innerHTML = `
                    <div class="alert alert-warning text-center py-5">
                        <i class="fas fa-video-slash fa-3x mb-3"></i>
                        <h5>Video no disponible</h5>
                        <p class="text-muted">El video de esta clase aún no ha sido cargado.</p>
                    </div>
                `;
                enableNext(); // Permitir avanzar si no hay video
                return;
            }

            videoHTML = `
                <div class="video-container">
                    <video id="mainVideo" controls controlsList="nodownload">
                        <source src="${videoSrc}" type="video/mp4">
                        Tu navegador no soporta video HTML5.
                    </video>
                </div>
            `;
        }

        dynamicContent.innerHTML = videoHTML;

        // Solo configurar eventos para video HTML5 nativo
        const video = document.getElementById('mainVideo');
        if (video) {
            videoWatchProgress = 0;

            video.addEventListener('timeupdate', () => {
                if (video.duration) {
                    const progress = (video.currentTime / video.duration) * 100;
                    videoWatchProgress = Math.max(videoWatchProgress, progress);

                    // Marcar como completado al 90%
                    if (videoWatchProgress >= 90 && !isClaseCompleted()) {
                        markAsCompleted();
                    }
                }
            });

            video.addEventListener('ended', () => {
                if (!isClaseCompleted()) {
                    markAsCompleted();
                }
            });

            // Prevenir clic derecho para evitar descarga
            video.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });
        }
    }

    // ==================== CONTENIDO: TEXTO ====================

    function renderTextContent() {
        // Usar contenido_texto de Supabase o fallback a contenido legacy
        const content = currentClase.contenido_texto || currentClase.contenido || currentClase.descripcion || '';

        if (!content) {
            dynamicContent.innerHTML = `
                <div class="alert alert-info text-center py-5">
                    <i class="fas fa-file-alt fa-3x mb-3"></i>
                    <h5>Contenido en preparación</h5>
                    <p class="text-muted">El contenido de esta lección estará disponible pronto.</p>
                </div>
            `;
            enableNext();
            return;
        }

        dynamicContent.innerHTML = `
            <div class="text-content">
                ${content}
            </div>
        `;

        // Texto se puede avanzar directamente
        enableNext();
    }

    // ==================== CONTENIDO: PDF ====================

    function renderPDFContent() {
        // Usar contenido_url de Supabase o fallback a src legacy
        const pdfSrc = currentClase.contenido_url || currentClase.src || '';

        if (!pdfSrc) {
            dynamicContent.innerHTML = `
                <div class="alert alert-warning text-center py-5">
                    <i class="fas fa-file-pdf fa-3x mb-3"></i>
                    <h5>PDF no disponible</h5>
                    <p class="text-muted">El documento PDF de esta clase aún no ha sido cargado.</p>
                </div>
            `;
            enableNext();
            return;
        }

        dynamicContent.innerHTML = `
            <div class="pdf-container position-relative">
                <iframe src="${pdfSrc}#toolbar=0&navpanes=0&scrollbar=1" style="pointer-events: auto;"></iframe>
                <div class="pdf-overlay"></div>
            </div>
        `;

        // Prevenir clic derecho para descargar
        setTimeout(() => {
            const pdfContainer = document.querySelector('.pdf-container');
            if (pdfContainer) {
                pdfContainer.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    return false;
                });
            }
        }, 100);

        // PDF se puede avanzar directamente
        enableNext();
    }

    // ==================== CONTENIDO: QUIZ (H6.4) ====================

    function renderQuizContent(forceRetry = false) {
        // Intentar cargar preguntas desde metadata JSONB de la clase
        let questions = [];
        let passingScore = 70;

        if (currentClase.metadata && currentClase.metadata.questions && currentClase.metadata.questions.length > 0) {
            // Cargar desde metadata de Supabase (formato de gestorModulos.js)
            passingScore = parseInt(currentClase.metadata.passingScore) || 70;

            questions = currentClase.metadata.questions.map((q, idx) => ({
                id: idx + 1,
                pregunta: q.title,
                opciones: q.options.map(o => o.text),
                correcta: q.options.findIndex(o => o.isCorrect === true),
                puntos: q.points || 10
            }));

            console.log('Quiz cargado desde metadata:', questions.length, 'preguntas, passingScore:', passingScore);
        } else if (currentClase.metadata && currentClase.metadata.preguntas) {
            // Formato alternativo (compatibilidad con estructura antigua)
            const config = currentClase.metadata.configuracion || {};
            passingScore = parseInt(config.porcentaje_aprobacion) || 70;

            questions = currentClase.metadata.preguntas.map(p => ({
                id: p.id,
                pregunta: p.texto,
                opciones: p.opciones.map(o => o.texto),
                correcta: p.opciones.findIndex(o => o.correcta === true),
                puntos: p.puntos || 10
            }));

            console.log('Quiz cargado desde metadata (formato antiguo):', questions.length, 'preguntas');
        } else {
            // Fallback a preguntas hardcodeadas para compatibilidad
            questions = quizQuestions[currentClaseId] || quizQuestions[4];
            console.log('Quiz cargado desde fallback hardcodeado');
        }
        const totalPoints = questions.reduce((sum, q) => sum + q.puntos, 0);
        const intentos = CursosData.getIntentosQuiz(currentClaseId);
        const ultimoIntento = intentos.length > 0 ? intentos[intentos.length - 1] : null;
        const estado = CursosData.getEstadoClase(currentCursoId, currentModuloId, currentClaseId);

        let lastScoreHTML = '';
        if (ultimoIntento) {
            const scoreClass = ultimoIntento.aprobado ? 'text-success' : 'text-danger';
            lastScoreHTML = `
                <div class="quiz-last-score">
                    <span>Último intento: </span>
                    <strong class="${scoreClass}">${ultimoIntento.puntaje}%</strong>
                    <span class="ms-2">${ultimoIntento.aprobado ? '(Aprobado)' : '(Reprobado)'}</span>
                </div>
            `;
        }

        // Si ya está aprobado y no es un reintento forzado, mostrar vista de completado
        if (estado.completado && !forceRetry) {
            dynamicContent.innerHTML = `
                <div class="quiz-container">
                    <div class="quiz-header">
                        <h4><i class="fas fa-check-circle text-success me-2"></i>Quiz Completado</h4>
                        <p class="text-muted">Has aprobado este cuestionario exitosamente.</p>
                        ${lastScoreHTML}
                    </div>
                    <div class="text-center mt-4">
                        <button class="btn btn-outline-primary" onclick="window.retryQuiz()">
                            <i class="fas fa-redo me-2"></i>Volver a Intentar
                        </button>
                    </div>
                </div>
            `;
            enableNext();

            // Scroll al inicio del content-wrapper para Android
            setTimeout(() => {
                const contentWrapper = document.querySelector('.content-wrapper');
                if (contentWrapper) {
                    contentWrapper.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 100);

            return;
        }

        const questionsHTML = questions.map((q, index) => `
            <div class="question-card" data-question-id="${q.id}">
                <div class="question-number">
                    Pregunta ${index + 1} de ${questions.length}
                    <span class="question-points">${q.puntos} pts</span>
                </div>
                <div class="question-text">${q.pregunta}</div>
                <div class="question-options">
                    ${q.opciones.map((opcion, optIndex) => `
                        <label class="answer-option" onclick="window.selectAnswer(${q.id}, ${optIndex})">
                            <input type="radio" name="question-${q.id}" value="${optIndex}">
                            <span>${opcion}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');

        dynamicContent.innerHTML = `
            <div class="quiz-container">
                <div class="quiz-header">
                    <h4><i class="fas fa-question-circle text-primary me-2"></i>Evaluación</h4>
                    <p class="text-muted">Responde correctamente para avanzar</p>
                    <div class="quiz-info">
                        <div class="quiz-info-item">
                            <div class="value">${questions.length}</div>
                            <div class="label">Preguntas</div>
                        </div>
                        <div class="quiz-info-item">
                            <div class="value">${totalPoints}</div>
                            <div class="label">Puntos</div>
                        </div>
                        <div class="quiz-info-item">
                            <div class="value">${passingScore}%</div>
                            <div class="label">Para Aprobar</div>
                        </div>
                    </div>
                    ${lastScoreHTML}
                </div>

                <form id="quizForm">
                    ${questionsHTML}
                    <button type="button" class="btn btn-primary quiz-submit-btn" onclick="window.submitQuiz()" id="submitQuizBtn" disabled>
                        <i class="fas fa-paper-plane me-2"></i>Enviar Respuestas
                    </button>
                </form>
            </div>
        `;

        // Almacenar datos del quiz para validación
        window.currentQuizData = { questions, passingScore, totalPoints };
    }

    window.selectAnswer = (questionId, optionIndex) => {
        // Marcar opción seleccionada visualmente
        const questionCard = document.querySelector(`[data-question-id="${questionId}"]`);
        questionCard.querySelectorAll('.answer-option').forEach((opt, idx) => {
            opt.classList.toggle('selected', idx === optionIndex);
        });

        // Verificar si todas las preguntas están respondidas
        const allAnswered = window.currentQuizData.questions.every(q => {
            return document.querySelector(`input[name="question-${q.id}"]:checked`);
        });

        document.getElementById('submitQuizBtn').disabled = !allAnswered;
    };

    window.submitQuiz = () => {
        const { questions, passingScore, totalPoints } = window.currentQuizData;
        let puntosObtenidos = 0;
        const respuestas = [];

        questions.forEach(q => {
            const selected = document.querySelector(`input[name="question-${q.id}"]:checked`);
            const selectedIndex = selected ? parseInt(selected.value) : -1;
            const isCorrect = selectedIndex === q.correcta;

            if (isCorrect) {
                puntosObtenidos += q.puntos;
            }

            respuestas.push({
                questionId: q.id,
                selected: selectedIndex,
                correct: q.correcta,
                isCorrect,
                puntos: isCorrect ? q.puntos : 0
            });
        });

        const porcentaje = Math.round((puntosObtenidos / totalPoints) * 100);
        const aprobado = porcentaje >= passingScore;

        // Guardar intento
        CursosData.guardarIntentoQuiz(currentClaseId, respuestas, porcentaje, aprobado);

        // Mostrar resultados
        showQuizResults(respuestas, porcentaje, aprobado, questions);
    };

    function showQuizResults(respuestas, porcentaje, aprobado, questions) {
        const modal = new bootstrap.Modal(document.getElementById('quizResultsModal'));
        const header = document.getElementById('quizResultHeader');
        const title = document.getElementById('quizResultTitle');
        const body = document.getElementById('quizResultBody');
        const footer = document.getElementById('quizResultFooter');

        header.className = `modal-header ${aprobado ? 'passed' : 'failed'}`;
        title.innerHTML = aprobado
            ? '<i class="fas fa-check-circle me-2"></i>¡Aprobado!'
            : '<i class="fas fa-times-circle me-2"></i>Reprobado';

        const feedbackHTML = respuestas.map((r, idx) => {
            const question = questions.find(q => q.id === r.questionId);
            return `
                <div class="feedback-item ${r.isCorrect ? 'correct' : 'incorrect'}">
                    <div class="d-flex justify-content-between">
                        <strong>Pregunta ${idx + 1}</strong>
                        <span>${r.isCorrect ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}</span>
                    </div>
                    <div class="small mt-1">
                        Tu respuesta: ${question.opciones[r.selected] || 'Sin respuesta'}
                        ${!r.isCorrect ? `<br>Correcta: ${question.opciones[r.correct]}` : ''}
                    </div>
                </div>
            `;
        }).join('');

        body.innerHTML = `
            <div class="text-center mb-4">
                <div class="result-score ${aprobado ? 'passed' : 'failed'}">${porcentaje}%</div>
                <p class="text-muted">${aprobado ? '¡Felicidades! Has demostrado tu conocimiento.' : 'No te preocupes, puedes intentarlo de nuevo.'}</p>
            </div>
            <h6 class="mb-3">Retroalimentación:</h6>
            ${feedbackHTML}
        `;

        if (aprobado) {
            footer.innerHTML = `
                <button type="button" class="btn btn-success" onclick="window.closeQuizAndContinue()">
                    <i class="fas fa-arrow-right me-2"></i>Continuar
                </button>
            `;
            // Marcar como completado
            markAsCompleted();
        } else {
            footer.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                <button type="button" class="btn btn-primary" onclick="window.retryQuiz()">
                    <i class="fas fa-redo me-2"></i>Reintentar
                </button>
            `;
        }

        modal.show();
    }

    window.closeQuizAndContinue = () => {
        bootstrap.Modal.getInstance(document.getElementById('quizResultsModal')).hide();
    };

    window.retryQuiz = () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('quizResultsModal'));
        if (modal) modal.hide();

        // Limpiar el formulario existente si existe
        const existingForm = document.getElementById('quizForm');
        if (existingForm) {
            existingForm.reset();
        }

        // Limpiar todas las selecciones visuales
        document.querySelectorAll('.answer-option.selected').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Limpiar estado global
        if (window.currentQuizData) {
            delete window.currentQuizData;
        }

        // Renderizar el quiz de nuevo con forceRetry = true
        renderQuizContent(true);

        // Scroll al inicio del content-wrapper (más compatible con Android)
        setTimeout(() => {
            const contentWrapper = document.querySelector('.content-wrapper');
            if (contentWrapper) {
                contentWrapper.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 100);
    };

    // ==================== CONTENIDO: ENTREGA (H6.5) ====================

    // Variable para almacenar la última entrega cargada desde Supabase
    let ultimaEntregaSupabase = null;

    async function renderEntregaContent() {
        const modulo = CursosData.getModulo(currentModuloId);

        // Mostrar loading mientras se carga la entrega desde Supabase
        dynamicContent.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="text-muted mt-2">Cargando información de entrega...</p>
            </div>
        `;

        // Cargar última entrega desde Supabase
        const userId = CursosData.getCurrentUserId();
        if (userId) {
            const result = await CursosService.getUltimaEntrega(currentClaseId, userId);
            if (result.success && result.data) {
                ultimaEntregaSupabase = result.data;
                // Normalizar estado a minúsculas para compatibilidad
                ultimaEntregaSupabase.estado = ultimaEntregaSupabase.estado?.toLowerCase() || 'pendiente';
            } else {
                ultimaEntregaSupabase = null;
            }
        }

        const ultimaEntrega = ultimaEntregaSupabase;

        // Leer configuración desde metadata JSONB si existe
        const metadata = currentClase.metadata || {};
        const instrucciones = metadata.instrucciones_entrega || currentClase.instrucciones || currentClase.descripcion || 'Sube un archivo demostrando la técnica aprendida en este módulo.';
        const demoVideo = currentClase.contenido_url || currentClase.demoVideo || '';
        const archivosPermitidos = metadata.archivos_permitidos || ['.jpg', '.png', '.pdf', '.mp4', '.webm'];
        const pesoMaximoMb = metadata.peso_maximo_mb || 500;
        const rubrica = metadata.rubrica_evaluacion || [];

        // Determinar tipos de archivo para el input
        const tiposArchivo = archivosPermitidos.map(ext => {
            if (ext.includes('jpg') || ext.includes('png')) return 'image/*';
            if (ext.includes('pdf')) return 'application/pdf';
            if (ext.includes('mp4') || ext.includes('webm')) return 'video/*';
            return ext;
        }).join(',');

        let uploadSection = '';
        let statusSection = '';

        if (!ultimaEntrega || ultimaEntrega.estado === 'rechazada') {
            // Permitir subida
            uploadSection = `
                <div class="entrega-section">
                    <h5 class="entrega-section-title">
                        <span class="number">2</span>
                        ${ultimaEntrega?.estado === 'rechazada' ? 'Reenviar Tu Entrega' : 'Sube Tu Práctica'}
                    </h5>
                    ${rubrica.length > 0 ? `
                        <div class="rubrica-info mb-3">
                            <h6><i class="fas fa-list-check me-2"></i>Criterios de Evaluación:</h6>
                            <ul class="list-unstyled">
                                ${rubrica.map(r => `<li><i class="fas fa-check text-success me-2"></i>${r.criterio}: ${r.puntos} pts</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <div class="upload-zone" id="uploadZone">
                        <div class="upload-icon">
                            <i class="fas fa-cloud-upload-alt"></i>
                        </div>
                        <div class="upload-text">Arrastra aquí tu archivo o haz clic para seleccionar</div>
                        <div class="upload-hint">Formatos: ${archivosPermitidos.join(', ')} | Máximo: ${pesoMaximoMb}MB</div>
                        <button class="btn btn-primary upload-btn" type="button" id="selectVideoBtn">
                            <i class="fas fa-upload me-2"></i>Seleccionar Video
                        </button>
                        <input type="file" id="videoInput" accept="video/mp4,video/webm" hidden>
                    </div>
                </div>
            `;
        }

        if (ultimaEntrega) {
            let statusClass = '';
            let statusIcon = '';
            let statusTitle = '';
            let statusMsg = '';

            switch (ultimaEntrega.estado) {
                case 'pendiente':
                    statusClass = 'pending';
                    statusIcon = 'fas fa-clock';
                    statusTitle = 'Pendiente de Revisión';
                    statusMsg = 'Tu entrega ha sido enviada y está esperando la revisión del instructor.';
                    break;
                case 'aprobada':
                    statusClass = 'approved';
                    statusIcon = 'fas fa-check-circle';
                    statusTitle = 'Entrega Aprobada';
                    statusMsg = '¡Felicidades! Tu entrega ha sido aprobada.';
                    break;
                case 'rechazada':
                    statusClass = 'rejected';
                    statusIcon = 'fas fa-times-circle';
                    statusTitle = 'Entrega Rechazada';
                    statusMsg = 'Tu entrega necesita correcciones. Por favor revisa el feedback y vuelve a intentar.';
                    break;
            }

            const feedbackHTML = ultimaEntrega.feedback_instructor
                ? `<div class="entrega-feedback">
                       <strong><i class="fas fa-comment-alt me-2"></i>Feedback del Instructor:</strong>
                       <p class="mb-0 mt-2">${ultimaEntrega.feedback_instructor}</p>
                   </div>`
                : '';

            // Botón para eliminar entrega si está pendiente
            const eliminarBtnHTML = ultimaEntrega.estado === 'pendiente'
                ? `<div class="mt-3">
                       <button class="btn btn-outline-danger w-100" id="btnEliminarEntrega" data-entrega-id="${ultimaEntrega.id}" data-archivo-url="${ultimaEntrega.archivo_url}">
                           <i class="fas fa-trash me-2"></i>Eliminar y subir otro video
                       </button>
                       <small class="text-muted d-block text-center mt-2">Solo puedes eliminar entregas que aún no han sido revisadas</small>
                   </div>`
                : '';

            statusSection = `
                <div class="entrega-status ${statusClass}">
                    <div class="d-flex align-items-center">
                        <i class="${statusIcon} fa-2x me-3"></i>
                        <div>
                            <strong>${statusTitle}</strong>
                            <p class="mb-0 small">${statusMsg}</p>
                        </div>
                    </div>
                    ${feedbackHTML}
                    ${eliminarBtnHTML}
                </div>
            `;

            // Permitir avanzar si está pendiente o aprobada
            if (ultimaEntrega.estado === 'pendiente' || ultimaEntrega.estado === 'aprobada') {
                enableNext();
                if (ultimaEntrega.estado === 'aprobada') {
                    // Marcar como completada automáticamente cuando está aprobada
                    if (!isClaseCompleted()) {
                        markAsCompleted();
                    }
                    showCompletionStatus('Entrega Aprobada');
                } else {
                    showCompletionStatus('Pendiente de Revisión', 'warning');
                }
            }
        }

        // Construir sección de video solo si hay URL
        const videoSection = demoVideo ? `
            <div class="entrega-section">
                <h5 class="entrega-section-title">
                    <span class="number">1</span>
                    Video Demostrativo
                </h5>
                <div class="entrega-demo-video">
                    <div class="video-container">
                        <video controls>
                            <source src="${demoVideo}" type="video/mp4">
                        </video>
                    </div>
                </div>
            </div>
        ` : '';

        dynamicContent.innerHTML = `
            <div class="entrega-container">
                <div class="entrega-instructions">
                    <strong><i class="fas fa-tasks me-2"></i>Instrucciones:</strong>
                    <p class="mb-0 mt-2">${instrucciones}</p>
                </div>

                ${videoSection}
                ${uploadSection}
                ${statusSection}
            </div>
        `;

        // Setup drag and drop y event listeners
        setTimeout(() => {
            setupDragAndDrop();
            setupEliminarEntrega();
        }, 100);
    }

    // Función para configurar el botón de eliminar entrega
    function setupEliminarEntrega() {
        const btnEliminar = document.getElementById('btnEliminarEntrega');
        if (!btnEliminar) return;

        btnEliminar.addEventListener('click', async () => {
            const entregaId = btnEliminar.getAttribute('data-entrega-id');
            const archivoUrl = btnEliminar.getAttribute('data-archivo-url');

            if (!confirm('¿Estás seguro de que deseas eliminar esta entrega? Esta acción no se puede deshacer.')) {
                return;
            }

            // Mostrar loading
            btnEliminar.disabled = true;
            btnEliminar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Eliminando...';

            try {
                const result = await CursosService.eliminarEntrega(entregaId, archivoUrl);

                if (result.success) {
                    // Recargar la vista de entrega
                    ultimaEntregaSupabase = null;
                    await renderEntregaContent();
                } else {
                    alert('Error al eliminar la entrega: ' + (result.error?.message || 'Error desconocido'));
                    btnEliminar.disabled = false;
                    btnEliminar.innerHTML = '<i class="fas fa-trash me-2"></i>Eliminar y subir otro video';
                }
            } catch (error) {
                console.error('Error eliminando entrega:', error);
                alert('Error al eliminar la entrega');
                btnEliminar.disabled = false;
                btnEliminar.innerHTML = '<i class="fas fa-trash me-2"></i>Eliminar y subir otro video';
            }
        });
    }

    function setupDragAndDrop() {
        const uploadZone = document.getElementById('uploadZone');
        const videoInput = document.getElementById('videoInput');
        const selectVideoBtn = document.getElementById('selectVideoBtn');

        if (!uploadZone || !videoInput) {
            console.error('No se encontraron los elementos de upload');
            return;
        }

        console.log('Configurando zona de upload...');

        // Click en la zona de upload
        uploadZone.addEventListener('click', (e) => {
            // Solo abrir el selector si no se hace clic en el botón
            if (e.target !== selectVideoBtn && !selectVideoBtn.contains(e.target)) {
                console.log('Click en zona de upload');
                videoInput.click();
            }
        });

        // Click en el botón de seleccionar
        if (selectVideoBtn) {
            selectVideoBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar que se propague al uploadZone
                console.log('Click en botón seleccionar video');
                videoInput.click();
            });
        }

        // Cambio en el input file
        videoInput.addEventListener('change', (event) => {
            console.log('Archivo seleccionado');
            const file = event.target.files[0];
            if (file) {
                console.log('Procesando archivo:', file.name);
                processFile(file);
            }
        });

        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            console.log('Archivo soltado');
            const file = e.dataTransfer.files[0];
            if (file) {
                console.log('Procesando archivo:', file.name);
                processFile(file);
            }
        });
    }

    async function processFile(file) {
        // Validar formato
        const validTypes = ['video/mp4', 'video/webm'];
        if (!validTypes.includes(file.type)) {
            alert('Formato no válido. Solo se permiten archivos MP4 o WEBM.');
            return;
        }

        // Validar tamaño (500MB)
        const maxSize = 500 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('El archivo excede el límite de 500MB.');
            return;
        }

        // Obtener userId del usuario autenticado (UUID de Supabase Auth)
        const userId = CursosData.getCurrentUserId();
        if (!userId) {
            alert('Error: No se pudo identificar al usuario. Por favor recarga la página.');
            return;
        }

        // Validar que tenemos los IDs necesarios para la ruta de Storage
        // La ruta DEBE ser: ${cursoId}/${claseId}/${userId}/${archivo.name}
        if (!currentCursoId) {
            alert('Error: No se pudo identificar el curso. Por favor recarga la página.');
            return;
        }
        if (!currentClaseId) {
            alert('Error: No se pudo identificar la clase. Por favor recarga la página.');
            return;
        }

        console.log('Subiendo entrega:', {
            cursoId: currentCursoId,
            claseId: currentClaseId,
            userId: userId,
            fileName: file.name
        });

        // Mostrar interfaz de subida
        const uploadZone = document.getElementById('uploadZone');
        uploadZone.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary mb-3" role="status"></div>
                <div class="fw-bold">Subiendo video a Supabase...</div>
                <div class="progress mt-3" style="height: 8px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" id="uploadProgress" style="width: 30%"></div>
                </div>
                <small class="text-muted mt-2 d-block">Esto puede tardar unos minutos dependiendo del tamaño del archivo</small>
            </div>
        `;

        try {
            // Subir a Supabase con el formato de path correcto: ${cursoId}/${claseId}/${userId}/${archivo.name}
            const result = await CursosService.subirEntrega(currentClaseId, file, userId, currentCursoId);

            if (result.success) {
                // Actualizar barra de progreso
                document.getElementById('uploadProgress').style.width = '100%';

                // Actualizar estado local en el progreso
                const student = CursosData.getStudent();
                if (!student.progreso[currentCursoId]) {
                    student.progreso[currentCursoId] = { modulos: {} };
                }
                if (!student.progreso[currentCursoId].modulos[currentModuloId]) {
                    student.progreso[currentCursoId].modulos[currentModuloId] = { clases: {} };
                }
                student.progreso[currentCursoId].modulos[currentModuloId].clases[currentClaseId] = {
                    completado: false,
                    estado: 'pendiente',
                    fecha: new Date().toISOString()
                };
                CursosData.saveStudent(student);

                // Actualizar la variable de entrega y recargar contenido
                ultimaEntregaSupabase = result.data;
                ultimaEntregaSupabase.estado = ultimaEntregaSupabase.estado?.toLowerCase() || 'pendiente';

                // Recargar contenido
                await renderEntregaContent();
                renderSidebar();

                // Habilitar el botón siguiente y mostrar estado
                enableNext();
                showCompletionStatus('Pendiente de Revisión', 'warning');

                console.log('Entrega subida exitosamente a Supabase');
            } else {
                throw new Error(result.error?.message || 'Error al subir el archivo');
            }
        } catch (error) {
            console.error('Error subiendo entrega:', error);
            alert('Error al subir el archivo: ' + error.message);

            // Restaurar zona de upload
            uploadZone.innerHTML = `
                <div class="upload-icon">
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <div class="upload-text">Arrastra aquí tu archivo o haz clic para seleccionar</div>
                <div class="upload-hint">Formatos: .mp4, .webm | Máximo: 500MB</div>
                <button class="btn btn-primary upload-btn" type="button" id="selectVideoBtn">
                    <i class="fas fa-upload me-2"></i>Seleccionar Video
                </button>
                <input type="file" id="videoInput" accept="video/mp4,video/webm" hidden>
            `;

            // Re-setup event listeners
            setTimeout(setupDragAndDrop, 100);
        }
    }

    // ==================== CERTIFICADO (H6.6) ====================

    function updateCertificateStatus() {
        const canGet = CursosData.puedeObtenerCertificado(currentCursoId);

        if (canGet.puede) {
            certificateItem.classList.remove('locked');
            certificateItem.classList.add('unlocked');
            certStatus.textContent = '¡Disponible para descargar!';
            certLock.className = 'fas fa-unlock cert-lock text-success';
        } else {
            certificateItem.classList.add('locked');
            certificateItem.classList.remove('unlocked');

            if (canGet.razon === 'pendiente') {
                certStatus.textContent = `Esperando corrección: ${canGet.moduloNombre || 'entrega práctica'}`;
            } else if (canGet.razon === 'entrega') {
                certStatus.textContent = `Completa la entrega: ${canGet.moduloNombre || 'práctica pendiente'}`;
            } else {
                certStatus.textContent = 'Completa el curso para desbloquear';
            }
        }
    }

    window.showCertificate = () => {
        const canGet = CursosData.puedeObtenerCertificado(currentCursoId);
        const modal = new bootstrap.Modal(document.getElementById('certificateModal'));
        const body = document.getElementById('certificateBody');

        if (canGet.puede) {
            const curso = CursosData.getCurso(currentCursoId);
            const student = CursosData.getStudent();
            const today = new Date().toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            body.innerHTML = `
                <div class="certificate-preview">
                    <div class="certificate-logo">KIKIBROWS</div>
                    <div class="certificate-text">Certificado de Finalización</div>
                    <div class="certificate-text">Se otorga a:</div>
                    <div class="certificate-name">${student.nombre}</div>
                    <div class="certificate-text">Por completar satisfactoriamente el curso:</div>
                    <div class="certificate-course">${curso.nombre}</div>
                    <div class="certificate-date">${today}</div>
                </div>
                <div class="mt-4">
                    <button class="btn btn-success btn-lg" onclick="window.downloadCertificate()">
                        <i class="fas fa-download me-2"></i>Descargar PDF
                    </button>
                </div>
            `;
        } else {
            let message = '';
            if (canGet.razon === 'pendiente') {
                message = `
                    <i class="fas fa-clock fa-4x text-warning mb-4"></i>
                    <h4>¡Casi listo!</h4>
                    <p class="text-muted">Tu certificado se desbloqueará cuando aprobemos tu entrega práctica.</p>
                    <p><strong>Estado:</strong> Esperando corrección del instructor</p>
                `;
            } else if (canGet.razon === 'entrega') {
                message = `
                    <i class="fas fa-exclamation-triangle fa-4x text-danger mb-4"></i>
                    <h4>Entrega Rechazada</h4>
                    <p class="text-muted">Tu entrega fue rechazada. Por favor corrige tu entrega práctica en el módulo "<strong>${canGet.moduloNombre}</strong>" para obtener tu certificado.</p>
                `;
            } else {
                message = `
                    <i class="fas fa-lock fa-4x text-muted mb-4"></i>
                    <h4>Certificado Bloqueado</h4>
                    <p class="text-muted">Completa todo el contenido del curso y aprueba tus prácticas para desbloquear tu certificado.</p>
                    <div class="progress mt-4" style="height: 20px;">
                        <div class="progress-bar" style="width: ${CursosData.calcularProgresoCurso(currentCursoId).porcentaje}%">
                            ${CursosData.calcularProgresoCurso(currentCursoId).porcentaje}%
                        </div>
                    </div>
                `;
            }
            body.innerHTML = message;
        }

        modal.show();
    };

    window.downloadCertificate = async () => {
        try {
            console.log('Iniciando descarga de certificado...');

            // Verificar que pdfMake esté disponible
            if (typeof pdfMake === 'undefined') {
                console.error('pdfMake no está disponible');
                alert('Error: El generador de PDF no está disponible. Por favor, recarga la página.');
                return;
            }

            // Verificar que CertificateGenerator esté disponible
            if (!window.CertificateGenerator) {
                console.error('CertificateGenerator no está disponible');
                alert('Error: El generador de certificados no está disponible. Por favor, recarga la página.');
                return;
            }

            // Obtener datos del estudiante
            const student = CursosData.getStudentData();
            if (!student) {
                console.error('No se pudo obtener los datos del estudiante');
                alert('Error: No se pudieron obtener tus datos. Por favor, recarga la página.');
                return;
            }

            const curso = CursosData.getCurso(currentCursoId);
            if (!curso) {
                console.error('No se encontró el curso con ID:', currentCursoId);
                alert('Error: No se encontró el curso.');
                return;
            }

            console.log('Datos del curso obtenidos:', curso.nombre);

            // Obtener datos del usuario actual (con apellido)
            const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
            console.log('Datos del usuario:', usuarioActual);

            // Generar código de certificado
            const codigoCertificado = window.CertificateGenerator.generarCodigoCertificado(
                currentCursoId,
                student.id
            );

            // Obtener fecha de completación
            const certificadoData = student.certificados[currentCursoId];
            const fechaCompletado = certificadoData
                ? window.CertificateGenerator.formatearFecha(certificadoData.fecha)
                : window.CertificateGenerator.formatearFecha(new Date());

            // Datos para el certificado
            const datosCertificado = {
                nombreAlumno: usuarioActual.nombre || student.nombre || 'Estudiante',
                apellidoAlumno: usuarioActual.apellido || '',
                nombreCurso: curso.nombre || 'Curso',
                fechaCompletado: fechaCompletado,
                codigoCertificado: codigoCertificado,
                nombreInstructor: curso.instructor || 'Equipo KikiBrows'
            };

            console.log('Generando certificado con datos:', datosCertificado);

            // Generar el PDF
            const resultado = await window.CertificateGenerator.generarCertificado(datosCertificado);

            if (resultado.success) {
                console.log('Certificado generado exitosamente:', resultado.fileName);

                // Registrar descarga en los datos del estudiante
                CursosData.generarCertificado(currentCursoId);

                // Actualizar el modal para mostrar que se descargó
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('certificateModal'));
                    if (modal) {
                        modal.hide();
                    }
                }, 500);
            } else {
                console.error('Error al generar certificado:', resultado.error);
                alert('Error al generar el certificado: ' + (resultado.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error al descargar certificado:', error);
            alert('Error al generar el certificado: ' + error.message);
        }
    };

    // ==================== NAVEGACIÓN ====================

    function updateNavigation() {
        const { prevClase, nextClase } = getAdjacentClases();

        btnPrev.disabled = !prevClase;
        // btnNext se habilita según el contenido completado
    }

    function getAdjacentClases() {
        const modulos = CursosData.getModulosByCurso(currentCursoId);
        let allClases = [];

        modulos.forEach(modulo => {
            const clases = CursosData.getClasesByModulo(modulo.id);
            clases.forEach(clase => {
                allClases.push({ moduloId: modulo.id, claseId: clase.id });
            });
        });

        const currentIndex = allClases.findIndex(c => c.claseId === currentClaseId);

        return {
            prevClase: currentIndex > 0 ? allClases[currentIndex - 1] : null,
            nextClase: currentIndex < allClases.length - 1 ? allClases[currentIndex + 1] : null
        };
    }

    function navigatePrev() {
        const { prevClase } = getAdjacentClases();
        if (prevClase) {
            loadClase(prevClase.moduloId, prevClase.claseId);
        }
    }

    function navigateNext() {
        // Marcar como completado si es texto/pdf y no está marcado
        if (['texto', 'pdf'].includes(currentClase?.tipo) && !isClaseCompleted()) {
            markAsCompleted();
        }

        const { nextClase } = getAdjacentClases();
        if (nextClase) {
            loadClase(nextClase.moduloId, nextClase.claseId);
        } else {
            // Fin del curso
            updateCertificateStatus();
            const canGet = CursosData.puedeObtenerCertificado(currentCursoId);
            if (canGet.puede) {
                showCertificate();
            } else {
                alert('¡Felicidades! Has llegado al final del contenido. Completa las entregas pendientes para obtener tu certificado.');
            }
        }
    }

    // ==================== UTILIDADES ====================

    function isClaseCompleted() {
        const estado = CursosData.getEstadoClase(currentCursoId, currentModuloId, currentClaseId);
        return estado.completado;
    }

    function markAsCompleted() {
        CursosData.marcarClaseCompletada(currentCursoId, currentModuloId, currentClaseId);
        renderSidebar();
        updateCertificateStatus();
        enableNext();
        showCompletionStatus('Completado');
    }

    function enableNext() {
        btnNext.disabled = false;
    }

    function showCompletionStatus(text, type = 'success') {
        completionStatus.classList.remove('d-none');
        completionText.textContent = text;

        if (type === 'warning') {
            completionStatus.className = 'completion-status text-warning';
            completionStatus.querySelector('i').className = 'fas fa-clock me-1';
        } else {
            completionStatus.className = 'completion-status text-success';
            completionStatus.querySelector('i').className = 'fas fa-check-circle me-1';
        }
    }

    // ==================== FUNCIONES DE DEBUG (CONSOLA) ====================
    // Funciones útiles para debugging disponibles en la consola del navegador

    window.resetearQuiz = (claseId) => {
        const student = CursosData.getStudent();
        if (student.quizAttempts[claseId || currentClaseId]) {
            delete student.quizAttempts[claseId || currentClaseId];
        }
        if (student.progreso[currentCursoId]?.modulos?.[currentModuloId]?.clases?.[claseId || currentClaseId]) {
            student.progreso[currentCursoId].modulos[currentModuloId].clases[claseId || currentClaseId].completado = false;
        }
        CursosData.saveStudent(student);
        console.log('Quiz reseteado');
        if (currentClase && currentClase.tipo === 'quiz') {
            loadClase(currentModuloId, currentClaseId);
        }
    };

    window.verEstadoClase = () => {
        console.log('Estado actual:', {
            cursoId: currentCursoId,
            moduloId: currentModuloId,
            claseId: currentClaseId,
            clase: currentClase
        });
    };
});
