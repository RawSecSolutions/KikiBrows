// js/authGuardAdmin.js
// Protección de páginas de ADMIN - Verifica sesión y rol
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAdminAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        localStorage.setItem('redirectAfterLogin', window.location.href);
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
        alert('No tienes permisos para acceder a esta página.');
        window.location.href = 'index.html';
        return null;
    }

    // Actualizar localStorage
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

    return { session, profile };
}

// Ejecutar verificación automáticamente
checkAdminAuth();

export { supabase, checkAdminAuth };
