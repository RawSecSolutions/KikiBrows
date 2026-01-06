/* Archivo: js/cursosAlumn.js */

// Esperamos a que todo el HTML esté cargado antes de ejecutar
document.addEventListener('DOMContentLoaded', () => {
    
    // Verificamos que el objeto UI exista para evitar errores
    if (typeof UI !== 'undefined') {
        console.log("Inicializando componentes de cursos...");
        UI.initNavbar();
        UI.renderLibrary();
    } else {
        console.error("Error: El objeto UI no se ha cargado correctamente.");
    }

});