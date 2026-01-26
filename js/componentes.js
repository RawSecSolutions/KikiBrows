// js/componentes.js

let supabase = null;

// 1. Función auxiliar para identificar el dispositivo (Igual que en el Login)
function getDeviceFingerprint() {
    return navigator.userAgent + "::" + screen.width + "x" + screen.height;
}

// Intentar cargar la configuración de Supabase
const initSupabase = async () => {
    try {
        const { SUPABASE_URL, SUPABASE_KEY } = await import('./config.js');
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        return true;
    } catch (error) {
        console.warn('Supabase config not available, running in offline mode');
        return false;
    }
};

const renderNavbar = async () => {
    // Intentar inicializar Supabase
    const supabaseAvailable = await initSupabase();

    let isLoggedIn = false;
    let userName = 'Usuario';
    let userRole = 'student';

    // Solo verificar sesión si Supabase está disponible
    if (supabaseAvailable && supabase) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            isLoggedIn = !!session;

            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, role')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    userName = profile.first_name || session.user.email.split('@')[0];
                    if (profile.last_name) userName += ' ' + profile.last_name;
                    userRole = profile.role || 'student';
                }

                // Actualizar localStorage para compatibilidad
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userName', profile?.first_name || session.user.email.split('@')[0]);
                localStorage.setItem('userRole', userRole);
            } else {
                // Limpiar localStorage si no hay sesión
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userName');
                localStorage.removeItem('usuarioActual');
                localStorage.removeItem('userRole');
            }
        } catch (error) {
            console.warn('Error checking session:', error);
        }
    }

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
                    <li class="nav-item separator"><a class="nav-link" href="#nosotros">NOSOTROS</a></li>
                    <li class="nav-item separator"><a class="nav-link" href="#cursos">CURSOS</a></li>
                    <li class="nav-item separator"><a class="nav-link" href="${isLoggedIn ? 'cursosAlumn.html' : 'login.html'}">MIS CURSOS</a></li>
                </ul>
            </div>
        </div>
    </nav>
    <hr class="navbar-divider">
    `;

    const navbarContainer = document.getElementById('navbar-global');
    if (navbarContainer) {
        navbarContainer.innerHTML = navbarHTML;

        // --- AQUÍ ESTÁ LA NUEVA LÓGICA DE CIERRE DE SESIÓN ---
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();

                // 1. Feedback visual
                logoutBtn.innerText = "Cerrando...";
                
                if (supabase) {
                    try {
                        // 2. Obtener usuario actual
                        const { data: { user } } = await supabase.auth.getUser();

                        if (user) {
                            // 3. BORRAR DISPOSITIVO DE LA BD
                            // Usamos match para borrar solo el dispositivo actual de este usuario
                            const huella = getDeviceFingerprint();
                            
                            const { error: deleteError } = await supabase
                                .from('authorized_devices')
                                .delete()
                                .match({ 
                                    user_id: user.id,
                                    device_fingerprint: huella 
                                });
                            
                            if (deleteError) {
                                console.error("Error al liberar cupo de dispositivo:", deleteError);
                            }
                        }

                        // 4. Cerrar sesión en Supabase
                        await supabase.auth.signOut();

                    } catch (err) {
                        console.error("Error en el proceso de salida:", err);
                        // Forzamos el cierre local por si acaso
                        await supabase.auth.signOut();
                    }
                }

                // 5. Limpiar localStorage
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userName');
                localStorage.removeItem('usuarioActual');
                localStorage.removeItem('userRole');

                // 6. Redirigir al login
                window.location.href = 'login.html';
            });
        }
    }
};

// Ejecutamos la función
renderNavbar();