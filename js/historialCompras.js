document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. Inicialización de Componentes UI (Navbar, Sidebar, etc.) ---
    // Esto reemplaza al script que tenías en el HTML
    if (typeof UI !== 'undefined' && UI.initNavbar) {
        UI.initNavbar();
    } else {
        console.warn("UI no está definido o initNavbar no existe.");
    }

    // --- 2. Lógica de Historial de Compras ---
    
    // Simulación de datos
    const transactions = [
        {
            id: "#TRX-001",
            date: "15 DE DICIEMBRE",
            title: "Microblading Expert",
            author: "KikiBrows Academy",
            image: "https://via.placeholder.com/150", 
            url: "claseAlumn.html"
        },
        {
            id: "#TRX-002",
            date: "20 DE NOVIEMBRE",
            title: "Diseño de Mirada Pro",
            author: "KikiBrows Academy",
            image: "https://via.placeholder.com/150", 
            url: "claseAlumn.html"
        }
    ];

    const container = document.getElementById("purchases-list");
    const searchInput = document.getElementById('searchHistory');

    function renderHistory(data) {
        container.innerHTML = ""; 

        if (data.length === 0) {
            container.innerHTML = '<div class="text-center py-5 text-muted fw-bold">No se encontraron compras.</div>';
            return;
        }

        data.forEach(item => {
            const html = `
                <div class="purchase-card-item p-4">
                    <div class="purchase-date">
                        ${item.date}
                    </div>

                    <div class="row align-items-center">
                        <div class="col-auto">
                            <img src="${item.image}" alt="${item.title}" class="purchase-thumb">
                        </div>

                        <div class="col">
                            <div class="status-text">Compra exitosa</div>
                            <h3 class="course-title-history">${item.title}</h3>
                            <p class="mb-0 small text-muted">Instructor: ${item.author}</p>
                        </div>

                        <div class="col-12 col-md-auto mt-3 mt-md-0 text-end">
                            <div class="d-flex flex-column gap-2">
                                <a href="${item.url}" class="btn-kiki">Ir al curso</a>
                                <a href="#" class="btn-kiki-outline">Ver detalle</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });
    }

    // Inicializar renderizado
    renderHistory(transactions);

    // Funcionalidad Buscador
    if(searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = transactions.filter(t => 
                t.title.toLowerCase().includes(term) || 
                t.author.toLowerCase().includes(term)
            );
            renderHistory(filtered);
        });
    }
});