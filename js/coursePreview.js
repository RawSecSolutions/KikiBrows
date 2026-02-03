// js/coursePreview.js - Lógica para la página de preview de cursos
// Conecta con Supabase para mostrar la estructura del curso
// Usuarios sin acceso solo ven nombres, usuarios con acceso pueden ir al aula virtual

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado global
let cursoActual = null;
let usuarioActual = null;
let tieneAcceso = false;

// ==================== OBTENER ID DEL CURSO DESDE URL ====================

function obtenerCursoIdDesdeUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const cursoId = urlParams.get('id');

    if (!cursoId) {
        console.error('No se proporcionó un ID de curso en la URL');
        return null;
    }

    return cursoId; // UUID como string
}

function esModoPreview() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('preview') === 'true';
}

// ==================== FUNCIONES AUXILIARES ====================

function formatearPrecio(precio) {
    return `$${(precio || 0).toLocaleString('es-CL')} CLP`;
}

function formatearDuracion(minutos) {
    if (!minutos || minutos <= 0) return '0 min';
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (mins === 0) return `${horas}h`;
    return `${horas}h ${mins}min`;
}

function calcularDuracionTotal(modulos) {
    let total = 0;
    (modulos || []).forEach(modulo => {
        (modulo.clases || []).forEach(clase => {
            total += clase.duracion || clase.clase_duracion || 5;
        });
    });
    return total;
}

function contarClasesTotales(modulos) {
    return (modulos || []).reduce((total, modulo) => {
        return total + (modulo.clases?.length || 0);
    }, 0);
}

/**
 * Valida que el perfil del usuario esté completo (nombre y apellido)
 */
function validarPerfilCompleto(usuario) {
    if (!usuario) return false;
    const nombreCompleto = usuario.nombre && usuario.nombre.trim() !== '';
    const apellidoCompleto = usuario.apellido && usuario.apellido.trim() !== '';
    return nombreCompleto && apellidoCompleto;
}

// ==================== VERIFICAR ACCESO ====================

async function verificarAccesoUsuario(cursoId) {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return { autenticado: false, tieneAcceso: false };
        }

        usuarioActual = session.user;

        // Obtener perfil
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            usuarioActual.nombre = profile.first_name;
            usuarioActual.apellido = profile.last_name;
        }

        // Verificar si tiene transacción pagada para este curso
        const { data: transaccion, error } = await supabase
            .from('transacciones')
            .select('id, estado')
            .eq('curso_id', cursoId)
            .eq('usuario_id', session.user.id)
            .eq('estado', 'PAGADO')
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Error verificando acceso:', error);
        }

        return {
            autenticado: true,
            tieneAcceso: !!transaccion,
            transaccion
        };

    } catch (error) {
        console.error('Error en verificarAccesoUsuario:', error);
        return { autenticado: false, tieneAcceso: false };
    }
}

// ==================== CARGAR INFORMACIÓN DEL CURSO ====================

async function cargarInformacionCurso(cursoId) {
    try {
        // Mostrar estado de carga
        mostrarCargando();

        // Verificar acceso del usuario
        const acceso = await verificarAccesoUsuario(cursoId);
        tieneAcceso = acceso.tieneAcceso;

        // Obtener datos básicos del curso
        const { data: curso, error: cursoError } = await supabase
            .from('cursos')
            .select('id, nombre, descripcion, portada_url, precio, estado, dias_duracion_acceso')
            .eq('id', cursoId)
            .single();

        if (cursoError) throw cursoError;

        if (!curso) {
            mostrarError('El curso solicitado no existe.');
            return;
        }

        // Verificar estado del curso
        const modoPreview = esModoPreview();
        if (!modoPreview && curso.estado !== 'PUBLICADO') {
            mostrarError('Este curso no está disponible en este momento.');
            return;
        }

        cursoActual = curso;

        // Obtener estructura usando la función RPC segura
        const { data: previewData, error: previewError } = await supabase
            .rpc('obtener_preview_curso', {
                curso_id_input: cursoId
            });

        if (previewError) {
            console.error('Error al obtener preview:', previewError);
            // Continuar sin módulos si falla
        }

        // Agrupar por módulo
        const modulosMap = new Map();
        (previewData || []).forEach(row => {
            if (!modulosMap.has(row.modulo_nombre)) {
                modulosMap.set(row.modulo_nombre, {
                    nombre: row.modulo_nombre,
                    orden: row.modulo_orden,
                    clases: []
                });
            }
            modulosMap.get(row.modulo_nombre).clases.push({
                nombre: row.clase_nombre,
                orden: row.clase_orden,
                tipo: row.clase_tipo,
                duracion: row.clase_duracion
            });
        });

        const modulos = Array.from(modulosMap.values())
            .sort((a, b) => a.orden - b.orden);

        modulos.forEach(mod => {
            mod.clases.sort((a, b) => a.orden - b.orden);
        });

        cursoActual.modulos = modulos;

        console.log('Curso cargado:', cursoActual);

        // Actualizar título de la página
        document.title = `${curso.nombre} - KIKIBROWS`;

        // Cargar UI
        cargarHero(cursoActual);
        cargarMetaInfo(cursoActual);
        cargarModulos(cursoActual.modulos);
        configurarBotonCompra(cursoActual, acceso);

    } catch (error) {
        console.error('Error al cargar curso:', error);
        mostrarError('Error al cargar la información del curso.');
    }
}

