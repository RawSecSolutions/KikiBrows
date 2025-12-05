/**
 * js/accountEdit.js
 * Control de vistas para la sección Mi Cuenta
 */

// 1. Abrir edición simple (Del Dashboard -> 1 Tarjeta)
function openSimpleEdit(event) {
    if(event) event.preventDefault();
    
    const dashboard = document.getElementById('dashboard-view');
    const simpleEdit = document.getElementById('simple-edit-view');
    const splitEdit = document.getElementById('split-edit-view');

    if(dashboard && simpleEdit) {
        dashboard.classList.add('d-none');
        simpleEdit.classList.remove('d-none');
        if(splitEdit) splitEdit.classList.add('d-none');
    } else {
        console.error("No se encontraron los elementos del DOM");
    }
}

// 2. Dividir en 2 tarjetas (Al tocar el lápiz del correo)
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

    if(simpleEdit) simpleEdit.classList.add('d-none');
    if(splitEdit) splitEdit.classList.add('d-none');
    if(dashboard) dashboard.classList.remove('d-none');
}