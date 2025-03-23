/**
 * Script de inicio rápido para desarrollo
 * Inicia directamente el servidor simplificado sin verificaciones adicionales
 */

// Configuración para inicio rápido
process.env.NODE_ENV = 'development';
process.env.PORT = process.env.PORT || 3000;

// Cargar variables de entorno desde el archivo .env
require('dotenv').config();
console.log('Cargando configuración desde archivo .env principal');

// Configurar conexión MySQL de prueba
const mysql = require('mysql2/promise');
const logger = require('./server/utils/logger');

// Mostrar información del servidor
function displayServerInfo() {
  const port = process.env.PORT || 3000;
  const environment = process.env.NODE_ENV || 'development';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbName = process.env.DB_DATABASE || 'oficri_sistema';
  
  logger.info('===== INFORMACIÓN DEL INICIO RÁPIDO =====');
  logger.info(`Entorno: ${environment}`);
  logger.info(`Puerto: ${port}`);
  logger.info(`Base de datos: ${dbName} (${dbHost})`);
  logger.info('Enlaces principales:');
  logger.info(`- API: http://localhost:${port}/api`);
  logger.info(`- Documentación: http://localhost:${port}/api-docs`);
  logger.info('===================================');
}

// Verificar conexión a base de datos
async function checkDatabase() {
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'oficri_sistema'
    };
    
    logger.info(`Verificando conexión a MySQL: ${config.host}:${config.port}/${config.database}`);
    const connection = await mysql.createConnection(config);
    logger.info('✅ Conexión a MySQL establecida correctamente');
    await connection.end();
    return true;
  } catch (err) {
    logger.error(`❌ Error al conectar con MySQL: ${err.message}`);
    return false;
  }
}

// Función principal
async function main() {
  displayServerInfo();
  
  // Verificar base de datos primero
  const dbOk = await checkDatabase();
  if (!dbOk) {
    logger.warn('No se pudo conectar con MySQL. Verifique que el servidor MySQL esté iniciado y las credenciales sean correctas.');
    logger.warn('Continuando de todas formas, pero es posible que el servidor no funcione correctamente.');
  }
  
  // Iniciar servidor simplificado (modo rápido)
  try {
    logger.info('Iniciando servidor en modo rápido...');
    require('./server/simple-server');
  } catch (err) {
    logger.error(`Error al iniciar servidor: ${err.message}`);
    process.exit(1);
  }
}

// Ejecutar
main().catch(err => {
  logger.error(`Error en inicio rápido: ${err.message}`);
  process.exit(1);
}); 