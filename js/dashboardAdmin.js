// js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {

    // 1. Elementos
    const sidebar = document.getElementById('sidebar');
    const sidebarToggler = document.getElementById('sidebar-toggle-btn'); 

    // 2. Función de Toggle para el Sidebar
    function toggleSidebar() {
        if (sidebar) {
            sidebar.classList.toggle('open');
            // Opcional: Podrías cambiar el icono del botón aquí (fa-bars <-> fa-times)
        }
    }

    // 3. Listener para el botón de toggle
    if (sidebarToggler) {
        sidebarToggler.addEventListener('click', toggleSidebar);
    }
    
    // Opcional: Cerrar el sidebar si se hace clic fuera de él
    document.addEventListener('click', (e) => {
        // Si el sidebar está abierto Y el clic no es dentro del sidebar, Y no es en el botón
        if (sidebar && sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && !sidebarToggler.contains(e.target)) {
            
            // Retraso de 50ms para evitar interferir con la apertura
            setTimeout(() => {
                sidebar.classList.remove('open');
            }, 50);
        }
    });

});
