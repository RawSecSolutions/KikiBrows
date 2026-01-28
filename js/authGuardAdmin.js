// js/authGuardAdmin.js
// Protección de páginas de ADMIN - Verifica sesión y rol
import { supabase, initAuthListener } from './sessionManager.js';

// Inicializar el listener global (limpieza y fingerprint)
initAuthListener();

async function checkAdminAuth() {
    console.log("AuthGuard: Iniciando verificación..."); 

    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            console.warn("AuthGuard: No hay sesión activa.");
            handleLogout();
            return null;
        }

        console.log("AuthGuard: Sesión encontrada. Verificando perfil...");

        // Obtener perfil para verificar rol
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error) console.warn('Error obteniendo perfil:', error);

        // Verificar bloqueo
        if (profile?.is_blocked) {
            alert('Tu cuenta ha sido bloqueada. Contacta soporte.');
            handleLogout();
            return null;
        }

        // Verificar rol de admin
        if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
            console.warn(`AuthGuard: Rol '${profile?.role}' no autorizado.`);
            window.location.href = 'index.html'; // Expulsar a home
            return null;
        }

        // --- ÉXITO: ES ADMIN ---
        console.log("AuthGuard: Usuario autorizado. Desbloqueando UI...");
        
        // 1. Actualizar localStorage
        updateLocalStorage(session, profile);

        // 2. DESBLOQUEAR LA UI (Solución Pantalla Blanca)
        // Usamos requestAnimationFrame para asegurar que el DOM esté pintado antes de buscar el elemento
        requestAnimationFrame(() => {
            // Buscamos por ambos IDs comunes por si acaso
            const loadingScreen = document.getElementById('loading-screen');
            const loadingOverlay = document.getElementById('loading-overlay');
            
            if (loadingScreen) loadingScreen.style.display = 'none';
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            
            document.body.classList.add('loaded'); 
            
            console.log("UI Desbloqueada");
        });

        return { session, profile };

    } catch (error) {
        console.error('Error crítico de autenticación:', error);
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

// --- EJECUCIÓN SEGURA ---
// Esperamos a que el HTML esté listo antes de correr la lógica
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAdminAuth);
} else {
    checkAdminAuth();
}

export { supabase, checkAdminAuth };