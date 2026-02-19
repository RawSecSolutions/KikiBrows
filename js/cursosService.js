// js/cursosService.js - Servicio de Cursos conectado a Supabase
// Conecta el frontend con las tablas: cursos, modulos, clases, entregas, transacciones

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Cache de buckets ya verificados para no repetir la verificación en cada subida
const _bucketsVerificados = new Set();

async function ensureBucketExists(bucketName) {
    if (_bucketsVerificados.has(bucketName)) return;

    const { error } = await supabase.storage.createBucket(bucketName, {
        public: true
    });

    if (!error || error.message?.includes('already exists')) {
        _bucketsVerificados.add(bucketName);
        return;
    }

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (!listError && buckets?.some(b => b.name === bucketName)) {
        _bucketsVerificados.add(bucketName);
        return;
    }

    throw new Error(
        `El bucket de almacenamiento "${bucketName}" no existe en Supabase. ` +
        `Créalo desde el panel de Supabase > Storage > New Bucket con el nombre "${bucketName}" y marcado como público.`
    );
}

// ==================== SERVICIO DE CURSOS ====================

export const CursosService = {

    // ==================== CURSOS ====================

    /**
     * Obtener todos los cursos publicados (para landing page)
     * Solo muestra estructura básica sin contenido completo
     */
    async getAllCursosPublicados() {
        try {
            const { data, error } = await supabase
                .from('cursos')
                .select(`
                    id,
                    nombre,
                    descripcion,
                    portada_url,
                    precio,
                    estado,
                    dias_duracion_acceso,
                    created_at
                `)
                .eq('estado', 'PUBLICADO')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener cursos publicados:', error);
            return { success: false, error, data: [] };
        }
    },

    /**
     * Obtener estructura del curso para preview (sin contenido)
     * Usa la función RPC segura obtener_preview_curso
     * Solo nombres de módulos y clases - acceso público
     */
    async getCursoPreview(cursoId) {
        try {
            // Primero obtener datos básicos del curso
            const { data: cursoData, error: cursoError } = await supabase
                .from('cursos')
                .select('id, nombre, descripcion, portada_url, precio, estado, dias_duracion_acceso')
                .eq('id', cursoId)
                .single();

            if (cursoError) throw cursoError;

            // Usar la función RPC segura para obtener módulos y clases
            const { data: previewData, error: previewError } = await supabase
                .rpc('obtener_preview_curso', {
                    curso_id_input: cursoId
                });

            if (previewError) throw previewError;

            // Agrupar por módulo para estructura anidada
            const modulosMap = new Map();

            (previewData || []).forEach(row => {
                if (!modulosMap.has(row.modulo_nombre)) {
                    modulosMap.set(row.modulo_nombre, {
                        nombre: row.modulo_nombre,
                        orden: row.modulo_orden,
                        clases: []
                    });
                }

                modulosMap.get(row.modulo_nombre).clases.push({
                    nombre: row.clase_nombre,
                    orden: row.clase_orden,
                    tipo: row.clase_tipo,
                    duracion: row.clase_duracion
                });
            });

            // Convertir a array y ordenar
            const modulos = Array.from(modulosMap.values())
                .sort((a, b) => a.orden - b.orden);

            modulos.forEach(mod => {
                mod.clases.sort((a, b) => a.orden - b.orden);
            });

            const data = {
                ...cursoData,
                modulos
            };

            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener preview del curso:', error);
            return { success: false, error, data: null };
        }
    },

    /**
     * Obtener curso completo con todo el contenido (para alumnos con acceso)
     * Incluye metadata, contenido_url, contenido_texto, etc.
     */
    async getCursoCompleto(cursoId) {
        try {
            const { data, error } = await supabase
                .from('cursos')
                .select(`
                    *,
                    modulos (
                        id,
                        nombre,
                        descripcion,
                        orden,
                        clases (
                            id,
                            nombre,
                            descripcion,
                            tipo,
                            duracion,
                            orden,
                            contenido_url,
                            contenido_texto,
                            metadata
                        )
                    )
                `)
                .eq('id', cursoId)
                .single();

            if (error) throw error;

            // Ordenar módulos y clases
            if (data && data.modulos) {
                data.modulos.sort((a, b) => a.orden - b.orden);
                data.modulos.forEach(mod => {
                    if (mod.clases) mod.clases.sort((a, b) => a.orden - b.orden);
                });
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener curso completo:', error);
            return { success: false, error, data: null };
        }
    },

    /**
     * Obtener curso por ID (básico)
     */
    async getCurso(cursoId) {
        try {
            const { data, error } = await supabase
                .from('cursos')
                .select('*')
                .eq('id', cursoId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener curso:', error);
            return { success: false, error, data: null };
        }
    },

    // ==================== MÓDULOS ====================

    /**
     * Obtener módulos de un curso
     */
    async getModulosByCurso(cursoId) {
        try {
            const { data, error } = await supabase
                .from('modulos')
                .select(`
                    id,
                    nombre,
                    descripcion,
                    orden,
                    curso_id
                `)
                .eq('curso_id', cursoId)
                .order('orden', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener módulos:', error);
            return { success: false, error, data: [] };
        }
    },

    /**
     * Obtener un módulo por ID
     */
    async getModulo(moduloId) {
        try {
            const { data, error } = await supabase
                .from('modulos')
                .select('*')
                .eq('id', moduloId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener módulo:', error);
            return { success: false, error, data: null };
        }
    },

    // ==================== CLASES ====================

    /**
     * Obtener clases de un módulo
     */
    async getClasesByModulo(moduloId) {
        try {
            const { data, error } = await supabase
                .from('clases')
                .select(`
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
                `)
                .eq('modulo_id', moduloId)
                .order('orden', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener clases:', error);
            return { success: false, error, data: [] };
        }
    },

    /**
     * Obtener una clase por ID
     */
    async getClase(claseId) {
        try {
            const { data, error } = await supabase
                .from('clases')
                .select('*')
                .eq('id', claseId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener clase:', error);
            return { success: false, error, data: null };
        }
    },

    // ==================== TRANSACCIONES / ACCESO ====================

    /**
     * Verificar si el usuario tiene acceso a un curso (ha pagado)
     */
    async verificarAccesoCurso(cursoId, usuarioId) {
        try {
            const { data, error } = await supabase
                .from('transacciones')
                .select('id, estado, fecha_compra')
                .eq('curso_id', cursoId)
                .eq('usuario_id', usuarioId)
                .eq('estado', 'PAGADO')
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

            return {
                success: true,
                tieneAcceso: !!data,
                transaccion: data
            };
        } catch (error) {
            console.error('Error al verificar acceso:', error);
            return { success: false, tieneAcceso: false, error };
        }
    },

    /**
     * Obtener cursos adquiridos por el usuario (vía Inscripciones)
     * Ahora lee la tabla 'inscripciones' para incluir asignaciones manuales
     */
    async getCursosAdquiridos(usuarioId) {
        try {
            const { data: inscripciones, error } = await supabase
                .from('inscripciones')
                .select(`
                    id,
                    curso_id,
                    estado,
                    fecha_expiracion,
                    porcentaje_progreso,
                    acceso_bloqueado,
                    cursos (
                        id,
                        nombre,
                        descripcion,
                        portada_url,
                        dias_duracion_acceso
                    )
                `)
                .eq('usuario_id', usuarioId)
                .eq('estado', 'ACTIVO') // Solo accesos activos
                .eq('acceso_bloqueado', false); // Solo si no está bloqueado

            if (error) throw error;

            // Formateamos los datos para que el frontend los entienda
            const cursos = inscripciones
                .filter(ins => ins.cursos)
                .map(ins => ({
                    ...ins.cursos,
                    inscripcionId: ins.id,
                    progreso: { 
                        porcentaje: ins.porcentaje_progreso || 0 
                    },
                    fechaExpiracion: ins.fecha_expiracion,
                    // Verificamos si ya expiró
                    accesoExpirado: ins.fecha_expiracion ? new Date(ins.fecha_expiracion) < new Date() : false
                }));

            return { success: true, data: cursos };
        } catch (error) {
            console.error('Error al obtener cursos adquiridos:', error);
            return { success: false, error, data: [] };
        }
    },
    
    /**
     * Registrar una transacción de compra
     */
    async registrarTransaccion(transaccionData) {
        try {
            const { data, error } = await supabase
                .from('transacciones')
                .insert([{
                    usuario_id: transaccionData.usuarioId,
                    curso_id: transaccionData.cursoId,
                    monto: transaccionData.monto,
                    estado: transaccionData.estado || 'PENDIENTE',
                    metodo_pago: transaccionData.metodoPago,
                    codigo_autorizacion: transaccionData.codigoAutorizacion,
                    gateway_token: transaccionData.gatewayToken
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al registrar transacción:', error);
            return { success: false, error };
        }
    },

    // ==================== ENTREGAS ====================

    /**
     * Subir una entrega práctica
     * Path format: ${cursoId}/${claseId}/${userId}/${timestamp.ext}
     *
     * IMPORTANTE: Si la inserción en BD falla, se elimina el archivo del Storage
     * para evitar archivos huérfanos (Caso 2 de seguridad)
     */
    async subirEntrega(claseId, file, usuarioId, cursoId) {
        // Validar que todos los parámetros sean UUIDs válidos o valores correctos
        if (!cursoId || !claseId || !usuarioId) {
            return {
                success: false,
                error: { message: 'Faltan parámetros requeridos: cursoId, claseId o usuarioId' }
            };
        }

        let filePath = null; // Para poder limpiar si falla

        try {
            // A. Construir el path con formato requerido por políticas de Storage
            // Formato: ${cursoId}/${claseId}/${userId}/${timestamp}.${ext}
            const fileExt = file.name.split('.').pop().toLowerCase();
            const timestamp = Date.now();
            filePath = `${cursoId}/${claseId}/${usuarioId}/${timestamp}.${fileExt}`;

            // B. Subir archivo al Storage (Bucket 'entregas')
            await ensureBucketExists('entregas');

            const { error: uploadError } = await supabase.storage
                .from('entregas')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // C. Obtener URL pública
            const { data: publicUrlData } = supabase.storage
                .from('entregas')
                .getPublicUrl(filePath);

            // D. Contar intentos anteriores
            const { data: intentosAnteriores } = await supabase
                .from('entregas')
                .select('intento_numero')
                .eq('clase_id', claseId)
                .eq('usuario_id', usuarioId)
                .order('intento_numero', { ascending: false })
                .limit(1);

            const intentoNumero = intentosAnteriores && intentosAnteriores.length > 0
                ? intentosAnteriores[0].intento_numero + 1
                : 1;

            // E. Guardar registro en la tabla 'entregas'
            const { data, error: dbError } = await supabase
                .from('entregas')
                .insert([{
                    clase_id: claseId,
                    usuario_id: usuarioId,
                    archivo_url: publicUrlData.publicUrl,
                    tipo_archivo: fileExt,
                    estado: 'PENDIENTE',
                    intento_numero: intentoNumero
                }])
                .select()
                .single();

            if (dbError) {
                // CASO 2: Si la inserción en BD falla, eliminar archivo huérfano del Storage
                console.error('Error insertando en BD, eliminando archivo huérfano del Storage...');
                await supabase.storage.from('entregas').remove([filePath]);
                throw dbError;
            }

            return { success: true, data, filePath };

        } catch (error) {
            console.error('Error subiendo entrega:', error);

            // Limpieza adicional: si tenemos filePath y hubo error, intentar eliminar
            if (filePath) {
                try {
                    await supabase.storage.from('entregas').remove([filePath]);
                    console.log('Archivo huérfano eliminado del Storage');
                } catch (cleanupError) {
                    console.warn('No se pudo eliminar archivo huérfano:', cleanupError);
                }
            }

            return { success: false, error };
        }
    },

    /**
     * Eliminar una entrega (solo si está en estado PENDIENTE)
     */
    async eliminarEntrega(entregaId, archivoUrl) {
        try {
            // A. Verificar que la entrega existe y está pendiente
            const { data: entrega, error: fetchError } = await supabase
                .from('entregas')
                .select('*')
                .eq('id', entregaId)
                .single();

            if (fetchError) throw fetchError;

            if (entrega.estado !== 'PENDIENTE') {
                return {
                    success: false,
                    error: { message: 'Solo se pueden eliminar entregas pendientes' }
                };
            }

            // B. Extraer el path del archivo desde la URL
            // La URL tiene formato: .../entregas/cursoId/claseId/userId/timestamp.ext
            const urlParts = archivoUrl.split('/entregas/');
            if (urlParts.length > 1) {
                const filePath = urlParts[1];

                // C. Eliminar archivo del Storage
                const { error: storageError } = await supabase.storage
                    .from('entregas')
                    .remove([filePath]);

                if (storageError) {
                    console.warn('Error eliminando archivo de storage:', storageError);
                    // Continuamos aunque falle el storage
                }
            }

            // D. Eliminar registro de la base de datos
            const { error: dbError } = await supabase
                .from('entregas')
                .delete()
                .eq('id', entregaId);

            if (dbError) throw dbError;

            return { success: true };

        } catch (error) {
            console.error('Error eliminando entrega:', error);
            return { success: false, error };
        }
    },

    /**
     * Obtener entregas de una clase para un usuario
     */
    async getEntregasByClase(claseId, usuarioId) {
        try {
            const { data, error } = await supabase
                .from('entregas')
                .select('*')
                .eq('clase_id', claseId)
                .eq('usuario_id', usuarioId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener entregas:', error);
            return { success: false, error, data: [] };
        }
    },

    /**
     * Obtener la última entrega de una clase
     */
    async getUltimaEntrega(claseId, usuarioId) {
        try {
            const { data, error } = await supabase
                .from('entregas')
                .select('*')
                .eq('clase_id', claseId)
                .eq('usuario_id', usuarioId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener última entrega:', error);
            return { success: false, error, data: null };
        }
    },

    // ==================== PROGRESO (progreso_clases) ====================

    /**
     * Guardar/actualizar progreso de una clase en progreso_clases
     * Usa UPSERT gracias al UNIQUE(usuario_id, clase_id)
     */
    async guardarProgreso(cursoId, moduloId, claseId, usuarioId, estado) {
        try {
            const updateData = {
                usuario_id: usuarioId,
                clase_id: claseId,
                completada: estado.completado || false,
                ultimo_acceso: new Date().toISOString()
            };

            if (estado.completado) {
                updateData.fecha_completado = new Date().toISOString();
            }

            if (estado.segundoActual !== undefined) {
                updateData.segundo_actual = estado.segundoActual;
            }

            const { data, error } = await supabase
                .from('progreso_clases')
                .upsert(updateData, { onConflict: 'usuario_id,clase_id' })
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al guardar progreso:', error);
            return { success: false, error };
        }
    },

    /**
     * Obtener todo el progreso del usuario en un curso
     * Hace join con clases -> modulos para filtrar por curso_id
     */
    async getProgresoCurso(cursoId, usuarioId) {
        try {
            const { data, error } = await supabase
                .from('progreso_clases')
                .select(`
                    id,
                    clase_id,
                    completada,
                    segundo_actual,
                    fecha_completado,
                    ultimo_acceso,
                    clases!inner (
                        id,
                        modulo_id,
                        modulos!inner (
                            id,
                            curso_id
                        )
                    )
                `)
                .eq('usuario_id', usuarioId)
                .eq('clases.modulos.curso_id', cursoId);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener progreso:', error);
            return { success: false, error, data: [] };
        }
    },

    /**
     * Obtener la última clase accedida en un curso (para "Reanudar Curso")
     * Usa la función RPC de Supabase
     */
    async getUltimaClaseCurso(cursoId, usuarioId) {
        try {
            const { data, error } = await supabase
                .rpc('obtener_ultima_clase_curso', {
                    p_curso_id: cursoId,
                    p_usuario_id: usuarioId
                });

            if (error) throw error;
            return { success: true, data: data && data.length > 0 ? data[0] : null };
        } catch (error) {
            console.error('Error al obtener última clase:', error);
            return { success: false, error, data: null };
        }
    },

    /**
     * Calcular % progreso de un curso via RPC
     */
    async calcularProgresoCursoRPC(cursoId, usuarioId) {
        try {
            const { data, error } = await supabase
                .rpc('calcular_progreso_curso', {
                    p_curso_id: cursoId,
                    p_usuario_id: usuarioId
                });

            if (error) throw error;
            return { success: true, porcentaje: data || 0 };
        } catch (error) {
            console.error('Error al calcular progreso:', error);
            return { success: false, error, porcentaje: 0 };
        }
    },

    // ==================== INTENTOS QUIZ (intentos_quiz) ====================

    /**
     * Guardar un intento de quiz en Supabase
     */
    async guardarIntentoQuiz(claseId, usuarioId, intentoData) {
        try {
            const { data, error } = await supabase
                .from('intentos_quiz')
                .insert([{
                    usuario_id: usuarioId,
                    clase_id: claseId,
                    intento_numero: intentoData.intentoNumero || 1,
                    calificacion: intentoData.calificacion,
                    aprobado: intentoData.aprobado,
                    respuestas_usuario: intentoData.respuestas
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al guardar intento quiz:', error);
            return { success: false, error };
        }
    },

    /**
     * Obtener intentos de quiz de un usuario para una clase
     */
    async getIntentosQuiz(claseId, usuarioId) {
        try {
            const { data, error } = await supabase
                .from('intentos_quiz')
                .select('*')
                .eq('clase_id', claseId)
                .eq('usuario_id', usuarioId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error al obtener intentos quiz:', error);
            return { success: false, error, data: [] };
        }
    },

    // ==================== ENTREGAS ADMIN ====================

    /**
     * Obtener todas las entregas pendientes (para admin)
     * Incluye datos del curso, módulo, clase y usuario
     */
    async getEntregasAdmin(estado = null, page = 1, perPage = 10) {
        try {
            let query = supabase
                .from('entregas')
                .select(`
                    *,
                    clases!inner (
                        id,
                        nombre,
                        modulo_id,
                        modulos!inner (
                            id,
                            nombre,
                            curso_id,
                            cursos!inner (
                                id,
                                nombre
                            )
                        )
                    ),
                    profiles (
                        id,
                        first_name,
                        last_name
                    )
                `, { count: 'exact' });

            if (estado) {
                if (Array.isArray(estado)) {
                    query = query.in('estado', estado);
                } else {
                    query = query.eq('estado', estado);
                }
            }

            const from = (page - 1) * perPage;
            const to = from + perPage - 1;

            query = query
                .order('fecha_entrega', { ascending: false })
                .range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;
            return { success: true, data: data || [], count: count || 0 };
        } catch (error) {
            console.error('Error al obtener entregas admin:', error);
            return { success: false, error, data: [], count: 0 };
        }
    },

    /**
     * Calificar una entrega (admin)
     * Actualiza estado, feedback, calificacion y fecha_revision
     */
    async calificarEntrega(entregaId, calificacionData) {
        try {
            const updateData = {
                estado: calificacionData.estado,
                feedback_instructor: calificacionData.feedback || null,
                calificacion: calificacionData.calificacion || null,
                fecha_revision: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('entregas')
                .update(updateData)
                .eq('id', entregaId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al calificar entrega:', error);
            return { success: false, error };
        }
    },

    /**
     * Contar entregas pendientes (para dashboard admin)
     */
    async contarEntregasPendientes() {
        try {
            const { count, error } = await supabase
                .from('entregas')
                .select('id', { count: 'exact', head: true })
                .eq('estado', 'PENDIENTE');

            if (error) throw error;
            return { success: true, count: count || 0 };
        } catch (error) {
            console.error('Error al contar entregas pendientes:', error);
            return { success: false, error, count: 0 };
        }
    },

    // ==================== UTILIDADES ====================

    /**
     * Obtener sesión actual del usuario
     */
    async getCurrentUser() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return { success: true, user: session?.user || null, session };
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            return { success: false, error, user: null };
        }
    },

    /**
     * Calcular duración total de un módulo
     */
    calcularDuracionModulo(clases) {
        return clases.reduce((total, clase) => total + (clase.duracion || 0), 0);
    },

    /**
     * Calcular duración total de un curso
     */
    calcularDuracionCurso(modulos) {
        let total = 0;
        modulos.forEach(modulo => {
            if (modulo.clases) {
                total += this.calcularDuracionModulo(modulo.clases);
            }
        });
        return total;
    },

    /**
     * Formatear duración en minutos a texto legible
     */
    formatearDuracion(minutos) {
        if (minutos < 60) {
            return `${minutos} min`;
        }
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        if (mins === 0) {
            return `${horas}h`;
        }
        return `${horas}h ${mins}min`;
    },

    // ==================== CERTIFICADOS ====================

    /**
     * Obtener todos los certificados de un usuario
     * @param {string} userId - UUID del usuario
     */
    async getCertificadosByUsuario(userId) {
        try {
            const { data, error } = await supabase
                .from('certificados')
                .select('*')
                .eq('usuario_id', userId)
                .order('fecha_emision', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error al obtener certificados:', error);
            return { success: false, error, data: [] };
        }
    },

    /**
     * Obtener certificado específico de un usuario para un curso
     * @param {string} cursoId - UUID del curso
     * @param {string} userId - UUID del usuario
     */
    async getCertificadoByCurso(cursoId, userId) {
        try {
            const { data, error } = await supabase
                .from('certificados')
                .select('*')
                .eq('usuario_id', userId)
                .eq('curso_id', cursoId)
                .maybeSingle();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener certificado:', error);
            return { success: false, error, data: null };
        }
    },

    /**
     * Llamar RPC que genera certificado automáticamente si el curso está completo al 100%.
     * Los snapshots (nombre alumno, nombre curso) se toman server-side desde las tablas
     * profiles y cursos, así no dependen del frontend ni de localStorage.
     * @param {string} cursoId - UUID del curso
     * @param {string} userId - UUID del usuario
     * @returns {Object} { success, data: { generado, ya_existia, certificado, progreso } }
     */
    async generarCertificadoSiCompleto(cursoId, userId) {
        try {
            const { data, error } = await supabase
                .rpc('generar_certificado_si_completo', {
                    p_curso_id: cursoId,
                    p_usuario_id: userId
                });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al intentar generar certificado:', error);
            return { success: false, error };
        }
    }
};

// Exportar también el cliente de Supabase para uso directo si es necesario
export { supabase };

// Hacer el servicio disponible globalmente para scripts no modulares
window.CursosService = CursosService;
