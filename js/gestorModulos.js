document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES MÓDULOS (TU LÓGICA ORIGINAL) ---
    const addModuleBtn = document.getElementById('add-module-btn');
    const moduleModal = document.getElementById('module-modal');
    const cancelModuleBtn = document.getElementById('cancel-module-btn');
    const saveModuleBtn = document.getElementById('save-module-btn');
    const moduleNameInput = document.getElementById('module-name-input');
    const moduleFormTitle = document.getElementById('module-form-title');
    const moduleList = document.getElementById('module-list');

    let isEditing = false;
    let currentModuleId = null;

    // --- VARIABLES VIDEO (NUEVA LÓGICA UX) ---
    const videoInput = document.getElementById('courseVideo');
    const btnAddVideo = document.getElementById('btn-add-video');
    const videoDisplay = document.getElementById('video-display-container');
    const videoNameText = document.getElementById('video-name-display');
    const videoErrorMsg = document.getElementById('video-error-msg');
    const videoSuccessMsg = document.getElementById('video-success-msg');
    const videoProgress = document.getElementById('video-progress');
    const changeVideoBtn = document.getElementById('change-video-btn');
    const deleteVideoTrigger = document.getElementById('delete-video-trigger');
    const deleteVideoModal = document.getElementById('delete-video-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-video');
    const cancelDeleteBtn = document.getElementById('cancel-delete-video');

    // --- LÓGICA MÓDULOS (NO SE QUITA NADA) ---
    if (addModuleBtn) {
        addModuleBtn.addEventListener('click', () => {
            isEditing = false;
            currentModuleId = null;
            moduleFormTitle.textContent = 'Nombre del módulo';
            saveModuleBtn.textContent = 'Crear';
            moduleNameInput.value = '';
            moduleModal.classList.add('visible');
            moduleNameInput.focus();
        });
    }

    function closeModal() { moduleModal.classList.remove('visible'); }
    if (cancelModuleBtn) cancelModuleBtn.addEventListener('click', closeModal);

    if (saveModuleBtn) {
        saveModuleBtn.addEventListener('click', () => {
            const name = moduleNameInput.value.trim();
            if (!name) return alert('Ingresa un nombre');

            if (isEditing) {
                const item = document.querySelector(`.module-item[data-module-id="${currentModuleId}"]`);
                item.querySelector('.module-title').textContent = name;
            } else {
                const id = Date.now();
                const newModule = document.createElement('div');
                newModule.className = 'module-item';
                newModule.setAttribute('data-module-id', id);
                newModule.innerHTML = `
                    <div class="module-info">
                        <i class="fas fa-grip-lines drag-handle me-3"></i>
                        <span class="module-title">${name}</span>
                    </div>
                    <div class="module-actions">
                        <i class="fas fa-edit me-3" data-action="edit"></i>
                        <i class="fas fa-trash-alt" data-action="delete"></i>
                    </div>`;
                moduleList.appendChild(newModule);
            }
            closeModal();
        });
    }

    moduleList.addEventListener('click', (e) => {
        const target = e.target;
        const moduleItem = target.closest('.module-item');
        if (!moduleItem) return;
        const moduleId = moduleItem.getAttribute('data-module-id');

        if (target.getAttribute('data-action') === 'edit') {
            isEditing = true;
            currentModuleId = moduleId;
            moduleFormTitle.textContent = `Editar: ${moduleItem.querySelector('.module-title').textContent}`;
            saveModuleBtn.textContent = 'Guardar';
            moduleNameInput.value = moduleItem.querySelector('.module-title').textContent;
            moduleModal.classList.add('visible');
        } else if (target.getAttribute('data-action') === 'delete') {
            if (confirm('¿Eliminar este módulo?')) moduleItem.remove();
        }
    });

    // --- LÓGICA MULTIMEDIA VIDEO (SEGÚN UX ENVIADO) ---

    // Triggers para abrir el selector de archivos
    btnAddVideo.addEventListener('click', () => videoInput.click());
    changeVideoBtn.addEventListener('click', () => videoInput.click());

    videoInput.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;

        // Escenario 2: Validaciones
        const allowedTypes = ['video/mp4', 'video/webm'];
        const maxSize = 100 * 1024 * 1024; // 100MB
        let error = "";

        if (!allowedTypes.includes(file.type)) {
            error = "Error: Solo formatos MP4 o WEBM permitidos.";
        } else if (file.size > maxSize) {
            error = "Error: El video supera el límite de 100MB.";
        }

        if (error) {
            videoErrorMsg.textContent = error;
            videoErrorMsg.classList.remove('d-none');
            videoDisplay.classList.add('d-none');
            btnAddVideo.classList.remove('d-none');
            this.value = ""; 
            return;
        }

        // Escenario 1: Subida Exitosa
        videoErrorMsg.classList.add('d-none');
        btnAddVideo.classList.add('d-none');
        videoDisplay.classList.remove('d-none');
        videoNameText.textContent = file.name;
        
        // Simulación de progreso de carga (UX Feedback)
        videoProgress.style.width = '0%';
        videoSuccessMsg.classList.add('d-none');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            videoProgress.style.width = progress + '%';
            if (progress >= 100) {
                clearInterval(interval);
                videoSuccessMsg.classList.remove('d-none');
                console.log("Archivo guardado físicamente.");
            }
        }, 50);
    });

    // Escenario 4: Eliminación con Modal
    deleteVideoTrigger.addEventListener('click', () => {
        deleteVideoModal.classList.add('visible');
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteVideoModal.classList.remove('visible');
    });

    confirmDeleteBtn.addEventListener('click', () => {
        videoInput.value = ""; // Limpiar input
        videoDisplay.classList.add('d-none');
        btnAddVideo.classList.remove('d-none');
        deleteVideoModal.classList.remove('visible');
        videoErrorMsg.classList.add('d-none');
        console.log("Video eliminado del registro.");
    });
});
