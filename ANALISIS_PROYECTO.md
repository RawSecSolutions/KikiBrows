# Analisis del Proyecto KikiBrows

## 1. PORCENTAJE DE APROBACION DEL QUIZ

### Como funciona

El sistema de quiz tiene 3 componentes principales:

1. **Creacion (Admin)** - `gestorModulos.js`
   - Admin configura `passingScore` (ej: 70%)
   - Agrega preguntas con puntos cada una
   - Se guarda en campo `metadata` (JSONB) de la tabla `clases`

2. **Renderizado (Alumno)** - `claseAlumn.js`
   - Lee `metadata.passingScore` y `metadata.questions`
   - Muestra preguntas al alumno
   - Calcula: `porcentaje = (puntosObtenidos / totalPoints) * 100`

3. **Evaluacion**
   - Compara: `porcentaje >= passingScore`
   - Si aprobado: marca clase como completada
   - Guarda intento en `localStorage` via `CursosData.guardarIntentoQuiz()`

### Estructura de la metadata del quiz

```javascript
metadata = {
    passingScore: 70,           // Porcentaje minimo para aprobar
    instructions: "...",         // Instrucciones para el alumno
    questions: [
        {
            title: "Pregunta 1?",
            points: 25,
            options: [
                { text: "Opcion A", isCorrect: false },
                { text: "Opcion B", isCorrect: true },
                { text: "Opcion C", isCorrect: false }
            ]
        }
    ]
}
```

### Bug corregido

Habia una incompatibilidad entre como se guardaba y como se leia la metadata:

| GUARDADO (gestorModulos.js) | LECTURA (claseAlumn.js) ANTES |
|-----------------------------|-------------------------------|
| `metadata.passingScore`     | Buscaba `metadata.configuracion.porcentaje_aprobacion` |
| `metadata.questions`        | Buscaba `metadata.preguntas` |
| String ("70")               | Comparaba con >= (fallaba) |

**Solucion aplicada:**
- Ahora lee correctamente `metadata.passingScore` y `metadata.questions`
- Convierte a numero con `parseInt()` al guardar
- Mantiene compatibilidad con formato antiguo

---

## 2. ORGANIZACION DEL PROYECTO POR SECCIONES

### LANDING / PAGINA PUBLICA
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `index.html` | HTML | Landing page principal |
| `js/landing.js` | JS | Funciones de la landing |
| `js/renderCursosLanding.js` | JS | Render de cursos en landing |
| `js/renderCarruselHero.js` | JS | Carrusel de hero |
| `css/landing.css` | CSS | Estilos de landing |
| `css/layout.css` | CSS | Layout general |
| `css/fonts.css` | CSS | Fuentes |

### AUTENTICACION
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `login.html` | HTML | Pagina de login |
| `registrate.html` | HTML | Pagina de registro |
| `recover.html` | HTML | Recuperar password |
| `resetPassword.html` | HTML | Resetear password |
| `js/login.js` | JS | Logica de login |
| `js/registrate.js` | JS | Logica de registro |
| `js/recover.js` | JS | Logica de recuperacion |
| `js/resetPassword.js` | JS | Logica de reset |
| `js/sessionManager.js` | JS | Manejo de sesion |
| `js/authGuard.js` | JS | Proteccion de rutas (alumno) |
| `js/authGuardAdmin.js` | JS | Proteccion de rutas (admin) |
| `css/login.css` | CSS | Estilos login |
| `css/registrate.css` | CSS | Estilos registro |
| `css/recover.css` | CSS | Estilos recuperacion |
| `css/resetPassword.css` | CSS | Estilos reset |

