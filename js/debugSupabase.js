/**
 * js/debugSupabase.js
 * Utilidad de diagnóstico para depurar problemas de carga de tablas Supabase.
 * Verifica sesión, JWT, rol, y acceso a cada tabla relevante.
 *
 * Uso: importar y llamar runDiagnostics(supabase) después de authReady.
 */

const DEBUG_TABLES = [
    'transacciones',
    'consulta_slots',
    'consultas_reservas',
    'profiles',
    'cursos'
];

/**
 * Ejecuta diagnóstico completo y muestra resultados en consola.
 */
async function runDiagnostics(supabase) {
    console.group('%c[DEBUG SUPABASE] Diagnóstico Completo', 'color: #ff6b00; font-weight: bold; font-size: 14px;');

    // 1. Verificar sesión
    const sessionInfo = await checkSession(supabase);
    if (!sessionInfo) {
        console.groupEnd();
        return;
    }

    // 2. Verificar perfil y rol
    await checkProfile(supabase, sessionInfo.userId);

    // 3. Probar acceso a cada tabla
    await testTableAccess(supabase);

    // 4. Probar operaciones específicas que fallan
    await testSpecificQueries(supabase);

    console.log('%c[DEBUG] Diagnóstico finalizado. Revisa los resultados arriba.', 'color: #ff6b00; font-weight: bold;');
    console.groupEnd();
}

async function checkSession(supabase) {
    console.group('%c[1/4] Sesión y JWT', 'color: #2196F3; font-weight: bold;');

    try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error('ERROR obteniendo sesión:', error.message);
            console.groupEnd();
            return null;
        }

        const session = data?.session;
        if (!session) {
            console.error('NO HAY SESIÓN ACTIVA. El usuario no está autenticado.');
            console.groupEnd();
            return null;
        }

        const user = session.user;
        console.log('User ID:', user.id);
        console.log('Email:', user.email);
        console.log('Role (JWT):', user.role);
        console.log('Token expira:', new Date(session.expires_at * 1000).toLocaleString('es-CL'));

        // Decodificar JWT para ver claims
        try {
            const payload = JSON.parse(atob(session.access_token.split('.')[1]));
            console.log('JWT claims completos:', payload);
            console.log('  - iss:', payload.iss);
            console.log('  - role:', payload.role);
            console.log('  - aal:', payload.aal);
            if (payload.app_metadata) {
                console.log('  - app_metadata:', payload.app_metadata);
            }
            if (payload.user_metadata) {
                console.log('  - user_metadata:', payload.user_metadata);
            }
        } catch (e) {
            console.warn('No se pudo decodificar el JWT:', e.message);
        }

        console.log('Sesión OK');
        console.groupEnd();
        return { userId: user.id, email: user.email };

    } catch (err) {
        console.error('Error crítico verificando sesión:', err);
        console.groupEnd();
        return null;
    }
}

async function checkProfile(supabase, userId) {
    console.group('%c[2/4] Perfil y Rol en DB', 'color: #4CAF50; font-weight: bold;');

    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, role, is_blocked')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('ERROR obteniendo perfil:', error.message, '| Código:', error.code);
            if (error.code === 'PGRST116') {
                console.error('  -> No se encontró perfil para este usuario. Puede que la fila no exista en profiles.');
            }
            if (error.code === '42501') {
                console.error('  -> PERMISO DENEGADO. La RLS policy de profiles no permite lectura.');
            }
            console.groupEnd();
            return;
        }

        console.log('Nombre:', profile.first_name, profile.last_name);
        console.log('Email:', profile.email);
        console.log('Rol:', profile.role);
        console.log('Bloqueado:', profile.is_blocked);

        if (profile.role !== 'admin' && profile.role !== 'superadmin') {
            console.warn('ALERTA: El rol no es admin ni superadmin. Las policies que verifican rol admin fallarán.');
        }

        if (profile.is_blocked) {
            console.warn('ALERTA: La cuenta está bloqueada.');
        }

        console.log('Perfil OK');
        console.groupEnd();

    } catch (err) {
        console.error('Error crítico verificando perfil:', err);
        console.groupEnd();
    }
}

