/**
 * js/utils/passwordValidator.js
 * Modulo centralizado para validacion de contrasenas
 * Consolida funciones duplicadas de changePassword.js, adminChangePassword.js y resetPassword.js
 */

// --- CONFIGURACION DE SEGURIDAD ---
export const PASSWORD_CONFIG = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutos
};

// Lista de contrasenas comunes a evitar
export const COMMON_PASSWORDS = [
    'password', '12345678', '123456789', 'qwerty', 'abc123',
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
    'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
    'bailey', 'passw0rd', 'shadow', '123123', '654321',
    'contrasena', 'kikibrows', 'password1', 'qwerty123', 'admin123'
];

/**
 * Valida que la contrasena cumpla con los requisitos de seguridad
 * @param {string} password - Contrasena a validar
 * @param {Object} config - Configuracion opcional (usa PASSWORD_CONFIG por defecto)
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validatePasswordStrength(password, config = PASSWORD_CONFIG) {
    const errors = [];

    if (!password || typeof password !== 'string') {
        return { valid: false, errors: ['La contrasena es requerida'] };
    }

    if (password.length < config.minLength) {
        errors.push(`Minimo ${config.minLength} caracteres`);
    }

    if (password.length > config.maxLength) {
        errors.push(`Maximo ${config.maxLength} caracteres`);
    }

    if (config.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Debe contener al menos una letra mayuscula');
    }

    if (config.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Debe contener al menos una letra minuscula');
    }

    if (config.requireNumbers && !/\d/.test(password)) {
        errors.push('Debe contener al menos un numero');
    }

    if (config.requireSpecialChars && !/[\W_]/.test(password)) {
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

/**
 * Calcula la fortaleza de la contrasena (0-100)
 * @param {string} password - Contrasena a evaluar
 * @returns {Object} - { score: number, level: string, color: string }
 */
export function calculatePasswordStrength(password) {
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
    if (!/(.)\1{2,}/.test(password)) score += 10;

    // Determinar nivel y color
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

/**
 * Actualiza el indicador visual de fortaleza de contrasena
 * @param {string} password - Contrasena a evaluar
 * @param {string|HTMLElement} container - ID o elemento del contenedor del indicador
 */
export function updatePasswordStrengthIndicator(password, container) {
    const containerEl = typeof container === 'string'
        ? document.getElementById(container)
        : container;

    if (!containerEl) return;

    const strength = calculatePasswordStrength(password);
    const progressBar = containerEl.querySelector('.progress-bar');
    const strengthText = containerEl.querySelector('.strength-text');

    if (progressBar) {
        progressBar.style.width = `${strength.score}%`;
        progressBar.style.backgroundColor = strength.color;
        progressBar.setAttribute('aria-valuenow', strength.score);
    }

    if (strengthText) {
        strengthText.textContent = strength.level;
        strengthText.style.color = strength.color;
    }

    if (password.length > 0) {
        containerEl.classList.remove('d-none');
    } else {
        containerEl.classList.add('d-none');
    }
}

/**
 * Actualiza los indicadores visuales de requisitos
 * @param {string} password - Contrasena a evaluar
 * @param {Object} requirementIds - Mapeo de IDs de requisitos
 */
export function updateRequirements(password, requirementIds = {}) {
    const defaultIds = {
        length: 'req-length',
        uppercase: 'req-uppercase',
        lowercase: 'req-lowercase',
        number: 'req-number',
        special: 'req-special'
    };

    const ids = { ...defaultIds, ...requirementIds };

    const requirements = {
        [ids.length]: password.length >= 8,
        [ids.uppercase]: /[A-Z]/.test(password),
        [ids.lowercase]: /[a-z]/.test(password),
        [ids.number]: /\d/.test(password),
        [ids.special]: /[\W_]/.test(password)
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

    return requirements;
}

/**
 * Verifica si las contrasenas coinciden y actualiza el feedback
 * @param {string} password - Contrasena nueva
 * @param {string} confirmPassword - Confirmacion de contrasena
 * @param {HTMLElement} feedbackEl - Elemento de feedback
 * @param {HTMLElement} confirmInput - Input de confirmacion
 * @returns {boolean} - true si coinciden
 */
export function validatePasswordMatch(password, confirmPassword, feedbackEl, confirmInput) {
    if (!confirmPassword || confirmPassword.length === 0) {
        if (feedbackEl) {
            feedbackEl.textContent = '';
            feedbackEl.classList.remove('match', 'no-match');
        }
        return false;
    }

    const match = password === confirmPassword;

    if (feedbackEl) {
        feedbackEl.textContent = match ? 'Las contrasenas coinciden' : 'Las contrasenas no coinciden';
        feedbackEl.classList.remove(match ? 'no-match' : 'match');
        feedbackEl.classList.add(match ? 'match' : 'no-match');
    }

    if (confirmInput) {
        confirmInput.classList.remove(match ? 'is-invalid' : 'is-valid');
        confirmInput.classList.add(match ? 'is-valid' : 'is-invalid');
    }

    return match;
}

// --- GESTION DE INTENTOS FALLIDOS ---

/**
 * Crea un gestor de intentos fallidos
 * @param {string} storageKey - Clave para sessionStorage
 * @returns {Object} - Objeto con metodos para gestionar intentos
 */
export function createAttemptsManager(storageKey = 'passwordAttempts') {
    let attempts = {
        count: 0,
        lastAttempt: null,
        lockedUntil: null
    };

    function load() {
        const stored = sessionStorage.getItem(storageKey);
        if (stored) {
            attempts = JSON.parse(stored);
        }
    }

    function save() {
        sessionStorage.setItem(storageKey, JSON.stringify(attempts));
    }

    function isLocked() {
        load();
        if (attempts.lockedUntil) {
            const now = Date.now();
            if (now < attempts.lockedUntil) {
                const minutesLeft = Math.ceil((attempts.lockedUntil - now) / 60000);
                return { locked: true, minutesLeft };
            } else {
                attempts.count = 0;
                attempts.lockedUntil = null;
                save();
            }
        }
        return { locked: false };
    }

    function registerFailed() {
        load();
        attempts.count++;
        attempts.lastAttempt = Date.now();

        if (attempts.count >= PASSWORD_CONFIG.maxAttempts) {
            attempts.lockedUntil = Date.now() + PASSWORD_CONFIG.lockoutDuration;
            save();
            return true;
        }
        save();
        return false;
    }

    function reset() {
        attempts = { count: 0, lastAttempt: null, lockedUntil: null };
        save();
    }

    function getAttemptsLeft() {
        load();
        return PASSWORD_CONFIG.maxAttempts - attempts.count;
    }

    return {
        isLocked,
        registerFailed,
        reset,
        getAttemptsLeft
    };
}
