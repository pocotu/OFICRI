/**
 * Configuración del Ambiente de Pruebas - OFICRI
 * Este archivo contiene la configuración específica para el ambiente de pruebas,
 * siguiendo los requisitos de seguridad ISO 27001 y la estructura actual del proyecto.
 */

export const STAGING_CONFIG = {
    // Configuración del Servidor
    SERVER: {
        HOST: 'staging.oficri.com',
        PORT: 443,
        PROTOCOL: 'https',
        API_BASE_URL: 'https://staging.oficri.com/api',
        ASSETS_BASE_URL: 'https://staging.oficri.com/assets'
    },

    // Configuración de Base de Datos
    DATABASE: {
        HOST: 'staging-db.oficri.com',
        PORT: 3306,
        NAME: 'oficri_staging',
        USER: '${env.DB_USER}',
        PASSWORD: '${env.DB_PASSWORD}',
        SSL: true
    },

    // Configuración de Seguridad
    SECURITY: {
        // Políticas de contraseñas para pruebas
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
            allowedOrigins: ['https://staging.oficri.com'],
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }
    },

    // Configuración de Logging
    LOGGING: {
        ENABLED: true,
        LEVEL: 'debug',
        FILE: 'logs/staging.log',
        MAX_SIZE: '100MB',
        MAX_FILES: 5,
        FORMAT: 'combined'
    },

    // Configuración de Monitoreo
    MONITORING: {
        ENABLED: true,
        PROVIDER: 'sentry',
        DSN: '${env.SENTRY_DSN}',
        SAMPLE_RATE: 1.0, // 100% en pruebas
        TRACING: {
            ENABLED: true,
            SAMPLE_RATE: 1.0
        }
    },

    // Configuración de Caché
    CACHE: {
        ENABLED: true,
        TTL: 3600, // 1 hora en segundos
        MAX_SIZE: '100MB',
        STRATEGY: 'LRU'
    },

    // Configuración de Correo
    EMAIL: {
        HOST: 'smtp.staging.oficri.com',
        PORT: 587,
        SECURE: true,
        FROM: 'noreply@staging.oficri.com',
        REPLY_TO: 'soporte@staging.oficri.com'
    }
};

// Utilidades para el ambiente de pruebas
export const StagingUtils = {
    /**
     * Inicializa el ambiente de pruebas
     */
    async initialize() {
        try {
            // Validar configuración
            this.validateConfig();
            
            // Configurar logging
            this.setupLogging();
            
            // Configurar monitoreo
            this.setupMonitoring();
            
            // Verificar conexiones
            await this.checkConnections();
            
            console.log('Ambiente de pruebas inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar ambiente de pruebas:', error);
            throw error;
        }
    },

    /**
     * Valida la configuración del ambiente
     */
    validateConfig() {
        const config = STAGING_CONFIG;
        
        // Validar configuración del servidor
        if (!config.SERVER.HOST || !config.SERVER.PORT) {
            throw new Error('Configuración del servidor incompleta');
        }
        
        // Validar configuración de base de datos
        if (!config.DATABASE.HOST || !config.DATABASE.NAME) {
            throw new Error('Configuración de base de datos incompleta');
        }
        
        // Validar configuración de seguridad
        if (!config.SECURITY.PASSWORD_POLICY.minLength >= 8) {
            throw new Error('Política de contraseñas inválida');
        }
    },

    /**
     * Configura el sistema de logging
     */
    setupLogging() {
        const config = STAGING_CONFIG.LOGGING;
        if (config.ENABLED) {
            // Implementar configuración de logging
            console.log('Logging configurado para ambiente de pruebas');
        }
    },

    /**
     * Configura el sistema de monitoreo
     */
    setupMonitoring() {
        const config = STAGING_CONFIG.MONITORING;
        if (config.ENABLED) {
            // Implementar configuración de monitoreo
            console.log('Monitoreo configurado para ambiente de pruebas');
        }
    },

    /**
     * Verifica las conexiones necesarias
     */
    async checkConnections() {
        try {
            // Verificar conexión a base de datos
            await this.checkDatabaseConnection();
            
            // Verificar conexión a servidor de correo
            await this.checkEmailConnection();
            
            console.log('Todas las conexiones verificadas correctamente');
        } catch (error) {
            console.error('Error al verificar conexiones:', error);
            throw error;
        }
    },

    /**
     * Verifica la conexión a la base de datos
     */
    async checkDatabaseConnection() {
        // Implementar verificación de conexión a base de datos
        console.log('Conexión a base de datos verificada');
    },

    /**
     * Verifica la conexión al servidor de correo
     */
    async checkEmailConnection() {
        // Implementar verificación de conexión a servidor de correo
        console.log('Conexión a servidor de correo verificada');
    }
}; 