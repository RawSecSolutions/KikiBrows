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
    const btnReenviar = document.getElementById('btn-reenviar');
    const inputCodigo = document.getElementById('codigo-verificacion');
    const msgErrorCodigo = document.getElementById('msg-error-codigo');
    const emailMostrado = document.getElementById('email-mostrado');

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

    const mostrarErrorCodigo = (mensaje) => {
        if (msgErrorCodigo) {
            msgErrorCodigo.textContent = mensaje;
            msgErrorCodigo.style.display = 'block';
        }
        if (inputCodigo) inputCodigo.classList.add('is-invalid');
    };

    const limpiarErrorCodigo = () => {
        if (msgErrorCodigo) msgErrorCodigo.style.display = 'none';
        if (inputCodigo) inputCodigo.classList.remove('is-invalid');
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

                // Mostrar el email en la sección de verificación
                if (emailMostrado) {
                    emailMostrado.textContent = email;
                }

                // Mostrar sección de verificación
                registerForm.style.display = 'none';
                if (tituloPrincipal) tituloPrincipal.style.display = 'none';
                if (seccionVerificacion) seccionVerificacion.style.display = 'block';

                // Enfocar el input del código
                if (inputCodigo) inputCodigo.focus();

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

    // --- 2. LÓGICA DE VERIFICACIÓN CON OTP ---
    if (btnValidar) {
        btnValidar.addEventListener('click', async function() {
            const codigo = inputCodigo.value.trim();
            const email = localStorage.getItem('tempUserEmail');

            if (!email) {
                mostrarErrorCodigo('Error: No se encontró el email. Por favor, regístrate de nuevo.');
                return;
            }

            if (codigo.length !== 8 || !/^\d{8}$/.test(codigo)) {
                mostrarErrorCodigo('Ingresa un código válido de 8 dígitos');
                return;
            }

            // UI: Estado de carga
            const textoOriginal = btnValidar.innerHTML;
            btnValidar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            btnValidar.disabled = true;
            limpiarErrorCodigo();

            try {
                // Verificar el código OTP con Supabase
                const { data, error } = await supabase.auth.verifyOtp({
                    email: email,
                    token: codigo,
                    type: 'signup'
                });

                if (error) throw error;

                // Verificación exitosa
                localStorage.removeItem('tempUserEmail');

                // Mostrar mensaje de éxito y redirigir
                seccionVerificacion.innerHTML = `
                    <div class="text-center">
                        <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
                        <h2 class="mt-3 mb-3">Cuenta verificada</h2>
                        <p>Tu cuenta ha sido verificada exitosamente.</p>
                        <p>Serás redirigido al inicio de sesión...</p>
                    </div>
                `;

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2500);

            } catch (error) {
                console.error('Error de verificación:', error);

                let mensaje = 'Código incorrecto';
                if (error.message.includes('expired')) {
                    mensaje = 'El código ha expirado. Solicita uno nuevo.';
                } else if (error.message.includes('invalid')) {
                    mensaje = 'Código inválido. Verifica e intenta de nuevo.';
                }

                mostrarErrorCodigo(mensaje);
                btnValidar.innerHTML = textoOriginal;
                btnValidar.disabled = false;
            }
        });

        // Limpiar errores al escribir
        if (inputCodigo) {
            inputCodigo.addEventListener('input', () => {
                limpiarErrorCodigo();
                // Solo permitir números
                inputCodigo.value = inputCodigo.value.replace(/[^0-9]/g, '');
            });

            // Enviar con Enter
            inputCodigo.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    btnValidar.click();
                }
            });
        }
    }

    // --- 3. LÓGICA PARA REENVIAR CÓDIGO ---
    if (btnReenviar) {
        let cooldownTimer = null;
        let cooldownSeconds = 0;

        const actualizarBotonReenviar = () => {
            if (cooldownSeconds > 0) {
                btnReenviar.textContent = `Reenviar código (${cooldownSeconds}s)`;
                btnReenviar.disabled = true;
            } else {
                btnReenviar.textContent = 'Reenviar código';
                btnReenviar.disabled = false;
            }
        };

        const iniciarCooldown = () => {
            cooldownSeconds = 60;
            actualizarBotonReenviar();

            cooldownTimer = setInterval(() => {
                cooldownSeconds--;
                actualizarBotonReenviar();

                if (cooldownSeconds <= 0) {
                    clearInterval(cooldownTimer);
                }
            }, 1000);
        };

        btnReenviar.addEventListener('click', async function() {
            const email = localStorage.getItem('tempUserEmail');

            if (!email) {
                mostrarErrorCodigo('Error: No se encontró el email. Por favor, regístrate de nuevo.');
                return;
            }

            // UI: Estado de carga
            btnReenviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            btnReenviar.disabled = true;

            try {
                // Reenviar el código OTP
                const { data, error } = await supabase.auth.resend({
                    type: 'signup',
                    email: email
                });

                if (error) throw error;

                // Mostrar mensaje de éxito
                limpiarErrorCodigo();
                const msgExito = document.createElement('div');
                msgExito.className = 'text-success small mt-2';
                msgExito.id = 'msg-exito-reenvio';
                msgExito.textContent = 'Código reenviado. Revisa tu correo.';

                // Remover mensaje anterior si existe
                const msgAnterior = document.getElementById('msg-exito-reenvio');
                if (msgAnterior) msgAnterior.remove();

                btnReenviar.parentElement.appendChild(msgExito);

                // Iniciar cooldown de 60 segundos
                iniciarCooldown();

                // Remover mensaje de éxito después de 5 segundos
                setTimeout(() => {
                    const msg = document.getElementById('msg-exito-reenvio');
                    if (msg) msg.remove();
                }, 5000);

            } catch (error) {
                console.error('Error al reenviar código:', error);

                let mensaje = 'Error al reenviar el código. Intenta de nuevo.';
                if (error.message.includes('rate limit')) {
                    mensaje = 'Has solicitado muchos códigos. Espera unos minutos.';
                }

                mostrarErrorCodigo(mensaje);
                btnReenviar.textContent = 'Reenviar código';
                btnReenviar.disabled = false;
            }
        });
    }

    // --- 4. BOTÓN PARA CAMBIAR EMAIL ---
    const btnCambiarEmail = document.getElementById('btn-cambiar-email');
    if (btnCambiarEmail) {
        btnCambiarEmail.addEventListener('click', function(e) {
            e.preventDefault();

            // Limpiar el email pendiente
            localStorage.removeItem('tempUserEmail');

            // Mostrar el formulario de registro
            if (registerForm) registerForm.style.display = 'block';
            if (tituloPrincipal) tituloPrincipal.style.display = 'block';
            if (seccionVerificacion) seccionVerificacion.style.display = 'none';

            // Limpiar el input del código
            if (inputCodigo) {
                inputCodigo.value = '';
                inputCodigo.classList.remove('is-invalid');
            }
            if (msgErrorCodigo) msgErrorCodigo.style.display = 'none';
        });
    }

    // --- 5. VERIFICAR SI HAY UN EMAIL PENDIENTE DE VERIFICACIÓN ---
    const emailPendiente = localStorage.getItem('tempUserEmail');
    if (emailPendiente && seccionVerificacion && registerForm) {
        // Si hay un email pendiente, mostrar directamente la sección de verificación
        registerForm.style.display = 'none';
        if (tituloPrincipal) tituloPrincipal.style.display = 'none';
        seccionVerificacion.style.display = 'block';

        if (emailMostrado) {
            emailMostrado.textContent = emailPendiente;
        }

        if (inputCodigo) inputCodigo.focus();
    }
});
