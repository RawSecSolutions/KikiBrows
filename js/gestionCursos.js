// js/gestionCursos.js - Lógica para Gestión de Cursos (conectado con Supabase)

import { CursosService, supabase } from './cursosService.js';

document.addEventListener('DOMContentLoaded', async () => {

    const cursosGrid = document.getElementById('cursosGrid');

    // Estado de paginación
    let currentPage = 1;
    const cursosPerPage = 8;
    let totalCursos = 0;
    let allCursos = [];

    /**
     * Cargar cursos desde Supabase
     */
    async function cargarCursos() {
        try {
            cursosGrid.innerHTML = `
                <div class="text-center py-5 w-100">
                    <div class="spinner-border text-secondary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="text-muted mt-2">Cargando cursos...</p>
                </div>
            `;

            // Obtener todos los cursos desde Supabase
            const { data: cursos, error } = await supabase
                .from('cursos')
                .select(`
                    id,
                    nombre,
                    descripcion,
                    precio,
                    imagen_url,
                    publicado,
                    created_at,
                    modulos (id)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            allCursos = cursos || [];
            totalCursos = allCursos.length;

            if (totalCursos === 0) {
                cursosGrid.innerHTML = `
                    <div class="text-center py-5 w-100">
                        <i class="fas fa-folder-open fs-1 text-muted mb-3"></i>
                        <p class="text-muted">No hay cursos creados aún.</p>
                        <a href="creaCurso.html" class="btn btn-outline-secondary">
                            <i class="fas fa-plus me-2"></i>Crear primer curso
                        </a>
                    </div>
                `;
                actualizarPaginacion();
                return;
            }

            renderizarCursos();
            actualizarPaginacion();

        } catch (error) {
            console.error('Error cargando cursos:', error);
            cursosGrid.innerHTML = `
                <div class="text-center py-5 w-100">
                    <i class="fas fa-exclamation-triangle fs-1 text-danger mb-3"></i>
                    <p class="text-danger">Error al cargar los cursos</p>
                    <button class="btn btn-outline-primary" onclick="location.reload()">
                        <i class="fas fa-sync me-2"></i>Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * Renderizar cursos en el grid
     */
    function renderizarCursos() {
        const startIndex = (currentPage - 1) * cursosPerPage;
        const endIndex = startIndex + cursosPerPage;
        const cursosToShow = allCursos.slice(startIndex, endIndex);

        if (cursosToShow.length === 0) {
            cursosGrid.innerHTML = `
                <div class="text-center py-5 w-100">
                    <p class="text-muted">No hay cursos en esta página.</p>
                </div>
            `;
            return;
        }

        cursosGrid.innerHTML = cursosToShow.map(curso => {
            const fecha = new Date(curso.created_at).toLocaleDateString('es-CL', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });

            const estadoBadge = curso.publicado
                ? '<span class="badge bg-success position-absolute top-0 start-0 m-2" style="font-size: 0.7rem; font-weight: 600;">PUBLICADO</span>'
                : '<span class="badge bg-secondary position-absolute top-0 start-0 m-2" style="font-size: 0.7rem; font-weight: 600;">BORRADOR</span>';

            const imagenHTML = curso.imagen_url
                ? `<img src="${curso.imagen_url}" alt="${curso.nombre}" class="w-100 h-100" style="object-fit: cover;">`
                : '<i class="fas fa-image fs-1 text-muted opacity-25"></i>';

            const modulosCount = curso.modulos ? curso.modulos.length : 0;

            return `
                <div class="curso-card border shadow-sm" data-curso-id="${curso.id}">
                    <div class="curso-imagen bg-light d-flex align-items-center justify-content-center" style="height: 140px; position: relative;">
                        ${imagenHTML}
                        ${estadoBadge}
                        <a href="course-preview.html?id=${curso.id}&preview=true" target="_blank" class="btn btn-sm btn-light position-absolute bottom-0 start-0 m-2 border fw-bold" title="Vista Previa">
                            <i class="far fa-eye me-1"></i>VER
                        </a>
                        <a href="creaCurso.html?id=${curso.id}" class="btn btn-sm btn-white position-absolute top-0 end-0 m-2 rounded-circle shadow-sm" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #8A835A;" title="Editar">
                            <i class="fas fa-pen"></i>
                        </a>
                    </div>
                    <div class="p-3">
                        <h3 class="fs-6 fw-bold text-dark mb-1 text-truncate" title="${curso.nombre}">${curso.nombre}</h3>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted"><i class="far fa-clock me-1"></i>${fecha}</small>
                            <small class="text-muted"><i class="fas fa-book me-1"></i>${modulosCount} módulos</small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Actualizar paginación
     */
    function actualizarPaginacion() {
        const totalPages = Math.ceil(totalCursos / cursosPerPage);
        const paginationContainer = document.querySelector('.pagination');

        if (!paginationContainer || totalPages <= 1) {
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
            }
            return;
        }

        let paginationHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === currentPage;
            paginationHTML += `
                <li class="page-item ${isActive ? 'active' : ''}">
                    <a class="page-link ${isActive ? 'text-white' : ''}"
                       href="#"
                       data-page="${i}"
                       style="${isActive ? 'background-color: #8A835A; border-color: #8A835A;' : 'color: #8A835A;'}">
                        ${i}
                    </a>
                </li>
            `;
        }

        paginationContainer.innerHTML = paginationHTML;

        // Event listeners para paginación
        paginationContainer.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.getAttribute('data-page'));
                if (page !== currentPage) {
                    currentPage = page;
                    renderizarCursos();
                    actualizarPaginacion();
                }
            });
        });
    }

    // Cargar cursos al iniciar
    await cargarCursos();

});
