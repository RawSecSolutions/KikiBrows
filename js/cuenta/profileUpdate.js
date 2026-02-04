/**
 * js/profileUpdate.js
 * Modulo seguro para actualizacion de perfiles de usuario
 * Implementa validacion de RLS (Row Level Security) a nivel de aplicacion
 * Solo permite que los usuarios actualicen su propio perfil
 */

import { SUPABASE_URL, SUPABASE_KEY } from '../shared/config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Actualiza el perfil del usuario actual
 * Solo permite actualizar el perfil del usuario autenticado (RLS)
 *
 * @param {Object} profileData - Datos del perfil a actualizar
 * @param {string} profileData.first_name - Nombre del usuario
 * @param {string} profileData.last_name - Apellido del usuario
 * @param {string} [targetUserId] - ID del usuario a actualizar (para verificacion)
 * @returns {Promise<Object>} - { success: boolean, data?: Object, error?: Object }
 */
export async function updateProfile(profileData, targetUserId = null) {
    try {
        // 1. Obtener la sesion actual del usuario
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return {
                success: false,
                error: {
                    code: 401,
                    message: 'No hay sesion activa. Por favor, inicia sesion nuevamente.'
                }
            };
        }

        const currentUserId = session.user.id;

        // 2. VALIDACION RLS: Verificar que el usuario solo actualice su propio perfil
        // Si se proporciona un targetUserId, debe coincidir con el usuario actual
        if (targetUserId && targetUserId !== currentUserId) {
            console.error(`Intento de actualizacion no autorizado: Usuario ${currentUserId} intento actualizar perfil ${targetUserId}`);
            return {
                success: false,
                error: {
                    code: 403,
                    message: 'No tienes permiso para modificar este perfil.'
                }
            };
        }

        // 3. Validar los datos del perfil
        const validationResult = validateProfileData(profileData);
        if (!validationResult.valid) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: validationResult.message
                }
            };
        }

        // 4. Sanitizar los datos antes de actualizar
        const sanitizedData = {
            first_name: sanitizeInput(profileData.first_name),
            last_name: sanitizeInput(profileData.last_name),
            updated_at: new Date().toISOString()
        };

        // 5. Actualizar el perfil en Supabase
        // La consulta usa el ID del usuario autenticado (seguridad adicional)
        const { data, error } = await supabase
            .from('profiles')
            .update(sanitizedData)
            .eq('id', currentUserId)
            .select()
            .single();

        if (error) {
            console.error('Error al actualizar perfil:', error);

            // Manejar errores especificos de Supabase/RLS
            if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
                return {
                    success: false,
                    error: {
                        code: 404,
                        message: 'Perfil no encontrado.'
                    }
                };
            }

            if (error.code === '42501' || error.message.includes('permission denied')) {
                return {
                    success: false,
                    error: {
                        code: 403,
                        message: 'No tienes permiso para realizar esta accion.'
                    }
                };
            }

            return {
                success: false,
                error: {
                    code: 500,
                    message: 'Error al actualizar el perfil. Intenta de nuevo.'
                }
            };
        }

        // 6. Actualizar localStorage para consistencia de UI
        updateLocalStorage(data);

        return {
            success: true,
            data: data
        };

    } catch (err) {
        console.error('Error inesperado en updateProfile:', err);
        return {
            success: false,
            error: {
                code: 500,
                message: 'Ocurrio un error inesperado.'
            }
        };
    }
}

/**
 * Obtiene el perfil del usuario actual
 * Solo permite obtener el perfil del usuario autenticado
 *
 * @returns {Promise<Object>} - { success: boolean, data?: Object, error?: Object }
 */
export async function getCurrentProfile() {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return {
                success: false,
                error: {
                    code: 401,
                    message: 'No hay sesion activa.'
                }
            };
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error al obtener perfil:', error);
            return {
                success: false,
                error: {
                    code: error.code === 'PGRST116' ? 404 : 500,
                    message: 'Error al obtener el perfil.'
                }
            };
        }

        return {
            success: true,
            data: {
                ...data,
                email: session.user.email
            }
        };

    } catch (err) {
        console.error('Error inesperado en getCurrentProfile:', err);
        return {
            success: false,
            error: {
                code: 500,
                message: 'Ocurrio un error inesperado.'
            }
        };
    }
}

/**
 * Intenta obtener un perfil por ID (para verificar RLS)
 * Esta funcion debe fallar si el usuario intenta acceder a otro perfil
 *
 * @param {string} profileId - ID del perfil a obtener
 * @returns {Promise<Object>} - { success: boolean, data?: Object, error?: Object }
 */
