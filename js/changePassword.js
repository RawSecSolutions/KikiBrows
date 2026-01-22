/**
 * js/changePassword.js
 * Módulo seguro para cambio de contraseña
 * Implementa prácticas de seguridad estándar de OWASP
 */

// --- CONFIGURACIÓN DE SEGURIDAD ---
const PASSWORD_CONFIG = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    // Rate limiting: máximo de intentos
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutos en milisegundos
};

// Lista de contraseñas comunes a evitar (top 20 más comunes)
const COMMON_PASSWORDS = [
    'password', '12345678', '123456789', 'qwerty', 'abc123',
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
    'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
    'bailey', 'passw0rd', 'shadow', '123123', '654321'
];

// --- GESTIÓN DE INTENTOS FALLIDOS (Rate Limiting) ---
let changePasswordAttempts = {
    count: 0,
    lastAttempt: null,
    lockedUntil: null
};

/**
 * Verifica si el usuario está bloqueado por demasiados intentos
 */
function isUserLocked() {
    if (changePasswordAttempts.lockedUntil) {
        const now = Date.now();
        if (now < changePasswordAttempts.lockedUntil) {
            const minutesLeft = Math.ceil((changePasswordAttempts.lockedUntil - now) / 60000);
            return {
                locked: true,
                minutesLeft: minutesLeft
            };
        } else {
            // Desbloquear usuario
            changePasswordAttempts.count = 0;
            changePasswordAttempts.lockedUntil = null;
        }
    }
    return { locked: false };
}

/**
 * Registra un intento fallido
 */
function registerFailedAttempt() {
    changePasswordAttempts.count++;
    changePasswordAttempts.lastAttempt = Date.now();

    if (changePasswordAttempts.count >= PASSWORD_CONFIG.maxAttempts) {
        changePasswordAttempts.lockedUntil = Date.now() + PASSWORD_CONFIG.lockoutDuration;
        return true; // Usuario bloqueado
    }
    return false;
}

/**
 * Resetea los intentos fallidos (en caso de éxito)
 */
function resetAttempts() {
    changePasswordAttempts = {
        count: 0,
        lastAttempt: null,
        lockedUntil: null
    };
}

// --- VALIDACIONES DE CONTRASEÑA ---

/**
 * Valida que la contraseña cumpla con los requisitos de seguridad
 * @param {string} password - Contraseña a validar
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validatePasswordStrength(password) {
    const errors = [];

    if (!password || typeof password !== 'string') {
        return { valid: false, errors: ['La contraseña es requerida'] };
    }

    // Longitud
    if (password.length < PASSWORD_CONFIG.minLength) {
        errors.push(`La contraseña debe tener al menos ${PASSWORD_CONFIG.minLength} caracteres`);
    }

    if (password.length > PASSWORD_CONFIG.maxLength) {
        errors.push(`La contraseña no debe exceder ${PASSWORD_CONFIG.maxLength} caracteres`);
    }

    // Mayúsculas
    if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Debe contener al menos una letra mayúscula');
    }

    // Minúsculas
    if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Debe contener al menos una letra minúscula');
    }

    // Números
    if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(password)) {
        errors.push('Debe contener al menos un número');
    }

    // Caracteres especiales
    if (PASSWORD_CONFIG.requireSpecialChars && !/[\W_]/.test(password)) {
        errors.push('Debe contener al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }

    // Contraseñas comunes
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
        errors.push('Esta contraseña es demasiado común. Por favor, elige una más segura');
    }

    // Secuencias simples
    if (/(.)\1{2,}/.test(password)) {
        errors.push('No uses secuencias repetitivas (ej: aaa, 111)');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Calcula la fortaleza de la contraseña (0-100)
 * @param {string} password - Contraseña a evaluar
 * @returns {Object} - { score: number, level: string, color: string }
 */
function calculatePasswordStrength(password) {
    if (!password) {
        return { score: 0, level: 'Ninguna', color: '#dc3545' };
    }

    let score = 0;

    // Longitud (max 30 puntos)
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Variedad de caracteres (max 40 puntos)
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[\W_]/.test(password)) score += 10;

    // Complejidad adicional (max 30 puntos)
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= 6) score += 10;
    if (uniqueChars >= 10) score += 10;
    if (!/(.)\1{2,}/.test(password)) score += 10; // Sin repeticiones

    // Determinar nivel y color
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
        color = '#28a745';
    } else {
        level = 'Muy fuerte';
        color = '#20c997';
    }

    return { score, level, color };
}

/**
 * Actualiza el indicador visual de fortaleza de contraseña
 * @param {string} password - Contraseña a evaluar
 * @param {string} elementId - ID del elemento contenedor del indicador
 */
function updatePasswordStrengthIndicator(password, elementId = 'password-strength') {
    const container = document.getElementById(elementId);
    if (!container) return;

    const strength = calculatePasswordStrength(password);

    // Actualizar barra de progreso
    const progressBar = container.querySelector('.progress-bar');
    const strengthText = container.querySelector('.strength-text');

    if (progressBar) {
        progressBar.style.width = `${strength.score}%`;
        progressBar.style.backgroundColor = strength.color;
        progressBar.setAttribute('aria-valuenow', strength.score);
    }

    if (strengthText) {
        strengthText.textContent = strength.level;
        strengthText.style.color = strength.color;
    }

    // Mostrar el indicador si hay texto
    if (password.length > 0) {
        container.classList.remove('d-none');
    } else {
        container.classList.add('d-none');
    }
}

