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

});