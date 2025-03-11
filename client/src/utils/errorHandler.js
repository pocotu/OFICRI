/**
 * Utilidades para el manejo centralizado de errores y logs
 * Este módulo proporciona funciones consistentes para el manejo de errores y logs en toda la aplicación
 */

// Niveles de log
export const LOG_LEVEL = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

// Nivel actual (puede cambiarse en tiempo de ejecución)
let currentLogLevel = LOG_LEVEL.INFO;

// Historial de errores para posible envío al servidor
const errorHistory = [];

/**
 * Establece el nivel de log actual
 * @param {number} level - Nivel de log (usar constantes LOG_LEVEL)
 */
export const setLogLevel = (level) => {
    currentLogLevel = level;
};

/**
 * Función para generar logs con formato consistente
 * @param {string} module - Nombre del módulo que genera el log
 * @param {string} message - Mensaje a loggear
 * @param {Object} data - Datos adicionales (opcional)
 * @param {number} level - Nivel de log (usar constantes LOG_LEVEL)
 */
export const log = (module, message, data = null, level = LOG_LEVEL.INFO) => {
    // Solo mostrar logs del nivel configurado o superior
    if (level < currentLogLevel) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}][${module}]`;
    
    switch (level) {
        case LOG_LEVEL.DEBUG:
            console.debug(`${prefix} ${message}`, data || '');
            break;
        case LOG_LEVEL.INFO:
            console.info(`${prefix} ${message}`, data || '');
            break;
        case LOG_LEVEL.WARN:
            console.warn(`${prefix} ${message}`, data || '');
            break;
        case LOG_LEVEL.ERROR:
            console.error(`${prefix} ${message}`, data || '');
            // Guardar en el historial para posible envío posterior
            errorHistory.push({
                timestamp,
                module,
                message,
                data,
                level: 'ERROR'
            });
            break;
    }
};

/**
 * Maneja un error de forma consistente
 * @param {string} module - Nombre del módulo donde ocurrió el error
 * @param {Error} error - Objeto de error
 * @param {string} context - Contexto donde ocurrió el error
 * @param {boolean} showToUser - Si se debe mostrar al usuario
 */
export const handleError = (module, error, context = '', showToUser = false) => {
    // Loggear el error
    log(
        module,
        `Error en ${context}: ${error.message}`,
        { stack: error.stack },
        LOG_LEVEL.ERROR
    );
    
    // Mostrar al usuario si es necesario
    if (showToUser) {
        showErrorToUser(error.message);
    }
    
    // Devolver false para facilitar el manejo en los llamadores
    return false;
};

/**
 * Muestra un error al usuario (usando SweetAlert2 si está disponible)
 * @param {string} message - Mensaje de error
 */
export const showErrorToUser = (message) => {
    // Usar SweetAlert2 si está disponible, o fallback a alert
    if (window.Swal) {
        window.Swal.fire({
            title: 'Error',
            text: message,
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    } else {
        alert(`Error: ${message}`);
    }
};

/**
 * Envía los errores acumulados al servidor
 * @param {string} endpoint - Endpoint para enviar los errores
 * @returns {Promise<boolean>} - true si se enviaron con éxito
 */
export const sendErrorsToServer = async (endpoint = '/api/logs') => {
    if (errorHistory.length === 0) return true;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(errorHistory)
        });
        
        if (response.ok) {
            // Limpiar errores enviados
            errorHistory.length = 0;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error al enviar logs al servidor:', error);
        return false;
    }
};

export default {
    LOG_LEVEL,
    setLogLevel,
    log,
    handleError,
    showErrorToUser,
    sendErrorsToServer
}; 