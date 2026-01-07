// js/cursosAlumn.js - Dashboard Personal "Mis Cursos" (H6.1)

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar navbar
    if (typeof UI !== 'undefined' && UI.initNavbar) {
        UI.initNavbar();
    }

    // Inicializar datos
    CursosData.init();
    CursosData.initStudent();

    // Referencias DOM
    const coursesGrid = document.getElementById('courses-grid');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('searchCourses');
    const welcomeText = document.getElementById('welcome-text');

    // Mostrar nombre de alumna
    const student = CursosData.getStudent();
    if (welcomeText && student.nombre) {
        welcomeText.textContent = `Bienvenida de vuelta, ${student.nombre.split(' ')[0]}`;
    }

    // Renderizar cursos
    function renderCourses(cursos) {
        if (!coursesGrid) return;

        if (cursos.length === 0) {
            coursesGrid.classList.add('d-none');
            emptyState.classList.remove('d-none');
            return;
        }

        coursesGrid.classList.remove('d-none');
        emptyState.classList.add('d-none');

        coursesGrid.innerHTML = cursos.map(curso => {
            const progreso = curso.progreso;
            const isCompleted = progreso.porcentaje === 100;
            const modulos = CursosData.getModulosByCurso(curso.id);
            const modulosInfo = CursosData.getModulosCompletados(curso.id);

            // Determinar estado del botón
            let buttonText = 'Continuar';
            let buttonIcon = 'fa-play';
            let buttonClass = 'btn-kiki';

            if (isCompleted) {
                buttonText = 'Revisar Contenido';
                buttonIcon = 'fa-eye';
                buttonClass = 'btn-kiki-secondary';
            } else if (progreso.completados === 0) {
                buttonText = 'Comenzar';
                buttonIcon = 'fa-play';
            }

            // Badge de completado
            const completedBadge = isCompleted
                ? `<div class="completed-badge">
                       <i class="fas fa-check-circle me-1"></i>Completado
                   </div>`
                : '';

            // Formatear última actividad
            const lastActivity = curso.ultimaActividad
                ? formatRelativeTime(curso.ultimaActividad)
                : 'Sin actividad';

            return `
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="course-card ${isCompleted ? 'completed' : ''}">
                        ${completedBadge}
                        <div class="course-image">
                            <img src="${curso.portada || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=200&fit=crop'}" alt="${curso.nombre}">
                            <div class="course-overlay">
                                <span class="duration-badge">
                                    <i class="fas fa-clock me-1"></i>${CursosData.formatearDuracion(CursosData.calcularDuracionCurso(curso.id))}
                                </span>
                            </div>
                        </div>
                        <div class="course-body">
                            <h5 class="course-title">${curso.nombre}</h5>
                            <p class="course-description">${curso.descripcion?.substring(0, 80) || 'Sin descripción'}...</p>

                            <!-- Barra de Progreso -->
                            <div class="progress-section">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="progress-label">Tu progreso</span>
                                    <span class="progress-percentage ${isCompleted ? 'text-success' : ''}">${progreso.porcentaje}%</span>
                                </div>
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill ${isCompleted ? 'completed' : ''}" style="width: ${progreso.porcentaje}%"></div>
                                </div>
                                <div class="progress-detail">
                                    <span>${modulosInfo.completados} de ${modulosInfo.total} módulos completados</span>
                                </div>
                            </div>

                            <!-- Última actividad -->
                            <div class="last-activity">
                                <i class="fas fa-history me-1"></i>
                                <span>${lastActivity}</span>
                            </div>

                            <!-- Botón de acción -->
                            <button class="btn ${buttonClass} w-100" onclick="goToCourse(${curso.id})">
                                <i class="fas ${buttonIcon} me-2"></i>${buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Formatear tiempo relativo
    function formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Hace un momento';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    }

    // Ir al curso
    window.goToCourse = (cursoId) => {
        // Guardar curso activo y última posición
        localStorage.setItem('activeCourseId', cursoId);
        const ultimaClase = CursosData.getUltimaClase(cursoId);
        if (ultimaClase) {
            localStorage.setItem('activeClaseId', ultimaClase.claseId);
            localStorage.setItem('activeModuloId', ultimaClase.moduloId);
        }
        window.location.href = 'claseAlumn.html';
    };

    // Buscador
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            const cursos = CursosData.getCursosAdquiridos();

            if (term === '') {
                renderCourses(cursos);
                return;
            }

            const filtered = cursos.filter(curso =>
                curso.nombre.toLowerCase().includes(term) ||
                curso.descripcion?.toLowerCase().includes(term)
            );
            renderCourses(filtered);
        });
    }

    // Cargar cursos iniciales
    const cursosAdquiridos = CursosData.getCursosAdquiridos();
    renderCourses(cursosAdquiridos);
});
