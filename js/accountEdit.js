/**
 * js/accountEdit.js
 * Control de vistas para la seccion Mi Cuenta
 * Usa Supabase para actualizacion de perfiles con validacion RLS
 */

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- FUNCIONES DE INTERFAZ (Botones) ---

// 1. Abrir edicion simple
window.openSimpleEdit = function(event) {
    if(event) event.preventDefault();

    const dashboard = document.getElementById('dashboard-view');
    const simpleEdit = document.getElementById('simple-edit-view');
    const splitEdit = document.getElementById('split-edit-view');

    if(dashboard && simpleEdit) {
        dashboard.classList.add('d-none');
        simpleEdit.classList.remove('d-none');
        if(splitEdit) splitEdit.classList.add('d-none');
    }
}

// 2. Dividir en 2 tarjetas
window.splitToEmailEdit = function() {
    const simpleEdit = document.getElementById('simple-edit-view');
    const splitEdit = document.getElementById('split-edit-view');

    if(simpleEdit && splitEdit) {
        simpleEdit.classList.add('d-none');
        splitEdit.classList.remove('d-none');
    }
}

// 3. Cancelar y volver al inicio
window.cancelEdit = function(event) {
    if(event) event.preventDefault();

    const dashboard = document.getElementById('dashboard-view');
    const simpleEdit = document.getElementById('simple-edit-view');
    const splitEdit = document.getElementById('split-edit-view');
    const changePasswordView = document.getElementById('change-password-view');

    if(simpleEdit) simpleEdit.classList.add('d-none');
    if(splitEdit) splitEdit.classList.add('d-none');
    if(changePasswordView) changePasswordView.classList.add('d-none');
    if(dashboard) dashboard.classList.remove('d-none');
}

// --- FUNCIONES DE DATOS ---

