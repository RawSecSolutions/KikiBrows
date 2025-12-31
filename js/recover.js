document.addEventListener('DOMContentLoaded', () => {
    const recoverForm = document.getElementById('recover-form');
    const step1Div = document.getElementById('recover-step-1');
    const step2Div = document.getElementById('recover-step-2');
    const sentEmailSpan = document.getElementById('sent-email-span');

    // --- FUNCIONES VISUALES (Reutilizamos la lógica limpia) ---
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
        recoverForm.addEventListener('submit', function(e) {
            e.preventDefault();
            limpiarErrores();

            const emailInput = document.getElementById('email');
            const email = emailInput.value.trim();

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

            // 2. Simulación de Envío (Supabase resetPasswordForEmail)
            const btnSubmit = recoverForm.querySelector('button[type="submit"]');
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            btnSubmit.disabled = true;

            console.log(`Simulando envío de token a: ${email}`);

            setTimeout(() => {
                // 3. Cambio de Estado Visual
                sentEmailSpan.innerText = email; // Mostramos el email para feedback visual
                step1Div.style.display = 'none'; // Ocultamos formulario
                step2Div.style.display = 'block'; // Mostramos éxito
            }, 1500);
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