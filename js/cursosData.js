// js/cursosData.js - Objeto global CursosData para compatibilidad con código existente
// Conecta con Supabase y cachea datos localmente para rendimiento
// CORREGIDO: Eliminada referencia a modulos.descripcion que no existe en la tabla

import { CursosService, supabase } from './cursosService.js';

// ==================== CURSOSDATA GLOBAL ====================

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

    // Datos del estudiante
    _student: null,

    // ==================== INICIALIZACIÓN ====================

    /**
     * Inicializar datos de cursos desde Supabase
     */
    async init() {
        if (this._initialized) return;

        try {
            console.log('CursosData: Inicializando datos desde Supabase...');

            // CORREGIDO: Eliminado 'descripcion' de modulos ya que no existe en la tabla
            const { data: cursos, error } = await supabase
                .from('cursos')
                .select(`
                    *,
                    modulos (
                        id,
                        nombre,
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
                    curso.modulos.sort((a, b) => (a.orden || 0) - (b.orden || 0));
                    this._modulos[curso.id] = curso.modulos;

                    curso.modulos.forEach(modulo => {
                        this._modulosById[modulo.id] = modulo;

                        if (modulo.clases) {
                            // Ordenar clases
                            modulo.clases.sort((a, b) => (a.orden || 0) - (b.orden || 0));
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
            this._loadFromLocalStorage();
        }
    },

    /**
     * Inicializar datos del estudiante
     */
    async initStudent() {
        if (this._studentInitialized) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                this._currentUserId = session.user.id;

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', session.user.id)
                    .single();

                await this._loadCursosAdquiridos();

                this._student = this._loadStudentFromStorage() || {
                    id: session.user.id,
                    nombre: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : session.user.email.split('@')[0],
                    email: session.user.email,
                    progreso: {},
                    quizAttempts: {},
                    entregas: {},
                    certificados: {}
                };

                // Cargar progreso desde Supabase para todos los cursos adquiridos
                for (const curso of this._cursosAdquiridos) {
                    await this.cargarProgresoDesdeSupabase(curso.id);
                }

                // Cargar certificados desde Supabase
                await this.cargarCertificadosDesdeSupabase();

                this._studentInitialized = true;
                console.log('CursosData: Estudiante inicializado con progreso y certificados de Supabase');
            }
        } catch (error) {
            console.error('CursosData: Error al inicializar estudiante:', error);
            this._student = this._loadStudentFromStorage() || this._createDefaultStudent();
            this._studentInitialized = true;
        }
    },

    /**
     * Cargar cursos adquiridos del usuario (transacciones + inscripciones)
     */
    async _loadCursosAdquiridos() {
        if (!this._currentUserId) return;

        try {
            // 1. Cursos por transacción (compra)
            const { data: transData, error: transError } = await supabase
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

            if (transError) throw transError;

            const cursosComprados = (transData || [])
                .filter(t => t.cursos)
                .map(t => ({
                    ...t.cursos,
                    fechaCompra: t.fecha_compra,
                    transaccionId: t.id,
                    origenAcceso: 'COMPRA'
                }));

            // 2. Cursos por inscripción (asignación admin / regalo)
            const { data: inscData, error: inscError } = await supabase
                .from('inscripciones')
                .select(`
                    id,
                    curso_id,
                    estado,
                    fecha_expiracion,
                    created_at,
                    origen_acceso,
                    cursos (*)
                `)
                .eq('usuario_id', this._currentUserId)
                .eq('estado', 'ACTIVO');

            if (inscError) {
                console.warn('Error al cargar inscripciones:', inscError);
            }

            const cursosInscritos = (inscData || [])
                .filter(i => i.cursos)
                .map(i => ({
                    ...i.cursos,
                    fechaCompra: i.created_at,
                    fechaExpiracionDirecta: i.fecha_expiracion,
                    inscripcionId: i.id,
                    origenAcceso: i.origen_acceso || 'ASIGNACION_ADMIN'
                }));

            // 3. Merge sin duplicados (prioridad: compra sobre inscripción)
            const cursosMap = new Map();
            cursosComprados.forEach(c => cursosMap.set(c.id, c));
            cursosInscritos.forEach(c => {
                if (!cursosMap.has(c.id)) cursosMap.set(c.id, c);
            });

            this._cursosAdquiridos = Array.from(cursosMap.values());
            console.log(`CursosData: ${this._cursosAdquiridos.length} cursos adquiridos (${cursosComprados.length} comprados, ${cursosInscritos.length} inscritos)`);
        } catch (error) {
            console.error('Error al cargar cursos adquiridos:', error);
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

    getAllCursos() {
        return this._cursos;
    },

    getCurso(cursoId) {
        // CORREGIDO: Soportar tanto string (UUID) como número
        return this._cursosById[cursoId] || null;
    },

    /**
     * Obtener cursos para el carrusel
     */
    getCursosCarrusel() {
        return this._cursos
            .filter(curso => curso.en_carrusel === true && curso.estado === 'PUBLICADO')
            .sort((a, b) => (a.posicion_carrusel || 999) - (b.posicion_carrusel || 999));
    },

    getCursosAdquiridos() {
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

    _calcularAcceso(curso) {
        let fechaExpiracion;

        if (curso.fechaExpiracionDirecta) {
            // Inscripción admin: usar fecha_expiracion directa de la tabla
            fechaExpiracion = new Date(curso.fechaExpiracionDirecta);
        } else {
            // Compra: calcular desde fecha_compra + dias_duracion_acceso
            const fechaCompra = new Date(curso.fechaCompra);
            const diasAcceso = curso.dias_duracion_acceso || 180;
            fechaExpiracion = new Date(fechaCompra);
            fechaExpiracion.setDate(fechaExpiracion.getDate() + diasAcceso);
        }

        const ahora = new Date();
        const diasRestantes = Math.ceil((fechaExpiracion - ahora) / (1000 * 60 * 60 * 24));

        return {
            fechaCompra: curso.fechaCompra ? new Date(curso.fechaCompra).toISOString().split('T')[0] : null,
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

    getModulosByCurso(cursoId) {
        return this._modulos[cursoId] || [];
    },

    getModulo(moduloId) {
        return this._modulosById[moduloId] || null;
    },

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

    getClasesByModulo(moduloId) {
        return this._clases[moduloId] || [];
    },

    getClase(claseId) {
        return this._clasesById[claseId] || null;
    },

    getUltimaClase(cursoId) {
        // Primero buscar en el progreso local (ya sincronizado desde Supabase en initStudent)
        if (this._student?.progreso?.[cursoId]?.ultimaClaseId) {
            const progreso = this._student.progreso[cursoId];
            return {
                moduloId: progreso.ultimoModuloId || null,
                claseId: progreso.ultimaClaseId || null,
                segundoActual: this.getSegundoActual(cursoId, progreso.ultimoModuloId, progreso.ultimaClaseId)
            };
        }

        // Fallback: primera clase del primer módulo
        const modulos = this.getModulosByCurso(cursoId);
        if (modulos.length > 0) {
            const clases = this.getClasesByModulo(modulos[0].id);
            if (clases.length > 0) {
                return {
                    moduloId: modulos[0].id,
                    claseId: clases[0].id,
                    segundoActual: 0
                };
            }
        }
        return null;
    },

    // ==================== DURACIÓN ====================

    calcularDuracionCurso(cursoId) {
        const modulos = this.getModulosByCurso(cursoId);
        let total = 0;

        modulos.forEach(modulo => {
            total += this.calcularDuracionModulo(modulo.id);
        });

        return total;
    },

    calcularDuracionModulo(moduloId) {
        const clases = this.getClasesByModulo(moduloId);
        return clases.reduce((total, clase) => total + (clase.duracion || 5), 0);
    },

    formatearDuracion(minutos) {
        if (!minutos || minutos <= 0) return '0 min';
        if (minutos < 60) return `${minutos} min`;
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        if (mins === 0) return `${horas}h`;
        return `${horas}h ${mins}min`;
    },

    // ==================== PROGRESO ====================

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

    getEstadoClase(cursoId, moduloId, claseId) {
        const progreso = this._student?.progreso?.[cursoId]?.modulos?.[moduloId]?.clases?.[claseId];
        return progreso || { completado: false };
    },

    isClaseDesbloqueada(cursoId, moduloId, claseId) {
        const modulos = this.getModulosByCurso(cursoId);

        for (const modulo of modulos) {
            const clases = this.getClasesByModulo(modulo.id);

            for (const clase of clases) {
                if (clase.id === claseId) {
                    return true;
                }

                const estado = this.getEstadoClase(cursoId, modulo.id, clase.id);
                if (!estado.completado) {
                    return false;
                }
            }
        }

        return true;
    },

    marcarClaseCompletada(cursoId, moduloId, claseId) {
        if (!this._student) return;

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
        this._guardarProgresoSupabase(cursoId, moduloId, claseId, true);
    },

    async _guardarProgresoSupabase(cursoId, moduloId, claseId, completado, segundoActual) {
        if (!this._currentUserId) return;

        try {
            const estado = {
                completado
            };
            if (segundoActual !== undefined) {
                estado.segundoActual = segundoActual;
            }
            await CursosService.guardarProgreso(cursoId, moduloId, claseId, this._currentUserId, estado);
        } catch (error) {
            console.error('Error al guardar progreso en Supabase:', error);
        }
    },

    /**
     * Cargar progreso del alumno desde progreso_clases de Supabase
     * y reconstruir el objeto _student.progreso local
     */
    async cargarProgresoDesdeSupabase(cursoId) {
        if (!this._currentUserId) return;

        try {
            const result = await CursosService.getProgresoCurso(cursoId, this._currentUserId);
            if (!result.success || !result.data) return;

            if (!this._student) return;
            if (!this._student.progreso[cursoId]) {
                this._student.progreso[cursoId] = { modulos: {} };
            }

            result.data.forEach(pc => {
                const claseId = pc.clase_id;
                const moduloId = pc.clases?.modulo_id;
                if (!moduloId) return;

                if (!this._student.progreso[cursoId].modulos[moduloId]) {
                    this._student.progreso[cursoId].modulos[moduloId] = { clases: {} };
                }

                this._student.progreso[cursoId].modulos[moduloId].clases[claseId] = {
                    completado: pc.completada,
                    fecha: pc.fecha_completado || pc.ultimo_acceso,
                    segundoActual: pc.segundo_actual || 0
                };

                // Actualizar última clase accedida
                if (!this._student.progreso[cursoId]._ultimoAcceso ||
                    new Date(pc.ultimo_acceso) > new Date(this._student.progreso[cursoId]._ultimoAcceso)) {
                    this._student.progreso[cursoId].ultimaClaseId = claseId;
                    this._student.progreso[cursoId].ultimoModuloId = moduloId;
                    this._student.progreso[cursoId].ultimaActividad = pc.ultimo_acceso;
                    this._student.progreso[cursoId]._ultimoAcceso = pc.ultimo_acceso;
                }
            });

            this.saveStudent(this._student);
            console.log(`CursosData: Progreso cargado desde Supabase para curso ${cursoId}`);
        } catch (error) {
            console.error('Error al cargar progreso desde Supabase:', error);
        }
    },

    /**
     * Obtener última clase desde Supabase (RPC) para retomar curso
     */
    async getUltimaClaseDesdeSupabase(cursoId) {
        if (!this._currentUserId) return null;

        try {
            const result = await CursosService.getUltimaClaseCurso(cursoId, this._currentUserId);
            if (result.success && result.data) {
                return {
                    claseId: result.data.clase_id,
                    moduloId: result.data.modulo_id,
                    nombreClase: result.data.nombre_clase,
                    nombreModulo: result.data.nombre_modulo,
                    segundoActual: result.data.segundo_actual,
                    completada: result.data.completada
                };
            }
            return null;
        } catch (error) {
            console.error('Error al obtener última clase desde Supabase:', error);
            return null;
        }
    },

    /**
     * Guardar segundo actual del video en progreso_clases (para reanudar)
     */
    guardarSegundoActual(cursoId, moduloId, claseId, segundoActual) {
        if (!this._student) return;

        if (!this._student.progreso[cursoId]) {
            this._student.progreso[cursoId] = { modulos: {} };
        }
        if (!this._student.progreso[cursoId].modulos[moduloId]) {
            this._student.progreso[cursoId].modulos[moduloId] = { clases: {} };
        }

        const claseProgreso = this._student.progreso[cursoId].modulos[moduloId].clases[claseId] || {};
        claseProgreso.segundoActual = segundoActual;
        this._student.progreso[cursoId].modulos[moduloId].clases[claseId] = claseProgreso;

        this.saveStudent(this._student);
        // Sync async to Supabase
        this._guardarProgresoSupabase(cursoId, moduloId, claseId, claseProgreso.completado || false, segundoActual);
    },

    /**
     * Obtener segundo actual guardado para una clase
     */
    getSegundoActual(cursoId, moduloId, claseId) {
        return this._student?.progreso?.[cursoId]?.modulos?.[moduloId]?.clases?.[claseId]?.segundoActual || 0;
    },

    // ==================== ESTUDIANTE ====================

    getStudent() {
        return this._student;
    },

    getStudentData() {
        return this._student;
    },

    saveStudent(student) {
        this._student = student;
        localStorage.setItem('kikibrows_student', JSON.stringify(student));
    },

    _loadStudentFromStorage() {
        try {
            const data = localStorage.getItem('kikibrows_student');
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

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

    _getUltimaActividad(cursoId) {
        return this._student?.progreso?.[cursoId]?.ultimaActividad || null;
    },

    // ==================== QUIZ ====================

    guardarIntentoQuiz(claseId, respuestas, puntaje, aprobado) {
        if (!this._student.quizAttempts[claseId]) {
            this._student.quizAttempts[claseId] = [];
        }

        const intentoNumero = this._student.quizAttempts[claseId].length + 1;

        this._student.quizAttempts[claseId].push({
            fecha: new Date().toISOString(),
            respuestas,
            puntaje,
            aprobado
        });

        this.saveStudent(this._student);

        // Sync to Supabase intentos_quiz
        this._guardarIntentoQuizSupabase(claseId, respuestas, puntaje, aprobado, intentoNumero);
    },

    async _guardarIntentoQuizSupabase(claseId, respuestas, puntaje, aprobado, intentoNumero) {
        if (!this._currentUserId) return;

        try {
            await CursosService.guardarIntentoQuiz(claseId, this._currentUserId, {
                intentoNumero,
                calificacion: puntaje,
                aprobado,
                respuestas
            });
        } catch (error) {
            console.error('Error al guardar intento quiz en Supabase:', error);
        }
    },

    getIntentosQuiz(claseId) {
        return this._student?.quizAttempts?.[claseId] || [];
    },

    /**
     * Cargar intentos de quiz desde Supabase para una clase
     */
    async cargarIntentosQuizDesdeSupabase(claseId) {
        if (!this._currentUserId) return;

        try {
            const result = await CursosService.getIntentosQuiz(claseId, this._currentUserId);
            if (result.success && result.data && result.data.length > 0) {
                this._student.quizAttempts[claseId] = result.data.map(intento => ({
                    fecha: intento.created_at,
                    respuestas: intento.respuestas_usuario,
                    puntaje: intento.calificacion,
                    aprobado: intento.aprobado
                }));
                this.saveStudent(this._student);
            }
        } catch (error) {
            console.error('Error al cargar intentos quiz desde Supabase:', error);
        }
    },

    // ==================== ENTREGAS ====================

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

    getEntregas(claseId) {
        return this._student?.entregas?.[claseId] || [];
    },

    getUltimaEntrega(claseId) {
        const entregas = this.getEntregas(claseId);
        return entregas.length > 0 ? entregas[entregas.length - 1] : null;
    },

    actualizarEstadoEntrega(claseId, indice, estado, feedback) {
        if (!this._student.entregas[claseId] || !this._student.entregas[claseId][indice]) {
            return;
        }

        this._student.entregas[claseId][indice].estado = estado;
        this._student.entregas[claseId][indice].feedback = feedback;
        this._student.entregas[claseId][indice].fechaRevision = new Date().toISOString();

        if (estado === 'aprobada') {
            for (const cursoId of Object.keys(this._modulos)) {
                const modulos = this._modulos[cursoId];
                for (const modulo of modulos) {
                    const clases = this._clases[modulo.id] || [];
                    const claseEncontrada = clases.find(c => c.id === claseId);
                    if (claseEncontrada) {
                        this.marcarClaseCompletada(cursoId, modulo.id, claseId);
                        break;
                    }
                }
            }
        }

        this.saveStudent(this._student);
    },

    // ==================== CERTIFICADOS ====================

    puedeObtenerCertificado(cursoId) {
        const modulos = this.getModulosByCurso(cursoId);

        for (const modulo of modulos) {
            const clases = this.getClasesByModulo(modulo.id);

            for (const clase of clases) {
                const estado = this.getEstadoClase(cursoId, modulo.id, clase.id);

                if (clase.tipo === 'entrega' || clase.tipo === 'ENTREGA' || clase.tipo === 'PRACTICA') {
                    const ultimaEntrega = this.getUltimaEntrega(clase.id);

                    if (!ultimaEntrega) {
                        return {
                            puede: false,
                            razon: 'entrega',
                            moduloNombre: modulo.nombre
                        };
                    }

                    const estadoNorm = (ultimaEntrega.estado || '').toLowerCase();

                    if (estadoNorm === 'pendiente') {
                        return {
                            puede: false,
                            razon: 'pendiente',
                            moduloNombre: modulo.nombre
                        };
                    }

                    if (estadoNorm === 'rechazada') {
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
     * Cargar certificados del alumno desde la tabla certificados de Supabase
     */
    async cargarCertificadosDesdeSupabase() {
        if (!this._currentUserId) return;

        try {
            const result = await CursosService.getCertificadosByUsuario(this._currentUserId);
            if (result.success && result.data.length > 0) {
                if (!this._student.certificados) {
                    this._student.certificados = {};
                }

                result.data.forEach(cert => {
                    this._student.certificados[cert.curso_id] = {
                        id: cert.id,
                        fecha: cert.fecha_emision,
                        codigo: cert.codigo_verificacion,
                        nombreAlumnoSnapshot: cert.nombre_alumno_snapshot,
                        nombreCursoSnapshot: cert.nombre_curso_snapshot,
                        urlDescarga: cert.url_descarga,
                        fromSupabase: true
                    };
                });

                this.saveStudent(this._student);
                console.log(`CursosData: ${result.data.length} certificados cargados desde Supabase`);
            }
        } catch (error) {
            console.error('Error al cargar certificados desde Supabase:', error);
        }
    },

    /**
     * Generar y guardar certificado en Supabase
     * @param {string} cursoId - UUID del curso
     * @returns {Object} Datos del certificado creado
     */
    async generarCertificado(cursoId) {
        if (!this._student) return null;

        // Obtener datos para el snapshot
        const curso = this.getCurso(cursoId);
        const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
        const nombreAlumno = usuarioActual.apellido
            ? `${usuarioActual.nombre} ${usuarioActual.apellido}`
            : (usuarioActual.nombre || this._student.nombre || 'Estudiante');
        const nombreCurso = curso?.nombre || 'Curso';

        // Generar código de verificación único
        const codigo = this._generarCodigoCertificado(cursoId);

        // Intentar guardar en Supabase
        if (this._currentUserId) {
            try {
                const result = await CursosService.crearCertificado({
                    usuario_id: this._currentUserId,
                    curso_id: cursoId,
                    nombre_alumno_snapshot: nombreAlumno,
                    nombre_curso_snapshot: nombreCurso,
                    codigo_verificacion: codigo
                });

                if (result.success) {
                    const cert = result.data;
                    if (!this._student.certificados) {
                        this._student.certificados = {};
                    }
                    this._student.certificados[cursoId] = {
                        id: cert.id,
                        fecha: cert.fecha_emision,
                        codigo: cert.codigo_verificacion,
                        nombreAlumnoSnapshot: cert.nombre_alumno_snapshot,
                        nombreCursoSnapshot: cert.nombre_curso_snapshot,
                        urlDescarga: cert.url_descarga,
                        fromSupabase: true
                    };
                    this.saveStudent(this._student);
                    console.log('Certificado guardado en Supabase:', cert.codigo_verificacion);
                    return this._student.certificados[cursoId];
                }
            } catch (error) {
                console.error('Error al guardar certificado en Supabase:', error);
            }
        }

        // Fallback: guardar solo en localStorage
        if (!this._student.certificados) {
            this._student.certificados = {};
        }
        this._student.certificados[cursoId] = {
            fecha: new Date().toISOString(),
            codigo: codigo
        };
        this.saveStudent(this._student);
        return this._student.certificados[cursoId];
    },

    /**
     * Obtener certificado de un curso (desde cache local, ya cargado de Supabase)
     */
    getCertificado(cursoId) {
        return this._student?.certificados?.[cursoId] || null;
    },

    /**
     * Obtener todos los certificados del estudiante
     */
    getCertificados() {
        return this._student?.certificados || {};
    },

    _generarCodigoCertificado(cursoId) {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `KB-${año}-${random}-${String(cursoId).substring(0, 8)}`;
    },

    // ==================== UTILIDADES ====================

    _loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('kikibrows_cursos_cache');
            if (data) {
                const parsed = JSON.parse(data);
                this._cursos = parsed.cursos || [];
                this._modulos = parsed.modulos || {};
                this._clases = parsed.clases || {};
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

    async verificarAccesoCurso(cursoId) {
        if (!this._currentUserId) return false;

        // Verificar en cache local (incluye compras + inscripciones)
        const cursoLocal = this._cursosAdquiridos.find(c => c.id === cursoId);
        if (cursoLocal) {
            const acceso = this._calcularAcceso(cursoLocal);
            return !acceso.expirado;
        }

        // Fallback: verificar en Supabase
        const result = await CursosService.verificarAccesoCurso(cursoId, this._currentUserId);
        return result.tieneAcceso;
    },

    getCurrentUserId() {
        return this._currentUserId;
    }
};

window.CursosData = CursosData;

export default CursosData;
export { CursosData };