// --- FUNCIONES DE CAMBIO DE CONTRASEÑA ---

/**
 * Verifica si la contraseña actual es correcta
 * @param {string} currentPassword - Contraseña actual ingresada
 * @returns {boolean}
 */
function verifyCurrentPassword(currentPassword) {
    // Obtener usuario registrado de localStorage
    const registeredUser = JSON.parse(localStorage.getItem('registeredUser') || '{}');

    // En un entorno de producción, esto debería ser una llamada al backend
    // que compare el hash de la contraseña
    if (!registeredUser.password) {
        console.error('No se encontró contraseña almacenada');
        return false;
    }

    // Comparación directa (en producción, debería comparar hashes)
    return currentPassword === registeredUser.password;
}

/**
 * Actualiza la contraseña del usuario
 * @param {string} newPassword - Nueva contraseña
 * @returns {boolean} - true si se actualizó correctamente
 */
function updatePassword(newPassword) {
    try {
        // Obtener usuario registrado
        const registeredUser = JSON.parse(localStorage.getItem('registeredUser') || '{}');

        if (!registeredUser.email) {
            throw new Error('No se encontró información del usuario');
        }

        // En producción, aquí deberías:
        // 1. Hacer un POST al backend con la nueva contraseña
        // 2. El backend debe hashear la contraseña (bcrypt/Argon2)
        // 3. Guardar el hash en la base de datos
        // 4. Invalidar todas las sesiones activas
        // 5. Enviar email de confirmación

        // Por ahora, actualizamos en localStorage (NO HACER EN PRODUCCIÓN)
        registeredUser.password = newPassword;
        localStorage.setItem('registeredUser', JSON.stringify(registeredUser));

        // Log del cambio (en producción, esto debería ir a un sistema de auditoría)
        console.log(`Contraseña actualizada para: ${registeredUser.email} a las ${new Date().toISOString()}`);

        return true;
    } catch (error) {
        console.error('Error al actualizar contraseña:', error);
        return false;
    }
}

/**
 * Maneja el proceso completo de cambio de contraseña
 * @param {Object} data - { currentPassword, newPassword, confirmPassword }
 * @returns {Object} - { success: boolean, message: string }
 */
function handlePasswordChange(data) {
    const { currentPassword, newPassword, confirmPassword } = data;

    // 1. Verificar si el usuario está bloqueado
    const lockStatus = isUserLocked();
    if (lockStatus.locked) {
        return {
            success: false,
            message: `Demasiados intentos fallidos. Inténtalo de nuevo en ${lockStatus.minutesLeft} minutos.`,
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

    // 3. Verificar contraseña actual
    if (!verifyCurrentPassword(currentPassword)) {
        const isLocked = registerFailedAttempt();
        const attemptsLeft = PASSWORD_CONFIG.maxAttempts - changePasswordAttempts.count;

        if (isLocked) {
            return {
                success: false,
                message: `Contraseña actual incorrecta. Has excedido el límite de intentos. Bloqueado por ${PASSWORD_CONFIG.lockoutDuration / 60000} minutos.`,
                locked: true
            };
        }

        return {
            success: false,
            message: `Contraseña actual incorrecta. Te quedan ${attemptsLeft} intentos.`
        };
    }

    // 4. Verificar que nueva contraseña no sea igual a la actual
    if (currentPassword === newPassword) {
        return {
            success: false,
            message: 'La nueva contraseña debe ser diferente a la actual'
        };
    }

    // 5. Validar fortaleza de nueva contraseña
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
        return {
            success: false,
            message: 'La nueva contraseña no cumple con los requisitos de seguridad',
            errors: validation.errors
        };
    }

    // 6. Verificar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
        return {
            success: false,
            message: 'Las contraseñas nuevas no coinciden'
        };
    }

    // 7. Actualizar contraseña
    const updated = updatePassword(newPassword);
    if (!updated) {
        return {
            success: false,
            message: 'Error al actualizar la contraseña. Inténtalo de nuevo.'
        };
    }

    // 8. Resetear intentos fallidos
    resetAttempts();

    // 9. Éxito
    return {
        success: true,
        message: 'Contraseña actualizada correctamente'
    };
}

/**
 * Cierra sesión y redirige al login
 */
function logoutAndRedirect() {
    // Limpiar datos de sesión
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
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Limpiar mensajes anteriores
            const errorContainer = document.getElementById('change-password-error');
            if (errorContainer) errorContainer.innerHTML = '';

            // Obtener valores
            const currentPassword = document.getElementById('current-password')?.value.trim();
            const newPassword = document.getElementById('new-password')?.value.trim();
            const confirmPassword = document.getElementById('confirm-password')?.value.trim();

            // Procesar cambio de contraseña
            const result = handlePasswordChange({
                currentPassword,
                newPassword,
                confirmPassword
            });

            if (result.success) {
                // Éxito
                showSuccessMessage(result.message);
                clearPasswordForm();

                // Cerrar sesión y redirigir
                logoutAndRedirect();
            } else {
                // Error
                showErrorMessage(result.message, result.errors);

                // Si está bloqueado, deshabilitar el formulario
                if (result.locked) {
                    form.querySelectorAll('input, button').forEach(el => {
                        el.disabled = true;
                    });
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
});
