// js/previsualizaCurso.js - Vista Previa del Curso (H3.4)

document.addEventListener('DOMContentLoaded', () => {
    
    const urlParams = new URLSearchParams(window.location.search);
    const cursoId = parseInt(urlParams.get('id'));
    
    if (!cursoId) {
        mostrarError('No se especificó un curso.');
        return;
    }
    
    CursosData.init();
    cargarCurso(cursoId);
    
    // ==================== CARGAR CURSO ====================
    
    function cargarCurso(id) {
        const curso = CursosData.getCurso(id);
        
        if (!curso) {
            mostrarError('Curso no encontrado.');
            return;
        }
        
        document.title = `KIKIBROWS - ${curso.nombre}`;
        cargarHero(curso);
        cargarMetaInfo(curso);
        cargarModulos(id);
    }
    
    // ==================== HERO ====================
    
    function cargarHero(curso) {
        document.getElementById('cursoNombre').textContent = curso.nombre;
        document.getElementById('cursoDescripcion').textContent = 
            curso.descripcion || 'Sin descripción disponible.';
        
        const portadaEl = document.getElementById('heroPortada');
        if (curso.portada) {
            portadaEl.innerHTML = `<img src="${curso.portada}" alt="${curso.nombre}">`;
        }
    }
    
    // ==================== META INFO ====================
    
    function cargarMetaInfo(curso) {
        document.getElementById('cursoPrecio').textContent = 
            CursosData.formatearPrecio(curso.precio || 0);
        
        const duracion = CursosData.calcularDuracionCurso(curso.id);
        document.getElementById('cursoDuracion').textContent = 
            CursosData.formatearDuracion(duracion);
        
        const estadoEl = document.getElementById('cursoEstado');
        estadoEl.textContent = curso.estado || 'BORRADOR';
        estadoEl.className = 'badge-estado ' + (curso.estado || 'BORRADOR');
        
        document.getElementById('cursoFecha').textContent = 
            CursosData.formatearFecha(curso.fechaCreacion);
    }
    
    // ==================== MÓDULOS ====================
    
    function cargarModulos(cursoId) {
        const modulos = CursosData.getModulosByCurso(cursoId);
        const container = document.getElementById('modulosList');
        
        container.innerHTML = '';
        
        if (modulos.length === 0) {
            container.innerHTML = `
                <div class="no-modulos">
                    <i class="fas fa-folder-open"></i>
                    <h3>Sin módulos</h3>
                    <p>Este curso aún no tiene módulos configurados.</p>
                </div>
            `;
            return;
        }
        
        modulos.forEach((modulo, index) => {
            const clases = CursosData.getClasesByModulo(modulo.id);
            const duracion = CursosData.calcularDuracionModulo(modulo.id);
            const moduloEl = crearModuloElement(modulo, clases, duracion, index + 1, index === 0);
            container.appendChild(moduloEl);
        });
    }
    
    function crearModuloElement(modulo, clases, duracion, numero, expandido) {
        const div = document.createElement('div');
        div.className = 'modulo-card';
        
        div.innerHTML = `
            <div class="modulo-header ${expandido ? 'expanded' : ''}">
                <span class="modulo-titulo">Módulo ${numero}: ${modulo.nombre}</span>
                <i class="fas fa-chevron-down modulo-arrow"></i>
            </div>
            <div class="modulo-body ${expandido ? 'show' : ''}">
                <div class="modulo-meta">
                    <span>0 / ${clases.length} clases</span>
                    <span>${CursosData.formatearDuracion(duracion)}</span>
                </div>
                <div class="clases-list">
                    ${clases.map(clase => crearClaseHTML(clase)).join('')}
                </div>
                <div class="contenido-viewer" id="viewer-${modulo.id}" style="display: none;"></div>
            </div>
        `;
        
        // Toggle
        const header = div.querySelector('.modulo-header');
        header.addEventListener('click', () => {
            header.classList.toggle('expanded');
            div.querySelector('.modulo-body').classList.toggle('show');
        });
        
        // Click clases
        div.querySelectorAll('.clase-row').forEach(row => {
            row.addEventListener('click', () => {
                div.querySelectorAll('.clase-row').forEach(r => r.classList.remove('active'));
                row.classList.add('active');
                
                const claseId = parseInt(row.dataset.claseId);
                const clase = CursosData.getClase(claseId);
                mostrarContenidoClase(clase, div.querySelector(`#viewer-${modulo.id}`));
            });
        });
        
        // Mostrar primera clase si expandido
        if (expandido && clases.length > 0) {
            setTimeout(() => {
                const primera = div.querySelector('.clase-row');
                if (primera) {
                    primera.classList.add('active');
                    const clase = CursosData.getClase(parseInt(primera.dataset.claseId));
                    mostrarContenidoClase(clase, div.querySelector(`#viewer-${modulo.id}`));
                }
            }, 100);
        }
        
        return div;
    }
    
    function crearClaseHTML(clase) {
        const iconos = {
            video: 'fa-play-circle',
            texto: 'fa-file-alt',
            pdf: 'fa-file-pdf',
            quiz: 'fa-question-circle',
            entrega: 'fa-upload'
        };
        
        return `
            <div class="clase-row" data-clase-id="${clase.id}" data-tipo="${clase.tipo}">
                <div class="clase-check"><i class="fas fa-check"></i></div>
                <span class="clase-nombre">${clase.nombre}</span>
                <div class="clase-meta">
                    <i class="fas ${iconos[clase.tipo] || 'fa-file'}"></i>
                    <span>${clase.duracion} min</span>
                </div>
            </div>
        `;
    }
    
    // ==================== CONTENIDO ====================
    
    function mostrarContenidoClase(clase, container) {
        container.style.display = 'block';
        
        const contenidos = {
            video: `
                <div class="video-player">
                    <i class="fas fa-play"></i>
                    <div class="preview-notice">
                        <i class="fas fa-info-circle me-1"></i>Reproducción deshabilitada
                    </div>
                </div>
            `,
            texto: `
                <div class="contenido-texto">
                    <h3>${clase.nombre}</h3>
                    <p>Este es el contenido teórico de la lección. Aquí se mostraría el texto 
                    informativo, explicaciones, conceptos y material de lectura para la alumna.</p>
                </div>
            `,
            pdf: `
                <div class="contenido-texto">
                    <h3><i class="fas fa-file-pdf text-danger me-2"></i>${clase.nombre}</h3>
                    <p>Material descargable en formato PDF.</p>
                    <div class="mt-3 p-4 rounded text-center" style="background: rgba(217,205,184,0.5);">
                        <i class="fas fa-file-pdf fa-3x text-danger mb-3"></i>
                        <p class="mb-2">documento.pdf</p>
                        <button class="btn-disabled">
                            <i class="fas fa-download me-1"></i>Descarga deshabilitada
                        </button>
                    </div>
                </div>
            `,
            quiz: `
                <div class="contenido-quiz">
                    <i class="fas fa-question-circle"></i>
                    <h3>${clase.nombre}</h3>
                    <p>Evaluación de conocimientos adquiridos.</p>
                    <button class="btn-disabled mt-3">
                        <i class="fas fa-play me-1"></i>Iniciar Quiz
                    </button>
                </div>
            `,
            entrega: `
                <div class="contenido-entrega">
                    <h3><i class="fas fa-upload text-success me-2"></i>${clase.nombre}</h3>
                    <p class="text-muted mb-4">Actividad práctica con entrega de video.</p>
                    
                    <div class="entrega-video-area">
                        <i class="fas fa-video fa-2x mb-2" style="color: var(--primary-color);"></i>
                        <h5>Video instructivo</h5>
                        <p class="text-muted small">Video demostrativo para la alumna</p>
                    </div>
                    
                    <div class="entrega-upload-area">
                        <i class="fas fa-cloud-upload-alt fa-2x mb-2" style="color: var(--primary-color);"></i>
                        <h5>Sube tu video de práctica</h5>
                        <p class="small">La alumna subirá aquí su video para revisión</p>
                        <button class="btn-disabled">
                            <i class="fas fa-upload me-1"></i>Subir video
                        </button>
                    </div>
                </div>
            `
        };
        
        container.innerHTML = contenidos[clase.tipo] || contenidos.texto;
        
        container.querySelectorAll('.video-player').forEach(p => {
            p.addEventListener('click', () => mostrarTooltip('Reproducción deshabilitada'));
        });
    }
    
    // ==================== UTILIDADES ====================
    
    function mostrarError(msg) {
        document.getElementById('modulosList').innerHTML = `
            <div class="no-modulos">
                <i class="fas fa-exclamation-triangle" style="color: #E57373;"></i>
                <h3>Error</h3>
                <p>${msg}</p>
                <a href="gestionCursos.html" class="btn btn-primary mt-3">Volver</a>
            </div>
        `;
        document.getElementById('cursoNombre').textContent = 'Error';
    }
    
    function mostrarTooltip(msg) {
        let t = document.querySelector('.temp-tooltip');
        if (!t) {
            t = document.createElement('div');
            t.className = 'temp-tooltip';
            t.style.cssText = `
                position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
                background: rgba(0,0,0,0.85); color: #fff; padding: 12px 24px;
                border-radius: 25px; font-size: 0.9rem; z-index: 10000;
                opacity: 0; transition: opacity 0.3s;
            `;
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.opacity = '1';
        setTimeout(() => t.style.opacity = '0', 2500);
    }
    
});