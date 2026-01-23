/**
 * js/accountEdit.js
 * Control de vistas para la sección Mi Cuenta
 */

// --- FUNCIONES DE INTERFAZ (Botones) ---

// 1. Abrir edición simple
function openSimpleEdit(event) {
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
function splitToEmailEdit() {
    const simpleEdit = document.getElementById('simple-edit-view');
    const splitEdit = document.getElementById('split-edit-view');

    if(simpleEdit && splitEdit) {
        simpleEdit.classList.add('d-none');
        splitEdit.classList.remove('d-none');
    }
}

// 3. Cancelar y volver al inicio
function cancelEdit(event) {
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

// 4. Cargar datos del usuario desde localStorage
function loadUserData() {
    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');

    // Cargar en la vista dashboard
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

    // Cargar en los formularios de edición
    const nombreSimple = document.getElementById('nombreSimple');
    const apellidoSimple = document.getElementById('apellidoSimple');
    const nombreSplit = document.getElementById('nombreSplit');
    const apellidoSplit = document.getElementById('apellidoSplit');

    if (nombreSimple) nombreSimple.value = usuarioActual.nombre || '';
    if (apellidoSimple) apellidoSimple.value = usuarioActual.apellido || '';
    if (nombreSplit) nombreSplit.value = usuarioActual.nombre || '';
    if (apellidoSplit) apellidoSplit.value = usuarioActual.apellido || '';

    // Cargar email en el formulario simple-edit
    const emailInput = document.querySelector('#simple-edit-view input[type="text"][disabled]');
    if (emailInput) {
        emailInput.value = usuarioActual.email || '';
    }
}

// 5. Guardar cambios del perfil
function saveProfileChanges(event, formType) {
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
        alert('Por favor, completa todos los campos.');
        return;
    }

    // Actualizar localStorage
    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
    usuarioActual.nombre = nombre;
    usuarioActual.apellido = apellido;
    localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));

    // Actualizar también registeredUser para compatibilidad
    const registeredUser = {
        nombre: nombre,
        apellido: apellido
    };
    localStorage.setItem('registeredUser', JSON.stringify(registeredUser));

    // Actualizar userName (aunque ya no lo usamos, para compatibilidad)
    localStorage.setItem('userName', nombre);

    // Mostrar mensaje de éxito
    alert('Cambios guardados exitosamente');

    // Verificar si hay una redirección pendiente (ej: desde compra de curso)
    const redirectUrl = localStorage.getItem('redirectAfterLogin');

    if (redirectUrl) {
        // Limpiar la redirección
        localStorage.removeItem('redirectAfterLogin');
        // Redirigir a la URL guardada
        window.location.href = redirectUrl;
    } else {
        // Recargar datos en la vista
        loadUserData();

        // Volver al dashboard
        cancelEdit(event);

        // Recargar la página para actualizar el navbar
        window.location.reload();
    }
}

// --- INICIALIZACIÓN AUTOMÁTICA ---
// Esto carga el Navbar en cuanto el HTML está listo
document.addEventListener("DOMContentLoaded", () => {

    // Verificamos si existe el objeto UI del componentsAlumn.js
    if (typeof UI !== 'undefined' && UI.initNavbar) {
        console.log("Inicializando Navbar de Alumno en Mi Cuenta...");
        UI.initNavbar();
    } else {
        console.warn("UI no definido. Asegúrate de cargar componentsAlumn.js antes.");
    }

    // Cargar datos del usuario
    loadUserData();

    // Agregar eventos a los formularios
    const simpleForm = document.querySelector('#simple-edit-view form');
    const splitForm = document.querySelector('#split-edit-view form');

    if (simpleForm) {
        simpleForm.addEventListener('submit', (e) => saveProfileChanges(e, 'simple'));
    }

    if (splitForm) {
        splitForm.addEventListener('submit', (e) => saveProfileChanges(e, 'split'));
    }

});