// ==================== MOSTRAR CARGANDO ====================

function mostrarCargando() {
    const container = document.querySelector('.preview-main .container');
    if (!container) return;

    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3 text-muted">Cargando información del curso...</p>
        </div>
    `;
}

// ==================== CARGAR HERO ====================

function cargarHero(curso) {
    const nombreEl = document.getElementById('cursoNombre');
    const descripcionEl = document.getElementById('cursoDescripcion');
    const portadaEl = document.getElementById('heroPortada');

    if (nombreEl) nombreEl.textContent = curso.nombre;
    if (descripcionEl) descripcionEl.textContent = curso.descripcion || 'Sin descripción disponible.';

    if (portadaEl) {
        if (curso.portada_url) {
            portadaEl.innerHTML = `<img src="${curso.portada_url}" alt="${curso.nombre}">`;
        } else {
            portadaEl.innerHTML = '<i class="fas fa-image"></i>';
        }
    }
}

// ==================== CARGAR META INFO ====================

function cargarMetaInfo(curso) {
    const precioEl = document.getElementById('cursoPrecio');
    const duracionEl = document.getElementById('cursoDuracion');
    const modulosEl = document.getElementById('cursoModulos');

    if (precioEl) precioEl.textContent = formatearPrecio(curso.precio);

    const duracion = calcularDuracionTotal(curso.modulos);
    if (duracionEl) duracionEl.textContent = formatearDuracion(duracion);

    const totalClases = contarClasesTotales(curso.modulos);
    if (modulosEl) {
        modulosEl.textContent = `${(curso.modulos || []).length} módulos · ${totalClases} clases`;
    }
}

// ==================== CARGAR MÓDULOS ====================

function cargarModulos(modulos) {
    const container = document.getElementById('modulosList');
    if (!container) return;

    container.innerHTML = '';

    if (!modulos || modulos.length === 0) {
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
        const duracion = (modulo.clases || []).reduce((t, c) => t + (c.duracion || 5), 0);
        const moduloEl = crearModuloElement(modulo, modulo.clases || [], duracion, index + 1, index === 0);
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
                <span>${formatearDuracion(duracion)}</span>
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
        VIDEO: 'fa-play-circle',
        texto: 'fa-file-alt',
        TEXTO: 'fa-file-alt',
        pdf: 'fa-file-pdf',
        PDF: 'fa-file-pdf',
        quiz: 'fa-question-circle',
        QUIZ: 'fa-question-circle',
        entrega: 'fa-upload',
        ENTREGA: 'fa-upload',
        PRACTICA: 'fa-upload'
    };

    const tipo = clase.tipo || 'video';

    return `
        <div class="clase-row">
            <div class="clase-check"><i class="fas fa-check"></i></div>
            <span class="clase-nombre">${clase.nombre}</span>
            <div class="clase-meta">
                <i class="fas ${iconos[tipo] || 'fa-file'}"></i>
                <span>${clase.duracion || 5} min</span>
            </div>
        </div>
    `;
}

// ==================== CONFIGURAR BOTÓN DE COMPRA ====================

function configurarBotonCompra(curso, acceso) {
    const btnComprar = document.getElementById('btnComprarCurso');
    if (!btnComprar) return;

    // Si ya tiene acceso, cambiar el botón
    if (acceso.tieneAcceso) {
        btnComprar.innerHTML = '<i class="fas fa-play me-2"></i>Ir al Aula Virtual';
        btnComprar.classList.remove('btn-primary');
        btnComprar.classList.add('btn-success');

        btnComprar.addEventListener('click', () => {
            localStorage.setItem('activeCourseId', curso.id);
            window.location.href = 'claseAlumn.html?curso=' + curso.id;
        });
        return;
    }

    // Configurar para compra
    btnComprar.addEventListener('click', () => {
        // Verificar si el usuario está autenticado
        if (!acceso.autenticado) {
            localStorage.setItem('redirectAfterLogin', window.location.href);
            alert('Debes iniciar sesión para comprar este curso.');
            window.location.href = 'login.html';
            return;
        }

        // Verificar que el perfil esté completo
        if (!validarPerfilCompleto(usuarioActual)) {
            const confirmar = confirm(
                'Completa tu perfil antes de comprar\n\n' +
                'Para poder generar tu certificado al finalizar el curso, necesitamos que completes tu perfil con tu nombre y apellido.\n\n' +
                '¿Deseas completar tu perfil ahora?'
            );

            if (confirmar) {
                localStorage.setItem('redirectAfterLogin', window.location.href);
                window.location.href = 'account.html';
            }
            return;
        }

        // Abrir portal de pago
        abrirPortalPago(curso);
    });
}

// ==================== PORTAL DE PAGO ====================

function abrirPortalPago(curso) {
    const modal = document.getElementById('portalPagoModal');
    if (!modal) return;

    // Cargar información del curso en el modal
    const portalNombre = document.getElementById('portalCursoNombre');
    const portalPrecio = document.getElementById('portalCursoPrecio');

    if (portalNombre) portalNombre.textContent = curso.nombre;
    if (portalPrecio) portalPrecio.textContent = formatearPrecio(curso.precio);

    // Mostrar modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Configurar eventos del modal
    configurarEventosPortalPago(curso);
}

function cerrarPortalPago() {
    const modal = document.getElementById('portalPagoModal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Resetear secciones de pago
    const seccionWebpay = document.getElementById('seccionWebpay');
    const seccionMercadoPago = document.getElementById('seccionMercadoPago');
    if (seccionWebpay) seccionWebpay.style.display = 'none';
    if (seccionMercadoPago) seccionMercadoPago.style.display = 'none';

    // Resetear botones de método de pago
    document.querySelectorAll('.metodo-pago-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

function configurarEventosPortalPago(curso) {
    // Botón cerrar
    const btnCerrar = document.getElementById('btnCerrarPortal');
    if (btnCerrar) btnCerrar.onclick = cerrarPortalPago;

    // Botón volver
    const btnVolver = document.getElementById('btnVolverCheckout');
    if (btnVolver) btnVolver.onclick = cerrarPortalPago;

    // Cerrar al hacer click en overlay
    const overlay = document.querySelector('.portal-pago-overlay');
    if (overlay) overlay.onclick = cerrarPortalPago;

    // Botón Webpay
    const btnWebpay = document.getElementById('btnWebpay');
    if (btnWebpay) {
        btnWebpay.onclick = () => {
            document.querySelectorAll('.metodo-pago-btn').forEach(btn => btn.classList.remove('selected'));
            btnWebpay.classList.add('selected');

            const seccionWebpay = document.getElementById('seccionWebpay');
            const seccionMercadoPago = document.getElementById('seccionMercadoPago');
            if (seccionWebpay) seccionWebpay.style.display = 'block';
            if (seccionMercadoPago) seccionMercadoPago.style.display = 'none';

            seccionWebpay?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
    }

    // Botón Mercado Pago
    const btnMercadoPago = document.getElementById('btnMercadoPago');
    if (btnMercadoPago) {
        btnMercadoPago.onclick = () => {
            document.querySelectorAll('.metodo-pago-btn').forEach(btn => btn.classList.remove('selected'));
            btnMercadoPago.classList.add('selected');

            const seccionWebpay = document.getElementById('seccionWebpay');
            const seccionMercadoPago = document.getElementById('seccionMercadoPago');
            if (seccionWebpay) seccionWebpay.style.display = 'none';
            if (seccionMercadoPago) seccionMercadoPago.style.display = 'block';

            seccionMercadoPago?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
    }

    // Formulario Webpay
    const formWebpay = document.getElementById('formWebpay');
    if (formWebpay) {
        formWebpay.onsubmit = (e) => {
            e.preventDefault();
            iniciarPagoWebpay(curso);
        };
    }

    // Botón Mercado Pago pagar
    const btnPagarMP = document.getElementById('btnPagarMercadoPago');
    if (btnPagarMP) {
        btnPagarMP.onclick = () => iniciarPagoMercadoPago(curso);
    }
}

// ==================== INTEGRACIÓN DE PASARELAS DE PAGO ====================

async function iniciarPagoWebpay(curso) {
    console.log('Iniciando pago con Webpay para curso:', curso.nombre);

    // SIMULACIÓN TEMPORAL
    alert('Portal de pago de Webpay/Transbank.\n\nAquí se redirigirá a la pasarela de pago de Transbank.\n\nPor ahora es una simulación.');

    await procesarCompraExitosa(curso, 'Webpay Plus');
}

async function iniciarPagoMercadoPago(curso) {
    console.log('Iniciando pago con Mercado Pago para curso:', curso.nombre);

    // SIMULACIÓN TEMPORAL
    alert('Portal de pago de Mercado Pago.\n\nAquí se mostrará el checkout de Mercado Pago.\n\nPor ahora es una simulación.');

    await procesarCompraExitosa(curso, 'Mercado Pago');
}

async function procesarCompraExitosa(curso, metodoPago) {
    try {
        const fechaCompra = new Date();
        const diasAcceso = curso.dias_duracion_acceso || 180;
        const transaccionId = generarTransaccionId();
        const codigoAutorizacion = generarCodigoAutorizacion();

        // Registrar transacción en Supabase
        const { data: transaccion, error } = await supabase
            .from('transacciones')
            .insert([{
                usuario_id: usuarioActual.id,
                curso_id: curso.id,
                monto: curso.precio,
                estado: 'PAGADO',
                metodo_pago: metodoPago,
                codigo_autorizacion: codigoAutorizacion
            }])
            .select()
            .single();

        if (error) {
            console.error('Error al registrar transacción:', error);
            // Continuar con el flujo de UI aunque falle el registro
        }

        // Crear objeto de transacción para localStorage (página de confirmación)
        const transaccionLocal = {
            estado: 'PAGADO',
            cursoId: curso.id,
            cursoNombre: curso.nombre,
            monto: curso.precio,
            metodoPago: metodoPago,
            fecha: fechaCompra.toISOString(),
            codigoAutorizacion: codigoAutorizacion,
            transaccionId: transaccion?.id || transaccionId,
            usuarioEmail: usuarioActual.email,
            usuarioNombre: usuarioActual.nombre
        };

        localStorage.setItem('ultimaTransaccion', JSON.stringify(transaccionLocal));

        // También guardar en historial local
        guardarTransaccionEnHistorial(transaccionLocal);

        // Cerrar portal y redirigir
        cerrarPortalPago();
        window.location.href = 'payment-confirmation.html';

    } catch (error) {
        console.error('Error procesando compra:', error);
        alert('Hubo un error al procesar la compra. Por favor intenta nuevamente.');
    }
}

// ==================== FUNCIONES AUXILIARES DE TRANSACCIONES ====================

function generarTransaccionId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `TXN-${timestamp}-${random}`;
}

function generarCodigoAutorizacion() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function guardarTransaccionEnHistorial(transaccion) {
    const historial = JSON.parse(localStorage.getItem('kikibrows_transacciones')) || [];

    historial.push({
        id: transaccion.transaccionId,
        producto: transaccion.cursoNombre,
        valor: transaccion.monto,
        usuario: transaccion.usuarioNombre || 'Usuario',
        fecha: transaccion.fecha,
        email: transaccion.usuarioEmail,
        estado: transaccion.estado,
        paymentStatus: transaccion.estado,
        bank: transaccion.metodoPago,
        paymentMethod: 'Débito/Crédito',
        authCode: transaccion.codigoAutorizacion,
        gatewayToken: transaccion.transaccionId
    });

    localStorage.setItem('kikibrows_transacciones', JSON.stringify(historial));
}

// ==================== MANEJO DE ERRORES ====================

function mostrarError(mensaje) {
    const container = document.querySelector('.preview-main .container');
    if (!container) return;

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
    console.log('Inicializando coursePreview.js con Supabase');

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
            document.body.style.paddingTop = '50px';
        }
    }

    cargarInformacionCurso(cursoId);
});
