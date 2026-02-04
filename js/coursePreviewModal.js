// js/coursePreviewModal.js - Versión corregida
// CORREGIDO: Maneja cursoId como UUID (string), no como número

// ==================== FUNCIONES AUXILIARES ====================

function formatearPrecio(precio) {
    return `$ ${(precio || 0).toLocaleString('es-CL')}`;
}

function calcularDuracionTotal(cursoId) {
    if (typeof CursosData.calcularDuracionCurso !== 'function') return '0 min';
    const duracion = CursosData.calcularDuracionCurso(cursoId);
    return CursosData.formatearDuracion(duracion);
}

function contarClasesTotales(modulos) {
    if (!modulos) return 0;
    return modulos.reduce((total, modulo) => {
        const clases = CursosData.getClasesByModulo(modulo.id);
        return total + (clases ? clases.length : 0);
    }, 0);
}

// ==================== CARGAR CURSO EN MODAL ====================

async function cargarCursoEnModal(cursoId) {
    const modalLoader = document.getElementById('modalLoader');
    const modalContent = document.getElementById('modalContent');
    const modalTitle = document.getElementById('coursePreviewModalLabel');
    
    // 1. Mostrar estado de carga
    if (modalLoader) modalLoader.style.display = 'block';
    if (modalContent) modalContent.style.display = 'none';
    if (modalTitle) modalTitle.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Cargando...';

    try {
        // 2. Asegurar que los datos están cargados
        if (typeof CursosData.init === 'function') {
            await CursosData.init();
        }

        // CORREGIDO: cursoId ya viene como string (UUID), no convertir a número
        const curso = CursosData.getCurso(cursoId);

        if (!curso) {
            console.error('Curso no encontrado:', cursoId);
            mostrarErrorEnModal('No se pudo cargar la información del curso.');
            return;
        }

        console.log('Cargando curso en modal:', curso);

        // 3. Llenar datos
        if (modalTitle) modalTitle.textContent = curso.nombre;

        const descEl = document.getElementById('courseDescription');
        if (descEl) descEl.textContent = curso.descripcion || 'Sin descripción disponible.';

        const durEl = document.getElementById('courseDuration');
        if (durEl) durEl.textContent = calcularDuracionTotal(cursoId);

        // Obtener módulos
        const modulos = CursosData.getModulosByCurso(cursoId) || [];
        const totalClases = contarClasesTotales(modulos);

        const modEl = document.getElementById('courseModules');
        if (modEl) modEl.textContent = `${modulos.length} módulos · ${totalClases} clases`;

        const precioEl = document.getElementById('coursePrice');
        if (precioEl) precioEl.textContent = formatearPrecio(curso.precio);

        // Actualizar botón de compra con el ID correcto
        const buyBtn = document.getElementById('buyNowBtn');
        if (buyBtn) {
            buyBtn.href = `checkout.html?curso=${cursoId}`;
        }

        // Generar lista de contenido
        cargarModulosEnModal(cursoId, modulos);

        // 4. Mostrar contenido final
        if (modalLoader) modalLoader.style.display = 'none';
        if (modalContent) modalContent.style.display = 'block';

    } catch (error) {
        console.error('Error al cargar modal:', error);
        mostrarErrorEnModal('Error de conexión al cargar el curso.');
    }
}

// ==================== CARGAR MÓDULOS ====================

