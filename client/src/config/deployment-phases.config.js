/**
 * Configuración de Fases de Despliegue - OFICRI
 * Este archivo contiene la configuración para el despliegue progresivo,
 * siguiendo los requisitos de seguridad ISO 27001 y la estructura actual del proyecto.
 */

export const DEPLOYMENT_PHASES_CONFIG = {
    // Fases de Despliegue
    PHASES: {
        // Fase 1: Componentes Base
        BASE_COMPONENTS: {
            name: 'base_components',
            description: 'Despliegue de componentes base del sistema',
            order: 1,
            components: [
                'Header',
                'Sidebar',
                'UserProfile',
                'Layout'
            ],
            dependencies: [],
            rollback: true
        },
        // Fase 2: Módulos Principales
        MAIN_MODULES: {
            name: 'main_modules',
            description: 'Despliegue de módulos principales',
            order: 2,
            modules: [
                'auth',
                'user',
                'documents',
                'permissions'
            ],
            dependencies: ['base_components'],
            rollback: true
        },
        // Fase 3: Páginas y Rutas
        PAGES: {
            name: 'pages',
            description: 'Despliegue de páginas y rutas',
            order: 3,
            pages: [
                'auth',
                'admin',
                'mesaPartes',
                'area'
            ],
            dependencies: ['main_modules'],
            rollback: true
        },
        // Fase 4: Assets y Estilos
        ASSETS: {
            name: 'assets',
            description: 'Despliegue de assets y estilos',
            order: 4,
            assets: [
                'images',
                'styles',
                'icons',
                'fonts'
            ],
            dependencies: ['pages'],
            rollback: true
        }
    },

    // Configuración de Seguridad
    SECURITY: {
        // Políticas de acceso durante el despliegue
        ACCESS_POLICY: {
            requireAuthentication: true,
            requireAuthorization: true,
            maxConcurrentDeployments: 1
        },
        // Protección de datos
        DATA_PROTECTION: {
            backupBeforeDeploy: true,
            encryptBackups: true,
            retentionPeriod: 7 // días
        },
        // Monitoreo de seguridad
        MONITORING: {
            logSecurityEvents: true,
            alertOnSuspiciousActivity: true,
            trackAccessAttempts: true
        }
    },

    // Configuración de Rollback
    ROLLBACK: {
        ENABLED: true,
        TRIGGER_CONDITIONS: {
            errorRate: 5, // %
            responseTime: 2000, // ms
            failedTests: 3
        },
        PROCEDURE: {
            automatic: true,
            notifyAdmin: true,
            restoreBackup: true
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
    }
};

// Utilidades para el despliegue progresivo
export const DeploymentPhasesUtils = {
    /**
     * Valida la configuración de fases de despliegue
     */
    validateConfig() {
        const config = DEPLOYMENT_PHASES_CONFIG;
        
        // Validar orden de fases
        this.validatePhaseOrder();
        
        // Validar dependencias
        this.validateDependencies();
        
        // Validar configuración de seguridad
        this.validateSecurityConfig();
        
        console.log('Configuración de fases de despliegue validada correctamente');
    },

    /**
     * Valida el orden de las fases
     */
    validatePhaseOrder() {
        const phases = DEPLOYMENT_PHASES_CONFIG.PHASES;
        const orders = Object.values(phases).map(p => p.order);
        
        // Verificar que no hay órdenes duplicados
        if (new Set(orders).size !== orders.length) {
            throw new Error('Hay órdenes de fase duplicados');
        }
        
        // Verificar que los órdenes son consecutivos
        const sortedOrders = [...orders].sort((a, b) => a - b);
        for (let i = 0; i < sortedOrders.length - 1; i++) {
            if (sortedOrders[i + 1] - sortedOrders[i] !== 1) {
                throw new Error('Los órdenes de fase no son consecutivos');
            }
        }
    },

    /**
     * Valida las dependencias entre fases
     */
    validateDependencies() {
        const phases = DEPLOYMENT_PHASES_CONFIG.PHASES;
        
        for (const [phaseName, phase] of Object.entries(phases)) {
            for (const dependency of phase.dependencies) {
                if (!phases[dependency]) {
                    throw new Error(`La fase ${phaseName} depende de una fase inexistente: ${dependency}`);
                }
            }
        }
    },

    /**
     * Valida la configuración de seguridad
     */
    validateSecurityConfig() {
        const security = DEPLOYMENT_PHASES_CONFIG.SECURITY;
        
        // Validar políticas de acceso
        if (!security.ACCESS_POLICY.requireAuthentication) {
            throw new Error('Se requiere autenticación durante el despliegue');
        }
        
        // Validar protección de datos
        if (!security.DATA_PROTECTION.backupBeforeDeploy) {
            throw new Error('Se requiere backup antes del despliegue');
        }
    },

    /**
     * Obtiene el orden de despliegue de las fases
     */
    getDeploymentOrder() {
        const phases = DEPLOYMENT_PHASES_CONFIG.PHASES;
        return Object.values(phases)
            .sort((a, b) => a.order - b.order)
            .map(p => p.name);
    },

    /**
     * Verifica si se puede realizar rollback de una fase
     */
    canRollback(phaseName) {
        const phase = DEPLOYMENT_PHASES_CONFIG.PHASES[phaseName];
        return phase && phase.rollback;
    }
}; 