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

	    // Obtenemos el usuario que se registró anteriormente
	    const registeredUser = JSON.parse(localStorage.getItem('registeredUser'));

	    if (registeredUser && email === registeredUser.email && pass === registeredUser.password) {
    	        // Si coinciden los datos registrados
    		localStorage.setItem('isLoggedIn', 'true');
    		localStorage.setItem('userName', registeredUser.nombre); 
    		window.location.href = 'index.html'; 
	    } else if (email && pass) {
    		// Si no hay registro previo, permitimos entrar con cualquier cosa (opción MVP flexible)
    		localStorage.setItem('isLoggedIn', 'true');
    		localStorage.setItem('userName', email.split('@')[0]);
    		window.location.href = 'index.html';
	    } else {
    		// Mostrar error
    		document.querySelector('.text-danger').style.display = 'block';
	    }
            }
        });
    }
});
