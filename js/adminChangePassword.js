/**
 * js/adminChangePassword.js
 * Modulo seguro para cambio de contrasena de administrador
 * Requiere verificacion de contrasena actual antes de permitir el cambio
 */

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CONFIGURACION DE SEGURIDAD ---
const PASSWORD_CONFIG = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutos
};

// Lista de contrasenas comunes a evitar
const COMMON_PASSWORDS = [
    'password', '12345678', '123456789', 'qwerty', 'abc123',
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
    'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
    'bailey', 'passw0rd', 'shadow', '123123', '654321',
    'contrasena', 'kikibrows', 'password1', 'qwerty123', 'admin123'
];

// --- GESTION DE INTENTOS FALLIDOS ---
let failedAttempts = {
    count: 0,
    lastAttempt: null,
    lockedUntil: null
};

// Cargar intentos desde sessionStorage
function loadAttempts() {
    const stored = sessionStorage.getItem('adminPasswordAttempts');
    if (stored) {
        failedAttempts = JSON.parse(stored);
    }
}

function saveAttempts() {
    sessionStorage.setItem('adminPasswordAttempts', JSON.stringify(failedAttempts));
}

function isLocked() {
    loadAttempts();
    if (failedAttempts.lockedUntil) {
        const now = Date.now();
        if (now < failedAttempts.lockedUntil) {
            const minutesLeft = Math.ceil((failedAttempts.lockedUntil - now) / 60000);
            return { locked: true, minutesLeft };
        } else {
            failedAttempts.count = 0;
            failedAttempts.lockedUntil = null;
            saveAttempts();
        }
    }
    return { locked: false };
}

function registerFailedAttempt() {
    loadAttempts();
    failedAttempts.count++;
    failedAttempts.lastAttempt = Date.now();

    if (failedAttempts.count >= PASSWORD_CONFIG.maxAttempts) {
        failedAttempts.lockedUntil = Date.now() + PASSWORD_CONFIG.lockoutDuration;
        saveAttempts();
        return true;
    }
    saveAttempts();
    return false;
}

function resetAttempts() {
    failedAttempts = { count: 0, lastAttempt: null, lockedUntil: null };
    saveAttempts();
}

// --- ELEMENTOS DEL DOM ---
let form, currentPasswordInput, newPasswordInput, confirmPasswordInput;
let submitBtn, passwordStrengthContainer, errorContainer, matchFeedback;

// --- INICIALIZACION ---
document.addEventListener('DOMContentLoaded', async () => {
    // Obtener referencias a elementos del DOM
    form = document.getElementById('admin-change-password-form');
    currentPasswordInput = document.getElementById('current-password');
    newPasswordInput = document.getElementById('new-password');
    confirmPasswordInput = document.getElementById('confirm-password');
    submitBtn = document.getElementById('submit-btn');
    passwordStrengthContainer = document.getElementById('password-strength');
    errorContainer = document.getElementById('admin-password-error');
    matchFeedback = document.getElementById('password-match-feedback');

    // Cargar datos del admin
    await loadAdminData();

    // Configurar eventos
    setupEventListeners();

    // Verificar si esta bloqueado
    const lockStatus = isLocked();
    if (lockStatus.locked) {
        disableForm(lockStatus.minutesLeft);
    }
});

/**
 * Carga los datos del administrador actual
 */
