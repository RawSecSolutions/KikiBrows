// js/adminCursosService.js - Servicio de administración de cursos
// Funciones para crear, editar y subir contenido de cursos

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Cache de buckets ya verificados para no repetir la verificación en cada subida
const _bucketsVerificados = new Set();

/**
 * Asegura que un bucket de Storage exista en Supabase.
 * Si no existe, intenta crearlo como bucket público.
 * Cachea el resultado para evitar verificaciones repetidas.
 */
async function ensureBucketExists(bucketName) {
    if (_bucketsVerificados.has(bucketName)) return;

    const { error } = await supabase.storage.createBucket(bucketName, {
        public: true
    });

    // Si no hay error o el bucket ya existía, marcarlo como verificado
    if (!error || error.message?.includes('already exists')) {
        _bucketsVerificados.add(bucketName);
        return;
    }

    // Si falló por permisos, intentar listar para verificar si existe
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

export const AdminCursosService = {

    // Exponer cliente Supabase para consultas directas
    supabase: supabase,

    // ==================== SUBIDA DE ARCHIVOS ====================

    /**
     * Subir video a Supabase Storage
     */
    async subirVideo(file, cursoId, claseId = 'temp', onProgress = null) {
        try {
            if (!file) return { success: false, error: 'No se proporcionó archivo' };

            const maxSize = 500 * 1024 * 1024; // 500MB
            if (file.size > maxSize) return { success: false, error: 'El archivo excede los 500MB permitidos' };

            const validTypes = ['video/mp4', 'video/webm'];
            if (!validTypes.includes(file.type)) return { success: false, error: 'Formato no válido. Solo MP4 o WEBM' };

            const fileExt = file.name.split('.').pop();
            const timestamp = Date.now();
            const fileName = `${cursoId}/${claseId}_${timestamp}.${fileExt}`;

            await ensureBucketExists('videos');

            const { data, error } = await supabase.storage
                .from('videos')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('videos')
                .getPublicUrl(fileName);

            return { success: true, url: publicUrlData.publicUrl, path: fileName };

        } catch (error) {
            console.error('Error al subir video:', error);
            const msg = error.message || String(error);
            if (msg.includes('Bucket') || msg.includes('bucket') || msg.includes('not found')) {
                return { success: false, error: 'Error de almacenamiento: el bucket "videos" no existe. Créalo en Supabase > Storage.' };
            }
            return { success: false, error: msg };
        }
    },

    /**
     * Subir imagen de portada a Supabase Storage
     */
    async subirImagenPortada(file) {
        try {
            if (!file) return { success: false, error: 'No se proporcionó archivo' };

            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
            if (!validTypes.includes(file.type)) return { success: false, error: 'Formato no válido. Solo PNG, JPG, WEBP' };

            const maxSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSize) return { success: false, error: 'La imagen excede los 2MB permitidos' };

            const fileExt = file.name.split('.').pop();
            const timestamp = Date.now();
            const fileName = `portadas/${timestamp}.${fileExt}`;

            await ensureBucketExists('curso-portadas');

            const { data, error } = await supabase.storage
                .from('curso-portadas')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('curso-portadas')
                .getPublicUrl(fileName);

            return { success: true, url: publicUrlData.publicUrl, path: fileName };

        } catch (error) {
            console.error('Error al subir imagen de portada:', error);
            const msg = error.message || String(error);
            if (msg.includes('Bucket') || msg.includes('bucket') || msg.includes('not found')) {
                return { success: false, error: 'Error de almacenamiento: el bucket "curso-portadas" no existe. Créalo en Supabase > Storage.' };
            }
            return { success: false, error: msg };
        }
    },

    /**
     * Subir archivo PDF a Supabase Storage
     */
    async subirPDF(file, cursoId, claseId = 'temp') {
        try {
            if (!file) return { success: false, error: 'No se proporcionó archivo' };
            if (file.type !== 'application/pdf') return { success: false, error: 'El archivo debe ser PDF' };

            const maxSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxSize) return { success: false, error: 'El archivo excede los 50MB permitidos' };

            const timestamp = Date.now();
            const fileName = `${cursoId}/${claseId}_${timestamp}.pdf`;

            await ensureBucketExists('documentos');

            const { data, error } = await supabase.storage
                .from('documentos')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('documentos')
                .getPublicUrl(fileName);

            return { success: true, url: publicUrlData.publicUrl, path: fileName };

        } catch (error) {
            console.error('Error al subir PDF:', error);
            const msg = error.message || String(error);
            if (msg.includes('Bucket') || msg.includes('bucket') || msg.includes('not found')) {
                return { success: false, error: 'Error de almacenamiento: el bucket "documentos" no existe. Créalo en Supabase > Storage.' };
            }
            return { success: false, error: msg };
        }
    },

    // ==================== GESTIÓN DE CURSOS ====================

    /**
     * Crear un nuevo curso
     */
    async crearCurso(cursoData) {
        try {
            const payload = {
                nombre: cursoData.nombre,
                descripcion: cursoData.descripcion,
                portada_url: cursoData.portada_url || null,
                precio: cursoData.precio || 0,
                estado: cursoData.estado || 'BORRADOR',
                dias_duracion_acceso: cursoData.dias_duracion_acceso || 180,
                en_carrusel: cursoData.en_carrusel || false,
                posicion_carrusel: cursoData.posicion_carrusel || null
            };

            const { data, error } = await supabase
                .from('cursos')
                .insert([payload])
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
            const payload = {
                nombre: cursoData.nombre,
                descripcion: cursoData.descripcion,
                precio: cursoData.precio,
                estado: cursoData.estado,
                dias_duracion_acceso: cursoData.dias_duracion_acceso,
                en_carrusel: cursoData.en_carrusel || false,
                posicion_carrusel: cursoData.posicion_carrusel || null
            };

            if (cursoData.portada_url) {
                payload.portada_url = cursoData.portada_url;
            }

            const { data, error } = await supabase
                .from('cursos')
                .update(payload)
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
            const payload = {};
            
            // Solo incluir campos que vienen en los datos
            if (moduloData.nombre !== undefined) payload.nombre = moduloData.nombre;
            if (moduloData.orden !== undefined) payload.orden = moduloData.orden;

            const { data, error } = await supabase
                .from('modulos')
                .update(payload)
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
     * Obtener un módulo por ID
     */
    async getModulo(moduloId) {
        try {
            const { data, error } = await supabase
                .from('modulos')
                .select('id, nombre, curso_id, orden')
                .eq('id', moduloId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener módulo:', error);
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
     * Obtener clases de un módulo
     */
    async getClasesPorModulo(moduloId) {
        try {
            const { data, error } = await supabase
                .from('clases')
                .select('*')
                .eq('modulo_id', moduloId)
                .order('orden', { ascending: true });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error al obtener clases:', error);
            return { success: false, error, data: [] };
        }
    },

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
     * Obtener un curso con sus módulos para edición
     */
    async getCursoParaEditar(cursoId) {
        try {
            const { data, error } = await supabase
                .from('cursos')
                .select(`
                    id, 
                    nombre, 
                    descripcion, 
                    precio, 
                    portada_url, 
                    estado, 
                    dias_duracion_acceso,
                    en_carrusel,
                    posicion_carrusel, 
                    modulos (
                        id,
                        nombre,
                        orden
                    )
                `)
                .eq('id', cursoId)
                .single();

            if (error) throw error;

            if (data && data.modulos) {
                data.modulos.sort((a, b) => (a.orden || 0) - (b.orden || 0));
            } else {
                if (data) data.modulos = [];
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error getCursoParaEditar:', error);
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

// Exponer globalmente
window.AdminCursosService = AdminCursosService;

export { supabase };