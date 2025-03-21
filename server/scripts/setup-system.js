/**
 * Setup System Script
 * Script unificado para la configuración inicial del sistema OFICRI
 * ISO/IEC 27001 compliant implementation
 */

const path = require('path');
const { createLogger, format, transports } = require('winston');
const { 
  loadEnv, 
  executeQuery, 
  disableConstraints, 
  enableConstraints
} = require('../utils/database-helpers');
const { initializeDatabase } = require('./init-database');

// Cargar variables de entorno
loadEnv(path.resolve(__dirname, '../../.env'));

// Configurar logger específico para setup
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.colorize(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`)
  ),
  transports: [
    new transports.Console({
      stderrLevels: ['error'],
      consoleWarnLevels: ['warn']
    }),
    new transports.File({ 
      filename: path.resolve(__dirname, '../../logs/setup.log')
    })
  ]
});

/**
 * Verifica que las variables de entorno necesarias estén definidas
 * @returns {boolean} true si todo está correcto
 * @throws {Error} Si falta alguna variable de entorno crítica
 */
function checkEnvironment() {
  const requiredVars = [
    'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
    'JWT_SECRET', 'PORT', 'NODE_ENV'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno requeridas: ${missing.join(', ')}`);
  }
  
  logger.info('Verificación de variables de entorno: OK');
  return true;
}

/**
 * Verifica la conexión a la base de datos
 * @returns {Promise<boolean>} true si la conexión es exitosa
 */
async function testDatabaseConnection() {
  try {
    const result = await executeQuery('SELECT VERSION() as version');
    logger.info(`Conexión a base de datos exitosa (MySQL ${result[0].version})`);
    return true;
  } catch (error) {
    logger.error('Error al conectar a la base de datos:', error);
    throw error;
  }
}

/**
 * Verifica que el esquema de la base de datos esté completo
 * @returns {Promise<boolean>} true si el esquema está completo
 */
async function checkDatabaseSchema() {
  const requiredTables = [
    'Usuario', 'Rol', 'AreaEspecializada', 'MesaPartes', 
    'Documento', 'HistorialDocumento', 'Permiso', 'RolPermiso',
    'LogActividad', 'LogSeguridad'
  ];
  
  try {
    // Verificar si existen todas las tablas requeridas
    const results = await executeQuery(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN (${requiredTables.map(() => '?').join(',')})
    `, [process.env.DB_NAME, ...requiredTables]);
    
    const foundTables = results.map(r => r.TABLE_NAME);
    const missingTables = requiredTables.filter(table => !foundTables.includes(table));
    
    if (missingTables.length > 0) {
      logger.warn(`Faltan las siguientes tablas: ${missingTables.join(', ')}`);
      return false;
    }
    
    logger.info(`Verificación de esquema: OK (${foundTables.length} tablas verificadas)`);
    return true;
  } catch (error) {
    logger.error('Error al verificar el esquema de la base de datos:', error);
    throw error;
  }
}

/**
 * Verifica si existe el usuario administrador
 * @returns {Promise<boolean>} true si el usuario administrador existe
 */
async function checkAdminUser() {
  try {
    const adminUser = await executeQuery(
      'SELECT IDUsuario, Nombres, Apellidos FROM Usuario WHERE CodigoCIP = ? LIMIT 1',
      ['12345678']
    );
    
    if (adminUser.length === 0) {
      logger.warn('No se encontró usuario administrador');
      return false;
    }
    
    logger.info(`Usuario administrador verificado: ${adminUser[0].Nombres} ${adminUser[0].Apellidos}`);
    return true;
  } catch (error) {
    logger.error('Error al verificar usuario administrador:', error);
    throw error;
  }
}

/**
 * Función principal para la configuración del sistema
 */
async function setupSystem() {
  logger.info('=== INICIANDO CONFIGURACIÓN DEL SISTEMA OFICRI ===');
  
  try {
    // Paso 1: Verificar variables de entorno
    logger.info('Paso 1: Verificando variables de entorno...');
    checkEnvironment();
    
    // Paso 2: Verificar conexión a la base de datos
    logger.info('Paso 2: Verificando conexión a la base de datos...');
    await testDatabaseConnection();
    
    // Paso 3: Verificar esquema de la base de datos
    logger.info('Paso 3: Verificando esquema de la base de datos...');
    const schemaReady = await checkDatabaseSchema();
    
    if (!schemaReady) {
      logger.warn('Esquema de base de datos incompleto. Debe ejecutar los scripts SQL de creación.');
      logger.warn('Ejecute: npm run db:setup');
      return false;
    }
    
    // Paso 4: Verificar usuario administrador
    logger.info('Paso 4: Verificando usuario administrador...');
    const adminExists = await checkAdminUser();
    
    // Paso 5: Inicializar datos si es necesario
    if (!adminExists) {
      logger.info('Paso 5: Inicializando datos básicos del sistema...');
      await initializeDatabase();
    } else {
      logger.info('Paso 5: Los datos básicos ya están inicializados');
    }
    
    logger.info('=== CONFIGURACIÓN DEL SISTEMA COMPLETADA CON ÉXITO ===');
    return true;
  } catch (error) {
    logger.error('Error durante la configuración del sistema:', error);
    logger.error('=== CONFIGURACIÓN DEL SISTEMA FALLÓ ===');
    throw error;
  }
}

// Si se ejecuta directamente (no importado)
if (require.main === module) {
  setupSystem()
    .then(success => {
      if (success) {
        logger.info('Sistema configurado exitosamente');
        console.log('\n===================================================');
        console.log('          OFICRI - Configuración Completa          ');
        console.log('===================================================');
        console.log('El sistema está listo para ser utilizado.');
        console.log('Para iniciar el servidor, ejecute: npm start');
        console.log('===================================================\n');
        process.exit(0);
      } else {
        logger.warn('Sistema no configurado completamente');
        console.log('\n===================================================');
        console.log('          OFICRI - Configuración Incompleta        ');
        console.log('===================================================');
        console.log('Se requieren acciones adicionales para completar');
        console.log('la configuración. Revise los logs para más detalles.');
        console.log('===================================================\n');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Error fatal durante la configuración:', error);
      console.error('\n===================================================');
      console.error('          OFICRI - Error de Configuración          ');
      console.error('===================================================');
      console.error('Ocurrió un error crítico durante la configuración.');
      console.error('Consulte los logs para más detalles.');
      console.error('===================================================\n');
      process.exit(1);
    });
} else {
  // Exportar funciones para uso en otros módulos
  module.exports = {
    setupSystem,
    checkEnvironment,
    testDatabaseConnection,
    checkDatabaseSchema,
    checkAdminUser
  };
} 