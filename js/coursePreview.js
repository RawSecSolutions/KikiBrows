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
    return `$${precio.toLocaleString('es-CL')}`;
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

    // Cargar información en el header
    cargarHeader(curso, cursoId);

    // Cargar media (imagen/video)
    cargarMedia(curso);

    // Cargar descripción
    cargarDescripcion(curso);

    // Cargar módulos y clases
    cargarContenido(cursoId);

    // Cargar tarjeta de compra
    cargarTarjetaCompra(curso);

    // Configurar botón de compra
    configurarBotonCompra(curso);
}

// ==================== CARGAR HEADER ====================

function cargarHeader(curso, cursoId) {
    document.getElementById('courseTitle').textContent = curso.nombre;

    const duracionTotal = calcularDuracionTotal(cursoId);
    document.getElementById('courseDuration').textContent = duracionTotal;

    const modulos = CursosData.getModulosByCurso(cursoId);
    const totalClases = contarClasesTotales(modulos);
    document.getElementById('courseModules').textContent = `${modulos.length} módulos · ${totalClases} clases`;
}

// ==================== CARGAR MEDIA ====================

function cargarMedia(curso) {
    const mediaContainer = document.getElementById('courseMediaContainer');

    if (curso.video) {
        // Si tiene video, mostrar el video
        mediaContainer.innerHTML = `
            <video controls class="w-100" poster="${curso.portada || ''}">
                <source src="${curso.video}" type="video/mp4">
                Tu navegador no soporta la reproducción de videos.
            </video>
        `;
    } else if (curso.portada) {
        // Si solo tiene imagen, mostrar la imagen
        mediaContainer.innerHTML = `
            <img src="${curso.portada}" alt="${curso.nombre}" class="img-fluid w-100">
        `;
    } else {
        // Si no tiene nada, dejar el placeholder
        mediaContainer.innerHTML = `
            <div class="course-image-placeholder">
                <i class="fas fa-play-circle fa-4x"></i>
                <p class="mt-3">Vista previa del curso</p>
            </div>
        `;
    }
}

// ==================== CARGAR DESCRIPCIÓN ====================

function cargarDescripcion(curso) {
    const descripcionElement = document.getElementById('courseDescription');
    descripcionElement.textContent = curso.descripcion || 'Sin descripción disponible.';
}

// ==================== CARGAR CONTENIDO (MÓDULOS Y CLASES) ====================

function cargarContenido(cursoId) {
    const contentList = document.getElementById('courseContentList');
    const modulos = CursosData.getModulosByCurso(cursoId);

    if (modulos.length === 0) {
        contentList.innerHTML = `
            <div class="text-center text-muted p-4">
                <i class="fas fa-folder-open fa-3x mb-3"></i>
                <p>Este curso aún no tiene módulos configurados.</p>
            </div>
        `;
        return;
    }

    contentList.innerHTML = '';

    modulos.forEach((modulo, index) => {
        const moduloElement = crearModuloElement(modulo, index);
        contentList.appendChild(moduloElement);
    });
}

function crearModuloElement(modulo, index) {
    const clases = CursosData.getClasesByModulo(modulo.id);
    const duracionModulo = CursosData.calcularDuracionModulo(modulo.id);
    const duracionFormateada = CursosData.formatearDuracion(duracionModulo);

    const moduloDiv = document.createElement('div');
    moduloDiv.className = 'module-item';

    const moduleId = `module${index}`;

    moduloDiv.innerHTML = `
        <div class="module-header" data-bs-toggle="collapse" data-bs-target="#${moduleId}" aria-expanded="${index === 0 ? 'true' : 'false'}">
            <div class="module-header-left">
                <div class="module-number">${index + 1}</div>
                <h4 class="module-title">${modulo.nombre}</h4>
            </div>
            <div class="module-meta">
                <span>${clases.length} clases · ${duracionFormateada}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
        </div>
        <div class="collapse ${index === 0 ? 'show' : ''}" id="${moduleId}">
            <div class="module-body">
                <ul class="class-list">
                    ${clases.map((clase, claseIndex) => crearClaseHTML(clase, claseIndex)).join('')}
                </ul>
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
        <li class="class-item">
            <div class="class-item-left">
                <div class="class-icon ${tipoClase}">
                    <i class="fas ${icono}"></i>
                </div>
                <span class="class-name">${claseIndex + 1}. ${clase.nombre}</span>
            </div>
            <span class="class-duration">${clase.duracion} min</span>
        </li>
    `;
}

// ==================== CARGAR TARJETA DE COMPRA ====================

function cargarTarjetaCompra(curso) {
    // Cargar imagen
    const purchaseCardImage = document.getElementById('purchaseCardImage');
    if (curso.portada) {
        purchaseCardImage.innerHTML = `
            <img src="${curso.portada}" alt="${curso.nombre}" class="img-fluid rounded">
        `;
    } else {
        purchaseCardImage.innerHTML = `
            <div class="course-image-placeholder" style="height: 200px;">
                <i class="fas fa-image fa-3x"></i>
            </div>
        `;
    }

    // Cargar precio
    const precioFormateado = formatearPrecio(curso.precio || 0);
    document.getElementById('coursePrice').textContent = precioFormateado;
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
    const container = document.querySelector('.container.my-5');
    container.innerHTML = `
        <div class="alert alert-danger text-center" role="alert">
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
