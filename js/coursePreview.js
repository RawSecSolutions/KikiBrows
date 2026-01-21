// js/coursePreview.js - Lógica para la página de preview de cursos
// Este archivo carga el curso desde la URL y muestra toda su información

// ==================== OBTENER ID DEL CURSO DESDE URL ====================

function obtenerCursoIdDesdeUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const cursoId = urlParams.get('id');

    if (!cursoId) {
        console.error('No se proporcionó un ID de curso en la URL');
        return null;
    }

    return parseInt(cursoId);
}

// ==================== FUNCIONES AUXILIARES ====================

function formatearPrecio(precio) {
    return `$${precio.toLocaleString('es-CL')} CLP`;
}

function calcularDuracionTotal(cursoId) {
    const duracion = CursosData.calcularDuracionCurso(cursoId);
    return CursosData.formatearDuracion(duracion);
}

function contarClasesTotales(modulos) {
    return modulos.reduce((total, modulo) => {
        const clases = CursosData.getClasesByModulo(modulo.id);
        return total + clases.length;
    }, 0);
}

// ==================== CARGAR INFORMACIÓN DEL CURSO ====================

function cargarInformacionCurso(cursoId) {
    // Inicializar CursosData si es necesario
    if (typeof CursosData.init === 'function') {
        CursosData.init();
    }

    const curso = CursosData.getCurso(cursoId);

    if (!curso) {
        mostrarError('El curso solicitado no existe o no está disponible.');
        return;
    }

    // Verificar que el curso esté publicado
    if (curso.estado !== 'publicado') {
        mostrarError('Este curso no está disponible en este momento.');
        return;
    }

    console.log('Cargando curso:', curso);

    // Actualizar título de la página
    document.title = `${curso.nombre} - KIKIBROWS`;

    // Cargar hero
    cargarHero(curso);

    // Cargar meta info
    cargarMetaInfo(curso, cursoId);

    // Cargar módulos
    cargarModulos(cursoId);

    // Configurar botón de compra
    configurarBotonCompra(curso);
}

// ==================== CARGAR HERO ====================

function cargarHero(curso) {
    document.getElementById('cursoNombre').textContent = curso.nombre;
    document.getElementById('cursoDescripcion').textContent =
        curso.descripcion || 'Sin descripción disponible.';

    const portadaEl = document.getElementById('heroPortada');
    if (curso.portada) {
        portadaEl.innerHTML = `<img src="${curso.portada}" alt="${curso.nombre}">`;
    } else {
        portadaEl.innerHTML = '<i class="fas fa-image"></i>';
    }
}

// ==================== CARGAR META INFO ====================

function cargarMetaInfo(curso, cursoId) {
    document.getElementById('cursoPrecio').textContent =
        formatearPrecio(curso.precio || 0);

    const duracion = CursosData.calcularDuracionCurso(cursoId);
    document.getElementById('cursoDuracion').textContent =
        CursosData.formatearDuracion(duracion);

    const modulos = CursosData.getModulosByCurso(cursoId);
    const totalClases = contarClasesTotales(modulos);
    document.getElementById('cursoModulos').textContent =
        `${modulos.length} módulos · ${totalClases} clases`;
}

// ==================== CARGAR MÓDULOS ====================

function cargarModulos(cursoId) {
    const modulos = CursosData.getModulosByCurso(cursoId);
    const container = document.getElementById('modulosList');

    container.innerHTML = '';

    if (modulos.length === 0) {
        container.innerHTML = `
            <div class="no-modulos">
                <i class="fas fa-folder-open"></i>
                <h3>Sin módulos</h3>
                <p>Este curso aún no tiene módulos configurados.</p>
            </div>
        `;
        return;
    }

    modulos.forEach((modulo, index) => {
        const clases = CursosData.getClasesByModulo(modulo.id);
        const duracion = CursosData.calcularDuracionModulo(modulo.id);
        const moduloEl = crearModuloElement(modulo, clases, duracion, index + 1, index === 0);
        container.appendChild(moduloEl);
    });
}

