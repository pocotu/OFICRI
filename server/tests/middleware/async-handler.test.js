const { asyncHandler, asyncHandlers, dbErrorHandler, joiErrorHandler } = require('../../middleware/async-handler');

// Mock de logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Importar logger después del mock
const { logger } = require('../../utils/logger');

describe('Async Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Limpiar todos los mocks
    jest.clearAllMocks();
    
    // Configurar req, res y next para las pruebas
    req = {
      path: '/test',
      method: 'GET',
      ip: '127.0.0.1'
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();

    // Guardar el valor original de NODE_ENV
    process.env.ORIGINAL_NODE_ENV = process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restaurar NODE_ENV
    process.env.NODE_ENV = process.env.ORIGINAL_NODE_ENV;
    delete process.env.ORIGINAL_NODE_ENV;
  });

  describe('asyncHandler', () => {
    it('debe pasar el control a la siguiente función cuando no hay errores', async () => {
      // Crear una función ficticia que no arroja errores
      const fn = jest.fn().mockResolvedValue('ok');
      
      // Envolver la función con asyncHandler
      const wrappedFn = asyncHandler(fn);
      
      // Ejecutar la función envuelta
      await wrappedFn(req, res, next);
      
      // Verificar que la función se llamó con los argumentos correctos
      expect(fn).toHaveBeenCalledWith(req, res, next);
      
      // Verificar que no se llamó a res.status o res.json
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('debe manejar errores internos del servidor', async () => {
      // Crear una función que arroja un error genérico
      const error = new Error('Error interno');
      const fn = jest.fn().mockRejectedValue(error);
      
      // Envolver la función con asyncHandler
      const wrappedFn = asyncHandler(fn);
      
      // Ejecutar la función envuelta
      await wrappedFn(req, res, next);
      
      // Verificar que se estableció el estado HTTP correcto
      expect(res.status).toHaveBeenCalledWith(500);
      
      // Verificar la respuesta JSON
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor',
        error: undefined
      });
    });

    it('debe mostrar el mensaje de error en modo desarrollo', async () => {
      // Establecer NODE_ENV en development
      process.env.NODE_ENV = 'development';
      
      // Crear una función que arroja un error
      const error = new Error('Detalles del error');
      const fn = jest.fn().mockRejectedValue(error);
      
      // Envolver la función con asyncHandler
      const wrappedFn = asyncHandler(fn);
      
      // Ejecutar la función envuelta
      await wrappedFn(req, res, next);
      
      // Verificar la respuesta JSON con el mensaje de error
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor',
        error: 'Detalles del error'
      });
    });

    it('debe manejar errores de validación', async () => {
      // Crear un error de validación
      const error = new Error('Error de validación');
      error.name = 'ValidationError';
      const fn = jest.fn().mockRejectedValue(error);
      
      // Envolver la función con asyncHandler
      const wrappedFn = asyncHandler(fn);
      
      // Ejecutar la función envuelta
      await wrappedFn(req, res, next);
      
      // Verificar que se estableció el estado HTTP correcto
      expect(res.status).toHaveBeenCalledWith(400);
      
      // Verificar la respuesta JSON
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        error: undefined
      });
    });

    it('debe manejar errores de autenticación', async () => {
      // Crear un error de autenticación
      const error = new Error('No autorizado');
      error.name = 'UnauthorizedError';
      const fn = jest.fn().mockRejectedValue(error);
      
      // Envolver la función con asyncHandler
      const wrappedFn = asyncHandler(fn);
      
      // Ejecutar la función envuelta
      await wrappedFn(req, res, next);
      
      // Verificar que se estableció el estado HTTP correcto
      expect(res.status).toHaveBeenCalledWith(401);
      
      // Verificar la respuesta JSON
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No autorizado',
        error: undefined
      });
    });

    it('debe manejar errores de acceso denegado', async () => {
      // Crear un error de acceso denegado
      const error = new Error('Acceso denegado');
      error.name = 'ForbiddenError';
      const fn = jest.fn().mockRejectedValue(error);
      
      // Envolver la función con asyncHandler
      const wrappedFn = asyncHandler(fn);
      
      // Ejecutar la función envuelta
      await wrappedFn(req, res, next);
      
      // Verificar que se estableció el estado HTTP correcto
      expect(res.status).toHaveBeenCalledWith(403);
      
      // Verificar la respuesta JSON
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Acceso denegado',
        error: undefined
      });
    });

    it('debe manejar errores de recurso no encontrado', async () => {
      // Crear un error de recurso no encontrado
      const error = new Error('Recurso no encontrado');
      error.name = 'NotFoundError';
      const fn = jest.fn().mockRejectedValue(error);
      
      // Envolver la función con asyncHandler
      const wrappedFn = asyncHandler(fn);
      
      // Ejecutar la función envuelta
      await wrappedFn(req, res, next);
      
      // Verificar que se estableció el estado HTTP correcto
      expect(res.status).toHaveBeenCalledWith(404);
      
      // Verificar la respuesta JSON
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Recurso no encontrado',
        error: undefined
      });
    });

    it('debe manejar errores de conflicto', async () => {
      // Crear un error de conflicto
      const error = new Error('Conflicto de recursos');
      error.name = 'ConflictError';
      const fn = jest.fn().mockRejectedValue(error);
      
      // Envolver la función con asyncHandler
      const wrappedFn = asyncHandler(fn);
      
      // Ejecutar la función envuelta
      await wrappedFn(req, res, next);
      
      // Verificar que se estableció el estado HTTP correcto
      expect(res.status).toHaveBeenCalledWith(409);
      
      // Verificar la respuesta JSON
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Conflicto de recursos',
        error: undefined
      });
    });
  });

  describe('asyncHandlers', () => {
    it('debe envolver múltiples funciones', () => {
      // Crear dos funciones ficticias
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      
      // Envolver las funciones con asyncHandlers
      const wrapped = asyncHandlers([fn1, fn2]);
      
      // Verificar que el resultado es un array
      expect(Array.isArray(wrapped)).toBe(true);
      
      // Verificar que hay dos funciones
      expect(wrapped.length).toBe(2);
      
      // Verificar que son funciones
      wrapped.forEach(fn => {
        expect(typeof fn).toBe('function');
      });
    });
  });

  describe('dbErrorHandler', () => {
    it('debe manejar errores de duplicidad', () => {
      // Crear un error de duplicidad
      const error = new Error('Duplicidad');
      error.code = 'ER_DUP_ENTRY';
      
      // Ejecutar el middleware
      dbErrorHandler(error, req, res, next);
      
      // Verificar que se estableció el estado HTTP correcto
      expect(res.status).toHaveBeenCalledWith(409);
      
      // Verificar la respuesta JSON
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El registro ya existe'
      });
      
      // Verificar que no se llamó a next
      expect(next).not.toHaveBeenCalled();
    });

    it('debe manejar errores de referencia inexistente', () => {
      // Crear un error de referencia
      const error = new Error('Referencia inexistente');
      error.code = 'ER_NO_REFERENCED_ROW';
      
      // Ejecutar el middleware
      dbErrorHandler(error, req, res, next);
      
      // Verificar que se estableció el estado HTTP correcto
      expect(res.status).toHaveBeenCalledWith(400);
      
      // Verificar la respuesta JSON
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Referencia a registro inexistente'
      });
    });

    it('debe manejar errores de campo nulo', () => {
      // Crear un error de campo nulo
      const error = new Error('Campo nulo');
      error.code = 'ER_BAD_NULL_ERROR';
      
      // Ejecutar el middleware
      dbErrorHandler(error, req, res, next);
      
      // Verificar que se estableció el estado HTTP correcto
      expect(res.status).toHaveBeenCalledWith(400);
      
      // Verificar la respuesta JSON
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Campo requerido no proporcionado'
      });
    });

    it('debe pasar otros errores a la siguiente función', () => {
      // Crear un error genérico
      const error = new Error('Error desconocido');
      error.code = 'UNKNOWN_ERROR';
      
      // Ejecutar el middleware
      dbErrorHandler(error, req, res, next);
      
      // Verificar que se llamó a next con el error
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('joiErrorHandler', () => {
    it('debe manejar errores de validación de Joi', () => {
      // Crear un error de Joi
      const error = new Error('Error de validación');
      error.isJoi = true;
      error.details = [
        { path: ['campo1'], message: 'Campo1 es requerido' },
        { path: ['objeto', 'campo2'], message: 'Campo2 debe ser un número' }
      ];
      
      // Ejecutar el middleware
      joiErrorHandler(error, req, res, next);
      
      // Verificar que se estableció el estado HTTP correcto
      expect(res.status).toHaveBeenCalledWith(400);
      
      // Verificar la respuesta JSON
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: [
          { field: 'campo1', message: 'Campo1 es requerido' },
          { field: 'objeto.campo2', message: 'Campo2 debe ser un número' }
        ]
      });
      
      // Verificar que no se llamó a next
      expect(next).not.toHaveBeenCalled();
    });

    it('debe pasar otros errores a la siguiente función', () => {
      // Crear un error no relacionado con Joi
      const error = new Error('Otro error');
      
      // Ejecutar el middleware
      joiErrorHandler(error, req, res, next);
      
      // Verificar que se llamó a next con el error
      expect(next).toHaveBeenCalledWith(error);
      
      // Verificar que no se estableció un estado HTTP
      expect(res.status).not.toHaveBeenCalled();
    });
  });
}); 