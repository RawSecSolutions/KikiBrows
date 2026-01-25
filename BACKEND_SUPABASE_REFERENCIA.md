# Referencia: Métodos a Implementar con Supabase

> **Propósito de este archivo**: Lista de todos los métodos que el frontend necesita.
> Usa esto como checklist cuando vayas creando tablas y funciones en Supabase.

---

## Archivos JS que necesitan conexión a Supabase

| Archivo | Usa métodos de |
|---------|----------------|
| `claseAlumn.js` | Cursos, Módulos, Clases, Progreso, Quizzes, Entregas, Certificados |
| `cursosAlumn.js` | Cursos adquiridos, Progreso |
| `coursePreview.js` | Cursos, Módulos, Clases |
| `renderCursosLanding.js` | Cursos publicados |
| `historialCertificados.js` | Certificados |
| `paymentConfirmation.js` | Cursos (para mostrar nombre) |
| `previsualizaCurso.js` | Cursos, Módulos, Clases |
| `previewCursoCliente.js` | Cursos, Módulos, Clases |

---

## Tablas sugeridas en Supabase

```
cursos
├── id (uuid, PK)
├── nombre (text)
├── descripcion (text)
├── precio (integer)
├── portada (text) -- URL de Storage
├── estado ('borrador' | 'publicado')
├── carrusel (boolean)
├── carrusel_posicion (integer)
├── duracion_acceso (integer) -- días
├── created_at (timestamp)

modulos
├── id (uuid, PK)
├── curso_id (uuid, FK -> cursos)
├── nombre (text)
├── orden (integer)

clases
├── id (uuid, PK)
├── modulo_id (uuid, FK -> modulos)
├── nombre (text)
├── tipo ('video' | 'texto' | 'pdf' | 'quiz' | 'entrega')
├── duracion (integer) -- minutos
├── contenido (jsonb) -- video_url, texto_html, quiz_data, etc.
├── orden (integer)

cursos_adquiridos
├── id (uuid, PK)
├── user_id (uuid, FK -> auth.users)
├── curso_id (uuid, FK -> cursos)
├── fecha_compra (timestamp)
├── fecha_expiracion (timestamp)

progreso_clases
├── id (uuid, PK)
├── user_id (uuid, FK -> auth.users)
├── curso_id (uuid, FK)
├── modulo_id (uuid, FK)
├── clase_id (uuid, FK)
├── completado (boolean)
├── fecha_completado (timestamp)

quiz_intentos
├── id (uuid, PK)
├── user_id (uuid, FK)
├── clase_id (uuid, FK)
├── respuestas (jsonb)
├── puntaje (integer)
├── aprobado (boolean)
├── fecha (timestamp)

entregas
├── id (uuid, PK)
├── user_id (uuid, FK)
├── clase_id (uuid, FK)
├── archivo_url (text) -- Storage
├── estado ('pendiente' | 'aprobada' | 'rechazada')
├── feedback (text)
├── puntaje (integer)
├── fecha (timestamp)

certificados
├── id (uuid, PK)
├── user_id (uuid, FK)
├── curso_id (uuid, FK)
├── codigo (text) -- KB-2025-001-001
├── fecha_emision (timestamp)

transacciones
├── id (uuid, PK)
├── user_id (uuid, FK)
├── curso_id (uuid, FK)
├── monto (integer)
├── metodo_pago (text)
├── estado ('PAGADO' | 'PENDIENTE' | 'RECHAZADO')
├── codigo_autorizacion (text)
├── fecha (timestamp)
```

---

## Métodos requeridos por el Frontend

### CURSOS
```javascript
// Obtener curso por ID
const { data } = await supabase.from('cursos').select('*').eq('id', cursoId).single();

// Obtener cursos publicados
const { data } = await supabase.from('cursos').select('*').eq('estado', 'publicado');

// Obtener cursos para carrusel
const { data } = await supabase.from('cursos').select('*').eq('carrusel', true).order('carrusel_posicion');
```

### MÓDULOS
```javascript
// Obtener módulos de un curso
const { data } = await supabase.from('modulos').select('*').eq('curso_id', cursoId).order('orden');
```

### CLASES
```javascript
// Obtener clases de un módulo
const { data } = await supabase.from('clases').select('*').eq('modulo_id', moduloId).order('orden');
```

### CURSOS ADQUIRIDOS
```javascript
// Obtener cursos del usuario actual
const { data: { user } } = await supabase.auth.getUser();
const { data } = await supabase
    .from('cursos_adquiridos')
    .select('*, curso:cursos(*)')
    .eq('user_id', user.id);
```

### PROGRESO
```javascript
// Marcar clase completada
await supabase.from('progreso_clases').upsert({
    user_id, curso_id, modulo_id, clase_id,
    completado: true,
    fecha_completado: new Date().toISOString()
});

// Obtener progreso de un curso
const { data } = await supabase
    .from('progreso_clases')
    .select('*')
    .eq('user_id', userId)
    .eq('curso_id', cursoId);
```

### QUIZZES
```javascript
// Guardar intento
await supabase.from('quiz_intentos').insert({
    user_id, clase_id, respuestas, puntaje, aprobado, fecha: new Date().toISOString()
});

// Obtener intentos
const { data } = await supabase.from('quiz_intentos').select('*').eq('clase_id', claseId).eq('user_id', userId);
```

### ENTREGAS
```javascript
// Subir archivo a Storage
const { data: uploadData } = await supabase.storage
    .from('entregas')
    .upload(`${userId}/${claseId}/${filename}`, file);

// Guardar registro
await supabase.from('entregas').insert({
    user_id, clase_id, archivo_url: uploadData.path, estado: 'pendiente'
});
```

### CERTIFICADOS
```javascript
// Verificar si puede obtener certificado (100% progreso + entregas aprobadas)
// Esto puede ser un RPC en Supabase

// Registrar certificado
await supabase.from('certificados').insert({
    user_id, curso_id, codigo: `KB-2025-${cursoId}-${odth}`, fecha_emision: new Date().toISOString()
});
```

---

## Funciones de utilidad (no necesitan Supabase)

```javascript
// Formatear duración
function formatearDuracion(minutos) {
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
}

// Formatear precio CLP
function formatearPrecio(precio) {
    return `$${precio.toLocaleString('es-CL')} CLP`;
}
```

---

## Storage Buckets necesarios

```
cursos-portadas/   <- Imágenes de portada
cursos-videos/     <- Videos de clases
entregas/          <- Videos/archivos de estudiantes
```

---

## RLS (Row Level Security) sugerido

```sql
-- Ejemplo: Solo ver cursos adquiridos propios
CREATE POLICY "Users can view own purchases"
ON cursos_adquiridos FOR SELECT
USING (auth.uid() = user_id);

-- Ejemplo: Solo ver progreso propio
CREATE POLICY "Users can view own progress"
ON progreso_clases FOR SELECT
USING (auth.uid() = user_id);
```
