// js/funcionalidadCursos.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Función de simulación para los escenarios UX
    const simularAccion = (escenario, mensaje) => {
        console.log(`Ejecutando Escenario ${escenario}: ${mensaje}`);
        // En un entorno real, usarías aquí window.location.href o modales de Bootstrap.
        alert(`ACCIÓN: ${mensaje}`);
    };

    // 1. Manejo del botón "Crear Curso" (Escenario 1, parte superior)
    const btnCrearCurso = document.getElementById('btn-crear-curso');
    btnCrearCurso.addEventListener('click', () => {
        simularAccion(
            '1 (Creación)', 
            'Redirección a Épica 3 "Creación de Curso".'
        );
    });

    // 2. Manejo de las tarjetas de cursos (Click para Edición/Estructura)
    const courseCards = document.querySelectorAll('.course-card');

    courseCards.forEach(card => {
        card.addEventListener('click', (e) => {
            
            // Si se hizo click en el botón 'VER', no ejecutamos la edición general.
            if (e.target.classList.contains('btn-ver-curso')) {
                // Ya se maneja en el punto 3
                return; 
            }
            
            // Escenario 3: Acceder a Edición de Estructura.
            // El UX indica: "Click en editar redirige a gestión de cursos Épica y gestión de módulos correspondiente."
            simularAccion(
                '3 (Edición de Estructura)', 
                'Redirección al módulo de Edición del curso correspondiente(Épica 3).'
            );
        });
    });

    // 3. Manejo del botón "VER" (Escenario 2: Ver Detalles Básicos)
    const verButtons = document.querySelectorAll('.btn-ver-curso');
    
    verButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el click se propague a la card (punto 2)
            
            // Escenario 2: Ver Detalles Básicos.
            // El UX indica: "Se muestra Card con info: nombre, descripción, precio, estado, número de módulos, fecha..."
            const courseId = btn.getAttribute('data-course-id');
            simularAccion(
                '2 (Ver Detalles)', 
                `Mostrar Card con información básica del curso ID: ${courseId}.`
            );
        });
    });
    
    // 4. Lógica de búsqueda (Simulación de entrada)
    const searchInput = document.querySelector('.search-input input');
    const searchIcon = document.querySelector('.search-input .search-icon');
    
    searchIcon.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            console.log(`Buscando cursos con query: "${query}"`);
            // Aquí iría la llamada AJAX o la lógica de filtrado de la cuadrícula.
            alert(`Simulación de búsqueda para: "${query}"`);
        }
    });

});
// js/gestionCursos.js - Lógica para Gestión de Cursos

document.addEventListener('DOMContentLoaded', () => {
    
    // Modal de ver curso
    const verCursoModal = document.getElementById('verCursoModal');
    const modalInstance = verCursoModal ? new bootstrap.Modal(verCursoModal) : null;
    
    // Elementos del modal
    const modalNombre = document.getElementById('modalCursoNombre');
    const modalDescripcion = document.getElementById('modalCursoDescripcion');
    const modalPrecio = document.getElementById('modalCursoPrecio');
    const modalDuracion = document.getElementById('modalCursoDuracion');
    const modalModulos = document.getElementById('modalCursoModulos');
    const modalEstado = document.getElementById('modalCursoEstado');
    const modalFecha = document.getElementById('modalCursoFecha');
    const modalBtnEditar = document.getElementById('modalBtnEditar');
    
    // Datos de ejemplo (en producción vendrían del backend)
    const cursosData = {
        1: { nombre: 'Microblading Básico', descripcion: 'Aprende las técnicas fundamentales del microblading desde cero.', precio: '$150.000 CLP', duracion: '4h 30min', modulos: 6, estado: 'Publicado', fecha: '15/01/24' },
        2: { nombre: 'Lash Lifting Profesional', descripcion: 'Domina el arte del lifting de pestañas con técnicas avanzadas.', precio: '$120.000 CLP', duracion: '3h 15min', modulos: 4, estado: 'Publicado', fecha: '20/02/24' },
        3: { nombre: 'Diseño de Cejas', descripcion: 'Técnicas de diseño y visagismo para cejas perfectas.', precio: '$80.000 CLP', duracion: '2h 45min', modulos: 5, estado: 'Borrador', fecha: '10/03/24' },
        4: { nombre: 'Extensiones de Pestañas', descripcion: 'Curso completo de extensiones pelo a pelo.', precio: '$200.000 CLP', duracion: '6h', modulos: 8, estado: 'Publicado', fecha: '05/04/24' },
        5: { nombre: 'Tinte de Cejas', descripcion: 'Aprende a teñir cejas con resultados naturales.', precio: '$60.000 CLP', duracion: '1h 30min', modulos: 3, estado: 'Publicado', fecha: '12/04/24' },
    };
    
    // Botones VER
    const verButtons = document.querySelectorAll('.btn-ver');
    
    verButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const cursoId = this.getAttribute('data-curso-id');
            const curso = cursosData[cursoId] || {
                nombre: 'Nombre Curso',
                descripcion: 'Descripción del curso...',
                precio: '$0 CLP',
                duracion: '0 min',
                modulos: 0,
                estado: 'Borrador',
                fecha: 'dd/mm/aa'
            };
            
            // Llenar modal con datos
            modalNombre.textContent = curso.nombre;
            modalDescripcion.textContent = curso.descripcion;
            modalPrecio.textContent = curso.precio;
            modalDuracion.textContent = curso.duracion;
            modalModulos.textContent = curso.modulos + ' módulos';
            modalFecha.textContent = curso.fecha;
            
            // Estado con badge
            modalEstado.textContent = curso.estado;
            modalEstado.className = 'badge ' + (curso.estado === 'Publicado' ? 'bg-success' : 'bg-secondary');
            
            // Link de editar
            modalBtnEditar.href = `creaCurso.html?id=${cursoId}`;
            
            // Mostrar modal
            modalInstance.show();
        });
    });
    
    // Paginación
    const paginationItems = document.querySelectorAll('.pagination-custom .page-item a');
    
    paginationItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover active de todos
            document.querySelectorAll('.pagination-custom .page-item').forEach(p => {
                p.classList.remove('active');
            });
            
            // Agregar active al clickeado
            this.parentElement.classList.add('active');
            
            const page = this.getAttribute('data-page');
            console.log('Cargando página:', page);
            
            // Aquí iría la lógica para cargar cursos de esa página
        });
    });
    
});