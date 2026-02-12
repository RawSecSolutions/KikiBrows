// js/login.js
import { supabase } from './sessionManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.user-registration-form');
    const mostrarPassCheckbox = document.getElementById('mostrar-password');
    const passwordInput = document.getElementById('password');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const tituloPrincipal = document.querySelector('h1');

    // Elementos de la sección de verificación
    const seccionVerificacion = document.getElementById('seccion-verificacion-login');
    const emailVerificacion = document.getElementById('email-verificacion-login');
    const inputCodigo = document.getElementById('codigo-verificacion-login');
    const btnValidarCodigo = document.getElementById('btn-validar-codigo-login');
    const btnReenviar = document.getElementById('btn-reenviar-login');
    const btnVolverLogin = document.getElementById('btn-volver-login');
    const msgErrorCodigo = document.getElementById('msg-error-codigo-login');
    const msgExitoCodigo = document.getElementById('msg-exito-codigo-login');

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

    const mostrarError = (mensaje) => {
        if (loginErrorMsg) {
            loginErrorMsg.textContent = mensaje;
            loginErrorMsg.style.display = 'block';
        }
    };

    const limpiarErrores = () => {
        const inputs = loginForm.querySelectorAll('.form-control');
        inputs.forEach(input => input.classList.remove('is-invalid'));
        if (loginErrorMsg) loginErrorMsg.style.display = 'none';
    };

    // Funciones para errores del código de verificación
    const mostrarErrorCodigo = (mensaje) => {
        if (msgErrorCodigo) {
            msgErrorCodigo.textContent = mensaje;
            msgErrorCodigo.style.display = 'block';
        }
        if (msgExitoCodigo) msgExitoCodigo.style.display = 'none';
        if (inputCodigo) inputCodigo.classList.add('is-invalid');
    };

    const mostrarExitoCodigo = (mensaje) => {
        if (msgExitoCodigo) {
            msgExitoCodigo.textContent = mensaje;
            msgExitoCodigo.style.display = 'block';
        }
        if (msgErrorCodigo) msgErrorCodigo.style.display = 'none';
        if (inputCodigo) inputCodigo.classList.remove('is-invalid');
    };

    const limpiarErrorCodigo = () => {
        if (msgErrorCodigo) msgErrorCodigo.style.display = 'none';
        if (msgExitoCodigo) msgExitoCodigo.style.display = 'none';
        if (inputCodigo) inputCodigo.classList.remove('is-invalid');
    };

    // Función para mostrar la sección de verificación
    const mostrarSeccionVerificacion = async (email) => {
        // Guardar email para verificación
        localStorage.setItem('pendingVerificationEmail', email);

        // Mostrar email en la sección
        if (emailVerificacion) {
            emailVerificacion.textContent = email;
        }

        // Ocultar formulario de login y mostrar verificación
        if (loginForm) loginForm.style.display = 'none';
        if (tituloPrincipal) tituloPrincipal.style.display = 'none';
        if (seccionVerificacion) seccionVerificacion.style.display = 'block';

        // Enfocar input del código
        if (inputCodigo) {
            inputCodigo.value = '';
            inputCodigo.focus();
        }

        // Reenviar automáticamente un nuevo código
        await reenviarCodigoVerificacion(email, true);
    };

    // Función para volver al login
    const volverAlLogin = () => {
        localStorage.removeItem('pendingVerificationEmail');

        if (seccionVerificacion) seccionVerificacion.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
        if (tituloPrincipal) tituloPrincipal.style.display = 'block';

        limpiarErrorCodigo();
        if (inputCodigo) inputCodigo.value = '';
    };

    // Función para reenviar código
    let cooldownTimer = null;
    let cooldownSeconds = 0;

    const actualizarBotonReenviar = () => {
        if (!btnReenviar) return;
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

    const reenviarCodigoVerificacion = async (email, esAutomatico = false) => {
        if (!btnReenviar) return;

        const textoOriginal = btnReenviar.textContent;
        btnReenviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        btnReenviar.disabled = true;

        try {
            const { data, error } = await supabase.auth.resend({
                type: 'signup',
                email: email
            });

            if (error) throw error;

            if (esAutomatico) {
                mostrarExitoCodigo('Se ha enviado un nuevo código de verificación a tu correo.');
            } else {
                mostrarExitoCodigo('Código reenviado. Revisa tu correo.');
            }

            // Iniciar cooldown
            iniciarCooldown();

            // Ocultar mensaje de éxito después de 5 segundos
            setTimeout(() => {
                if (msgExitoCodigo) msgExitoCodigo.style.display = 'none';
            }, 5000);

        } catch (error) {
            console.error('Error al reenviar código:', error);

            let mensaje = 'Error al enviar el código. Intenta de nuevo.';
            if (error.message.includes('rate limit')) {
                if (esAutomatico) {
                    // Si es automático y hay rate limit, probablemente ya hay un código enviado recientemente
                    mensaje = 'Ya se envió un código recientemente. Revisa tu correo o espera unos minutos para solicitar otro.';
                } else {
                    mensaje = 'Has solicitado muchos códigos. Espera unos minutos.';
                }
            }

            mostrarErrorCodigo(mensaje);
            btnReenviar.textContent = textoOriginal;
            btnReenviar.disabled = false;
        }
    };

    // 2. MANEJO DEL LOGIN
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            limpiarErrores();

            const emailInput = document.getElementById('email');
            const passInput = document.getElementById('password');

            const email = emailInput.value.trim().toLowerCase();
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
                mostrarError('Ingresa un correo válido');
                return;
            }

            // UI: Estado de carga
            const btnSubmit = loginForm.querySelector('button[type="submit"]');
            const textoOriginal = btnSubmit.innerText;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            btnSubmit.disabled = true;

            try {
                // AUTENTICACIÓN CON SUPABASE
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password: pass
                });

                if (error) throw error;

                const user = data.user;

                // Obtener perfil del usuario
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                // Si no existe el perfil, no permitir el acceso
                if (profileError || !profile) {
                    console.error('No se encontró perfil para el usuario:', profileError);
                    await supabase.auth.signOut();

                    // Mensaje más específico según el tipo de error
                    let msgError = 'No se encontró tu perfil de usuario. Contacta soporte.';
                    if (profileError?.code === '42P17') {
                        msgError = 'Error de configuración en la base de datos. Contacta al administrador.';
                    }

                    mostrarError(msgError);
                    btnSubmit.innerHTML = textoOriginal;
                    btnSubmit.disabled = false;
                    return;
                }

                // Verificar si el usuario está bloqueado
                if (profile.is_blocked) {
                    await supabase.auth.signOut();
                    mostrarError('Tu cuenta ha sido bloqueada. Contacta soporte.');
                    btnSubmit.innerHTML = textoOriginal;
                    btnSubmit.disabled = false;
                    return;
                }

                // Guardar datos en localStorage para compatibilidad
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userName', profile.first_name || email.split('@')[0]);
                localStorage.setItem('userRole', profile.role || 'student');

                const usuarioActual = {
                    id: user.id,
                    email: user.email,
                    nombre: profile.first_name || '',
                    apellido: profile.last_name || '',
                    role: profile.role || 'student'
                };
                localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));

                // REDIRECCIÓN SEGÚN ROL
                const isAdmin = profile.role === 'admin' || profile.role === 'superadmin';

                // Si hay redirección pendiente, solo usarla si es coherente con el rol
                const redirectUrl = localStorage.getItem('redirectAfterLogin');
                if (redirectUrl) {
                    localStorage.removeItem('redirectAfterLogin');
                    const isAdminPage = redirectUrl.includes('admin') || redirectUrl.includes('usersGest') || redirectUrl.includes('gestionCursos') || redirectUrl.includes('creaCurso') || redirectUrl.includes('gestorModulos') || redirectUrl.includes('revYFeedback');
                    if (!isAdminPage || isAdmin) {
                        window.location.href = redirectUrl;
                        return;
                    }
                }

                let destino = '';
                if (isAdmin) {
                    destino = 'adminPanel.html';
                } else {
                    destino = 'index.html';
                }

                window.location.href = destino;

            } catch (error) {
                console.error('Error de login:', error);

                // Si el email no está confirmado, mostrar sección de verificación
                if (error.message.includes('Email not confirmed')) {
                    btnSubmit.innerHTML = textoOriginal;
                    btnSubmit.disabled = false;
                    await mostrarSeccionVerificacion(email);
                    return;
                }

                let mensaje = 'Error al iniciar sesión';
                if (error.message.includes('Invalid login credentials')) {
                    mensaje = 'Correo o contraseña incorrectos';
                } else if (error.status === 500 || error.message.includes('500')) {
                    mensaje = 'Error del servidor al autenticar. Es posible que la cuenta no se haya creado correctamente. Contacta al administrador.';
                }

                mostrarError(mensaje);
                btnSubmit.innerHTML = textoOriginal;
                btnSubmit.disabled = false;
            }
        });
    }

    // 3. VALIDAR CÓDIGO DE VERIFICACIÓN
    if (btnValidarCodigo) {
        btnValidarCodigo.addEventListener('click', async function() {
            const codigo = inputCodigo?.value.trim();
            const email = localStorage.getItem('pendingVerificationEmail');

            if (!email) {
                mostrarErrorCodigo('Error: No se encontró el email. Vuelve a intentar el login.');
                return;
            }

            if (!codigo || codigo.length !== 8 || !/^\d{8}$/.test(codigo)) {
                mostrarErrorCodigo('Ingresa un código válido de 8 dígitos');
                return;
            }

            // UI: Estado de carga
            const textoOriginal = btnValidarCodigo.innerHTML;
            btnValidarCodigo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            btnValidarCodigo.disabled = true;
            limpiarErrorCodigo();

            try {
                // Verificar el código OTP
                const { data, error } = await supabase.auth.verifyOtp({
                    email: email,
                    token: codigo,
                    type: 'signup'
                });

                if (error) throw error;

                // Verificación exitosa - limpiar datos temporales
                localStorage.removeItem('pendingVerificationEmail');

                const user = data.user;

                // Obtener perfil del usuario
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                // Si no existe el perfil, no permitir el acceso
                if (profileError || !profile) {
                    console.error('No se encontró perfil para el usuario:', profileError);
                    await supabase.auth.signOut();

                    let msgError = 'No se encontró tu perfil de usuario. Contacta soporte.';
                    if (profileError?.code === '42P17') {
                        msgError = 'Error de configuración en la base de datos. Contacta al administrador.';
                    }

                    mostrarErrorCodigo(msgError);
                    btnValidarCodigo.innerHTML = textoOriginal;
                    btnValidarCodigo.disabled = false;
                    return;
                }

                // Guardar datos en localStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userName', profile.first_name || email.split('@')[0]);
                localStorage.setItem('userRole', profile.role || 'student');

                const usuarioActual = {
                    id: user.id,
                    email: user.email,
                    nombre: profile.first_name || '',
                    apellido: profile.last_name || '',
                    role: profile.role || 'student'
                };
                localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));

                // Mostrar mensaje de éxito
                if (seccionVerificacion) {
                    seccionVerificacion.innerHTML = `
                        <div class="text-center">
                            <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
                            <h2 class="mt-3 mb-3">¡Cuenta verificada!</h2>
                            <p>Tu cuenta ha sido verificada exitosamente.</p>
                            <p>Redirigiendo...</p>
                        </div>
                    `;
                }

                // Redirigir según el rol del usuario
                const isAdmin = profile.role === 'admin' || profile.role === 'superadmin';
                setTimeout(() => {
                    const redirectUrl = localStorage.getItem('redirectAfterLogin');
                    if (redirectUrl) {
                        localStorage.removeItem('redirectAfterLogin');
                        const isAdminPage = redirectUrl.includes('admin') || redirectUrl.includes('usersGest') || redirectUrl.includes('gestionCursos') || redirectUrl.includes('creaCurso') || redirectUrl.includes('gestorModulos') || redirectUrl.includes('revYFeedback');
                        if (!isAdminPage || isAdmin) {
                            window.location.href = redirectUrl;
                            return;
                        }
                    }
                    if (isAdmin) {
                        window.location.href = 'adminPanel.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 2000);

            } catch (error) {
                console.error('Error de verificación:', error);

                let mensaje = 'Código incorrecto';
                if (error.message.includes('expired')) {
                    mensaje = 'El código ha expirado. Solicita uno nuevo haciendo clic en "Reenviar código".';
                } else if (error.message.includes('invalid')) {
                    mensaje = 'Código inválido. Verifica e intenta de nuevo.';
                }

                mostrarErrorCodigo(mensaje);
                btnValidarCodigo.innerHTML = textoOriginal;
                btnValidarCodigo.disabled = false;
            }
        });
    }

    // 4. EVENTOS DEL INPUT DE CÓDIGO
    if (inputCodigo) {
        inputCodigo.addEventListener('input', () => {
            limpiarErrorCodigo();
            // Solo permitir números
            inputCodigo.value = inputCodigo.value.replace(/[^0-9]/g, '');
        });

        inputCodigo.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnValidarCodigo?.click();
            }
        });
    }

    // 5. BOTÓN REENVIAR CÓDIGO
    if (btnReenviar) {
        btnReenviar.addEventListener('click', async function() {
            const email = localStorage.getItem('pendingVerificationEmail');

            if (!email) {
                mostrarErrorCodigo('Error: No se encontró el email. Vuelve a intentar el login.');
                return;
            }

            await reenviarCodigoVerificacion(email, false);
        });
    }

    // 6. BOTÓN VOLVER AL LOGIN
    if (btnVolverLogin) {
        btnVolverLogin.addEventListener('click', function(e) {
            e.preventDefault();
            volverAlLogin();
        });
    }

    // Limpiar errores al escribir en el formulario de login
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('is-invalid');
            if (loginErrorMsg) loginErrorMsg.style.display = 'none';
        });
    });
});
