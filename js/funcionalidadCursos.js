// js/funcionalidadCursos.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Función de simulación para los escenarios UX
    const simularAccion = (escenario, mensaje) => {
        console.log(`Ejecutando Escenario ${escenario}: ${mensaje}`);
        // En un entorno real, usarías aquí window.location.href o modales de Bootstrap.
        alert(`ACCIÓN: ${mensaje}`);
    };

    // 1. Manejo del botón "Crear Curso" (Escenario 1, parte superior)
    const btnCrearCurso = document.getElementById('btn-crear-curso');
    btnCrearCurso.addEventListener('click', () => {
        simularAccion(
            '1 (Creación)', 
            'Redirección a Épica 3 "Creación de Curso".'
        );
    });

    // 2. Manejo de las tarjetas de cursos (Click para Edición/Estructura)
    const courseCards = document.querySelectorAll('.course-card');

    courseCards.forEach(card => {
        card.addEventListener('click', (e) => {
            
            // Si se hizo click en el botón 'VER', no ejecutamos la edición general.
            if (e.target.classList.contains('btn-ver-curso')) {
                // Ya se maneja en el punto 3
                return; 
            }
            
            // Escenario 3: Acceder a Edición de Estructura.
            // El UX indica: "Click en editar redirige a gestión de cursos Épica y gestión de módulos correspondiente."
            simularAccion(
                '3 (Edición de Estructura)', 
                'Redirección al módulo de Edición del curso correspondiente(Épica 3).'
            );
        });
    });

    // 3. Manejo del botón "VER" (Escenario 2: Ver Detalles Básicos)
    const verButtons = document.querySelectorAll('.btn-ver-curso');
    
    verButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el click se propague a la card (punto 2)
            
            // Escenario 2: Ver Detalles Básicos.
            // El UX indica: "Se muestra Card con info: nombre, descripción, precio, estado, número de módulos, fecha..."
            const courseId = btn.getAttribute('data-course-id');
            simularAccion(
                '2 (Ver Detalles)', 
                `Mostrar Card con información básica del curso ID: ${courseId}.`
            );
        });
    });
    
    // 4. Lógica de búsqueda (Simulación de entrada)
    const searchInput = document.querySelector('.search-input input');
    const searchIcon = document.querySelector('.search-input .search-icon');
    
    searchIcon.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            console.log(`Buscando cursos con query: "${query}"`);
            // Aquí iría la llamada AJAX o la lógica de filtrado de la cuadrícula.
            alert(`Simulación de búsqueda para: "${query}"`);
        }
    });

});
