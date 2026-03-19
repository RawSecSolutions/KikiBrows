// js/getnetService.js - Servicio de integración con Getnet Web Checkout
// API REST basada en la documentación de Getnet v2.3

const GETNET_CONFIG = {
    // Ambiente de PRUEBAS (cambiar a producción cuando se obtengan credenciales productivas)
    endpoint: 'https://checkout.test.getnet.cl',
    login: '7ffbb7bf1f7361b1200b2e8d74e1d76f',
    secretKey: 'SnZP3D63n3I9dH9O',

    // Ambiente de PRODUCCIÓN (descomentar y reemplazar con credenciales productivas)
    // endpoint: 'https://checkout.getnet.cl',
    // login: 'TU_LOGIN_PRODUCTIVO',
    // secretKey: 'TU_SECRETKEY_PRODUCTIVO',
};

/**
 * Genera la autenticación requerida por Getnet.
 * PasswordDigest = Base64(SHA-256(nonce + seed + secretkey))
 */
async function generarAuth() {
    const seed = new Date().toISOString(); // ISO 8601

    // Generar nonce aleatorio
    const nonceRaw = crypto.getRandomValues(new Uint8Array(16));
    const nonceStr = Array.from(nonceRaw).map(b => b.toString(16).padStart(2, '0')).join('');

    // nonce codificado en Base64 para enviar
    const nonceBase64 = btoa(nonceStr);

    // tranKey = Base64(SHA-256(nonceRaw + seed + secretKey))
    const encoder = new TextEncoder();
    const data = encoder.encode(nonceStr + seed + GETNET_CONFIG.secretKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);

    // Convert to Base64
    let binary = '';
    hashArray.forEach(byte => binary += String.fromCharCode(byte));
    const tranKey = btoa(binary);

    return {
        login: GETNET_CONFIG.login,
        tranKey: tranKey,
        nonce: nonceBase64,
        seed: seed
    };
}

export const GetnetService = {

    /**
     * Crear una sesión de pago (CreateRequest)
     * POST /api/session/
     *
     * @param {Object} params
     * @param {string} params.reference - Referencia única de la transacción
     * @param {string} params.description - Descripción del pago
     * @param {number} params.amount - Monto total en CLP
     * @param {string} params.returnUrl - URL de retorno después del pago
     * @param {Object} params.buyer - Datos del comprador
     * @param {string} params.ipAddress - IP del usuario
     * @param {string} params.userAgent - User agent del navegador
     * @param {number} [params.expirationMinutes=15] - Minutos antes de expirar la sesión
     */
    async createSession(params) {
        try {
            const auth = await generarAuth();

            // Fecha de expiración (15 min por defecto)
            const expiration = new Date();
            expiration.setMinutes(expiration.getMinutes() + (params.expirationMinutes || 15));

            const requestBody = {
                auth: auth,
                locale: 'es_CL',
                buyer: {
                    name: params.buyer?.name || 'Cliente',
                    surname: params.buyer?.surname || '',
                    email: params.buyer?.email || '',
                    document: params.buyer?.document || '',
                    documentType: params.buyer?.documentType || 'CLRUT',
                    mobile: params.buyer?.mobile || ''
                },
                payment: {
                    reference: params.reference,
                    description: params.description,
                    amount: {
                        currency: 'CLP',
                        total: params.amount
                    }
                },
                expiration: expiration.toISOString(),
                returnUrl: params.returnUrl,
                ipAddress: params.ipAddress || '127.0.0.1',
                userAgent: params.userAgent || navigator.userAgent,
                skipResult: false
            };

            const response = await fetch(`${GETNET_CONFIG.endpoint}/api/session/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data.status && data.status.status === 'OK') {
                return {
                    success: true,
                    requestId: data.requestId,
                    processUrl: data.processUrl
                };
            } else {
                return {
                    success: false,
                    error: data.status?.message || 'Error al crear sesión de pago'
                };
            }

        } catch (error) {
            console.error('Error creando sesión Getnet:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Consultar estado de una sesión de pago (GetRequestInformation)
     * POST /api/session/{requestId}
     *
     * @param {number|string} requestId - ID de la sesión
     * @returns {Object} Información completa de la sesión y transacción
     */
    async getSessionInfo(requestId) {
        try {
            const auth = await generarAuth();

            const response = await fetch(`${GETNET_CONFIG.endpoint}/api/session/${requestId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ auth })
            });

            const data = await response.json();

            return {
                success: true,
                data: data
            };

        } catch (error) {
            console.error('Error consultando sesión Getnet:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Reversar un pago aprobado (mismo día, antes de las 23:59)
     * POST /api/reverse
     *
     * @param {string} internalReference - Referencia interna de Getnet
     */
    async reversePayment(internalReference) {
        try {
            const auth = await generarAuth();

            const response = await fetch(`${GETNET_CONFIG.endpoint}/api/reverse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    auth,
                    internalReference: internalReference
                })
            });

            const data = await response.json();

            return {
                success: data.status?.status === 'APPROVED',
                data: data
            };

        } catch (error) {
            console.error('Error reversando pago Getnet:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Mapear estado de Getnet a estado interno del sistema
     */
    mapStatus(getnetStatus) {
        const statusMap = {
            'APPROVED': 'PAGADO',
            'REJECTED': 'RECHAZADO',
            'PENDING': 'PENDIENTE',
            'FAILED': 'RECHAZADO',
            'REFUNDED': 'REEMBOLSADO'
        };
        return statusMap[getnetStatus] || 'PENDIENTE';
    },

    /**
     * Obtener la configuración actual (para debug)
     */
    getConfig() {
        return {
            endpoint: GETNET_CONFIG.endpoint,
            isProduction: GETNET_CONFIG.endpoint === 'https://checkout.getnet.cl'
        };
    }
};

// Exponer globalmente
window.GetnetService = GetnetService;
