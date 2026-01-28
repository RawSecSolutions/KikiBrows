// js/authGuardAdmin.js
// Protección de páginas de ADMIN - Verifica sesión y rol
import { supabase, initAuthListener } from './sessionManager.js';

// Inicializar el listener global de autenticación
// Esto maneja el registro/actualización del dispositivo con session_id
initAuthListener();

async function checkAdminAuth() {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            localStorage.setItem('redirectAfterLogin', window.location.href);
            // Limpieza preventiva
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userName');
            localStorage.removeItem('usuarioActual');
            localStorage.removeItem('userRole');
            
            window.location.href = 'login.html';
            return null;
        }

        // Obtener perfil para verificar rol
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.warn('Error obteniendo perfil:', error);
        }

        // Verificar si el usuario está bloqueado
        if (profile?.is_blocked) {
            await supabase.auth.signOut();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userName');
            localStorage.removeItem('usuarioActual');
            localStorage.removeItem('userRole');
            
            alert('Tu cuenta ha sido bloqueada. Contacta soporte.');
            window.location.href = 'login.html';
            return null;
        }

        // Verificar rol de admin
        if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
            // Si no es admin, redirigir sin mostrar nada
            window.location.href = 'index.html';
            return null;
        }

        // --- ÉXITO: EL USUARIO ES ADMIN AUTORIZADO ---
        
        // 1. Actualizar localStorage
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

        // 2. DESBLOQUEAR LA UI (Quitar pantalla de carga)
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        document.body.classList.add('loaded'); // Hace visible el contenido

        return { session, profile };

    } catch (error) {
        console.error('Error de autenticación:', error);
        window.location.href = 'login.html';
        return null;
    }
}

// Ejecutar verificación automáticamente al cargar el script
checkAdminAuth();

export { supabase, checkAdminAuth };