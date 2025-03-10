/**
 * Exportación centralizada de todas las utilidades
 * Este archivo facilita la importación de utilidades en otros archivos del proyecto
 * 
 * Ejemplo de uso:
 * const { logger, errorMiddleware, BadRequestError } = require('../utils/utilsExport');
 */

const logger = require('./logger');
const { 
    AppError, 
    BadRequestError, 
    UnauthorizedError, 
    ForbiddenError, 
    NotFoundError, 
    ConflictError, 
    InternalServerError, 
    errorMiddleware 
} = require('./errorHandler');

module.exports = {
    logger,
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InternalServerError,
    errorMiddleware
}; 