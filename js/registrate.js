// js/registrate.js
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.querySelector('.user-registration-form');
    const seccionVerificacion = document.getElementById('seccion-verificacion');
    const tituloPrincipal = document.querySelector('h1');

    // Elementos de la verificación
    const btnValidar = document.getElementById('btn-validar-codigo');
    const inputCodigo = document.getElementById('codigo-verificacion');
    const msgErrorCodigo = document.getElementById('msg-error-codigo');

    // --- FUNCIONES DE AYUDA PARA ERRORES ---
    const mostrarError = (input, mensaje) => {
        const formGroup = input.closest('.form-group') || input.parentElement;
        input.classList.add('is-invalid');

        let errorText = formGroup.querySelector('.invalid-feedback');
        if (!errorText) {
            errorText = document.createElement('div');
            errorText.className = 'invalid-feedback';
            errorText.style.display = 'block';
            formGroup.appendChild(errorText);
        }
        errorText.innerText = mensaje;
    };

    const limpiarErrores = () => {
        const inputs = registerForm.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.classList.remove('is-invalid');
            const formGroup = input.closest('.form-group') || input.parentElement;
            const errorText = formGroup.querySelector('.invalid-feedback');
            if (errorText) errorText.remove();
        });
        const terminos = document.getElementById('terminos');
        if (terminos) terminos.classList.remove('is-invalid');
    };

    // --- 1. LÓGICA DEL FORMULARIO DE REGISTRO ---
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            limpiarErrores();

            const nombreInput = document.getElementById('nombre');
            const apellidoInput = document.getElementById('apellido');
            const emailInput = document.getElementById('email');
            const passInput = document.getElementById('password');
            const confirmPassInput = document.getElementById('confirm-password');
            const terminosInput = document.getElementById('terminos');

            const nombre = nombreInput.value.trim();
            const apellido = apellidoInput.value.trim();
            const email = emailInput.value.trim().toLowerCase();
            const pass = passInput.value;
            const confirmPass = confirmPassInput.value;
            let hayErrores = false;

            // CASO 1: CAMPOS VACÍOS
            if (!nombre) {
                mostrarError(nombreInput, "Debe completar este campo");
                hayErrores = true;
            }
            if (!apellido) {
                mostrarError(apellidoInput, "Debe completar este campo");
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
                terminosInput.classList.add('is-invalid');
                alert("Debes aceptar los términos y condiciones");
                hayErrores = true;
            }

            if (hayErrores) return;

            // CASO 2: FORMATO EMAIL
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                mostrarError(emailInput, "Ingrese una dirección de correo válida");
                return;
            }

            // CASO 3: REQUISITOS CONTRASEÑA
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

            // UI: Estado de carga
            const btnSubmit = registerForm.querySelector('button[type="submit"]');
            const textoOriginal = btnSubmit.innerText;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
            btnSubmit.disabled = true;

            try {
                // REGISTRO CON SUPABASE
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password: pass,
                    options: {
                        data: {
                            first_name: nombre,
                            last_name: apellido
                        }
                    }
                });

                if (error) throw error;

                // Guardar datos temporales
                localStorage.setItem('tempUserEmail', email);

                // Mostrar sección de verificación
                registerForm.style.display = 'none';
                if (tituloPrincipal) tituloPrincipal.style.display = 'none';
                if (seccionVerificacion) seccionVerificacion.style.display = 'block';

            } catch (error) {
                console.error('Error de registro:', error);

                let mensaje = 'Error al registrar';
                if (error.message.includes('already registered')) {
                    mensaje = 'Este correo ya está registrado';
                }

                alert(mensaje);
                btnSubmit.innerHTML = textoOriginal;
                btnSubmit.disabled = false;
            }
        });
    }

    // --- 2. LÓGICA DE VERIFICACIÓN ---
    // Nota: Supabase envía un email de confirmación automáticamente.
    // El código de 6 dígitos es manejado por el link del email.
    // Esta sección es para feedback visual mientras el usuario verifica.
    if (btnValidar) {
        btnValidar.addEventListener('click', function() {
            const codigo = inputCodigo.value;

            if (codigo.length === 6) {
                // En producción, Supabase valida via email link.
                // Aquí solo mostramos feedback y redirigimos al login.
                alert("Por favor revisa tu correo y haz clic en el enlace de confirmación para activar tu cuenta.");
                window.location.href = 'login.html';
            } else {
                if (msgErrorCodigo) msgErrorCodigo.style.display = 'block';
                inputCodigo.classList.add('is-invalid');
            }
        });

        if (inputCodigo) {
            inputCodigo.addEventListener('input', () => {
                if (msgErrorCodigo) msgErrorCodigo.style.display = 'none';
                inputCodigo.classList.remove('is-invalid');
            });
        }
    }
});
