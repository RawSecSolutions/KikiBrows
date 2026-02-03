// js/coursePreview.js - Lógica para la página de preview de cursos
// CORREGIDO: Usa 'portada_url' en lugar de 'portada'

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
    return cursoId;
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

        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            usuarioActual.nombre = profile.first_name;
            usuarioActual.apellido = profile.last_name;
        }

        const { data: transaccion, error } = await supabase
            .from('transacciones')
            .select('id, estado')
            .eq('curso_id', cursoId)
            .eq('usuario_id', session.user.id)
            .eq('estado', 'PAGADO')
            .limit(1)
            .maybeSingle();

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
        mostrarCargando(); 

        // 1. Verificar acceso
        const acceso = await verificarAccesoUsuario(cursoId);
        tieneAcceso = acceso.tieneAcceso;

        // 2. Obtener datos básicos del curso
        // IMPORTANTE: Aquí pedimos 'portada_url' en vez de 'portada'
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

        const modoPreview = esModoPreview();
        if (!modoPreview && curso.estado !== 'PUBLICADO') {
            mostrarError('Este curso no está disponible públicamente en este momento.');
            return;
        }

        cursoActual = curso;

        // 3. Obtener estructura
        const { data: previewData, error: previewError } = await supabase
            .rpc('obtener_preview_curso', {
                curso_id_input: cursoId
            });

        if (previewError) {
            console.error('Error al obtener estructura:', previewError);
        }

        // 4. Procesar datos
        const modulosMap = new Map();
        (previewData || []).forEach(row => {
            if (!modulosMap.has(row.modulo_nombre)) {
                modulosMap.set(row.modulo_nombre, {
                    nombre: row.modulo_nombre,
                    orden: row.modulo_orden,
                    clases: []
                });
            }
            if (row.clase_nombre) {
                modulosMap.get(row.modulo_nombre).clases.push({
                    nombre: row.clase_nombre,
                    orden: row.clase_orden,
                    tipo: row.clase_tipo,
                    duracion: row.clase_duracion
                });
            }
        });

        const modulos = Array.from(modulosMap.values())
            .sort((a, b) => a.orden - b.orden);

        modulos.forEach(mod => {
            mod.clases.sort((a, b) => a.orden - b.orden);
        });

        cursoActual.modulos = modulos;

        console.log('Curso cargado:', cursoActual);
        document.title = `${curso.nombre} - KIKIBROWS`;

        // 5. Renderizar UI
        cargarHero(cursoActual);
        cargarMetaInfo(cursoActual);
        cargarModulos(cursoActual.modulos);
        configurarBotonCompra(cursoActual, acceso);

        ocultarCargando();

    } catch (error) {
        console.error('Error al cargar curso:', error);
        mostrarError('Hubo un problema al cargar la información del curso. Por favor intenta nuevamente.');
    }
}

// ==================== GESTIÓN DE ESTADO DE CARGA ====================

function mostrarCargando() {
    const loader = document.getElementById('globalLoader');
    const content = document.getElementById('courseContent');
    
    if (loader) loader.style.display = 'block';
    if (content) content.style.display = 'none';
}

function ocultarCargando() {
    const loader = document.getElementById('globalLoader');
    const content = document.getElementById('courseContent');
    
    setTimeout(() => {
        if (loader) loader.style.display = 'none';
        if (content) {
            content.style.display = 'block';
            content.style.opacity = 0;
            let op = 0.1;
            content.style.display = 'block';
            let timer = setInterval(function () {
                if (op >= 1){
                    clearInterval(timer);
                }
                content.style.opacity = op;
                content.style.filter = 'alpha(opacity=' + op * 100 + ")";
                op += op * 0.1;
            }, 10);
        }
    }, 300);
}

// ==================== CARGAR HERO ====================

