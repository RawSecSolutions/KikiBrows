// js/funcionalidadTabla.js - GESTIÓN USUARIOS Y CURSOS

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIMULACIÓN DE DATOS ---
    
    // Lista de Cursos Disponibles (Mock)
    const coursesDB = [
        { id: 1, name: 'Microblading Inicial' },
        { id: 2, name: 'Lifting de Pestañas' },
        { id: 3, name: 'Diseño de Cejas Avanzado' },
        { id: 4, name: 'Colorimetría Expert' }
    ];

    // Usuarios con curso asignado (courseId)
    let usersDB = [
        { id: 1, name: 'Emilio Castillo', email: 'emilio@kikibrows.com', role: 'Superadmin', status: 'Activo', courseId: null },
        { id: 2, name: 'Daniela Candi', email: 'dani@kikibrows.com', role: 'Admin', status: 'Activo', courseId: null },
        { id: 3, name: 'Ana García', email: 'ana@gmail.com', role: 'Cliente', status: 'Activo', courseId: 1 }, // Tiene Microblading
        { id: 4, name: 'Juan Pérez', email: 'juan@gmail.com', role: 'Cliente', status: 'Inactivo', courseId: null },
        { id: 5, name: 'Carla Lopez', email: 'carla@hotmail.com', role: 'Cliente', status: 'Activo', courseId: 2 } // Tiene Lifting
    ];

    const userListContainer = document.getElementById('user-list');
    const modalEl = document.getElementById('userModal');
    const userModal = new bootstrap.Modal(modalEl);
    const toastEl = document.getElementById('userToast');
    const toastBody = document.getElementById('toast-msg');
    const toast = new bootstrap.Toast(toastEl);

    // Inputs
    const searchInput = document.getElementById('search-input');
    const roleFilter = document.getElementById('role-filter');
    const courseSelect = document.getElementById('userCourse');

    // --- 2. FUNCIONES HELPER ---

    function loadCoursesIntoSelect() {
        courseSelect.innerHTML = '<option value="">-- Ninguno --</option>';
        coursesDB.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.name;
            courseSelect.appendChild(option);
        });
    }

    function getBadge(role) {
        if(role === 'Superadmin') return '<span class="badge bg-dark">Super Admin</span>';
        if(role === 'Admin') return '<span class="badge bg-primary">Admin</span>';
        return '<span class="badge bg-secondary">Cliente</span>';
    }

    function getStatus(status) {
        return status === 'Activo' 
            ? '<span class="text-success fw-bold"><i class="fas fa-check-circle me-1"></i>Activo</span>'
            : '<span class="text-muted"><i class="fas fa-ban me-1"></i>Inactivo</span>';
    }

    function getCourseName(courseId) {
        if (!courseId) return '<span class="text-muted small">-</span>';
        const course = coursesDB.find(c => c.id == courseId);
        return course ? `<span class="badge bg-info text-dark">${course.name}</span>` : '-';
    }

    // --- 3. RENDERIZADO ---

    function renderUsers() {
        userListContainer.innerHTML = '';
        
        const term = searchInput.value.toLowerCase();
        const roleTerm = roleFilter.value;

        const filtered = usersDB.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
            const matchesRole = roleTerm === 'all' || u.role === roleTerm;
            return matchesSearch && matchesRole;
        });

        if (filtered.length === 0) {
            userListContainer.innerHTML = '<div class="text-center p-4 text-muted">No se encontraron usuarios.</div>';
            return;
        }

        filtered.forEach(u => {
            let buttonsHTML = '';
            const isSuper = u.role === 'Superadmin';
            
            buttonsHTML += `
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser(${u.id})" title="Editar">
                    <i class="fas fa-pencil-alt"></i>
                </button>
            `;
            
            if (!isSuper) {
                buttonsHTML += `
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${u.id})" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
            } else {
                buttonsHTML += `<span class="d-inline-block" style="width: 32px;"></span>`;
            }

            const row = document.createElement('div');
            row.className = 'row d-flex align-items-center p-3 mb-2 rounded border bg-white-50';
            row.style.backgroundColor = 'rgba(255,255,255,0.5)';
            row.innerHTML = `
                <div class="col-3 fw-bold text-truncate">${u.name}</div>
                <div class="col-3 text-truncate text-muted small">${u.email}</div>
                <div class="col-2">${getBadge(u.role)}</div>
                <div class="col-2">${getCourseName(u.courseId)}</div>
                <div class="col-2 text-end">${buttonsHTML}</div>
            `;
            userListContainer.appendChild(row);
        });
    }

    // --- 4. ACCIONES DE MODAL ---

    window.editUser = function(id) {
        const user = usersDB.find(u => u.id === id);
        if (!user) return;

        document.getElementById('modalUserTitle').textContent = 'Editar Usuario';
        document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userStatus').value = user.status;
        
        // Cargar Curso Asignado
        courseSelect.value = user.courseId || "";

        const roleSelect = document.getElementById('userRole');
        
        if (user.role === 'Superadmin') {
            roleSelect.innerHTML = '<option value="Superadmin">Super Admin</option>';
            roleSelect.disabled = true;
            // Un superadmin probablemente no necesita cursos asignados, pero se deja habilitado por si acaso
        } else {
            roleSelect.innerHTML = `
                <option value="Admin">Administrador</option>
                <option value="Cliente">Cliente</option>
            `;
            roleSelect.value = user.role;
            roleSelect.disabled = false;
        }

        document.getElementById('passwordGroup').classList.add('d-none');
        userModal.show();
    };

    window.deleteUser = function(id) {
        if(!confirm('¿Estás seguro de eliminar este usuario?')) return;
        usersDB = usersDB.filter(u => u.id !== id);
        renderUsers();
        showToast('Usuario eliminado.');
    };

    // Botón "Nuevo Usuario"
    const btnOpenCreate = document.getElementById('btn-open-create');
    if (btnOpenCreate) {
        btnOpenCreate.addEventListener('click', () => {
            document.getElementById('modalUserTitle').textContent = 'Crear Usuario';
            document.getElementById('userForm').reset();
            document.getElementById('userId').value = '';
            courseSelect.value = ""; // Reset curso
            
            const roleSelect = document.getElementById('userRole');
            roleSelect.innerHTML = `
                <option value="Admin">Administrador</option>
                <option value="Cliente" selected>Cliente</option>
            `;
            roleSelect.disabled = false;
            
            document.getElementById('passwordGroup').classList.remove('d-none');
            userModal.show();
        });
    }

    // Guardar
    document.getElementById('btn-save-user').addEventListener('click', () => {
        const id = document.getElementById('userId').value;
        const name = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        const roleEl = document.getElementById('userRole');
        const status = document.getElementById('userStatus').value;
        const courseId = document.getElementById('userCourse').value;

        if (!name || !email) {
            alert('Nombre y Email son obligatorios');
            return;
        }

        if (id) {
            // Edición
            const index = usersDB.findIndex(u => u.id == id);
            if (index !== -1) {
                usersDB[index].name = name;
                usersDB[index].email = email;
                usersDB[index].status = status;
                usersDB[index].courseId = courseId ? parseInt(courseId) : null;
                
                if (!roleEl.disabled) {
                    usersDB[index].role = roleEl.value;
                }
                showToast('Datos actualizados.');
            }
        } else {
            // Creación
            const newUser = {
                id: Date.now(),
                name: name,
                email: email,
                role: roleEl.value,
                status: status,
                courseId: courseId ? parseInt(courseId) : null
            };
            usersDB.push(newUser);
            showToast('Usuario creado exitosamente.');
        }

        userModal.hide();
        renderUsers();
    });

    // Filtros
    searchInput.addEventListener('input', renderUsers);
    roleFilter.addEventListener('change', renderUsers);

    // Helper Toast
    function showToast(msg) {
        toastBody.textContent = msg;
        toast.show();
    }

    // Init
    loadCoursesIntoSelect();
    renderUsers();
});