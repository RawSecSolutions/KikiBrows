// js/creaCurso.js - Lógica para Creación de Curso

document.addEventListener('DOMContentLoaded', () => {
    
    // === ELEMENTOS ===
    const courseForm = document.getElementById('courseCreationForm');
    
    // Imagen
    const imageInput = document.getElementById('courseImage');
    const btnAddImage = document.getElementById('btnAddImage');
    const imageUploadedDisplay = document.getElementById('imageUploadedDisplay');
    const imageFileName = document.getElementById('imageFileName');
    const changeImage = document.getElementById('changeImage');
    const deleteImage = document.getElementById('deleteImage');
    const imageAlert = document.getElementById('imageAlert');
    const imageAlertText = document.getElementById('imageAlertText');
    
    // Video
    const videoInput = document.getElementById('courseVideo');
    const btnAddVideo = document.getElementById('btnAddVideo');
    const videoUploadedDisplay = document.getElementById('videoUploadedDisplay');
    const videoFileName = document.getElementById('videoFileName');
    const changeVideo = document.getElementById('changeVideo');
    const deleteVideoBtn = document.getElementById('deleteVideoBtn');
    const videoAlert = document.getElementById('videoAlert');
    const videoAlertText = document.getElementById('videoAlertText');
    const videoProgressContainer = document.getElementById('videoProgressContainer');
    const videoProgress = document.getElementById('videoProgress');
    const videoSuccessMsg = document.getElementById('videoSuccessMsg');
    
    // Carrusel
    const showInCarousel = document.getElementById('showInCarousel');
    const carouselPosition = document.getElementById('carouselPosition');
    
    // Módulos
    const modulosContainer = document.getElementById('modulosContainer');
    const addModuloBtn = document.getElementById('addModuloBtn');
    const moduleNameModalEl = document.getElementById('moduleNameModal');
    const moduleNameModal = moduleNameModalEl ? new bootstrap.Modal(moduleNameModalEl) : null;
    const moduleNameInput = document.getElementById('moduleNameInput');
    const saveModuleName = document.getElementById('saveModuleName');
    
    // Modales de confirmación
    const deleteVideoModalEl = document.getElementById('deleteVideoModal');
    const deleteVideoModal = deleteVideoModalEl ? new bootstrap.Modal(deleteVideoModalEl) : null;
    const confirmDeleteVideo = document.getElementById('confirmDeleteVideo');
    
    const deleteImageModalEl = document.getElementById('deleteImageModal');
    const deleteImageModal = deleteImageModalEl ? new bootstrap.Modal(deleteImageModalEl) : null;
    const confirmDeleteImage = document.getElementById('confirmDeleteImage');
    
    let moduleCounter = 3;
    
    // === LÓGICA DE IMAGEN ===
    
    if (btnAddImage) {
        btnAddImage.addEventListener('click', () => imageInput.click());
    }
    if (changeImage) {
        changeImage.addEventListener('click', () => imageInput.click());
    }
    
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
            const maxSize = 2 * 1024 * 1024;
            
            imageAlert.classList.add('d-none');
            
            if (!allowedTypes.includes(file.type)) {
                imageAlertText.textContent = 'Formato no válido. Solo PNG, JPG, WEBP.';
                imageAlert.classList.remove('d-none');
                this.value = '';
                return;
            }
            
            if (file.size > maxSize) {
                imageAlertText.textContent = 'La imagen supera el tamaño máximo de 2MB.';
                imageAlert.classList.remove('d-none');
                this.value = '';
                return;
            }
            
            imageFileName.textContent = file.name;
            btnAddImage.classList.add('d-none');
            imageUploadedDisplay.classList.remove('d-none');
        });
    }
    
    if (deleteImage) {
        deleteImage.addEventListener('click', () => deleteImageModal.show());
    }
    
    if (confirmDeleteImage) {
        confirmDeleteImage.addEventListener('click', () => {
            imageInput.value = '';
            imageUploadedDisplay.classList.add('d-none');
            btnAddImage.classList.remove('d-none');
            deleteImageModal.hide();
        });
    }
    
    // === LÓGICA DE VIDEO ===
    
    if (btnAddVideo) {
        btnAddVideo.addEventListener('click', () => videoInput.click());
    }
    if (changeVideo) {
        changeVideo.addEventListener('click', () => videoInput.click());
    }
    
    if (videoInput) {
        videoInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            
            const allowedTypes = ['video/mp4', 'video/webm'];
            const maxSize = 100 * 1024 * 1024;
            
            videoAlert.classList.add('d-none');
            videoSuccessMsg.classList.add('d-none');
            
            if (!allowedTypes.includes(file.type)) {
                videoAlertText.textContent = 'El video debe ser formato MP4 o WEBM.';
                videoAlert.classList.remove('d-none');
                this.value = '';
                return;
            }
            
            if (file.size > maxSize) {
                videoAlertText.textContent = 'El video no debe superar 100MB.';
                videoAlert.classList.remove('d-none');
                this.value = '';
                return;
            }
            
            videoFileName.textContent = file.name;
            btnAddVideo.classList.add('d-none');
            videoUploadedDisplay.classList.remove('d-none');
            
            // Simular progreso
            videoProgressContainer.classList.remove('d-none');
            videoProgress.style.width = '0%';
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    setTimeout(() => {
                        videoProgressContainer.classList.add('d-none');
                        videoSuccessMsg.classList.remove('d-none');
                    }, 300);
                }
                videoProgress.style.width = progress + '%';
            }, 100);
        });
    }
    
    if (deleteVideoBtn) {
        deleteVideoBtn.addEventListener('click', () => deleteVideoModal.show());
    }
    
    if (confirmDeleteVideo) {
        confirmDeleteVideo.addEventListener('click', () => {
            videoInput.value = '';
            videoUploadedDisplay.classList.add('d-none');
            btnAddVideo.classList.remove('d-none');
            videoSuccessMsg.classList.add('d-none');
            deleteVideoModal.hide();
        });
    }
    
    // === LÓGICA DE CARRUSEL ===
    
    if (showInCarousel) {
        showInCarousel.addEventListener('change', function() {
            carouselPosition.disabled = !this.checked;
            if (!this.checked) carouselPosition.value = '';
        });
    }
    
    // === LÓGICA DE MÓDULOS ===
    
    // Drag and Drop para módulos
    function initDragAndDrop(container, itemSelector) {
        let draggedItem = null;
        
        container.addEventListener('dragstart', (e) => {
            const item = e.target.closest(itemSelector);
            if (!item) return;
            
            draggedItem = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', item.innerHTML);
        });
        
        container.addEventListener('dragend', (e) => {
            const item = e.target.closest(itemSelector);
            if (!item) return;
            
            item.classList.remove('dragging');
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            draggedItem = null;
            
            // Log nuevo orden
            const newOrder = Array.from(container.querySelectorAll(itemSelector)).map((item, index) => ({
                id: item.getAttribute('data-modulo-id') || item.getAttribute('data-clase-id'),
                position: index + 1
            }));
            console.log('Nuevo orden:', newOrder);
        });
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = getDragAfterElement(container, e.clientY, itemSelector);
            const dragging = container.querySelector('.dragging');
            
            if (!dragging) return;
            
            // Limpiar estados previos
            container.querySelectorAll(itemSelector).forEach(item => item.classList.remove('drag-over'));
            
            if (afterElement) {
                afterElement.classList.add('drag-over');
                container.insertBefore(dragging, afterElement);
            } else {
                container.appendChild(dragging);
            }
        });
        
        container.addEventListener('dragleave', (e) => {
            const item = e.target.closest(itemSelector);
            if (item) item.classList.remove('drag-over');
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        });
    }
    
    function getDragAfterElement(container, y, itemSelector) {
        const draggableElements = [...container.querySelectorAll(`${itemSelector}:not(.dragging)`)];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    // Inicializar drag and drop para módulos
    if (modulosContainer) {
        initDragAndDrop(modulosContainer, '.modulo-item');
    }
    
    if (addModuloBtn && moduleNameModal) {
        addModuloBtn.addEventListener('click', () => {
            moduleNameInput.value = '';
            moduleNameModal.show();
            setTimeout(() => moduleNameInput.focus(), 300);
        });
    }
    
    if (saveModuleName) {
        saveModuleName.addEventListener('click', () => {
            const name = moduleNameInput.value.trim();
            if (!name) {
                moduleNameInput.classList.add('is-invalid');
                return;
            }
            
            moduleNameInput.classList.remove('is-invalid');
            moduleCounter++;
            
            const newModule = document.createElement('div');
            newModule.className = 'modulo-item';
            newModule.setAttribute('data-modulo-id', moduleCounter);
            newModule.setAttribute('draggable', 'true');
            newModule.innerHTML = `
                <div class="drag-handle" title="Arrastra para reordenar">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <span class="modulo-name">${name}</span>
                <a href="gestorModulos.html?id=${moduleCounter}" class="btn-modulo-edit" title="Editar">
                    <i class="fas fa-pen"></i>
                </a>
            `;
            
            modulosContainer.appendChild(newModule);
            moduleNameModal.hide();
        });
    }
    
    if (moduleNameInput) {
        moduleNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveModuleName.click();
            }
        });
        
        moduleNameInput.addEventListener('input', function() {
            this.classList.remove('is-invalid');
        });
    }
    
    // === VALIDACIÓN Y ENVÍO ===
    
    if (courseForm) {
        courseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const incompleteAlert = document.getElementById('incompleteFieldsAlert');
            const successAlert = document.getElementById('successAlert');
            
            incompleteAlert.classList.add('d-none');
            successAlert.classList.add('d-none');
            
            let valid = true;
            
            const requiredFields = courseForm.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    valid = false;
                    field.classList.add('is-invalid');
                } else {
                    field.classList.remove('is-invalid');
                }
            });
            
            // Validar imagen
            if (!imageInput.files.length && imageUploadedDisplay.classList.contains('d-none')) {
                valid = false;
                imageAlertText.textContent = 'Debes subir una imagen de portada.';
                imageAlert.classList.remove('d-none');
            }
            
            if (!valid) {
                incompleteAlert.classList.remove('d-none');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            
            successAlert.classList.remove('d-none');
            
            setTimeout(() => {
                alert('Curso creado exitosamente.');
            }, 1000);
        });
    }
    
    document.querySelectorAll('.input-kikibrows').forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('is-invalid');
        });
    });
    
});