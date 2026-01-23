document.addEventListener('DOMContentLoaded', function() {

    const container = document.getElementById('certificados-container');
    const noCertsMsg = document.getElementById('no-certs-message');

    // 1. FUNCIÓN PARA OBTENER CERTIFICADOS REALES
    function obtenerCertificadosReales() {
        const student = CursosData.getStudentData();
        const certificadosData = [];

        // Iterar sobre los certificados del estudiante
        if (student.certificados && Object.keys(student.certificados).length > 0) {
            Object.keys(student.certificados).forEach(cursoId => {
                const certInfo = student.certificados[cursoId];
                const curso = CursosData.getCurso(parseInt(cursoId));

                if (curso) {
                    // Generar código de certificado
                    const codigo = window.CertificateGenerator.generarCodigoCertificado(
                        parseInt(cursoId),
                        student.id
                    );

                    // Formatear fecha
                    const fechaFormateada = window.CertificateGenerator.formatearFecha(certInfo.fecha);

                    certificadosData.push({
                        id: parseInt(cursoId),
                        curso: curso.nombre,
                        instructor: curso.instructor || 'Equipo KikiBrows',
                        fecha: fechaFormateada,
                        codigo: codigo
                    });
                }
            });
        }

        return certificadosData;
    }

    // 2. FUNCIÓN PARA RENDERIZAR TARJETAS
    function cargarCertificados() {
        if (!container) return; // Seguridad por si el ID cambia

        const certificadosData = obtenerCertificadosReales();

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
    // Redirigir a la página del curso con el modal de certificado abierto
    window.location.href = `claseAlumn.html?curso=${id}&showCertificate=true`;
}

async function descargarCertificado(cursoId) {
    try {
        // Obtener datos del estudiante y curso
        const student = CursosData.getStudentData();
        const curso = CursosData.getCurso(cursoId);

        if (!curso) {
            alert('No se encontró el curso.');
            return;
        }

        // Obtener datos del usuario actual (con apellido)
        const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');

        // Generar código de certificado
        const codigoCertificado = window.CertificateGenerator.generarCodigoCertificado(
            cursoId,
            student.id
        );

        // Obtener fecha de completación
        const certificadoData = student.certificados[cursoId];
        const fechaCompletado = certificadoData
            ? window.CertificateGenerator.formatearFecha(certificadoData.fecha)
            : window.CertificateGenerator.formatearFecha(new Date());

        // Datos para el certificado
        const datosCertificado = {
            nombreAlumno: usuarioActual.nombre || student.nombre || 'Estudiante',
            apellidoAlumno: usuarioActual.apellido || '',
            nombreCurso: curso.nombre || 'Curso',
            fechaCompletado: fechaCompletado,
            codigoCertificado: codigoCertificado,
            nombreInstructor: curso.instructor || 'Equipo KikiBrows'
        };

        // Generar el PDF
        const resultado = await window.CertificateGenerator.generarCertificado(datosCertificado);

        if (!resultado.success) {
            alert('Error al generar el certificado. Por favor, intenta nuevamente.');
        }
    } catch (error) {
        console.error('Error al descargar certificado:', error);
        alert('Error al generar el certificado. Por favor, intenta nuevamente.');
    }
}