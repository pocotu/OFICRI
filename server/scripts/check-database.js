/**
 * Script para verificar el estado de la base de datos
 * Comprueba la existencia y estructura de las tablas principales
 * y verifica que exista al menos un usuario administrador
 */

// Cargar shims globales antes de cualquier otra dependencia
require('../utils/global-shims');

require('dotenv').config();
const path = require('path');
const { createLogger, format, transports } = require('winston');
const dbConnector = require('../utils/db-connector');

// Crear logger específico para este script
const scriptLogger = createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

/**
 * Ejecuta una consulta SQL y devuelve los resultados
 */
async function executeQuery(sql, params = []) {
  let connection;
  try {
    connection = await dbConnector.createConnection();
    const [results] = await connection.query(sql, params);
    return results;
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (err) {
        scriptLogger.error(`Error al cerrar conexión: ${err.message}`);
      }
    }
  }
}

/**
 * Verificar la base de datos
 */
async function checkDatabase() {
  console.log('=== VERIFICACIÓN DE ESTADO DE BASE DE DATOS ===\n');
  
  try {
    // 1. Verificar conexión básica
    console.log('-- CONEXIÓN --');
    const connected = await dbConnector.testConnection();
    if (!connected) {
      console.log('❌ No se puede conectar a la base de datos. Verifique las credenciales en el archivo .env');
      return false;
    }
    console.log('✅ Conexión a la base de datos establecida correctamente');
    
    // 2. Verificar tablas principales
    console.log('\n-- TABLAS PRINCIPALES --');
    const tables = await executeQuery(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME || 'oficri_sistema']);
    
    const requiredTables = ['Usuario', 'Rol', 'AreaEspecializada', 'Documento', 'MesaPartes'];
    const missingTables = [];
    
    for (const requiredTable of requiredTables) {
      if (!tables.some(t => t.TABLE_NAME.toLowerCase() === requiredTable.toLowerCase())) {
        missingTables.push(requiredTable);
      }
    }
    
    if (missingTables.length > 0) {
      console.log(`❌ Faltan las siguientes tablas: ${missingTables.join(', ')}`);
      console.log('Ejecute npm run db:init para crear la estructura de la base de datos');
    } else {
      console.log('✅ Todas las tablas requeridas existen en la base de datos');
    }
    
    // 3. Verificar usuario administrador
    console.log('\n-- USUARIO ADMINISTRADOR --');
    try {
      const adminCount = await executeQuery(`
        SELECT COUNT(*) as count FROM Usuario u
        JOIN Rol r ON u.IDRol = r.IDRol
        WHERE r.NivelAcceso = 1 AND Bloqueado = 0
      `);
      
      if (adminCount[0].count === 0) {
        console.log('❌ No existe ningún usuario administrador activo');
        console.log('Ejecute npm run db:crear-admin para crear un usuario administrador');
      } else {
        console.log(`✅ Existen ${adminCount[0].count} usuario(s) administrador(es) activo(s)`);
      }
    } catch (error) {
      if (error.message.includes('ER_NO_SUCH_TABLE')) {
        console.log('❌ No se puede verificar usuario administrador: la tabla Usuario o Rol no existe');
      } else {
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    console.log(`Error al verificar la base de datos: ${error}`);
    return false;
  }
}

// Ejecutar la verificación
checkDatabase()
  .then(success => {
    if (success) {
      console.log('\n✅ La base de datos está configurada correctamente');
    } else {
      console.log('\n❌ La base de datos requiere configuración adicional');
      console.log('Revise los mensajes anteriores para más detalles');
    }
  })
  .catch(error => {
    console.error('Error crítico:', error);
    process.exit(1);
  }); 