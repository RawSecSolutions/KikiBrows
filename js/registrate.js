document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.querySelector('.user-registration-form');
    const seccionVerificacion = document.getElementById('seccion-verificacion');
    const tituloPrincipal = document.querySelector('h1');
    
    // Elementos de la verificación
    const btnValidar = document.getElementById('btn-validar-codigo');
    const inputCodigo = document.getElementById('codigo-verificacion');
    const msgErrorCodigo = document.getElementById('msg-error-codigo');

    // --- FUNCIONES DE AYUDA PARA ERRORES ---

    // Muestra error: Pinta borde rojo y pone texto abajo
    const mostrarError = (input, mensaje) => {
        const formGroup = input.closest('.form-group') || input.parentElement;
        
        // 1. Borde Rojo
        input.classList.add('is-invalid');
        
        // 2. Mensaje de texto (evita duplicados)
        let errorText = formGroup.querySelector('.invalid-feedback');
        if (!errorText) {
            errorText = document.createElement('div');
            errorText.className = 'invalid-feedback';
            errorText.style.display = 'block'; // Forzar display por si acaso
            formGroup.appendChild(errorText);
        }
        errorText.innerText = mensaje;
    };

    // Limpia errores: Quita borde rojo y esconde texto
    const limpiarErrores = () => {
        const inputs = registerForm.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.classList.remove('is-invalid');
            const formGroup = input.closest('.form-group') || input.parentElement;
            const errorText = formGroup.querySelector('.invalid-feedback');
            if (errorText) {
                errorText.remove(); // Eliminamos el mensaje para que no estorbe
            }
        });
        // Limpiar error de checkbox si hubiera
        const terminos = document.getElementById('terminos');
        if(terminos) terminos.classList.remove('is-invalid');
    };


    // --- 1. LÓGICA DEL FORMULARIO DE REGISTRO ---
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault(); 
            limpiarErrores(); // Resetear estado antes de validar

            // Captura de inputs
            const nombreInput = document.getElementById('nombre');
            const emailInput = document.getElementById('email');
            const passInput = document.getElementById('password');
            const confirmPassInput = document.getElementById('confirm-password');
            const terminosInput = document.getElementById('terminos');

            const nombre = nombreInput.value.trim();
            const email = emailInput.value.trim();
            const pass = passInput.value;
            const confirmPass = confirmPassInput.value;
            let hayErrores = false;

            // CASO 1: CAMPOS VACÍOS
            // Verificamos uno por uno para resaltar todos los que falten
            if (!nombre) {
                mostrarError(nombreInput, "Debe completar este campo");
                hayErrores = true;
            }
            if (!email) {
                mostrarError(emailInput, "Debe completar este campo");
                hayErrores = true;
            }
            if (!pass) {
                mostrarError(passInput, "Debe completar este campo");
                hayErrores = true;
            }
            if (!confirmPass) {
                mostrarError(confirmPassInput, "Debe completar este campo");
                hayErrores = true;
            }
            if (!terminosInput.checked) {
                // Alerta especial para checkbox o pintarlo
                terminosInput.classList.add('is-invalid');
                alert("Debes aceptar los términos y condiciones"); // UX simple para checkbox
                hayErrores = true;
            }

            if (hayErrores) return; // Si faltan campos, paramos aquí.

            // CASO 2: ESTRUCTURA GMAIL (Email Regex)
            // Regex estándar simple para email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                mostrarError(emailInput, "Ingrese una dirección de correo válida");
                return;
            }

            // CASO 3: REQUISITOS CONTRASEÑA
            // Regex: Al menos 1 mayúscula, 1 número, 1 símbolo especial
            const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;
            if (!passRegex.test(pass)) {
                mostrarError(passInput, "La contraseña debe tener sí o sí una mayúscula, 1 número y 1 símbolo");
                return;
            }

            // CASO 4: COINCIDENCIA DE CONTRASEÑAS
            if (pass !== confirmPass) {
                mostrarError(confirmPassInput, "Las contraseñas no coinciden");
                return;
            }

            // --- SI TODO ESTÁ OK ---
            console.log(`Simulando envío de código a: ${email}`);
            
            // Ocultamos registro y mostramos verificación
            registerForm.style.display = 'none';
            if(tituloPrincipal) tituloPrincipal.style.display = 'none';
            if(seccionVerificacion) seccionVerificacion.style.display = 'block';
            
            localStorage.setItem('tempUserName', nombre);
        });
    }

    // --- 2. LÓGICA DE VERIFICACIÓN (Igual que antes) ---
    if (btnValidar) {
        btnValidar.addEventListener('click', function() {
            const codigo = inputCodigo.value;
            
            if (codigo.length === 6) { // Validación simple de longitud
                localStorage.setItem('isLoggedIn', 'true');
                const nombreGuardado = localStorage.getItem('tempUserName') || 'Usuario';
                localStorage.setItem('userName', nombreGuardado);
                localStorage.removeItem('tempUserName');

                alert("¡Cuenta verificada con éxito! Bienvenido.");
                window.location.href = 'index.html';
            } else {
                if(msgErrorCodigo) msgErrorCodigo.style.display = 'block';
                inputCodigo.classList.add('is-invalid');
            }
        });

        // Limpiar error al escribir en el código
        if(inputCodigo) {
            inputCodigo.addEventListener('input', () => {
                if(msgErrorCodigo) msgErrorCodigo.style.display = 'none';
                inputCodigo.classList.remove('is-invalid');
            });
        }
    }
});