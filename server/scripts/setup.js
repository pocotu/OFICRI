/**
 * OFICRI System Setup Script
 * Runs initial configuration for the application database
 * ISO/IEC 27001 compliant implementation
 */

// Load environment variables
require('dotenv').config();

// Import modules
const { initializeDatabase } = require('./init-database');
const { logger } = require('../utils/logger');
const { testConnection } = require('../config/database');
const fs = require('fs');
const path = require('path');

// ASCII art banner
const banner = `
 ██████╗ ███████╗██╗ ██████╗██████╗ ██╗
██╔═══██╗██╔════╝██║██╔════╝██╔══██╗██║
██║   ██║█████╗  ██║██║     ██████╔╝██║
██║   ██║██╔══╝  ██║██║     ██╔══██╗██║
╚██████╔╝██║     ██║╚██████╗██║  ██║██║
 ╚═════╝ ╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝
                                        
 Sistema de Gestión ISO/IEC 27001
`;

/**
 * Check if environment variables are set
 */
function checkEnvironment() {
  const requiredVars = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: Faltan variables de entorno requeridas:');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.log('\nPor favor, revise el archivo .env y asegúrese de configurar todas las variables requeridas.');
    return false;
  }

  return true;
}

/**
 * Check if the database schema has been created
 */
async function checkDatabaseSchema() {
  try {
    await testConnection();
    return true;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Error al conectar con la base de datos:');
    console.error(`  ${error.message}`);
    
    if (error.message.includes('Unknown database')) {
      console.log('\x1b[33m%s\x1b[0m', '\n¿Desea crear la base de datos y ejecutar el script de esquema?');
      console.log('  1. Asegúrese de que MySQL esté funcionando y sea accesible');
      console.log('  2. Ejecute el siguiente comando SQL para crear la base de datos:');
      console.log(`\x1b[36m     CREATE DATABASE ${process.env.DB_NAME};\x1b[0m`);
      console.log('  3. Ejecute el script de esquema:');
      console.log('\x1b[36m     node server/scripts/run-sql-file.js -f db/db.sql\x1b[0m');
    }
    
    return false;
  }
}

/**
 * Main setup function
 */
async function setupSystem() {
  console.log('\x1b[36m%s\x1b[0m', banner);
  console.log('\x1b[1m%s\x1b[0m', 'Asistente de configuración inicial del sistema OFICRI');
  console.log('==========================================================\n');

  // Check environment variables
  if (!checkEnvironment()) {
    process.exit(1);
  }

  console.log('✅ Variables de entorno configuradas correctamente');

  // Check database connection and schema
  console.log('\nVerificando conexión a la base de datos...');
  const schemaReady = await checkDatabaseSchema();
  
  if (!schemaReady) {
    process.exit(1);
  }

  console.log('✅ Conexión a la base de datos establecida correctamente');

  // Run database initialization
  console.log('\nConfigurando datos iniciales del sistema...');
  
  try {
    await initializeDatabase();
    
    console.log('\n\x1b[32m%s\x1b[0m', '¡Configuración inicial completada exitosamente! 🎉');
    console.log('\nPuede iniciar sesión con las siguientes credenciales:');
    console.log('\x1b[33m%s\x1b[0m', '  CIP:        12345678');
    console.log('\x1b[33m%s\x1b[0m', '  Contraseña: Admin123!');
    
    console.log('\n\x1b[1m%s\x1b[0m', 'Próximos pasos:');
    console.log('  1. Inicie el servidor: npm run dev');
    console.log('  2. Acceda a: http://localhost:3000');
    console.log('  3. Inicie sesión con las credenciales de arriba');
    console.log('  4. Cambie la contraseña predeterminada inmediatamente');
    
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '\nError durante la configuración inicial:');
    console.error(`  ${error.message}`);
    logger.error('Error en setup.js:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Run setup
setupSystem();