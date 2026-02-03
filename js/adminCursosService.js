// js/adminCursosService.js - Servicio de administración de cursos
// Funciones para crear, editar y subir contenido de cursos

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const AdminCursosService = {

    // ==================== SUBIDA DE ARCHIVOS ====================

    /**
     * Subir video a Supabase Storage
     * @param {File} file - Archivo de video
     * @param {string} cursoId - ID del curso
     * @param {string} claseId - ID de la clase (opcional, puede ser temporal)
     * @param {function} onProgress - Callback para progreso (0-100)
     * @returns {Promise<{success: boolean, url?: string, error?: any}>}
     */
    async subirVideo(file, cursoId, claseId = 'temp', onProgress = null) {
        try {
            // Validar archivo
            if (!file) {
                return { success: false, error: 'No se proporcionó archivo' };
            }

            const maxSize = 500 * 1024 * 1024; // 500MB
            if (file.size > maxSize) {
                return { success: false, error: 'El archivo excede los 500MB permitidos' };
            }

            const validTypes = ['video/mp4', 'video/webm'];
            if (!validTypes.includes(file.type)) {
                return { success: false, error: 'Formato no válido. Solo MP4 o WEBM' };
            }

            // Generar nombre único para el archivo
            const fileExt = file.name.split('.').pop();
            const timestamp = Date.now();
            const fileName = `${cursoId}/${claseId}_${timestamp}.${fileExt}`;

            // Subir a Supabase Storage (bucket: 'videos')
            const { data, error } = await supabase.storage
                .from('videos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Obtener URL pública
            const { data: publicUrlData } = supabase.storage
                .from('videos')
                .getPublicUrl(fileName);

            console.log('Video subido:', publicUrlData.publicUrl);

            return {
                success: true,
                url: publicUrlData.publicUrl,
                path: fileName
            };

        } catch (error) {
            console.error('Error al subir video:', error);
            return { success: false, error: error.message || error };
        }
    },

    /**
     * Subir archivo PDF a Supabase Storage
     */
    async subirPDF(file, cursoId, claseId = 'temp') {
        try {
            if (!file) {
                return { success: false, error: 'No se proporcionó archivo' };
            }

            if (file.type !== 'application/pdf') {
                return { success: false, error: 'El archivo debe ser PDF' };
            }

            const maxSize = 50 * 1024 * 1024; // 50MB para PDFs
            if (file.size > maxSize) {
                return { success: false, error: 'El archivo excede los 50MB permitidos' };
            }

            const timestamp = Date.now();
            const fileName = `${cursoId}/${claseId}_${timestamp}.pdf`;

            const { data, error } = await supabase.storage
                .from('documentos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('documentos')
                .getPublicUrl(fileName);

            return {
                success: true,
                url: publicUrlData.publicUrl,
                path: fileName
            };

        } catch (error) {
            console.error('Error al subir PDF:', error);
            return { success: false, error: error.message || error };
        }
    },

    // ==================== GESTIÓN DE CURSOS ====================

    /**
     * Crear un nuevo curso
     */
    async crearCurso(cursoData) {
        try {
            const { data, error } = await supabase
                .from('cursos')
                .insert([{
                    nombre: cursoData.nombre,
                    descripcion: cursoData.descripcion,
                    portada_url: cursoData.portada_url || null,
                    precio: cursoData.precio || 0,
                    estado: cursoData.estado || 'borrador',
                    dias_duracion_acceso: cursoData.dias_duracion_acceso || 180
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al crear curso:', error);
            return { success: false, error };
        }
    },

    /**
     * Actualizar un curso existente
     */
    async actualizarCurso(cursoId, cursoData) {
        try {
            const { data, error } = await supabase
                .from('cursos')
                .update(cursoData)
                .eq('id', cursoId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al actualizar curso:', error);
            return { success: false, error };
        }
    },

    // ==================== GESTIÓN DE MÓDULOS ====================

    /**
     * Crear un nuevo módulo
     */
    async crearModulo(moduloData) {
        try {
            const { data, error } = await supabase
                .from('modulos')
                .insert([{
                    curso_id: moduloData.curso_id,
                    nombre: moduloData.nombre,
                    descripcion: moduloData.descripcion || null,
                    orden: moduloData.orden || 1
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al crear módulo:', error);
            return { success: false, error };
        }
    },

    /**
     * Actualizar un módulo existente
     */
    async actualizarModulo(moduloId, moduloData) {
        try {
            const { data, error } = await supabase
                .from('modulos')
                .update(moduloData)
                .eq('id', moduloId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al actualizar módulo:', error);
            return { success: false, error };
        }
    },

    /**
     * Eliminar un módulo
     */
    async eliminarModulo(moduloId) {
        try {
            const { error } = await supabase
                .from('modulos')
                .delete()
                .eq('id', moduloId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar módulo:', error);
            return { success: false, error };
        }
    },

    // ==================== GESTIÓN DE CLASES ====================

    /**
     * Crear una nueva clase
     */
    async crearClase(claseData) {
        try {
            const insertData = {
                modulo_id: claseData.modulo_id,
                nombre: claseData.nombre,
                descripcion: claseData.descripcion || null,
                tipo: claseData.tipo || 'VIDEO',
                duracion: claseData.duracion || 5,
                orden: claseData.orden || 1,
                contenido_url: claseData.contenido_url || null,
                contenido_texto: claseData.contenido_texto || null,
                metadata: claseData.metadata || null
            };

            const { data, error } = await supabase
                .from('clases')
                .insert([insertData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al crear clase:', error);
            return { success: false, error };
        }
    },

    /**
     * Actualizar una clase existente
     */
    async actualizarClase(claseId, claseData) {
        try {
            const { data, error } = await supabase
                .from('clases')
                .update(claseData)
                .eq('id', claseId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al actualizar clase:', error);
            return { success: false, error };
        }
    },

    /**
     * Eliminar una clase
     */
    async eliminarClase(claseId) {
        try {
            const { error } = await supabase
                .from('clases')
                .delete()
                .eq('id', claseId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar clase:', error);
            return { success: false, error };
        }
    },

    /**
     * Crear clase con video (flujo completo)
     * 1. Sube el video a Storage
     * 2. Crea la clase con la URL del video
     */
    async crearClaseConVideo(claseData, videoFile, onProgress = null) {
        try {
            // 1. Subir video
            const uploadResult = await this.subirVideo(
                videoFile,
                claseData.curso_id || 'general',
                'new',
                onProgress
            );

            if (!uploadResult.success) {
                return { success: false, error: uploadResult.error };
            }

            // 2. Crear clase con URL del video
            const claseConVideo = {
                ...claseData,
                contenido_url: uploadResult.url
            };

            const claseResult = await this.crearClase(claseConVideo);

            if (!claseResult.success) {
                // Si falla crear la clase, intentar eliminar el video subido
                console.warn('Clase no creada, el video quedó huérfano:', uploadResult.path);
                return { success: false, error: claseResult.error };
            }

            return {
                success: true,
                data: claseResult.data,
                videoUrl: uploadResult.url
            };

        } catch (error) {
            console.error('Error al crear clase con video:', error);
            return { success: false, error };
        }
    },

    // ==================== REORDENAMIENTO ====================

    /**
     * Actualizar orden de módulos
     */
    async actualizarOrdenModulos(ordenArray) {
        try {
            // ordenArray = [{id: 'uuid', orden: 1}, {id: 'uuid', orden: 2}, ...]
            const promises = ordenArray.map(item =>
                supabase
                    .from('modulos')
                    .update({ orden: item.orden })
                    .eq('id', item.id)
            );

            await Promise.all(promises);
            return { success: true };
        } catch (error) {
            console.error('Error al actualizar orden de módulos:', error);
            return { success: false, error };
        }
    },

    /**
     * Actualizar orden de clases
     */
    async actualizarOrdenClases(ordenArray) {
        try {
            const promises = ordenArray.map(item =>
                supabase
                    .from('clases')
                    .update({ orden: item.orden })
                    .eq('id', item.id)
            );

            await Promise.all(promises);
            return { success: true };
        } catch (error) {
            console.error('Error al actualizar orden de clases:', error);
            return { success: false, error };
        }
    },

    // ==================== OBTENER DATOS ====================

    /**
     * Obtener un curso con sus módulos y clases para edición
     */
    async getCursoParaEditar(cursoId) {
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

            // Ordenar
            if (data && data.modulos) {
                data.modulos.sort((a, b) => a.orden - b.orden);
                data.modulos.forEach(mod => {
                    if (mod.clases) mod.clases.sort((a, b) => a.orden - b.orden);
                });
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener curso para editar:', error);
            return { success: false, error };
        }
    },

    /**
     * Obtener todos los cursos (para lista de admin)
     */
    async getAllCursos() {
        try {
            const { data, error } = await supabase
                .from('cursos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener cursos:', error);
            return { success: false, error, data: [] };
        }
    }
};

// Hacer disponible globalmente para scripts no modulares
window.AdminCursosService = AdminCursosService;

export { supabase };