function cargarHero(curso) {
    const nombreEl = document.getElementById('cursoNombre');
    const descripcionEl = document.getElementById('cursoDescripcion');
    const portadaEl = document.getElementById('heroPortada');

    if (nombreEl) nombreEl.textContent = curso.nombre;
    if (descripcionEl) descripcionEl.textContent = curso.descripcion || '';

    if (portadaEl) {
        // IMPORTANTE: Usamos curso.portada_url
        if (curso.portada_url) {
            portadaEl.innerHTML = `<img src="${curso.portada_url}" alt="${curso.nombre}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            portadaEl.innerHTML = '<div class="bg-light d-flex align-items-center justify-content-center h-100"><i class="fas fa-image fa-3x text-muted"></i></div>';
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
            <div class="no-modulos text-center py-4 text-muted">
                <i class="fas fa-folder-open fa-2x mb-3"></i>
                <h3>Próximamente</h3>
                <p>El contenido de este curso se está preparando.</p>
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

    const header = div.querySelector('.modulo-header');
    header.addEventListener('click', () => {
        header.classList.toggle('expanded');
        div.querySelector('.modulo-body').classList.toggle('show');
    });

    return div;
}

function crearClaseHTML(clase) {
    const iconos = {
        video: 'fa-play-circle', VIDEO: 'fa-play-circle',
        texto: 'fa-file-alt', TEXTO: 'fa-file-alt',
        pdf: 'fa-file-pdf', PDF: 'fa-file-pdf',
        quiz: 'fa-question-circle', QUIZ: 'fa-question-circle',
        entrega: 'fa-upload', ENTREGA: 'fa-upload', PRACTICA: 'fa-upload'
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

    btnComprar.removeAttribute('disabled');
    btnComprar.innerHTML = `<i class="fas fa-shopping-cart me-2"></i>Comprar Curso`;

    if (acceso.tieneAcceso) {
        btnComprar.innerHTML = '<i class="fas fa-play me-2"></i>Ir al Aula Virtual';
        btnComprar.classList.remove('btn-comprar-curso', 'btn-primary');
        btnComprar.classList.add('btn', 'btn-success', 'w-100');

        btnComprar.onclick = () => {
            localStorage.setItem('activeCourseId', curso.id);
            window.location.href = 'claseAlumn.html?curso=' + curso.id;
        };
        return;
    }

    btnComprar.onclick = () => {
        if (!acceso.autenticado) {
            localStorage.setItem('redirectAfterLogin', window.location.href);
            alert('Debes iniciar sesión para comprar este curso.');
            window.location.href = 'login.html';
            return;
        }

        if (!validarPerfilCompleto(usuarioActual)) {
            const confirmar = confirm('Para generar tu certificado necesitamos tu nombre completo. ¿Ir al perfil ahora?');
            if (confirmar) {
                localStorage.setItem('redirectAfterLogin', window.location.href);
                window.location.href = 'account.html';
            }
            return;
        }

        abrirPortalPago(curso);
    };
}

// ==================== PORTAL DE PAGO ====================

function abrirPortalPago(curso) {
    const modal = document.getElementById('portalPagoModal');
    if (!modal) return;

    const portalNombre = document.getElementById('portalCursoNombre');
    const portalPrecio = document.getElementById('portalCursoPrecio');

    if (portalNombre) portalNombre.textContent = curso.nombre;
    if (portalPrecio) portalPrecio.textContent = formatearPrecio(curso.precio);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    configurarEventosPortalPago(curso);
}

function cerrarPortalPago() {
    const modal = document.getElementById('portalPagoModal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    const webpay = document.getElementById('seccionWebpay');
    const mp = document.getElementById('seccionMercadoPago');
    if(webpay) webpay.style.display = 'none';
    if(mp) mp.style.display = 'none';
    
    document.querySelectorAll('.metodo-pago-btn').forEach(btn => btn.classList.remove('selected'));
}

function configurarEventosPortalPago(curso) {
    const btnCerrar = document.getElementById('btnCerrarPortal');
    const btnVolver = document.getElementById('btnVolverCheckout');
    const overlay = document.querySelector('.portal-pago-overlay');
    
    if (btnCerrar) btnCerrar.onclick = cerrarPortalPago;
    if (btnVolver) btnVolver.onclick = cerrarPortalPago;
    if (overlay) overlay.onclick = cerrarPortalPago;

    const btnWebpay = document.getElementById('btnWebpay');
    const btnMercadoPago = document.getElementById('btnMercadoPago');

    if (btnWebpay) {
        btnWebpay.onclick = () => {
            document.querySelectorAll('.metodo-pago-btn').forEach(b => b.classList.remove('selected'));
            btnWebpay.classList.add('selected');
            document.getElementById('seccionWebpay').style.display = 'block';
            document.getElementById('seccionMercadoPago').style.display = 'none';
        };
    }

    if (btnMercadoPago) {
        btnMercadoPago.onclick = () => {
            document.querySelectorAll('.metodo-pago-btn').forEach(b => b.classList.remove('selected'));
            btnMercadoPago.classList.add('selected');
            document.getElementById('seccionWebpay').style.display = 'none';
            document.getElementById('seccionMercadoPago').style.display = 'block';
        };
    }
    
    const formWebpay = document.getElementById('formWebpay');
    if (formWebpay) {
        formWebpay.onsubmit = (e) => {
            e.preventDefault();
            alert('Simulación: Redirigiendo a Webpay...');
            procesarCompraExitosa(curso, 'Webpay Plus');
        };
    }
    
    const btnPagarMP = document.getElementById('btnPagarMercadoPago');
    if(btnPagarMP) {
        btnPagarMP.onclick = () => {
            alert('Simulación: Redirigiendo a Mercado Pago...');
            procesarCompraExitosa(curso, 'Mercado Pago');
        };
    }
}

async function procesarCompraExitosa(curso, metodoPago) {
    try {
        // Registrar en Supabase
        const { error } = await supabase
            .from('transacciones')
            .insert([{
                usuario_id: usuarioActual.id,
                curso_id: curso.id,
                monto: curso.precio,
                estado: 'PAGADO',
                metodo_pago: metodoPago,
                codigo_autorizacion: Math.floor(Math.random() * 999999).toString()
            }]);

        if (error) console.error('Error registrando transacción:', error);

        const transaccionLocal = {
            estado: 'PAGADO',
            cursoId: curso.id,
            cursoNombre: curso.nombre,
            monto: curso.precio,
            fecha: new Date().toISOString(),
            transaccionId: `TXN-${Date.now()}`
        };
        localStorage.setItem('ultimaTransaccion', JSON.stringify(transaccionLocal));

        window.location.href = 'payment-confirmation.html';

    } catch (e) {
        console.error(e);
        alert('Error procesando la compra.');
    }
}

// ==================== MANEJO DE ERRORES ====================

function mostrarError(mensaje) {
    const container = document.getElementById('mainContainer');
    if (!container) return;
    
    const loader = document.getElementById('globalLoader');
    if(loader) loader.style.display = 'none';

    container.innerHTML = `
        <div class="alert alert-danger text-center mt-5 p-5 shadow-sm" role="alert" style="border-radius: 15px;">
            <i class="fas fa-exclamation-triangle fa-3x mb-3 text-danger"></i>
            <h4 class="alert-heading">¡Ups! Algo salió mal</h4>
            <p>${mensaje}</p>
            <hr>
            <a href="index.html#cursos" class="btn btn-outline-danger mt-2">
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

    if (esModoPreview()) {
        const previewBanner = document.getElementById('previewBanner');
        if (previewBanner) {
            previewBanner.style.display = 'flex';
            document.body.style.paddingTop = '50px';
        }
    }

    cargarInformacionCurso(cursoId);
});