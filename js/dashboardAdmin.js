// js/dashboardAdmin.js

document.addEventListener('DOMContentLoaded', () => {

    // 1. Inyección de la estructura HTML del Sidebar
    const mainContent = document.querySelector('main');
    const sidebarHTML = `
        <nav id="sidebar">
            <div class="profile-section">
                <div class="profile-pic"><i class="fas fa-user"></i></div>
                <div class="profile-info">
                    <div class="user-name">Administrador</div>
                    <small>Ver Perfil</small>
                </div>
            </div>
            <div class="sidebar-nav">
                <a href="#" class="nav-item">
                    <i class="fas fa-tachometer-alt"></i> Dashboard
                </a>
                <a href="#" class="nav-item active">
                    <i class="fas fa-users-cog"></i> Usuarios
                </a>
                <a href="#" class="nav-item">
                    <i class="fas fa-clipboard-list"></i> Citas
                </a>
                <a href="#" class="nav-item">
                    <i class="fas fa-box"></i> Productos
                </a>
                <a href="#" class="nav-item logout">
                    <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                </a>
            </div>
        </nav>
    `;

    // Insertar el sidebar antes del contenido principal
    if (mainContent) {
        mainContent.insertAdjacentHTML('beforebegin', sidebarHTML);
    }
    
    // Ahora, obtenemos los elementos después de la inserción
    const sidebar = document.getElementById('sidebar');
    const sidebarToggler = document.getElementById('sidebar-toggle-btn'); 

    // 2. Función de Toggle para el Sidebar
    function toggleSidebar() {
        if (sidebar) {
            sidebar.classList.toggle('open');
            
            // Cambiar el icono del botón (fa-bars <-> fa-times)
            const icon = sidebarToggler.querySelector('i');
            if (sidebar.classList.contains('open')) {
                 icon.classList.remove('fa-bars');
                 icon.classList.add('fa-times');
            } else {
                 icon.classList.remove('fa-times');
                 icon.classList.add('fa-bars');
            }
        }
    }

    // 3. Listener para el botón de toggle (burger)
    if (sidebarToggler) {
        sidebarToggler.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el evento se propague al document click
            toggleSidebar();
        });
    }
    
    // 4. Cerrar el sidebar si se hace clic fuera de él
    document.addEventListener('click', (e) => {
        // Si el sidebar está abierto Y el clic no es dentro del sidebar, Y no es en el botón
        if (sidebar && sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && !sidebarToggler.contains(e.target)) {
            
            // Retraso de 50ms para evitar interferir con la apertura
            setTimeout(() => {
                sidebar.classList.remove('open');
                sidebarToggler.querySelector('i').classList.remove('fa-times');
                sidebarToggler.querySelector('i').classList.add('fa-bars');
            }, 50);
        }
    });

});