function crearModuloElement(modulo, clases, duracion, numero, expandido) {
    const div = document.createElement('div');
    div.className = 'modulo-card';

    div.innerHTML = `
        <div class="modulo-header ${expandido ? 'expanded' : ''}">
            <span class="modulo-titulo">Módulo ${numero}: ${modulo.nombre}</span>
            <i class="fas fa-chevron-down modulo-arrow"></i>
        </div>
        <div class="modulo-body ${expandido ? 'show' : ''}">
            <div class="modulo-meta">
                <span>${clases.length} clases</span>
                <span>${CursosData.formatearDuracion(duracion)}</span>
            </div>
            <div class="clases-list">
                ${clases.map(clase => crearClaseHTML(clase)).join('')}
            </div>
        </div>
    `;

    // Toggle
    const header = div.querySelector('.modulo-header');
    header.addEventListener('click', () => {
        header.classList.toggle('expanded');
        div.querySelector('.modulo-body').classList.toggle('show');
    });

    return div;
}

function crearClaseHTML(clase) {
    const iconos = {
        video: 'fa-play-circle',
        texto: 'fa-file-alt',
        pdf: 'fa-file-pdf',
        quiz: 'fa-question-circle',
        entrega: 'fa-upload'
    };

    return `
        <div class="clase-row">
            <div class="clase-check"><i class="fas fa-check"></i></div>
            <span class="clase-nombre">${clase.nombre}</span>
            <div class="clase-meta">
                <i class="fas ${iconos[clase.tipo] || 'fa-file'}"></i>
                <span>${clase.duracion} min</span>
            </div>
        </div>
    `;
}

// ==================== CONFIGURAR BOTÓN DE COMPRA ====================

function configurarBotonCompra(curso) {
    const btnComprar = document.getElementById('btnComprarCurso');

    btnComprar.addEventListener('click', () => {
        // Verificar si el usuario está autenticado
        const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'));

        if (!usuarioActual) {
            // Si no está autenticado, redirigir al login
            alert('Debes iniciar sesión para comprar este curso.');
            window.location.href = 'login.html';
            return;
        }

        // Si está autenticado, proceder con la compra
        procesarCompra(curso, usuarioActual);
    });
}

function procesarCompra(curso, usuario) {
    // Verificar si ya tiene el curso
    const usuariosData = JSON.parse(localStorage.getItem('kikibrows_usuarios')) || {};
    const datosUsuario = usuariosData[usuario.email] || {};

    const cursosAdquiridos = datosUsuario.cursosAdquiridos || [];

    if (cursosAdquiridos.includes(curso.id)) {
        alert('Ya has adquirido este curso. Puedes acceder desde tu panel de estudiante.');
        window.location.href = 'Alumno.html';
        return;
    }

    // Simular proceso de compra
    const confirmar = confirm(`¿Deseas comprar el curso "${curso.nombre}" por ${formatearPrecio(curso.precio)}?`);

    if (confirmar) {
        // Agregar curso a cursosAdquiridos
        cursosAdquiridos.push(curso.id);

        // Calcular fecha de expiración
        const fechaCompra = new Date();
        const diasAcceso = curso.duracionAcceso || 180;
        const fechaExpiracion = new Date(fechaCompra);
        fechaExpiracion.setDate(fechaExpiracion.getDate() + diasAcceso);

        // Actualizar accesoCursos
        if (!datosUsuario.accesoCursos) {
            datosUsuario.accesoCursos = {};
        }

        datosUsuario.accesoCursos[curso.id] = {
            fechaCompra: fechaCompra.toISOString().split('T')[0],
            fechaExpiracion: fechaExpiracion.toISOString().split('T')[0],
            diasAcceso: diasAcceso
        };

        // Actualizar datos del usuario
        datosUsuario.cursosAdquiridos = cursosAdquiridos;
        usuariosData[usuario.email] = datosUsuario;

        // Guardar en localStorage
        localStorage.setItem('kikibrows_usuarios', JSON.stringify(usuariosData));

        alert('¡Compra exitosa! Ya puedes acceder al curso desde tu panel de estudiante.');
        window.location.href = 'Alumno.html';
    }
}

// ==================== MANEJO DE ERRORES ====================

function mostrarError(mensaje) {
    const container = document.querySelector('.preview-main .container');
    container.innerHTML = `
        <div class="alert alert-danger text-center mt-5" role="alert">
            <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
            <h4>${mensaje}</h4>
            <a href="index.html#cursos" class="btn btn-primary mt-3">
                <i class="fas fa-arrow-left me-2"></i>Volver a Cursos
            </a>
        </div>
    `;
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando coursePreview.js');

    const cursoId = obtenerCursoIdDesdeUrl();

    if (!cursoId) {
        mostrarError('No se especificó un ID de curso válido en la URL.');
        return;
    }

    cargarInformacionCurso(cursoId);
});
