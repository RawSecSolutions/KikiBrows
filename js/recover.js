// Lógica de recuperación de contraseña (Manejo de la vista)

const forgotPasswordForm = document.getElementById('forgot-password-form');
const forgotPasswordSection = document.getElementById('forgot-password');
const checkInboxMessage = document.getElementById('check-inbox-message');
const displayedEmailSpan = document.getElementById('displayed-email');

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', function(event) {
        // 1. Prevenir el envío real del formulario (para evitar recarga de página)
        event.preventDefault();

        // Obtener el correo electrónico ingresado
        const emailInput = document.getElementById('email').value;

        // 2. Aquí iría la llamada al backend (fetch/axios) para enviar el correo.
        // Por ahora, simularemos que la solicitud es exitosa.
        
        // --- SIMULACIÓN DE ÉXITO ---

        // 3. Mostrar el correo ingresado en el mensaje de éxito
        if (displayedEmailSpan) {
            displayedEmailSpan.textContent = emailInput;
        }

        // 4. Ocultar la sección de "Olvidaste tu contraseña?"
        if (forgotPasswordSection) {
            forgotPasswordSection.style.display = 'none';
        }

        // 5. Mostrar la sección de "Revisa tu bandeja de entrada"
        if (checkInboxMessage) {
            checkInboxMessage.style.display = 'block'; 
        }

        // 6. Opcional: Desplazarse al inicio de la nueva sección
        if (checkInboxMessage) {
            checkInboxMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

// Nota: La sección 'create-new-password' debe ser mostrada 
// cuando el usuario llega a la página a través del enlace del correo electrónico.
// Eso requiere lógica de URL (tokens) que generalmente se maneja desde el backend.
