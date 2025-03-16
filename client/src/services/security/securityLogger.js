/**
 * Servicio de Logging de Seguridad
 * Implementa el registro de eventos de seguridad según ISO 27001
 */

export class SecurityLogger {
    constructor() {
        this.logLevels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        };

        this.currentLevel = this.logLevels.INFO;
        this.maxLogSize = 1000; // Máximo número de eventos a mantener
        this.logs = [];
    }

    /**
     * Registra un evento de seguridad
     * @param {string} eventType - Tipo de evento
     * @param {Object} data - Datos del evento
     * @param {number} level - Nivel de log (opcional)
     */
    logSecurityEvent(eventType, data = {}, level = this.logLevels.INFO) {
        try {
            // Verificar nivel de log
            if (level < this.currentLevel) {
                return;
            }

            // Crear entrada de log
            const logEntry = {
                timestamp: new Date().toISOString(),
                eventType,
                data: this.sanitizeLogData(data),
                level: this.getLevelName(level),
                ip: this.getClientIP(),
                userAgent: navigator.userAgent
            };

            // Agregar al array de logs
            this.logs.push(logEntry);

            // Mantener tamaño máximo
            if (this.logs.length > this.maxLogSize) {
                this.logs.shift();
            }

            // Enviar al servidor si es un evento importante
            if (level >= this.logLevels.WARN) {
                this.sendToServer(logEntry);
            }

            // Registrar en consola en desarrollo
            if (process.env.NODE_ENV === 'development') {
                console.log(`[SECURITY] ${eventType}:`, logEntry);
            }
        } catch (error) {
            console.error('Error al registrar evento de seguridad:', error);
        }
    }

    /**
     * Sanitiza datos para el log
     * @param {Object} data - Datos a sanitizar
     * @returns {Object}
     */
    sanitizeLogData(data) {
        const sanitized = { ...data };

        // Remover datos sensibles
        if (sanitized.password) {
            sanitized.password = '[REDACTED]';
        }

        if (sanitized.token) {
            sanitized.token = '[REDACTED]';
        }

        // Limitar profundidad de objetos
        return this.limitObjectDepth(sanitized, 3);
    }

    /**
     * Limita la profundidad de un objeto
     * @param {Object} obj - Objeto a limitar
     * @param {number} maxDepth - Profundidad máxima
     * @param {number} currentDepth - Profundidad actual
     * @returns {Object}
     */
    limitObjectDepth(obj, maxDepth, currentDepth = 0) {
        if (currentDepth >= maxDepth) {
            return '[MAX_DEPTH_REACHED]';
        }

        const limited = {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                limited[key] = this.limitObjectDepth(value, maxDepth, currentDepth + 1);
            } else {
                limited[key] = value;
            }
        }

        return limited;
    }

    /**
     * Obtiene el nombre del nivel de log
     * @param {number} level - Nivel numérico
     * @returns {string}
     */
    getLevelName(level) {
        for (const [name, value] of Object.entries(this.logLevels)) {
            if (value === level) {
                return name;
            }
        }
        return 'UNKNOWN';
    }

    /**
     * Obtiene la IP del cliente
     * @returns {string}
     */
    getClientIP() {
        return window.location.hostname || 'unknown';
    }

    /**
     * Envía el log al servidor
     * @param {Object} logEntry - Entrada de log
     */
    async sendToServer(logEntry) {
        try {
            const response = await fetch('/api/security/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logEntry)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error al enviar log al servidor:', error);
        }
    }

    /**
     * Obtiene todos los logs
     * @returns {Array}
     */
    getLogs() {
        return [...this.logs];
    }

    /**
     * Limpia los logs
     */
    clearLogs() {
        this.logs = [];
    }

    /**
     * Establece el nivel de log
     * @param {number} level - Nuevo nivel
     */
    setLogLevel(level) {
        if (Object.values(this.logLevels).includes(level)) {
            this.currentLevel = level;
        }
    }
}

// Exportar instancia única
export const securityLogger = new SecurityLogger(); 