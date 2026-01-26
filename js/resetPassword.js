/**
 * js/resetPassword.js
 * Maneja el flujo seguro de reseteo de contraseña desde enlace de email
 * Utiliza tokens de Supabase para validación segura
 */

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CONFIGURACIÓN DE SEGURIDAD ---
const PASSWORD_CONFIG = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
};

// Lista de contraseñas comunes a evitar
const COMMON_PASSWORDS = [
    'password', '12345678', '123456789', 'qwerty', 'abc123',
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
    'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
    'bailey', 'passw0rd', 'shadow', '123123', '654321',
    'contraseña', 'kikibrows', 'password1', 'qwerty123'
];

// --- ELEMENTOS DEL DOM ---
let loadingView, errorView, formContainer, successView;
let resetForm, newPasswordInput, confirmPasswordInput, submitBtn;
let passwordStrengthContainer, errorContainer, matchFeedback;

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    // Obtener referencias a elementos del DOM
    loadingView = document.getElementById('reset-loading');
    errorView = document.getElementById('reset-error');
    formContainer = document.getElementById('reset-form-container');
    successView = document.getElementById('reset-success');
    resetForm = document.getElementById('reset-password-form');
    newPasswordInput = document.getElementById('new-password');
    confirmPasswordInput = document.getElementById('confirm-password');
    submitBtn = document.getElementById('submit-btn');
    passwordStrengthContainer = document.getElementById('password-strength');
    errorContainer = document.getElementById('reset-password-error');
    matchFeedback = document.getElementById('password-match-feedback');

    // Verificar sesión de recuperación
    await verifyRecoverySession();

    // Configurar eventos
    setupEventListeners();
});

/**
 * Verifica si hay una sesión de recuperación válida
 * Supabase maneja automáticamente el token del hash de la URL
 */
async function verifyRecoverySession() {
    try {
        // Supabase v2 maneja automáticamente los tokens del hash
        // cuando se detecta un tipo de evento 'PASSWORD_RECOVERY'
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error al obtener sesión:', error);
            showErrorView('Error al verificar el enlace. Por favor, solicita uno nuevo.');
            return;
        }

        // Escuchar cambios de autenticación para detectar el evento de recuperación
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // Usuario llegó desde un enlace de recuperación válido
                showFormView();
            } else if (event === 'SIGNED_IN' && session) {
                // También puede llegar como SIGNED_IN con una sesión activa
                // Verificar si es una sesión de recuperación
                showFormView();
            }
        });

        // Si ya hay una sesión activa (puede ser de recuperación)
        if (session) {
            // Verificar si el hash contiene tokens de recuperación
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const type = hashParams.get('type');

            if (type === 'recovery' || accessToken) {
                showFormView();
                // Limpiar el hash de la URL por seguridad (sin recargar)
                history.replaceState(null, '', window.location.pathname);
                return;
            }

            // Si hay sesión pero no es de recuperación, mostrar el formulario
            // (el usuario puede haber recargado la página)
            showFormView();
        } else {
            // No hay sesión, verificar si hay tokens en la URL
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const type = hashParams.get('type');

            if (accessToken && type === 'recovery') {
                // Intentar establecer la sesión manualmente
                const { data, error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken || ''
                });

                if (sessionError) {
                    console.error('Error al establecer sesión:', sessionError);
                    showErrorView('El enlace de recuperación ha expirado o no es válido.');
                    return;
                }

                showFormView();
                // Limpiar el hash de la URL por seguridad
                history.replaceState(null, '', window.location.pathname);
            } else if (accessToken) {
                // Tiene token pero no es de tipo recovery, intentar de todos modos
                const { data, error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken || ''
                });

                if (sessionError) {
                    showErrorView('El enlace de recuperación ha expirado o no es válido.');
                    return;
                }

                showFormView();
                history.replaceState(null, '', window.location.pathname);
            } else {
                // No hay tokens ni sesión
                showErrorView('No se encontró un enlace de recuperación válido.');
            }
        }
    } catch (err) {
        console.error('Error en verificación:', err);
        showErrorView('Ocurrió un error al procesar tu solicitud.');
    }
}

/**
 * Configura los event listeners del formulario
 */
