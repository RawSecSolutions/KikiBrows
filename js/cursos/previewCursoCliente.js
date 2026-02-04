// js/previewCursoCliente.js - Vista Previa del Curso para Clientes
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

// ==================== FUNCIONES AUXILIARES ====================

function formatearPrecio(precio) {
    return `$${precio.toLocaleString('es-CL')}`;
}

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

function contarClasesTotales(modulos) {
    return modulos.reduce((total, modulo) => total + modulo.clases.length, 0);
}

// ==================== MAIN ====================

document.addEventListener('DOMContentLoaded', () => {

    const urlParams = new URLSearchParams(window.location.search);
    const cursoId = parseInt(urlParams.get('id'));

    if (!cursoId) {
        mostrarError('No se especificó un curso válido.');
        return;
    }

    cargarCurso(cursoId);
});

// ==================== CARGAR CURSO ====================

function cargarCurso(id) {
    const curso = obtenerCursoCompleto(id);

    if (!curso) {
        mostrarError('Curso no encontrado.');
        return;
    }

    document.title = `KIKIBROWS - ${curso.nombre}`;
    cargarHero(curso);
    cargarMetaInfo(curso);
    cargarModulos(curso);
}

// ==================== HERO ====================

function cargarHero(curso) {
    document.getElementById('cursoNombre').textContent = curso.nombre;
    document.getElementById('cursoDescripcion').textContent = curso.descripcion;

    // Aquí podrías cargar una imagen de portada si está disponible
    const portadaEl = document.getElementById('heroPortada');
    if (curso.portada_url) {
        portadaEl.innerHTML = `<img src="${curso.portada_url}" alt="${curso.nombre}">`;
    }
}

// ==================== META INFO ====================

function cargarMetaInfo(curso) {
    const precio = formatearPrecio(curso.precio);
    document.getElementById('cursoPrecio').textContent = precio;
    document.getElementById('cursoPrecioFooter').textContent = precio;

    const duracion = calcularDuracionTotal(curso.modulos);
    document.getElementById('cursoDuracion').textContent = duracion;

    const totalClases = contarClasesTotales(curso.modulos);
    document.getElementById('cursoModulos').textContent = `${curso.modulos.length} módulos · ${totalClases} clases`;
}

// ==================== MÓDULOS ====================

function cargarModulos(curso) {
    const container = document.getElementById('modulosList');
    container.innerHTML = '';

    if (curso.modulos.length === 0) {
        container.innerHTML = `
            <div class="no-modulos">
                <i class="fas fa-folder-open"></i>
                <h3>Sin módulos</h3>
                <p>Este curso aún no tiene módulos configurados.</p>
            </div>
        `;
        return;
    }

    curso.modulos.forEach((modulo, index) => {
        const moduloEl = crearModuloElement(modulo, index + 1, index === 0);
        container.appendChild(moduloEl);
    });
}

function crearModuloElement(modulo, numero, expandido) {
    const div = document.createElement('div');
    div.className = 'modulo-card';

    const duracionModulo = modulo.clases.reduce((total, clase) => total + clase.duracion, 0);

    div.innerHTML = `
        <div class="modulo-header ${expandido ? 'expanded' : ''}">
            <span class="modulo-titulo">Módulo ${numero}: ${modulo.nombre}</span>
            <i class="fas fa-chevron-down modulo-arrow"></i>
        </div>
        <div class="modulo-body ${expandido ? 'show' : ''}">
            <div class="modulo-meta">
                <span>${modulo.clases.length} clases</span>
                <span>${duracionModulo} min</span>
            </div>
            <div class="clases-list">
                ${modulo.clases.map((clase, claseIndex) => crearClaseHTML(clase, claseIndex + 1)).join('')}
            </div>
        </div>
    `;

    // Toggle del módulo
    const header = div.querySelector('.modulo-header');
    const body = div.querySelector('.modulo-body');
    header.addEventListener('click', () => {
        header.classList.toggle('expanded');
        body.classList.toggle('show');
    });

    return div;
}

function crearClaseHTML(clase, numero) {
    const iconos = {
        video: 'fa-play-circle',
        texto: 'fa-file-alt',
        pdf: 'fa-file-pdf',
        quiz: 'fa-question-circle',
        entrega: 'fa-upload'
    };

    // Por defecto, todas las clases son video si no tienen tipo especificado
    const tipoClase = clase.tipo || 'video';
    const icono = iconos[tipoClase] || 'fa-play-circle';

    return `
        <div class="clase-row">
            <div class="clase-check"></div>
            <span class="clase-nombre">${numero}. ${clase.nombre}</span>
            <div class="clase-meta">
                <i class="fas ${icono}"></i>
                <span>${clase.duracion} min</span>
            </div>
        </div>
    `;
}

// ==================== UTILIDADES ====================

function mostrarError(msg) {
    const container = document.getElementById('modulosList');
    container.innerHTML = `
        <div class="no-modulos">
            <i class="fas fa-exclamation-triangle" style="color: #E57373;"></i>
            <h3>Error</h3>
            <p>${msg}</p>
            <a href="index.html#cursos" class="btn btn-primary mt-3">Volver a Cursos</a>
        </div>
    `;
    document.getElementById('cursoNombre').textContent = 'Error';
    document.getElementById('cursoDescripcion').textContent = msg;
}
