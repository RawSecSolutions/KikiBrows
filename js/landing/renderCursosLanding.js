// js/renderCursosLanding.js - Renderiza dinámicamente los cursos en index.html
// CORREGIDO: Ahora usa 'portada_url' que es el nombre real en Supabase

import { SUPABASE_URL, SUPABASE_KEY } from '../shared/config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    renderizarCursos();
});

async function renderizarCursos() {
    const container = document.querySelector('.productos-grid');

    if (!container) {
        console.warn('Container .productos-grid no encontrado en la página');
        return;
    }

    // Mostrar estado de carga
    container.innerHTML = `
        <div class="text-center py-5 w-100">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2 text-muted">Cargando cursos...</p>
        </div>
    `;

    try {
        // CORRECCIÓN AQUÍ: Cambiado 'portada' por 'portada_url'
        const { data: cursosPublicados, error } = await supabase
            .from('cursos')
            .select('id, nombre, descripcion, portada_url, precio, estado')
            .eq('estado', 'PUBLICADO')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!cursosPublicados || cursosPublicados.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No hay cursos disponibles en este momento.</p>';
            return;
        }

        // Crear carrusel en lugar de grid
        crearCarruselCursos(container, cursosPublicados);

        console.log(`${cursosPublicados.length} cursos renderizados en carrusel`);

    } catch (error) {
        console.error('Error al cargar cursos:', error);

        // Fallback: intentar usar CursosData si está disponible
        if (typeof CursosData !== 'undefined' && CursosData._initialized) {
            const todosLosCursos = CursosData.getAllCursos();
            const cursosPublicados = todosLosCursos.filter(curso => curso.estado === 'PUBLICADO');

            if (cursosPublicados.length > 0) {
                crearCarruselCursos(container, cursosPublicados);
                return;
            }
        }

        container.innerHTML = `
            <div class="text-center py-5 w-100">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <p class="text-muted">No se pudieron cargar los cursos. Intenta de nuevo más tarde.</p>
                <button class="btn btn-outline-primary mt-2" onclick="window.renderizarCursos()">
                    <i class="fas fa-refresh me-2"></i>Reintentar
                </button>
            </div>
        `;
    }
}

function crearCarruselCursos(container, cursos) {
    // Configuración: cuántos cursos mostrar por slide según el tamaño de pantalla
    const cursosPerSlide = {
        desktop: 3, // >= 992px
        tablet: 2,  // >= 768px
        mobile: 1   // < 768px
    };

    // Determinar cuántos cursos por slide según el ancho actual
    let itemsPerSlide = cursosPerSlide.mobile;
    if (window.innerWidth >= 992) {
        itemsPerSlide = cursosPerSlide.desktop;
    } else if (window.innerWidth >= 768) {
        itemsPerSlide = cursosPerSlide.tablet;
    }

    // Dividir cursos en grupos (slides)
    const slides = [];
    for (let i = 0; i < cursos.length; i += itemsPerSlide) {
        slides.push(cursos.slice(i, i + itemsPerSlide));
    }

    // Crear estructura del carrusel
    const carouselId = 'cursosCarousel';
    const carouselHTML = `
        <div id="${carouselId}" class="carousel slide cursos-carousel" data-bs-ride="false">
            <div class="carousel-inner">
                ${slides.map((slide, index) => `
                    <div class="carousel-item ${index === 0 ? 'active' : ''}">
                        <div class="row g-4 justify-content-center">
                            ${slide.map(curso => `
                                <div class="col-12 col-md-6 col-lg-4">
                                    ${crearTarjetaCursoHTML(curso)}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>

            ${slides.length > 1 ? `
                <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Anterior</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Siguiente</span>
                </button>
            ` : ''}
        </div>
    `;

    container.innerHTML = carouselHTML;

    // Manejar redimensionamiento de ventana para reorganizar slides
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            renderizarCursos(); // Re-renderizar con nuevo tamaño
        }, 250);
    });
}

function crearTarjetaCursoHTML(curso) {
    // CORRECCIÓN AQUÍ: Cambiado curso.portada por curso.portada_url
    const imagenUrl = curso.portada_url || 'img/curso-default.jpg';
    
    const descripcionCorta = curso.descripcion && curso.descripcion.length > 100
        ? curso.descripcion.substring(0, 100) + '...'
        : (curso.descripcion || 'Sin descripción disponible');

    return `
        <div class="producto-card" data-curso-id="${curso.id}">
            <div class="producto-image" style="background-image: url('${imagenUrl}');"></div>
            <div class="producto-content">
                <h3 class="producto-title">${curso.nombre}</h3>
                <p class="producto-description">${descripcionCorta}</p>
                <a href="course-preview.html?id=${curso.id}" class="register-button w-100 text-center d-block btn-ver-curso">Ver</a>
            </div>
        </div>
    `;
}

function crearTarjetaCurso(curso) {
    const card = document.createElement('div');
    card.className = 'producto-card';
    card.dataset.cursoId = curso.id;

    // CORRECCIÓN AQUÍ: Cambiado curso.portada por curso.portada_url
    const imagenUrl = curso.portada_url || 'img/curso-default.jpg';

    // Truncar descripción si es muy larga
    const descripcionCorta = curso.descripcion && curso.descripcion.length > 100
        ? curso.descripcion.substring(0, 100) + '...'
        : (curso.descripcion || 'Sin descripción disponible');

    card.innerHTML = `
        <div class="producto-image" style="background-image: url('${imagenUrl}');"></div>
        <div class="producto-content">
            <h3 class="producto-title">${curso.nombre}</h3>
            <p class="producto-description">${descripcionCorta}</p>
            <a href="course-preview.html?id=${curso.id}" class="register-button w-100 text-center d-block btn-ver-curso">Ver</a>
        </div>
    `;

    return card;
}

// Función para refrescar la lista de cursos (útil para actualizaciones dinámicas)
function refrescarCursos() {
    renderizarCursos();
}

// Exportar funciones para uso externo si es necesario
window.renderizarCursos = renderizarCursos;
window.refrescarCursos = refrescarCursos;