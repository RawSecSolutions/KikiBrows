// js/cursosService.js - Servicio de Cursos conectado a Supabase
// Conecta el frontend con las tablas: cursos, modulos, clases, entregas, transacciones

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
     * Obtener cursos adquiridos por el usuario
     */
    async getCursosAdquiridos(usuarioId) {
        try {
            const { data: transacciones, error } = await supabase
                .from('transacciones')
                .select(`
                    id,
                    curso_id,
                    estado,
                    fecha_compra,
                    cursos (
                        id,
                        nombre,
                        descripcion,
                        portada_url,
                        dias_duracion_acceso
                    )
                `)
                .eq('usuario_id', usuarioId)
                .eq('estado', 'PAGADO');

            if (error) throw error;

            // Extraer cursos de las transacciones
            const cursos = transacciones
                .filter(t => t.cursos)
                .map(t => ({
                    ...t.cursos,
                    fechaCompra: t.fecha_compra,
                    transaccionId: t.id
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

    // ==================== PROGRESO ====================

    /**
     * Guardar progreso de una clase
     */
    async guardarProgreso(cursoId, moduloId, claseId, usuarioId, estado) {
        try {
            // Primero verificar si ya existe un registro
            const { data: existente } = await supabase
                .from('progreso_usuario')
                .select('id')
                .eq('usuario_id', usuarioId)
                .eq('clase_id', claseId)
                .single();

            let result;
            if (existente) {
                // Actualizar
                result = await supabase
                    .from('progreso_usuario')
                    .update({
                        completado: estado.completado,
                        porcentaje: estado.porcentaje || 0,
                        ultima_actividad: new Date().toISOString()
                    })
                    .eq('id', existente.id)
                    .select()
                    .single();
            } else {
                // Insertar
                result = await supabase
                    .from('progreso_usuario')
                    .insert([{
                        usuario_id: usuarioId,
                        curso_id: cursoId,
                        modulo_id: moduloId,
                        clase_id: claseId,
                        completado: estado.completado,
                        porcentaje: estado.porcentaje || 0
                    }])
                    .select()
                    .single();
            }

            if (result.error) throw result.error;
            return { success: true, data: result.data };
        } catch (error) {
            console.error('Error al guardar progreso:', error);
            return { success: false, error };
        }
    },

    /**
     * Obtener progreso del usuario en un curso
     */
    async getProgresoCurso(cursoId, usuarioId) {
        try {
            const { data, error } = await supabase
                .from('progreso_usuario')
                .select('*')
                .eq('curso_id', cursoId)
                .eq('usuario_id', usuarioId);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener progreso:', error);
            return { success: false, error, data: [] };
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
    }
};

// Exportar también el cliente de Supabase para uso directo si es necesario
export { supabase };

// Hacer el servicio disponible globalmente para scripts no modulares
window.CursosService = CursosService;
