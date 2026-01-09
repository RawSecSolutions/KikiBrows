// js/componenteAdmin.js

const renderNavbarAdmin = () => {
    const adminName = localStorage.getItem('userName') || 'Admin';

    const navbarHTML = `
    <div class="top-navbar container-fluid d-flex justify-content-between align-items-center py-3">
        <div class="kikibrows-logo">KIKIBROWS</div>
        <div class="top-icons">
            <a href="#" class="text-secondary position-relative me-2">
                <i class="fas fa-bell"></i>
                <span class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                    <span class="visually-hidden">Alertas</span>
                </span>
            </a>
            <div class="dropdown">
                <a class="nav-link" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fa-solid fa-user-shield text-success"></i>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><h6 class="dropdown-header">Hola, ${adminName}</h6></li>
                    <li><span class="dropdown-item-text text-muted small">Super Admin</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="adminPanel.html">Panel Admin</a></li>
                    <li><a class="dropdown-item" href="#" id="btn-logout-admin">Cerrar Sesión</a></li>
                </ul>
            </div>
        </div>
    </div>
    `;

    const navbarContainer = document.getElementById('navbar-global');
    if (navbarContainer) {
        navbarContainer.innerHTML = navbarHTML;

        // Listener para el botón de cerrar sesión
        const logoutBtn = document.getElementById('btn-logout-admin');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userName');
                window.location.href = 'index.html';
            });
        }
    }
};

// Ejecutamos la función
renderNavbarAdmin();