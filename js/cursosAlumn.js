// js/cursosAlumn.js - Dashboard Personal "Mis Cursos" (H6.1)
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión primero
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        localStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'login.html';
        return;
    }

    // Inicializar navbar (esperar a que UI esté disponible)
    if (typeof window.UI !== 'undefined' && window.UI.initNavbar) {
        await window.UI.initNavbar();
    }

    // Inicializar datos
    if (typeof CursosData !== 'undefined') {
        CursosData.init();
        CursosData.initStudent();
    }

    // Referencias DOM
    const coursesGrid = document.getElementById('courses-grid');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('searchCourses');
    const welcomeText = document.getElementById('welcome-text');

    // Mostrar nombre de alumna desde Supabase
    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', session.user.id)
        .single();

    if (welcomeText && profile?.first_name) {
        welcomeText.textContent = `Bienvenida de vuelta, ${profile.first_name}`;
    }

    // Renderizar cursos
    function renderCourses(cursos) {
        if (!coursesGrid) return;

        if (!cursos || cursos.length === 0) {
            coursesGrid.classList.add('d-none');
            if (emptyState) emptyState.classList.remove('d-none');
            return;
        }

        coursesGrid.classList.remove('d-none');
        if (emptyState) emptyState.classList.add('d-none');

        coursesGrid.innerHTML = cursos.map(curso => {
            const progreso = curso.progreso || { porcentaje: 0, completados: 0 };
            const isCompleted = progreso.porcentaje === 100;
            const modulos = typeof CursosData !== 'undefined' ? CursosData.getModulosByCurso(curso.id) : [];
            const modulosInfo = typeof CursosData !== 'undefined' ? CursosData.getModulosCompletados(curso.id) : { completados: 0, total: 0 };

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
                            <img src="${curso.portada_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=200&fit=crop'}" alt="${curso.nombre}">
                            <div class="course-overlay">
                                <span class="duration-badge">
                                    <i class="fas fa-clock me-1"></i>${typeof CursosData !== 'undefined' ? CursosData.formatearDuracion(CursosData.calcularDuracionCurso(curso.id)) : ''}
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

                            <!-- Acceso/Expiración -->
                            ${(() => {
                                if (!curso.acceso || !curso.acceso.fechaExpiracion) {
                                    return '';
                                }

                                let accesoClass = 'text-success';
                                let accesoIcon = 'fa-check-circle';

                                if (curso.accesoExpirado) {
                                    accesoClass = 'text-danger';
                                    accesoIcon = 'fa-exclamation-circle';
                                } else if (curso.accesoPorVencer) {
                                    accesoClass = 'text-warning';
                                    accesoIcon = 'fa-clock';
                                }

                                return `
                                    <div class="access-info mb-3 p-2 rounded" style="background: rgba(138, 131, 90, 0.05);">
                                        <div class="d-flex align-items-center">
                                            <i class="fas ${accesoIcon} ${accesoClass} me-2"></i>
                                            <div class="flex-grow-1">
                                                <small class="d-block fw-semibold ${accesoClass}">${curso.tiempoRestante}</small>
                                                <small class="text-muted d-block" style="font-size: 0.75rem;">Acceso hasta: ${curso.fechaExpiracionFormato}</small>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            })()}

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
        if (typeof CursosData !== 'undefined') {
            const ultimaClase = CursosData.getUltimaClase(cursoId);
            if (ultimaClase) {
                localStorage.setItem('activeClaseId', ultimaClase.claseId);
                localStorage.setItem('activeModuloId', ultimaClase.moduloId);
            }
        }
        window.location.href = 'claseAlumn.html';
    };

    // Buscador
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            const cursos = typeof CursosData !== 'undefined' ? CursosData.getCursosAdquiridos() : [];

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
    const cursosAdquiridos = typeof CursosData !== 'undefined' ? CursosData.getCursosAdquiridos() : [];
    renderCourses(cursosAdquiridos);
});
