// js/componenteAdmin.js
import { supabase, removeDevice } from './sessionManager.js';

// --- FUNCIÓN PARA RENDERIZAR SIDEBAR ---
function renderSidebar(adminName, roleLabel) {
    const sidebarContainer = document.getElementById('sidebar');
    if (!sidebarContainer) return;

    // Detectar página actual para marcar el item activo
    const currentPage = window.location.pathname.split('/').pop() || 'adminPanel.html';

    const menuItems = [
        { href: 'adminPanel.html', icon: 'fa-home', label: 'Dashboard' },
        { href: 'usersGest.html', icon: 'fa-users', label: 'Usuarios' },
        { href: 'gestionCursos.html', icon: 'fa-book', label: 'Gestion Cursos' },
        { href: 'adminTransa.html', icon: 'fa-exchange-alt', label: 'Transacciones' },
        { href: 'adminCalendar.html', icon: 'fa-calendar-alt', label: 'Calendario' },
        { href: 'revYFeedback.html', icon: 'fa-search', label: 'Revisiones' },
        { href: 'index.html', icon: 'fa-globe', label: 'Volver al Sitio' }
    ];

    const navItemsHTML = menuItems.map(item => {
        const isActive = currentPage === item.href ? ' active' : '';
        return `<a href="${item.href}" class="nav-item${isActive}"><i class="fas ${item.icon}"></i> ${item.label}</a>`;
    }).join('\n                ');

    sidebarContainer.innerHTML = `
        <div class="sidebar-header">
            <div class="profile-section">
                <div class="profile-pic">
                    <i class="fas fa-user-shield"></i>
                </div>
                <div class="profile-info">
                    <div class="user-name" id="sidebar-user-name">${adminName}</div>
                    <small class="text-success fw-bold" id="sidebar-role-label">${roleLabel}</small>
                </div>
            </div>
        </div>
        <nav class="sidebar-nav">
            ${navItemsHTML}
        </nav>
    `;
}

const renderNavbarAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        localStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'login.html';
        return;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, role')
        .eq('id', session.user.id)
        .single();

    if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
        alert('No tienes permisos para acceder a esta página.');
        window.location.href = 'index.html';
        return;
    }

    const adminName = profile?.first_name || session.user.email.split('@')[0];
    const roleLabel = profile?.role === 'superadmin' ? 'Super Admin' : 'Admin';

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', adminName);
    localStorage.setItem('userRole', profile?.role || 'admin');

    // Renderizar sidebar dinámicamente
    renderSidebar(adminName, roleLabel);

    // Actualizar saludo del dashboard si existe
    const dashboardGreeting = document.getElementById('dashboard-greeting');
    if (dashboardGreeting) dashboardGreeting.textContent = `Hola, ${adminName}`;

    const navbarHTML = `
    <div class="top-navbar container-fluid d-flex align-items-center py-3">
        <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle sidebar">
            <i class="fas fa-bars"></i>
        </button>
        <div class="kikibrows-logo">
            <img src="img/kikibrows-logo.png" alt="KIKIBROWS">
        </div>
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
                    <li><span class="dropdown-item-text text-muted small">${roleLabel}</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="adminPanel.html">Panel Admin</a></li>
                    <li><a class="dropdown-item" href="adminProfilePassword.html"><i class="fas fa-key me-2"></i>Cambiar Contraseña</a></li>
                    <li><a class="dropdown-item" href="index.html">Ir al Sitio</a></li>
                    <li><a class="dropdown-item" href="#" id="btn-logout-admin">Cerrar Sesión</a></li>
                </ul>
            </div>
        </div>
    </div>
    `;

    const navbarContainer = document.getElementById('navbar-global');
    if (navbarContainer) {
        navbarContainer.innerHTML = navbarHTML;

        // --- LISTENER CORREGIDO ---
        const logoutBtn = document.getElementById('btn-logout-admin');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                logoutBtn.innerText = "Saliendo...";

                try {
                    const { data: { user } } = await supabase.auth.getUser();

                    if (user) {
                        await removeDevice(user.id);
                    }
                    await supabase.auth.signOut();
                } catch (error) {
                    console.error('Error cerrando sesión:', error);
                    await supabase.auth.signOut();
                }

                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userName');
                localStorage.removeItem('usuarioActual');
                localStorage.removeItem('userRole');

                window.location.href = 'index.html'; // O login.html
            });
        }

        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                let backdrop = document.querySelector('.sidebar-backdrop');
                if (!backdrop) {
                    backdrop = document.createElement('div');
                    backdrop.className = 'sidebar-backdrop';
                    document.body.appendChild(backdrop);
                    backdrop.addEventListener('click', () => {
                        sidebar.classList.remove('open');
                        backdrop.classList.remove('show');
                    });
                }
                if (sidebar.classList.contains('open')) {
                    backdrop.classList.add('show');
                } else {
                    backdrop.classList.remove('show');
                }
            });
        }
    }
};

renderNavbarAdmin();