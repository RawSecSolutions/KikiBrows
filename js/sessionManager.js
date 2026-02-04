// js/sessionManager.js
// Gestor centralizado de sesiones
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- LISTENER GLOBAL DE AUTENTICACION (CENTRALIZADO) ---
// Este listener maneja TODOS los eventos de autenticación:
// - Login con email/password
// - Login con OAuth (Google, GitHub, etc.)
// - Magic Links
// - Refresh de página (sesión restaurada)
// - Token refreshed
// - Logout
// - Password recovery

let isListenerInitialized = false;
let lastProcessedEvent = null;

function initAuthListener() {
    if (isListenerInitialized) return;
    isListenerInitialized = true;

    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event, session ? '(con sesión)' : '(sin sesión)');

        // Evitar procesar el mismo evento múltiples veces
        const eventKey = `${event}-${session?.access_token?.slice(-10) || 'none'}`;
        if (lastProcessedEvent === eventKey) return;
        lastProcessedEvent = eventKey;

        switch (event) {
            case 'SIGNED_IN':
            case 'TOKEN_REFRESHED':
            case 'INITIAL_SESSION':
                if (session) {
                    localStorage.setItem('isLoggedIn', 'true');
                }
                break;

            // Cierre de sesión
            case 'SIGNED_OUT':
                console.log('Sesión cerrada - limpiando localStorage');
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userName');
                localStorage.removeItem('usuarioActual');
                localStorage.removeItem('userRole');
                break;

            // Recuperación de contraseña (manejado en resetPassword.js)
            case 'PASSWORD_RECOVERY':
                console.log('Evento de recuperación de contraseña');
                break;

            // Cambio de contraseña exitoso
            case 'USER_UPDATED':
                console.log('Usuario actualizado');
                break;

            // MFA (para futuro)
            case 'MFA_CHALLENGE_VERIFIED':
                console.log('MFA verificado');
                break;

            default:
                console.log('Evento no manejado:', event);
        }
    });

    console.log('Auth listener inicializado (centralizado)');
}

// --- FUNCION DE LOGOUT CENTRALIZADA ---
/**
 * Cierra la sesion del usuario y limpia datos locales
 * @param {string} redirectUrl - URL de redireccion despues del logout (default: 'login.html')
 * @returns {Promise<boolean>} - true si el logout fue exitoso
 */
async function logout(redirectUrl = 'login.html') {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error('Error cerrando sesion:', error);
    }

    // Limpiar datos locales
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('usuarioActual');
    localStorage.removeItem('userRole');

    // Redirigir si se proporciona URL
    if (redirectUrl) {
        window.location.href = redirectUrl;
    }

    return true;
}

/**
 * Limpia los datos de sesion del localStorage
 */
function clearSessionData() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('usuarioActual');
    localStorage.removeItem('userRole');
}

// Exportar funciones y cliente de Supabase
export {
    supabase,
    initAuthListener,
    logout,
    clearSessionData
};
