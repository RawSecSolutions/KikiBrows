# 🔒 Documentación de Cambio de Contraseña - Prácticas Seguras

## Índice
1. [Implementación Actual](#implementación-actual)
2. [Características de Seguridad Implementadas](#características-de-seguridad-implementadas)
3. [Migración a Producción](#migración-a-producción)
4. [Mejores Prácticas OWASP](#mejores-prácticas-owasp)
5. [Flujo de Usuario](#flujo-de-usuario)
6. [Testing](#testing)

---

## Implementación Actual

### Archivos Modificados/Creados

```
✅ js/changePassword.js       - Módulo principal con validaciones
✅ account.html                - UI del formulario de cambio de contraseña
✅ js/accountEdit.js           - Actualizado para manejar vistas
✅ css/account.css             - Estilos del formulario
```

### Tecnología Actual
- **Frontend Only**: HTML + JavaScript Vanilla
- **Persistencia**: localStorage (navegador)
- **⚠️ NO USAR EN PRODUCCIÓN**: Las contraseñas se almacenan en texto plano

---

## Características de Seguridad Implementadas

### ✅ 1. Validación Robusta de Contraseñas

```javascript
Requisitos:
- Mínimo 8 caracteres (configurable hasta 128)
- Al menos 1 letra mayúscula (A-Z)
- Al menos 1 letra minúscula (a-z)
- Al menos 1 número (0-9)
- Al menos 1 carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)
- No permite contraseñas comunes (top 20)
- No permite secuencias repetitivas (aaa, 111)
```

### ✅ 2. Rate Limiting (Limitación de Intentos)

```javascript
Configuración:
- Máximo 5 intentos fallidos
- Bloqueo temporal de 15 minutos
- Contador de intentos restantes
- Mensaje al usuario con tiempo de desbloqueo
```

**Protege contra**: Ataques de fuerza bruta

### ✅ 3. Indicador de Fortaleza de Contraseña

```javascript
Niveles:
- Muy débil (0-30%): Rojo
- Débil (30-50%): Naranja
- Media (50-70%): Amarillo
- Fuerte (70-90%): Verde
- Muy fuerte (90-100%): Verde intenso

Factores evaluados:
- Longitud de la contraseña
- Variedad de caracteres
- Caracteres únicos
- Ausencia de repeticiones
```

### ✅ 4. Verificación de Contraseña Actual

- Requiere que el usuario ingrese su contraseña actual
- Previene cambios no autorizados

### ✅ 5. Confirmación de Nueva Contraseña

- Doble validación para evitar errores de tipeo
- Verificación de coincidencia antes del submit

### ✅ 6. Prevención de Reutilización

- Verifica que la nueva contraseña sea diferente a la actual

### ✅ 7. Toggle de Visibilidad

- Botones para mostrar/ocultar contraseñas
- Mejora UX sin comprometer seguridad

### ✅ 8. Logout Automático

- Cierra sesión después del cambio exitoso
- Redirige al login
- Obliga al usuario a autenticarse con la nueva contraseña

### ✅ 9. Mensajes de Error Descriptivos

- Feedback claro sobre errores de validación
- Lista de requisitos no cumplidos
- Alertas visuales con iconos

---

## Migración a Producción

### ⚠️ CRÍTICO: NO USAR LOCALSTORAGE PARA CONTRASEÑAS

La implementación actual usa `localStorage` para propósitos de demostración. **Esto es INSEGURO para producción**.

### 🏗️ Arquitectura Recomendada para Producción

```
┌─────────────────┐
│   Frontend      │
│  (React/Vue)    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   API Gateway   │
│  + Rate Limit   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │
│  (Node.js/etc)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │
│ (PostgreSQL)    │
└─────────────────┘
```

### 🔐 Backend Seguro - Checklist

#### 1. **Hash de Contraseñas**

```javascript
// ❌ NUNCA HACER ESTO
password: "MiContraseña123!"

// ✅ SIEMPRE HASHEAR
// Usar bcrypt (Node.js ejemplo)
const bcrypt = require('bcrypt');
const saltRounds = 12;

async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, saltRounds);
}

async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}
```

**Algoritmos recomendados:**
- **bcrypt** (recomendado, 12-14 rounds)
- **Argon2** (más moderno, ganador PHC)
- **PBKDF2** (estándar NIST)

#### 2. **Endpoint API Seguro**

```javascript
// POST /api/auth/change-password
// Express.js ejemplo

router.post('/change-password',
  isAuthenticated,           // Middleware de autenticación
  rateLimiter({              // Rate limiting server-side
    windowMs: 15 * 60 * 1000,
    max: 5
  }),
  validatePasswordStrength,  // Middleware de validación
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // 1. Verificar contraseña actual
      const user = await User.findById(userId);
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

      if (!isValid) {
        // Log intento fallido
        await SecurityLog.create({
          userId,
          event: 'password_change_failed',
          ip: req.ip,
          timestamp: new Date()
        });

        return res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      // 2. Verificar que nueva contraseña sea diferente
      const isSame = await bcrypt.compare(newPassword, user.passwordHash);
      if (isSame) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe ser diferente'
        });
      }

      // 3. Hashear nueva contraseña
      const newHash = await bcrypt.hash(newPassword, 12);

      // 4. Actualizar en base de datos
      await User.update(userId, {
        passwordHash: newHash,
        passwordChangedAt: new Date()
      });

      // 5. Invalidar sesiones activas
      await Session.invalidateAllForUser(userId);

      // 6. Log de éxito
      await SecurityLog.create({
        userId,
        event: 'password_changed',
        ip: req.ip,
        timestamp: new Date()
      });

      // 7. Enviar email de confirmación
      await sendPasswordChangeEmail(user.email);

      return res.json({
        success: true,
        message: 'Contraseña actualizada correctamente'
      });

    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);
```

#### 3. **Base de Datos Segura**

```sql
-- Schema de usuarios (PostgreSQL ejemplo)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- Nunca "password"
  password_changed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de logs de seguridad
CREATE TABLE security_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  event VARCHAR(100) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Índices para performance
CREATE INDEX idx_security_logs_user_event ON security_logs(user_id, event);
CREATE INDEX idx_security_logs_timestamp ON security_logs(timestamp);
```

#### 4. **HTTPS Obligatorio**

```javascript
// Express.js - Forzar HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.header('host')}${req.url}`);
  }
  next();
});
```

#### 5. **Seguridad de Headers**

```javascript
// Usar Helmet.js
const helmet = require('helmet');
app.use(helmet());

// Headers adicionales
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

#### 6. **Rate Limiting Server-Side**

```javascript
// Express Rate Limit
const rateLimit = require('express-rate-limit');

const passwordChangeLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos. Inténtalo de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  // Guardar en Redis para ambientes distribuidos
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:password-change:'
  })
});

app.use('/api/auth/change-password', passwordChangeLimit);
```

#### 7. **Validación Server-Side**

```javascript
// Joi ejemplo
const Joi = require('joi');

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
  .required()
  .messages({
    'string.pattern.base': 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales',
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'string.max': 'La contraseña no puede exceder 128 caracteres'
  });

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordSchema,
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
});

// Middleware
function validatePasswordStrength(req, res, next) {
  const { error } = changePasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
}
```

#### 8. **Email de Confirmación**

```javascript
// Nodemailer ejemplo
async function sendPasswordChangeEmail(userEmail) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: '"KikiBrows Security" <security@kikibrows.com>',
    to: userEmail,
    subject: '🔒 Contraseña Actualizada - KikiBrows',
    html: `
      <h2>Contraseña Actualizada</h2>
      <p>Tu contraseña ha sido cambiada exitosamente.</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
      <p>Si no realizaste este cambio, <a href="https://kikibrows.com/recover">recupera tu cuenta inmediatamente</a>.</p>
      <hr>
      <small>Este es un correo automático, no responder.</small>
    `
  };

  await transporter.sendMail(mailOptions);
}
```

---

## Mejores Prácticas OWASP

### 🛡️ OWASP Top 10 - Contraseñas

#### 1. **A02:2021 - Cryptographic Failures**
✅ **Solución**: Usar bcrypt/Argon2 para hashear contraseñas

#### 2. **A03:2021 - Injection**
✅ **Solución**: Usar prepared statements / ORMs

#### 3. **A04:2021 - Insecure Design**
✅ **Solución**: Rate limiting, validación multi-capa

#### 4. **A05:2021 - Security Misconfiguration**
✅ **Solución**: Headers de seguridad (Helmet.js)

#### 5. **A07:2021 - Identification and Authentication Failures**
✅ **Solución**:
- Verificar contraseña actual
- Logout automático después del cambio
- Multi-factor authentication (MFA) opcional

---

## Flujo de Usuario

### 🎯 Diagrama de Flujo

```
1. Usuario hace clic en "Cambiar Contraseña"
   ↓
2. Se muestra formulario con 3 campos:
   - Contraseña actual
   - Nueva contraseña (con indicador de fortaleza)
   - Confirmar nueva contraseña
   ↓
3. Usuario completa el formulario
   ↓
4. JavaScript valida en cliente:
   ✓ Todos los campos completos
   ✓ Nueva contraseña cumple requisitos
   ✓ Confirmación coincide
   ↓
5. Submit del formulario
   ↓
6. Se verifica:
   ✓ Contraseña actual correcta
   ✓ Nueva ≠ actual
   ✓ Rate limit no excedido
   ↓
7. [En producción] POST a /api/auth/change-password
   ↓
8. Backend:
   ✓ Autentica usuario
   ✓ Verifica contraseña actual (hash)
   ✓ Valida nueva contraseña
   ✓ Hashea nueva contraseña
   ✓ Actualiza DB
   ✓ Invalida sesiones
   ✓ Envía email
   ↓
9. Frontend:
   ✓ Muestra mensaje de éxito
   ✓ Espera 2 segundos
   ✓ Logout automático
   ✓ Redirige a login
   ↓
10. Usuario inicia sesión con nueva contraseña
```

---

## Testing

### 🧪 Casos de Prueba

#### 1. **Validación de Contraseña**

```javascript
// Test: Contraseña débil
Input: "abc123"
Expected: ❌ Error - "Debe contener al menos 8 caracteres"

// Test: Sin mayúsculas
Input: "abc123!@#"
Expected: ❌ Error - "Debe contener al menos una letra mayúscula"

// Test: Sin caracteres especiales
Input: "Abc12345"
Expected: ❌ Error - "Debe contener al menos un carácter especial"

// Test: Contraseña común
Input: "Password123!"
Expected: ❌ Error - "Esta contraseña es demasiado común"

// Test: Contraseña válida
Input: "MyS3cur3P@ssw0rd!"
Expected: ✅ Aceptada
```

#### 2. **Rate Limiting**

```javascript
// Test: Múltiples intentos fallidos
Intentos: 5 con contraseña incorrecta
Expected: Bloqueo por 15 minutos

// Test: Mensaje de intentos restantes
Intento 1 fallido: "Te quedan 4 intentos"
Intento 2 fallido: "Te quedan 3 intentos"
...
Intento 5 fallido: "Bloqueado por 15 minutos"
```

#### 3. **Validación de Confirmación**

```javascript
// Test: Contraseñas no coinciden
Nueva: "MyP@ssw0rd123"
Confirmar: "MyP@ssw0rd124"
Expected: ❌ Error - "Las contraseñas no coinciden"
```

#### 4. **Verificación de Contraseña Actual**

```javascript
// Test: Contraseña actual incorrecta
Expected: ❌ Error - "Contraseña actual incorrecta"
Expected: Contador de intentos decrementado
```

#### 5. **Prevención de Reutilización**

```javascript
// Test: Nueva = Actual
Actual: "OldP@ss123"
Nueva: "OldP@ss123"
Expected: ❌ Error - "La nueva contraseña debe ser diferente"
```

#### 6. **Indicador de Fortaleza**

```javascript
// Test: Progreso del indicador
Input: "a" → Muy débil (rojo)
Input: "abc123" → Débil (naranja)
Input: "Abc123!" → Media (amarillo)
Input: "MyP@ssw0rd" → Fuerte (verde)
Input: "MyC0mpl3x!P@ssw0rd" → Muy fuerte (verde intenso)
```

#### 7. **Toggle de Visibilidad**

```javascript
// Test: Mostrar/Ocultar contraseña
Click en icono de ojo:
- Type cambia de "password" a "text"
- Icono cambia de "fa-eye" a "fa-eye-slash"
```

#### 8. **Logout Automático**

```javascript
// Test: Después del cambio exitoso
Expected:
1. Mensaje de éxito mostrado
2. Espera de 2 segundos
3. localStorage.clear() de sesión
4. Redirect a login.html
```

### 🛠️ Herramientas de Testing Recomendadas

```bash
# Testing de Frontend
npm install --save-dev jest @testing-library/dom
npm install --save-dev cypress

# Testing de Backend
npm install --save-dev supertest mocha chai

# Testing de Seguridad
npm install --save-dev helmet-csp
npm audit
npm install --save-dev snyk
```

---

## 📚 Referencias y Recursos

### OWASP
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### Algoritmos de Hash
- [bcrypt npm](https://www.npmjs.com/package/bcrypt)
- [Argon2 npm](https://www.npmjs.com/package/argon2)

### Rate Limiting
- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)

### Email
- [Nodemailer](https://nodemailer.com/)

### Headers de Seguridad
- [Helmet.js](https://helmetjs.github.io/)

---

## 📝 Notas Finales

### ⚠️ Advertencias

1. **NO usar en producción sin backend**: La implementación actual es solo para demostración
2. **NO almacenar contraseñas en localStorage**: Siempre usar backend con DB
3. **NO enviar contraseñas sin HTTPS**: Requiere certificado SSL/TLS
4. **NO confiar solo en validación cliente**: Siempre validar en servidor

### ✅ Lo que SÍ hace esta implementación

- ✅ Validación robusta en cliente
- ✅ UX excelente con feedback visual
- ✅ Rate limiting básico
- ✅ Indicador de fortaleza
- ✅ Prevención de errores comunes
- ✅ Preparado para integración con backend

### 🚀 Próximos Pasos Recomendados

1. Implementar backend API REST
2. Configurar base de datos (PostgreSQL/MySQL)
3. Implementar autenticación JWT
4. Agregar MFA (Multi-Factor Authentication)
5. Configurar monitoreo de logs
6. Implementar notificaciones por email
7. Agregar historial de cambios de contraseña

---

**Desarrollado con prácticas de seguridad OWASP**
**Versión**: 1.0.0
**Fecha**: 2026-01-14
