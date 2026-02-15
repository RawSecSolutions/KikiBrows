// js/cursosAlumn.js - Dashboard Personal "Mis Cursos" (H6.1)
// IMPORTANTE: Importamos supabase y el servicio desde el mismo lugar para evitar errores de instancia
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
            // Usamos los datos de progreso que vienen de la tabla 'inscripciones' o de 'CursosData'
            const progresoPorcentaje = curso.progreso?.porcentaje || 0;
            const isCompleted = progresoPorcentaje === 100;
            
            // Datos de duración (Fallback si CursosData no está disponible)
            let duracionTexto = "Consultando...";
            if (typeof CursosData !== 'undefined') {
                const duracionMins = CursosData.calcularDuracionCurso(curso.id);
                duracionTexto = CursosData.formatearDuracion(duracionMins);
            }

            // Lógica de botones
            let btnText = 'Continuar', btnIcon = 'fa-play', btnClass = 'btn-kiki', btnDisabled = false;

            if (curso.accesoExpirado) {
                btnText = 'Acceso Expirado'; btnIcon = 'fa-lock'; btnClass = 'btn-secondary'; btnDisabled = true;
            } else if (isCompleted) {
                btnText = 'Revisar Contenido'; btnIcon = 'fa-eye'; btnClass = 'btn-kiki-secondary';
            } else if (progresoPorcentaje === 0) {
                btnText = 'Comenzar';
            }

            return `
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="course-card ${isCompleted ? 'completed' : ''}">
                        ${isCompleted ? '<div class="completed-badge"><i class="fas fa-check-circle me-1"></i>Completado</div>' : ''}
                        <div class="course-image">
                            <img src="${curso.portada_url || 'img/default-course.jpg'}" alt="${curso.nombre}">
                            <div class="course-overlay">
                                <span class="duration-badge"><i class="fas fa-clock me-1"></i>${duracionTexto}</span>
                            </div>
                        </div>
                        <div class="course-body">
                            <h5 class="course-title">${curso.nombre}</h5>
                            <p class="course-description">${curso.descripcion?.substring(0, 80) || 'Sin descripción'}...</p>

                            <div class="progress-section">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="progress-label">Tu progreso</span>
                                    <span class="progress-percentage ${isCompleted ? 'text-success' : ''}">${progresoPorcentaje}%</span>
                                </div>
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill ${isCompleted ? 'completed' : ''}" style="width: ${progresPorcentaje}%"></div>
                                </div>
                            </div>

                            <button class="btn ${btnClass} w-100 mt-3" ${btnDisabled ? 'disabled' : `onclick="goToCourse('${curso.id}')"`}>
                                <i class="fas ${btnIcon} me-2"></i>${btnText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Buscador corregido
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

    // CARGA DE DATOS REAL
    async function cargarDashboard() {
        const result = await CursosService.getCursosAdquiridos(session.user.id);
        if (result.success) {
            cursosCargados = result.data;
            renderCourses(cursosCargados);
        } else {
            console.error("Error al cargar cursos:", result.error);
            renderCourses([]);
        }
    }

    // Navegación
    window.goToCourse = (cursoId) => {
        localStorage.setItem('activeCourseId', cursoId);
        window.location.href = 'claseAlumn.html';
    };

    cargarDashboard();
});