// js/coursePreviewModal.js - Modal de Preview de Cursos para Landing

// Datos de cursos del landing (mock data)
const cursosLanding = {
    1: {
        id: 1,
        nombre: 'CURSO CAPPING POLYGEL',
        descripcion: 'Aprende técnicas avanzadas de capping con polygel. Domina el arte de las uñas profesionales con nuestro curso completo que incluye técnicas de aplicación, diseño y cuidado. Ideal tanto para principiantes como para profesionales que buscan perfeccionar sus habilidades.',
        precio: 99990,
        modulos: [
            {
                nombre: 'Introducción al Capping Polygel',
                clases: [
                    { nombre: 'Historia y evolución del polygel', duracion: 15 },
                    { nombre: 'Materiales y herramientas necesarias', duracion: 20 },
                    { nombre: 'Preparación de uñas naturales', duracion: 25 },
                    { nombre: 'Seguridad e higiene', duracion: 10 }
                ]
            },
            {
                nombre: 'Técnicas de Aplicación',
                clases: [
                    { nombre: 'Aplicación básica de polygel', duracion: 30 },
                    { nombre: 'Técnicas de esculpido', duracion: 35 },
                    { nombre: 'Extensiones con moldes', duracion: 40 },
                    { nombre: 'Reparación y relleno', duracion: 25 }
                ]
            },
            {
                nombre: 'Diseño y Acabado',
                clases: [
                    { nombre: 'Diseños básicos y avanzados', duracion: 30 },
                    { nombre: 'Decoración y nail art', duracion: 35 },
                    { nombre: 'Acabado perfecto', duracion: 20 },
                    { nombre: 'Mantenimiento y cuidados', duracion: 15 }
                ]
            }
        ]
    },
    2: {
        id: 2,
        nombre: 'CURSO MANICURE BÁSICO',
        descripcion: 'Domina las técnicas fundamentales de manicure desde cero. Este curso te enseñará todo lo necesario para realizar manicures profesionales, desde la preparación hasta el acabado perfecto. Incluye técnicas de esmaltado, cuidado de cutículas y tratamientos básicos.',
        precio: 79990,
        modulos: [
            {
                nombre: 'Fundamentos del Manicure',
                clases: [
                    { nombre: 'Introducción al manicure profesional', duracion: 12 },
                    { nombre: 'Anatomía de las uñas', duracion: 18 },
                    { nombre: 'Herramientas esenciales', duracion: 15 },
                    { nombre: 'Protocolos de higiene', duracion: 10 }
                ]
            },
            {
                nombre: 'Técnicas de Preparación',
                clases: [
                    { nombre: 'Limado y formado de uñas', duracion: 25 },
                    { nombre: 'Cuidado de cutículas', duracion: 20 },
                    { nombre: 'Preparación de la superficie', duracion: 15 },
                    { nombre: 'Baño de parafina', duracion: 20 }
                ]
            },
            {
                nombre: 'Esmaltado y Acabado',
                clases: [
                    { nombre: 'Técnicas de esmaltado básico', duracion: 25 },
                    { nombre: 'Esmaltado permanente', duracion: 30 },
                    { nombre: 'Decoración simple', duracion: 20 },
                    { nombre: 'Finalización y secado', duracion: 15 }
                ]
            }
        ]
    },
    3: {
        id: 3,
        nombre: 'CURSO NAIL ART',
        descripcion: 'Crea diseños artísticos profesionales en uñas. Desarrolla tu creatividad y aprende las técnicas más populares de nail art, desde diseños simples hasta creaciones complejas. Incluye uso de diferentes materiales, técnicas de pintura y decoración.',
        precio: 89990,
        modulos: [
            {
                nombre: 'Introducción al Nail Art',
                clases: [
                    { nombre: 'Historia del nail art', duracion: 10 },
                    { nombre: 'Teoría del color aplicada', duracion: 20 },
                    { nombre: 'Materiales y pinceles', duracion: 18 },
                    { nombre: 'Preparación de workspace', duracion: 12 }
                ]
            },
            {
                nombre: 'Técnicas Básicas',
                clases: [
                    { nombre: 'Diseños con puntero', duracion: 25 },
                    { nombre: 'Degradados y ombré', duracion: 30 },
                    { nombre: 'Estampado y sellos', duracion: 25 },
                    { nombre: 'Uso de stickers y calcomanías', duracion: 20 }
                ]
            },
            {
                nombre: 'Técnicas Avanzadas',
                clases: [
                    { nombre: 'Pintura a mano alzada', duracion: 40 },
                    { nombre: 'Diseños 3D', duracion: 35 },
                    { nombre: 'Aplicación de cristales', duracion: 30 },
                    { nombre: 'Diseños temáticos', duracion: 35 }
                ]
            }
        ]
    },
    4: {
        id: 4,
        nombre: 'CURSO PEDICURE PROFESIONAL',
        descripcion: 'Técnicas completas de pedicure y cuidado de pies. Aprende a realizar tratamientos profesionales de pies, incluyendo limpieza profunda, tratamiento de callosidades, masajes y esmaltado. Perfecto para ofrecer un servicio completo de pedicure.',
        precio: 84990,
        modulos: [
            {
                nombre: 'Fundamentos del Pedicure',
                clases: [
                    { nombre: 'Anatomía del pie', duracion: 20 },
                    { nombre: 'Herramientas profesionales', duracion: 18 },
                    { nombre: 'Higiene y desinfección', duracion: 15 },
                    { nombre: 'Evaluación del cliente', duracion: 12 }
                ]
            },
            {
                nombre: 'Técnicas de Tratamiento',
                clases: [
                    { nombre: 'Baño y exfoliación de pies', duracion: 25 },
                    { nombre: 'Tratamiento de cutículas', duracion: 20 },
                    { nombre: 'Eliminación de callosidades', duracion: 30 },
                    { nombre: 'Masaje de pies y pantorrillas', duracion: 35 }
                ]
            },
            {
                nombre: 'Acabado Profesional',
                clases: [
                    { nombre: 'Limado y formado de uñas', duracion: 20 },
                    { nombre: 'Esmaltado de uñas de pies', duracion: 25 },
                    { nombre: 'Hidratación profunda', duracion: 20 },
                    { nombre: 'Mantenimiento y consejos', duracion: 15 }
                ]
            }
        ]
    },
    5: {
        id: 5,
        nombre: 'CURSO UÑAS ACRÍLICAS',
        descripcion: 'Especialízate en aplicación de uñas acrílicas. Domina la técnica del acrílico desde lo básico hasta diseños avanzados. Aprende a realizar extensiones, rellenos, diseños con acrílico de colores y mantenimiento profesional.',
        precio: 94990,
        modulos: [
            {
                nombre: 'Introducción al Acrílico',
                clases: [
                    { nombre: 'Química del acrílico', duracion: 15 },
                    { nombre: 'Productos y materiales', duracion: 20 },
                    { nombre: 'Preparación de uñas', duracion: 25 },
                    { nombre: 'Seguridad en el trabajo', duracion: 15 }
                ]
            },
            {
                nombre: 'Técnicas de Aplicación',
                clases: [
                    { nombre: 'Aplicación básica de acrílico', duracion: 35 },
                    { nombre: 'Extensiones con tips', duracion: 40 },
                    { nombre: 'Esculpido con moldes', duracion: 45 },
                    { nombre: 'Creación de apex perfecto', duracion: 30 }
                ]
            },
            {
                nombre: 'Mantenimiento y Diseño',
                clases: [
                    { nombre: 'Rellenos profesionales', duracion: 35 },
                    { nombre: 'Reparación de uñas', duracion: 25 },
                    { nombre: 'Acrílico de colores', duracion: 30 },
                    { nombre: 'Diseños encapsulados', duracion: 35 }
                ]
            }
        ]
    },
    6: {
        id: 6,
        nombre: 'CURSO GEL UV AVANZADO',
        descripcion: 'Técnicas avanzadas con gel UV profesional. Perfecciona tus habilidades con gel UV y aprende técnicas profesionales de aplicación, extensión y diseño. Incluye trabajo con diferentes tipos de gel y técnicas de esculpido avanzadas.',
        precio: 92990,
        modulos: [
            {
                nombre: 'Fundamentos del Gel UV',
                clases: [
                    { nombre: 'Tipos de gel UV', duracion: 18 },
                    { nombre: 'Equipamiento necesario', duracion: 15 },
                    { nombre: 'Preparación profesional', duracion: 20 },
                    { nombre: 'Seguridad y buenas prácticas', duracion: 12 }
                ]
            },
            {
                nombre: 'Técnicas de Aplicación',
                clases: [
                    { nombre: 'Esmaltado semipermanente', duracion: 30 },
                    { nombre: 'Extensiones con gel', duracion: 40 },
                    { nombre: 'Esculpido con moldes', duracion: 45 },
                    { nombre: 'Overlay y refuerzo', duracion: 30 }
                ]
            },
            {
                nombre: 'Diseños Avanzados',
                clases: [
                    { nombre: 'Gel de construcción', duracion: 35 },
                    { nombre: 'French avanzado', duracion: 30 },
                    { nombre: 'Encapsulado con gel', duracion: 35 },
                    { nombre: 'Efectos especiales', duracion: 30 }
                ]
            }
        ]
    }
};

