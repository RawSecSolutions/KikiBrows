// js/recover.js
import { SUPABASE_URL, SUPABASE_KEY } from '../shared/config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const recoverForm = document.getElementById('recover-form');
    const step1Div = document.getElementById('recover-step-1');
    const step2Div = document.getElementById('recover-step-2');
    const sentEmailSpan = document.getElementById('sent-email-span');

    // --- FUNCIONES VISUALES ---
    const mostrarErrorCampo = (input, mensaje) => {
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
        const inputs = recoverForm.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.classList.remove('is-invalid');
            const formGroup = input.closest('.form-group') || input.parentElement;
            const errorText = formGroup.querySelector('.invalid-feedback');
            if (errorText) errorText.remove();
        });
    };

    // MANEJO DEL SUBMIT
    if (recoverForm) {
        recoverForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            limpiarErrores();

            const emailInput = document.getElementById('email');
            const email = emailInput.value.trim().toLowerCase();

            // 1. Validaciones
            if (!email) {
                mostrarErrorCampo(emailInput, "Ingresa tu correo para continuar");
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                mostrarErrorCampo(emailInput, "Ingresa un correo válido");
                return;
            }

            // UI: Estado de carga
            const btnSubmit = recoverForm.querySelector('button[type="submit"]');
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            btnSubmit.disabled = true;

            try {
                // RECUPERACIÓN CON SUPABASE
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/resetPassword.html`
                });

                if (error) throw error;

                // Cambio de Estado Visual
                sentEmailSpan.innerText = email;
                step1Div.style.display = 'none';
                step2Div.style.display = 'block';

            } catch (error) {
                console.error('Error enviando recuperación:', error);
                mostrarErrorCampo(emailInput, "Error al enviar el correo. Intenta de nuevo.");
                btnSubmit.innerHTML = 'Enviar enlace';
                btnSubmit.disabled = false;
            }
        });
    }

    // Limpieza al escribir
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            this.classList.remove('is-invalid');
            const errorText = this.parentElement.querySelector('.invalid-feedback');
            if (errorText) errorText.remove();
        });
    }
});
