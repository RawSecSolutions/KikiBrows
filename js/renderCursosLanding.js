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

    // Renderizar cada curso
    cursosPublicados.forEach(curso => {
        const cursoCard = crearTarjetaCurso(curso);
        container.appendChild(cursoCard);
    });

    console.log(`${cursosPublicados.length} cursos renderizados en el landing`);
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
            <button type="button" class="register-button w-100 text-center d-block btn-ver-curso">Ver</button>
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
