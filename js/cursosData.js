// js/cursosData.js - Objeto global CursosData para compatibilidad con código existente
// Conecta con Supabase y cachea datos localmente para rendimiento

import { CursosService, supabase } from './cursosService.js';

// ==================== CURSOSDATA GLOBAL ====================
// Este objeto provee una interfaz síncrona sobre las operaciones asíncronas
// cacheando los datos localmente para evitar llamadas repetidas

const CursosData = {
    // Cache de datos
    _cursos: [],
    _modulos: {},       // { cursoId: [modulos] }
    _clases: {},        // { moduloId: [clases] }
    _clasesById: {},    // { claseId: clase }
    _modulosById: {},   // { moduloId: modulo }
    _cursosById: {},    // { cursoId: curso }
    _initialized: false,
    _studentInitialized: false,
    _currentUserId: null,
    _cursosAdquiridos: [],

    // Datos del estudiante (almacenados en localStorage para compatibilidad)
    _student: null,

    // ==================== INICIALIZACIÓN ====================

    /**
     * Inicializar datos de cursos desde Supabase
     * Carga todos los cursos publicados con sus módulos y clases
     */
    async init() {
        if (this._initialized) return;

        try {
            console.log('CursosData: Inicializando datos desde Supabase...');

            // Cargar todos los cursos publicados
            const { data: cursos, error } = await supabase
                .from('cursos')
                .select(`
                    *,
                    modulos (
                        id,
                        nombre,
                        descripcion,
                        orden,
                        curso_id,
                        clases (
                            id,
                            nombre,
                            descripcion,
                            tipo,
                            duracion,
                            orden,
                            contenido_url,
                            contenido_texto,
                            metadata,
                            modulo_id
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Procesar y ordenar datos
            this._cursos = cursos || [];
            this._cursos.forEach(curso => {
                this._cursosById[curso.id] = curso;

                if (curso.modulos) {
                    // Ordenar módulos
                    curso.modulos.sort((a, b) => a.orden - b.orden);
                    this._modulos[curso.id] = curso.modulos;

                    curso.modulos.forEach(modulo => {
                        this._modulosById[modulo.id] = modulo;

                        if (modulo.clases) {
                            // Ordenar clases
                            modulo.clases.sort((a, b) => a.orden - b.orden);
                            this._clases[modulo.id] = modulo.clases;

                            modulo.clases.forEach(clase => {
                                this._clasesById[clase.id] = clase;
                            });
                        }
                    });
                }
            });

            this._initialized = true;
            console.log(`CursosData: ${this._cursos.length} cursos cargados`);

        } catch (error) {
            console.error('CursosData: Error al inicializar:', error);
            // Intentar cargar desde localStorage como fallback
            this._loadFromLocalStorage();
        }
    },

    /**
     * Inicializar datos del estudiante
     */
    async initStudent() {
        if (this._studentInitialized) return;

        try {
            // Obtener usuario actual
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                this._currentUserId = session.user.id;

                // Obtener perfil
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', session.user.id)
                    .single();

                // Cargar cursos adquiridos
                await this._loadCursosAdquiridos();

                // Inicializar o cargar datos del estudiante desde localStorage
                this._student = this._loadStudentFromStorage() || {
                    id: session.user.id,
                    nombre: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : session.user.email.split('@')[0],
                    email: session.user.email,
                    progreso: {},
                    quizAttempts: {},
                    entregas: {},
                    certificados: {}
                };

                this._studentInitialized = true;
                console.log('CursosData: Estudiante inicializado');
            }
        } catch (error) {
            console.error('CursosData: Error al inicializar estudiante:', error);
            this._student = this._loadStudentFromStorage() || this._createDefaultStudent();
            this._studentInitialized = true;
        }
    },

    /**
     * Cargar cursos adquiridos del usuario
     */
    async _loadCursosAdquiridos() {
        if (!this._currentUserId) return;

        try {
            const { data, error } = await supabase
                .from('transacciones')
                .select(`
                    id,
                    curso_id,
                    estado,
                    fecha_compra,
                    cursos (*)
                `)
                .eq('usuario_id', this._currentUserId)
                .eq('estado', 'PAGADO');

            if (error) throw error;

            this._cursosAdquiridos = (data || [])
                .filter(t => t.cursos)
                .map(t => ({
                    ...t.cursos,
                    fechaCompra: t.fecha_compra,
                    transaccionId: t.id
                }));

            console.log(`CursosData: ${this._cursosAdquiridos.length} cursos adquiridos`);
        } catch (error) {
            console.error('Error al cargar cursos adquiridos:', error);
            // Fallback a localStorage
            const localData = localStorage.getItem('kikibrows_usuarios');
            if (localData) {
                const usuarios = JSON.parse(localData);
                const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
                const datos = usuarios[usuarioActual.email] || {};
                const cursosIds = datos.cursosAdquiridos || [];
                this._cursosAdquiridos = cursosIds.map(id => this._cursosById[id]).filter(Boolean);
            }
        }
    },

    // ==================== CURSOS ====================

    /**
     * Obtener todos los cursos
     */
    getAllCursos() {
        return this._cursos;
    },

    /**
     * Obtener un curso por ID
     */
    getCurso(cursoId) {
        return this._cursosById[cursoId] || null;
    },

    /**
     * Obtener cursos adquiridos por el usuario actual
     */
    getCursosAdquiridos() {
        // Enriquecer con progreso y acceso
        return this._cursosAdquiridos.map(curso => {
            const progreso = this.calcularProgresoCurso(curso.id);
            const acceso = this._calcularAcceso(curso);

            return {
                ...curso,
                progreso,
                ultimaActividad: this._getUltimaActividad(curso.id),
                acceso: acceso,
                tiempoRestante: acceso.tiempoRestante,
                fechaExpiracionFormato: acceso.fechaExpiracionFormato,
                accesoExpirado: acceso.expirado,
                accesoPorVencer: acceso.porVencer
            };
        });
    },

    /**
     * Calcular información de acceso al curso
     */
    _calcularAcceso(curso) {
        const fechaCompra = new Date(curso.fechaCompra);
        const diasAcceso = curso.dias_duracion_acceso || 180;
        const fechaExpiracion = new Date(fechaCompra);
        fechaExpiracion.setDate(fechaExpiracion.getDate() + diasAcceso);

        const ahora = new Date();
        const diasRestantes = Math.ceil((fechaExpiracion - ahora) / (1000 * 60 * 60 * 24));

        return {
            fechaCompra: fechaCompra.toISOString().split('T')[0],
            fechaExpiracion: fechaExpiracion.toISOString().split('T')[0],
            fechaExpiracionFormato: fechaExpiracion.toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            diasRestantes,
            tiempoRestante: diasRestantes > 0
                ? `${diasRestantes} días de acceso`
                : 'Acceso expirado',
            expirado: diasRestantes <= 0,
            porVencer: diasRestantes > 0 && diasRestantes <= 30
        };
    },

    // ==================== MÓDULOS ====================

    /**
     * Obtener módulos de un curso
     */
    getModulosByCurso(cursoId) {
        return this._modulos[cursoId] || [];
    },

    /**
     * Obtener un módulo por ID
     */
    getModulo(moduloId) {
        return this._modulosById[moduloId] || null;
    },

    /**
     * Obtener módulos completados de un curso
     */
    getModulosCompletados(cursoId) {
        const modulos = this.getModulosByCurso(cursoId);
        let completados = 0;

        modulos.forEach(modulo => {
            const progresoModulo = this.calcularProgresoModulo(cursoId, modulo.id);
            if (progresoModulo.porcentaje === 100) {
                completados++;
            }
        });

        return {
            completados,
            total: modulos.length
        };
    },

    // ==================== CLASES ====================

    /**
     * Obtener clases de un módulo
     */
    getClasesByModulo(moduloId) {
        return this._clases[moduloId] || [];
    },

    /**
     * Obtener una clase por ID
     */
    getClase(claseId) {
        return this._clasesById[claseId] || null;
    },

    /**
     * Obtener la última clase accedida en un curso
     */
    getUltimaClase(cursoId) {
        if (!this._student?.progreso?.[cursoId]) {
            // Si no hay progreso, devolver la primera clase
            const modulos = this.getModulosByCurso(cursoId);
            if (modulos.length > 0) {
                const clases = this.getClasesByModulo(modulos[0].id);
                if (clases.length > 0) {
                    return {
                        moduloId: modulos[0].id,
                        claseId: clases[0].id
                    };
                }
            }
            return null;
        }

        const progreso = this._student.progreso[cursoId];
        return {
            moduloId: progreso.ultimoModuloId || null,
            claseId: progreso.ultimaClaseId || null
        };
    },

    // ==================== DURACIÓN ====================

    /**
     * Calcular duración total de un curso
     */
    calcularDuracionCurso(cursoId) {
        const modulos = this.getModulosByCurso(cursoId);
        let total = 0;

        modulos.forEach(modulo => {
            total += this.calcularDuracionModulo(modulo.id);
        });

        return total;
    },

    /**
     * Calcular duración de un módulo
     */
    calcularDuracionModulo(moduloId) {
        const clases = this.getClasesByModulo(moduloId);
        return clases.reduce((total, clase) => total + (clase.duracion || 5), 0);
    },

    /**
     * Formatear duración en minutos
     */
    formatearDuracion(minutos) {
        if (!minutos || minutos <= 0) return '0 min';
        if (minutos < 60) return `${minutos} min`;
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        if (mins === 0) return `${horas}h`;
        return `${horas}h ${mins}min`;
    },

    // ==================== PROGRESO ====================

    /**
     * Calcular progreso de un curso
     */
    calcularProgresoCurso(cursoId) {
        const modulos = this.getModulosByCurso(cursoId);
        let totalClases = 0;
        let clasesCompletadas = 0;

        modulos.forEach(modulo => {
            const clases = this.getClasesByModulo(modulo.id);
            totalClases += clases.length;

            clases.forEach(clase => {
                const estado = this.getEstadoClase(cursoId, modulo.id, clase.id);
                if (estado.completado) {
                    clasesCompletadas++;
                }
            });
        });

        const porcentaje = totalClases > 0 ? Math.round((clasesCompletadas / totalClases) * 100) : 0;

        return {
            completados: clasesCompletadas,
            total: totalClases,
            porcentaje
        };
    },

    /**
     * Calcular progreso de un módulo
     */
    calcularProgresoModulo(cursoId, moduloId) {
        const clases = this.getClasesByModulo(moduloId);
        let completadas = 0;

        clases.forEach(clase => {
            const estado = this.getEstadoClase(cursoId, moduloId, clase.id);
            if (estado.completado) {
                completadas++;
            }
        });

        const porcentaje = clases.length > 0 ? Math.round((completadas / clases.length) * 100) : 0;

        return {
            completados: completadas,
            total: clases.length,
            porcentaje
        };
    },

    /**
     * Obtener estado de una clase
     */
    getEstadoClase(cursoId, moduloId, claseId) {
        const progreso = this._student?.progreso?.[cursoId]?.modulos?.[moduloId]?.clases?.[claseId];
        return progreso || { completado: false };
    },

    /**
     * Verificar si una clase está desbloqueada
     */
    isClaseDesbloqueada(cursoId, moduloId, claseId) {
        const modulos = this.getModulosByCurso(cursoId);

        for (const modulo of modulos) {
            const clases = this.getClasesByModulo(modulo.id);

            for (const clase of clases) {
                if (clase.id === claseId) {
                    return true; // Encontramos la clase, está desbloqueada
                }

                const estado = this.getEstadoClase(cursoId, modulo.id, clase.id);
                if (!estado.completado) {
                    // Clase anterior no completada, la actual está bloqueada
                    return false;
                }
            }
        }

        return true;
    },

    /**
     * Marcar clase como completada
     */
    marcarClaseCompletada(cursoId, moduloId, claseId) {
        if (!this._student) return;

        // Inicializar estructura si no existe
        if (!this._student.progreso[cursoId]) {
            this._student.progreso[cursoId] = { modulos: {} };
        }
        if (!this._student.progreso[cursoId].modulos[moduloId]) {
            this._student.progreso[cursoId].modulos[moduloId] = { clases: {} };
        }

        this._student.progreso[cursoId].modulos[moduloId].clases[claseId] = {
            completado: true,
            fecha: new Date().toISOString()
        };

        this._student.progreso[cursoId].ultimaClaseId = claseId;
        this._student.progreso[cursoId].ultimoModuloId = moduloId;
        this._student.progreso[cursoId].ultimaActividad = new Date().toISOString();

        this.saveStudent(this._student);

        // También guardar en Supabase si está disponible
        this._guardarProgresoSupabase(cursoId, moduloId, claseId, true);
    },

    /**
     * Guardar progreso en Supabase
     */
    async _guardarProgresoSupabase(cursoId, moduloId, claseId, completado) {
        if (!this._currentUserId) return;

        try {
            await CursosService.guardarProgreso(cursoId, moduloId, claseId, this._currentUserId, {
                completado,
                porcentaje: completado ? 100 : 0
            });
        } catch (error) {
            console.error('Error al guardar progreso en Supabase:', error);
        }
    },

    // ==================== ESTUDIANTE ====================

    /**
     * Obtener datos del estudiante
     */
    getStudent() {
        return this._student;
    },

    /**
     * Obtener datos del estudiante (alias)
     */
    getStudentData() {
        return this._student;
    },

    /**
     * Guardar datos del estudiante
     */
    saveStudent(student) {
        this._student = student;
        localStorage.setItem('kikibrows_student', JSON.stringify(student));
    },

    /**
     * Cargar estudiante desde localStorage
     */
    _loadStudentFromStorage() {
        try {
            const data = localStorage.getItem('kikibrows_student');
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

    /**
     * Crear estudiante por defecto
     */
    _createDefaultStudent() {
        return {
            id: 'local-user',
            nombre: 'Estudiante',
            progreso: {},
            quizAttempts: {},
            entregas: {},
            certificados: {}
        };
    },

    /**
     * Obtener última actividad de un curso
     */
    _getUltimaActividad(cursoId) {
        return this._student?.progreso?.[cursoId]?.ultimaActividad || null;
    },

    // ==================== QUIZ ====================

    /**
     * Guardar intento de quiz
     */
    guardarIntentoQuiz(claseId, respuestas, puntaje, aprobado) {
        if (!this._student.quizAttempts[claseId]) {
            this._student.quizAttempts[claseId] = [];
        }

        this._student.quizAttempts[claseId].push({
            fecha: new Date().toISOString(),
            respuestas,
            puntaje,
            aprobado
        });

        this.saveStudent(this._student);
    },

    /**
     * Obtener intentos de quiz
     */
    getIntentosQuiz(claseId) {
        return this._student?.quizAttempts?.[claseId] || [];
    },

    // ==================== ENTREGAS ====================

    /**
     * Guardar entrega
     */
    guardarEntrega(claseId, fileName) {
        if (!this._student.entregas[claseId]) {
            this._student.entregas[claseId] = [];
        }

        this._student.entregas[claseId].push({
            fecha: new Date().toISOString(),
            archivo: fileName,
            estado: 'pendiente'
        });

        this.saveStudent(this._student);
    },

    /**
     * Obtener entregas de una clase
     */
    getEntregas(claseId) {
        return this._student?.entregas?.[claseId] || [];
    },

    /**
     * Obtener última entrega de una clase
     */
    getUltimaEntrega(claseId) {
        const entregas = this.getEntregas(claseId);
        return entregas.length > 0 ? entregas[entregas.length - 1] : null;
    },

    /**
     * Actualizar estado de entrega
     */
    actualizarEstadoEntrega(claseId, indice, estado, feedback) {
        if (!this._student.entregas[claseId] || !this._student.entregas[claseId][indice]) {
            return;
        }

        this._student.entregas[claseId][indice].estado = estado;
        this._student.entregas[claseId][indice].feedback = feedback;
        this._student.entregas[claseId][indice].fechaRevision = new Date().toISOString();

        // Si está aprobada, marcar la clase como completada
        if (estado === 'aprobada') {
            // Buscar el módulo y curso de esta clase
            for (const cursoId of Object.keys(this._modulos)) {
                const modulos = this._modulos[cursoId];
                for (const modulo of modulos) {
                    const clases = this._clases[modulo.id] || [];
                    const claseEncontrada = clases.find(c => c.id === claseId);
                    if (claseEncontrada) {
                        this.marcarClaseCompletada(parseInt(cursoId), modulo.id, claseId);
                        break;
                    }
                }
            }
        }

        this.saveStudent(this._student);
    },

    // ==================== CERTIFICADOS ====================

    /**
     * Verificar si puede obtener certificado
     */
    puedeObtenerCertificado(cursoId) {
        const modulos = this.getModulosByCurso(cursoId);

        // Verificar que todas las clases estén completadas
        for (const modulo of modulos) {
            const clases = this.getClasesByModulo(modulo.id);

            for (const clase of clases) {
                const estado = this.getEstadoClase(cursoId, modulo.id, clase.id);

                // Si es entrega, verificar estado específico
                if (clase.tipo === 'entrega') {
                    const ultimaEntrega = this.getUltimaEntrega(clase.id);

                    if (!ultimaEntrega) {
                        return {
                            puede: false,
                            razon: 'entrega',
                            moduloNombre: modulo.nombre
                        };
                    }

                    if (ultimaEntrega.estado === 'pendiente') {
                        return {
                            puede: false,
                            razon: 'pendiente',
                            moduloNombre: modulo.nombre
                        };
                    }

                    if (ultimaEntrega.estado === 'rechazada') {
                        return {
                            puede: false,
                            razon: 'entrega',
                            moduloNombre: modulo.nombre
                        };
                    }
                }

                if (!estado.completado) {
                    return {
                        puede: false,
                        razon: 'incompleto'
                    };
                }
            }
        }

        return { puede: true };
    },

    /**
     * Generar/registrar certificado
     */
    generarCertificado(cursoId) {
        if (!this._student.certificados) {
            this._student.certificados = {};
        }

        this._student.certificados[cursoId] = {
            fecha: new Date().toISOString(),
            codigo: this._generarCodigoCertificado(cursoId)
        };

        this.saveStudent(this._student);
    },

    /**
     * Generar código de certificado
     */
    _generarCodigoCertificado(cursoId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `KB-${cursoId}-${timestamp}-${random}`;
    },

    // ==================== UTILIDADES ====================

    /**
     * Cargar datos desde localStorage (fallback)
     */
    _loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('kikibrows_cursos_cache');
            if (data) {
                const parsed = JSON.parse(data);
                this._cursos = parsed.cursos || [];
                this._modulos = parsed.modulos || {};
                this._clases = parsed.clases || {};
                // Reconstruir índices
                this._cursos.forEach(c => this._cursosById[c.id] = c);
                Object.values(this._modulos).flat().forEach(m => this._modulosById[m.id] = m);
                Object.values(this._clases).flat().forEach(c => this._clasesById[c.id] = c);
                this._initialized = true;
                console.log('CursosData: Datos cargados desde localStorage');
            }
        } catch (error) {
            console.error('Error al cargar desde localStorage:', error);
        }
    },

    /**
     * Guardar cache en localStorage
     */
    _saveToLocalStorage() {
        try {
            const data = {
                cursos: this._cursos,
                modulos: this._modulos,
                clases: this._clases,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('kikibrows_cursos_cache', JSON.stringify(data));
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
        }
    },

    /**
     * Verificar acceso a curso
     */
    async verificarAccesoCurso(cursoId) {
        if (!this._currentUserId) return false;

        // Verificar en cursos adquiridos cacheados
        const tiene = this._cursosAdquiridos.some(c => c.id === cursoId);
        if (tiene) return true;

        // Verificar en Supabase
        const result = await CursosService.verificarAccesoCurso(cursoId, this._currentUserId);
        return result.tieneAcceso;
    },

    /**
     * Obtener el ID del usuario actual
     */
    getCurrentUserId() {
        return this._currentUserId;
    }
};

// Hacer disponible globalmente
window.CursosData = CursosData;

// Exportar para uso como módulo
export default CursosData;
export { CursosData };
