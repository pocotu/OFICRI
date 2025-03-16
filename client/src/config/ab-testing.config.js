/**
 * Configuración de Pruebas A/B - OFICRI
 * Este archivo contiene la configuración para las pruebas A/B,
 * siguiendo los requisitos de seguridad ISO 27001 y la estructura actual del proyecto.
 */

export const AB_TESTING_CONFIG = {
    // Configuración de Grupos
    GROUPS: {
        CONTROL: {
            name: 'control',
            description: 'Versión actual del sistema',
            percentage: 50
        },
        VARIANT: {
            name: 'variant',
            description: 'Versión reestructurada',
            percentage: 50
        }
    },

    // Configuración de Usuarios
    USERS: {
        // Criterios de selección
        SELECTION_CRITERIA: {
            minExperience: 3, // meses
            activeStatus: true,
            roles: ['mesa_partes', 'area', 'admin']
        },
        // Tamaño de muestra
        SAMPLE_SIZE: {
            min: 20,
            max: 50
        }
    },

    // Configuración de Métricas
    METRICS: {
        // Métricas de Rendimiento
        PERFORMANCE: {
            pageLoadTime: {
                threshold: 2000, // ms
                weight: 0.3
            },
            responseTime: {
                threshold: 500, // ms
                weight: 0.3
            },
            resourceUsage: {
                threshold: 80, // %
                weight: 0.2
            },
            errorRate: {
                threshold: 1, // %
                weight: 0.2
            }
        },
        // Métricas de Usabilidad
        USABILITY: {
            taskCompletion: {
                threshold: 90, // %
                weight: 0.4
            },
            timeToTask: {
                threshold: 300, // segundos
                weight: 0.3
            },
            userSatisfaction: {
                threshold: 4, // de 5
                weight: 0.3
            }
        }
    },

    // Configuración de Monitoreo
    MONITORING: {
        ENABLED: true,
        PROVIDER: 'sentry',
        DSN: '${env.SENTRY_DSN}',
        SAMPLE_RATE: 1.0,
        TRACING: {
            ENABLED: true,
            SAMPLE_RATE: 1.0
        }
    },

    // Configuración de Reportes
    REPORTING: {
        FORMAT: 'pdf',
        INCLUDE_METRICS: true,
        INCLUDE_CHARTS: true,
        INCLUDE_RECOMMENDATIONS: true
    },

    // Configuración de Seguridad
    SECURITY: {
        // Políticas de acceso
        ACCESS_POLICY: {
            requireAuthentication: true,
            requireAuthorization: true,
            maxConcurrentSessions: 1
        },
        // Protección de datos
        DATA_PROTECTION: {
            anonymizeUserData: true,
            encryptTestResults: true,
            retentionPeriod: 30 // días
        }
    }
};

// Utilidades para pruebas A/B
export const ABTestingUtils = {
    /**
     * Valida la configuración de pruebas A/B
     */
    validateConfig() {
        const config = AB_TESTING_CONFIG;
        
        // Validar configuración de grupos
        if (config.GROUPS.CONTROL.percentage + config.GROUPS.VARIANT.percentage !== 100) {
            throw new Error('Los porcentajes de los grupos deben sumar 100%');
        }
        
        // Validar configuración de usuarios
        if (config.USERS.SAMPLE_SIZE.min > config.USERS.SAMPLE_SIZE.max) {
            throw new Error('El tamaño mínimo de muestra no puede ser mayor al máximo');
        }
        
        // Validar configuración de métricas
        this.validateMetricsConfig();
        
        console.log('Configuración de pruebas A/B validada correctamente');
    },

    /**
     * Valida la configuración de métricas
     */
    validateMetricsConfig() {
        const metrics = AB_TESTING_CONFIG.METRICS;
        
        // Validar pesos de métricas de rendimiento
        const performanceWeights = Object.values(metrics.PERFORMANCE)
            .map(m => m.weight)
            .reduce((a, b) => a + b, 0);
        
        if (Math.abs(performanceWeights - 1) > 0.01) {
            throw new Error('Los pesos de las métricas de rendimiento deben sumar 1');
        }
        
        // Validar pesos de métricas de usabilidad
        const usabilityWeights = Object.values(metrics.USABILITY)
            .map(m => m.weight)
            .reduce((a, b) => a + b, 0);
        
        if (Math.abs(usabilityWeights - 1) > 0.01) {
            throw new Error('Los pesos de las métricas de usabilidad deben sumar 1');
        }
    },

    /**
     * Calcula el tamaño de muestra necesario
     */
    calculateSampleSize(confidenceLevel = 0.95, marginOfError = 0.05) {
        // Implementar cálculo de tamaño de muestra
        return Math.ceil(AB_TESTING_CONFIG.USERS.SAMPLE_SIZE.min);
    },

    /**
     * Genera un ID único para la sesión de prueba
     */
    generateTestSessionId() {
        return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}; 