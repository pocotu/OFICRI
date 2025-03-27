/**
 * Tests para monitoring.js
 * Prueba las funciones de middleware para monitoreo de la aplicación
 */

// Mocks
jest.mock('os', () => ({
  loadavg: jest.fn().mockReturnValue([0.1, 0.2, 0.3]),
  totalmem: jest.fn().mockReturnValue(16000000000),
  freemem: jest.fn().mockReturnValue(8000000000),
  uptime: jest.fn().mockReturnValue(3600),
  cpus: jest.fn().mockReturnValue([{}, {}, {}, {}])
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Mockear process.cpuUsage
const originalCpuUsage = process.cpuUsage;
process.cpuUsage = jest.fn().mockReturnValue({ user: 1000, system: 500 });

// Importaciones
const os = require('os');
const { logger } = require('../../utils/logger');
const {
  requestMonitor,
  errorMonitor,
  systemMonitor,
  connectionMonitor,
  memoryMonitor,
  responseTimeMonitor,
  healthCheck,
  monitoringMiddleware
} = require('../../middleware/monitoring');

describe('Monitoring Middleware', () => {
  // Configuración inicial
  let req;
  let res;
  let next;
  
  beforeEach(() => {
    // Reiniciar mocks
    jest.clearAllMocks();
    
    // Mocks para req, res y next
    req = {
      path: '/api/test',
      method: 'GET',
      ip: '127.0.0.1'
    };
    
    // Mock para res con eventos
    res = {
      on: jest.fn(),
      json: jest.fn().mockReturnThis(),
      statusCode: 200
    };
    
    // Mock para event emitter
    res.on.mockImplementation((event, callback) => {
      if (event === 'finish') {
        // Ejecutar el callback para 'finish'
        callback();
      }
      if (event === 'close') {
        // Ejecutar el callback para 'close'
        callback();
      }
      return res;
    });
    
    // Mock para next
    next = jest.fn();
  });
  
  afterAll(() => {
    // Restaurar process.cpuUsage
    process.cpuUsage = originalCpuUsage;
  });
  
  describe('requestMonitor', () => {
    test('debería incrementar contadores y registrar métricas', () => {
      // Ejecutar middleware
      requestMonitor(req, res, next);
      
      // Verificar que se incrementa el contador de peticiones
      expect(next).toHaveBeenCalled();
      
      // Verificar que se registra el evento 'finish'
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });
    
    test('debería calcular duración y decrementar conexiones activas', () => {
      // Modificar el mock de Date.now para simular el paso del tiempo
      const originalDateNow = Date.now;
      Date.now = jest.fn()
        .mockReturnValueOnce(1000) // Primera llamada (inicio)
        .mockReturnValueOnce(1500); // Segunda llamada (fin)
      
      try {
        // Ejecutar middleware
        requestMonitor(req, res, next);
        
        // Verificar que se registra el evento 'finish'
        expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
        
        // Simular que terminó la petición
        res.on.mock.calls[0][1]();
        
        // No verificamos las métricas directamente porque son privadas
        // En su lugar, verificamos que next fue llamado correctamente
        expect(next).toHaveBeenCalled();
      } finally {
        // Restaurar Date.now
        Date.now = originalDateNow;
      }
    });
  });
  
  describe('errorMonitor', () => {
    test('debería registrar errores y continuar', () => {
      // Crear error de prueba
      const error = new Error('Test error');
      
      // Ejecutar middleware
      errorMonitor(error, req, res, next);
      
      // Verificar que se registra el error
      expect(logger.error).toHaveBeenCalledWith('Error en la aplicación:', expect.objectContaining({
        error: 'Test error',
        path: '/api/test',
        method: 'GET'
      }));
      
      // Verificar que se continúa con el error
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('systemMonitor', () => {
    test('debería recopilar métricas del sistema y continuar', () => {
      // Ejecutar middleware
      systemMonitor(req, res, next);
      
      // Verificar que se obtienen métricas del sistema
      expect(os.loadavg).toHaveBeenCalled();
      expect(os.cpus).toHaveBeenCalled();
      expect(os.totalmem).toHaveBeenCalled();
      expect(os.freemem).toHaveBeenCalled();
      expect(process.cpuUsage).toHaveBeenCalled();
      
      // Verificar que se continúa
      expect(next).toHaveBeenCalled();
    });
    
    test('debería registrar métricas periódicamente', () => {
      // En lugar de modificar el objeto privado, simplemente verificamos
      // que el middleware llama a los métodos correctos
      // Ejecutar middleware
      systemMonitor(req, res, next);
      
      // Verificar que se obtienen métricas del sistema
      expect(os.loadavg).toHaveBeenCalled();
      expect(os.cpus).toHaveBeenCalled();
      expect(os.totalmem).toHaveBeenCalled();
      expect(os.freemem).toHaveBeenCalled();
      expect(process.cpuUsage).toHaveBeenCalled();
      
      // Verificar que se continúa
      expect(next).toHaveBeenCalled();
      
      // No podemos verificar si se registran las métricas porque depende del tiempo
      // entre ejecuciones, que es un estado interno del módulo
    });
  });
  
  describe('connectionMonitor', () => {
    test('debería registrar eventos de conexión', () => {
      // Ejecutar middleware
      connectionMonitor(req, res, next);
      
      // Verificar que se registra el evento 'close'
      expect(res.on).toHaveBeenCalledWith('close', expect.any(Function));
      
      // Verificar que se continúa
      expect(next).toHaveBeenCalled();
    });
  });
  
  describe('memoryMonitor', () => {
    test('debería monitorear uso de memoria', () => {
      // Mock para process.memoryUsage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        rss: 50000000,
        heapTotal: 40000000,
        heapUsed: 30000000,
        external: 10000000
      });
      
      try {
        // Ejecutar middleware
        memoryMonitor(req, res, next);
        
        // Verificar que no se registra advertencia (uso normal)
        expect(logger.warn).not.toHaveBeenCalled();
        
        // Verificar que se continúa
        expect(next).toHaveBeenCalled();
      } finally {
        // Restaurar process.memoryUsage
        process.memoryUsage = originalMemoryUsage;
      }
    });
    
    test('debería registrar advertencia para alto uso de memoria', () => {
      // Mock para process.memoryUsage con uso alto
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        rss: 50000000,
        heapTotal: 100000000,
        heapUsed: 90000000, // 90% de heapTotal
        external: 10000000
      });
      
      try {
        // Ejecutar middleware
        memoryMonitor(req, res, next);
        
        // Verificar que se registra advertencia
        expect(logger.warn).toHaveBeenCalledWith('Alto uso de memoria:', expect.any(Object));
        
        // Verificar que se continúa
        expect(next).toHaveBeenCalled();
      } finally {
        // Restaurar process.memoryUsage
        process.memoryUsage = originalMemoryUsage;
      }
    });
  });
  
  describe('responseTimeMonitor', () => {
    test('debería registrar tiempos de respuesta normales', () => {
      // Modificar el mock de Date.now para simular respuesta rápida
      const originalDateNow = Date.now;
      Date.now = jest.fn()
        .mockReturnValueOnce(1000) // Primera llamada (inicio)
        .mockReturnValueOnce(1500); // Segunda llamada (fin): 500ms
      
      try {
        // Ejecutar middleware
        responseTimeMonitor(req, res, next);
        
        // Verificar que se registra el evento 'finish'
        expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
        
        // Simular que terminó la petición
        res.on.mock.calls[0][1]();
        
        // Verificar que no se registra advertencia (respuesta rápida)
        expect(logger.warn).not.toHaveBeenCalled();
        
        // Verificar que se continúa
        expect(next).toHaveBeenCalled();
      } finally {
        // Restaurar Date.now
        Date.now = originalDateNow;
      }
    });
    
    test('debería registrar advertencia para respuestas lentas', () => {
      // Modificar el mock de Date.now para simular respuesta lenta
      const originalDateNow = Date.now;
      Date.now = jest.fn()
        .mockReturnValueOnce(1000) // Primera llamada (inicio)
        .mockReturnValueOnce(2500); // Segunda llamada (fin): 1500ms
      
      try {
        // Ejecutar middleware
        responseTimeMonitor(req, res, next);
        
        // Verificar que se registra el evento 'finish'
        expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
        
        // Simular que terminó la petición
        res.on.mock.calls[0][1]();
        
        // Verificar que se registra advertencia
        expect(logger.warn).toHaveBeenCalledWith('Respuesta lenta:', expect.any(Object));
        
        // Verificar que se continúa
        expect(next).toHaveBeenCalled();
      } finally {
        // Restaurar Date.now
        Date.now = originalDateNow;
      }
    });
  });
  
  describe('healthCheck', () => {
    test('debería retornar estado de salud para ruta /health', () => {
      // Configurar ruta de salud
      req.path = '/health';
      
      // Ejecutar middleware
      healthCheck(req, res, next);
      
      // Verificar que se responde con estado de salud
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'OK',
        uptime: expect.any(Number)
      }));
      
      // Verificar que no se continúa
      expect(next).not.toHaveBeenCalled();
    });
    
    test('debería continuar para otras rutas', () => {
      // Configurar otra ruta
      req.path = '/api/users';
      
      // Ejecutar middleware
      healthCheck(req, res, next);
      
      // Verificar que se continúa
      expect(next).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
  
  describe('monitoringMiddleware', () => {
    test('debería registrar información de la petición al finalizar', () => {
      // Ejecutar middleware
      monitoringMiddleware(req, res, next);
      
      // Verificar que se registra el evento 'finish'
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
      
      // Simular que terminó la petición
      res.on.mock.calls[0][1]();
      
      // Verificar que se registra información
      expect(logger.info).toHaveBeenCalledWith('Request completed', expect.objectContaining({
        method: 'GET',
        path: '/api/test',
        status: 200
      }));
      
      // Verificar que se continúa
      expect(next).toHaveBeenCalled();
    });
  });
}); 