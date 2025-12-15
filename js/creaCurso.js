// js/scripts.js - Lógica de Validación y Módulos de CreaCurso

document.addEventListener('DOMContentLoaded', () => {
    
    // Lógica para el Formulario (Escenarios 1, 2, 3)
    const courseCreationForm = document.getElementById('courseCreationForm');
    if (courseCreationForm) {
        courseCreationForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Escenario 2: Validación de campos requeridos
            const requiredFields = document.querySelectorAll('#courseCreationForm [required]');
            let allFieldsComplete = true;
            requiredFields.forEach(field => {
                if (!field.value) {
                    allFieldsComplete = false;
                }
            });

            const incompleteAlert = document.getElementById('incompleteFieldsAlert');
            if (!allFieldsComplete) {
                incompleteAlert.classList.remove('d-none');
                window.scrollTo(0, 0); 
                return;
            } else {
                incompleteAlert.classList.add('d-none');
            }

            // Escenario 3: Validación de imagen (Formato y Tamaño)
            const imageInput = document.getElementById('courseImage');
            const imageAlert = document.getElementById('imageAlert');
            const MAX_SIZE_MB = 2;
            const ALLOWED_MIMES = ['image/png', 'image/jpeg', 'image/webp'];

            if (imageInput.files.length > 0) {
                const file = imageInput.files[0];
                const fileSizeMB = file.size / (1024 * 1024);

                if (fileSizeMB > MAX_SIZE_MB || !ALLOWED_MIMES.includes(file.type)) {
                    imageAlert.classList.remove('d-none');
                    window.scrollTo(0, 0);
                    return;
                } else {
                    imageAlert.classList.add('d-none');
                }
            }

            // Escenario 1: Envío exitoso
            alert("✅ Curso creado exitosamente. (Simulación de Escenario 1)");
        });
    }

    // Lógica para añadir módulos
    document.getElementById('addModuloBtn').addEventListener('click', function() {
        const container = document.getElementById('modulosContainer');
        const newId = container.children.length + 1;
        const newModulo = document.createElement('div');
        newModulo.classList.add('modulo-item');
        newModulo.setAttribute('data-modulo-id', newId);
        newModulo.innerHTML = `
            <input type="text" class="form-control" placeholder="Nombre del módulo" required>
            <button type="button" class="btn-remove" title="Eliminar módulo">🗑️</button>
        `;
        container.appendChild(newModulo);
        newModulo.querySelector('input').focus();
    });

    // Lógica para eliminar módulos
    document.getElementById('modulosContainer').addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove')) {
            e.target.closest('.modulo-item').remove();
        }
    });
});
