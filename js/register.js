// js/registrate.js

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.querySelector('.user-registration-form');

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Evita el POST real

            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            // 1. Validación de contraseñas (UX Crucial)
            if (password !== confirmPassword) {
                alert("Las contraseñas no coinciden. Por favor, verifica.");
                return;
            }

            // 2. Simulación de persistencia (Guardamos al usuario en el "navegador")
            // Esto permite que el login sepa quién se registró
            const newUser = {
                nombre: nombre,
                email: email,
                password: password // En un MVP esto es aceptable, en producción nunca.
            };

            // Guardamos el objeto como string para que el login pueda consultarlo
            localStorage.setItem('registeredUser', JSON.stringify(newUser));

            // 3. Feedback y Redirección
            // Usamos un pequeño delay o un alert para que el usuario sepa que funcionó
            alert("¡Registro exitoso! Bienvenido a KIKIBROWS. Ahora inicia sesión.");
            
            window.location.href = 'login.html';
        });
    }
});