### CURSOS (ALUMNO)
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `cursosAlumn.html` | HTML | Lista de cursos del alumno |
| `claseAlumn.html` | HTML | Aula virtual (video, quiz, etc) |
| `course-preview.html` | HTML | Preview de curso |
| `previewCursoCliente.html` | HTML | Preview para clientes |
| `js/cursosAlumn.js` | JS | Logica de lista de cursos |
| `js/claseAlumn.js` | JS | Aula virtual completa |
| `js/coursePreview.js` | JS | Preview de curso |
| `js/previewCursoCliente.js` | JS | Preview cliente |
| `js/cursosData.js` | JS | Cache de datos de cursos |
| `js/cursosService.js` | JS | Servicios API para cursos |
| `js/componentsAlumn.js` | JS | Componentes del alumno |
| `css/cursosAlumn.css` | CSS | Estilos cursos alumno |
| `css/claseAlumn.css` | CSS | Estilos aula virtual |
| `css/coursePreview.css` | CSS | Estilos preview |
| `css/previewCursoCliente.css` | CSS | Estilos preview cliente |

### CERTIFICADOS
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `historialCertificados.html` | HTML | Lista de certificados |
| `test-certificate.html` | HTML | Test de certificados |
| `js/certificateGenerator.js` | JS | Generador PDF de certificados |
| `js/historialCertificados.js` | JS | Logica historial |
| `css/historialCertificados.css` | CSS | Estilos historial |

### CONSULTAS / CITAS
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `consultasAlumn.html` | HTML | Agendar consultas |
| `js/consultasAlumn.js` | JS | Logica de consultas |

### CUENTA DE USUARIO
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `account.html` | HTML | Perfil de usuario |
| `js/accountEdit.js` | JS | Edicion de cuenta |
| `js/profileUpdate.js` | JS | Actualizacion de perfil |
| `js/changePassword.js` | JS | Cambio de password |
| `css/account.css` | CSS | Estilos cuenta |

### PAGOS
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `payment-confirmation.html` | HTML | Confirmacion de pago |
| `historialCompras.html` | HTML | Historial de compras |
| `js/paymentSimulator.js` | JS | Simulador de pagos |
| `js/paymentConfirmation.js` | JS | Logica confirmacion |
| `js/historialCompras.js` | JS | Logica historial |
| `css/paymentConfirmation.css` | CSS | Estilos confirmacion |
| `css/historialCompras.css` | CSS | Estilos historial |

### ADMIN - DASHBOARD
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `adminPanel.html` | HTML | Panel principal admin |
| `js/dashboardAdmin.js` | JS | Dashboard admin |
| `js/componenteAdmin.js` | JS | Componentes admin |
| `css/dashboardAdmin.css` | CSS | Estilos dashboard |
| `css/layoutAdmin.css` | CSS | Layout admin |

### ADMIN - GESTION DE CURSOS
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `gestionCursos.html` | HTML | Lista de cursos (admin) |
| `creaCurso.html` | HTML | Crear curso |
| `gestorModulos.html` | HTML | Gestor de modulos |
| `previsualizaCurso.html` | HTML | Preview admin |
| `js/gestionCursos.js` | JS | Gestion de cursos |
| `js/creaCurso.js` | JS | Crear curso |
| `js/gestorModulos.js` | JS | Gestor modulos/clases |
| `js/previsualizaCurso.js` | JS | Preview admin |
| `js/adminCursosService.js` | JS | Servicios admin |
| `css/gestionCursos.css` | CSS | Estilos gestion |
| `css/creaCurso.css` | CSS | Estilos crear |
| `css/FormularioCreaCurso.css` | CSS | Formulario crear |
| `css/gestorModulos.css` | CSS | Estilos gestor |
| `css/previsualizaCurso.css` | CSS | Estilos preview |

### ADMIN - CALENDARIO
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `adminCalendar.html` | HTML | Calendario de citas |
| `js/calendarAdmin.js` | JS | Logica calendario |
| `css/calendarAdmin.css` | CSS | Estilos calendario |

### ADMIN - TRANSACCIONES
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `adminTransa.html` | HTML | Transacciones |
| `js/transaccionesAdmin.js` | JS | Logica transacciones |
| `css/transaccionesAdmin.css` | CSS | Estilos transacciones |