export async function getProfileById(profileId) {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return {
                success: false,
                error: {
                    code: 401,
                    message: 'No hay sesion activa.'
                }
            };
        }

        // Verificar si es el mismo usuario
        if (profileId !== session.user.id) {
            return {
                success: false,
                error: {
                    code: 403,
                    message: 'No tienes permiso para ver este perfil.'
                }
            };
        }

        return await getCurrentProfile();

    } catch (err) {
        console.error('Error inesperado en getProfileById:', err);
        return {
            success: false,
            error: {
                code: 500,
                message: 'Ocurrio un error inesperado.'
            }
        };
    }
}

/**
 * Intenta actualizar un perfil por ID (para verificar RLS)
 * Esta funcion debe fallar con 403 si el usuario intenta actualizar otro perfil
 *
 * @param {string} profileId - ID del perfil a actualizar
 * @param {Object} profileData - Datos del perfil
 * @returns {Promise<Object>} - { success: boolean, data?: Object, error?: Object }
 */
export async function updateProfileById(profileId, profileData) {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return {
                success: false,
                error: {
                    code: 401,
                    message: 'No hay sesion activa.'
                }
            };
        }

        // VALIDACION RLS: Solo permitir actualizar el propio perfil
        if (profileId !== session.user.id) {
            console.error(`ALERTA DE SEGURIDAD: Usuario ${session.user.id} intento modificar perfil ${profileId}`);
            return {
                success: false,
                error: {
                    code: 403,
                    message: 'Forbidden - No tienes permiso para modificar este perfil.'
                }
            };
        }

        return await updateProfile(profileData, profileId);

    } catch (err) {
        console.error('Error inesperado en updateProfileById:', err);
        return {
            success: false,
            error: {
                code: 500,
                message: 'Ocurrio un error inesperado.'
            }
        };
    }
}

// --- FUNCIONES AUXILIARES ---

/**
 * Valida los datos del perfil
 */
function validateProfileData(data) {
    if (!data) {
        return { valid: false, message: 'No se proporcionaron datos.' };
    }

    if (!data.first_name || typeof data.first_name !== 'string') {
        return { valid: false, message: 'El nombre es requerido.' };
    }

    if (!data.last_name || typeof data.last_name !== 'string') {
        return { valid: false, message: 'El apellido es requerido.' };
    }

    // Validar longitud
    if (data.first_name.trim().length < 2 || data.first_name.trim().length > 50) {
        return { valid: false, message: 'El nombre debe tener entre 2 y 50 caracteres.' };
    }

    if (data.last_name.trim().length < 2 || data.last_name.trim().length > 50) {
        return { valid: false, message: 'El apellido debe tener entre 2 y 50 caracteres.' };
    }

    // Validar caracteres permitidos (letras, espacios, acentos, guiones)
    const nameRegex = /^[a-zA-ZÀ-ÿñÑ\s'-]+$/;

    if (!nameRegex.test(data.first_name)) {
        return { valid: false, message: 'El nombre contiene caracteres no permitidos.' };
    }

    if (!nameRegex.test(data.last_name)) {
        return { valid: false, message: 'El apellido contiene caracteres no permitidos.' };
    }

    return { valid: true };
}

/**
 * Sanitiza la entrada del usuario
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';

    return input
        .trim()
        // Eliminar caracteres de control
        .replace(/[\x00-\x1F\x7F]/g, '')
        // Eliminar multiples espacios
        .replace(/\s+/g, ' ')
        // Capitalizar primera letra de cada palabra
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Actualiza localStorage con los nuevos datos del perfil
 */
function updateLocalStorage(profileData) {
    try {
        // Actualizar usuarioActual
        const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
        usuarioActual.nombre = profileData.first_name;
        usuarioActual.apellido = profileData.last_name;
        localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));

        // Actualizar registeredUser
        const registeredUser = JSON.parse(localStorage.getItem('registeredUser') || '{}');
        registeredUser.nombre = profileData.first_name;
        registeredUser.apellido = profileData.last_name;
        localStorage.setItem('registeredUser', JSON.stringify(registeredUser));

        // Actualizar userName
        localStorage.setItem('userName', profileData.first_name);

    } catch (err) {
        console.error('Error al actualizar localStorage:', err);
    }
}

// Exportar funciones
export default {
    updateProfile,
    getCurrentProfile,
    getProfileById,
    updateProfileById
};
