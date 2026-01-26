// js/componenteAdmin.js
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const renderNavbarAdmin = async () => {
    // Verificar sesión de Supabase
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        localStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'login.html';
        return;
    }

    // Obtener perfil del usuario
    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, role')
        .eq('id', session.user.id)
        .single();

    // Verificar que sea admin
    if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
        alert('No tienes permisos para acceder a esta página.');
        window.location.href = 'index.html';
        return;
    }

    const adminName = profile?.first_name || session.user.email.split('@')[0];
    const roleLabel = profile?.role === 'superadmin' ? 'Super Admin' : 'Admin';

    // Actualizar localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', adminName);
    localStorage.setItem('userRole', profile?.role || 'admin');

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

        // Listener para el botón de cerrar sesión
        const logoutBtn = document.getElementById('btn-logout-admin');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();

                // Cerrar sesión en Supabase
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('Error cerrando sesión:', error);
                }

                // Limpiar localStorage
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userName');
                localStorage.removeItem('usuarioActual');
                localStorage.removeItem('userRole');

                window.location.href = 'index.html';
            });
        }

        // Listener para el botón hamburguesa del sidebar
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');

                // Crear o toggle el backdrop
                let backdrop = document.querySelector('.sidebar-backdrop');
                if (!backdrop) {
                    backdrop = document.createElement('div');
                    backdrop.className = 'sidebar-backdrop';
                    document.body.appendChild(backdrop);

                    // Cerrar sidebar al hacer clic en el backdrop
                    backdrop.addEventListener('click', () => {
                        sidebar.classList.remove('open');
                        backdrop.classList.remove('show');
                    });
                }

                // Toggle del backdrop
                if (sidebar.classList.contains('open')) {
                    backdrop.classList.add('show');
                } else {
                    backdrop.classList.remove('show');
                }
            });
        }
    }
};

// Ejecutamos la función
renderNavbarAdmin();