async function loadAdminData() {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            window.location.href = 'login.html';
            return;
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, role')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error al cargar perfil:', error);
            return;
        }

        // Verificar rol de admin
        if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
            alert('No tienes permisos para acceder a esta pagina.');
            window.location.href = 'index.html';
            return;
        }

        // Actualizar UI con datos del admin
        const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Administrador';
        const email = session.user.email || profile?.email || '';
        const roleLabel = profile?.role === 'superadmin' ? 'Super Admin' : 'Admin';

        // Header del perfil
        const nameDisplay = document.getElementById('admin-name-display');
        const emailDisplay = document.getElementById('admin-email-display');
        const roleDisplay = document.getElementById('admin-role-display');

        if (nameDisplay) nameDisplay.textContent = fullName;
        if (emailDisplay) emailDisplay.textContent = email;
        if (roleDisplay) roleDisplay.textContent = roleLabel;

        // Sidebar
        const sidebarName = document.getElementById('sidebar-user-name');
        const sidebarRole = document.getElementById('sidebar-role-label');

        if (sidebarName) sidebarName.textContent = profile?.first_name || 'Admin';
        if (sidebarRole) sidebarRole.textContent = roleLabel;

    } catch (err) {
        console.error('Error:', err);
    }
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Validacion en tiempo real de nueva contrasena
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', () => {
            const password = newPasswordInput.value;
            updatePasswordStrengthIndicator(password);
            updateRequirements(password);
            validatePasswordMatch();
            clearFieldError(newPasswordInput);
        });
    }

    // Validacion de confirmacion
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            validatePasswordMatch();
            clearFieldError(confirmPasswordInput);
            updateSubmitButtonState();
        });
    }

    // Limpiar error en campo actual
    if (currentPasswordInput) {
        currentPasswordInput.addEventListener('input', () => {
            clearFieldError(currentPasswordInput);
            updateSubmitButtonState();
        });
    }

    // Inicializar boton como deshabilitado
    if (submitBtn) {
        submitBtn.disabled = true;
    }

    // Envio del formulario
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Toggle de mostrar/ocultar contrasena
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
 * Maneja el envio del formulario
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    // Limpiar errores previos
    if (errorContainer) errorContainer.innerHTML = '';

    // Verificar bloqueo
    const lockStatus = isLocked();
    if (lockStatus.locked) {
        showFormError(`Demasiados intentos fallidos. Intenta de nuevo en ${lockStatus.minutesLeft} minutos.`);
        disableForm(lockStatus.minutesLeft);
        return;
    }

    const currentPassword = currentPasswordInput?.value;
    const newPassword = newPasswordInput?.value;
    const confirmPassword = confirmPasswordInput?.value;

    // Validaciones basicas
    if (!currentPassword || !newPassword || !confirmPassword) {
        showFormError('Por favor, completa todos los campos.');
        return;
    }

    // Validar fortaleza de contrasena
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
        showFormError('La contrasena no cumple con los requisitos de seguridad:', validation.errors);
        return;
    }

    // Validar coincidencia
    if (newPassword !== confirmPassword) {
        showFormError('Las contrasenas no coinciden.');
        showFieldError(confirmPasswordInput, 'Las contrasenas no coinciden');
        return;
    }

    // Validar que sea diferente a la actual
    if (currentPassword === newPassword) {
        showFormError('La nueva contrasena debe ser diferente a la actual.');
        return;
    }

    // Deshabilitar boton y mostrar carga
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    submitBtn.disabled = true;

    try {
        // 1. Obtener sesion actual
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            showFormError('Tu sesion ha expirado. Por favor, inicia sesion nuevamente.');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        // 2. Verificar contrasena actual reauthenticando
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: session.user.email,
            password: currentPassword
        });

        if (signInError) {
            // Contrasena incorrecta
            const isNowLocked = registerFailedAttempt();
            const attemptsLeft = PASSWORD_CONFIG.maxAttempts - failedAttempts.count;

            if (isNowLocked) {
                showFormError(`Contrasena actual incorrecta. Has excedido el limite de intentos. Bloqueado por ${PASSWORD_CONFIG.lockoutDuration / 60000} minutos.`);
                disableForm(PASSWORD_CONFIG.lockoutDuration / 60000);
            } else {
                showFormError(`Contrasena actual incorrecta. Te quedan ${attemptsLeft} intentos.`);
                showFieldError(currentPasswordInput, 'Contrasena incorrecta');
            }

            submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Cambiar Contrasena';
            submitBtn.disabled = false;
            return;
        }

        // 3. Contrasena correcta - actualizar a la nueva
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            console.error('Error al actualizar contrasena:', updateError);

            if (updateError.message.includes('should be different')) {
                showFormError('La nueva contrasena debe ser diferente a las anteriores.');
            } else {
                showFormError('Error al actualizar la contrasena: ' + updateError.message);
            }

            submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Cambiar Contrasena';
            submitBtn.disabled = false;
            return;
        }

        // 4. Exito - resetear intentos
        resetAttempts();

        // 5. Mostrar mensaje de exito
        showSuccessMessage();

        // 6. Cerrar sesion y redirigir
        setTimeout(async () => {
            await supabase.auth.signOut();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userName');
            localStorage.removeItem('usuarioActual');
            localStorage.removeItem('userRole');
            window.location.href = 'login.html';
        }, 3000);

    } catch (err) {
        console.error('Error:', err);
        showFormError('Ocurrio un error inesperado. Por favor, intenta de nuevo.');
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Cambiar Contrasena';
        submitBtn.disabled = false;
    }
}

// --- FUNCIONES DE VALIDACION ---

