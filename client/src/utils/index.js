/**
 * Índice de utilidades
 * Centraliza la exportación de todas las utilidades para facilitar su importación
 */

// Importar los módulos
import * as errorHandlerModule from './errorHandler.js';
import * as securityMockModule from './securityMock.js';

// Exportar todo desde errorHandler
export * from './errorHandler.js';
export { default as errorHandler } from './errorHandler.js';

// Exportar securityMock para depuración
export * from './securityMock.js';
export { default as securityMock } from './securityMock.js';

// Objeto por defecto combinando ambos módulos
const utils = {
    // Propiedades de errorHandler
    handleError: errorHandlerModule.handleError,
    showErrorToUser: errorHandlerModule.showErrorToUser,
    createErrorHandler: errorHandlerModule.createErrorHandler,
    setLogLevel: errorHandlerModule.setLogLevel,
    LOG_LEVEL: errorHandlerModule.LOG_LEVEL,
    
    // Propiedades de securityMock
    log: securityMockModule.log,
    logSecurityEvent: securityMockModule.logSecurityEvent,
    SECURITY_EVENT: securityMockModule.SECURITY_EVENT
};

export default utils; 