/**
 * js/changePassword.js
 * Modulo seguro para cambio de contrasena
 * Implementa practicas de seguridad estandar de OWASP
 * Usa Supabase para autenticacion y actualizacion de contrasena
 */

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
    PASSWORD_CONFIG,
    validatePasswordStrength,
    calculatePasswordStrength,
    updatePasswordStrengthIndicator,
    createAttemptsManager
} from './utils/passwordValidator.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Gestor de intentos fallidos
const attemptsManager = createAttemptsManager('changePasswordAttempts');

// --- FUNCIONES DE CAMBIO DE CONTRASEÑA CON SUPABASE ---

/**
 * Verifica si la contraseña actual es correcta usando Supabase
 * @param {string} currentPassword - Contraseña actual ingresada
 * @returns {Promise<{valid: boolean, email: string|null, error: string|null}>}
 */
async function verifyCurrentPassword(currentPassword) {
    try {
        // Obtener sesión actual de Supabase
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return { valid: false, email: null, error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.' };
        }

        const email = session.user.email;

        // Verificar la contraseña actual re-autenticando con Supabase
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: currentPassword
        });

        if (signInError) {
            return { valid: false, email: email, error: 'Contraseña actual incorrecta' };
        }

        return { valid: true, email: email, error: null };
    } catch (error) {
        return { valid: false, email: null, error: 'Error al verificar la contrasena' };
    }
}

/**
 * Actualiza la contraseña del usuario usando Supabase
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function updatePassword(newPassword) {
    try {
        // Actualizar contraseña en Supabase Auth
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            if (updateError.message.includes('should be different')) {
                return { success: false, error: 'La nueva contrasena debe ser diferente a las anteriores.' };
            }
            return { success: false, error: 'Error al actualizar la contrasena: ' + updateError.message };
        }

        return { success: true, error: null };
    } catch (error) {
        return { success: false, error: 'Error inesperado al actualizar la contrasena' };
    }
}

/**
 * Maneja el proceso completo de cambio de contraseña
 * @param {Object} data - { currentPassword, newPassword, confirmPassword }
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
async function handlePasswordChange(data) {
    const { currentPassword, newPassword, confirmPassword } = data;

    // 1. Verificar si el usuario esta bloqueado
    const lockStatus = attemptsManager.isLocked();
    if (lockStatus.locked) {
        return {
            success: false,
            message: `Demasiados intentos fallidos. Intentalo de nuevo en ${lockStatus.minutesLeft} minutos.`,
            locked: true
        };
    }

    // 2. Validar que todos los campos estén completos
    if (!currentPassword || !newPassword || !confirmPassword) {
        return {
            success: false,
            message: 'Todos los campos son obligatorios'
        };
    }

    // 3. Verificar que nueva contraseña no sea igual a la actual
    if (currentPassword === newPassword) {
        return {
            success: false,
            message: 'La nueva contraseña debe ser diferente a la actual'
        };
    }

    // 4. Validar fortaleza de nueva contraseña
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
        return {
            success: false,
            message: 'La nueva contraseña no cumple con los requisitos de seguridad',
            errors: validation.errors
        };
    }

    // 5. Verificar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
        return {
            success: false,
            message: 'Las contraseñas nuevas no coinciden'
        };
    }

    // 6. Verificar contrasena actual con Supabase
    const verifyResult = await verifyCurrentPassword(currentPassword);
    if (!verifyResult.valid) {
        const isLocked = attemptsManager.registerFailed();
        const attemptsLeft = attemptsManager.getAttemptsLeft();

        if (isLocked) {
            return {
                success: false,
                message: `${verifyResult.error || 'Contrasena actual incorrecta'}. Has excedido el limite de intentos. Bloqueado por ${PASSWORD_CONFIG.lockoutDuration / 60000} minutos.`,
                locked: true
            };
        }

        return {
            success: false,
            message: `${verifyResult.error || 'Contrasena actual incorrecta'}. Te quedan ${attemptsLeft} intentos.`
        };
    }

    // 7. Actualizar contraseña en Supabase
    const updateResult = await updatePassword(newPassword);
    if (!updateResult.success) {
        return {
            success: false,
            message: updateResult.error || 'Error al actualizar la contraseña. Inténtalo de nuevo.'
        };
    }

    // 8. Resetear intentos fallidos
    attemptsManager.reset();

    // 9. Éxito
    return {
        success: true,
        message: 'Contraseña actualizada correctamente'
    };
}

/**
 * Cierra sesión de Supabase y redirige al login
 */
