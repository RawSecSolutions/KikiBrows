# Sistema de Confirmación de Pago - KIKIBROWS

## 📋 Descripción

Sistema completo de confirmación de pago que maneja tres estados diferentes después de una transacción:

1. **PAGADO** - Compra exitosa ✅
2. **PENDIENTE** - Pago en proceso ⏳
3. **RECHAZADO/ANULADO** - Compra fallida ❌

## 🎨 Diseño

El sistema respeta la identidad visual de KIKIBROWS:

- **Paleta de Colores:**
  - Verde oliva principal: `#8A835A`
  - Rosa empolvado: `#D8B6B1`
  - Beige claro: `#F0EAE0`

- **Tipografía:**
  - Títulos: Cormorant Garamond
  - Cuerpo: Lato

## 📁 Archivos Creados

### 1. HTML
- **`payment-confirmation.html`** - Página principal de confirmación
  - Muestra diferentes vistas según el estado de la transacción
  - Incluye información del curso y detalles de pago
  - Botones de acción según el estado

### 2. CSS
- **`css/paymentConfirmation.css`** - Estilos completos
  - Diseño responsive y minimalista
  - Animaciones suaves
  - Iconos diferenciados por estado
  - Paleta de colores KIKIBROWS

### 3. JavaScript
- **`js/paymentConfirmation.js`** - Lógica principal
  - Detecta estado de transacción
  - Carga información del curso
  - Genera boletas en PDF
  - Maneja navegación

- **`js/paymentSimulator.js`** - Simulador de pruebas
  - Funciones para simular diferentes estados
  - Útil para desarrollo y QA

### 4. Modificaciones
- **`js/coursePreview.js`** - Integración con flujo de pago
  - Función `procesarCompraExitosa()` actualizada
  - Genera ID de transacción y código de autorización
  - Guarda transacciones en historial
  - Redirige a página de confirmación

## 🚀 Flujo de Uso

### Flujo Normal (Producción)

1. Usuario hace clic en "Comprar Curso"
2. Se abre el portal de pago
3. Usuario selecciona método de pago (Webpay o Mercado Pago)
4. Sistema procesa el pago con la API correspondiente
5. Usuario es redirigido a `payment-confirmation.html` con parámetros
6. Sistema muestra el estado correspondiente

### Estados de Confirmación

#### ✅ PAGADO
**Muestra:**
- Icono de éxito (✓)
- "Compra realizada con éxito"
- Información del curso
- Fecha de compra
- Método de pago
- Código de autorización
- Monto pagado
- Botón "Descargar Boleta" (genera PDF)
- Botón "Ir a Mis Cursos"

#### ⏳ PENDIENTE
**Muestra:**
- Icono de reloj
- "Pago en proceso"
- Información del curso
- Mensaje de espera
- Botón "Volver al Inicio"
- Botón "Ver Historial de Compras"

#### ❌ RECHAZADO/ANULADO
**Muestra:**
- Icono de error (×)
- "Tu compra no se realizó correctamente"
- Posibles causas del rechazo
- Botón "Intentar Nuevamente"
- Botón "Volver al Catálogo de Cursos"
- Información de contacto con soporte

## 🧪 Cómo Probar

### Método 1: Simulación Automática (Actual)

El sistema actualmente simula compras exitosas. Para probar:

1. Navega a `course-preview.html?id=1`
2. Haz clic en "Comprar Curso"
3. Selecciona un método de pago
4. El sistema simulará un pago exitoso automáticamente

### Método 2: Usar el Simulador

Incluye el simulador en cualquier página HTML:

```html
<script src="js/cursosData.js"></script>
<script src="js/paymentSimulator.js"></script>
```

Luego abre la consola del navegador y ejecuta:

```javascript
// Simular pago exitoso
simularPagoExitoso(1, 'Webpay Plus');

// Simular pago pendiente
simularPagoPendiente(1, 'Mercado Pago');

// Simular pago rechazado
simularPagoRechazado(1, 'Webpay Plus');
```

### Método 3: Modificar localStorage Manualmente

```javascript
// En la consola del navegador
const transaccion = {
    estado: 'RECHAZADO', // Cambiar a: PAGADO, PENDIENTE, RECHAZADO
    cursoId: 1,
    cursoNombre: 'Microblading Básico',
    monto: 150000,
    metodoPago: 'Webpay Plus',
    fecha: new Date().toISOString(),
    codigoAutorizacion: '182930',
    transaccionId: 'TXN-123456',
    usuarioEmail: 'usuario@example.com',
    usuarioNombre: 'Usuario Test'
};

localStorage.setItem('ultimaTransaccion', JSON.stringify(transaccion));
window.location.href = 'payment-confirmation.html';
```

