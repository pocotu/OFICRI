/**
 * Logs Service Tests
 * Pruebas unitarias para el servicio de logs
 */

// Mocks para las dependencias
jest.mock('../../config/database', () => ({
  executeQuery: jest.fn()
}));

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    access: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn()
  },
  existsSync: jest.fn(),
  createReadStream: jest.fn(),
  createWriteStream: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn()
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

const fs = require('fs');
const path = require('path');
const { executeQuery } = require('../../config/database');
const { logger } = require('../../utils/logger');
const logsService = require('../../services/logs/logs.service');

describe('Logs Service', () => {
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    // Configurar comportamiento predeterminado de los mocks
    path.join.mockImplementation((...args) => args.join('/'));
    fs.existsSync.mockReturnValue(true);
  });
  
  describe('getLogs', () => {
    test('debe recuperar logs con los filtros predeterminados', async () => {
      // Configuración de los mocks
      executeQuery.mockResolvedValueOnce([
        { 
          IDLog: 1, 
          Accion: 'login', 
          FechaEvento: new Date(), 
          Usuario: 'usuario1',
          Descripcion: 'Login exitoso'
        },
        { 
          IDLog: 2, 
          Accion: 'vista_documento', 
          FechaEvento: new Date(), 
          Usuario: 'usuario2',
          Descripcion: 'Visualización de documento'
        }
      ]);
      
      // Mock para la consulta count
      executeQuery.mockResolvedValueOnce([{ total: 2 }]);
      
      // Ejecutar la función
      const result = await logsService.getLogs();
      
      // Verificaciones
      expect(executeQuery).toHaveBeenCalledTimes(2);
      
      // Verificar parámetros de la primera llamada (query principal)
      expect(executeQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT * FROM UsuarioLog'),
        expect.arrayContaining([100, 0])  // Valores predeterminados para limit y offset
      );
      
      // Verificar parámetros de la segunda llamada (query de conteo)
      expect(executeQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('SELECT COUNT(*) as total FROM UsuarioLog'),
        []
      );
      
      // Verificar estructura de la respuesta
      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('pagination');
      expect(result.logs).toHaveLength(2);
      expect(result.pagination).toEqual({
        total: 2,
        limit: 100,
        offset: 0,
        pages: 1
      });
    });
    
    test('debe aplicar filtros de tipo correctamente', async () => {
      // Configuración de los mocks
      executeQuery.mockResolvedValueOnce([]);
      executeQuery.mockResolvedValueOnce([{ total: 0 }]);
      
      // Ejecutar la función con filtro de tipo
      await logsService.getLogs({ tipo: 'documento' });
      
      // Verificaciones
      expect(executeQuery).toHaveBeenCalledTimes(2);
      
      // Verificar que se usó la tabla correcta
      expect(executeQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT * FROM DocumentoLog'),
        expect.any(Array)
      );
      
      expect(executeQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('SELECT COUNT(*) as total FROM DocumentoLog'),
        []
      );
    });
    
    test('debe aplicar filtros de fecha correctamente', async () => {
      // Configuración de los mocks
      executeQuery.mockResolvedValueOnce([]);
      executeQuery.mockResolvedValueOnce([{ total: 0 }]);
      
      // Fechas para filtrar
      const fechaInicio = new Date('2023-01-01');
      const fechaFin = new Date('2023-01-31');
      
      // Ejecutar la función con filtros de fecha
      await logsService.getLogs({ fechaInicio, fechaFin });
      
      // Verificaciones
      expect(executeQuery).toHaveBeenCalledTimes(2);
      
      // Verificar que la consulta incluye filtros de fecha
      expect(executeQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('WHERE FechaEvento >= ? AND FechaEvento <= ?'),
        expect.arrayContaining([fechaInicio, fechaFin, 100, 0])
      );
      
      // Verificar que la consulta de conteo también incluye filtros de fecha
      expect(executeQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('WHERE FechaEvento >= ? AND FechaEvento <= ?'),
        expect.arrayContaining([fechaInicio, fechaFin])
      );
    });
    
    test('debe manejar errores correctamente', async () => {
      // Simular un error en la base de datos
      const dbError = new Error('Error de conexión a la base de datos');
      executeQuery.mockRejectedValueOnce(dbError);
      
      // Ejecutar la función y verificar que rechaza con error
      await expect(logsService.getLogs()).rejects.toThrow('Error al obtener logs');
      
      // Verificar que se registró el error
      expect(logger.error).toHaveBeenCalledWith(
        'Error al obtener logs:',
        expect.objectContaining({
          error: 'Error de conexión a la base de datos'
        })
      );
    });
  });
  
  describe('getSecurityStats', () => {
    test('debe recuperar estadísticas de seguridad', async () => {
      // Configuración de los mocks para estadísticas de intrusión por tipo
      executeQuery.mockResolvedValueOnce([
        { TipoEvento: 'LOGIN_FALLIDO', total: 50 },
        { TipoEvento: 'SQL_INJECTION', total: 15 },
        { TipoEvento: 'XSS_ATTEMPT', total: 10 }
      ]);
      
      // Configuración de los mocks para el conteo de cada tabla (10 tablas)
      const mockTableCounts = [10, 15, 5, 8, 12, 7, 20, 30, 5, 3];
      
      // Configuramos los mocks para cada una de las 10 tablas
      mockTableCounts.forEach(count => {
        executeQuery.mockResolvedValueOnce([{ total: count }]);
      });
      
      // Ejecutar la función
      const result = await logsService.getSecurityStats();
      
      // Verificaciones
      expect(executeQuery).toHaveBeenCalledTimes(11); // 1 consulta principal + 10 tablas
      
      // Verificar estructura de la respuesta
      expect(result).toHaveProperty('intrusionsByType');
      expect(result).toHaveProperty('logTableCounts');
      expect(result).toHaveProperty('totalLogs');
      
      // Verificar valores específicos
      expect(result.intrusionsByType).toHaveLength(3);
      expect(result.logTableCounts).toHaveLength(10);
      expect(result.totalLogs).toBe(mockTableCounts.reduce((a, b) => a + b, 0));
      
      // No verificamos el formato exacto de la SQL, ya que es más robusto verificar sólo partes importantes
      expect(executeQuery.mock.calls[0][0]).toContain('SELECT');
      expect(executeQuery.mock.calls[0][0]).toContain('FROM IntrusionDetectionLog');
      expect(executeQuery.mock.calls[0][0]).toContain('GROUP BY TipoEvento');
    });
    
    test('debe aplicar filtros de fecha en estadísticas', async () => {
      // Fechas para filtrar
      const fechaInicio = new Date('2023-01-01');
      const fechaFin = new Date('2023-01-31');
      
      // Configuración de los mocks para estadísticas de intrusión por tipo
      executeQuery.mockResolvedValueOnce([
        { TipoEvento: 'LOGIN_FALLIDO', total: 20 }
      ]);
      
      // Configuramos los mocks para cada una de las 10 tablas
      for (let i = 0; i < 10; i++) {
        executeQuery.mockResolvedValueOnce([{ total: 5 }]);
      }
      
      // Ejecutar la función con filtros de fecha
      await logsService.getSecurityStats({ fechaInicio, fechaFin });
      
      // Verificaciones
      expect(executeQuery).toHaveBeenCalledTimes(11); // 1 consulta principal + 10 tablas
      
      // Verificar que la primera consulta incluye los filtros de fecha
      // Nos aseguramos de verificar sólo que recibe los parámetros correctos
      expect(executeQuery.mock.calls[0][0]).toContain('FechaEvento >= ?');
      expect(executeQuery.mock.calls[0][0]).toContain('FechaEvento <= ?');
      expect(executeQuery.mock.calls[0][1]).toEqual(expect.arrayContaining([fechaInicio, fechaFin]));
      
      // Verificar que al menos una de las consultas de conteo incluye filtros de fecha
      expect(executeQuery.mock.calls[1][0]).toContain('FechaEvento >= ?');
      expect(executeQuery.mock.calls[1][1]).toEqual(expect.arrayContaining([fechaInicio, fechaFin]));
    });
    
    test('debe manejar errores en estadísticas correctamente', async () => {
      // Simular un error en la base de datos
      const dbError = new Error('Error de conexión a la base de datos');
      executeQuery.mockRejectedValueOnce(dbError);
      
      // Ejecutar la función y verificar que rechaza con error
      await expect(logsService.getSecurityStats()).rejects.toThrow('Error al obtener estadísticas de seguridad');
      
      // Verificar que se registró el error
      expect(logger.error).toHaveBeenCalledWith(
        'Error al obtener estadísticas de seguridad:',
        expect.objectContaining({
          error: 'Error de conexión a la base de datos'
        })
      );
    });
  });
}); 