document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.user-registration-form');
    const mostrarPassCheckbox = document.getElementById('mostrar-password');
    const passwordInput = document.getElementById('password');

    // Mostrar/Ocultar Contraseña
    if (mostrarPassCheckbox && passwordInput) {
        mostrarPassCheckbox.addEventListener('change', () => {
            passwordInput.type = mostrarPassCheckbox.checked ? 'text' : 'password';
        });
    }

    // Manejo del Login (Interceptando el POST) anti 501, es mvp po milito
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Evita que el formulario intente hacer el POST real (ANTI 501)
            
            const email = document.getElementById('email').value;
            const pass = document.getElementById('password').value;

            // Simulación de validación (MVP)
            // Podría hacerse lógica simple como: if(email === 'admin@test.com' && pass === '123') pero na
            if(email && pass) {
                // Guardamos el estado "booleano" y el nombre en localStorage(que es un storage del navegador que se conserva luego de reloads)
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userName', email.split('@')[0]); 
                
                // Redirigir al inicio
                window.location.href = 'index.html'; 
            } else {
                // Si falla, error message del CSS/HTML
                const errorMsg = document.querySelector('.text-danger');
                if (errorMsg) errorMsg.style.display = 'block';
            }
        });
    }
});
