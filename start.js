/**
 * Archivo de inicio del servidor que proporciona una alternativa al módulo punycode obsoleto
 * y ejecuta la creación del admin automáticamente
 */

// Redirigir las importaciones de 'punycode' al módulo punycode2
require('module').Module._cache['punycode'] = require('./punycode-shim');

// Cargar variables de entorno desde .env
require('dotenv').config();
console.log('Cargando configuración desde archivo .env principal');

// Importar dependencias
const { createLogger, format, transports } = require('winston');
const path = require('path');
const { exec, spawn } = require('child_process');
const logger = require('./server/utils/logger');

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
  
  // En desarrollo, omitir verificación de admin para arranque más rápido
  if (process.env.NODE_ENV === 'development') {
    loggerWinston.info('Modo desarrollo: omitiendo verificación de usuario admin');
    startServer();
    return;
  }
  
  // En producción, verificar usuario admin primero
  const crearAdmin = spawn('node', ['server/crear-admin.js']);
  
  crearAdmin.stdout.on('data', (data) => {
    loggerWinston.info(`crear-admin: ${data}`);
  });
  
  crearAdmin.stderr.on('data', (data) => {
    loggerWinston.error(`crear-admin error: ${data}`);
  });
  
  crearAdmin.on('close', (code) => {
    if (code !== 0) {
      loggerWinston.warn(`crear-admin proceso terminado con código ${code}`);
    }
    startServer();
  });
}

// Iniciar el servidor
function startServer() {
  // Si se especifica USE_SIMPLE_SERVER=true o estamos en desarrollo (por defecto), usar servidor simple
  if (process.env.USE_SIMPLE_SERVER === 'true') {
    loggerWinston.info('Iniciando servidor simplificado...');
    require('./server/simple-server');
    return;
  }
  
  // Intentar iniciar servidor completo
  try {
    loggerWinston.info('Iniciando servidor completo...');
    require('./server/server');
  } catch (error) {
    loggerWinston.error(`Error al iniciar servidor completo: ${error.message}`);
    loggerWinston.info('Intentando iniciar servidor simplificado como respaldo...');
    
    try {
      require('./server/simple-server');
    } catch (fallbackError) {
      loggerWinston.error(`Error crítico, no se pudo iniciar ningún servidor: ${fallbackError.message}`);
      process.exit(1);
    }
  }
}

// Ejecutar
main().catch(err => {
  loggerWinston.error(`Error en el proceso principal: ${err.message}`);
  process.exit(1);
}); 