// js/renderCursosLanding.js - Renderiza dinámicamente los cursos en index.html
// Este script carga cursos desde CursosData y genera las tarjetas automáticamente

document.addEventListener('DOMContentLoaded', () => {
    renderizarCursos();
});

function renderizarCursos() {
    const container = document.querySelector('.productos-grid');

    if (!container) {
        console.warn('Container .productos-grid no encontrado en la página');
        return;
    }

    // Limpiar contenido existente
    container.innerHTML = '';

    // Obtener todos los cursos publicados
    const todosLosCursos = CursosData.getAllCursos();
    const cursosPublicados = todosLosCursos.filter(curso => curso.estado === 'publicado');

    if (cursosPublicados.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No hay cursos disponibles en este momento.</p>';
        return;
    }

    // Crear carrusel en lugar de grid
    crearCarruselCursos(container, cursosPublicados);

    console.log(`${cursosPublicados.length} cursos renderizados en carrusel`);
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
    const imagenUrl = curso.portada || 'tu-imagen-curso-default.jpg';
    const descripcionCorta = curso.descripcion.length > 100
        ? curso.descripcion.substring(0, 100) + '...'
        : curso.descripcion;

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

    // Imagen de portada (si existe, sino usa placeholder)
    const imagenUrl = curso.portada || 'tu-imagen-curso-default.jpg';

    // Truncar descripción si es muy larga
    const descripcionCorta = curso.descripcion.length > 100
        ? curso.descripcion.substring(0, 100) + '...'
        : curso.descripcion;

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
