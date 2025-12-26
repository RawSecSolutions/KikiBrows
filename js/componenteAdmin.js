// js/componenteAdmin.js

const navbarHTML = `
    <div class="container-fluid h-100 d-flex justify-content-between align-items-center">
        
        <button id="sidebar-toggle-btn" class="btn border-0 p-2 me-3 d-lg-none" type="button" aria-label="Toggle sidebar">
            <i class="fas fa-bars text-dark fs-2"></i> 
        </button>
        
        <div class="kikibrows-logo fs-3 fw-bold text-dark flex-grow-1 text-center text-lg-start">KIKIBROWS</div>
        
        <div class="top-icons d-flex align-items-center gap-3">
            <a href="#" class="text-secondary position-relative">
                <i class="fas fa-bell fs-5"></i>
                <span class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                    <span class="visually-hidden">Alertas</span>
                </span>
            </a>
            <div class="dropdown">
                <a class="nav-link text-secondary d-flex align-items-center gap-2" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <div class="d-flex flex-column text-end line-height-1">
                        <span class="d-none d-md-inline fs-6 fw-bold">Emilio Admin</span>
                        <span class="d-none d-md-inline text-muted" style="font-size: 0.75rem;">Super Admin</span>
                    </div>
                    <i class="fa-solid fa-circle-user fs-4 ms-1"></i>
                </a>
                <ul class="dropdown-menu dropdown-menu-end border-0 shadow mt-3">
                    <li><h6 class="dropdown-header">Sesión Activa</h6></li>
                    <li><a class="dropdown-item text-danger" href="login.html"><i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión</a></li>
                </ul>
            </div>
        </div>
    </div>
    <div id="mobile-backdrop" class="sidebar-backdrop"></div>
`;

// Insertar el HTML
const navbarContainer = document.getElementById('navbar-global');
if (navbarContainer) {
    navbarContainer.className = 'top-navbar'; 
    navbarContainer.innerHTML = navbarHTML;
}