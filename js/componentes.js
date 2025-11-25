// js/componentes.js

const navbarHTML = `
    <div class="top-navbar container-fluid d-flex justify-content-between align-items-center">
        <div class="top-left d-none d-lg-block"></div>
        <button class="navbar-toggler custom-toggler d-lg-none border-0 p-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContenido" aria-controls="navbarContenido" aria-expanded="false" aria-label="Toggle navigation">
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

    <nav class="navbar navbar-expand-lg main-navbar">
        <div class="container-fluid">
            <div class="collapse navbar-collapse" id="navbarContenido">
                <ul class="navbar-nav mb-2 mb-lg-0 gap-1 gap-lg-5">
                    <li class="nav-item d-lg-none separator"><a class="nav-link" href="#">INICIO</a></li>
                    <li class="nav-item d-none d-lg-block"><a class="nav-link" href="#">INICIO</a></li>
                    <li class="nav-item separator"><a class="nav-link" href="#">NOSOTROS</a></li>
                    <li class="nav-item separator"><a class="nav-link" href="#">CURSOS</a></li>
                    <li class="nav-item separator"><a class="nav-link" href="#">SEMINARIOS</a></li>
                    <li class="nav-item separator"><a class="nav-link" href="#">CONTACTO</a></li>
                </ul>
            </div> 
        </div>
    </nav>

    <hr class="navbar-divider">
`;

// Esta función busca un elemento con id "navbar-global" e inserta el HTML ahí
const navbarContainer = document.getElementById('navbar-global');
if (navbarContainer) {
    navbarContainer.innerHTML = navbarHTML;
}