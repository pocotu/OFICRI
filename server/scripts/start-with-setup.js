/**
 * Script de inicio con configuración automática
 * Ejecuta todos los pasos de verificación e inicialización necesarios
 * antes de iniciar el servidor
 */

const { execSync } = require('child_process');
const path = require('path');
const { createLogger, format, transports } = require('winston');

// Configurar logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.colorize(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console()
  ]
});

// Ruta base para ejecutar comandos
const basePath = path.resolve(__dirname, '..');

/**
 * Ejecuta un comando npm y registra su salida
 * @param {string} command - Comando npm a ejecutar
 * @returns {boolean} - true si el comando se ejecutó correctamente
 */
function runCommand(command) {
  logger.info(`Ejecutando: ${command}`);
  
  try {
    const output = execSync(command, { 
      cwd: basePath,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    logger.info(`✓ Comando completado`);
    return true;
  } catch (error) {
    logger.error(`✗ Error al ejecutar ${command}:`);
    logger.error(error.message);
    return false;
  }
}

/**
 * Secuencia principal de configuración e inicio
 */
async function main() {
  logger.info('=== INICIANDO SISTEMA OFICRI CON CONFIGURACIÓN AUTOMÁTICA ===');
  
  // Paso 1: Inicializar la estructura de la base de datos
  if (!runCommand('npm run db:init')) {
    logger.warn('Se produjo un error en la inicialización de la base de datos');
    logger.info('Intentando limpiar y continuar...');
  }
  
  // Paso 2: Limpiar restricciones si es necesario
  runCommand('npm run db:limpiar');
  
  // Paso 3: Crear usuario administrador y datos iniciales
  if (!runCommand('npm run db:crear-admin')) {
    logger.error('Error al crear usuario administrador');
    logger.info('Continuando de todos modos...');
  }
  
  // Paso 4: Verificar la configuración
  if (!runCommand('npm run check:db')) {
    logger.warn('La verificación de la base de datos reportó problemas');
    logger.info('Es posible que algunas funcionalidades no estén disponibles');
  }
  
  // Paso 5: Iniciar el servidor
  logger.info('=== CONFIGURACIÓN COMPLETADA, INICIANDO SERVIDOR ===');
  
  try {
    // Iniciar el servidor usando require para mantenerlo en el mismo proceso
    require('../server.js');
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Ejecutar la secuencia
main().catch(error => {
  logger.error('Error fatal durante la secuencia de inicio:', error);
  process.exit(1);
}); 