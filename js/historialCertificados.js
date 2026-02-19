// js/historialCertificados.js
// Carga y muestra los certificados del alumno desde Supabase

import { CursosData } from './cursosData.js';

document.addEventListener('DOMContentLoaded', async function() {

    const container = document.getElementById('certificados-container');
    const noCertsMsg = document.getElementById('no-certs-message');

    // Mostrar loading mientras se cargan los datos
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border" style="color: #8A835A;" role="status"></div>
                <p class="mt-3" style="color: #8A835A;">Cargando certificados...</p>
            </div>
        `;
    }

    // Inicializar CursosData y cargar datos del estudiante desde Supabase
    try {
        await CursosData.init();
        await CursosData.initStudent();
    } catch (error) {
        console.error('Error al inicializar datos:', error);
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fa-solid fa-triangle-exclamation fa-3x mb-3" style="color: #8A835A;"></i>
                    <p style="color: #8A835A;">Error al cargar los datos. Intenta recargar la página.</p>
                </div>
            `;
        }
        return;
    }

    // FUNCIÓN PARA OBTENER CERTIFICADOS DESDE SUPABASE
    function obtenerCertificados() {
        const certificados = CursosData.getCertificados();
        const certificadosData = [];

        if (certificados && Object.keys(certificados).length > 0) {
            Object.keys(certificados).forEach(cursoId => {
                const certInfo = certificados[cursoId];

                // Usar datos snapshot del certificado (Supabase)
                const nombreCurso = certInfo.nombreCursoSnapshot
                    || CursosData.getCurso(cursoId)?.nombre
                    || 'Curso';

                const codigo = certInfo.codigo
                    || window.CertificateGenerator?.generarCodigoCertificado(cursoId, CursosData.getCurrentUserId());

                const fechaFormateada = window.CertificateGenerator
                    ? window.CertificateGenerator.formatearFecha(certInfo.fecha)
                    : new Date(certInfo.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    });

                certificadosData.push({
                    id: cursoId,
                    curso: nombreCurso,
                    alumno: certInfo.nombreAlumnoSnapshot || '',
                    instructor: 'Equipo KikiBrows',
                    fecha: fechaFormateada,
                    codigo: codigo
                });
            });
        }

        return certificadosData;
    }

    // FUNCIÓN PARA RENDERIZAR TARJETAS
    function cargarCertificados() {
        if (!container) return;

        const certificadosData = obtenerCertificados();

        // Limpiar loading
        container.innerHTML = '';

        if (certificadosData.length === 0) {
            if (noCertsMsg) noCertsMsg.classList.remove('d-none');
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
                                <small class="text-muted fst-italic">Cod: ${cert.codigo}</small>
                            </div>

                            <div class="cert-actions">
                                <button class="btn-kiki-primary" data-action="ver" data-curso-id="${cert.id}">
                                    <i class="fa-regular fa-eye me-2"></i>Ver
                                </button>
                                <button class="btn-kiki-outline" data-action="descargar" data-curso-id="${cert.id}">
                                    <i class="fa-solid fa-download me-2"></i>Descargar
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

        // Event delegation para botones
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const cursoId = btn.getAttribute('data-curso-id');

            if (action === 'ver') {
                verCertificado(cursoId);
            } else if (action === 'descargar') {
                descargarCertificado(cursoId);
            }
        });
    }

    // Ejecutar carga de certificados
    cargarCertificados();
});

// Funciones globales para compatibilidad con onclick
function verCertificado(id) {
    window.location.href = `claseAlumn.html?curso=${id}&showCertificate=true`;
}
window.verCertificado = verCertificado;

async function descargarCertificado(cursoId) {
    try {
        console.log('Descargando PDF de certificado para curso:', cursoId);

        if (typeof pdfMake === 'undefined') {
            alert('Error: El generador de PDF no esta disponible. Por favor, recarga la pagina.');
            return;
        }

        if (!window.CertificateGenerator) {
            alert('Error: El generador de certificados no esta disponible. Por favor, recarga la pagina.');
            return;
        }

        // Leer certificado existente de Supabase (solo lectura, ya fue generado al completar)
        const certInfo = CursosData.getCertificado(cursoId);
        if (!certInfo || !certInfo.fromSupabase) {
            alert('El certificado aun no ha sido generado.');
            return;
        }

        // Usar datos snapshot inmutables del certificado
        const partes = certInfo.nombreAlumnoSnapshot.split(' ');

        const datosCertificado = {
            nombreAlumno: partes[0] || 'Estudiante',
            apellidoAlumno: partes.slice(1).join(' ') || '',
            nombreCurso: certInfo.nombreCursoSnapshot,
            fechaCompletado: window.CertificateGenerator.formatearFecha(certInfo.fecha),
            codigoCertificado: certInfo.codigo,
            nombreInstructor: 'Equipo KikiBrows'
        };

        console.log('Generando PDF con datos snapshot:', datosCertificado);

        const resultado = await window.CertificateGenerator.generarCertificado(datosCertificado);

        if (!resultado.success) {
            alert('Error al generar el certificado: ' + resultado.error);
        }
    } catch (error) {
        console.error('Error al descargar certificado:', error);
        alert('Error al generar el certificado: ' + error.message);
    }
}
window.descargarCertificado = descargarCertificado;
