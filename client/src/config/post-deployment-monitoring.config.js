/**
 * Configuración de Monitoreo Post-Despliegue - OFICRI
 * Este archivo contiene la configuración para el monitoreo post-despliegue,
 * siguiendo los requisitos de seguridad ISO 27001 y la estructura actual del proyecto.
 */

export const POST_DEPLOYMENT_MONITORING_CONFIG = {
    // Configuración de Rendimiento
    PERFORMANCE: {
        // Umbrales de tiempo de carga
        PAGE_LOAD_THRESHOLDS: {
            critical: 5000, // ms
            warning: 3000,  // ms
            optimal: 1500   // ms
        },
        // Umbrales de tiempo de respuesta API
        API_RESPONSE_THRESHOLDS: {
            critical: 2000, // ms
            warning: 1000,  // ms
            optimal: 500    // ms
        },
        // Monitoreo de recursos
        RESOURCE_MONITORING: {
            memory: {
                warning: 80,  // %
                critical: 90  // %
            },
            cpu: {
                warning: 70,  // %
                critical: 85  // %
            },
            disk: {
                warning: 80,  // %
                critical: 90  // %
            }
        }
    },

    // Configuración de Seguridad
    SECURITY: {
        // Monitoreo de intentos de acceso
        ACCESS_MONITORING: {
            maxFailedAttempts: 5,
            lockoutDuration: 300000, // 5 minutos
            alertThreshold: 3
        },
        // Monitoreo de cambios de permisos
        PERMISSION_MONITORING: {
            logAllChanges: true,
            alertOnCriticalChanges: true,
            criticalPermissions: ['ADMIN', 'SUPERUSER']
        },
        // Monitoreo de actividad sospechosa
        SUSPICIOUS_ACTIVITY: {
            maxConcurrentSessions: 3,
            unusualAccessTimes: {
                start: '23:00',
                end: '05:00'
            },
            alertOnMultipleIPs: true
        }
    },

    // Configuración de Errores
    ERROR_MONITORING: {
        // Errores del cliente
        CLIENT_ERRORS: {
            logAllErrors: true,
            alertThreshold: 10, // errores por minuto
            ignorePatterns: [
                '404',
                'favicon.ico',
                'robots.txt'
            ]
        },
        // Errores de API
        API_ERRORS: {
            logAllErrors: true,
            alertThreshold: 5, // errores por minuto
            criticalEndpoints: [
                '/api/auth',
                '/api/documents',
                '/api/users'
            ]
        },
        // Errores de base de datos
        DATABASE_ERRORS: {
            logAllErrors: true,
            alertThreshold: 3, // errores por minuto
            criticalOperations: [
                'INSERT',
                'UPDATE',
                'DELETE'
            ]
        }
    },

    // Configuración de Uso
    USAGE_MONITORING: {
        // Monitoreo por rol
        ROLE_MONITORING: {
            trackActiveUsers: true,
            trackPermissions: true,
            alertOnUnusualActivity: true
        },
        // Monitoreo por módulo
        MODULE_MONITORING: {
            trackAccess: true,
            trackOperations: true,
            criticalModules: [
                'auth',
                'documents',
                'users'
            ]
        },
        // Patrones de uso
        USAGE_PATTERNS: {
            trackSessionDuration: true,
            trackFeatureUsage: true,
            trackNavigation: true
        }
    },

    // Configuración de Reportes
    REPORTING: {
        // Formato de reportes
        FORMAT: {
            type: 'pdf',
            includeCharts: true,
            includeTables: true
        },
        // Contenido de reportes
        CONTENT: {
            performance: true,
            security: true,
            errors: true,
            usage: true
        },
        // Programación de reportes
        SCHEDULE: {
            daily: true,
            weekly: true,
            monthly: true
        }
    },

    // Configuración de Alertas
    ALERTS: {
        // Canales de alerta
        CHANNELS: {
            email: true,
            console: true,
            log: true
        },
        // Niveles de alerta
        LEVELS: {
            critical: true,
            warning: true,
            info: false
        },
        // Umbrales de alerta
        THRESHOLDS: {
            performance: 80,  // %
            security: 5,      // eventos
            errors: 10,       // por minuto
            usage: 90         // %
        }
    }
};

// Utilidades para el monitoreo post-despliegue
export const PostDeploymentMonitoringUtils = {
    /**
     * Valida la configuración de monitoreo
     */
    validateConfig() {
        const config = POST_DEPLOYMENT_MONITORING_CONFIG;
        
        // Validar umbrales de rendimiento
        this.validatePerformanceThresholds();
        
        // Validar configuración de seguridad
        this.validateSecurityConfig();
        
        // Validar configuración de errores
        this.validateErrorConfig();
        
        console.log('Configuración de monitoreo validada correctamente');
    },

    /**
     * Valida los umbrales de rendimiento
     */
    validatePerformanceThresholds() {
        const thresholds = POST_DEPLOYMENT_MONITORING_CONFIG.PERFORMANCE;
        
        // Validar umbrales de tiempo de carga
        if (thresholds.PAGE_LOAD_THRESHOLDS.critical <= thresholds.PAGE_LOAD_THRESHOLDS.warning) {
            throw new Error('El umbral crítico de tiempo de carga debe ser mayor que el de advertencia');
        }
        
        // Validar umbrales de tiempo de respuesta API
        if (thresholds.API_RESPONSE_THRESHOLDS.critical <= thresholds.API_RESPONSE_THRESHOLDS.warning) {
            throw new Error('El umbral crítico de tiempo de respuesta API debe ser mayor que el de advertencia');
        }
    },

    /**
     * Valida la configuración de seguridad
     */
    validateSecurityConfig() {
        const security = POST_DEPLOYMENT_MONITORING_CONFIG.SECURITY;
        
        // Validar monitoreo de intentos de acceso
        if (security.ACCESS_MONITORING.maxFailedAttempts <= 0) {
            throw new Error('El número máximo de intentos fallidos debe ser mayor que 0');
        }
        
        // Validar duración de bloqueo
        if (security.ACCESS_MONITORING.lockoutDuration <= 0) {
            throw new Error('La duración del bloqueo debe ser mayor que 0');
        }
    },

    /**
     * Valida la configuración de errores
     */
    validateErrorConfig() {
        const errors = POST_DEPLOYMENT_MONITORING_CONFIG.ERROR_MONITORING;
        
        // Validar umbrales de alerta
        if (errors.CLIENT_ERRORS.alertThreshold <= 0) {
            throw new Error('El umbral de alerta de errores del cliente debe ser mayor que 0');
        }
        
        if (errors.API_ERRORS.alertThreshold <= 0) {
            throw new Error('El umbral de alerta de errores de API debe ser mayor que 0');
        }
    },

    /**
     * Obtiene los umbrales de rendimiento para un tipo específico
     */
    getPerformanceThresholds(type) {
        const thresholds = POST_DEPLOYMENT_MONITORING_CONFIG.PERFORMANCE;
        return thresholds[type.toUpperCase() + '_THRESHOLDS'];
    },

    /**
     * Verifica si un valor excede los umbrales de rendimiento
     */
    checkPerformanceThresholds(type, value) {
        const thresholds = this.getPerformanceThresholds(type);
        
        if (value >= thresholds.critical) {
            return 'critical';
        } else if (value >= thresholds.warning) {
            return 'warning';
        }
        
        return 'optimal';
    }
}; 