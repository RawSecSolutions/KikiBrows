document.addEventListener('DOMContentLoaded', function() {
    
    // 1. INICIALIZAR NAVBAR (Corrección para que aparezca el menú)
    // Verificamos si el objeto UI del componente Alumno existe y llamamos al navbar
    if (typeof UI !== 'undefined' && typeof UI.initNavbar === 'function') {
        UI.initNavbar();
    } else {
        console.error("Error: componentsAlumn.js no se ha cargado correctamente.");
    }

    // 2. DATOS SIMULADOS
    const certificadosData = [
        {
            id: 1,
            curso: "Curso Microblading 1",
            instructor: "Daniela Candi",
            fecha: "15 Oct, 2023",
            codigo: "KB-2023-001"
        },
        {
            id: 2,
            curso: "Lifting de Pestañas Pro",
            instructor: "Equipo KikiBrows",
            fecha: "22 Nov, 2023",
            codigo: "KB-2023-045"
        },
        {
            id: 3,
            curso: "Diseño de Cejas con Henna",
            instructor: "Daniela Candi",
            fecha: "10 Ene, 2024",
            codigo: "KB-2024-012"
        }
    ];

    const container = document.getElementById('certificados-container');
    const noCertsMsg = document.getElementById('no-certs-message');

    // 3. FUNCIÓN PARA RENDERIZAR TARJETAS
    function cargarCertificados() {
        if (!container) return; // Seguridad por si el ID cambia

        if (certificadosData.length === 0) {
            if(noCertsMsg) noCertsMsg.classList.remove('d-none');
            return;
        }

        certificadosData.forEach(cert => {
            const cardHTML = `
                <div class="col-12 col-lg-8">
                    <div class="cert-card p-4">
                        <div class="d-flex justify-content-between align-items-center cert-body-flex">
                            
                            <div class="cert-info">
                                <h3 class="cert-title">${cert.curso}</h3>
                                <p class="cert-detail"><i class="fa-solid fa-user-tie me-2"></i>Instructor: <strong>${cert.instructor}</strong></p>
                                <p class="cert-detail"><i class="fa-regular fa-calendar me-2"></i>Completado: ${cert.fecha}</p>
                                <small class="text-muted fst-italic">Cód: ${cert.codigo}</small>
                            </div>

                            <div class="cert-actions">
                                <button class="btn-kiki-primary" onclick="verCertificado(${cert.id})">
                                    <i class="fa-regular fa-eye me-2"></i>Ver
                                </button>
                                <button class="btn-kiki-outline" onclick="descargarCertificado(${cert.id})">
                                    <i class="fa-solid fa-download me-2"></i>Descargar
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });
    }

    // Ejecutar carga de certificados
    cargarCertificados();
});

// Funciones globales (fuera del DOMContentLoaded para que el HTML las encuentre en el onclick)
function verCertificado(id) {
    alert("Abriendo vista previa del certificado ID: " + id);
}

function descargarCertificado(id) {
    alert("Iniciando descarga del certificado ID: " + id);
}