function cargarModulosEnModal(cursoId, modulos) {
    const contentList = document.getElementById('courseContentList');
    if (!contentList) return;
    
    contentList.innerHTML = '';

    if (!modulos || modulos.length === 0) {
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
    moduloDiv.className = 'modulo-preview mb-3 border rounded overflow-hidden';

    const duracionFormateada = CursosData.formatearDuracion(duracion);
    const clasesCount = clases ? clases.length : 0;

    // Usamos el ID del módulo para el collapse (puede ser UUID)
    const collapseId = `moduloCollapse_${modulo.id.toString().replace(/-/g, '_')}`;
    
    moduloDiv.innerHTML = `
        <div class="p-3 bg-white d-flex justify-content-between align-items-center cursor-pointer" 
             style="cursor: pointer;"
             data-bs-toggle="collapse" 
             data-bs-target="#${collapseId}" 
             aria-expanded="${index === 0 ? 'true' : 'false'}">
            
            <div class="d-flex flex-column">
                <span class="fw-bold text-dark">Módulo ${index + 1}: ${modulo.nombre}</span>
                <small class="text-muted">${clasesCount} clases · ${duracionFormateada}</small>
            </div>
            <i class="fas fa-chevron-down text-muted transition-icon"></i>
        </div>
        
        <div class="collapse ${index === 0 ? 'show' : ''} bg-light" id="${collapseId}">
            <div class="p-2">
                ${clases && clases.length > 0 
                    ? clases.map((clase, i) => crearClaseHTML(clase, i)).join('') 
                    : '<div class="p-2 text-muted fst-italic text-center small">Sin clases</div>'}
            </div>
        </div>
    `;

    return moduloDiv;
}

function crearClaseHTML(clase, claseIndex) {
    const iconos = {
        video: 'fa-play-circle', VIDEO: 'fa-play-circle',
        texto: 'fa-file-alt', TEXTO: 'fa-file-alt',
        pdf: 'fa-file-pdf', PDF: 'fa-file-pdf',
        quiz: 'fa-question-circle', QUIZ: 'fa-question-circle',
        entrega: 'fa-upload', ENTREGA: 'fa-upload', PRACTICA: 'fa-upload'
    };

    const tipoClase = clase.tipo || 'video';
    const icono = iconos[tipoClase] || 'fa-play-circle';

    return `
        <div class="d-flex align-items-center p-2 border-bottom border-white">
            <i class="fas ${icono} me-3 text-secondary" style="width: 20px; text-align: center;"></i>
            <span class="text-dark small flex-grow-1">${claseIndex + 1}. ${clase.nombre}</span>
            <span class="text-muted small" style="font-size: 0.75rem;">${clase.duracion || 0} min</span>
        </div>
    `;
}

// ==================== MANEJO DE ERRORES ====================

function mostrarErrorEnModal(mensaje) {
    const modalLoader = document.getElementById('modalLoader');
    const modalContent = document.getElementById('modalContent');
    const contentList = document.getElementById('courseContentList');
    
    if (modalLoader) modalLoader.style.display = 'none';
    if (modalContent) modalContent.style.display = 'block';

    if (contentList) {
        contentList.innerHTML = `
            <div class="alert alert-danger m-3 text-center">
                <i class="fas fa-exclamation-triangle fa-2x mb-2 d-block"></i>
                ${mensaje}
            </div>
        `;
    }
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando coursePreviewModal.js');

    // Delegación de eventos para los botones "Ver Curso"
    document.addEventListener('click', (e) => {
        const botonVer = e.target.closest('.btn-ver-curso');

        if (!botonVer) return;

        e.preventDefault();
        e.stopPropagation();

        const card = botonVer.closest('.producto-card') || botonVer.closest('.card');
        if (!card) {
            console.error('No se encontró la tarjeta del producto');
            return;
        }

        // CORREGIDO: No convertir a número, mantener como string (UUID)
        const cursoId = card.dataset.cursoId;
        
        if (!cursoId) {
            console.error('ID de curso inválido:', card.dataset.cursoId);
            return;
        }

        const modalElement = document.getElementById('coursePreviewModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            cargarCursoEnModal(cursoId);
        } else {
            console.error('El modal #coursePreviewModal no existe en el HTML.');
            alert('Error: No se puede abrir la vista previa.');
        }
    });
});

// Exportar función para uso externo
window.cargarCursoEnModal = cargarCursoEnModal;