// js/accountEdit.js

document.addEventListener('DOMContentLoaded', () => {
    // Selecciona todos los enlaces que tienen la clase 'edit-btn' o 'cancel-btn'
    const viewSwitchers = document.querySelectorAll('.edit-btn, .cancel-btn');

    viewSwitchers.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Evita la navegación por defecto del enlace

            // Obtiene el ID de la sección a la que se debe cambiar
            const targetId = link.getAttribute('data-target'); 
            
            // Si no hay un target, sale de la función
            if (!targetId) return;

            // Oculta todas las secciones de la cuenta y remueve la clase activa
            document.querySelectorAll('.account-section').forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active-view');
            });

            // Muestra la sección deseada y le añade la clase activa
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
                targetSection.classList.add('active-view');
            }
        });
    });
});
