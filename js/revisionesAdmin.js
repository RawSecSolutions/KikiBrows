// js/revisionesAdmin.js - Gestión de Revisiones de Entregas (conectado a Supabase)

import { CursosService, supabase } from './cursosService.js';

// Estado global de la página
const RevisionesAdmin = {
    currentTab: 'PENDIENTE',
    currentPage: 1,
    perPage: 10,
    totalItems: 0,
    entregas: [],
    selectedEntrega: null,

    async init() {
        this.cacheDom();
        this.bindEvents();
        await this.loadEntregas();
    },

    cacheDom() {
        this.tableContainer = document.getElementById('entregas-table-body');
        this.paginationContainer = document.getElementById('pagination-container');
        this.tabPendientes = document.getElementById('tab-pendientes');
        this.tabFinalizadas = document.getElementById('tab-finalizadas');
        this.revisionModal = document.getElementById('revisionModal');
        this.revisionForm = document.getElementById('revision-form');
        this.feedbackArea = document.getElementById('feedbackArea');
        this.calificacionDropdown = document.getElementById('calificacionDropdown');
        this.modalCursoModulo = document.getElementById('modal-curso-modulo');
        this.modalUsuario = document.getElementById('modal-usuario');
        this.modalFecha = document.getElementById('modal-fecha');
        this.visualizadorContainer = document.getElementById('visualizador-container');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.emptyState = document.getElementById('empty-state-revisiones');
        this.submitBtn = document.getElementById('submit-calificacion-btn');
    },

    bindEvents() {
        // Tabs
        this.tabPendientes?.addEventListener('click', () => this.switchTab('PENDIENTE'));
        this.tabFinalizadas?.addEventListener('click', () => this.switchTab('FINALIZADA'));

        // Form submit
        this.revisionForm?.addEventListener('submit', (e) => this.handleSubmit(e));

        // Limpiar error al cambiar calificación
        this.calificacionDropdown?.addEventListener('change', () => {
            this.feedbackArea?.classList.remove('is-invalid');
        });
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.currentPage = 1;

        // UI de tabs
        const tabs = [this.tabPendientes, this.tabFinalizadas];
        tabs.forEach(t => {
            if (t) {
                t.style.borderBottom = 'none';
                t.classList.add('text-muted');
                t.classList.remove('text-dark');
            }
        });

        const activeTab = tab === 'PENDIENTE' ? this.tabPendientes : this.tabFinalizadas;
        if (activeTab) {
            activeTab.style.borderBottom = '3px solid #8A835A';
            activeTab.classList.remove('text-muted');
            activeTab.classList.add('text-dark');
        }

        this.loadEntregas();
    },

    async loadEntregas() {
        this.showLoading(true);

        try {
            const estadoFilter = this.currentTab === 'PENDIENTE'
                ? 'PENDIENTE'
                : ['APROBADA', 'RECHAZADA'];

            const result = await CursosService.getEntregasAdmin(
                estadoFilter,
                this.currentPage,
                this.perPage
            );

            if (result.success) {
                this.entregas = result.data;
                this.totalItems = result.count || this.entregas.length;
            } else {
                this.entregas = [];
                this.totalItems = 0;
                console.error('Error cargando entregas:', result.error);
            }
        } catch (error) {
            this.entregas = [];
            this.totalItems = 0;
            console.error('Error inesperado cargando entregas:', error);
        }

        this.renderTable();
        this.renderPagination();
        this.showLoading(false);
    },

    renderTable() {
        if (!this.tableContainer) return;

        if (this.entregas.length === 0) {
            this.tableContainer.innerHTML = '';
            if (this.emptyState) {
                this.emptyState.classList.remove('d-none');
                this.emptyState.querySelector('p').textContent = this.currentTab === 'PENDIENTE'
                    ? 'No hay entregas pendientes de revisión.'
                    : 'No hay entregas finalizadas.';
            }
            return;
        }

        if (this.emptyState) this.emptyState.classList.add('d-none');

        this.tableContainer.innerHTML = this.entregas.map((entrega, index) => {
            const cursoNombre = entrega.clases?.modulos?.cursos?.nombre || 'Curso';
            const moduloNombre = entrega.clases?.modulos?.nombre || 'Módulo';
            const claseNombre = entrega.clases?.nombre || 'Clase';
            const usuarioNombre = entrega.profiles
                ? `${entrega.profiles.first_name || ''} ${entrega.profiles.last_name || ''}`.trim()
                : 'Usuario';
            const fecha = new Date(entrega.fecha_entrega).toLocaleDateString('es-CL', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });

            let estadoBadge = '';
            switch (entrega.estado) {
                case 'PENDIENTE':
                    estadoBadge = '<span class="badge bg-warning text-dark">Pendiente</span>';
                    break;
                case 'APROBADA':
                    estadoBadge = '<span class="badge bg-success">Aprobada</span>';
                    break;
                case 'RECHAZADA':
                    estadoBadge = '<span class="badge bg-danger">Rechazada</span>';
                    break;
            }

            const globalIndex = ((this.currentPage - 1) * this.perPage) + index + 1;

            return `
                <a href="#" class="row g-0 align-items-center p-3 mb-2 rounded text-decoration-none text-dark border entrega-row"
                   style="background-color: rgba(255,255,255,0.6);"
                   data-entrega-id="${entrega.id}"
                   data-bs-toggle="modal" data-bs-target="#revisionModal">
                    <div class="col-1 text-center fw-bold">${globalIndex}</div>
                    <div class="col-3 text-truncate">${cursoNombre}</div>
                    <div class="col-3 text-truncate" title="${claseNombre}">${claseNombre}</div>
                    <div class="col-2">${fecha}</div>
                    <div class="col-2 text-truncate">${usuarioNombre}</div>
                    <div class="col-1 text-center">${estadoBadge}</div>
                </a>
            `;
        }).join('');

        // Bind click events to rows for loading modal data
        this.tableContainer.querySelectorAll('.entrega-row').forEach(row => {
            row.addEventListener('click', (e) => {
                const entregaId = row.getAttribute('data-entrega-id');
                this.selectedEntrega = this.entregas.find(ent => ent.id === entregaId);
                this.loadModal();
            });
        });
    },

    loadModal() {
        if (!this.selectedEntrega) return;

        const entrega = this.selectedEntrega;
        const cursoNombre = entrega.clases?.modulos?.cursos?.nombre || 'Curso';
        const claseNombre = entrega.clases?.nombre || 'Clase';
        const usuarioNombre = entrega.profiles
            ? `${entrega.profiles.first_name || ''} ${entrega.profiles.last_name || ''}`.trim()
            : 'Usuario';
        const fecha = new Date(entrega.fecha_entrega).toLocaleDateString('es-CL', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });

        // Llenar datos del modal
        if (this.modalCursoModulo) {
            this.modalCursoModulo.textContent = `${cursoNombre} - ${claseNombre}`;
        }
        if (this.modalUsuario) this.modalUsuario.textContent = usuarioNombre;
        if (this.modalFecha) this.modalFecha.textContent = fecha;

        // Cargar el archivo de la entrega en el visualizador
        this.loadVisualizador(entrega);

        // Resetear form
        if (this.revisionForm) this.revisionForm.reset();
        this.feedbackArea?.classList.remove('is-invalid');

        // Si la entrega ya fue calificada, pre-llenar y deshabilitar
        if (entrega.estado !== 'PENDIENTE') {
            if (this.calificacionDropdown) {
                this.calificacionDropdown.value = entrega.estado === 'APROBADA' ? 'aprobada' : 'rechazada';
                this.calificacionDropdown.disabled = true;
            }
            if (this.feedbackArea) {
                this.feedbackArea.value = entrega.feedback_instructor || '';
                this.feedbackArea.disabled = true;
            }
            if (this.submitBtn) this.submitBtn.classList.add('d-none');
        } else {
            if (this.calificacionDropdown) this.calificacionDropdown.disabled = false;
            if (this.feedbackArea) this.feedbackArea.disabled = false;
            if (this.submitBtn) this.submitBtn.classList.remove('d-none');
        }
    },

    loadVisualizador(entrega) {
        if (!this.visualizadorContainer) return;

        const archivoUrl = entrega.archivo_url;
        const tipoArchivo = (entrega.tipo_archivo || '').toLowerCase();

        if (['mp4', 'webm', 'mov'].includes(tipoArchivo)) {
            this.visualizadorContainer.innerHTML = `
                <video id="videoPlayer" width="100%" height="100%" controls controlsList="nodownload" preload="metadata">
                    <source src="${archivoUrl}" type="video/${tipoArchivo === 'mov' ? 'mp4' : tipoArchivo}">
                    Tu navegador no soporta la reproducción de video.
                </video>
            `;
        } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(tipoArchivo)) {
            this.visualizadorContainer.innerHTML = `
                <img src="${archivoUrl}" alt="Entrega" style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px;">
            `;
        } else if (tipoArchivo === 'pdf') {
            this.visualizadorContainer.innerHTML = `
                <iframe src="${archivoUrl}" style="width: 100%; height: 400px; border: none; border-radius: 8px;"></iframe>
            `;
        } else {
            this.visualizadorContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-file fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Vista previa no disponible para este tipo de archivo.</p>
                    <a href="${archivoUrl}" target="_blank" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-external-link-alt me-2"></i>Abrir archivo
                    </a>
                </div>
            `;
        }
    },

    async handleSubmit(event) {
        event.preventDefault();

        if (!this.selectedEntrega) return;

        const estado = this.calificacionDropdown?.value;
        const feedback = this.feedbackArea?.value?.trim() || '';

        // Validar: si rechazada, feedback obligatorio
        if (estado === 'rechazada' && !feedback) {
            this.feedbackArea?.classList.add('is-invalid');
            alert('El feedback es obligatorio si rechazas la entrega.');
            return;
        }

        // Validar que se seleccionó una calificación
        if (!estado) {
            alert('Por favor selecciona una calificación.');
            return;
        }

        // Deshabilitar botón
        if (this.submitBtn) {
            this.submitBtn.disabled = true;
            this.submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
        }

        const result = await CursosService.calificarEntrega(this.selectedEntrega.id, {
            estado: estado.toUpperCase(),
            feedback: feedback || null,
            calificacion: null
        });

        if (result.success) {
            // Cerrar modal
            const modalInstance = bootstrap.Modal.getInstance(this.revisionModal);
            if (modalInstance) modalInstance.hide();

            // Recargar tabla
            await this.loadEntregas();
        } else {
            alert('Error al guardar la calificación: ' + (result.error?.message || 'Error desconocido'));
        }

        // Restaurar botón
        if (this.submitBtn) {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i> Calificar';
        }
    },

    renderPagination() {
        if (!this.paginationContainer) return;

        const totalPages = Math.max(1, Math.ceil(this.totalItems / this.perPage));

        if (totalPages <= 1) {
            this.paginationContainer.innerHTML = '';
            return;
        }

        let pagesHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === this.currentPage;
            pagesHTML += `
                <li class="page-item ${isActive ? 'active' : ''}">
                    <a class="page-link ${isActive ? 'text-white' : 'text-success'}" href="#"
                       data-page="${i}"
                       style="${isActive ? 'background-color: #8A835A; border-color: #8A835A;' : ''}">
                        ${i}
                    </a>
                </li>
            `;
        }

        this.paginationContainer.innerHTML = `
            <nav aria-label="Paginación">
                <ul class="pagination">${pagesHTML}</ul>
            </nav>
        `;

        // Bind pagination clicks
        this.paginationContainer.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.getAttribute('data-page'));
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadEntregas();
                }
            });
        });
    },

    showLoading(show) {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.toggle('d-none', !show);
        }
        if (this.tableContainer && show) {
            this.tableContainer.innerHTML = '';
        }
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    RevisionesAdmin.init();
});

// Exportar para uso global
window.RevisionesAdmin = RevisionesAdmin;