## 📄 Generación de Boletas

El sistema genera boletas en PDF automáticamente usando **jsPDF**:

### Contenido de la Boleta:
- Logo y encabezado KIKIBROWS
- Título: "Boleta de Compra"
- Detalles de la compra:
  - Nombre del curso
  - Fecha de compra
  - Método de pago
  - Código de autorización
  - ID de transacción
  - Total pagado
- Información del cliente
- Pie de página con información de contacto

### Cómo Descargar:
1. En la página de confirmación con estado "PAGADO"
2. Clic en el botón "Descargar Boleta"
3. Se descarga automáticamente: `Boleta_KIKIBROWS_[transaccionId].pdf`

## 🔗 Integración con APIs Reales

Para integrar con Transbank o Mercado Pago reales:

### 1. Transbank (Webpay Plus)

En `coursePreview.js`, descomentar y completar:

```javascript
fetch('/api/transbank/crear-transaccion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        cursoId: curso.id,
        monto: curso.precio,
        usuarioEmail: usuario.email
    })
})
.then(response => response.json())
.then(data => {
    // Redirigir a Webpay
    window.location.href = data.url + '?token_ws=' + data.token;
});
```

### 2. Mercado Pago

```javascript
fetch('/api/mercadopago/crear-preferencia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        cursoId: curso.id,
        titulo: curso.nombre,
        precio: curso.precio,
        usuarioEmail: usuario.email
    })
})
.then(response => response.json())
.then(data => {
    const mp = new MercadoPago('TU_PUBLIC_KEY');
    mp.checkout({
        preference: { id: data.preferenceId },
        render: { container: '#mercadoPagoCheckout' }
    });
});
```

### 3. Página de Retorno

Configurar en la API la URL de retorno:

```
success_url: https://kikibrows.com/payment-confirmation.html?status=approved&transactionId={id}
failure_url: https://kikibrows.com/payment-confirmation.html?status=rejected
pending_url: https://kikibrows.com/payment-confirmation.html?status=pending
```

## 📊 Almacenamiento de Transacciones

Las transacciones se guardan en dos lugares:

### 1. localStorage - Historial General
```javascript
// Clave: 'kikibrows_transacciones'
[
  {
    id: "TXN-123456",
    producto: "Microblading Básico",
    valor: 150000,
    usuario: "Usuario",
    fecha: "2025-01-23T...",
    email: "usuario@example.com",
    estado: "PAGADO",
    paymentStatus: "PAGADO",
    bank: "Webpay Plus",
    paymentMethod: "Débito/Crédito",
    authCode: "182930",
    gatewayToken: "TXN-123456"
  }
]
```

### 2. localStorage - Última Transacción
```javascript
// Clave: 'ultimaTransaccion'
// Se usa temporalmente para pasar datos a payment-confirmation.html
```

## 🎯 Características Principales

- ✅ Diseño responsive (mobile-first)
- ✅ Paleta de colores KIKIBROWS
- ✅ Tipografía elegante (Cormorant Garamond + Lato)
- ✅ Animaciones suaves
- ✅ Generación de boletas PDF
- ✅ Tres estados de transacción
- ✅ Historial de transacciones
- ✅ Simulador de pruebas
- ✅ Integración preparada para APIs reales
- ✅ Mensajes informativos por estado
- ✅ Navegación intuitiva

## 🐛 Solución de Problemas

### Problema: "No se encontró información de la transacción"
**Solución:** Asegúrate de que `localStorage.getItem('ultimaTransaccion')` contenga datos válidos.

### Problema: La boleta no se descarga
**Solución:** Verifica que jsPDF esté cargado correctamente en el HTML:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

### Problema: Los estilos no se aplican
**Solución:** Asegúrate de que todos los archivos CSS estén correctamente enlazados:
- `css/fonts.css`
- `css/layout.css`
- `css/paymentConfirmation.css`

## 📞 Soporte

Para cualquier duda o problema:
- Email: soporte@kikibrows.com
- Documentación adicional: Ver código comentado en los archivos JS

---

**Creado por:** Claude AI
**Fecha:** Enero 2025
**Versión:** 1.0
