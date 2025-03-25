/**
 * Test para verificar la existencia de tablas en la base de datos
 * Este test es especialmente útil como diagnóstico para entender
 * por qué algunas pruebas fallan debido a tablas faltantes.
 */

const db = require('../../config/database');
const { logger } = require('../../utils/logger');

// Lista de tablas estándar que deberían existir
const standardTables = [
  'Usuario',
  'Rol',
  'Permiso',
  'AreaEspecializada',
  'Documento',
  'DocumentoArchivo',
  'Derivacion',
  'MesaPartes',
  'Papelera'
];

// Lista de tablas especializadas que pueden o no existir
const specializedTables = [
  'ForenseDigital',
  'QuimicaToxicologiaForense',
  'Dosaje',
  'PermisoContextual'
];

describe('Verificación de Tablas en Base de Datos', () => {
  
  let tablesStatus = {
    standard: {},
    specialized: {}
  };
  
  beforeAll(async () => {
    // Inicializar el estado como desconocido
    standardTables.forEach(table => {
      tablesStatus.standard[table] = 'unknown';
    });
    
    specializedTables.forEach(table => {
      tablesStatus.specialized[table] = 'unknown';
    });
  });
  
  afterAll(async () => {
    await db.closePool();
  });

  test('Debería verificar la existencia de tablas estándar', async () => {
    // Este test es principalmente informativo y siempre pasa
    
    for (const table of standardTables) {
      try {
        await db.executeQuery(`SELECT 1 FROM ${table} LIMIT 1`);
        tablesStatus.standard[table] = 'exists';
        logger.info(`✅ La tabla '${table}' existe en la base de datos.`);
      } catch (error) {
        if (error.message.includes("doesn't exist")) {
          tablesStatus.standard[table] = 'missing';
          logger.warn(`❌ La tabla '${table}' NO existe en la base de datos.`);
        } else {
          tablesStatus.standard[table] = 'error';
          logger.error(`❓ Error al verificar la tabla '${table}': ${error.message}`);
        }
      }
    }
    
    // Imprimir un resumen de tablas estándar faltantes
    const missingStandardTables = standardTables.filter(table => tablesStatus.standard[table] === 'missing');
    if (missingStandardTables.length > 0) {
      logger.warn(`❌ Faltan ${missingStandardTables.length} tablas estándar:\n   - ${missingStandardTables.join('\n   - ')}`);
    } else {
      logger.info('✅ Todas las tablas estándar existen.');
    }
    
    // Siempre pasa, es más un diagnóstico
    expect(true).toBe(true);
  });

  test('Debería verificar la existencia de tablas especializadas', async () => {
    // Este test es principalmente informativo y siempre pasa
    
    for (const table of specializedTables) {
      try {
        await db.executeQuery(`SELECT 1 FROM ${table} LIMIT 1`);
        tablesStatus.specialized[table] = 'exists';
        logger.info(`✅ La tabla especializada '${table}' existe en la base de datos.`);
      } catch (error) {
        if (error.message.includes("doesn't exist")) {
          tablesStatus.specialized[table] = 'missing';
          logger.info(`ℹ️ La tabla especializada '${table}' NO existe en la base de datos.`);
        } else {
          tablesStatus.specialized[table] = 'error';
          logger.error(`❓ Error al verificar la tabla especializada '${table}': ${error.message}`);
        }
      }
    }
    
    // Imprimir un resumen de tablas especializadas faltantes
    const missingSpecializedTables = specializedTables.filter(table => tablesStatus.specialized[table] === 'missing');
    if (missingSpecializedTables.length > 0) {
      logger.info(`ℹ️ Faltan ${missingSpecializedTables.length} tablas especializadas:\n   - ${missingSpecializedTables.join('\n   - ')}`);
    } else {
      logger.info('✅ Todas las tablas especializadas existen.');
    }
    
    // Siempre pasa, es más un diagnóstico
    expect(true).toBe(true);
  });

  test('Debería mostrar un resumen de la estructura de la base de datos', async () => {
    // Imprimir un resumen completo
    logger.info('=== RESUMEN DE TABLAS EN LA BASE DE DATOS ===');
    logger.info('Tablas estándar:');
    for (const table of standardTables) {
      const status = tablesStatus.standard[table];
      let statusSymbol = '❓';
      if (status === 'exists') statusSymbol = '✅';
      if (status === 'missing') statusSymbol = '❌';
      logger.info(`${statusSymbol} ${table}: ${status}`);
    }
    
    logger.info('\nTablas especializadas:');
    for (const table of specializedTables) {
      const status = tablesStatus.specialized[table];
      let statusSymbol = '❓';
      if (status === 'exists') statusSymbol = '✅';
      if (status === 'missing') statusSymbol = 'ℹ️';
      logger.info(`${statusSymbol} ${table}: ${status}`);
    }
    logger.info('==========================================');
    
    // Siempre pasa, es más un diagnóstico
    expect(true).toBe(true);
  });
}); 