// 4. Cargar datos del usuario desde Supabase
async function loadUserData() {
    try {
        // Obtener sesion actual
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            // Fallback a localStorage si no hay sesion
            loadUserDataFromLocalStorage();
            return;
        }

        // Obtener perfil desde Supabase
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error al cargar perfil:', error);
            loadUserDataFromLocalStorage();
            return;
        }

        const firstName = profile?.first_name || '';
        const lastName = profile?.last_name || '';
        const email = session.user.email || profile?.email || '';

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
        const nombreSimple = document.getElementById('nombreSimple');
        const apellidoSimple = document.getElementById('apellidoSimple');
        const nombreSplit = document.getElementById('nombreSplit');
        const apellidoSplit = document.getElementById('apellidoSplit');

        if (nombreSimple) nombreSimple.value = firstName;
        if (apellidoSimple) apellidoSimple.value = lastName;
        if (nombreSplit) nombreSplit.value = firstName;
        if (apellidoSplit) apellidoSplit.value = lastName;

        // Cargar email en el formulario simple-edit
        const emailInput = document.querySelector('#simple-edit-view input[type="text"][disabled]');
        if (emailInput) {
            emailInput.value = email;
        }

        // Actualizar localStorage para consistencia
        const usuarioActual = {
            nombre: firstName,
            apellido: lastName,
            email: email
        };
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

    const nombreSimple = document.getElementById('nombreSimple');
    const apellidoSimple = document.getElementById('apellidoSimple');
    const nombreSplit = document.getElementById('nombreSplit');
    const apellidoSplit = document.getElementById('apellidoSplit');

    if (nombreSimple) nombreSimple.value = usuarioActual.nombre || '';
    if (apellidoSimple) apellidoSimple.value = usuarioActual.apellido || '';
    if (nombreSplit) nombreSplit.value = usuarioActual.nombre || '';
    if (apellidoSplit) apellidoSplit.value = usuarioActual.apellido || '';

    const emailInput = document.querySelector('#simple-edit-view input[type="text"][disabled]');
    if (emailInput) {
        emailInput.value = usuarioActual.email || '';
    }
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

    // Validar longitud
    if (nombre.length < 2 || nombre.length > 50) {
        showNotification('El nombre debe tener entre 2 y 50 caracteres.', 'error');
        return;
    }

    if (apellido.length < 2 || apellido.length > 50) {
        showNotification('El apellido debe tener entre 2 y 50 caracteres.', 'error');
        return;
    }

    // Validar caracteres permitidos
    const nameRegex = /^[a-zA-ZÀ-ÿñÑ\s'-]+$/;
    if (!nameRegex.test(nombre) || !nameRegex.test(apellido)) {
        showNotification('El nombre y apellido solo pueden contener letras, espacios y guiones.', 'error');
        return;
    }

    // Deshabilitar boton mientras se guarda
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    }

    try {
        // Obtener sesion actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            showNotification('Tu sesion ha expirado. Por favor, inicia sesion nuevamente.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        const currentUserId = session.user.id;

        // Sanitizar entrada
        const sanitizedNombre = sanitizeInput(nombre);
        const sanitizedApellido = sanitizeInput(apellido);

        // Actualizar en Supabase con validacion RLS
        // Solo el usuario autenticado puede actualizar su propio perfil
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

            // Manejar errores de RLS
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

        // Actualizar localStorage para consistencia
        const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
        usuarioActual.nombre = sanitizedNombre;
        usuarioActual.apellido = sanitizedApellido;
        localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));

        const registeredUser = {
            nombre: sanitizedNombre,
            apellido: sanitizedApellido
        };
        localStorage.setItem('registeredUser', JSON.stringify(registeredUser));
        localStorage.setItem('userName', sanitizedNombre);

        // Mostrar mensaje de exito
        showNotification('Perfil actualizado correctamente', 'success');

        // Verificar si hay una redireccion pendiente
        const redirectUrl = localStorage.getItem('redirectAfterLogin');

        if (redirectUrl) {
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
        } else {
            // Recargar datos y volver al dashboard
            await loadUserData();
            window.cancelEdit(event);
            window.location.reload();
        }

    } catch (err) {
        console.error('Error en saveProfileChanges:', err);
        showNotification('Ocurrio un error inesperado. Intenta de nuevo.', 'error');
    } finally {
        // Rehabilitar boton
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Guardar cambios';
        }
    }
}

