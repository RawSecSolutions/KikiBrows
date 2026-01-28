// js/sessionManager.js
// Gestor centralizado de sesiones y dispositivos
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- FUNCIONES DE DISPOSITIVOS ---
function generateDeviceFingerprint() {
    const nav = window.navigator;
    const screen = window.screen;

    const fingerprint = [
        nav.userAgent,
        nav.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset()
    ].join('|');

    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return 'device_' + Math.abs(hash).toString(16);
}

function getDeviceName() {
    const ua = navigator.userAgent;
    let browser = 'Navegador';
    let os = 'desconocido';

    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

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

// --- LIMPIEZA DE DISPOSITIVOS HUERFANOS ---
async function cleanupOrphanedDevices(userId) {
    try {
        const { data, error } = await supabase.rpc('cleanup_orphaned_devices', {
            p_user_id: userId
        });

        if (error) {
            console.warn('Error limpiando dispositivos huerfanos:', error);
        } else if (data > 0) {
            console.log(`Se limpiaron ${data} dispositivo(s) sin sesion activa`);
        }
    } catch (err) {
        console.warn('Error en cleanup:', err);
    }
}

// --- REGISTRO/ACTUALIZACION DE DISPOSITIVO CON SESSION_ID ---
async function registerOrUpdateDevice(userId, sessionId) {
    // Primero intentar limpiar dispositivos huerfanos
    await cleanupOrphanedDevices(userId);

    const fingerprint = generateDeviceFingerprint();
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
    const fingerprint = generateDeviceFingerprint();

    try {
        await supabase
            .from('authorized_devices')
            .delete()
            .match({
                user_id: userId,
                device_fingerprint: fingerprint
            });
    } catch (error) {
        console.warn('Error eliminando dispositivo:', error);
    }
}

// --- LISTENER GLOBAL DE AUTENTICACION ---
let isListenerInitialized = false;
let lastProcessedEvent = null;

function initAuthListener() {
    if (isListenerInitialized) return;
    isListenerInitialized = true;

    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event);

        // Evitar procesar el mismo evento multiples veces
        const eventKey = `${event}-${session?.access_token?.slice(-10) || 'none'}`;
        if (lastProcessedEvent === eventKey) return;
        lastProcessedEvent = eventKey;

        switch (event) {
            case 'SIGNED_IN':
            case 'TOKEN_REFRESHED':
            case 'INITIAL_SESSION':
                if (session) {
                    try {
                        const sessionId = extractSessionIdFromToken(session.access_token);
                        await registerOrUpdateDevice(session.user.id, sessionId);
                        console.log(`Dispositivo registrado/actualizado (${event}) con session_id:`, sessionId);
                    } catch (error) {
                        // Si es error de limite de dispositivos, cerrar sesion
                        if (error.message.includes('Limite de dispositivos') || error.message.includes('Límite de dispositivos')) {
                            console.error('Limite de dispositivos alcanzado');
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

            case 'SIGNED_OUT':
                // La eliminacion del dispositivo ya se maneja en el logout manual
                console.log('Sesion cerrada');
                break;

            case 'PASSWORD_RECOVERY':
                // Manejado en resetPassword.js
                console.log('Evento de recuperacion de contrasena');
                break;
        }
    });
}

// Exportar funciones y cliente de Supabase
export {
    supabase,
    generateDeviceFingerprint,
    getDeviceName,
    extractSessionIdFromToken,
    registerOrUpdateDevice,
    removeDevice,
    cleanupOrphanedDevices,
    initAuthListener
};
