// js/funcionalidadTabla.js

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Manejo de la acción de edición (Card Alert UX)
    // El UX indica: "CLICK EN EL NOMBRE DA ACCESO DETALLES DEL USUARIO EN NUEVO CARD ALERT..."
    const userRows = document.querySelectorAll('.skeleton-row');

    userRows.forEach(row => {
        // En un entorno real, solo el nombre de usuario sería clickeable,
        // pero para el mockup, hacemos toda la fila reaccionar.
        row.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Reemplaza esto con tu lógica real de mostrar el "Card Alert" de edición.
            console.log('Fila clickeada. Simulando apertura de Card Alert de Detalles/Edición.');
            
            // Simulación visual simple (podrías usar un modal de Bootstrap aquí)
            alert('Detalles del Usuario: Se abriría el Card Alert de edición/detalles como se describe en el UX.');
        });
    });

    // 2. Manejo del botón "Crear Usuario"
    const createUserBtn = document.querySelector('.create-user-btn');
    createUserBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // El UX indica: "Acceso a nueva card desde el botón blanco lista para ser rellenada"
        console.log('Botón Crear Usuario clickeado. Simulando apertura de Card Alert de creación.');
        alert('Crear Nuevo Usuario: Se abriría el Card Alert de creación como se describe en el UX.');
    });

    // 3. Inicialización de componentes de Bootstrap (ej: Dropdowns)
    const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
    const dropdownList = [...dropdownElementList].map(dropdownToggleEl => new bootstrap.Dropdown(dropdownToggleEl));

    // 4. Lógica de ordenamiento (simulación)
    const orderItems = document.querySelectorAll('.order-selector .dropdown-item');
    const orderBtn = document.querySelector('.order-btn');

    orderItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const order = item.getAttribute('data-order');
            orderBtn.textContent = (order === 'asc' ? 'a-z' : 'z-a');
            console.log('Orden seleccionado:', order);
            // Aquí iría la lógica para reordenar los datos de la tabla.
        });
    });

});
