// js/cursosData.js - Sistema de datos compartido para cursos (simula backend)
// Este archivo maneja el almacenamiento y recuperación de datos de cursos

const CursosData = {
    
    // Clave para localStorage
    STORAGE_KEY: 'kikibrows_cursos',
    
    // Datos de ejemplo iniciales
    defaultData: {
        cursos: {
            1: {
                id: 1,
                nombre: 'Microblading Básico',
                descripcion: 'Aprende las técnicas fundamentales del microblading desde cero. Este curso te guiará paso a paso desde los conceptos básicos hasta las técnicas avanzadas de diseño y aplicación.',
                precio: 150000,
                estado: 'publicado',
                fechaCreacion: '2024-01-15',
                duracionAcceso: 180, // días de acceso desde la compra
                instructor: 'Daniela Candi',
                portada: null,
                video: null,
                carrusel: true,
                carruselPosicion: 1,
                modulos: [1, 2, 3]
            },
            2: {
                id: 2,
                nombre: 'Lash Lifting Profesional',
                descripcion: 'Domina el arte del lifting de pestañas con técnicas avanzadas y productos de alta calidad.',
                precio: 120000,
                estado: 'publicado',
                fechaCreacion: '2024-02-20',
                duracionAcceso: 180, // días de acceso desde la compra
                instructor: 'Equipo KikiBrows',
                portada: null,
                video: null,
                carrusel: false,
                carruselPosicion: null,
                modulos: [4, 5]
            },
            3: {
                id: 3,
                nombre: 'Diseño de Cejas',
                descripcion: 'Técnicas de diseño y visagismo para cejas perfectas adaptadas a cada rostro.',
                precio: 80000,
                estado: 'borrador',
                fechaCreacion: '2024-03-10',
                duracionAcceso: 90, // días de acceso desde la compra
                instructor: 'Daniela Candi',
                portada: null,
                video: null,
                carrusel: false,
                carruselPosicion: null,
                modulos: [6]
            },
            4: {
                id: 4,
                nombre: 'CURSO CAPPING POLYGEL',
                descripcion: 'Aprende técnicas avanzadas de capping con polygel. Domina el arte de las uñas profesionales con nuestro curso completo que incluye técnicas de aplicación, diseño y cuidado. Ideal tanto para principiantes como para profesionales que buscan perfeccionar sus habilidades.',
                precio: 99990,
                estado: 'publicado',
                fechaCreacion: '2024-04-01',
                duracionAcceso: 180,
                instructor: 'Equipo KikiBrows',
                portada: null,
                video: null,
                carrusel: true,
                carruselPosicion: 2,
                modulos: [7, 8, 9]
            },
            5: {
                id: 5,
                nombre: 'CURSO MANICURE BÁSICO',
                descripcion: 'Domina las técnicas fundamentales de manicure desde cero. Este curso te enseñará todo lo necesario para realizar manicures profesionales, desde la preparación hasta el acabado perfecto. Incluye técnicas de esmaltado, cuidado de cutículas y tratamientos básicos.',
                precio: 79990,
                estado: 'publicado',
                fechaCreacion: '2024-04-05',
                duracionAcceso: 180,
                instructor: 'Equipo KikiBrows',
                portada: null,
                video: null,
                carrusel: true,
                carruselPosicion: 3,
                modulos: [10, 11, 12]
            },
            6: {
                id: 6,
                nombre: 'CURSO NAIL ART',
                descripcion: 'Crea diseños artísticos profesionales en uñas. Desarrolla tu creatividad y aprende las técnicas más populares de nail art, desde diseños simples hasta creaciones complejas. Incluye uso de diferentes materiales, técnicas de pintura y decoración.',
                precio: 89990,
                estado: 'publicado',
                fechaCreacion: '2024-04-10',
                duracionAcceso: 180,
                instructor: 'Equipo KikiBrows',
                portada: null,
                video: null,
                carrusel: true,
                carruselPosicion: 4,
                modulos: [13, 14, 15]
            },
            7: {
                id: 7,
                nombre: 'CURSO PEDICURE PROFESIONAL',
                descripcion: 'Técnicas completas de pedicure y cuidado de pies. Aprende a realizar tratamientos profesionales de pies, incluyendo limpieza profunda, tratamiento de callosidades, masajes y esmaltado. Perfecto para ofrecer un servicio completo de pedicure.',
                precio: 84990,
                instructor: 'Equipo KikiBrows',
                estado: 'publicado',
                fechaCreacion: '2024-04-15',
                duracionAcceso: 180,
                portada: null,
                video: null,
                carrusel: false,
                carruselPosicion: null,
                modulos: [16, 17, 18]
            },
            8: {
                id: 8,
                nombre: 'CURSO UÑAS ACRÍLICAS',
                descripcion: 'Especialízate en aplicación de uñas acrílicas. Domina la técnica del acrílico desde lo básico hasta diseños avanzados. Aprende a realizar extensiones, rellenos, diseños con acrílico de colores y mantenimiento profesional.',
                precio: 94990,
                estado: 'publicado',
                fechaCreacion: '2024-04-20',
                duracionAcceso: 180,
                instructor: 'Equipo KikiBrows',
                portada: null,
                video: null,
                carrusel: true,
                carruselPosicion: 5,
                modulos: [19, 20, 21]
            },
            9: {
                id: 9,
                nombre: 'CURSO GEL UV AVANZADO',
                descripcion: 'Técnicas avanzadas con gel UV profesional. Perfecciona tus habilidades con gel UV y aprende técnicas profesionales de aplicación, extensión y diseño. Incluye trabajo con diferentes tipos de gel y técnicas de esculpido avanzadas.',
                precio: 92990,
                estado: 'publicado',
                fechaCreacion: '2024-04-25',
                duracionAcceso: 180,
                portada: null,
                video: null,
                carrusel: true,
                carruselPosicion: 6,
                modulos: [22, 23, 24]
            }
        },
        modulos: {
            1: {
                id: 1,
                cursoId: 1,
                nombre: 'Introducción al Microblading',
                descripcion: 'Conoce los fundamentos y la historia de esta técnica revolucionaria.',
                orden: 1,
                clases: [1, 2, 3, 4]
            },
            2: {
                id: 2,
                cursoId: 1,
                nombre: 'Herramientas y Materiales',
                descripcion: 'Todo sobre los instrumentos necesarios para el microblading.',
                orden: 2,
                clases: [5, 6, 7]
            },
            3: {
                id: 3,
                cursoId: 1,
                nombre: 'Técnicas de Trazado',
                descripcion: 'Aprende las diferentes técnicas de trazado pelo a pelo.',
                orden: 3,
                clases: [8, 9, 10, 11, 12]
            },
            4: {
                id: 4,
                cursoId: 2,
                nombre: 'Fundamentos del Lash Lifting',
                descripcion: 'Introducción a la técnica de lifting de pestañas.',
                orden: 1,
                clases: [13, 14, 15]
            },
            5: {
                id: 5,
                cursoId: 2,
                nombre: 'Aplicación Práctica',
                descripcion: 'Paso a paso del procedimiento completo.',
                orden: 2,
                clases: [16, 17]
            },
            6: {
                id: 6,
                cursoId: 3,
                nombre: 'Visagismo y Diseño',
                descripcion: 'Principios de visagismo aplicados al diseño de cejas.',
                orden: 1,
                clases: [18, 19, 20]
            },
            // Módulos del curso 4: CAPPING POLYGEL
            7: {
                id: 7,
                cursoId: 4,
                nombre: 'Introducción al Capping Polygel',
                descripcion: 'Fundamentos y conceptos básicos del capping polygel.',
                orden: 1,
                clases: [21, 22, 23, 24]
            },
            8: {
                id: 8,
                cursoId: 4,
                nombre: 'Técnicas de Aplicación',
                descripcion: 'Técnicas profesionales de aplicación de polygel.',
                orden: 2,
                clases: [25, 26, 27, 28]
            },
            9: {
                id: 9,
                cursoId: 4,
                nombre: 'Diseño y Acabado',
                descripcion: 'Diseños y acabados profesionales con polygel.',
                orden: 3,
                clases: [29, 30, 31, 32]
            },
            // Módulos del curso 5: MANICURE BÁSICO
            10: {
                id: 10,
                cursoId: 5,
                nombre: 'Fundamentos del Manicure',
                descripcion: 'Conceptos básicos del manicure profesional.',
                orden: 1,
                clases: [33, 34, 35, 36]
            },
            11: {
                id: 11,
                cursoId: 5,
                nombre: 'Técnicas de Preparación',
                descripcion: 'Preparación de uñas y técnicas básicas.',
                orden: 2,
                clases: [37, 38, 39, 40]
            },
            12: {
                id: 12,
                cursoId: 5,
                nombre: 'Esmaltado y Acabado',
                descripcion: 'Técnicas de esmaltado y acabado perfecto.',
                orden: 3,
                clases: [41, 42, 43, 44]
            },
            // Módulos del curso 6: NAIL ART
            13: {
                id: 13,
                cursoId: 6,
                nombre: 'Introducción al Nail Art',
                descripcion: 'Fundamentos del arte en uñas.',
                orden: 1,
                clases: [45, 46, 47, 48]
            },
            14: {
                id: 14,
                cursoId: 6,
                nombre: 'Técnicas Básicas',
                descripcion: 'Técnicas básicas de nail art.',
                orden: 2,
                clases: [49, 50, 51, 52]
            },
            15: {
                id: 15,
                cursoId: 6,
                nombre: 'Técnicas Avanzadas',
                descripcion: 'Técnicas avanzadas de nail art.',
                orden: 3,
                clases: [53, 54, 55, 56]
            },
            // Módulos del curso 7: PEDICURE PROFESIONAL
            16: {
                id: 16,
                cursoId: 7,
                nombre: 'Fundamentos del Pedicure',
                descripcion: 'Bases del pedicure profesional.',
                orden: 1,
                clases: [57, 58, 59, 60]
            },
            17: {
                id: 17,
                cursoId: 7,
                nombre: 'Técnicas de Tratamiento',
                descripcion: 'Técnicas de tratamiento de pies.',
                orden: 2,
                clases: [61, 62, 63, 64]
            },
            18: {
                id: 18,
                cursoId: 7,
                nombre: 'Acabado Profesional',
                descripcion: 'Acabado profesional de pedicure.',
                orden: 3,
                clases: [65, 66, 67, 68]
            },
            // Módulos del curso 8: UÑAS ACRÍLICAS
            19: {
                id: 19,
                cursoId: 8,
                nombre: 'Introducción al Acrílico',
                descripcion: 'Fundamentos del trabajo con acrílico.',
                orden: 1,
                clases: [69, 70, 71, 72]
            },
            20: {
                id: 20,
                cursoId: 8,
                nombre: 'Técnicas de Aplicación',
                descripcion: 'Aplicación profesional de acrílico.',
                orden: 2,
                clases: [73, 74, 75, 76]
            },
            21: {
                id: 21,
                cursoId: 8,
                nombre: 'Mantenimiento y Diseño',
                descripcion: 'Mantenimiento y diseños con acrílico.',
                orden: 3,
                clases: [77, 78, 79, 80]
            },
            // Módulos del curso 9: GEL UV AVANZADO
            22: {
                id: 22,
                cursoId: 9,
                nombre: 'Fundamentos del Gel UV',
                descripcion: 'Fundamentos del trabajo con gel UV.',
                orden: 1,
                clases: [81, 82, 83, 84]
            },
            23: {
                id: 23,
                cursoId: 9,
                nombre: 'Técnicas de Aplicación',
                descripcion: 'Aplicación profesional de gel UV.',
                orden: 2,
                clases: [85, 86, 87, 88]
            },
            24: {
                id: 24,
                cursoId: 9,
                nombre: 'Diseños Avanzados',
                descripcion: 'Diseños avanzados con gel UV.',
                orden: 3,
                clases: [89, 90, 91, 92]
            }
        },
        clases: {
            // Módulo 1: Introducción al Microblading
            1: { id: 1, moduloId: 1, nombre: 'Historia y conceptos', tipo: 'video', duracion: 10, orden: 1 },
            2: { id: 2, moduloId: 1, nombre: 'Seguridad e higiene', tipo: 'video', duracion: 15, orden: 2 },
            3: { id: 3, moduloId: 1, nombre: 'Material de apoyo', tipo: 'pdf', duracion: 5, orden: 3 },
            4: { id: 4, moduloId: 1, nombre: 'Quiz: Conceptos básicos', tipo: 'quiz', duracion: 10, orden: 4 },
            
            // Módulo 2: Herramientas y Materiales
            5: { id: 5, moduloId: 2, nombre: 'Tipos de agujas', tipo: 'video', duracion: 12, orden: 1 },
            6: { id: 6, moduloId: 2, nombre: 'Pigmentos y colores', tipo: 'texto', duracion: 8, orden: 2 },
            7: { id: 7, moduloId: 2, nombre: 'Guía de materiales', tipo: 'pdf', duracion: 5, orden: 3 },
            
            // Módulo 3: Técnicas de Trazado
            8: { id: 8, moduloId: 3, nombre: 'Técnica básica de trazado', tipo: 'video', duracion: 20, orden: 1 },
            9: { id: 9, moduloId: 3, nombre: 'Patrones y direcciones', tipo: 'texto', duracion: 10, orden: 2 },
            10: { id: 10, moduloId: 3, nombre: 'Demostración práctica', tipo: 'video', duracion: 25, orden: 3 },
            11: { id: 11, moduloId: 3, nombre: 'Tu primer diseño', tipo: 'entrega', duracion: 30, orden: 4 },
            12: { id: 12, moduloId: 3, nombre: 'Evaluación del módulo', tipo: 'quiz', duracion: 15, orden: 5 },
            
            // Módulo 4: Lash Lifting
            13: { id: 13, moduloId: 4, nombre: 'Introducción al lifting', tipo: 'video', duracion: 10, orden: 1 },
            14: { id: 14, moduloId: 4, nombre: 'Productos necesarios', tipo: 'texto', duracion: 8, orden: 2 },
            15: { id: 15, moduloId: 4, nombre: 'Catálogo de productos', tipo: 'pdf', duracion: 5, orden: 3 },
            
            // Módulo 5: Aplicación Práctica
            16: { id: 16, moduloId: 5, nombre: 'Procedimiento paso a paso', tipo: 'video', duracion: 35, orden: 1 },
            17: { id: 17, moduloId: 5, nombre: 'Práctica en modelo', tipo: 'entrega', duracion: 45, orden: 2 },
            
            // Módulo 6: Visagismo
            18: { id: 18, moduloId: 6, nombre: 'Principios de visagismo', tipo: 'video', duracion: 15, orden: 1 },
            19: { id: 19, moduloId: 6, nombre: 'Formas de rostro', tipo: 'texto', duracion: 10, orden: 2 },
            20: { id: 20, moduloId: 6, nombre: 'Diseño personalizado', tipo: 'entrega', duracion: 20, orden: 3 },

            // Módulo 7: Introducción al Capping Polygel
            21: { id: 21, moduloId: 7, nombre: 'Historia y evolución del polygel', tipo: 'video', duracion: 15, orden: 1 },
            22: { id: 22, moduloId: 7, nombre: 'Materiales y herramientas necesarias', tipo: 'video', duracion: 20, orden: 2 },
            23: { id: 23, moduloId: 7, nombre: 'Preparación de uñas naturales', tipo: 'video', duracion: 25, orden: 3 },
            24: { id: 24, moduloId: 7, nombre: 'Seguridad e higiene', tipo: 'video', duracion: 10, orden: 4 },

            // Módulo 8: Técnicas de Aplicación (Polygel)
            25: { id: 25, moduloId: 8, nombre: 'Aplicación básica de polygel', tipo: 'video', duracion: 30, orden: 1 },
            26: { id: 26, moduloId: 8, nombre: 'Técnicas de esculpido', tipo: 'video', duracion: 35, orden: 2 },
            27: { id: 27, moduloId: 8, nombre: 'Extensiones con moldes', tipo: 'video', duracion: 40, orden: 3 },
            28: { id: 28, moduloId: 8, nombre: 'Reparación y relleno', tipo: 'video', duracion: 25, orden: 4 },

            // Módulo 9: Diseño y Acabado (Polygel)
            29: { id: 29, moduloId: 9, nombre: 'Diseños básicos y avanzados', tipo: 'video', duracion: 30, orden: 1 },
            30: { id: 30, moduloId: 9, nombre: 'Decoración y nail art', tipo: 'video', duracion: 35, orden: 2 },
            31: { id: 31, moduloId: 9, nombre: 'Acabado perfecto', tipo: 'video', duracion: 20, orden: 3 },
            32: { id: 32, moduloId: 9, nombre: 'Mantenimiento y cuidados', tipo: 'video', duracion: 15, orden: 4 },

            // Módulo 10: Fundamentos del Manicure
            33: { id: 33, moduloId: 10, nombre: 'Introducción al manicure profesional', tipo: 'video', duracion: 12, orden: 1 },
            34: { id: 34, moduloId: 10, nombre: 'Anatomía de las uñas', tipo: 'video', duracion: 18, orden: 2 },
            35: { id: 35, moduloId: 10, nombre: 'Herramientas esenciales', tipo: 'video', duracion: 15, orden: 3 },
            36: { id: 36, moduloId: 10, nombre: 'Protocolos de higiene', tipo: 'video', duracion: 10, orden: 4 },

            // Módulo 11: Técnicas de Preparación (Manicure)
            37: { id: 37, moduloId: 11, nombre: 'Limado y formado de uñas', tipo: 'video', duracion: 25, orden: 1 },
            38: { id: 38, moduloId: 11, nombre: 'Cuidado de cutículas', tipo: 'video', duracion: 20, orden: 2 },
            39: { id: 39, moduloId: 11, nombre: 'Preparación de la superficie', tipo: 'video', duracion: 15, orden: 3 },
            40: { id: 40, moduloId: 11, nombre: 'Baño de parafina', tipo: 'video', duracion: 20, orden: 4 },

            // Módulo 12: Esmaltado y Acabado
            41: { id: 41, moduloId: 12, nombre: 'Técnicas de esmaltado básico', tipo: 'video', duracion: 25, orden: 1 },
            42: { id: 42, moduloId: 12, nombre: 'Esmaltado permanente', tipo: 'video', duracion: 30, orden: 2 },
            43: { id: 43, moduloId: 12, nombre: 'Decoración simple', tipo: 'video', duracion: 20, orden: 3 },
            44: { id: 44, moduloId: 12, nombre: 'Finalización y secado', tipo: 'video', duracion: 15, orden: 4 },

            // Módulo 13: Introducción al Nail Art
            45: { id: 45, moduloId: 13, nombre: 'Historia del nail art', tipo: 'video', duracion: 10, orden: 1 },
            46: { id: 46, moduloId: 13, nombre: 'Teoría del color aplicada', tipo: 'video', duracion: 20, orden: 2 },
            47: { id: 47, moduloId: 13, nombre: 'Materiales y pinceles', tipo: 'video', duracion: 18, orden: 3 },
            48: { id: 48, moduloId: 13, nombre: 'Preparación de workspace', tipo: 'video', duracion: 12, orden: 4 },

            // Módulo 14: Técnicas Básicas (Nail Art)
            49: { id: 49, moduloId: 14, nombre: 'Diseños con puntero', tipo: 'video', duracion: 25, orden: 1 },
            50: { id: 50, moduloId: 14, nombre: 'Degradados y ombré', tipo: 'video', duracion: 30, orden: 2 },
            51: { id: 51, moduloId: 14, nombre: 'Estampado y sellos', tipo: 'video', duracion: 25, orden: 3 },
            52: { id: 52, moduloId: 14, nombre: 'Uso de stickers y calcomanías', tipo: 'video', duracion: 20, orden: 4 },

            // Módulo 15: Técnicas Avanzadas (Nail Art)
            53: { id: 53, moduloId: 15, nombre: 'Pintura a mano alzada', tipo: 'video', duracion: 40, orden: 1 },
            54: { id: 54, moduloId: 15, nombre: 'Diseños 3D', tipo: 'video', duracion: 35, orden: 2 },
            55: { id: 55, moduloId: 15, nombre: 'Aplicación de cristales', tipo: 'video', duracion: 30, orden: 3 },
            56: { id: 56, moduloId: 15, nombre: 'Diseños temáticos', tipo: 'video', duracion: 35, orden: 4 },

            // Módulo 16: Fundamentos del Pedicure
            57: { id: 57, moduloId: 16, nombre: 'Anatomía del pie', tipo: 'video', duracion: 20, orden: 1 },
            58: { id: 58, moduloId: 16, nombre: 'Herramientas profesionales', tipo: 'video', duracion: 18, orden: 2 },
            59: { id: 59, moduloId: 16, nombre: 'Higiene y desinfección', tipo: 'video', duracion: 15, orden: 3 },
            60: { id: 60, moduloId: 16, nombre: 'Evaluación del cliente', tipo: 'video', duracion: 12, orden: 4 },

            // Módulo 17: Técnicas de Tratamiento (Pedicure)
            61: { id: 61, moduloId: 17, nombre: 'Baño y exfoliación de pies', tipo: 'video', duracion: 25, orden: 1 },
            62: { id: 62, moduloId: 17, nombre: 'Tratamiento de cutículas', tipo: 'video', duracion: 20, orden: 2 },
            63: { id: 63, moduloId: 17, nombre: 'Eliminación de callosidades', tipo: 'video', duracion: 30, orden: 3 },
            64: { id: 64, moduloId: 17, nombre: 'Masaje de pies y pantorrillas', tipo: 'video', duracion: 35, orden: 4 },

            // Módulo 18: Acabado Profesional (Pedicure)
            65: { id: 65, moduloId: 18, nombre: 'Limado y formado de uñas', tipo: 'video', duracion: 20, orden: 1 },
            66: { id: 66, moduloId: 18, nombre: 'Esmaltado de uñas de pies', tipo: 'video', duracion: 25, orden: 2 },
            67: { id: 67, moduloId: 18, nombre: 'Hidratación profunda', tipo: 'video', duracion: 20, orden: 3 },
            68: { id: 68, moduloId: 18, nombre: 'Mantenimiento y consejos', tipo: 'video', duracion: 15, orden: 4 },

            // Módulo 19: Introducción al Acrílico
            69: { id: 69, moduloId: 19, nombre: 'Química del acrílico', tipo: 'video', duracion: 15, orden: 1 },
            70: { id: 70, moduloId: 19, nombre: 'Productos y materiales', tipo: 'video', duracion: 20, orden: 2 },
            71: { id: 71, moduloId: 19, nombre: 'Preparación de uñas', tipo: 'video', duracion: 25, orden: 3 },
            72: { id: 72, moduloId: 19, nombre: 'Seguridad en el trabajo', tipo: 'video', duracion: 15, orden: 4 },

            // Módulo 20: Técnicas de Aplicación (Acrílico)
            73: { id: 73, moduloId: 20, nombre: 'Aplicación básica de acrílico', tipo: 'video', duracion: 35, orden: 1 },
            74: { id: 74, moduloId: 20, nombre: 'Extensiones con tips', tipo: 'video', duracion: 40, orden: 2 },
            75: { id: 75, moduloId: 20, nombre: 'Esculpido con moldes', tipo: 'video', duracion: 45, orden: 3 },
            76: { id: 76, moduloId: 20, nombre: 'Creación de apex perfecto', tipo: 'video', duracion: 30, orden: 4 },

            // Módulo 21: Mantenimiento y Diseño (Acrílico)
            77: { id: 77, moduloId: 21, nombre: 'Rellenos profesionales', tipo: 'video', duracion: 35, orden: 1 },
            78: { id: 78, moduloId: 21, nombre: 'Reparación de uñas', tipo: 'video', duracion: 25, orden: 2 },
            79: { id: 79, moduloId: 21, nombre: 'Acrílico de colores', tipo: 'video', duracion: 30, orden: 3 },
            80: { id: 80, moduloId: 21, nombre: 'Diseños encapsulados', tipo: 'video', duracion: 35, orden: 4 },

            // Módulo 22: Fundamentos del Gel UV
            81: { id: 81, moduloId: 22, nombre: 'Tipos de gel UV', tipo: 'video', duracion: 18, orden: 1 },
            82: { id: 82, moduloId: 22, nombre: 'Equipamiento necesario', tipo: 'video', duracion: 15, orden: 2 },
            83: { id: 83, moduloId: 22, nombre: 'Preparación profesional', tipo: 'video', duracion: 20, orden: 3 },
            84: { id: 84, moduloId: 22, nombre: 'Seguridad y buenas prácticas', tipo: 'video', duracion: 12, orden: 4 },

            // Módulo 23: Técnicas de Aplicación (Gel UV)
            85: { id: 85, moduloId: 23, nombre: 'Esmaltado semipermanente', tipo: 'video', duracion: 30, orden: 1 },
            86: { id: 86, moduloId: 23, nombre: 'Extensiones con gel', tipo: 'video', duracion: 40, orden: 2 },
            87: { id: 87, moduloId: 23, nombre: 'Esculpido con moldes', tipo: 'video', duracion: 45, orden: 3 },
            88: { id: 88, moduloId: 23, nombre: 'Overlay y refuerzo', tipo: 'video', duracion: 30, orden: 4 },

            // Módulo 24: Diseños Avanzados (Gel UV)
            89: { id: 89, moduloId: 24, nombre: 'Gel de construcción', tipo: 'video', duracion: 35, orden: 1 },
            90: { id: 90, moduloId: 24, nombre: 'French avanzado', tipo: 'video', duracion: 30, orden: 2 },
            91: { id: 91, moduloId: 24, nombre: 'Encapsulado con gel', tipo: 'video', duracion: 35, orden: 3 },
            92: { id: 92, moduloId: 24, nombre: 'Efectos especiales', tipo: 'video', duracion: 30, orden: 4 }
        },
        nextIds: {
            curso: 10,
            modulo: 25,
            clase: 93
        }
    },
    
    // Inicializar datos (cargar de localStorage o usar defaults)
    init() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) {
            this.save(this.defaultData);
        }
        return this.getAll();
    },
    
    // Obtener todos los datos
    getAll() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : this.defaultData;
    },
    
    // Guardar datos
    save(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    },
    
    // Reset a datos por defecto
    reset() {
        this.save(this.defaultData);
        return this.defaultData;
    },
    
    // ==================== CURSOS ====================
    
    getCurso(id) {
        const data = this.getAll();
        return data.cursos[id] || null;
    },
    
    getAllCursos() {
        const data = this.getAll();
        return Object.values(data.cursos);
    },
    
    saveCurso(curso) {
        const data = this.getAll();
        if (!curso.id) {
            curso.id = data.nextIds.curso++;
            curso.fechaCreacion = new Date().toISOString().split('T')[0];
            curso.modulos = [];
        }
        data.cursos[curso.id] = curso;
        this.save(data);
        return curso;
    },
    
    deleteCurso(id) {
        const data = this.getAll();
        delete data.cursos[id];
        this.save(data);
    },
    
    // ==================== MÓDULOS ====================
    
    getModulo(id) {
        const data = this.getAll();
        return data.modulos[id] || null;
    },
    
    getModulosByCurso(cursoId) {
        const data = this.getAll();
        const curso = data.cursos[cursoId];
        if (!curso || !curso.modulos) return [];
        
        return curso.modulos
            .map(modId => data.modulos[modId])
            .filter(m => m)
            .sort((a, b) => a.orden - b.orden);
    },
    
    saveModulo(modulo) {
        const data = this.getAll();
        if (!modulo.id) {
            modulo.id = data.nextIds.modulo++;
            modulo.clases = [];
            // Agregar al curso
            if (modulo.cursoId && data.cursos[modulo.cursoId]) {
                const curso = data.cursos[modulo.cursoId];
                modulo.orden = (curso.modulos?.length || 0) + 1;
                curso.modulos = curso.modulos || [];
                curso.modulos.push(modulo.id);
            }
        }
        data.modulos[modulo.id] = modulo;
        this.save(data);
        return modulo;
    },
    
    deleteModulo(id) {
        const data = this.getAll();
        const modulo = data.modulos[id];
        if (modulo && modulo.cursoId) {
            const curso = data.cursos[modulo.cursoId];
            if (curso && curso.modulos) {
                curso.modulos = curso.modulos.filter(mId => mId !== id);
            }
        }
        delete data.modulos[id];
        this.save(data);
    },
    
    reorderModulos(cursoId, newOrder) {
        const data = this.getAll();
        const curso = data.cursos[cursoId];
        if (curso) {
            curso.modulos = newOrder;
            newOrder.forEach((modId, index) => {
                if (data.modulos[modId]) {
                    data.modulos[modId].orden = index + 1;
                }
            });
            this.save(data);
        }
    },
    
    // ==================== CLASES ====================
    
    getClase(id) {
        const data = this.getAll();
        return data.clases[id] || null;
    },
    
    getClasesByModulo(moduloId) {
        const data = this.getAll();
        const modulo = data.modulos[moduloId];
        if (!modulo || !modulo.clases) return [];
        
        return modulo.clases
            .map(claseId => data.clases[claseId])
            .filter(c => c)
            .sort((a, b) => a.orden - b.orden);
    },
    
    saveClase(clase) {
        const data = this.getAll();
        if (!clase.id) {
            clase.id = data.nextIds.clase++;
            // Agregar al módulo
            if (clase.moduloId && data.modulos[clase.moduloId]) {
                const modulo = data.modulos[clase.moduloId];
                clase.orden = (modulo.clases?.length || 0) + 1;
                modulo.clases = modulo.clases || [];
                modulo.clases.push(clase.id);
            }
        }
        data.clases[clase.id] = clase;
        this.save(data);
        return clase;
    },
    
    deleteClase(id) {
        const data = this.getAll();
        const clase = data.clases[id];
        if (clase && clase.moduloId) {
            const modulo = data.modulos[clase.moduloId];
            if (modulo && modulo.clases) {
                modulo.clases = modulo.clases.filter(cId => cId !== id);
            }
        }
        delete data.clases[id];
        this.save(data);
    },
    
    reorderClases(moduloId, newOrder) {
        const data = this.getAll();
        const modulo = data.modulos[moduloId];
        if (modulo) {
            modulo.clases = newOrder;
            newOrder.forEach((claseId, index) => {
                if (data.clases[claseId]) {
                    data.clases[claseId].orden = index + 1;
                }
            });
            this.save(data);
        }
    },
    
    // ==================== UTILIDADES ====================
    
    // Calcular duración total de un módulo
    calcularDuracionModulo(moduloId) {
        const clases = this.getClasesByModulo(moduloId);
        return clases.reduce((total, clase) => total + (clase.duracion || 0), 0);
    },
    
    // Calcular duración total de un curso
    calcularDuracionCurso(cursoId) {
        const modulos = this.getModulosByCurso(cursoId);
        return modulos.reduce((total, modulo) => {
            return total + this.calcularDuracionModulo(modulo.id);
        }, 0);
    },
    
    // Formatear duración en minutos a texto legible
    formatearDuracion(minutos) {
        if (minutos < 60) {
            return `${minutos} min`;
        }
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    },
    
    // Formatear precio a CLP
    formatearPrecio(precio) {
        return `$${precio.toLocaleString('es-CL')} CLP`;
    },
    
    // Formatear fecha
    formatearFecha(fecha) {
        if (!fecha) return 'dd/mm/aa';
        const d = new Date(fecha);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    },
    
    // Obtener ícono según tipo de clase
    getIconoClase(tipo) {
        const iconos = {
            video: 'fa-play-circle',
            texto: 'fa-file-alt',
            pdf: 'fa-file-pdf',
            quiz: 'fa-question-circle',
            entrega: 'fa-upload'
        };
        return iconos[tipo] || 'fa-file';
    },
    
    // Obtener color según tipo de clase
    getColorClase(tipo) {
        const colores = {
            video: 'text-primary',
            texto: 'text-info',
            pdf: 'text-danger',
            quiz: 'text-warning',
            entrega: 'text-success'
        };
        return colores[tipo] || 'text-secondary';
    },

    // ==================== ALUMNA / PROGRESO ====================

    // Clave para datos de alumna
    STUDENT_STORAGE_KEY: 'kikibrows_student',

    // Datos por defecto de alumna (simulación)
    defaultStudentData: {
        id: 1,
        nombre: 'María',
        apellido: 'García',
        email: 'maria@example.com',
        cursosAdquiridos: [1, 2], // IDs de cursos comprados
        accesoCursos: {
            // cursoId: { fechaCompra, fechaExpiracion, diasAcceso }
            1: {
                fechaCompra: '2025-10-15',
                fechaExpiracion: '2026-04-15', // 6 meses de acceso
                diasAcceso: 180
            },
            2: {
                fechaCompra: '2025-11-01',
                fechaExpiracion: '2026-05-01', // 6 meses de acceso
                diasAcceso: 180
            }
        },
        progreso: {
            // cursoId: { moduloId: { claseId: { completado: bool, fecha: date } } }
            1: {
                ultimaActividad: '2026-01-06T10:30:00',
                ultimaClaseId: 2,
                ultimoModuloId: 1,
                modulos: {
                    1: {
                        clases: {
                            1: { completado: true, fecha: '2026-01-05T09:00:00' },
                            2: { completado: false, fecha: null },
                            3: { completado: false, fecha: null },
                            4: { completado: false, fecha: null }
                        }
                    },
                    2: {
                        clases: {
                            5: { completado: false, fecha: null },
                            6: { completado: false, fecha: null },
                            7: { completado: false, fecha: null }
                        }
                    },
                    3: {
                        clases: {
                            8: { completado: false, fecha: null },
                            9: { completado: false, fecha: null },
                            10: { completado: false, fecha: null },
                            11: { completado: false, fecha: null, estado: 'sin_entregar' }, // entrega
                            12: { completado: false, fecha: null }
                        }
                    }
                }
            },
            2: {
                ultimaActividad: '2026-01-04T15:00:00',
                ultimaClaseId: 13,
                ultimoModuloId: 4,
                modulos: {
                    4: {
                        clases: {
                            13: { completado: true, fecha: '2026-01-04T14:30:00' },
                            14: { completado: true, fecha: '2026-01-04T15:00:00' },
                            15: { completado: false, fecha: null }
                        }
                    },
                    5: {
                        clases: {
                            16: { completado: false, fecha: null },
                            17: { completado: false, fecha: null, estado: 'sin_entregar' }
                        }
                    }
                }
            }
        },
        quizAttempts: {
            // claseId: [{ fecha, respuestas, puntaje, aprobado }]
        },
        entregas: {
            // claseId: [{ fecha, archivo, estado: 'pendiente'|'aprobada'|'rechazada', feedback }]
        },
        certificados: {
            // cursoId: { fecha, descargado }
        }
    },

    // Inicializar datos de alumna
    initStudent() {
        const stored = localStorage.getItem(this.STUDENT_STORAGE_KEY);
        if (!stored) {
            this.saveStudent(this.defaultStudentData);
        }
        return this.getStudent();
    },

    getStudent() {
        const stored = localStorage.getItem(this.STUDENT_STORAGE_KEY);
        return stored ? JSON.parse(stored) : this.defaultStudentData;
    },

    saveStudent(data) {
        localStorage.setItem(this.STUDENT_STORAGE_KEY, JSON.stringify(data));
    },

    resetStudent() {
        this.saveStudent(this.defaultStudentData);
        return this.defaultStudentData;
    },

    // Obtener cursos adquiridos por la alumna
    getCursosAdquiridos() {
        const student = this.getStudent();
        const cursos = [];
        student.cursosAdquiridos.forEach(cursoId => {
            const curso = this.getCurso(cursoId);
            if (curso) {
                cursos.push({
                    ...curso,
                    progreso: this.calcularProgresoCurso(cursoId),
                    ultimaActividad: student.progreso[cursoId]?.ultimaActividad || null,
                    acceso: this.getAccesoCurso(cursoId),
                    diasRestantes: this.getDiasRestantesAcceso(cursoId),
                    fechaExpiracionFormato: this.formatearFechaExpiracion(cursoId),
                    tiempoRestante: this.formatearTiempoRestante(cursoId),
                    accesoExpirado: this.hasAccesoExpirado(cursoId),
                    accesoPorVencer: this.isAccesoPorVencer(cursoId)
                });
            }
        });
        // Ordenar por última actividad (más reciente primero)
        return cursos.sort((a, b) => {
            if (!a.ultimaActividad) return 1;
            if (!b.ultimaActividad) return -1;
            return new Date(b.ultimaActividad) - new Date(a.ultimaActividad);
        });
    },

    // Calcular progreso de un curso (porcentaje)
    calcularProgresoCurso(cursoId) {
        const student = this.getStudent();
        const progresoData = student.progreso[cursoId];
        if (!progresoData) return { porcentaje: 0, completados: 0, total: 0 };

        let totalClases = 0;
        let clasesCompletadas = 0;

        const modulos = this.getModulosByCurso(cursoId);
        modulos.forEach(modulo => {
            const clases = this.getClasesByModulo(modulo.id);
            clases.forEach(clase => {
                totalClases++;
                const claseProgreso = progresoData.modulos?.[modulo.id]?.clases?.[clase.id];
                if (claseProgreso?.completado) {
                    clasesCompletadas++;
                }
            });
        });

        return {
            porcentaje: totalClases > 0 ? Math.round((clasesCompletadas / totalClases) * 100) : 0,
            completados: clasesCompletadas,
            total: totalClases
        };
    },

    // Calcular progreso de un módulo
    calcularProgresoModulo(cursoId, moduloId) {
        const student = this.getStudent();
        const progresoData = student.progreso[cursoId]?.modulos?.[moduloId];
        if (!progresoData) return { porcentaje: 0, completados: 0, total: 0 };

        const clases = this.getClasesByModulo(moduloId);
        let completadas = 0;
        clases.forEach(clase => {
            if (progresoData.clases?.[clase.id]?.completado) {
                completadas++;
            }
        });

        return {
            porcentaje: clases.length > 0 ? Math.round((completadas / clases.length) * 100) : 0,
            completados: completadas,
            total: clases.length
        };
    },

    // Marcar clase como completada
    marcarClaseCompletada(cursoId, moduloId, claseId) {
        const student = this.getStudent();
        if (!student.progreso[cursoId]) {
            student.progreso[cursoId] = { modulos: {} };
        }
        if (!student.progreso[cursoId].modulos[moduloId]) {
            student.progreso[cursoId].modulos[moduloId] = { clases: {} };
        }
        student.progreso[cursoId].modulos[moduloId].clases[claseId] = {
            completado: true,
            fecha: new Date().toISOString()
        };
        student.progreso[cursoId].ultimaActividad = new Date().toISOString();
        student.progreso[cursoId].ultimaClaseId = claseId;
        student.progreso[cursoId].ultimoModuloId = moduloId;
        this.saveStudent(student);
    },

    // Obtener estado de una clase
    getEstadoClase(cursoId, moduloId, claseId) {
        const student = this.getStudent();
        return student.progreso[cursoId]?.modulos?.[moduloId]?.clases?.[claseId] || { completado: false };
    },

    // Verificar si elemento está desbloqueado (secuencial)
    isClaseDesbloqueada(cursoId, moduloId, claseId) {
        const modulos = this.getModulosByCurso(cursoId);
        let prevCompleted = true;

        for (const modulo of modulos) {
            const clases = this.getClasesByModulo(modulo.id);
            for (const clase of clases) {
                if (clase.id === claseId) {
                    return prevCompleted;
                }
                const estado = this.getEstadoClase(cursoId, modulo.id, clase.id);
                prevCompleted = estado.completado;
            }
        }
        return false;
    },

    // Obtener última clase vista (para "Continuar")
    getUltimaClase(cursoId) {
        const student = this.getStudent();
        const progreso = student.progreso[cursoId];
        if (progreso && progreso.ultimaClaseId) {
            return {
                claseId: progreso.ultimaClaseId,
                moduloId: progreso.ultimoModuloId
            };
        }
        // Si es primera vez, devolver primer elemento
        const modulos = this.getModulosByCurso(cursoId);
        if (modulos.length > 0) {
            const clases = this.getClasesByModulo(modulos[0].id);
            if (clases.length > 0) {
                return { claseId: clases[0].id, moduloId: modulos[0].id };
            }
        }
        return null;
    },

    // ==================== QUIZZES ====================

    // Guardar intento de quiz
    guardarIntentoQuiz(claseId, respuestas, puntaje, aprobado) {
        const student = this.getStudent();
        if (!student.quizAttempts[claseId]) {
            student.quizAttempts[claseId] = [];
        }
        student.quizAttempts[claseId].push({
            fecha: new Date().toISOString(),
            respuestas,
            puntaje,
            aprobado
        });
        this.saveStudent(student);
    },

    // Obtener intentos de quiz
    getIntentosQuiz(claseId) {
        const student = this.getStudent();
        return student.quizAttempts[claseId] || [];
    },

    // ==================== ENTREGAS ====================

    // Guardar entrega
    guardarEntrega(claseId, archivo) {
        const student = this.getStudent();
        if (!student.entregas[claseId]) {
            student.entregas[claseId] = [];
        }
        student.entregas[claseId].push({
            fecha: new Date().toISOString(),
            archivo,
            estado: 'pendiente',
            feedback: null
        });
        this.saveStudent(student);
    },

    // Obtener entregas
    getEntregas(claseId) {
        const student = this.getStudent();
        return student.entregas[claseId] || [];
    },

    // Obtener última entrega
    getUltimaEntrega(claseId) {
        const entregas = this.getEntregas(claseId);
        return entregas.length > 0 ? entregas[entregas.length - 1] : null;
    },

    // Actualizar estado de entrega (para simulación admin)
    actualizarEstadoEntrega(claseId, indice, estado, feedback) {
        const student = this.getStudent();
        if (student.entregas[claseId] && student.entregas[claseId][indice]) {
            student.entregas[claseId][indice].estado = estado;
            student.entregas[claseId][indice].feedback = feedback;
            this.saveStudent(student);
        }
    },

    // ==================== CERTIFICADOS ====================

    // Verificar si puede obtener certificado
    puedeObtenerCertificado(cursoId) {
        const progreso = this.calcularProgresoCurso(cursoId);
        if (progreso.porcentaje < 100) return { puede: false, razon: 'progreso' };

        // Verificar entregas aprobadas
        const student = this.getStudent();
        const modulos = this.getModulosByCurso(cursoId);
        for (const modulo of modulos) {
            const clases = this.getClasesByModulo(modulo.id);
            for (const clase of clases) {
                if (clase.tipo === 'entrega') {
                    const ultimaEntrega = this.getUltimaEntrega(clase.id);
                    if (!ultimaEntrega || ultimaEntrega.estado !== 'aprobada') {
                        return {
                            puede: false,
                            razon: ultimaEntrega?.estado === 'pendiente' ? 'pendiente' : 'entrega',
                            moduloNombre: modulo.nombre
                        };
                    }
                }
            }
        }
        return { puede: true };
    },

    // Generar certificado
    generarCertificado(cursoId) {
        const student = this.getStudent();
        if (!student.certificados) student.certificados = {};
        student.certificados[cursoId] = {
            fecha: new Date().toISOString(),
            descargado: true
        };
        this.saveStudent(student);
    },

    // Obtener conteo de módulos completados
    getModulosCompletados(cursoId) {
        const modulos = this.getModulosByCurso(cursoId);
        let completados = 0;
        modulos.forEach(modulo => {
            const progreso = this.calcularProgresoModulo(cursoId, modulo.id);
            if (progreso.porcentaje === 100) completados++;
        });
        return { completados, total: modulos.length };
    },

    // ==================== ACCESO A CURSOS ====================

    // Obtener información de acceso de un curso
    getAccesoCurso(cursoId) {
        const student = this.getStudent();
        return student.accesoCursos?.[cursoId] || null;
    },

    // Calcular días restantes de acceso
    getDiasRestantesAcceso(cursoId) {
        const acceso = this.getAccesoCurso(cursoId);
        if (!acceso || !acceso.fechaExpiracion) return null;

        const hoy = new Date();
        const fechaExp = new Date(acceso.fechaExpiracion);
        const diffTime = fechaExp - hoy;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    },

    // Formatear fecha de expiración
    formatearFechaExpiracion(cursoId) {
        const acceso = this.getAccesoCurso(cursoId);
        if (!acceso || !acceso.fechaExpiracion) return 'Sin límite';

        const fecha = new Date(acceso.fechaExpiracion);
        return fecha.toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },

    // Verificar si el acceso está por vencer (menos de 30 días)
    isAccesoPorVencer(cursoId) {
        const diasRestantes = this.getDiasRestantesAcceso(cursoId);
        return diasRestantes !== null && diasRestantes <= 30 && diasRestantes > 0;
    },

    // Verificar si el acceso ha expirado
    hasAccesoExpirado(cursoId) {
        const diasRestantes = this.getDiasRestantesAcceso(cursoId);
        return diasRestantes !== null && diasRestantes <= 0;
    },

    // Formatear tiempo restante de forma legible
    formatearTiempoRestante(cursoId) {
        const diasRestantes = this.getDiasRestantesAcceso(cursoId);
        if (diasRestantes === null) return 'Acceso permanente';
        if (diasRestantes <= 0) return 'Acceso expirado';
        if (diasRestantes === 1) return '1 día restante';
        if (diasRestantes < 30) return `${diasRestantes} días restantes`;

        const meses = Math.floor(diasRestantes / 30);
        const dias = diasRestantes % 30;

        if (meses === 1 && dias === 0) return '1 mes restante';
        if (meses === 1) return `1 mes y ${dias} días restantes`;
        if (dias === 0) return `${meses} meses restantes`;
        return `${meses} meses y ${dias} días restantes`;
    }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    CursosData.init();
    CursosData.initStudent();
});