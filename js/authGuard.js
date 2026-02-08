// js/authGuard.js
// Protección de páginas - Verifica sesión de Supabase
import { supabase, initAuthListener } from './sessionManager.js';

// NO inicializar listener aquí - lo hacemos después de verificar auth
// para evitar race conditions con getSession()

async function checkAuth() {
    // Pequeño delay para asegurar que Supabase esté listo
    await new Promise(resolve => setTimeout(resolve, 100));

    // Usar timeout para evitar que getSession() se quede colgado
    const getSessionWithTimeout = () => {
        return Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout obteniendo sesión')), 8000)
            )
        ]);
    };

    let session = null;
    try {
        const { data, error } = await getSessionWithTimeout();
        if (error) {
            console.error('Error obteniendo sesión:', error);
        }
        session = data?.session;
    } catch (err) {
        console.error('Timeout o error en getSession:', err);
    }

    if (!session) {
        // Guardar la URL actual para redirigir después del login
        localStorage.setItem('redirectAfterLogin', window.location.href);

        // Limpiar localStorage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('usuarioActual');
        localStorage.removeItem('userRole');

        // Redirigir al login
        window.location.href = 'login.html';
        return null;
    }

    // Obtener perfil para verificar rol y bloqueo
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    // Si no existe el perfil, cerrar sesión y redirigir
    if (error || !profile) {
        console.error('No se encontró perfil para el usuario:', error);
        await supabase.auth.signOut();
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('usuarioActual');
        localStorage.removeItem('userRole');
        alert('No se encontró tu perfil de usuario. Contacta soporte.');
        window.location.href = 'login.html';
        return null;
    }

    // Verificar si el usuario está bloqueado
    if (profile.is_blocked) {
        await supabase.auth.signOut();
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('usuarioActual');
        localStorage.removeItem('userRole');
        alert('Tu cuenta ha sido bloqueada. Contacta soporte.');
        window.location.href = 'login.html';
        return null;
    }

    // Actualizar localStorage con datos actualizados
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', profile.first_name || session.user.email.split('@')[0]);
    localStorage.setItem('userRole', profile.role || 'student');

    const usuarioActual = {
        id: session.user.id,
        email: session.user.email,
        nombre: profile.first_name || '',
        apellido: profile.last_name || '',
        role: profile.role || 'student'
    };
    localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));

    // Inicializar listener DESPUÉS de verificar auth (evita race condition)
    initAuthListener();

    return { session, profile };
}

// Verificar rol de admin
async function checkAdminAuth() {
    const result = await checkAuth();
    if (!result) return null;

    const { profile } = result;

    if (profile.role !== 'admin' && profile.role !== 'superadmin') {
        alert('No tienes permisos para acceder a esta página.');
        window.location.href = 'index.html';
        return null;
    }

    return result;
}

// Ejecutar verificación automáticamente
checkAuth();

// Exportar funciones para uso externo
export { supabase, checkAuth, checkAdminAuth };
