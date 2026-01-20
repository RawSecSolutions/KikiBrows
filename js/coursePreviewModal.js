// js/coursePreviewModal.js - Modal de Preview de Cursos para Landing
// NOTA: Este archivo ahora usa CursosData del sistema unificado (cursosData.js)

// Función auxiliar para obtener un curso con sus módulos y clases estructurados
function obtenerCursoCompleto(cursoId) {
    const curso = CursosData.getCurso(cursoId);
    if (!curso) return null;

    // Obtener módulos del curso
    const modulos = CursosData.getModulosByCurso(cursoId).map(modulo => {
        // Obtener clases de cada módulo
        const clases = CursosData.getClasesByModulo(modulo.id);
        return {
            nombre: modulo.nombre,
            clases: clases.map(clase => ({
                nombre: clase.nombre,
                duracion: clase.duracion
            }))
        };
    });

    return {
        ...curso,
        modulos: modulos
    };
}

// Datos antiguos removidos - ahora usa CursosData desde cursosData.js

// Función para formatear precio en CLP
function formatearPrecio(precio) {
    return `$${precio.toLocaleString('es-CL')}`;
}

// Función para calcular duración total del curso
function calcularDuracionTotal(modulos) {
    let totalMinutos = 0;
    modulos.forEach(modulo => {
        modulo.clases.forEach(clase => {
            totalMinutos += clase.duracion;
        });
    });

    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;

    if (horas === 0) {
        return `${minutos} minutos`;
    } else if (minutos === 0) {
        return `${horas}h`;
    } else {
        return `${horas}h ${minutos}min`;
    }
}

// Función para cargar el contenido del curso en el modal
function cargarCursoEnModal(cursoId) {
    const curso = obtenerCursoCompleto(cursoId);

    if (!curso) {
        console.error('Curso no encontrado:', cursoId);
        return;
    }

    // Actualizar título
    document.getElementById('coursePreviewModalLabel').textContent = curso.nombre;

    // Actualizar descripción
    document.getElementById('courseDescription').textContent = curso.descripcion;

    // Actualizar duración
    document.getElementById('courseDuration').textContent = calcularDuracionTotal(curso.modulos);

    // Actualizar número de módulos
    const totalClases = curso.modulos.reduce((total, modulo) => total + modulo.clases.length, 0);
    document.getElementById('courseModules').textContent = `${curso.modulos.length} módulos · ${totalClases} clases`;

    // Actualizar precio
    document.getElementById('coursePrice').textContent = formatearPrecio(curso.precio);

    // Generar lista de contenido
    const contentList = document.getElementById('courseContentList');
    contentList.innerHTML = '';

    curso.modulos.forEach((modulo, index) => {
        const moduloDiv = document.createElement('div');
        moduloDiv.className = 'modulo-preview mb-3';

        const moduloDuracion = modulo.clases.reduce((total, clase) => total + clase.duracion, 0);

        moduloDiv.innerHTML = `
            <div class="modulo-preview-header" data-bs-toggle="collapse" data-bs-target="#modulo${index}" aria-expanded="${index === 0 ? 'true' : 'false'}">
                <div class="modulo-preview-title">
                    <i class="fas fa-book me-2"></i>
                    <strong>Módulo ${index + 1}:</strong> ${modulo.nombre}
                </div>
                <div class="modulo-preview-meta">
                    <span class="text-muted">${modulo.clases.length} clases · ${moduloDuracion} min</span>
                    <i class="fas fa-chevron-down ms-2"></i>
                </div>
            </div>
            <div class="collapse ${index === 0 ? 'show' : ''}" id="modulo${index}">
                <div class="modulo-preview-body">
                    ${modulo.clases.map((clase, claseIndex) => `
                        <div class="clase-preview-item">
                            <i class="fas fa-play-circle me-2"></i>
                            <span class="clase-preview-name">${claseIndex + 1}. ${clase.nombre}</span>
                            <span class="clase-preview-duration text-muted">${clase.duracion} min</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        contentList.appendChild(moduloDiv);
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const botonesVer = document.querySelectorAll('.btn-ver-curso');
    const modalElement = document.getElementById('coursePreviewModal');

    if (!modalElement) {
        console.error('Modal element not found');
        return;
    }

    botonesVer.forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const card = e.target.closest('.producto-card');
            if (!card) {
                console.error('Producto card not found');
                return;
            }

            const cursoId = parseInt(card.dataset.cursoId);

            // Cargar el contenido del curso
            cargarCursoEnModal(cursoId);

            // Crear y mostrar el modal
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        });
    });

    console.log(`${botonesVer.length} botones "Ver" configurados correctamente`);
});
