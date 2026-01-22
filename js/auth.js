// js/auth.js

// 1. Simulación del estado (el "booleano" que pediste)
export const authService = {
    // Verifica si hay una sesión activa
    isLoggedIn: () => {
        return localStorage.getItem('isLoggedIn') === 'true';
    },

    // Simula el inicio de sesión
    login: (email, password) => {
        // Aquí podrías validar un usuario dummy
        if (email && password) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName', 'Kiki User'); // Nombre dummy
            return true;
        }
        return false;
    },

    // Cierra la sesión
    logout: () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('usuarioActual');
        localStorage.removeItem('userRole');
        window.location.href = 'index.html';
    }
};
