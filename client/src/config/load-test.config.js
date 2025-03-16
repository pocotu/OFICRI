/**
 * Configuración de Pruebas de Carga - OFICRI
 * Este archivo contiene la configuración para las pruebas de carga del sistema,
 * siguiendo los requisitos de seguridad ISO 27001 y la estructura actual del proyecto.
 */

export const LOAD_TEST_CONFIG = {
    // Configuración de Escenarios
    SCENARIOS: {
        LOGIN: {
            name: 'Login',
            weight: 1,
            requests: [
                {
                    method: 'POST',
                    path: '/api/auth/login',
                    body: {
                        username: '${username}',
                        password: '${password}'
                    }
                }
            ]
        },
        DOCUMENT_LIST: {
            name: 'Lista de Documentos',
            weight: 3,
            requests: [
                {
                    method: 'GET',
                    path: '/api/documents',
                    headers: {
                        'Authorization': 'Bearer ${token}'
                    }
                }
            ]
        },
        DOCUMENT_CREATE: {
            name: 'Crear Documento',
            weight: 2,
            requests: [
                {
                    method: 'POST',
                    path: '/api/documents',
                    headers: {
                        'Authorization': 'Bearer ${token}'
                    },
                    body: {
                        title: 'Documento de prueba ${timestamp}',
                        type: 'interno',
                        content: 'Contenido de prueba'
                    }
                }
            ]
        }
    },

    // Configuración de Usuarios
    USERS: {
        MESA_PARTES: {
            username: 'mesa_partes_test',
            password: '${env.MESA_PARTES_PASSWORD}',
            role: 'MESA_PARTES'
        },
        AREA: {
            username: 'area_test',
            password: '${env.AREA_PASSWORD}',
            role: 'AREA'
        },
        ADMIN: {
            username: 'admin_test',
            password: '${env.ADMIN_PASSWORD}',
            role: 'ADMIN'
        }
    },

    // Configuración de Carga
    LOAD: {
        VUS: 50, // Usuarios virtuales simultáneos
        DURATION: '5m', // Duración de la prueba
        RAMP_UP: '1m', // Tiempo de incremento gradual
        RAMP_DOWN: '1m' // Tiempo de disminución gradual
    },

    // Umbrales de Rendimiento
    THRESHOLDS: {
        HTTP_REQ_DURATION: ['p(95)<500'], // 95% de las peticiones deben completarse en menos de 500ms
        HTTP_REQ_FAILED: ['rate<0.1'], // Menos del 10% de fallos
        ITERATION_DURATION: ['p(95)<2000'] // 95% de las iteraciones deben completarse en menos de 2s
    },

    // Configuración de Monitoreo
    MONITORING: {
        ENABLED: true,
        METRICS: ['http_req_duration', 'http_req_failed', 'iterations'],
        LOG_LEVEL: 'info'
    }
};

// Utilidades para pruebas de carga
export const LoadTestUtils = {
    /**
     * Genera datos de prueba para documentos
     */
    generateTestData() {
        return {
            timestamp: new Date().getTime(),
            randomString: Math.random().toString(36).substring(7)
        };
    },

    /**
     * Valida la respuesta de una petición
     */
    validateResponse(response) {
        if (response.status !== 200) {
            console.error(`Error en petición: ${response.status}`);
            return false;
        }
        return true;
    },

    /**
     * Limpia datos de prueba después de la ejecución
     */
    cleanupTestData() {
        // Implementar limpieza de datos de prueba
    }
}; 