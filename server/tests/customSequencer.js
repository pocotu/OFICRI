/**
 * Secuenciador personalizado para Jest
 * Ejecuta las pruebas en un orden específico para optimizar la eficiencia
 */
const Sequencer = require('@jest/test-sequencer').default;
const path = require('path');

/**
 * Orden de ejecución:
 * 1. Pruebas unitarias - Son rápidas y no dependen de externos
 * 2. Pruebas de middleware - Prueban componentes individuales
 * 3. Pruebas de API/integración - Prueban interacciones
 * 4. Pruebas de entidad - Acceden a la base de datos
 */
class CustomSequencer extends Sequencer {
  /**
   * Función que determina el orden de los archivos de prueba
   */
  sort(tests) {
    // Devuelve una nueva matriz ordenada de tests
    return Array.from(tests).sort((testA, testB) => {
      const pathA = testA.path;
      const pathB = testB.path;
      
      // Extraer partes del path para clasificación
      const isUnitA = pathA.includes('/unit/');
      const isUnitB = pathB.includes('/unit/');
      
      const isMiddlewareA = pathA.includes('/middleware/');
      const isMiddlewareB = pathB.includes('/middleware/');
      
      const isApiA = pathA.includes('/api/');
      const isApiB = pathB.includes('/api/');
      
      const isEntityA = pathA.includes('/entity/');
      const isEntityB = pathB.includes('/entity/');
      
      // Las pruebas unitarias van primero
      if (isUnitA && !isUnitB) return -1;
      if (!isUnitA && isUnitB) return 1;
      
      // Luego, las pruebas de middleware
      if (isMiddlewareA && !isMiddlewareB) return -1;
      if (!isMiddlewareA && isMiddlewareB) return 1;
      
      // Luego, las pruebas de API
      if (isApiA && !isApiB) return -1;
      if (!isApiA && isApiB) return 1;
      
      // Las pruebas de entidad van al final
      if (isEntityA && !isEntityB) return 1;
      if (!isEntityA && isEntityB) return -1;
      
      // Si ambos archivos son del mismo tipo, ordena alfabéticamente
      const fileNameA = path.basename(pathA);
      const fileNameB = path.basename(pathB);
      
      return fileNameA.localeCompare(fileNameB);
    });
  }
}

module.exports = CustomSequencer; 