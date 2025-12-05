// js/componentes.js

const navbarHTML = `
    <div class="top-navbar container-fluid d-flex justify-content-between align-items-center">
        <button id="sidebar-toggle-btn" class="navbar-toggler custom-toggler border-0 p-0" type="button" aria-label="Toggle sidebar">
            <i class="fas fa-bars text-dark fs-2"></i> 
        </button>
        <div class="kikibrows-logo">KIKIBROWS</div>
        <div class="top-icons">
            <div class="dropdown">
                <a class="nav-link" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fa-solid fa-user"></i>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><h6 class="dropdown-header">Hola, Usuario</h6></li>
                    <li><a class="dropdown-item" href="#">Mi Cuenta</a></li>
                    <li><a class="dropdown-item" href="#">Cerrar Sesión</a></li>
                </ul>
            </div>
            <i class="fas fa-shopping-cart"></i>
        </div>
    </div>
    `;

// Esta función busca un elemento con id "navbar-global" e inserta el HTML ahí
const navbarContainer = document.getElementById('navbar-global');
if (navbarContainer) {
    navbarContainer.innerHTML = navbarHTML;
}