// Sanitizar entrada de usuario
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';

    return input
        .trim()
        .replace(/[\x00-\x1F\x7F]/g, '') // Eliminar caracteres de control
        .replace(/\s+/g, ' ') // Eliminar multiples espacios
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Mostrar notificacion
function showNotification(message, type = 'info') {
    // Remover notificacion existente
    const existingNotif = document.querySelector('.profile-notification');
    if (existingNotif) existingNotif.remove();

    const notification = document.createElement('div');
    notification.className = `profile-notification alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 100px; right: 20px; z-index: 9999; max-width: 400px;';
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.body.appendChild(notification);

    // Auto-remover despues de 5 segundos
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Exponer funcion para cambiar contrasena (usada desde changePassword.js)
window.openChangePasswordView = function(event) {
    if (event) event.preventDefault();

    const dashboard = document.getElementById('dashboard-view');
    const simpleEdit = document.getElementById('simple-edit-view');
    const splitEdit = document.getElementById('split-edit-view');
    const changePasswordView = document.getElementById('change-password-view');

    if (dashboard) dashboard.classList.add('d-none');
    if (simpleEdit) simpleEdit.classList.add('d-none');
    if (splitEdit) splitEdit.classList.add('d-none');
    if (changePasswordView) changePasswordView.classList.remove('d-none');
}

// --- FUNCION PARA CAMBIO DE EMAIL ---

/**
 * Cambia el correo electronico del usuario usando Supabase Auth
 * Supabase enviara un email de confirmacion al nuevo correo
 * @param {Event} event - Evento del formulario
 */
async function saveEmailChange(event) {
    event.preventDefault();

    const nuevoCorreo = document.getElementById('nuevoCorreo')?.value.trim().toLowerCase();
    const confirmarCorreo = document.getElementById('confirmarCorreo')?.value.trim().toLowerCase();

    // Validar campos
    if (!nuevoCorreo || !confirmarCorreo) {
        showNotification('Por favor, completa todos los campos.', 'error');
        return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nuevoCorreo)) {
        showNotification('Por favor, ingresa un correo electrónico válido.', 'error');
        return;
    }

    // Validar que coincidan
    if (nuevoCorreo !== confirmarCorreo) {
        showNotification('Los correos electrónicos no coinciden.', 'error');
        return;
    }

    // Obtener sesion actual para verificar que no sea el mismo email
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            showNotification('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        // Verificar que el nuevo email sea diferente al actual
        if (session.user.email.toLowerCase() === nuevoCorreo) {
            showNotification('El nuevo correo debe ser diferente al actual.', 'error');
            return;
        }

        // Deshabilitar boton mientras se procesa
        const submitBtn = document.querySelector('#split-edit-view .col-lg-6:last-child button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        }

        // Llamar a Supabase para cambiar el email
        // Esto enviara un email de confirmacion al nuevo correo
        const { data, error } = await supabase.auth.updateUser({
            email: nuevoCorreo
        });

        if (error) {
            console.error('Error al cambiar email:', error);

            // Manejar errores especificos
            if (error.message.includes('already registered') || error.message.includes('already been registered')) {
                showNotification('Este correo electrónico ya está registrado en otra cuenta.', 'error');
            } else if (error.message.includes('same')) {
                showNotification('El nuevo correo debe ser diferente al actual.', 'error');
            } else {
                showNotification('Error al cambiar el correo: ' + error.message, 'error');
            }

            // Rehabilitar boton
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Guardar cambios';
            }
            return;
        }

        // Exito - mostrar mensaje de confirmacion
        showNotification(
            'Se ha enviado un enlace de confirmación a tu nuevo correo (' + nuevoCorreo + '). ' +
            'Por favor, revisa tu bandeja de entrada y haz clic en el enlace para completar el cambio.',
            'success'
        );

        // Limpiar campos del formulario
        document.getElementById('nuevoCorreo').value = '';
        document.getElementById('confirmarCorreo').value = '';

        // Rehabilitar boton
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Guardar cambios';
        }

        // Volver al dashboard despues de 5 segundos
        setTimeout(() => {
            window.cancelEdit(event);
        }, 5000);

    } catch (err) {
        console.error('Error en saveEmailChange:', err);
        showNotification('Ocurrió un error inesperado. Intenta de nuevo.', 'error');
    }
}

// --- INICIALIZACION AUTOMATICA ---
// Esto carga el Navbar en cuanto el HTML esta listo
document.addEventListener("DOMContentLoaded", async () => {

    // Verificamos si existe el objeto UI del componentsAlumn.js
    if (typeof UI !== 'undefined' && UI.initNavbar) {
        console.log("Inicializando Navbar de Alumno en Mi Cuenta...");
        UI.initNavbar();
    } else {
        console.warn("UI no definido. Asegurate de cargar componentsAlumn.js antes.");
    }

    // Cargar datos del usuario desde Supabase
    await loadUserData();

    // Agregar eventos a los formularios
    const simpleForm = document.querySelector('#simple-edit-view form');
    const splitProfileForm = document.querySelector('#split-edit-view .col-lg-6:first-child form');
    const splitEmailForm = document.querySelector('#split-edit-view .col-lg-6:last-child form');

    if (simpleForm) {
        simpleForm.addEventListener('submit', (e) => saveProfileChanges(e, 'simple'));
    }

    if (splitProfileForm) {
        splitProfileForm.addEventListener('submit', (e) => saveProfileChanges(e, 'split'));
    }

    // Agregar evento para el formulario de cambio de email
    if (splitEmailForm) {
        splitEmailForm.addEventListener('submit', (e) => saveEmailChange(e));
    }

});