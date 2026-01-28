// js/sessionManager.js
// Gestor centralizado de sesiones y dispositivos
// Este módulo maneja TODA la lógica de autenticación y dispositivos
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- FINGERPRINTJS INTEGRATION ---
// Cache del fingerprint para no recalcularlo en cada llamada
let cachedFingerprint = null;
let fingerprintPromise = null;

// Cargar FingerprintJS dinámicamente con timeout
async function loadFingerprintJS() {
    try {
        // Usar Promise.race con timeout para evitar bloqueos indefinidos
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 3000)
        );

        const importPromise = import('https://openfpcdn.io/fingerprintjs/v4')
            .then(FingerprintJS => FingerprintJS.default);

        return await Promise.race([importPromise, timeoutPromise]);
    } catch (error) {
        // Silenciar errores - el fallback se encargará
        return null;
    }
}

// Función fallback básica (por si FingerprintJS falla)
function generateBasicFingerprint() {
    const nav = window.navigator;
    const screen = window.screen;

    const fingerprint = [
        nav.userAgent,
        nav.language,
        nav.languages?.join(',') || '',
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        nav.hardwareConcurrency || '',
        nav.deviceMemory || '',
        nav.platform || ''
    ].join('|');

    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return 'basic_' + Math.abs(hash).toString(16);
}

// Obtener fingerprint con FingerprintJS (con cache y fallback)
async function getDeviceFingerprint() {
    // Si ya tenemos el fingerprint en cache, devolverlo
    if (cachedFingerprint) {
        return cachedFingerprint;
    }

    // Si ya hay una promesa en progreso, esperar a que termine
    if (fingerprintPromise) {
        return fingerprintPromise;
    }

    // Crear nueva promesa para obtener el fingerprint
    fingerprintPromise = (async () => {
        try {
            const FingerprintJS = await loadFingerprintJS();

            if (FingerprintJS) {
                const fp = await FingerprintJS.load();
                const result = await fp.get();
                cachedFingerprint = result.visitorId;
                console.log('Fingerprint obtenido correctamente');
                return cachedFingerprint;
            }
        } catch (error) {
            // Silenciar - el fallback manejará esto
        }

        // Fallback a fingerprint básico (funciona siempre)
        cachedFingerprint = generateBasicFingerprint();
        console.log('Fingerprint generado (fallback)');
        return cachedFingerprint;
    })();

    return fingerprintPromise;
}

// --- FUNCIONES DE DISPOSITIVOS ---
function getDeviceName() {
    const ua = navigator.userAgent;
    let browser = 'Navegador';
    let os = 'desconocido';

    // Detectar navegador (orden importa - Edge incluye Chrome en UA)
    if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Opera')) browser = 'Opera';

    // Detectar sistema operativo
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone')) os = 'iPhone';
    else if (ua.includes('iPad')) os = 'iPad';

    return `${browser} en ${os}`;
}

// --- EXTRACCION DE SESSION_ID DEL JWT ---
function extractSessionIdFromToken(accessToken) {
    try {
        // El JWT tiene 3 partes: header.payload.signature
        const parts = accessToken.split('.');
        if (parts.length !== 3) return null;

        // Decodificar el payload (base64url)
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        const parsed = JSON.parse(decoded);

        // El session_id esta en el payload del JWT de Supabase
        return parsed.session_id || null;
    } catch (error) {
        console.warn('Error extrayendo session_id del token:', error);
        return null;
    }
}

// --- REGISTRO/ACTUALIZACION DE DISPOSITIVO CON SESSION_ID ---
async function registerOrUpdateDevice(userId, sessionId) {
    // Obtener fingerprint (async con FingerprintJS)
    const fingerprint = await getDeviceFingerprint();
    const deviceName = getDeviceName();

    const deviceData = {
        user_id: userId,
        device_fingerprint: fingerprint,
        device_name: deviceName,
        last_accessed_at: new Date().toISOString()
    };

    // Solo agregar session_id si esta disponible
    if (sessionId) {
        deviceData.session_id = sessionId;
    }

    const { data, error } = await supabase
        .from('authorized_devices')
        .upsert(deviceData, {
            onConflict: 'user_id,device_fingerprint'
        })
        .select()
        .single();

    if (error) {
        if (error.message.includes('Limite de dispositivos') || error.message.includes('Límite de dispositivos')) {
            throw new Error(error.message);
        }
        throw error;
    }

    return data;
}

// --- ELIMINACION DE DISPOSITIVO ---
async function removeDevice(userId) {
    const fingerprint = await getDeviceFingerprint();

    try {
        await supabase
            .from('authorized_devices')
            .delete()
            .match({
                user_id: userId,
                device_fingerprint: fingerprint
            });
        console.log('Dispositivo eliminado correctamente');
    } catch (error) {
        console.warn('Error eliminando dispositivo:', error);
    }
}

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
            // Eventos que requieren registrar/actualizar dispositivo
            case 'SIGNED_IN':
            case 'TOKEN_REFRESHED':
            case 'INITIAL_SESSION':
                if (session) {
                    try {
                        const sessionId = extractSessionIdFromToken(session.access_token);
                        await registerOrUpdateDevice(session.user.id, sessionId);
                        console.log(`Dispositivo registrado/actualizado (${event}) con session_id:`, sessionId);

                        // Guardar datos básicos en localStorage para compatibilidad
                        localStorage.setItem('isLoggedIn', 'true');
                    } catch (error) {
                        // Si es error de límite de dispositivos, cerrar sesión
                        if (error.message.includes('Limite de dispositivos') || error.message.includes('Límite de dispositivos')) {
                            console.error('Límite de dispositivos alcanzado');
                            await supabase.auth.signOut();
                            localStorage.removeItem('isLoggedIn');
                            localStorage.removeItem('userName');
                            localStorage.removeItem('usuarioActual');
                            localStorage.removeItem('userRole');
                            alert(error.message);
                            window.location.href = 'login.html';
                        } else {
                            console.warn('Error registrando dispositivo:', error);
                        }
                    }
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

// Exportar funciones y cliente de Supabase
export {
    supabase,
    getDeviceFingerprint,
    getDeviceName,
    extractSessionIdFromToken,
    registerOrUpdateDevice,
    removeDevice,
    initAuthListener
};
