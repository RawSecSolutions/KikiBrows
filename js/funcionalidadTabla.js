// js/funcionalidadTabla.js - GESTIÓN USUARIOS Y CURSOS (SUPABASE)
import { supabase } from './sessionManager.js';

document.addEventListener('DOMContentLoaded', async () => {

    let usersDB = [];
    let coursesDB = [];
    let inscripcionesDB = [];
    let certificadosDB = [];

    const userListContainer = document.getElementById('user-list');
    const modalEl = document.getElementById('userModal');
    const userModal = new bootstrap.Modal(modalEl);
    const toastEl = document.getElementById('userToast');
    const toastBody = document.getElementById('toast-msg');
    const toast = new bootstrap.Toast(toastEl);

    const searchInput = document.getElementById('search-input');
    const roleFilter = document.getElementById('role-filter');
    const courseSelect = document.getElementById('userCourse');

    // Obtener usuario actual para evitar auto-bloqueo y cargar email/rol
    let currentUserId = null;
    let currentUserEmail = null;
    let currentUserRole = null;
    const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
    if (currentAuthUser) {
        currentUserId = currentAuthUser.id;
        currentUserEmail = currentAuthUser.email;
        const { data: myProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUserId)
            .single();
        currentUserRole = myProfile?.role || 'student';
    }
    const isSuperAdmin = currentUserRole === 'superadmin';

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

    async function fetchCertificados() {
        const { data, error } = await supabase
            .from('certificados')
            .select('id, usuario_id, curso_id, nombre_curso_snapshot');

        if (error) {
            console.error('Error cargando certificados:', error);
            return;
        }
        certificadosDB = data || [];
    }

    async function loadAllData() {
        userListContainer.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin me-2"></i>Cargando usuarios...</div>';
        await Promise.all([fetchUsers(), fetchCourses(), fetchInscripciones(), fetchCertificados()]);
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

    function getStatus(user) {
        if (user.is_blocked) {
            return '<span class="text-danger fw-bold"><i class="fas fa-lock me-1"></i>Bloqueado</span>';
        }

        // Verificar si tiene inscripciones activas (no expiradas)
        const userInscripciones = inscripcionesDB.filter(i =>
            (i.user_id === user.id || i.perfil_id === user.id || i.usuario_id === user.id)
        );

        const tieneAccesoActivo = userInscripciones.some(i => {
            if (!i.fecha_expiracion) return i.estado === 'ACTIVO';
            return new Date(i.fecha_expiracion) > new Date() && i.estado === 'ACTIVO';
        });

        if (tieneAccesoActivo) {
            return '<span class="text-success fw-bold"><i class="fas fa-check-circle me-1"></i>Activo</span>';
        }

        // Si tiene certificados pero no cursos activos
        const userCerts = certificadosDB.filter(c => c.usuario_id === user.id);
        if (userCerts.length > 0) {
            return '<span class="text-muted fw-bold"><i class="fas fa-graduation-cap me-1"></i>Completado</span>';
        }

        return '<span class="text-success fw-bold"><i class="fas fa-check-circle me-1"></i>Activo</span>';
    }

    function getUserCourses(userId) {
        // Contar certificados del usuario (persisten incluso después de eliminar inscripción)
        const userCerts = certificadosDB.filter(c => c.usuario_id === userId);
        const certCount = userCerts.length;

        // También contar inscripciones activas
        const userInscripciones = inscripcionesDB.filter(i =>
            i.user_id === userId || i.perfil_id === userId || i.usuario_id === userId
        );
        const activeCount = userInscripciones.filter(i => {
            if (!i.fecha_expiracion) return i.estado === 'ACTIVO';
            return new Date(i.fecha_expiracion) > new Date() && i.estado === 'ACTIVO';
        }).length;

        const parts = [];
        if (activeCount > 0) {
            parts.push(`<span class="badge bg-info text-dark"><i class="fas fa-book me-1"></i>${activeCount} activo${activeCount > 1 ? 's' : ''}</span>`);
        }
        if (certCount > 0) {
            parts.push(`<span class="badge bg-success"><i class="fas fa-graduation-cap me-1"></i>${certCount} cert.</span>`);
        }

        return parts.length > 0 ? parts.join(' ') : '<span class="text-muted small">-</span>';
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
            const isAdmin = u.role === 'admin';

            // Admin solo puede gestionar students; superadmin gestiona a todos menos superadmins
            const canManage = isSuperAdmin ? !isSuper : (u.role === 'student');

            if (canManage) {
                buttonsHTML += `
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser('${u.id}')" title="Editar">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                `;
                buttonsHTML += `
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${u.id}')" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
            } else {
                buttonsHTML += `<span class="d-inline-block" style="width: 64px;"></span>`;
            }

            const row = document.createElement('div');
            row.className = 'row d-flex align-items-center p-3 mb-2 rounded border user-row';
            row.innerHTML = `
                <div class="col-2 fw-bold text-truncate">${getUserName(u)}</div>
                <div class="col-3 text-truncate text-muted small">${u.email || '<span class="text-muted">-</span>'}</div>
                <div class="col-2">${getBadge(u.role)}</div>
                <div class="col-2">${getStatus(u)}</div>
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
        
        const emailValue = user.email || (user.id === currentUserId ? currentUserEmail : '') || '';
        document.getElementById('userEmail').value = emailValue;

        const blockedCheckbox = document.getElementById('userBlocked');
        blockedCheckbox.checked = user.is_blocked || false;

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

        const userInscrip = inscripcionesDB.find(i =>
            i.user_id === user.id || i.perfil_id === user.id || i.usuario_id === user.id
        );
        courseSelect.value = userInscrip ? (userInscrip.curso_id || userInscrip.course_id || '') : '';

        const roleSelect = document.getElementById('userRole');

        if (user.role === 'superadmin') {
            roleSelect.innerHTML = '<option value="superadmin">Super Admin</option>';
            roleSelect.disabled = true;
        } else if (isSuperAdmin) {
            // Superadmin puede cambiar roles entre admin y student
            roleSelect.innerHTML = `
                <option value="admin">Administrador</option>
                <option value="student">Estudiante</option>
            `;
            roleSelect.value = user.role;
            roleSelect.disabled = false;
        } else {
            // Admin solo gestiona students, no puede cambiar roles
            roleSelect.innerHTML = `<option value="${user.role}">${user.role === 'admin' ? 'Administrador' : 'Estudiante'}</option>`;
            roleSelect.disabled = true;
        }

        document.getElementById('passwordGroup').classList.add('d-none');
        userModal.show();
    };

    window.deleteUser = function(id) {
        handleDeleteUser(id);
    };

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
            if (isSuperAdmin) {
                roleSelect.innerHTML = `
                    <option value="admin">Administrador</option>
                    <option value="student" selected>Estudiante</option>
                `;
                roleSelect.disabled = false;
            } else {
                roleSelect.innerHTML = '<option value="student" selected>Estudiante</option>';
                roleSelect.disabled = true;
            }

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
        const saveBtn = document.getElementById('btn-save-user');

        if (!fullName) {
            alert('El nombre es obligatorio');
            return;
        }

        // Separar nombre y apellido
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // UI: Deshabilitar botón durante la carga
        const originalBtnText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        saveBtn.disabled = true;

        try {
            if (id) {
                // ==========================================
                //                 EDICIÓN
                // ==========================================
                const user = usersDB.find(u => u.id === id);
                if (!user) throw new Error("Usuario no encontrado en la base local");

                if (user.id === currentUserId && blocked) {
                    throw new Error('No puedes bloquearte a ti mismo');
                }

                if (user.is_blocked !== blocked) {
                    const ok = await handleToggleBlock(user);
                    if (!ok) throw new Error("Fallo al actualizar bloqueo");
                }

                const updateData = { first_name: firstName, last_name: lastName };

                const { error } = await supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('id', id);

                if (error) throw new Error('Error al actualizar perfil: ' + error.message);

                // Actualizar rol usando RPC (bypasa RLS)
                if (!roleEl.disabled && user.role !== roleEl.value) {
                    const { error: roleError } = await supabase.rpc('admin_set_role', {
                        target_user_id: id,
                        new_role: roleEl.value
                    });

                    if (roleError) throw new Error('Error al cambiar rol: ' + roleError.message);
                }

                const selectedCourse = courseSelect.value;
                if (selectedCourse) {
                    // Verificar directamente en BD si ya está inscrito (evita datos en caché desactualizados)
                    const { data: existingInscrip } = await supabase
                        .from('inscripciones')
                        .select('id')
                        .eq('usuario_id', id)
                        .eq('curso_id', selectedCourse)
                        .maybeSingle();

                    if (!existingInscrip) {
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
                            .upsert(inscripcionData, { onConflict: 'usuario_id,curso_id' });

                        if (inscripError) {
                            console.warn('Error asignando curso:', inscripError);
                            showToast('Perfil actualizado, pero hubo un error al asignar el curso.');
                        } else {
                            showToast('Datos actualizados con curso asignado.');
                        }
                    } else {
                        showToast('Datos actualizados (ya inscrito en este curso).');
                    }
                } else {
                    showToast('Datos actualizados.');
                }

            } else {
                // ==========================================
                //                 CREACIÓN
                // ==========================================
                if (!email) throw new Error('El email es obligatorio para crear un usuario');

                const password = document.getElementById('userPassword').value;
                if (!password || password.length < 6) {
                    throw new Error('La contraseña es obligatoria y debe tener al menos 6 caracteres');
                }

                const selectedCourse = courseSelect.value;

                // 1. Invocar la Edge Function para crear el usuario en GoTrue
                const userData = {
                    email: email,
                    password: password,
                    firstName: firstName,
                    lastName: lastName,
                    role: roleEl.value
                };

                const { data: edgeData, error: functionError } = await supabase.functions.invoke('bright-api', {
                    body: userData
                });

                if (functionError) throw new Error(functionError.message);
                if (edgeData?.error) throw new Error(edgeData.error);

                const newUserId = edgeData.user.id;

                // 2. Esperar a que el trigger de base de datos cree el Perfil
                await waitForProfile(newUserId);

                // 2.5 Actualizar nombre del perfil
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ first_name: firstName, last_name: lastName })
                    .eq('id', newUserId);

                if (profileError) {
                    console.warn('Error actualizando nombre del perfil:', profileError);
                }

                // 2.6 Asignar rol usando RPC (bypasa RLS)
                const { error: roleError } = await supabase.rpc('admin_set_role', {
                    target_user_id: newUserId,
                    new_role: roleEl.value
                });

                if (roleError) {
                    console.error('Error asignando rol:', roleError);
                    showToast('Usuario creado pero hubo un error al asignar el rol.');
                }

                // 3. Asignar el curso en la tabla de inscripciones si es necesario
                if (selectedCourse) {
                    const inscripcionData = {
                        usuario_id: newUserId,
                        curso_id: selectedCourse,
                        origen_acceso: 'ASIGNACION_ADMIN',
                        estado: 'ACTIVO'
                    };
                    
                    const fechaExp = calcularFechaExpiracion(selectedCourse);
                    if (fechaExp) inscripcionData.fecha_expiracion = fechaExp;

                    const { error: inscripError } = await supabase
                        .from('inscripciones')
                        .upsert(inscripcionData, { onConflict: 'usuario_id,curso_id' });

                    if (inscripError) {
                        console.warn('Error asignando curso:', inscripError);
                        showToast('Usuario creado, pero hubo un error al asignar el curso.');
                    } else {
                        showToast('Usuario creado con curso asignado exitosamente.');
                    }
                } else {
                    showToast('Usuario creado exitosamente.');
                }
            }

            await loadAllData(); 
            userModal.hide();

        } catch (err) {
            alert(err.message);
        } finally {
            // UI: Restaurar botón
            saveBtn.innerHTML = originalBtnText;
            saveBtn.disabled = false;
        }
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