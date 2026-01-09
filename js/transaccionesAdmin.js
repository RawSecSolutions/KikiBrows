// js/transaccionesAdmin.js

document.addEventListener('DOMContentLoaded', () => {

    // Simulación de datos
    const allTransactions = [
        { id: 1, producto: 'Curso Microblading', valor: 30000, usuario: 'Maria Castillo', fecha: '12/12/2024', email: 'maria@gmail.com', estado: 'Completada' },
        { id: 2, producto: 'Lifting Pestañas', valor: 15000, usuario: 'Javier Pérez', fecha: '12/12/2024', email: 'javier@mail.com', estado: 'Completada' },
        { id: 3, producto: 'Diseño de Cejas', valor: 45000, usuario: 'Andrea Soto', fecha: '11/12/2024', email: 'andrea@mail.com', estado: 'Completada' },
        // Generar más datos para probar paginación
        ...Array(15).fill().map((_, i) => ({
            id: i + 4,
            producto: `Servicio ${i + 4}`,
            valor: (i + 1) * 2000,
            usuario: `Cliente ${i + 4}`,
            fecha: `10/12/2024`,
            email: `cliente${i + 4}@mail.com`,
            estado: 'Completada'
        }))
    ];

    const transactionsPerPage = 8;
    let currentPage = 1;
    const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);

    const listBody = document.getElementById('transaction-list');
    const modalDetails = document.getElementById('modal-details');
    
    // Elementos de paginación
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    function renderTable() {
        if (!listBody) return;
        listBody.innerHTML = '';
        
        const start = (currentPage - 1) * transactionsPerPage;
        const end = start + transactionsPerPage;
        const displayData = allTransactions.slice(start, end);

        displayData.forEach(t => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.innerHTML = `
                <td>${t.producto}</td>
                <td class="fw-bold">$ ${t.valor.toLocaleString('es-CL')}</td>
                <td>${t.usuario}</td>
                <td>${t.fecha}</td>
                <td>#${t.id}</td>
                <td>
                    <button class="btn btn-sm text-white" style="background-color: #8A835A;" 
                            data-id="${t.id}" data-bs-toggle="modal" data-bs-target="#transactionDetailModal">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            listBody.appendChild(row);
        });

        updatePagination();
    }
    
    function updatePagination() {
        if (!prevBtn || !nextBtn) return;
        
        // Estado botones
        if (currentPage === 1) prevBtn.classList.add('disabled');
        else prevBtn.classList.remove('disabled');

        if (currentPage === totalPages) nextBtn.classList.add('disabled');
        else nextBtn.classList.remove('disabled');

        // Listeners simples (se recomienda removerlos y re-agregar o usar clonación para evitar duplicados en SPA, aquí simple)
        // Nota: En una app real, gestiona los listeners mejor.
    }

    // Eventos Paginación
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
    }
    
    // Evento Modal Detalle
    const detailModal = document.getElementById('transactionDetailModal');
    if (detailModal) {
        detailModal.addEventListener('show.bs.modal', (event) => {
            const btn = event.relatedTarget;
            const id = btn.getAttribute('data-id');
            const t = allTransactions.find(x => x.id == id);

            if (t && modalDetails) {
                modalDetails.innerHTML = `
                    <h5 class="fw-bold mb-1">${t.producto}</h5>
                    <p class="text-muted mb-3">Total: <span class="text-danger fw-bold">$ ${t.valor.toLocaleString('es-CL')}</span></p>
                    <hr>
                    <p class="text-success fw-bold mb-1">Cliente</p>
                    <p class="mb-0">${t.usuario}</p>
                    <p class="text-muted small">${t.email}</p>
                    <hr>
                    <div class="d-flex justify-content-between">
                        <span>ID: <strong>#${t.id}</strong></span>
                        <span>Fecha: <strong>${t.fecha}</strong></span>
                    </div>
                `;
            }
        });
    }

    renderTable();
});