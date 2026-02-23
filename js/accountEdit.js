/**
 * js/accountEdit.js
 * Controlador principal del Panel "Mi Cuenta".
 * Maneja: Perfil (con RLS), Historial de Compras, Mis Cursos y Certificados.
 */

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CursosData } from './cursosData.js';
import { CursosService } from './cursosService.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- INICIALIZACION AUTOMATICA ---
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Inicializar Navbar
    if (typeof UI !== 'undefined' && UI.initNavbar) {
        console.log("Inicializando Navbar de Alumno en Mi Cuenta...");
        UI.initNavbar();
    } else {
        console.warn("UI no definido. Asegúrate de cargar componentsAlumn.js antes.");
    }

    // 2. Inicializar Datos Globales (Cursos y Estudiante)
    try {
        await CursosData.init();
        await CursosData.initStudent();
        
        // Cargar todo el dashboard
        await loadDashboard();
        
        // Configurar listeners de edición
        setupEditListeners();
        
    } catch (error) {
        console.error("Error inicializando dashboard:", error);
        // Fallback en caso de error grave
        loadUserDataFromLocalStorage();
    }
});

// ==================== CARGA DE DATOS (DASHBOARD) ====================

async function loadDashboard() {
    const student = CursosData.getStudent();
    if (!student) return;

    // A. Cargar Perfil (Email y Nombre)
    await loadUserData();

    // B. Cargar Cursos
    loadUserCourses();

    // C. Cargar Certificados
    loadUserCertificates(student);

    // D. Cargar Historial de Compras
    await loadUserTransactions(student.id);
}

// 4. Cargar datos del usuario desde Supabase
async function loadUserData() {
    try {
        // Obtener sesion actual
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            loadUserDataFromLocalStorage();
            return;
        }

        // Obtener perfil desde Supabase
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error al cargar perfil:', error);
            loadUserDataFromLocalStorage();
            return;
        }

        const firstName = profile?.first_name || '';
        const lastName = profile?.last_name || '';
        const email = session.user.email || '';

        // Cargar en la vista dashboard
        const userNameDisplay = document.getElementById('user-name-display');
        const userEmailDisplay = document.getElementById('user-email-display');

        if (userNameDisplay) {
            const nombreCompleto = firstName && lastName
                ? `${firstName} ${lastName}`
                : firstName || 'Usuario';
            userNameDisplay.textContent = nombreCompleto;
        }

        if (userEmailDisplay) {
            userEmailDisplay.textContent = email || 'No disponible';
        }

        // Cargar en los formularios de edicion
        ['nombreSimple', 'nombreSplit'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = firstName;
        });

        ['apellidoSimple', 'apellidoSplit'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = lastName;
        });

        // Cargar email en el formulario simple-edit
        const emailInput = document.querySelector('#simple-edit-view input[type="text"][disabled]');
        if (emailInput) emailInput.value = email;

        // Actualizar localStorage para consistencia
        const usuarioActual = { nombre: firstName, apellido: lastName, email: email };
        localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));

    } catch (err) {
        console.error('Error en loadUserData:', err);
        loadUserDataFromLocalStorage();
    }
}

// Fallback para cargar datos desde localStorage
function loadUserDataFromLocalStorage() {
    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');

    const userNameDisplay = document.getElementById('user-name-display');
    const userEmailDisplay = document.getElementById('user-email-display');

    if (userNameDisplay) {
        const nombreCompleto = usuarioActual.nombre && usuarioActual.apellido
            ? `${usuarioActual.nombre} ${usuarioActual.apellido}`
            : usuarioActual.nombre || 'Usuario';
        userNameDisplay.textContent = nombreCompleto;
    }

    if (userEmailDisplay) {
        userEmailDisplay.textContent = usuarioActual.email || 'No disponible';
    }

    ['nombreSimple', 'nombreSplit'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = usuarioActual.nombre || '';
    });

    ['apellidoSimple', 'apellidoSplit'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = usuarioActual.apellido || '';
    });

    const emailInput = document.querySelector('#simple-edit-view input[type="text"][disabled]');
    if (emailInput) emailInput.value = usuarioActual.email || '';
}

