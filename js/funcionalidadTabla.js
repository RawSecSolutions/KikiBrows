// js/funcionalidadTabla.js

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Manejo de la acción de edición (Card Alert UX)
    // Se ha eliminado la lógica de JS y la simulación (alert)
    // Ahora se usa data-bs-toggle en el HTML de usersGest.html para abrir el modal.
    /*
    const userRows = document.querySelectorAll('.skeleton-row');
    userRows.forEach(row => {
        row.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Fila clickeada. Se abre el Card Alert de edición/detalles.');
            alert('Detalles del Usuario: Se abriría el Card Alert de edición/detalles como se describe en el UX.');
        });
    });
    */

    // 2. Manejo del botón "Crear Usuario"
    // Se ha eliminado la lógica de JS y la simulación (alert)
    // Ahora se usa data-bs-toggle en el HTML de usersGest.html para abrir el modal.
    /*
    const createUserBtn = document.querySelector('.create-user-btn');
    createUserBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Botón Crear Usuario clickeado. Se abre el Card Alert de creación.');
        alert('Crear Nuevo Usuario: Se abriría el Card Alert de creación como se describe en el UX.');
    });
    */

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
