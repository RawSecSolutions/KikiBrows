// js/funcionalidadTabla.js - GESTIÓN USUARIOS Y CURSOS (SUPABASE)
import { supabase } from './sessionManager.js';

document.addEventListener('DOMContentLoaded', async () => {

    let usersDB = [];
    let coursesDB = [];
    let inscripcionesDB = [];

    const userListContainer = document.getElementById('user-list');
    const modalEl = document.getElementById('userModal');
    const userModal = new bootstrap.Modal(modalEl);
    const toastEl = document.getElementById('userToast');
    const toastBody = document.getElementById('toast-msg');
    const toast = new bootstrap.Toast(toastEl);

    const searchInput = document.getElementById('search-input');
    const roleFilter = document.getElementById('role-filter');
    const courseSelect = document.getElementById('userCourse');

    // Obtener usuario actual para evitar auto-bloqueo y cargar email
    let currentUserId = null;
    let currentUserEmail = null;
    const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
    if (currentAuthUser) {
        currentUserId = currentAuthUser.id;
        currentUserEmail = currentAuthUser.email;
    }

    // --- 1. CARGA DE DATOS DESDE SUPABASE ---

    async function fetchUsers() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('first_name');

        if (error) {
            console.error('Error cargando usuarios:', error);
            showToast('Error al cargar usuarios');
            return;
        }
        usersDB = data || [];
    }

    async function fetchCourses() {
        const { data, error } = await supabase
            .from('cursos')
            .select('*');

        if (error) {
            console.error('Error cargando cursos:', error);
            return;
        }
        coursesDB = data || [];
    }

    async function fetchInscripciones() {
        const { data, error } = await supabase
            .from('inscripciones')
            .select('*');

        if (error) {
            console.error('Error cargando inscripciones:', error);
            return;
        }
        inscripcionesDB = data || [];
    }

    async function loadAllData() {
        userListContainer.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin me-2"></i>Cargando usuarios...</div>';
        await Promise.all([fetchUsers(), fetchCourses(), fetchInscripciones()]);
        loadCoursesIntoSelect();
        renderUsers();
    }

    // --- 2. FUNCIONES HELPER ---

    function getUserName(user) {
        return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Sin nombre';
    }

    function loadCoursesIntoSelect() {
        courseSelect.innerHTML = '<option value="">-- Ninguno --</option>';
        coursesDB.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.nombre || c.name || `Curso ${c.id}`;
            courseSelect.appendChild(option);
        });
    }

    async function waitForProfile(userId, maxRetries = 10, delayMs = 500) {
        for (let i = 0; i < maxRetries; i++) {
            const { data } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .maybeSingle();

            if (data) return true;
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        return false;
    }

    function calcularFechaExpiracion(cursoId) {
        const curso = coursesDB.find(c => c.id === cursoId);
        if (!curso || !curso.dias_duracion_acceso) return null;
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + curso.dias_duracion_acceso);
        return fecha.toISOString();
    }

    function getBadge(role) {
        if (role === 'superadmin') return '<span class="badge bg-dark">Super Admin</span>';
        if (role === 'admin') return '<span class="badge bg-primary">Admin</span>';
        return '<span class="badge bg-secondary">Estudiante</span>';
    }

    function getStatus(is_blocked) {
        if (is_blocked) {
            return '<span class="text-danger fw-bold"><i class="fas fa-lock me-1"></i>Bloqueado</span>';
        }
        return '<span class="text-success fw-bold"><i class="fas fa-check-circle me-1"></i>Activo</span>';
    }

    function getUserCourses(userId) {
        const userInscripciones = inscripcionesDB.filter(i =>
            i.user_id === userId || i.perfil_id === userId || i.usuario_id === userId
        );
        if (userInscripciones.length === 0) return '<span class="text-muted small">-</span>';

        const courseNames = userInscripciones.map(i => {
            const course = coursesDB.find(c => c.id === (i.curso_id || i.course_id));
            return course ? (course.nombre || course.name) : null;
        }).filter(Boolean);

        if (courseNames.length === 0) return '<span class="text-muted small">-</span>';
        return courseNames.map(n => `<span class="badge bg-info text-dark">${n}</span>`).join(' ');
    }

    // --- 3. RENDERIZADO ---

    function renderUsers() {
        userListContainer.innerHTML = '';

        const term = searchInput.value.toLowerCase();
        const roleTerm = roleFilter.value;

        const filtered = usersDB.filter(u => {
            const name = getUserName(u).toLowerCase();
            const email = (u.email || '').toLowerCase();
            const matchesSearch = name.includes(term) || email.includes(term);
            const matchesRole = roleTerm === 'all' || u.role === roleTerm;
            return matchesSearch && matchesRole;
        });

        if (filtered.length === 0) {
            userListContainer.innerHTML = '<div class="text-center p-4 text-muted">No se encontraron usuarios.</div>';
            return;
        }

        filtered.forEach(u => {
            let buttonsHTML = '';
            const isSuper = u.role === 'superadmin';

            buttonsHTML += `
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser('${u.id}')" title="Editar">
                    <i class="fas fa-pencil-alt"></i>
                </button>
            `;

            if (!isSuper) {
                buttonsHTML += `
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${u.id}')" title="Eliminar">
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
                <div class="col-2 fw-bold text-truncate">${getUserName(u)}</div>
                <div class="col-3 text-truncate text-muted small">${u.email || '<span class="text-muted">-</span>'}</div>
                <div class="col-2">${getBadge(u.role)}</div>
                <div class="col-2">${getStatus(u.is_blocked)}</div>
                <div class="col-1">${getUserCourses(u.id)}</div>
                <div class="col-2 text-end">${buttonsHTML}</div>
            `;
            userListContainer.appendChild(row);
        });
    }

    // --- 4. BLOQUEAR / DESBLOQUEAR (RPC) ---

    const handleToggleBlock = async (usuario) => {
        const nuevoEstado = !usuario.is_blocked;
        const { error } = await supabase
            .rpc('admin_toggle_bloqueo', {
                target_user_id: usuario.id,
                nuevo_estado: nuevoEstado
            });

        if (error) {
            alert('Error al actualizar bloqueo: ' + error.message);
            return false;
        }

        usuario.is_blocked = nuevoEstado;
        return true;
    };

    // --- 5. ELIMINAR USUARIO ---

    const handleDeleteUser = async (usuarioId) => {
        if (!confirm('¿ESTÁS SEGURO? Esto borrará al usuario, sus cursos y pagos.')) return;

        try {
            const { error } = await supabase.rpc('admin_delete_user', {
                target_user_id: usuarioId
            });

            if (error) throw new Error(error.message);

            usersDB = usersDB.filter(u => u.id !== usuarioId);
            renderUsers();
            showToast('Usuario eliminado.');
        } catch (err) {
            alert('Error al eliminar: ' + err.message);
        }
    };

    // --- 6. ACCIONES DE MODAL ---

    window.editUser = function(id) {
        const user = usersDB.find(u => u.id === id);
        if (!user) return;

        document.getElementById('modalUserTitle').textContent = 'Editar Usuario';
        document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = getUserName(user);
        // Si es el usuario actual y no tiene email en profiles, usar el de auth
        const emailValue = user.email || (user.id === currentUserId ? currentUserEmail : '') || '';
        document.getElementById('userEmail').value = emailValue;

        // Cargar estado de bloqueo
        const blockedCheckbox = document.getElementById('userBlocked');
        blockedCheckbox.checked = user.is_blocked || false;

        // No permitir bloquearse a sí mismo
        const blockGroup = blockedCheckbox.closest('.mb-3');
        if (user.id === currentUserId) {
            blockedCheckbox.disabled = true;
            blockGroup.style.opacity = '0.5';
            blockGroup.title = 'No puedes bloquearte a ti mismo';
        } else {
            blockedCheckbox.disabled = false;
            blockGroup.style.opacity = '1';
            blockGroup.title = '';
        }

        // Cargar Curso Asignado
        const userInscrip = inscripcionesDB.find(i =>
            i.user_id === user.id || i.perfil_id === user.id || i.usuario_id === user.id
        );
        courseSelect.value = userInscrip ? (userInscrip.curso_id || userInscrip.course_id || '') : '';

        const roleSelect = document.getElementById('userRole');

        if (user.role === 'superadmin') {
            roleSelect.innerHTML = '<option value="superadmin">Super Admin</option>';
            roleSelect.disabled = true;
        } else {
            roleSelect.innerHTML = `
                <option value="admin">Administrador</option>
                <option value="student">Estudiante</option>
            `;
            roleSelect.value = user.role;
            roleSelect.disabled = false;
        }

        document.getElementById('passwordGroup').classList.add('d-none');
        userModal.show();
    };

    window.deleteUser = function(id) {
        handleDeleteUser(id);
    };

    // Botón "Nuevo Usuario"
    const btnOpenCreate = document.getElementById('btn-open-create');
    if (btnOpenCreate) {
        btnOpenCreate.addEventListener('click', () => {
            document.getElementById('modalUserTitle').textContent = 'Crear Usuario';
            document.getElementById('userForm').reset();
            document.getElementById('userId').value = '';
            courseSelect.value = '';
            const blockedCheckbox = document.getElementById('userBlocked');
            blockedCheckbox.checked = false;
            blockedCheckbox.disabled = false;
            const blockGroup = blockedCheckbox.closest('.mb-3');
            blockGroup.style.opacity = '1';
            blockGroup.title = '';

            const roleSelect = document.getElementById('userRole');
            roleSelect.innerHTML = `
                <option value="admin">Administrador</option>
                <option value="student" selected>Estudiante</option>
            `;
            roleSelect.disabled = false;

            document.getElementById('passwordGroup').classList.remove('d-none');
            userModal.show();
        });
    }

    // --- 7. GUARDAR (Editar / Crear) ---

    document.getElementById('btn-save-user').addEventListener('click', async () => {
        const id = document.getElementById('userId').value;
        const fullName = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const roleEl = document.getElementById('userRole');
        const blocked = document.getElementById('userBlocked').checked;

        if (!fullName) {
            alert('El nombre es obligatorio');
            return;
        }

        // Separar nombre y apellido
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        if (id) {
            // --- EDICIÓN ---
            const user = usersDB.find(u => u.id === id);
            if (!user) return;

            // No permitir bloquearse a sí mismo
            if (user.id === currentUserId && blocked) {
                alert('No puedes bloquearte a ti mismo');
                return;
            }

            // Si cambió el estado de bloqueo, usar RPC
            if (user.is_blocked !== blocked) {
                const ok = await handleToggleBlock(user);
                if (!ok) return;
            }

            // Actualizar perfil en Supabase
            const updateData = { first_name: firstName, last_name: lastName };
            if (!roleEl.disabled) {
                updateData.role = roleEl.value;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', id);

            if (error) {
                alert('Error al actualizar perfil: ' + error.message);
                return;
            }

            // Asignar curso si se seleccionó uno (regalo/asignación admin)
            const selectedCourse = courseSelect.value;
            if (selectedCourse) {
                // Verificar si ya tiene inscripción para este curso
                const yaInscrito = inscripcionesDB.some(i =>
                    (i.usuario_id === id || i.user_id === id || i.perfil_id === id) &&
                    (i.curso_id === selectedCourse || i.course_id === selectedCourse)
                );

                if (!yaInscrito) {
                    const inscripcionData = {
                        usuario_id: id,
                        curso_id: selectedCourse,
                        origen_acceso: 'ASIGNACION_ADMIN',
                        estado: 'ACTIVO'
                    };
                    const fechaExp = calcularFechaExpiracion(selectedCourse);
                    if (fechaExp) inscripcionData.fecha_expiracion = fechaExp;

                    const { error: inscripError } = await supabase
                        .from('inscripciones')
                        .insert(inscripcionData);

                    if (inscripError) {
                        console.warn('Error asignando curso:', inscripError);
                        showToast('Perfil actualizado, pero hubo un error al asignar el curso.');
                        await loadAllData();
                        userModal.hide();
                        return;
                    }
                }
            }

            // Actualizar datos locales
            const index = usersDB.findIndex(u => u.id === id);
            if (index !== -1) {
                usersDB[index].first_name = firstName;
                usersDB[index].last_name = lastName;
                if (!roleEl.disabled) usersDB[index].role = roleEl.value;
            }

            // Recargar inscripciones para reflejar cambios
            if (selectedCourse) {
                await fetchInscripciones();
            }

            showToast(selectedCourse ? 'Datos actualizados con curso asignado.' : 'Datos actualizados.');
        } else {
            // --- CREACIÓN ---
            if (!email) {
                alert('El email es obligatorio para crear un usuario');
                return;
            }

            const password = document.getElementById('userPassword').value;
            if (!password || password.length < 6) {
                alert('La contraseña es obligatoria y debe tener al menos 6 caracteres');
                return;
            }

            // Crear usuario via RPC (sin envio de email de confirmacion)
            // La funcion crea: auth user + profile + inscripcion (si hay curso)
            const selectedCourse = courseSelect.value;
            const rpcParams = {
                p_email: email,
                p_password: password,
                p_first_name: firstName,
                p_last_name: lastName,
                p_role: roleEl.value,
                p_is_blocked: blocked
            };

            if (selectedCourse) {
                rpcParams.p_curso_id = selectedCourse;
                const fechaExp = calcularFechaExpiracion(selectedCourse);
                if (fechaExp) rpcParams.p_fecha_expiracion = fechaExp;
            }

            const { data: newUserId, error: rpcError } = await supabase.rpc('admin_create_user', rpcParams);

            if (rpcError) {
                alert('Error al crear usuario: ' + rpcError.message);
                return;
            }

            showToast(selectedCourse ? 'Usuario creado con curso asignado.' : 'Usuario creado exitosamente.');
            await loadAllData(); // Recargar todos los datos
            userModal.hide();
            return;
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

    // Init - Cargar datos reales
    await loadAllData();
});
