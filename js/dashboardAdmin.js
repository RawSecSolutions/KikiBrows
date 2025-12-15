// js/dashboardAdmin.js - Lógica de Toggle Bar (Menú Burger)

document.addEventListener('DOMContentLoaded', () => {

    const sidebar = document.getElementById('sidebar');
    // ID del botón de toggle en el Top Navbar
    const sidebarToggler = document.getElementById('sidebar-toggle-btn'); 

    // Función de Toggle para el Sidebar
    function toggleSidebar() {
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    }

    // Listener para el botón de toggle (burger)
    if (sidebarToggler) {
        sidebarToggler.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el evento se propague al document click
            toggleSidebar();
        });
    }
    
    // Cerrar el sidebar si se hace clic fuera de él (Solo en móvil)
    document.addEventListener('click', (e) => {
        // Usamos 992px como breakpoint (coincide con Bootstrap lg)
        if (window.innerWidth < 992 && sidebar && sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && !sidebarToggler.contains(e.target)) {
            
            // Cerrar el sidebar
            sidebar.classList.remove('open');
        }
    });

    // Cierre del sidebar si se cambia el tamaño de la ventana de móvil a escritorio
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 992 && sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

});
