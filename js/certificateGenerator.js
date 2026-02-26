// js/certificateGenerator.js
// Servicio de generación de certificados en PDF

class CertificateGenerator {
    constructor() {
        // Verifica que pdfMake esté disponible
        if (typeof pdfMake === 'undefined') {
            console.error('pdfMake no está cargado. Asegúrate de incluir las librerías necesarias.');
        }
    }

    /**
     * Genera y descarga un certificado en PDF
     * @param {Object} data - Datos para el certificado
     * @param {string} data.nombreAlumno - Nombre del alumno
     * @param {string} data.apellidoAlumno - Apellido del alumno
     * @param {string} data.nombreCurso - Nombre del curso
     * @param {string} data.fechaCompletado - Fecha de completación (formato legible)
     * @param {string} data.codigoCertificado - Código único del certificado
     */
    async generarCertificado(data) {
        try {
            console.log('CertificateGenerator.generarCertificado llamado con datos:', data);

            // Verificar que pdfMake esté disponible
            if (typeof pdfMake === 'undefined') {
                throw new Error('pdfMake no está cargado. Verifica que las librerías estén incluidas en el HTML.');
            }

            const {
                nombreAlumno,
                apellidoAlumno,
                nombreCurso,
                fechaCompletado,
                codigoCertificado
            } = data;

            // Validar datos requeridos
            if (!nombreAlumno || !nombreCurso) {
                throw new Error('Faltan datos requeridos para generar el certificado');
            }

            // Crear el nombre completo de forma inteligente para evitar duplicar el apellido
            // Si nombreAlumno ya contiene el apellido, no lo volvemos a sumar
            let nombreCompleto = nombreAlumno || 'Estudiante';
            if (apellidoAlumno && !nombreCompleto.toLowerCase().includes(apellidoAlumno.toLowerCase())) {
                nombreCompleto = `${nombreCompleto} ${apellidoAlumno}`;
            }

            // Definición del documento PDF
            const documentDefinition = {
                pageSize: 'A4',
                pageOrientation: 'landscape',
                pageMargins: [40, 60, 40, 60],

                // Fondo y diseño
                background: function(currentPage, pageSize) {
                    return [
                        // Fondo beige claro
                        {
                            canvas: [
                                {
                                    type: 'rect',
                                    x: 0,
                                    y: 0,
                                    w: pageSize.width,
                                    h: pageSize.height,
                                    color: '#F0EAE0'
                                }
                            ]
                        },
                        // Borde decorativo
                        {
                            canvas: [
                                {
                                    type: 'rect',
                                    x: 30,
                                    y: 30,
                                    w: pageSize.width - 60,
                                    h: pageSize.height - 60,
                                    lineWidth: 3,
                                    lineColor: '#8A835A'
                                }
                            ]
                        },
                        // Borde decorativo interior
                        {
                            canvas: [
                                {
                                    type: 'rect',
                                    x: 35,
                                    y: 35,
                                    w: pageSize.width - 70,
                                    h: pageSize.height - 70,
                                    lineWidth: 1,
                                    lineColor: '#D8B6B1'
                                }
                            ]
                        }
                    ];
                },

                content: [
                    // Logo y encabezado
                    {
                        text: 'KIKI BROWS',
                        style: 'header',
                        alignment: 'center',
                        margin: [0, 20, 0, 10]
                    },
                    {
                        text: 'EST. 2021',
                        style: 'subheader',
                        alignment: 'center',
                        margin: [0, 0, 0, 30]
                    },

                    // Título del certificado
                    {
                        text: 'CERTIFICADO DE FINALIZACIÓN',
                        style: 'title',
                        alignment: 'center',
                        margin: [0, 0, 0, 30]
                    },

                    // Texto de presentación
                    {
                        text: 'Por medio de la presente certificamos que',
                        style: 'normalText',
                        alignment: 'center',
                        margin: [0, 0, 0, 15]
                    },

                    // Nombre del alumno
                    {
                        text: nombreCompleto.toUpperCase(),
                        style: 'studentName',
                        alignment: 'center',
                        margin: [0, 0, 0, 15]
                    },

                    // Texto del curso
                    {
                        text: 'ha completado satisfactoriamente el curso',
                        style: 'normalText',
                        alignment: 'center',
                        margin: [0, 0, 0, 15]
                    },

                    // Nombre del curso
                    {
                        text: nombreCurso,
                        style: 'courseName',
                        alignment: 'center',
                        margin: [0, 0, 0, 40] // Margen ajustado al remover la firma
                    },

                    // Fecha y código (Alineados al centro como bloque final)
                    {
                        columns: [
                            {
                                width: '50%',
                                text: [
                                    { text: 'Fecha de completación:\n', style: 'footerLabel' },
                                    { text: fechaCompletado, style: 'footerText' }
                                ],
                                alignment: 'center'
                            },
                            {
                                width: '50%',
                                text: [
                                    { text: 'Código del certificado:\n', style: 'footerLabel' },
                                    { text: codigoCertificado, style: 'footerText' }
                                ],
                                alignment: 'center'
                            }
                        ]
                    }
                ],

                // Estilos
                styles: {
                    header: {
                        fontSize: 32,
                        bold: true,
                        color: '#8A835A',
                        letterSpacing: 8
                    },
                    subheader: {
                        fontSize: 10,
                        color: '#8A835A',
                        letterSpacing: 3
                    },
                    title: {
                        fontSize: 24,
                        bold: true,
                        color: '#8A835A',
                        letterSpacing: 4
                    },
                    normalText: {
                        fontSize: 12,
                        color: '#333333'
                    },
                    studentName: {
                        fontSize: 26,
                        bold: true,
                        color: '#8A835A',
                        decoration: 'underline',
                        decorationColor: '#D8B6B1'
                    },
                    courseName: {
                        fontSize: 18,
                        bold: true,
                        italics: true,
                        color: '#D8B6B1'
                    },
                    decoration: {
                        fontSize: 16,
                        color: '#D8B6B1'
                    },
                    footerLabel: {
                        fontSize: 9,
                        color: '#666666',
                        bold: true
                    },
                    footerText: {
                        fontSize: 10,
                        color: '#333333'
                    }
                }
            };

            // Generar y descargar el PDF
            console.log('Creando documento PDF con pdfMake...');
            const pdfDocGenerator = pdfMake.createPdf(documentDefinition);

            // Generar nombre de archivo sin caracteres raros
            const fileName = `Certificado_${nombreCurso.replace(/\s+/g, '_')}_${nombreCompleto.replace(/\s+/g, '_')}.pdf`;

            console.log('Descargando PDF con nombre:', fileName);

            // Descargar el PDF
            pdfDocGenerator.download(fileName);

            console.log('Descarga iniciada exitosamente');

            return {
                success: true,
                fileName: fileName
            };

        } catch (error) {
            console.error('Error al generar certificado:', error);
            console.error('Stack trace:', error.stack);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Genera un código único para el certificado
     * @param {number} cursoId - ID del curso
     * @param {number} userId - ID del usuario
     * @returns {string} Código del certificado
     */
    generarCodigoCertificado(cursoId, userId) {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const codigo = `KB-${año}-${String(cursoId).padStart(3, '0')}-${String(userId).padStart(3, '0')}`;
        return codigo;
    }

    /**
     * Formatea una fecha para el certificado
     * @param {string|Date} fecha - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    formatearFecha(fecha) {
        const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
        const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('es-ES', opciones);
    }
}

// Exportar instancia única
window.CertificateGenerator = new CertificateGenerator();