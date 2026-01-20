// js/coursePreviewModal.js - Modal de Preview de Cursos para Landing
// NOTA: Este archivo ahora usa CursosData del sistema unificado (cursosData.js)
// Adaptado de previsualizaCurso.js para funcionar con modal en lugar de página completa

// ==================== FUNCIONES AUXILIARES ====================

// Función para formatear precio en CLP
function formatearPrecio(precio) {
    return `$${precio.toLocaleString('es-CL')}`;
}

// Función para calcular duración total del curso
function calcularDuracionTotal(cursoId) {
    const duracion = CursosData.calcularDuracionCurso(cursoId);
    return CursosData.formatearDuracion(duracion);
}

// Función para contar clases totales
function contarClasesTotales(modulos) {
    return modulos.reduce((total, modulo) => {
        const clases = CursosData.getClasesByModulo(modulo.id);
        return total + clases.length;
    }, 0);
}

// ==================== CARGAR CURSO EN MODAL ====================

function cargarCursoEnModal(cursoId) {
    // Inicializar CursosData si es necesario
    if (typeof CursosData.init === 'function') {
        CursosData.init();
    }

    const curso = CursosData.getCurso(cursoId);

    if (!curso) {
        console.error('Curso no encontrado:', cursoId);
        mostrarErrorEnModal('Curso no encontrado');
        return;
    }

    console.log('Cargando curso en modal:', curso);

    // Actualizar título del modal
    document.getElementById('coursePreviewModalLabel').textContent = curso.nombre;

    // Actualizar descripción
    document.getElementById('courseDescription').textContent =
        curso.descripcion || 'Sin descripción disponible.';

    // Actualizar duración
    document.getElementById('courseDuration').textContent = calcularDuracionTotal(cursoId);

    // Obtener módulos y calcular estadísticas
    const modulos = CursosData.getModulosByCurso(cursoId);
    const totalClases = contarClasesTotales(modulos);

    // Actualizar número de módulos
    document.getElementById('courseModules').textContent = `${modulos.length} módulos · ${totalClases} clases`;

    // Actualizar precio
    const precioFormateado = formatearPrecio(curso.precio || 0);
    document.getElementById('coursePrice').textContent = precioFormateado;

    // Generar lista de contenido
    cargarModulosEnModal(cursoId, modulos);
}

// ==================== CARGAR MÓDULOS ====================

function cargarModulosEnModal(cursoId, modulos) {
    const contentList = document.getElementById('courseContentList');
    contentList.innerHTML = '';

    if (modulos.length === 0) {
        contentList.innerHTML = `
            <div class="text-center text-muted p-4">
                <i class="fas fa-folder-open fa-2x mb-2"></i>
                <p>Este curso aún no tiene módulos configurados.</p>
            </div>
        `;
        return;
    }

    modulos.forEach((modulo, index) => {
        const clases = CursosData.getClasesByModulo(modulo.id);
        const duracionModulo = CursosData.calcularDuracionModulo(modulo.id);
        const moduloEl = crearModuloElement(modulo, clases, duracionModulo, index);
        contentList.appendChild(moduloEl);
    });
}

function crearModuloElement(modulo, clases, duracion, index) {
    const moduloDiv = document.createElement('div');
    moduloDiv.className = 'modulo-preview mb-3';

    const duracionFormateada = CursosData.formatearDuracion(duracion);

    moduloDiv.innerHTML = `
        <div class="modulo-preview-header" data-bs-toggle="collapse" data-bs-target="#modulo${index}" aria-expanded="${index === 0 ? 'true' : 'false'}">
            <div class="modulo-preview-title">
                <i class="fas fa-book me-2"></i>
                <strong>Módulo ${index + 1}:</strong> ${modulo.nombre}
            </div>
            <div class="modulo-preview-meta">
                <span class="text-muted">${clases.length} clases · ${duracionFormateada}</span>
                <i class="fas fa-chevron-down ms-2"></i>
            </div>
        </div>
        <div class="collapse ${index === 0 ? 'show' : ''}" id="modulo${index}">
            <div class="modulo-preview-body">
                ${clases.map((clase, claseIndex) => crearClaseHTML(clase, claseIndex)).join('')}
            </div>
        </div>
    `;

    return moduloDiv;
}

function crearClaseHTML(clase, claseIndex) {
    const iconos = {
        video: 'fa-play-circle',
        texto: 'fa-file-alt',
        pdf: 'fa-file-pdf',
        quiz: 'fa-question-circle',
        entrega: 'fa-upload'
    };

    const tipoClase = clase.tipo || 'video';
    const icono = iconos[tipoClase] || 'fa-play-circle';

    return `
        <div class="clase-preview-item">
            <i class="fas ${icono} me-2"></i>
            <span class="clase-preview-name">${claseIndex + 1}. ${clase.nombre}</span>
            <span class="clase-preview-duration text-muted">${clase.duracion} min</span>
        </div>
    `;
}

// ==================== MANEJO DE ERRORES ====================

function mostrarErrorEnModal(mensaje) {
    const contentList = document.getElementById('courseContentList');
    if (contentList) {
        contentList.innerHTML = `
            <div class="text-center text-danger p-4">
                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                <p>${mensaje}</p>
            </div>
        `;
    }
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando coursePreviewModal.js');

    const modalElement = document.getElementById('coursePreviewModal');

    if (!modalElement) {
        console.error('Modal element #coursePreviewModal not found');
        return;
    }

    // Usar delegación de eventos para manejar botones dinámicos
    document.addEventListener('click', (e) => {
        const botonVer = e.target.closest('.btn-ver-curso');

        if (!botonVer) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        console.log('Botón Ver clickeado');

        const card = botonVer.closest('.producto-card');
        if (!card) {
            console.error('Producto card not found');
            return;
        }

        const cursoId = parseInt(card.dataset.cursoId);
        console.log('Curso ID:', cursoId);

        if (isNaN(cursoId)) {
            console.error('ID de curso inválido:', card.dataset.cursoId);
            return;
        }

        // Cargar el contenido del curso
        cargarCursoEnModal(cursoId);

        // Crear y mostrar el modal
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    });

    console.log('Event listener para botones "Ver" configurado correctamente');
});