async function testTableAccess(supabase) {
    console.group('%c[3/4] Test de Acceso a Tablas (SELECT)', 'color: #FF9800; font-weight: bold;');

    for (const table of DEBUG_TABLES) {
        try {
            const startTime = performance.now();
            const { data, error, count, status, statusText } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: false })
                .limit(1);

            const elapsed = Math.round(performance.now() - startTime);

            if (error) {
                console.error(`FALLO ${table}:`, {
                    mensaje: error.message,
                    codigo: error.code,
                    detalles: error.details,
                    hint: error.hint,
                    status: status,
                    tiempo: `${elapsed}ms`
                });

                if (error.code === '42501') {
                    console.error(`  -> PERMISO DENEGADO en "${table}". Falta policy SELECT para este usuario.`);
                } else if (error.code === '42P01') {
                    console.error(`  -> La tabla "${table}" NO EXISTE.`);
                }
            } else {
                const filas = data ? data.length : 0;
                const estilo = filas > 0 ? 'color: green' : 'color: orange';
                console.log(
                    `%c${filas > 0 ? 'OK' : 'VACÍO'} ${table}: ${filas} fila(s) devueltas (${elapsed}ms)`,
                    estilo
                );

                if (filas === 0) {
                    console.warn(`  -> "${table}" devolvió 0 filas. Puede ser RLS o tabla vacía. Verifica policy SELECT.`);
                }

                // Mostrar muestra del primer registro si existe
                if (data && data[0]) {
                    console.log(`  -> Columnas:`, Object.keys(data[0]).join(', '));
                }
            }
        } catch (err) {
            console.error(`ERROR INESPERADO en ${table}:`, err.message);
        }
    }

    console.groupEnd();
}

async function testSpecificQueries(supabase) {
    console.group('%c[4/4] Queries Específicas del Admin', 'color: #9C27B0; font-weight: bold;');

    // Test: transacciones con estado PAGADO
    try {
        console.log('--- Transacciones (estado=PAGADO) ---');
        const { data, error } = await supabase
            .from('transacciones')
            .select('id, estado, monto, fecha_compra')
            .eq('estado', 'PAGADO')
            .limit(3);

        if (error) {
            console.error('FALLO:', error.message, '| Código:', error.code);
        } else {
            console.log(`Resultado: ${(data || []).length} transacciones PAGADO encontradas`);
            if (data && data.length > 0) {
                console.table(data);
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }

    // Test: transacciones SIN filtro de estado
    try {
        console.log('--- Transacciones (SIN filtro estado) ---');
        const { data, error } = await supabase
            .from('transacciones')
            .select('id, estado')
            .limit(5);

        if (error) {
            console.error('FALLO:', error.message, '| Código:', error.code);
        } else {
            console.log(`Resultado: ${(data || []).length} transacciones totales`);
            if (data && data.length > 0) {
                const estados = data.map(t => t.estado);
                console.log('Estados encontrados:', [...new Set(estados)]);
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }

    // Test: consulta_slots futuros
    try {
        console.log('--- Consulta Slots (futuros) ---');
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('consulta_slots')
            .select('id, fecha_inicio, estado, cupos_ocupados, cupos_maximos')
            .gte('fecha_inicio', now)
            .limit(3);

        if (error) {
            console.error('FALLO:', error.message, '| Código:', error.code);
        } else {
            console.log(`Resultado: ${(data || []).length} slots futuros encontrados`);
            if (data && data.length > 0) {
                console.table(data);
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }

    // Test: consulta_slots TODOS (sin filtro de fecha)
    try {
        console.log('--- Consulta Slots (TODOS, sin filtro fecha) ---');
        const { data, error } = await supabase
            .from('consulta_slots')
            .select('id, fecha_inicio, estado')
            .limit(5);

        if (error) {
            console.error('FALLO:', error.message, '| Código:', error.code);
        } else {
            console.log(`Resultado: ${(data || []).length} slots totales`);
            if (data && data.length > 0) {
                console.table(data);
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }

    // Test: consultas_reservas
    try {
        console.log('--- Consultas Reservas ---');
        const { data, error } = await supabase
            .from('consultas_reservas')
            .select('id, slot_id, usuario_id, estado')
            .limit(3);

        if (error) {
            console.error('FALLO:', error.message, '| Código:', error.code);
        } else {
            console.log(`Resultado: ${(data || []).length} reservas encontradas`);
            if (data && data.length > 0) {
                console.table(data);
            } else {
                console.warn('0 reservas devueltas. Policy "Usuarios pueden ver sus propias reservas" probablemente filtra por usuario_id = auth.uid(). El admin necesita su propia policy SELECT.');
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }

    console.groupEnd();
}

export { runDiagnostics };