function validatePasswordStrength(password) {
    const errors = [];

    if (!password || typeof password !== 'string') {
        return { valid: false, errors: ['La contrasena es requerida'] };
    }

    if (password.length < PASSWORD_CONFIG.minLength) {
        errors.push(`Minimo ${PASSWORD_CONFIG.minLength} caracteres`);
    }

    if (password.length > PASSWORD_CONFIG.maxLength) {
        errors.push(`Maximo ${PASSWORD_CONFIG.maxLength} caracteres`);
    }

    if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Debe contener al menos una letra mayuscula');
    }

    if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Debe contener al menos una letra minuscula');
    }

    if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(password)) {
        errors.push('Debe contener al menos un numero');
    }

    if (PASSWORD_CONFIG.requireSpecialChars && !/[\W_]/.test(password)) {
        errors.push('Debe contener al menos un caracter especial');
    }

    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
        errors.push('Esta contrasena es demasiado comun');
    }

    if (/(.)\1{2,}/.test(password)) {
        errors.push('No uses secuencias repetitivas');
    }

    return { valid: errors.length === 0, errors };
}

function calculatePasswordStrength(password) {
    if (!password) {
        return { score: 0, level: 'Ninguna', color: '#dc3545' };
    }

    let score = 0;

    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[\W_]/.test(password)) score += 10;

    const uniqueChars = new Set(password).size;
    if (uniqueChars >= 6) score += 10;
    if (uniqueChars >= 10) score += 10;
    if (!/(.)\1{2,}/.test(password)) score += 10;

    let level, color;
    if (score < 30) {
        level = 'Muy debil';
        color = '#dc3545';
    } else if (score < 50) {
        level = 'Debil';
        color = '#fd7e14';
    } else if (score < 70) {
        level = 'Media';
        color = '#ffc107';
    } else if (score < 90) {
        level = 'Fuerte';
        color = '#8A835A';
    } else {
        level = 'Muy fuerte';
        color = '#6B664A';
    }

    return { score, level, color };
}

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

    // Verificar si todos los requisitos se cumplen para habilitar/deshabilitar el boton
    updateSubmitButtonState();
}

/**
 * Actualiza el estado del boton de submit segun los requisitos cumplidos
 */
function updateSubmitButtonState() {
    if (!submitBtn || !newPasswordInput || !confirmPasswordInput || !currentPasswordInput) return;

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Verificar todos los requisitos
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecialChar = /[\W_]/.test(newPassword);
    const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
    const hasCurrentPassword = currentPassword.length > 0;
    const isDifferent = currentPassword !== newPassword;

    // Todos los requisitos deben cumplirse para habilitar el boton
    const allRequirementsMet = hasMinLength && hasUppercase && hasLowercase &&
                               hasNumber && hasSpecialChar && passwordsMatch &&
                               hasCurrentPassword && isDifferent;

    submitBtn.disabled = !allRequirementsMet;
}

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
        matchFeedback.textContent = 'Las contrasenas coinciden';
        matchFeedback.classList.remove('no-match');
        matchFeedback.classList.add('match');
        confirmPasswordInput.classList.remove('is-invalid');
        confirmPasswordInput.classList.add('is-valid');
    } else {
        matchFeedback.textContent = 'Las contrasenas no coinciden';
        matchFeedback.classList.remove('match');
        matchFeedback.classList.add('no-match');
        confirmPasswordInput.classList.remove('is-valid');
        confirmPasswordInput.classList.add('is-invalid');
    }
}

// --- FUNCIONES DE UI ---

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

function showSuccessMessage() {
    if (!errorContainer) return;

    errorContainer.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fas fa-check-circle me-2"></i>
            <strong>Contrasena actualizada correctamente</strong>
            <p class="mb-0 mt-2">Tu sesion se cerrara automaticamente y seras redirigido al inicio de sesion...</p>
        </div>
    `;

    // Deshabilitar formulario
    if (form) {
        form.querySelectorAll('input, button').forEach(el => {
            el.disabled = true;
        });
    }
}

function showFieldError(input, message) {
    if (!input) return;

    const wrapper = input.closest('.password-input-wrapper') || input.parentElement;
    input.classList.add('is-invalid');

    let errorText = wrapper.parentElement.querySelector('.invalid-feedback');
    if (!errorText) {
        errorText = document.createElement('div');
        errorText.className = 'invalid-feedback d-block';
        wrapper.parentElement.appendChild(errorText);
    }
    errorText.textContent = message;
}

function clearFieldError(input) {
    if (!input) return;

    input.classList.remove('is-invalid');
    const wrapper = input.closest('.password-input-wrapper') || input.parentElement;
    const errorText = wrapper.parentElement.querySelector('.invalid-feedback');
    if (errorText) errorText.remove();
}

function disableForm(minutesLeft) {
    if (!form) return;

    form.querySelectorAll('input, button').forEach(el => {
        el.disabled = true;
    });

    showFormError(`Demasiados intentos fallidos. El formulario esta bloqueado por ${minutesLeft} minutos.`);

    // Programar desbloqueo
    setTimeout(() => {
        form.querySelectorAll('input, button').forEach(el => {
            el.disabled = false;
        });
        if (errorContainer) errorContainer.innerHTML = '';
    }, minutesLeft * 60 * 1000);
}
