// js/dashboardAdmin.js - Lógica del Sidebar y Backdrop

document.addEventListener('DOMContentLoaded', () => {

    const sidebar = document.getElementById('sidebar');
    // El botón se crea dinámicamente, así que usamos delegación o lo buscamos después
    // El backdrop también se crea en componenteAdmin.js
    
    // Función para alternar el menú
    function toggleSidebar() {
        const backdrop = document.getElementById('mobile-backdrop');
        
        if (sidebar) {
            sidebar.classList.toggle('open');
            
            // Manejar el backdrop si estamos en móvil
            if (backdrop) {
                if (sidebar.classList.contains('open')) {
                    backdrop.classList.add('show');
                } else {
                    backdrop.classList.remove('show');
                }
            }
        }
    }

    // Listener global para el botón hamburguesa (ya que se inyecta dinámicamente)
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('#sidebar-toggle-btn');
        
        if (toggleBtn) {
            e.stopPropagation();
            toggleSidebar();
        }
    });

    // Cerrar sidebar al hacer clic en el backdrop (fuera del menú)
    document.addEventListener('click', (e) => {
        const backdrop = document.getElementById('mobile-backdrop');
        
        // Si el clic fue en el backdrop
        if (e.target === backdrop) {
            if (sidebar) sidebar.classList.remove('open');
            if (backdrop) backdrop.classList.remove('show');
        }
    });

    // Resetear clases si la pantalla cambia de tamaño (de móvil a escritorio)
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 992) {
            const backdrop = document.getElementById('mobile-backdrop');
            if (sidebar) sidebar.classList.remove('open'); // Opcional: remover open o dejarlo
            if (backdrop) backdrop.classList.remove('show');
        }
    });

});