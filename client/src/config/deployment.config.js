/**
 * Configuración de Despliegue - OFICRI
 * Este archivo contiene la configuración para el despliegue del sistema,
 * siguiendo los requisitos de seguridad ISO 27001 y la estructura actual del proyecto.
 */

export const DEPLOYMENT_CONFIG = {
    // Configuración de Entornos
    ENVIRONMENTS: {
        DEVELOPMENT: {
            name: 'Desarrollo',
            apiUrl: 'http://localhost:3000/api',
            assetsUrl: 'http://localhost:3000/assets',
            debug: true,
            logLevel: 'debug'
        },
        STAGING: {
            name: 'Staging',
            apiUrl: 'https://staging.oficri.com/api',
            assetsUrl: 'https://staging.oficri.com/assets',
            debug: false,
            logLevel: 'info'
        },
        PRODUCTION: {
            name: 'Producción',
            apiUrl: 'https://oficri.com/api',
            assetsUrl: 'https://oficri.com/assets',
            debug: false,
            logLevel: 'error'
        }
    },

    // Configuración de Seguridad
    SECURITY: {
        // Políticas de contraseñas
        PASSWORD_POLICY: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecial: true,
            maxAgeDays: 90
        },
        // Configuración de sesiones
        SESSION: {
            timeout: 30, // minutos
            maxConcurrent: 1,
            secure: true,
            httpOnly: true
        },
        // Configuración de CORS
        CORS: {
            allowedOrigins: ['https://oficri.com', 'https://staging.oficri.com'],
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }
    },

    // Configuración de Caché
    CACHE: {
        ENABLED: true,
        TTL: 3600, // 1 hora en segundos
        MAX_SIZE: '100MB',
        STRATEGY: 'LRU'
    },

    // Configuración de Monitoreo
    MONITORING: {
        ENABLED: true,
        PROVIDER: 'sentry',
        SAMPLE_RATE: 0.1,
        TRACING: {
            ENABLED: true,
            SAMPLE_RATE: 0.1
        }
    },

    // Configuración de Optimización
    OPTIMIZATION: {
        // Compresión de assets
        COMPRESSION: {
            ENABLED: true,
            ALGORITHM: 'gzip',
            MIN_SIZE: 1024 // 1KB
        },
        // Minificación de código
        MINIFICATION: {
            ENABLED: true,
            CSS: true,
            JS: true,
            HTML: true
        },
        // Caché de navegador
        BROWSER_CACHE: {
            ENABLED: true,
            MAX_AGE: 31536000, // 1 año en segundos
            PUBLIC: true
        }
    }
};

// Utilidades para despliegue
export const DeploymentUtils = {
    /**
     * Obtiene la configuración del entorno actual
     */
    getEnvironmentConfig() {
        const env = process.env.NODE_ENV || 'development';
        return DEPLOYMENT_CONFIG.ENVIRONMENTS[env.toUpperCase()];
    },

    /**
     * Valida la configuración de seguridad
     */
    validateSecurityConfig() {
        const config = DEPLOYMENT_CONFIG.SECURITY;
        if (!config.PASSWORD_POLICY.minLength >= 8) {
            throw new Error('La longitud mínima de contraseña debe ser al menos 8 caracteres');
        }
        // Más validaciones...
    },

    /**
     * Configura el monitoreo según el entorno
     */
    setupMonitoring() {
        const env = this.getEnvironmentConfig();
        if (env.debug) {
            console.log('Monitoreo en modo debug');
        }
        // Configuración adicional...
    }
}; 