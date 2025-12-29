const UI = {
    // Fiel al diseño de componentes.js proporcionado
    initNavbar: () => {
        const navbarHTML = `
            <div class="top-navbar container-fluid d-flex justify-content-between align-items-center position-relative py-2">
                <div class="top-left d-none d-lg-block"></div>
                <button class="navbar-toggler custom-toggler d-lg-none border-0 p-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContenido">
                    <i class="fas fa-bars text-dark fs-2"></i>
                </button>
                <div class="kikibrows-logo position-absolute start-50 translate-middle-x">KIKIBROWS</div>
                <div class="top-icons">
                    <div class="dropdown">
                        <a class="nav-link" href="#" role="button" data-bs-toggle="dropdown">
                            <i class="fa-solid fa-user"></i>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><h6 class="dropdown-header">Hola, Alumna</h6></li>
                            <li><a class="dropdown-item" href="account.html">Mi Cuenta</a></li>
                            <li><a class="dropdown-item" href="#">Cerrar Sesión</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <nav class="navbar navbar-expand-lg main-navbar py-1">
                <div class="container">
                    <div class="collapse navbar-collapse" id="navbarContenido">
                        <ul class="navbar-nav mb-2 mb-lg-0 gap-1 gap-lg-3">
                            <li class="nav-item separator"><a class="nav-link" href="#">INICIO</a></li>
                            <li class="nav-item separator"><a class="nav-link" href="#">CURSOS</a></li>
                            <li class="nav-item separator"><a class="nav-link" href="#">CONTACTO</a></li>
                        </ul>
                    </div> 
                </div>
            </nav>
            <hr class="navbar-divider">`;
        
        const header = document.getElementById('header-component');
        header.innerHTML = navbarHTML;
        header.className = "fixed-top w-100"; // Asegura que se mantenga arriba
    },

    initSidebar: () => {
        // Estética unificada con las cards de account.css
        const html = `
        <aside id="sidebar" class="ms-3 p-2 shadow-sm" style="width: var(--sidebar-width); height: calc(100vh - 160px); overflow-y: auto;">
            <div class="p-4">
                <h5 class="fw-bold mb-3" style="color: var(--text-dark);">Diseño de Mirada Pro</h5>
                <div class="progress-custom mb-2"><div class="progress-fill" style="width: 45%;"></div></div>
                <small class="text-muted">45% completado</small>
            </div>
            <div class="list-group list-group-flush bg-transparent">
                <div class="lesson-list-item active"><i class="fas fa-play-circle me-3"></i> 1. Bienvenida</div>
                <div class="lesson-list-item"><i class="fas fa-check-circle me-3 text-success"></i> 2. Materiales</div>
                <div class="lesson-list-item"><i class="fas fa-play-circle me-3"></i> 3. Morfología Facial</div>
                <div class="lesson-list-item text-muted"><i class="fas fa-lock me-3"></i> 4. Quiz Final</div>
            </div>
        </aside>`;
        document.getElementById('sidebar-component').innerHTML = html;
    }
};