// Función para formatear precio en CLP
function formatearPrecio(precio) {
    return `$${precio.toLocaleString('es-CL')}`;
}

// Función para calcular duración total del curso
function calcularDuracionTotal(modulos) {
    let totalMinutos = 0;
    modulos.forEach(modulo => {
        modulo.clases.forEach(clase => {
            totalMinutos += clase.duracion;
        });
    });

    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;

    if (horas === 0) {
        return `${minutos} minutos`;
    } else if (minutos === 0) {
        return `${horas}h`;
    } else {
        return `${horas}h ${minutos}min`;
    }
}

// Función para cargar el contenido del curso en el modal
function cargarCursoEnModal(cursoId) {
    const curso = cursosLanding[cursoId];

    if (!curso) {
        console.error('Curso no encontrado:', cursoId);
        return;
    }

    // Actualizar título
    document.getElementById('coursePreviewModalLabel').textContent = curso.nombre;

    // Actualizar descripción
    document.getElementById('courseDescription').textContent = curso.descripcion;

    // Actualizar duración
    document.getElementById('courseDuration').textContent = calcularDuracionTotal(curso.modulos);

    // Actualizar número de módulos
    const totalClases = curso.modulos.reduce((total, modulo) => total + modulo.clases.length, 0);
    document.getElementById('courseModules').textContent = `${curso.modulos.length} módulos · ${totalClases} clases`;

    // Actualizar precio
    document.getElementById('coursePrice').textContent = formatearPrecio(curso.precio);

    // Generar lista de contenido
    const contentList = document.getElementById('courseContentList');
    contentList.innerHTML = '';

    curso.modulos.forEach((modulo, index) => {
        const moduloDiv = document.createElement('div');
        moduloDiv.className = 'modulo-preview mb-3';

        const moduloDuracion = modulo.clases.reduce((total, clase) => total + clase.duracion, 0);

        moduloDiv.innerHTML = `
            <div class="modulo-preview-header" data-bs-toggle="collapse" data-bs-target="#modulo${index}" aria-expanded="${index === 0 ? 'true' : 'false'}">
                <div class="modulo-preview-title">
                    <i class="fas fa-book me-2"></i>
                    <strong>Módulo ${index + 1}:</strong> ${modulo.nombre}
                </div>
                <div class="modulo-preview-meta">
                    <span class="text-muted">${modulo.clases.length} clases · ${moduloDuracion} min</span>
                    <i class="fas fa-chevron-down ms-2"></i>
                </div>
            </div>
            <div class="collapse ${index === 0 ? 'show' : ''}" id="modulo${index}">
                <div class="modulo-preview-body">
                    ${modulo.clases.map((clase, claseIndex) => `
                        <div class="clase-preview-item">
                            <i class="fas fa-play-circle me-2"></i>
                            <span class="clase-preview-name">${claseIndex + 1}. ${clase.nombre}</span>
                            <span class="clase-preview-duration text-muted">${clase.duracion} min</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        contentList.appendChild(moduloDiv);
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const botonesVer = document.querySelectorAll('.btn-ver-curso');
    const modalElement = document.getElementById('coursePreviewModal');

    if (!modalElement) {
        console.error('Modal element not found');
        return;
    }

    botonesVer.forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const card = e.target.closest('.producto-card');
            if (!card) {
                console.error('Producto card not found');
                return;
            }

            const cursoId = parseInt(card.dataset.cursoId);

            // Cargar el contenido del curso
            cargarCursoEnModal(cursoId);

            // Crear y mostrar el modal
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        });
    });

    console.log(`${botonesVer.length} botones "Ver" configurados correctamente`);
});
