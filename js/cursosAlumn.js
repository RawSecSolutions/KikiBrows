// js/cursosAlumn.js - Dashboard Personal "Mis Cursos" (H6.1)
import { CursosService, supabase } from './cursosService.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión usando el cliente centralizado
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
        localStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'login.html';
        return;
    }

    // Almacén local para los cursos cargados (usado por el buscador)
    let cursosCargados = [];

    // Referencias DOM
    const coursesGrid = document.getElementById('courses-grid');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('searchCourses');
    const welcomeText = document.getElementById('welcome-text');

    // Inicializar Navbar
    if (typeof window.UI !== 'undefined' && window.UI.initNavbar) {
        await window.UI.initNavbar();
    }

    // Mostrar bienvenida personalizada
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', session.user.id)
            .single();

        if (welcomeText && profile?.first_name) {
            welcomeText.textContent = `Bienvenida de vuelta, ${profile.first_name}`;
        }
    } catch (e) { console.error("Error cargando perfil:", e); }

    /**
     * Función auxiliar para calcular días restantes de acceso
     */
    function obtenerInfoAcceso(fechaExpiracion) {
        if (!fechaExpiracion) return { texto: "Acceso Vitalicio", urgente: false };
        
        const hoy = new Date();
        const exp = new Date(fechaExpiracion);
        const diffTime = exp - hoy;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) return { texto: "Acceso Expirado", urgente: true };
        if (diffDays === 1) return { texto: "¡Último día!", urgente: true };
        if (diffDays < 7) return { texto: `Quedan ${diffDays} días`, urgente: true };
        
        return { texto: `Acceso: ${diffDays} días`, urgente: false };
    }

    // Función principal de renderizado
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
            const progresoPorcentaje = curso.progreso?.porcentaje || 0;
            const isCompleted = progresoPorcentaje === 100;
            
            // Calculamos la información de acceso (Días restantes)
            const acceso = obtenerInfoAcceso(curso.fechaExpiracion);

            let btnText = 'Continuar Aprendiendo', btnIcon = 'fa-play', btnClass = 'btn-kiki', btnDisabled = false;

            if (curso.accesoExpirado || acceso.texto === "Acceso Expirado") {
                btnText = 'Acceso Expirado'; 
                btnIcon = 'fa-lock'; 
                btnClass = 'btn-secondary'; 
                btnDisabled = true;
            } else if (isCompleted) {
                btnText = 'Revisar Contenido'; 
                btnIcon = 'fa-eye'; 
                btnClass = 'btn-kiki-secondary';
            } else if (progresoPorcentaje === 0) {
                btnText = 'Comenzar Curso';
            }

            return `
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="course-card ${isCompleted ? 'completed' : ''} ${btnDisabled ? 'expired' : ''}">
                        ${isCompleted ? '<div class="completed-badge"><i class="fas fa-check-circle me-1"></i>Completado</div>' : ''}
                        <div class="course-image">
                            <img src="${curso.portada_url || 'img/default-course.jpg'}" alt="${curso.nombre}">
                            <div class="course-overlay">
                                <span class="duration-badge ${acceso.urgente ? 'bg-danger' : ''}">
                                    <i class="fas fa-calendar-alt me-1"></i>${acceso.texto}
                                </span>
                            </div>
                        </div>
                        <div class="course-body">
                            <h5 class="course-title">${curso.nombre}</h5>
                            <p class="course-description">${curso.descripcion?.substring(0, 80) || 'Sin descripción'}...</p>

                            <div class="progress-section mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="progress-label">Tu progreso</span>
                                    <span class="progress-percentage ${isCompleted ? 'text-success' : ''}">${progresoPorcentaje}%</span>
                                </div>
                                <div class="progress-bar-container" style="background: #eee; height: 8px; border-radius: 4px; overflow: hidden;">
                                    <div class="progress-bar-fill ${isCompleted ? 'completed' : ''}" 
                                         style="width: ${progresoPorcentaje}%; background: var(--kiki-gold, #8A835A); height: 100%; transition: width 0.3s ease;">
                                    </div>
                                </div>
                            </div>

                            <button class="btn ${btnClass} w-100 mt-2" ${btnDisabled ? 'disabled' : `onclick="goToCourse('${curso.id}')"`}>
                                <i class="fas ${btnIcon} me-2"></i>${btnText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Buscador
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            if (term === '') {
                renderCourses(cursosCargados);
                return;
            }
            const filtered = cursosCargados.filter(c => 
                c.nombre.toLowerCase().includes(term) || 
                c.descripcion?.toLowerCase().includes(term)
            );
            renderCourses(filtered);
        });
    }

    // Carga de datos real desde Supabase
    async function cargarDashboard() {
        try {
            const result = await CursosService.getCursosAdquiridos(session.user.id);
            if (result.success) {
                cursosCargados = result.data;
                renderCourses(cursosCargados);
            } else {
                console.error("Error al cargar cursos:", result.error);
                renderCourses([]);
            }
        } catch (error) {
            console.error("Fallo crítico en el dashboard:", error);
        }
    }

    // Navegación
    window.goToCourse = (cursoId) => {
        localStorage.setItem('activeCourseId', cursoId);
        window.location.href = 'claseAlumn.html';
    };

    cargarDashboard();
});