/**
 * Manejador centralizado de errores
 * Proporciona funciones para crear y manejar errores de manera consistente
 */

const logger = require('./logger');

// Clase base para errores de la aplicación
class AppError extends Error {
    constructor(message, statusCode, errorCode = null) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true; // Indica si es un error operacional (esperado)
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// Errores específicos
class BadRequestError extends AppError {
    constructor(message, errorCode = 'BAD_REQUEST') {
        super(message, 400, errorCode);
    }
}

class UnauthorizedError extends AppError {
    constructor(message, errorCode = 'UNAUTHORIZED') {
        super(message, 401, errorCode);
    }
}

class ForbiddenError extends AppError {
    constructor(message, errorCode = 'FORBIDDEN') {
        super(message, 403, errorCode);
    }
}

class NotFoundError extends AppError {
    constructor(message, errorCode = 'NOT_FOUND') {
        super(message, 404, errorCode);
    }
}

class ConflictError extends AppError {
    constructor(message, errorCode = 'CONFLICT') {
        super(message, 409, errorCode);
    }
}

class InternalServerError extends AppError {
    constructor(message, errorCode = 'INTERNAL_SERVER_ERROR') {
        super(message, 500, errorCode);
    }
}

// Middleware para manejar errores
const errorMiddleware = (err, req, res, next) => {
    // Si el error no tiene statusCode, es un error no controlado
    if (!err.statusCode) {
        logger.logError('Error no controlado', err);
        err = new InternalServerError('Error interno del servidor');
    } else {
        // Loguear errores operacionales
        logger.error(`${err.statusCode} - ${err.message}`, {
            path: req.path,
            method: req.method,
            errorCode: err.errorCode,
            stack: err.stack
        });
    }

    // Enviar respuesta al cliente
    res.status(err.statusCode).json({
        success: false,
        message: err.message,
        errorCode: err.errorCode,
        // Solo incluir stack trace en desarrollo
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InternalServerError,
    errorMiddleware
}; 