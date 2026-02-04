document.addEventListener('DOMContentLoaded', function() {

    const container = document.getElementById('certificados-container');
    const noCertsMsg = document.getElementById('no-certs-message');

    // AGREGAR CERTIFICADOS DE DEMO si no existen
    function agregarCertificadosDemo() {
        const student = CursosData.getStudentData();

        // Si ya tiene certificados, no hacer nada
        if (student.certificados && Object.keys(student.certificados).length > 0) {
            return;
        }

        // Agregar certificados de demo para cursos 1, 2, 4 y 5
        if (!student.certificados) {
            student.certificados = {};
        }

        // Curso 1: Microblading Básico (completado hace 2 meses)
        const fecha1 = new Date();
        fecha1.setMonth(fecha1.getMonth() - 2);
        student.certificados[1] = {
            fecha: fecha1.toISOString(),
            descargado: false
        };

        // Curso 2: Lash Lifting Profesional (completado hace 1 mes)
        const fecha2 = new Date();
        fecha2.setMonth(fecha2.getMonth() - 1);
        student.certificados[2] = {
            fecha: fecha2.toISOString(),
            descargado: false
        };

        // Curso 4: CURSO CAPPING POLYGEL (completado hace 3 semanas)
        const fecha4 = new Date();
        fecha4.setDate(fecha4.getDate() - 21);
        student.certificados[4] = {
            fecha: fecha4.toISOString(),
            descargado: false
        };

        // Curso 5: CURSO MANICURE BÁSICO (completado hace 1 semana)
        const fecha5 = new Date();
        fecha5.setDate(fecha5.getDate() - 7);
        student.certificados[5] = {
            fecha: fecha5.toISOString(),
            descargado: false
        };

        // Guardar los cambios
        CursosData.saveStudent(student);
    }

    // Agregar certificados de demo al cargar la página
    agregarCertificadosDemo();

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

        // Verificar que pdfMake esté disponible
        if (typeof pdfMake === 'undefined') {
            console.error('pdfMake no está disponible');
            alert('Error: El generador de PDF no está disponible. Por favor, recarga la página.');
            return;
        }

        // Verificar que CertificateGenerator esté disponible
        if (!window.CertificateGenerator) {
            console.error('CertificateGenerator no está disponible');
            alert('Error: El generador de certificados no está disponible. Por favor, recarga la página.');
            return;
        }

        // Obtener datos del estudiante y curso
        const student = CursosData.getStudentData();
        if (!student) {
            console.error('No se pudo obtener los datos del estudiante');
            alert('Error: No se pudieron obtener tus datos. Por favor, recarga la página.');
            return;
        }

        const curso = CursosData.getCurso(cursoId);
        if (!curso) {
            console.error('No se encontró el curso con ID:', cursoId);
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
            alert('Error al generar el certificado: ' + resultado.error);
        }
    } catch (error) {
        alert('Error al generar el certificado: ' + error.message);
    }
}