function setupEventListeners() {
    // Validación en tiempo real de nueva contraseña
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', () => {
            const password = newPasswordInput.value;
            updatePasswordStrengthIndicator(password);
            updateRequirements(password);
            validatePasswordMatch();
            clearFieldError(newPasswordInput);
        });
    }

    // Validación de confirmación de contraseña
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            validatePasswordMatch();
            clearFieldError(confirmPasswordInput);
        });
    }

    // Envío del formulario
    if (resetForm) {
        resetForm.addEventListener('submit', handleFormSubmit);
    }

    // Toggle de mostrar/ocultar contraseña
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
}

/**
 * Maneja el envío del formulario
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    // Limpiar errores previos
    if (errorContainer) errorContainer.innerHTML = '';

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validaciones
    if (!newPassword || !confirmPassword) {
        showFormError('Por favor, completa todos los campos.');
        return;
    }

    // Validar fortaleza de contraseña
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
        showFormError('La contraseña no cumple con los requisitos de seguridad:', validation.errors);
        return;
    }

    // Validar coincidencia
    if (newPassword !== confirmPassword) {
        showFormError('Las contraseñas no coinciden.');
        showFieldError(confirmPasswordInput, 'Las contraseñas no coinciden');
        return;
    }

    // Deshabilitar botón y mostrar carga
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    submitBtn.disabled = true;

    try {
        // Actualizar contraseña en Supabase
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            console.error('Error al actualizar contraseña:', error);

            // Manejar errores específicos
            if (error.message.includes('should be different')) {
                showFormError('La nueva contraseña debe ser diferente a la anterior.');
            } else if (error.message.includes('expired') || error.message.includes('invalid')) {
                showErrorView('El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.');
            } else {
                showFormError('Error al actualizar la contraseña: ' + error.message);
            }

            submitBtn.innerHTML = 'Guardar Contraseña';
            submitBtn.disabled = false;
            return;
        }

        // Éxito - cerrar sesión para que use la nueva contraseña
        await supabase.auth.signOut();

        // Mostrar vista de éxito
        showSuccessView();

    } catch (err) {
        console.error('Error:', err);
        showFormError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
        submitBtn.innerHTML = 'Guardar Contraseña';
        submitBtn.disabled = false;
    }
}

// --- FUNCIONES DE VALIDACIÓN ---

/**
 * Valida la fortaleza de la contraseña
 */
function validatePasswordStrength(password) {
    const errors = [];

    if (!password || typeof password !== 'string') {
        return { valid: false, errors: ['La contraseña es requerida'] };
    }

    if (password.length < PASSWORD_CONFIG.minLength) {
        errors.push(`Mínimo ${PASSWORD_CONFIG.minLength} caracteres`);
    }

    if (password.length > PASSWORD_CONFIG.maxLength) {
        errors.push(`Máximo ${PASSWORD_CONFIG.maxLength} caracteres`);
    }

    if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Debe contener al menos una letra mayúscula');
    }

    if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Debe contener al menos una letra minúscula');
    }

    if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(password)) {
        errors.push('Debe contener al menos un número');
    }

    if (PASSWORD_CONFIG.requireSpecialChars && !/[\W_]/.test(password)) {
        errors.push('Debe contener al menos un carácter especial');
    }

    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
        errors.push('Esta contraseña es demasiado común');
    }

    if (/(.)\1{2,}/.test(password)) {
        errors.push('No uses secuencias repetitivas');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Calcula y muestra la fortaleza de la contraseña
 */
function calculatePasswordStrength(password) {
    if (!password) {
        return { score: 0, level: 'Ninguna', color: '#dc3545' };
    }

    let score = 0;

    // Longitud
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Variedad de caracteres
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[\W_]/.test(password)) score += 10;

    // Complejidad adicional
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= 6) score += 10;
    if (uniqueChars >= 10) score += 10;
    if (!/(.)\1{2,}/.test(password)) score += 10;

    let level, color;
    if (score < 30) {
        level = 'Muy débil';
        color = '#dc3545';
    } else if (score < 50) {
        level = 'Débil';
        color = '#fd7e14';
    } else if (score < 70) {
        level = 'Media';
        color = '#ffc107';
    } else if (score < 90) {
        level = 'Fuerte';
        color = '#8A835A'; // Color primario
    } else {
        level = 'Muy fuerte';
        color = '#6B664A'; // Color acento
    }

    return { score, level, color };
}

/**
 * Actualiza el indicador visual de fortaleza
 */
