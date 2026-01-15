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
    },

    // ==================== ALUMNA / PROGRESO ====================

    // Clave para datos de alumna
    STUDENT_STORAGE_KEY: 'kikibrows_student',

    // Datos por defecto de alumna (simulación)
    defaultStudentData: {
        id: 1,
        nombre: 'María García',
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