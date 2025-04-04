/**
 * Archivo de inicio del servidor que proporciona una alternativa al módulo punycode obsoleto
 * y ejecuta la creación del admin automáticamente
 */

// Cargar shims globales antes de cualquier otra dependencia
require('../utils/global-shims');
console.log('Shims globales cargados correctamente');

// Cargar variables de entorno desde .env
require('dotenv').config();
console.log('Cargando configuración desde archivo .env principal');

// Importar dependencias
const { createLogger, format, transports } = require('winston');
const path = require('path');
const { exec, spawn } = require('child_process');
const logger = require('../utils/logger');

// Configurar logger para este script
const loggerWinston = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'start-script' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    })
  ]
});

// Mostrar información del servidor
function displayServerInfo() {
  const port = process.env.PORT || 3000;
  const environment = process.env.NODE_ENV || 'development';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbName = process.env.DB_DATABASE || 'oficri_sistema';
  
  loggerWinston.info('===== INFORMACIÓN DEL SERVIDOR =====');
  loggerWinston.info(`Entorno: ${environment}`);
  loggerWinston.info(`Puerto: ${port}`);
  loggerWinston.info(`Base de datos: ${dbName} (${dbHost})`);
  loggerWinston.info('Enlaces principales:');
  loggerWinston.info(`- API: http://localhost:${port}/api`);
  loggerWinston.info(`- Documentación: http://localhost:${port}/api-docs`);
  loggerWinston.info('Comandos de prueba:');
  loggerWinston.info('- Verificar usuario: curl http://localhost:' + port + '/api/check-auth');
  loggerWinston.info('====================================');
}

// En modo desarrollo, usar servidor simple por defecto a menos que se especifique lo contrario
if (process.env.NODE_ENV === 'development' && process.env.USE_SIMPLE_SERVER !== 'false') {
  process.env.USE_SIMPLE_SERVER = 'true';
  loggerWinston.info('Modo desarrollo: usando servidor simplificado por defecto');
} else if (process.env.USE_SIMPLE_SERVER === 'true') {
  loggerWinston.info('Usando servidor simplificado según configuración');
} else {
  loggerWinston.info('Usando servidor completo según configuración');
}

// Función principal
async function main() {
  displayServerInfo();
  
  // Siempre verificar el usuario admin (incluso en desarrollo)
  loggerWinston.info('Verificando usuario administrador...');
  
  // Usar path absoluto para ejecutar el script
  const scriptPath = path.resolve(__dirname, '../scripts/crear-admin.js');
  loggerWinston.info(`Ejecutando script: ${scriptPath}`);
  
  const crearAdmin = spawn('node', [scriptPath]);
  
  crearAdmin.stdout.on('data', (data) => {
    loggerWinston.info(`crear-admin: ${data}`);
  });
  
  crearAdmin.stderr.on('data', (data) => {
    loggerWinston.error(`crear-admin error: ${data}`);
  });
  
  return new Promise((resolve) => {
    crearAdmin.on('close', (code) => {
      if (code !== 0) {
        loggerWinston.warn(`crear-admin proceso terminado con código ${code}`);
      } else {
        loggerWinston.info('Verificación de usuario admin completada');
      }
      startServer();
      resolve();
    });
  });
}

// Referencia al servidor para pruebas
let serverInstance = null;

// Iniciar el servidor
function startServer() {
  // Si se especifica USE_SIMPLE_SERVER=true o estamos en desarrollo (por defecto), usar servidor simple
  if (process.env.USE_SIMPLE_SERVER === 'true') {
    loggerWinston.info('Iniciando servidor simplificado...');
    
    // En modo de prueba, permitir mock del servidor
    if (process.env.NODE_ENV === 'test' && process.env.TEST_MODE === 'mock') {
      serverInstance = {};
      return serverInstance;
    }
    
    try {
      serverInstance = require('../server');
      return serverInstance;
    } catch (error) {
      loggerWinston.error(`Error al iniciar servidor: ${error.message}`);
      exitProcess(1);
      return null; // Never reaches here, but helps with test coverage
    }
  }
  
  // Intentar iniciar servidor completo
  try {
    loggerWinston.info('Iniciando servidor completo...');
    
    // En modo de prueba, permitir mock del servidor
    if (process.env.NODE_ENV === 'test' && process.env.TEST_MODE === 'mock') {
      serverInstance = {};
      return serverInstance;
    }
    
    serverInstance = require('../server');
    return serverInstance;
  } catch (error) {
    loggerWinston.error(`Error al iniciar servidor completo: ${error.message}`);
    loggerWinston.info('Intentando iniciar servidor simplificado como respaldo...');
    
    try {
      if (process.env.NODE_ENV === 'test' && process.env.TEST_MODE === 'mock') {
        serverInstance = {};
        return serverInstance;
      }
      
      serverInstance = require('../server');
      return serverInstance;
    } catch (fallbackError) {
      loggerWinston.error(`Error crítico, no se pudo iniciar ningún servidor: ${fallbackError.message}`);
      exitProcess(1);
      return null; // Never reaches here, but helps with test coverage
    }
  }
}

// Helper function to make process.exit testable
function exitProcess(code) {
  process.exit(code);
}

// Ejecutar solo si no estamos en entorno de prueba
if (process.env.NODE_ENV !== 'test') {
  main().catch(err => {
    loggerWinston.error(`Error en el proceso principal: ${err.message}`);
    exitProcess(1);
  });
}

// Export functions for testing
module.exports = {
  displayServerInfo,
  main,
  startServer,
  exitProcess
}; 