### ADMIN - REVISIONES Y FEEDBACK
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `revYFeedback.html` | HTML | Revisiones y feedback |
| `js/revisionesAdmin.js` | JS | Logica revisiones |
| `css/revisionesAdmin.css` | CSS | Estilos revisiones |

### ADMIN - USUARIOS
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `usersGest.html` | HTML | Gestion de usuarios |

### ADMIN - PASSWORD
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `adminProfilePassword.html` | HTML | Cambio password admin |
| `js/adminChangePassword.js` | JS | Logica cambio password |

### COMPONENTES COMPARTIDOS
| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `js/componentes.js` | JS | Navbar, footer (publico) |
| `js/config.js` | JS | Configuracion Supabase |
| `js/funcionalidadTabla.js` | JS | Funciones de tablas |
| `css/estiloTabla.css` | CSS | Estilos de tablas |

---

## 3. ARCHIVOS INUTILES O REDUNDANTES

### Para ELIMINAR (no se usan):
| Archivo | Razon |
|---------|-------|
| `js/register.js` | Duplicado de registrate.js (no referenciado) |
| `js/coursePreviewModal.js` | No existe el modal #coursePreviewModal en ningun HTML |
| `css/coursePreviewModal.css` | CSS para modal que no existe |
| `js/config.example.js` | Archivo de ejemplo, mover a docs |

### CODIGO DUPLICADO a consolidar:

#### 1. Validacion de password (3 archivos)
- `changePassword.js`
- `adminChangePassword.js`
- `resetPassword.js`

**Funciones duplicadas:**
- `validatePasswordStrength()`
- `calculatePasswordStrength()`
- `updatePasswordStrengthIndicator()`
- `PASSWORD_CONFIG`
- `COMMON_PASSWORDS`

**Recomendacion:** Crear `js/utils/passwordValidator.js` y reutilizar.

#### 2. Logout duplicado
- `componentes.js` (linea 106-124)
- `componenteAdmin.js` (linea 120-136)

**Recomendacion:** Usar `sessionManager.js` para logout centralizado.

#### 3. Importacion de Supabase repetida
Cada archivo repite:
```javascript
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
```

**Recomendacion:** Crear `js/supabaseClient.js` que exporte el cliente.

---

## 4. PROBLEMAS DE SEGURIDAD

### Console.logs con datos sensibles
| Archivo | Linea | Severidad |
|---------|-------|-----------|
| `consultasAlumn.js` | 162-165 | CRITICO - Expone emails, Zoom links |
| `historialCertificados.js` | 54, 148, 179, 183, 207, 213 | CRITICO |
| `authGuardAdmin.js` | 9, 15, 36, 39, 44, 53, 64, 70, 90 | MEDIO |

### Simulador de pagos
- `paymentSimulator.js` - Permite simular pagos sin validacion real
- **Recomendacion:** Solo habilitar en desarrollo

---

## 5. INCONSISTENCIAS DE NOMENCLATURA

### localStorage keys (mezcla espanol/ingles)
| Key | Idioma |
|-----|--------|
| `isLoggedIn` | Ingles |
| `usuarioActual` | Espanol |
| `ultimaTransaccion` | Espanol |
| `activeModuloId` | Ingles + Espanol |

**Recomendacion:** Estandarizar todo en ingles o espanol.

---

## 6. RESUMEN DE ACCIONES RECOMENDADAS

### Inmediatas:
1. [x] Bug fix: metadata del quiz (COMPLETADO)
2. [ ] Eliminar archivos inutiles (register.js, coursePreviewModal.js/css)
3. [ ] Remover console.logs con datos sensibles

### Corto plazo:
4. [ ] Consolidar validacion de password en modulo unico
5. [ ] Centralizar cliente de Supabase
6. [ ] Estandarizar nombres de localStorage

### Largo plazo:
7. [ ] Reorganizar carpetas por secciones
8. [ ] Implementar bundler (Vite/Webpack)
9. [ ] Agregar TypeScript para type safety
