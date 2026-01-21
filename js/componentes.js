// js/componentes.js

const renderNavbar = () => {
    // Verificamos el estado "booleano" de forma segura
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName') || 'Usuario';

    const navbarHTML = `
    <div class="top-navbar container-fluid d-flex justify-content-between align-items-center position-relative py-2">
        <div class="top-left d-none d-lg-block"></div>
        <button class="navbar-toggler custom-toggler d-lg-none border-0 p-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContenido" aria-controls="navbarContenido" aria-expanded="false" aria-label="Toggle navigation">
            <i class="fas fa-bars text-dark fs-2"></i>
        </button>
        <div class="kikibrows-logo position-absolute start-50 translate-middle-x">
            <img src="img/kikibrows-logo.png" alt="KIKIBROWS">
        </div>
        <div class="top-icons">
            <div class="dropdown">
                <a class="nav-link" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fa-solid ${isLoggedIn ? 'fa-user-check text-success' : 'fa-user'}"></i>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><h6 class="dropdown-header">Hola, ${userName}</h6></li>
                    ${isLoggedIn 
                        ? `<li><a class="dropdown-item" href="account.html">Mi Cuenta</a></li>
                           <li><a class="dropdown-item" href="#" id="btn-logout">Cerrar Sesión</a></li>`
                        : `<li><a class="dropdown-item" href="login.html">Iniciar Sesión</a></li>`
                    }
                </ul>
            </div>
        </div>
    </div>

    <nav class="navbar navbar-expand-lg main-navbar py-1">
        <div class="container">
            <div class="collapse navbar-collapse" id="navbarContenido">
                <ul class="navbar-nav mb-2 mb-lg-0 gap-1 gap-lg-3">
                    <li class="nav-item separator"><a class="nav-link" href="index.html">INICIO</a></li>
                    <li class="nav-item separator"><a class="nav-link" href="index.html#nosotros">NOSOTROS</a></li>
                    <li class="nav-item separator"><a class="nav-link" href="index.html#cursos">CURSOS</a></li>
                    <li class="nav-item separator"><a class="nav-link" href="${isLoggedIn ? 'cursosAlumn.html' : 'login.html'}">MIS CURSOS</a>

                    </li>
                </ul>
            </div> 
        </div>
    </nav>
    <hr class="navbar-divider">
    `;

    const navbarContainer = document.getElementById('navbar-global');
    if (navbarContainer) {
        navbarContainer.innerHTML = navbarHTML;

        // Listener para el botón de cerrar sesión
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userName');
                window.location.href = 'index.html'; // Redirigir y limpiar UI
            });
        }
    }
};

// Ejecutamos la función
renderNavbar();
