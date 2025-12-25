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
                portada: null,
                video: null,
                carrusel: false,
                carruselPosicion: null,
                modulos: [6]
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
            20: { id: 20, moduloId: 6, nombre: 'Diseño personalizado', tipo: 'entrega', duracion: 20, orden: 3 }
        },
        nextIds: {
            curso: 4,
            modulo: 7,
            clase: 21
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
    }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    CursosData.init();
});