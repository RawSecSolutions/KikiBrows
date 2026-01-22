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

function esModoPreview() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('preview') === 'true';
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

    // Verificar que el curso esté publicado (salvo que sea modo preview de admin)
    const modoPreview = esModoPreview();
    if (!modoPreview && curso.estado !== 'publicado') {
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

        // Verificar si ya tiene el curso
        const usuariosData = JSON.parse(localStorage.getItem('kikibrows_usuarios')) || {};
        const datosUsuario = usuariosData[usuarioActual.email] || {};
        const cursosAdquiridos = datosUsuario.cursosAdquiridos || [];

        if (cursosAdquiridos.includes(curso.id)) {
            alert('Ya has adquirido este curso. Puedes acceder desde tu panel de estudiante.');
            window.location.href = 'Alumno.html';
            return;
        }

        // Si está autenticado y no tiene el curso, abrir portal de pago
        abrirPortalPago(curso, usuarioActual);
    });
}

// ==================== PORTAL DE PAGO ====================

function abrirPortalPago(curso, usuario) {
    const modal = document.getElementById('portalPagoModal');

    // Cargar información del curso en el modal
    document.getElementById('portalCursoNombre').textContent = curso.nombre;
    document.getElementById('portalCursoPrecio').textContent = formatearPrecio(curso.precio || 0);

    // Mostrar modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Configurar eventos del modal
    configurarEventosPortalPago(curso, usuario);
}