async function logoutAndRedirect() {
    try {
        // Cerrar sesion en Supabase
        await supabase.auth.signOut();
    } catch (error) {
        // Error silencioso, procedemos con el logout local
    }

    // Limpiar datos de sesión locales
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('usuarioActual');

    // Redirigir al login
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}

// --- FUNCIONES DE UI ---

/**
 * Muestra la vista de cambio de contraseña
 */
function openChangePasswordView(event) {
    if (event) event.preventDefault();

    // Ocultar otras vistas
    const dashboard = document.getElementById('dashboard-view');
    const simpleEdit = document.getElementById('simple-edit-view');
    const splitEdit = document.getElementById('split-edit-view');
    const changePasswordView = document.getElementById('change-password-view');

    if (dashboard) dashboard.classList.add('d-none');
    if (simpleEdit) simpleEdit.classList.add('d-none');
    if (splitEdit) splitEdit.classList.add('d-none');
    if (changePasswordView) changePasswordView.classList.remove('d-none');
}

/**
 * Muestra mensaje de error en el formulario
 */
function showErrorMessage(message, errors = []) {
    const errorContainer = document.getElementById('change-password-error');
    if (!errorContainer) return;

    let html = `<div class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>
        <strong>${message}</strong>`;

    if (errors.length > 0) {
        html += '<ul class="mb-0 mt-2">';
        errors.forEach(error => {
            html += `<li>${error}</li>`;
        });
        html += '</ul>';
    }

    html += `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;

    errorContainer.innerHTML = html;
}

/**
 * Muestra mensaje de éxito
 */
function showSuccessMessage(message) {
    const errorContainer = document.getElementById('change-password-error');
    if (!errorContainer) return;

    errorContainer.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fas fa-check-circle me-2"></i>
            <strong>${message}</strong>
            <p class="mb-0 mt-2">Redirigiendo al inicio de sesión...</p>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

/**
 * Limpia el formulario de cambio de contraseña
 */
function clearPasswordForm() {
    const form = document.getElementById('change-password-form');
    if (form) {
        form.reset();
        // Ocultar indicador de fortaleza
        const strengthIndicator = document.getElementById('password-strength');
        if (strengthIndicator) {
            strengthIndicator.classList.add('d-none');
        }
    }
}

// --- INICIALIZACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
    // Configurar eventos del formulario
    const form = document.getElementById('change-password-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Limpiar mensajes anteriores
            const errorContainer = document.getElementById('change-password-error');
            if (errorContainer) errorContainer.innerHTML = '';

            // Obtener valores
            const currentPassword = document.getElementById('current-password')?.value.trim();
            const newPassword = document.getElementById('new-password')?.value.trim();
            const confirmPassword = document.getElementById('confirm-password')?.value.trim();

            // Mostrar estado de carga
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn?.innerHTML || 'Cambiar Contraseña';
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Verificando...';
                submitBtn.disabled = true;
            }

            try {
                // Procesar cambio de contraseña (ahora es asíncrono)
                const result = await handlePasswordChange({
                    currentPassword,
                    newPassword,
                    confirmPassword
                });

                if (result.success) {
                    // Éxito
                    showSuccessMessage(result.message);
                    clearPasswordForm();

                    // Cerrar sesión y redirigir
                    await logoutAndRedirect();
                } else {
                    // Error
                    showErrorMessage(result.message, result.errors);

                    // Restaurar botón
                    if (submitBtn) {
                        submitBtn.innerHTML = originalBtnText;
                        submitBtn.disabled = false;
                    }

                    // Si está bloqueado, deshabilitar el formulario
                    if (result.locked) {
                        form.querySelectorAll('input, button').forEach(el => {
                            el.disabled = true;
                        });
                    }
                }
            } catch (error) {
                showErrorMessage('Ocurrio un error inesperado. Por favor, intenta de nuevo.');

                // Restaurar botón
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                }
            }
        });
    }

    // Configurar indicador de fortaleza en tiempo real
    const newPasswordInput = document.getElementById('new-password');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', (e) => {
            updatePasswordStrengthIndicator(e.target.value);
        });
    }

    // Toggle para mostrar/ocultar contraseñas
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = button.querySelector('i');

            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        });
    });

    // Exponer función para uso desde HTML onclick
    window.openChangePasswordView = openChangePasswordView;
});
