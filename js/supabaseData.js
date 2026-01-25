/**
 * js/supabaseData.js
 *
 * STUB DE COMPATIBILIDAD - Reemplaza cursosData.js
 *
 * Este archivo contiene la estructura de métodos que el frontend necesita.
 * Debes implementar cada método con llamadas directas a Supabase.
 *
 * Ejemplo de uso en tus métodos:
 *   const { data, error } = await supabase.from('cursos').select('*');
 *
 * IMPORTANTE: Agrega el SDK de Supabase antes de este archivo:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 */

// ==================== CONFIGURACIÓN SUPABASE ====================
// TODO: Reemplaza con tus credenciales
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'tu_anon_key_aqui';

// Inicializar cliente Supabase (descomentar cuando tengas el SDK)
// const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== OBJETO PRINCIPAL ====================
const CursosData = {

    // ==================== INICIALIZACIÓN ====================
    init() {
        console.log('📦 CursosData.init() - TODO: Implementar con Supabase');
        // Ya no necesitas localStorage, Supabase persiste los datos
    },

    initStudent() {
        console.log('📦 CursosData.initStudent() - TODO: Implementar con Supabase Auth');
    },

    // ==================== CURSOS ====================

    /**
     * Obtener un curso por ID
     * TODO: Implementar con Supabase
     *
     * Ejemplo:
     *   const { data, error } = await supabase
     *       .from('cursos')
     *       .select('*')
     *       .eq('id', cursoId)
     *       .single();
     *   return data;
     */
    getCurso(cursoId) {
        console.warn(`⚠️ CursosData.getCurso(${cursoId}) - TODO: Implementar con Supabase`);
        return null;
    },

    /**
     * Obtener todos los cursos
     */
    getCursos() {
        console.warn('⚠️ CursosData.getCursos() - TODO: Implementar con Supabase');
        return [];
    },

    /**
     * Obtener cursos publicados (para landing)
     */
    getCursosPublicados() {
        console.warn('⚠️ CursosData.getCursosPublicados() - TODO: Implementar con Supabase');
        return [];
    },

    /**
     * Obtener cursos para el carrusel
     */
    getCursosCarrusel() {
        console.warn('⚠️ CursosData.getCursosCarrusel() - TODO: Implementar con Supabase');
        return [];
    },

    // ==================== MÓDULOS ====================

    /**
     * Obtener módulos de un curso
     */
    getModulosByCurso(cursoId) {
        console.warn(`⚠️ CursosData.getModulosByCurso(${cursoId}) - TODO: Implementar con Supabase`);
        return [];
    },

    /**
     * Obtener un módulo por ID
     */
    getModulo(moduloId) {
        console.warn(`⚠️ CursosData.getModulo(${moduloId}) - TODO: Implementar con Supabase`);
        return null;
    },

    // ==================== CLASES ====================

    /**
     * Obtener clases de un módulo
     */
    getClasesByModulo(moduloId) {
        console.warn(`⚠️ CursosData.getClasesByModulo(${moduloId}) - TODO: Implementar con Supabase`);
        return [];
    },

    /**
     * Obtener una clase por ID
     */
    getClase(claseId) {
        console.warn(`⚠️ CursosData.getClase(${claseId}) - TODO: Implementar con Supabase`);
        return null;
    },

    // ==================== ESTUDIANTE / AUTH ====================

    /**
     * Obtener datos del estudiante actual
     */
    getStudent() {
        console.warn('⚠️ CursosData.getStudent() - TODO: Implementar con Supabase Auth');
        // Ejemplo con Supabase Auth:
        // const { data: { user } } = await supabase.auth.getUser();
        // return user?.user_metadata || {};
        return {};
    },

    /**
     * Guardar datos del estudiante
     */
    saveStudent(studentData) {
        console.warn('⚠️ CursosData.saveStudent() - TODO: Implementar con Supabase');
    },

    /**
     * Obtener cursos adquiridos por el estudiante
     */
    getCursosAdquiridos() {
        console.warn('⚠️ CursosData.getCursosAdquiridos() - TODO: Implementar con Supabase');
        // Ejemplo:
        // const { data } = await supabase
        //     .from('cursos_adquiridos')
        //     .select('*, curso:cursos(*)')
        //     .eq('user_id', userId);
        // return data.map(ca => ({ ...ca.curso, progreso: calcularProgreso(ca) }));
        return [];
    },

    // ==================== PROGRESO ====================

    /**
     * Calcular progreso de un curso
     */
    calcularProgresoCurso(cursoId) {
        console.warn(`⚠️ CursosData.calcularProgresoCurso(${cursoId}) - TODO: Implementar con Supabase`);
        return { porcentaje: 0, completados: 0, total: 0 };
    },

    /**
     * Obtener módulos completados
     */
    getModulosCompletados(cursoId) {
        console.warn(`⚠️ CursosData.getModulosCompletados(${cursoId}) - TODO: Implementar con Supabase`);
        return { completados: 0, total: 0 };
    },

    /**
     * Marcar clase como completada
     */
    marcarClaseCompletada(cursoId, moduloId, claseId) {
        console.warn(`⚠️ CursosData.marcarClaseCompletada() - TODO: Implementar con Supabase`);
        // Ejemplo:
        // await supabase.from('progreso_clases').upsert({
        //     user_id, curso_id: cursoId, modulo_id: moduloId, clase_id: claseId,
        //     completado: true, fecha_completado: new Date().toISOString()
        // });
        return { success: false };
    },

    /**
     * Obtener última clase vista
     */
    getUltimaClase(cursoId) {
        console.warn(`⚠️ CursosData.getUltimaClase(${cursoId}) - TODO: Implementar con Supabase`);
        return null;
    },

    /**
     * Verificar si una clase está completada
     */
    isClaseCompletada(cursoId, moduloId, claseId) {
        console.warn('⚠️ CursosData.isClaseCompletada() - TODO: Implementar con Supabase');
        return false;
    },

    /**
     * Verificar si una clase está desbloqueada
     */
    isClaseDesbloqueada(cursoId, moduloId, claseId) {
        console.warn('⚠️ CursosData.isClaseDesbloqueada() - TODO: Implementar con Supabase');
        return true; // Por defecto permitir
    },

    // ==================== QUIZZES ====================

    /**
     * Obtener intentos de quiz
     */
    getQuizAttempts(claseId) {
        console.warn(`⚠️ CursosData.getQuizAttempts(${claseId}) - TODO: Implementar con Supabase`);
        return [];
    },

    /**
     * Guardar intento de quiz
     */
    saveQuizAttempt(claseId, attemptData) {
        console.warn('⚠️ CursosData.saveQuizAttempt() - TODO: Implementar con Supabase');
    },

    // ==================== ENTREGAS ====================

    /**
     * Obtener entregas de una clase
     */
    getEntregas(claseId) {
        console.warn(`⚠️ CursosData.getEntregas(${claseId}) - TODO: Implementar con Supabase`);
        return [];
    },

    /**
     * Guardar entrega
     */
    saveEntrega(claseId, entregaData) {
        console.warn('⚠️ CursosData.saveEntrega() - TODO: Implementar con Supabase Storage');
    },

    /**
     * Obtener última entrega
     */
    getUltimaEntrega(claseId) {
        console.warn(`⚠️ CursosData.getUltimaEntrega(${claseId}) - TODO: Implementar con Supabase`);
        return null;
    },

    // ==================== CERTIFICADOS ====================

    /**
     * Verificar si puede obtener certificado
     */
    puedeObtenerCertificado(cursoId) {
        console.warn(`⚠️ CursosData.puedeObtenerCertificado(${cursoId}) - TODO: Implementar con Supabase`);
        return { puede: false, razon: 'not_implemented' };
    },

    /**
     * Obtener certificados del usuario
     */
    getCertificados() {
        console.warn('⚠️ CursosData.getCertificados() - TODO: Implementar con Supabase');
        return [];
    },

    /**
     * Registrar generación de certificado
     */
    registrarCertificado(cursoId, certificadoData) {
        console.warn('⚠️ CursosData.registrarCertificado() - TODO: Implementar con Supabase');
    },

    // ==================== UTILIDADES (No necesitan Supabase) ====================

    /**
     * Formatear duración en minutos a texto legible
     */
    formatearDuracion(minutos) {
        if (!minutos || minutos <= 0) return '0 min';
        if (minutos < 60) return `${minutos} min`;
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    },

    /**
     * Formatear precio a CLP
     */
    formatearPrecio(precio) {
        if (!precio) return '$0 CLP';
        return `$${parseInt(precio).toLocaleString('es-CL')} CLP`;
    },

    /**
     * Calcular duración total de un curso (requiere los datos del curso)
     */
    calcularDuracionCurso(cursoId) {
        console.warn(`⚠️ CursosData.calcularDuracionCurso(${cursoId}) - TODO: Implementar con Supabase`);
        return 0;
    },

    /**
     * Calcular duración de un módulo
     */
    calcularDuracionModulo(moduloId) {
        console.warn(`⚠️ CursosData.calcularDuracionModulo(${moduloId}) - TODO: Implementar con Supabase`);
        return 0;
    }
};

// Hacer disponible globalmente
window.CursosData = CursosData;

console.log('✅ supabaseData.js cargado - Stub de compatibilidad');
console.log('📝 Implementa cada método con llamadas a Supabase');
console.log('📚 Docs: https://supabase.com/docs/reference/javascript/select');