function cerrarPortalPago() {
    const modal = document.getElementById('portalPagoModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Resetear secciones de pago
    document.getElementById('seccionWebpay').style.display = 'none';
    document.getElementById('seccionMercadoPago').style.display = 'none';

    // Resetear botones de método de pago
    document.querySelectorAll('.metodo-pago-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

function configurarEventosPortalPago(curso, usuario) {
    // Botón cerrar
    const btnCerrar = document.getElementById('btnCerrarPortal');
    btnCerrar.onclick = cerrarPortalPago;

    // Botón volver
    const btnVolver = document.getElementById('btnVolverCheckout');
    btnVolver.onclick = cerrarPortalPago;

    // Cerrar al hacer click en overlay
    const overlay = document.querySelector('.portal-pago-overlay');
    overlay.onclick = cerrarPortalPago;

    // Botón Webpay
    const btnWebpay = document.getElementById('btnWebpay');
    btnWebpay.onclick = () => {
        // Marcar como seleccionado
        document.querySelectorAll('.metodo-pago-btn').forEach(btn => btn.classList.remove('selected'));
        btnWebpay.classList.add('selected');

        // Mostrar sección de Webpay
        document.getElementById('seccionWebpay').style.display = 'block';
        document.getElementById('seccionMercadoPago').style.display = 'none';

        // Scroll hacia la sección
        document.getElementById('seccionWebpay').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    // Botón Mercado Pago
    const btnMercadoPago = document.getElementById('btnMercadoPago');
    btnMercadoPago.onclick = () => {
        // Marcar como seleccionado
        document.querySelectorAll('.metodo-pago-btn').forEach(btn => btn.classList.remove('selected'));
        btnMercadoPago.classList.add('selected');

        // Mostrar sección de Mercado Pago
        document.getElementById('seccionWebpay').style.display = 'none';
        document.getElementById('seccionMercadoPago').style.display = 'block';

        // Scroll hacia la sección
        document.getElementById('seccionMercadoPago').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    // Configurar evento de pago con Webpay
    const formWebpay = document.getElementById('formWebpay');
    formWebpay.onsubmit = (e) => {
        e.preventDefault();
        iniciarPagoWebpay(curso, usuario);
    };

    // Configurar evento de pago con Mercado Pago
    const btnPagarMP = document.getElementById('btnPagarMercadoPago');
    btnPagarMP.onclick = () => {
        iniciarPagoMercadoPago(curso, usuario);
    };
}

// ==================== INTEGRACIÓN DE PASARELAS DE PAGO ====================

function iniciarPagoWebpay(curso, usuario) {
    console.log('Iniciando pago con Webpay para curso:', curso.nombre);

    // AQUÍ SE INTEGRARÁ LA LÓGICA DE TRANSBANK/WEBPAY
    // Ejemplo de flujo:
    // 1. Crear transacción en el backend
    // 2. Obtener token de Webpay
    // 3. Redirigir a la página de pago de Webpay

    /*
    // Ejemplo de integración (descomentar cuando se configure el backend):
    fetch('/api/transbank/crear-transaccion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            cursoId: curso.id,
            monto: curso.precio,
            usuarioEmail: usuario.email
        })
    })
    .then(response => response.json())
    .then(data => {
        // Redirigir a Webpay con el token
        document.getElementById('tokenWebpay').value = data.token;
        document.getElementById('formWebpay').action = data.url;
        document.getElementById('formWebpay').submit();
    })
    .catch(error => {
        console.error('Error al crear transacción:', error);
        alert('Hubo un error al procesar el pago. Por favor intenta nuevamente.');
    });
    */

    // SIMULACIÓN TEMPORAL (eliminar cuando se integre la API real)
    alert('Portal de pago de Webpay/Transbank.\n\nAquí se redirigirá a la pasarela de pago de Transbank.\n\nPor ahora es una simulación.');

    // Simulación de compra exitosa (eliminar en producción)
    procesarCompraExitosa(curso, usuario);
}

function iniciarPagoMercadoPago(curso, usuario) {
    console.log('Iniciando pago con Mercado Pago para curso:', curso.nombre);

    // AQUÍ SE INTEGRARÁ LA LÓGICA DE MERCADO PAGO
    // Ejemplo de flujo:
    // 1. Crear preferencia de pago en el backend
    // 2. Inicializar el checkout de Mercado Pago
    // 3. Redirigir o mostrar el checkout

    /*
    // Ejemplo de integración (descomentar cuando se configure el backend):
    fetch('/api/mercadopago/crear-preferencia', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            cursoId: curso.id,
            titulo: curso.nombre,
            precio: curso.precio,
            usuarioEmail: usuario.email
        })
    })
    .then(response => response.json())
    .then(data => {
        // Inicializar Mercado Pago Checkout
        const mp = new MercadoPago('TU_PUBLIC_KEY');
        mp.checkout({
            preference: {
                id: data.preferenceId
            },
            render: {
                container: '#mercadoPagoCheckout',
                label: 'Pagar con Mercado Pago',
            }
        });
    })
    .catch(error => {
        console.error('Error al crear preferencia:', error);
        alert('Hubo un error al procesar el pago. Por favor intenta nuevamente.');
    });
    */

    // SIMULACIÓN TEMPORAL (eliminar cuando se integre la API real)
    alert('Portal de pago de Mercado Pago.\n\nAquí se mostrará el checkout de Mercado Pago.\n\nPor ahora es una simulación.');

    // Simulación de compra exitosa (eliminar en producción)
    procesarCompraExitosa(curso, usuario);
}

function procesarCompraExitosa(curso, usuario) {
    // Esta función se llamará cuando el pago sea confirmado
    // En producción, esto debería ser llamado desde el callback/webhook de la pasarela

    const usuariosData = JSON.parse(localStorage.getItem('kikibrows_usuarios')) || {};
    const datosUsuario = usuariosData[usuario.email] || {};

    // Agregar curso a cursosAdquiridos
    const cursosAdquiridos = datosUsuario.cursosAdquiridos || [];
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

    // Cerrar portal y redirigir
    cerrarPortalPago();
    alert('¡Compra exitosa! Ya puedes acceder al curso desde tu panel de estudiante.');
    window.location.href = 'Alumno.html';
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

    // Mostrar banner de previsualización si está en modo admin preview
    if (esModoPreview()) {
        const previewBanner = document.getElementById('previewBanner');
        if (previewBanner) {
            previewBanner.style.display = 'flex';
            // Ajustar padding del body para que no tape el contenido
            document.body.style.paddingTop = '50px';
        }
    }

    cargarInformacionCurso(cursoId);
});
