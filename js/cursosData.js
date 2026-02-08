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
        if (!this._student?.progreso?.[cursoId]) {
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

        this._student.quizAttempts[claseId].push({
            fecha: new Date().toISOString(),
            respuestas,
            puntaje,
            aprobado
        });

        this.saveStudent(this._student);
    },

    getIntentosQuiz(claseId) {
        return this._student?.quizAttempts?.[claseId] || [];
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

                if (clase.tipo === 'entrega' || clase.tipo === 'ENTREGA') {
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

    _generarCodigoCertificado(cursoId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `KB-${cursoId}-${timestamp}-${random}`;
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