function updatePasswordStrengthIndicator(password) {
    if (!passwordStrengthContainer) return;

    const strength = calculatePasswordStrength(password);
    const progressBar = passwordStrengthContainer.querySelector('.progress-bar');
    const strengthText = passwordStrengthContainer.querySelector('.strength-text');

    if (progressBar) {
        progressBar.style.width = `${strength.score}%`;
        progressBar.style.backgroundColor = strength.color;
    }

    if (strengthText) {
        strengthText.textContent = strength.level;
        strengthText.style.color = strength.color;
    }

    if (password.length > 0) {
        passwordStrengthContainer.classList.remove('d-none');
    } else {
        passwordStrengthContainer.classList.add('d-none');
    }
}

/**
 * Actualiza los indicadores de requisitos
 */
function updateRequirements(password) {
    const requirements = {
        'req-length': password.length >= 8,
        'req-uppercase': /[A-Z]/.test(password),
        'req-lowercase': /[a-z]/.test(password),
        'req-number': /\d/.test(password),
        'req-special': /[\W_]/.test(password)
    };

    Object.entries(requirements).forEach(([id, isValid]) => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('valid', 'invalid');
            if (password.length > 0) {
                element.classList.add(isValid ? 'valid' : 'invalid');
            }
        }
    });
}

/**
 * Valida que las contraseñas coincidan
 */
function validatePasswordMatch() {
    if (!matchFeedback || !newPasswordInput || !confirmPasswordInput) return;

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (confirmPassword.length === 0) {
        matchFeedback.textContent = '';
        matchFeedback.classList.remove('match', 'no-match');
        return;
    }

    if (newPassword === confirmPassword) {
        matchFeedback.textContent = 'Las contraseñas coinciden';
        matchFeedback.classList.remove('no-match');
        matchFeedback.classList.add('match');
        confirmPasswordInput.classList.remove('is-invalid');
        confirmPasswordInput.classList.add('is-valid');
    } else {
        matchFeedback.textContent = 'Las contraseñas no coinciden';
        matchFeedback.classList.remove('match');
        matchFeedback.classList.add('no-match');
        confirmPasswordInput.classList.remove('is-valid');
        confirmPasswordInput.classList.add('is-invalid');
    }
}

// --- FUNCIONES DE UI ---

function showLoadingView() {
    if (loadingView) loadingView.style.display = 'block';
    if (errorView) errorView.style.display = 'none';
    if (formContainer) formContainer.style.display = 'none';
    if (successView) successView.style.display = 'none';
}

function showErrorView(message) {
    if (loadingView) loadingView.style.display = 'none';
    if (errorView) {
        errorView.style.display = 'block';
        const errorMsg = document.getElementById('error-message');
        if (errorMsg && message) {
            errorMsg.textContent = message;
        }
    }
    if (formContainer) formContainer.style.display = 'none';
    if (successView) successView.style.display = 'none';
}

function showFormView() {
    if (loadingView) loadingView.style.display = 'none';
    if (errorView) errorView.style.display = 'none';
    if (formContainer) formContainer.style.display = 'block';
    if (successView) successView.style.display = 'none';
}

function showSuccessView() {
    if (loadingView) loadingView.style.display = 'none';
    if (errorView) errorView.style.display = 'none';
    if (formContainer) formContainer.style.display = 'none';
    if (successView) successView.style.display = 'block';
}

function showFormError(message, errors = []) {
    if (!errorContainer) return;

    let html = `<div class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>
        <strong>${message}</strong>`;

    if (errors.length > 0) {
        html += '<ul class="mb-0 mt-2" style="padding-left: 1.2rem;">';
        errors.forEach(error => {
            html += `<li>${error}</li>`;
        });
        html += '</ul>';
    }

    html += `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button></div>`;

    errorContainer.innerHTML = html;
}

function showFieldError(input, message) {
    if (!input) return;

    const formGroup = input.closest('.form-group') || input.parentElement;
    input.classList.add('is-invalid');

    let errorText = formGroup.querySelector('.invalid-feedback');
    if (!errorText) {
        errorText = document.createElement('div');
        errorText.className = 'invalid-feedback';
        formGroup.appendChild(errorText);
    }
    errorText.textContent = message;
}

function clearFieldError(input) {
    if (!input) return;

    input.classList.remove('is-invalid');
    const formGroup = input.closest('.form-group') || input.parentElement;
    const errorText = formGroup.querySelector('.invalid-feedback');
    if (errorText) errorText.remove();
}
