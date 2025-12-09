// js/transaccionesAdmin.js

document.addEventListener('DOMContentLoaded', () => {

    // Simulación de datos de transacciones (Escenario 1)
    const allTransactions = [
        { id: 1, producto: 'Curso Microblading', valor: 30000, usuario: 'Maria Castillo', fecha: '12/12/2024', email: 'mariacastillo@gmail.com', estado: 'Completada' },
        { id: 2, producto: 'Lifting de Pestañas', valor: 15000, usuario: 'Javier Pérez', fecha: '12/12/2024', email: 'javierp@mail.com', estado: 'Completada' },
        { id: 3, producto: 'Curso Diseño Cejas', valor: 45000, usuario: 'Andrea Soto', fecha: '11/12/2024', email: 'andreas@mail.com', estado: 'Completada' },
        { id: 4, producto: 'Shampoo de Cejas', valor: 8000, usuario: 'Felipe Roa', fecha: '11/12/2024', email: 'feliper@mail.com', estado: 'Completada' },
        { id: 5, producto: 'Kit de Pigmentos', valor: 60000, usuario: 'Constanza Díaz', fecha: '10/12/2024', email: 'constanzad@mail.com', estado: 'Completada' },
        { id: 6, producto: 'Tinte de Cejas', valor: 10000, usuario: 'Roberto Cruz', fecha: '10/12/2024', email: 'robertoc@mail.com', estado: 'Completada' },
        // Agregamos más para simular la paginación (Escenario 3)
        { id: 7, producto: 'Curso Avanzado', valor: 80000, usuario: 'Laura Gómez', fecha: '09/12/2024', email: 'laurag@mail.com', estado: 'Completada' },
        { id: 8, producto: 'Servicio Manicure', valor: 12000, usuario: 'Ignacio Silva', fecha: '09/12/2024', email: 'ignacios@mail.com', estado: 'Completada' },
        { id: 9, producto: 'Limpieza Facial', valor: 25000, usuario: 'Isidora Paz', fecha: '08/12/2024', email: 'isidorap@mail.com', estado: 'Completada' },
        { id: 10, producto: 'Retoque de Cejas', valor: 20000, usuario: 'Simón Toro', fecha: '08/12/2024', email: 'simont@mail.com', estado: 'Completada' },
        // Y 10 más para llegar a 20+ y forzar el Escenario 3
        ...Array(11).fill().map((_, i) => ({
            id: i + 11,
            producto: `Producto ${i + 11}`,
            valor: (i + 1) * 5000,
            usuario: `Usuario ${i + 11}`,
            fecha: `0${Math.floor(Math.random() * 7) + 1}/12/2024`,
            email: `usuario${i + 11}@mail.com`,
            estado: 'Completada'
        }))
    ];

    // Filtrar solo las transacciones 'Completadas' (Escenario 1)
    const completedTransactions = allTransactions.filter(t => t.estado === 'Completada');
    
    // Configuración de Paginación (Escenario 3)
    const transactionsPerPage = 10;
    let currentPage = 1;
    const totalPages = Math.ceil(completedTransactions.length / transactionsPerPage);

    const transactionListBody = document.getElementById('transaction-list');
    const modalDetails = document.getElementById('modal-details');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const paginationNav = document.querySelector('.pagination');

    // Función para renderizar la tabla con la página actual
    function renderTable() {
        // Limpiar el contenido anterior
        transactionListBody.innerHTML = '';
        
        // Calcular el rango de datos a mostrar
        const start = (currentPage - 1) * transactionsPerPage;
        const end = start + transactionsPerPage;
        const transactionsToDisplay = completedTransactions.slice(start, end);

        // Generar las filas de la tabla
        transactionsToDisplay.forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${t.producto}</td>
                <td>$ ${t.valor.toLocaleString('es-CL')}</td>
                <td>${t.usuario}</td>
                <td>${t.fecha}</td>
                <td>#${t.id}</td>
                <td>
                    <button class="btn btn-transaction-detail btn-sm" data-id="${t.id}" data-bs-toggle="modal" data-bs-target="#transactionDetailModal">
                        Ver
                    </button>
                </td>
            `;
            transactionListBody.appendChild(row);
        });

        updatePaginationControls();
    }
    
    // Función para actualizar los botones de paginación (Escenario 3)
    function updatePaginationControls() {
        // Habilitar/Deshabilitar botones Anterior/Siguiente
        prevPageBtn.classList.toggle('disabled', currentPage === 1);
        nextPageBtn.classList.toggle('disabled', currentPage === totalPages);

        // Remover números de página anteriores
        document.querySelectorAll('.page-number-item').forEach(el => el.remove());
        
        // Renderizar números de página
        for (let i = 1; i <= totalPages; i++) {
            const pageItem = document.createElement('li');
            pageItem.classList.add('page-item', 'page-number-item');
            pageItem.classList.toggle('active', i === currentPage);
            pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            pageItem.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                renderTable();
            });
            // Insertar el número antes del botón 'Siguiente'
            nextPageBtn.insertAdjacentElement('beforebegin', pageItem);
        }
    }
    
    // Listener para el botón 'Anterior'
    prevPageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    // Listener para el botón 'Siguiente'
    nextPageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
    
    // Listener para abrir el Modal de Detalle (Escenario 2)
    const transactionDetailModal = document.getElementById('transactionDetailModal');
    if (transactionDetailModal) {
        transactionDetailModal.addEventListener('show.bs.modal', (event) => {
            // Botón que disparó el modal
            const button = event.relatedTarget;
            // Obtener el ID de la transacción del atributo data-id
            const transactionId = button.getAttribute('data-id');
            
            // Buscar la transacción en los datos simulados
            const transaction = completedTransactions.find(t => t.id == transactionId);
            
            if (transaction) {
                // Formatear el monto
                const formattedValue = transaction.valor.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 });
                
                // Actualizar el contenido del modal (similar al diseño)
                modalDetails.innerHTML = `
                    <p class="detail-course">${transaction.producto}</p>
                    <p class="detail-total">Monto total: <span class="value">${formattedValue}</span></p>
                    <hr>
                    <p class="detail-info-title">Información de la alumna</p>
                    <p class="detail-student-name">${transaction.usuario}</p>
                    <p class="detail-student-email">${transaction.email}</p>
                    <hr>
                    <p class="detail-id">Id Transaccion: <span class="value">#${transaction.id}</span></p>
                    <p class="detail-datetime">Fecha: <span class="value">${transaction.fecha}</span></p>
                `;
            }
        });
    }

    // Inicializar la tabla y los controles de paginación
    renderTable();
});
