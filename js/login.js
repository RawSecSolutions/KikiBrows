// js/login.js
import { supabase } from './sessionManager.js';

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

                if (profileError) console.warn('Error obteniendo perfil:', profileError);

                // Verificar si el usuario está bloqueado
                if (profile?.is_blocked) {
                    await supabase.auth.signOut();
                    mostrarError('Tu cuenta ha sido bloqueada. Contacta soporte.');
                    btnSubmit.innerHTML = textoOriginal;
                    btnSubmit.disabled = false;
                    return;
                }

                // Guardar datos en localStorage para compatibilidad
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userName', profile?.first_name || email.split('@')[0]);
                localStorage.setItem('userRole', profile?.role || 'student');

                const usuarioActual = {
                    id: user.id,
                    email: user.email,
                    nombre: profile?.first_name || '',
                    apellido: profile?.last_name || '',
                    role: profile?.role || 'student'
                };
                localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));

                // VERIFICAR SI HAY UNA REDIRECCIÓN PENDIENTE
                const redirectUrl = localStorage.getItem('redirectAfterLogin');

                if (redirectUrl) {
                    localStorage.removeItem('redirectAfterLogin');
                    window.location.href = redirectUrl;
                    return;
                }

                // REDIRECCIÓN SEGÚN ROL
                let destino = '';
                if (profile?.role === 'admin' || profile?.role === 'superadmin') {
                    destino = 'adminPanel.html';
                } else {
                    destino = 'index.html';
                }

                window.location.href = destino;

            } catch (error) {
                console.error('Error de login:', error);

                let mensaje = 'Error al iniciar sesión';
                if (error.message.includes('Invalid login credentials')) {
                    mensaje = 'Correo o contraseña incorrectos';
                } else if (error.message.includes('Email not confirmed')) {
                    mensaje = 'Por favor confirma tu correo antes de iniciar sesión';
                }

                mostrarError(mensaje);
                btnSubmit.innerHTML = textoOriginal;
                btnSubmit.disabled = false;
            }
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
