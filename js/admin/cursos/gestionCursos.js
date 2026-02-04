// js/gestionCursos.js - Lógica para Gestión de Cursos (conectado con Supabase)
// Adaptado para respetar diseño CSS Grid y paleta de colores (#8A835A)

import { SUPABASE_URL, SUPABASE_KEY } from '../../shared/config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
            if (!cursosGrid) return;

            cursosGrid.innerHTML = `
                <div class="col-12 d-flex flex-column align-items-center justify-content-center text-center py-5" style="grid-column: 1 / -1;">
                    <div class="spinner-border text-secondary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="text-muted mt-2">Cargando cursos...</p>
                </div>
            `;

            // Obtener todos los cursos
            const { data: cursos, error } = await supabase
                .from('cursos')
                .select(`
                    id,
                    nombre,
                    descripcion,
                    precio,
                    portada_url,
                    estado,
                    created_at,
                    modulos (id)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            allCursos = cursos || [];
            totalCursos = allCursos.length;

            if (totalCursos === 0) {
                // grid-column: 1 / -1 asegura que el mensaje ocupe todo el ancho del grid
                cursosGrid.innerHTML = `
                    <div class="d-flex flex-column align-items-center justify-content-center text-center py-5" style="grid-column: 1 / -1;">
                        <i class="fas fa-folder-open fs-1 text-muted mb-3 d-block"></i>
                        <p class="text-muted">No hay cursos creados aún.</p>
                        <a href="creaCurso.html" class="btn btn-outline-secondary mt-3">
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
                <div class="d-flex flex-column align-items-center justify-content-center text-center py-5" style="grid-column: 1 / -1;">
                    <i class="fas fa-exclamation-triangle fs-1 text-danger mb-3 d-block"></i>
                    <p class="text-danger">Error al cargar los cursos</p>
                    <button class="btn btn-outline-primary mt-2" onclick="location.reload()">
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
                <div class="text-center py-5 text-muted" style="grid-column: 1 / -1;">
                    No hay cursos en esta página.
                </div>
            `;
            return;
        }

        cursosGrid.innerHTML = cursosToShow.map(curso => {
            const fecha = new Date(curso.created_at).toLocaleDateString('es-CL', {
                day: '2-digit', month: '2-digit', year: '2-digit'
            });

            // Badge de estado
            const estadoBadge = curso.estado === 'PUBLICADO'
                ? '<span class="badge bg-success position-absolute top-0 start-0 m-2 shadow-sm" style="font-size: 0.7rem;">PUBLICADO</span>'
                : '<span class="badge bg-secondary position-absolute top-0 start-0 m-2 shadow-sm" style="font-size: 0.7rem;">BORRADOR</span>';

            // Imagen
            const imagenHTML = curso.portada_url
                ? `<img src="${curso.portada_url}" alt="${curso.nombre}" class="w-100 h-100" style="object-fit: cover;">`
                : '<div class="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted"><i class="fas fa-image fs-1 opacity-25"></i></div>';

            const modulosCount = curso.modulos ? curso.modulos.length : 0;
            
            // Formatear precio
            const precioFormatted = (curso.precio || 0).toLocaleString('es-CL');

            return `
                <div class="curso-card border shadow-sm rounded bg-white overflow-hidden" data-curso-id="${curso.id}">
                    
                    <div class="curso-imagen position-relative" style="height: 140px;">
                        ${imagenHTML}
                        ${estadoBadge}

                        <div class="position-absolute top-0 end-0 m-2 d-flex gap-2">
                            <a href="creaCurso.html?id=${curso.id}" class="btn btn-sm btn-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" 
                               style="width: 32px; height: 32px; color: #8A835A; background: white;" 
                               title="Editar">
                                <i class="fas fa-pen"></i>
                            </a>
                            <button class="btn btn-sm btn-white rounded-circle shadow-sm d-flex align-items-center justify-content-center btn-eliminar-curso" 
                                    data-id="${curso.id}"
                                    style="width: 32px; height: 32px; color: #dc3545; background: white;" 
                                    title="Eliminar">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>

                        <a href="course-preview.html?id=${curso.id}&preview=true" target="_blank" 
                           class="btn btn-sm btn-light position-absolute bottom-0 start-0 m-2 border fw-bold shadow-sm" 
                           style="opacity: 0.95; font-size: 0.75rem;" title="Vista Previa como Cliente">
                            <i class="far fa-eye me-1"></i>VER
                        </a>
                    </div>

                    <div class="p-3">
                        <h3 class="fs-6 fw-bold text-dark mb-2 text-truncate" title="${curso.nombre}">
                            ${curso.nombre}
                        </h3>
                        
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <small class="text-muted" style="font-size: 0.8rem;">
                                <i class="far fa-clock me-1"></i>${fecha}
                            </small>
                            <small class="text-muted" style="font-size: 0.8rem;">
                                <i class="fas fa-book me-1"></i>${modulosCount} mód.
                            </small>
                        </div>

                        <div class="text-end border-top pt-2 mt-2">
                            <span class="fw-bold" style="color: #8A835A; font-size: 0.95rem;">
                                $${precioFormatted}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Activar listeners para botones de eliminar
        document.querySelectorAll('.btn-eliminar-curso').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                eliminarCurso(id);
            });
        });
    }

    /**
     * Eliminar Curso
     */
    async function eliminarCurso(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.')) {
            try {
                // Eliminar de Supabase
                const { error } = await supabase.from('cursos').delete().eq('id', id);
                
                if (error) {
                    console.error('Error al eliminar:', error);
                    // Código 23503 es violación de llave foránea (tiene datos relacionados)
                    if (error.code === '23503') { 
                        alert('No se puede eliminar el curso porque tiene alumnos inscritos o transacciones asociadas.');
                    } else {
                        alert('Hubo un error al eliminar el curso.');
                    }
                    return;
                }

                // Recargar lista
                await cargarCursos();
                
            } catch (error) {
                console.error(error);
                alert('Error inesperado al eliminar el curso.');
            }
        }
    }

    /**
     * Actualizar paginación
     */
    function actualizarPaginacion() {
        const totalPages = Math.ceil(totalCursos / cursosPerPage);
        const paginationContainer = document.querySelector('.pagination');

        if (!paginationContainer) return;
        
        // Limpiar si no hay páginas o solo 1 (opcional, pero mejor UX dejarlo visible o ocultarlo según prefieras)
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
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

        // Event listeners
        paginationContainer.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.getAttribute('data-page'));
                if (page && page !== currentPage) {
                    currentPage = page;
                    renderizarCursos();
                    actualizarPaginacion();
                }
            });
        });
    }

    // Inicializar
    await cargarCursos();

});