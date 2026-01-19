document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.user-registration-form');
    const mostrarPassCheckbox = document.getElementById('mostrar-password');
    const passwordInput = document.getElementById('password');
    const loginErrorMsg = document.getElementById('login-error-msg');

    // 1. MOSTRAR/OCULTAR CONTRASEÑA
    if (mostrarPassCheckbox && passwordInput) {
        mostrarPassCheckbox.addEventListener('change', () => {
            passwordInput.type = mostrarPassCheckbox.checked ? 'text' : 'password';
        });
    }

    // --- FUNCIONES VISUALES ---
    const mostrarErrorCampo = (input) => {
        input.classList.add('is-invalid');
    };

    const limpiarErrores = () => {
        const inputs = loginForm.querySelectorAll('.form-control');
        inputs.forEach(input => input.classList.remove('is-invalid'));
        if (loginErrorMsg) loginErrorMsg.style.display = 'none';
    };

    // 2. MANEJO DEL LOGIN
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            limpiarErrores();

            const emailInput = document.getElementById('email');
            const passInput = document.getElementById('password');
            
            const email = emailInput.value.trim().toLowerCase(); // Normalizamos a minúsculas
            const pass = passInput.value;
            let camposVacios = false;

            // VALIDACIÓN 1: Campos Vacíos
            if (!email) {
                mostrarErrorCampo(emailInput);
                camposVacios = true;
            }
            if (!pass) {
                mostrarErrorCampo(passInput);
                camposVacios = true;
            }

            if (camposVacios) return;

            // VALIDACIÓN 2: Formato Email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (loginErrorMsg) loginErrorMsg.style.display = 'block';
                return;
            }

            // SIMULACIÓN Y LÓGICA DE ROLES (HISTORIA 3)
            // ----------------------------------------------------------------
            console.log("Procesando login para:", email);
            
            // Simulación visual de carga
            const btnSubmit = loginForm.querySelector('button[type="submit"]');
            const textoOriginal = btnSubmit.innerText;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            btnSubmit.disabled = true;

            setTimeout(() => {
                // A. Guardamos sesión
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userName', email.split('@')[0]);

                // B. DETECCIÓN DE ROL (Simulada)
                // Si el email incluye 'admin', lo tratamos como Admin.
                let destino = '';
                
                if (email.includes('admin')) {
                    console.log("Rol detectado: ADMIN");
                    localStorage.setItem('userRole', 'admin'); // Guardamos rol para usarlo después
                    destino = 'adminPanel.html'; // Según tu lista de archivos
                } else {
                    console.log("Rol detectado: ALUMNO");
                    localStorage.setItem('userRole', 'student');
                    destino = 'index.html'; // El cambio que pediste
                }

                // C. Redirección
                window.location.href = destino;

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