// --- B. Mis Cursos ---
function loadUserCourses() {
    const container = document.getElementById('cursos-list');
    if (!container) return;

    const cursos = CursosData.getCursosAdquiridos();

    if (cursos.length === 0) {
        container.innerHTML = '<p class="text-muted fst-italic">No tienes cursos activos.</p>';
        return;
    }

    // Mostrar máximo 3 cursos en este resumen
    const previewCursos = cursos.slice(0, 3);

    container.innerHTML = previewCursos.map(curso => {
        const progreso = curso.progreso?.porcentaje || 0;
        let statusColor = 'text-success';
        let statusIcon = '<i class="fas fa-check-circle me-1"></i>';

        if (curso.accesoExpirado) {
            statusColor = 'text-danger';
            statusIcon = '<i class="fas fa-times-circle me-1"></i>';
        } else if (curso.accesoPorVencer) {
            statusColor = 'text-warning';
            statusIcon = '<i class="fas fa-clock me-1"></i>';
        }

        return `
            <div class="mb-3 pb-2 border-bottom">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <p class="mb-1 fw-bold text-dark">${curso.nombre}</p>
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <small class="${statusColor} fw-semibold">${statusIcon}${curso.tiempoRestante || 'Acceso activo'}</small>
                            <small class="text-muted">${progreso}% completado</small>
                        </div>
                        <div class="progress" style="height: 4px;">
                            <div class="progress-bar bg-secondary" role="progressbar" style="width: ${progreso}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- C. Certificados ---
function loadUserCertificates(student) {
    const container = document.getElementById('certificados-status');
    if (!container) return;

    const certificados = student.certificados || {};
    const total = Object.keys(certificados).length;

    if (total > 0) {
        container.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div>
                    <h5 class="mb-0 text-success">${total} Certificado${total > 1 ? 's' : ''}</h5>
                    <small class="text-muted">Listos para visualizar</small>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <i class="fa-solid fa-graduation-cap me-2 fs-5 text-muted"></i>
            <span class="fst-italic text-muted">Aún no tienes certificados disponibles.</span>
        `;
    }
}

// --- D. Historial de Compras ---
async function loadUserTransactions(userId) {
    const container = document.getElementById('compras-list');
    if (!container) return;

    const result = await CursosService.getTransaccionesUsuario(userId);
    
    if (!result.success || !result.data || result.data.length === 0) {
        container.innerHTML = '<p class="text-muted fst-italic">No se encontraron compras.</p>';
        return;
    }

    // Filtrar solo las PAGADAS y mostrar las últimas 2
    const comprasExitosas = result.data.filter(t => t.estado === 'PAGADO');
    const ultimas = comprasExitosas.slice(0, 2);

    if (ultimas.length === 0) {
        container.innerHTML = '<p class="text-muted fst-italic">No hay compras procesadas.</p>';
        return;
    }

    container.innerHTML = ultimas.map(trx => {
        const fecha = new Date(trx.fecha_compra).toLocaleDateString('es-CL');
        const precio = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(trx.monto);
        const portada = trx.cursos?.portada_url || 'https://via.placeholder.com/50';
        const nombreCurso = trx.cursos?.nombre || 'Curso KikiBrows';
        
        return `
            <div class="d-flex align-items-center mb-3">
                <img src="${portada}" alt="Portada" class="rounded me-3" style="width: 50px; height: 50px; object-fit: cover;">
                <div class="flex-grow-1">
                    <p class="mb-0 fw-bold small text-dark">${nombreCurso}</p>
                    <div class="d-flex justify-content-between">
                        <small class="text-muted">${fecha}</small>
                        <small class="fw-bold text-success">${precio}</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


// ==================== INTERFAZ Y NAVEGACION ====================

// 1. Abrir edicion simple
window.openSimpleEdit = function(event) {
    if(event) event.preventDefault();
    toggleViews('simple-edit-view');
}

// 2. Dividir en 2 tarjetas
window.splitToEmailEdit = function() {
    toggleViews('split-edit-view');
}

// 3. Cancelar y volver al inicio
window.cancelEdit = function(event) {
    if(event) event.preventDefault();
    toggleViews('dashboard-view');
}

// Exponer funcion para cambiar contrasena
window.openChangePasswordView = function(event) {
    if (event) event.preventDefault();
    toggleViews('change-password-view');
}

// Helper para cambiar vistas
function toggleViews(activeId) {
    const views = ['dashboard-view', 'simple-edit-view', 'split-edit-view', 'change-password-view'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === activeId) el.classList.remove('d-none');
            else el.classList.add('d-none');
        }
    });
}


// ==================== FORMULARIOS Y EDICION ====================

// Configurar listeners de los formularios
function setupEditListeners() {
    const simpleForm = document.querySelector('#simple-edit-view form');
    const splitProfileForm = document.querySelector('#split-edit-view .col-lg-6:first-child form');
    const splitEmailForm = document.querySelector('#split-edit-view .col-lg-6:last-child form');

    if (simpleForm) simpleForm.addEventListener('submit', (e) => saveProfileChanges(e, 'simple'));
    if (splitProfileForm) splitProfileForm.addEventListener('submit', (e) => saveProfileChanges(e, 'split'));
    if (splitEmailForm) splitEmailForm.addEventListener('submit', (e) => saveEmailChange(e));
}

// 5. Guardar cambios del perfil con validacion RLS
async function saveProfileChanges(event, formType) {
    event.preventDefault();

    let nombre, apellido;

    if (formType === 'simple') {
        nombre = document.getElementById('nombreSimple').value.trim();
        apellido = document.getElementById('apellidoSimple').value.trim();
    } else {
        nombre = document.getElementById('nombreSplit').value.trim();
        apellido = document.getElementById('apellidoSplit').value.trim();
    }

    // Validar campos
    if (!nombre || !apellido) {
        showNotification('Por favor, completa todos los campos.', 'error');
        return;
    }

    if (nombre.length < 2 || nombre.length > 50) {
        showNotification('El nombre debe tener entre 2 y 50 caracteres.', 'error');
        return;
    }

    if (apellido.length < 2 || apellido.length > 50) {
        showNotification('El apellido debe tener entre 2 y 50 caracteres.', 'error');
        return;
    }

    const nameRegex = /^[a-zA-ZÀ-ÿñÑ\s'-]+$/;
    if (!nameRegex.test(nombre) || !nameRegex.test(apellido)) {
        showNotification('El nombre y apellido solo pueden contener letras, espacios y guiones.', 'error');
        return;
    }

    // Deshabilitar boton mientras se guarda
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    }

    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            showNotification('Tu sesion ha expirado. Por favor, inicia sesion nuevamente.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        const currentUserId = session.user.id;
        const sanitizedNombre = sanitizeInput(nombre);
        const sanitizedApellido = sanitizeInput(apellido);

        const { data, error } = await supabase
            .from('profiles')
            .update({
                first_name: sanitizedNombre,
                last_name: sanitizedApellido,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUserId)
            .select()
            .single();

        if (error) {
            console.error('Error al actualizar perfil:', error);
            if (error.code === '42501' || error.message.includes('permission denied')) {
                showNotification('No tienes permiso para realizar esta accion. (Error 403)', 'error');
                return;
            }
            if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
                showNotification('Perfil no encontrado. (Error 404)', 'error');
                return;
            }
            showNotification('Error al actualizar el perfil. Intenta de nuevo.', 'error');
            return;
        }

        // Actualizar localStorage y refrescar
        const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
        usuarioActual.nombre = sanitizedNombre;
        usuarioActual.apellido = sanitizedApellido;
        localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));
        localStorage.setItem('userName', sanitizedNombre);

        showNotification('Perfil actualizado correctamente', 'success');

        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
        } else {
            // Recargar datos y volver al dashboard suavemente
            await CursosData.initStudent(); 
            await loadDashboard();
            window.cancelEdit(event);
        }

    } catch (err) {
        console.error('Error en saveProfileChanges:', err);
        showNotification('Ocurrio un error inesperado. Intenta de nuevo.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

// 6. Cambiar Email
async function saveEmailChange(event) {
    event.preventDefault();

    const nuevoCorreo = document.getElementById('nuevoCorreo')?.value.trim().toLowerCase();
    const confirmarCorreo = document.getElementById('confirmarCorreo')?.value.trim().toLowerCase();

    if (!nuevoCorreo || !confirmarCorreo) {
        showNotification('Por favor, completa todos los campos.', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nuevoCorreo)) {
        showNotification('Por favor, ingresa un correo electrónico válido.', 'error');
        return;
    }

    if (nuevoCorreo !== confirmarCorreo) {
        showNotification('Los correos electrónicos no coinciden.', 'error');
        return;
    }

    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            showNotification('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        if (session.user.email.toLowerCase() === nuevoCorreo) {
            showNotification('El nuevo correo debe ser diferente al actual.', 'error');
            return;
        }

        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        }

        const { data, error } = await supabase.auth.updateUser({ email: nuevoCorreo });

        if (error) {
            console.error('Error al cambiar email:', error);
            if (error.message.includes('already registered')) {
                showNotification('Este correo electrónico ya está registrado.', 'error');
            } else {
                showNotification('Error al cambiar el correo: ' + error.message, 'error');
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Guardar cambios';
            }
            return;
        }

        showNotification(`Se ha enviado un enlace de confirmación a ${nuevoCorreo}. Revisa tu bandeja de entrada.`, 'success');
        document.getElementById('nuevoCorreo').value = '';
        document.getElementById('confirmarCorreo').value = '';

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Guardar cambios';
        }

        setTimeout(() => window.cancelEdit(event), 4000);

    } catch (err) {
        console.error('Error en saveEmailChange:', err);
        showNotification('Ocurrió un error inesperado. Intenta de nuevo.', 'error');
    }
}

// ==================== UTILIDADES ====================

// Sanitizar entrada de usuario
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
        .trim()
        .replace(/[\x00-\x1F\x7F]/g, '')
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Mostrar notificacion
function showNotification(message, type = 'info') {
    const existingNotif = document.querySelector('.profile-notification');
    if (existingNotif) existingNotif.remove();

    const notification = document.createElement('div');
    notification.className = `profile-notification alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 100px; right: 20px; z-index: 9999; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}