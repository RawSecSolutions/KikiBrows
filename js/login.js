document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.user-registration-form');
    const mostrarPassCheckbox = document.getElementById('mostrar-password');
    const passwordInput = document.getElementById('password');
    const loginErrorMsg = document.getElementById('login-error-msg');

    // 1. FUNCIONALIDAD MOSTRAR/OCULTAR CONTRASEÑA
    if (mostrarPassCheckbox && passwordInput) {
        mostrarPassCheckbox.addEventListener('change', () => {
            // Si está marcado -> text, si no -> password
            passwordInput.type = mostrarPassCheckbox.checked ? 'text' : 'password';
        });
    }

    // --- FUNCIONES VISUALES ---
    const mostrarErrorCampo = (input) => {
        input.classList.add('is-invalid'); // Solo borde rojo, sin texto específico abajo
    };

    const limpiarErrores = () => {
        // Quitamos bordes rojos
        const inputs = loginForm.querySelectorAll('.form-control');
        inputs.forEach(input => input.classList.remove('is-invalid'));
        
        // Ocultamos la alerta de error genérico
        if (loginErrorMsg) loginErrorMsg.style.display = 'none';
    };

    // 2. MANEJO DEL LOGIN
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            limpiarErrores();

            const emailInput = document.getElementById('email');
            const passInput = document.getElementById('password');
            
            const email = emailInput.value.trim();
            const pass = passInput.value;
            let camposVacios = false;

            // VALIDACIÓN 1: Campos Vacíos (Solo feedback visual en el campo)
            if (!email) {
                mostrarErrorCampo(emailInput);
                camposVacios = true;
            }
            if (!pass) {
                mostrarErrorCampo(passInput);
                camposVacios = true;
            }

            // Si hay campos vacíos, no seguimos, pero NO mostramos mensaje "Credenciales inválidas" todavía
            // porque es obvio para el usuario que le falta escribir.
            if (camposVacios) return;

            // VALIDACIÓN 2: Formato de Email (Regex)
            // Si el formato está mal, AQUÍ SÍ mostramos "Credenciales inválidas" para no dar pistas
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (loginErrorMsg) loginErrorMsg.style.display = 'block';
                return;
            }

            // SIMULACIÓN DE LOGIN
            // Aquí iría: await supabase.auth.signInWithPassword(...)
            
            console.log("Intentando loguear con:", email);

            // Para efectos de prueba (MVP), simularemos éxito siempre que el formato sea válido.
            // Si quisieras simular fallo, descomenta esto:
            /*
            if (email === 'error@test.com') {
                if (loginErrorMsg) loginErrorMsg.style.display = 'block';
                return;
            }
            */

            // --- ÉXITO ---
            const btnSubmit = loginForm.querySelector('button[type="submit"]');
            const originalText = btnSubmit.innerText;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
            btnSubmit.disabled = true;

            // Guardamos sesión simulada
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName', email.split('@')[0]);

            setTimeout(() => {
                window.location.href = 'index.html'; 
            }, 1000);
        });
    }

    // Limpiar errores al escribir
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('is-invalid');
            if (loginErrorMsg) loginErrorMsg.style.display = 'none';
        });
    });
});