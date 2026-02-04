// js/authGuardAdmin.js
// Proteccion de paginas de ADMIN - Verifica sesion y rol
import { supabase, initAuthListener } from './sessionManager.js';

// NO inicializar listener aqui - lo hacemos despues de verificar auth
// para evitar race conditions con getSession()

async function checkAdminAuth() {
    try {
        // Pequeno delay para asegurar que Supabase este listo
        await new Promise(resolve => setTimeout(resolve, 100));

        // Usar timeout para evitar que getSession() se quede colgado indefinidamente
        const getSessionWithTimeout = () => {
            return Promise.race([
                supabase.auth.getSession(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout obteniendo sesion')), 8000)
                )
            ]);
        };

        const { data, error: sessionError } = await getSessionWithTimeout();

        if (sessionError) {
            handleLogout();
            return null;
        }

        const session = data?.session;

        if (!session) {
            handleLogout();
            return null;
        }

        // Obtener perfil para verificar rol
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        // Verificar bloqueo
        if (profile?.is_blocked) {
            alert('Tu cuenta ha sido bloqueada. Contacta soporte.');
            handleLogout();
            return null;
        }

        // Verificar rol de admin
        if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
            window.location.href = 'index.html'; // Expulsar a home
            return null;
        }

        // --- EXITO: ES ADMIN ---

        // 1. Actualizar localStorage
        updateLocalStorage(session, profile);

        // 2. Inicializar listener DESPUES de verificar auth (evita race condition)
        initAuthListener();

        // 3. DESBLOQUEAR LA UI (Solucion Pantalla Blanca)
        // Usamos requestAnimationFrame para asegurar que el DOM este pintado antes de buscar el elemento
        requestAnimationFrame(() => {
            // Buscamos por ambos IDs comunes por si acaso
            const loadingScreen = document.getElementById('loading-screen');
            const loadingOverlay = document.getElementById('loading-overlay');

            if (loadingScreen) loadingScreen.style.display = 'none';
            if (loadingOverlay) loadingOverlay.style.display = 'none';

            document.body.classList.add('loaded');
        });

        return { session, profile };

    } catch (error) {
        handleLogout();
        return null;
    }
}

// Funciones auxiliares
function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('usuarioActual');
    localStorage.removeItem('userRole');
    localStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = 'login.html';
}

function updateLocalStorage(session, profile) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', profile?.first_name || session.user.email.split('@')[0]);
    localStorage.setItem('userRole', profile?.role || 'student');
    const usuarioActual = {
        id: session.user.id,
        email: session.user.email,
        nombre: profile?.first_name || '',
        apellido: profile?.last_name || '',
        role: profile?.role || 'student'
    };
    localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));
}

// --- EJECUCION SEGURA ---
// Esperamos a que el HTML este listo antes de correr la logica
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAdminAuth);
} else {
    checkAdminAuth();
}

export { supabase, checkAdminAuth };
