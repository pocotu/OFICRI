/**
 * Script para inicializar la base de datos OFICRI
 * Ejecuta los scripts SQL para crear la estructura y cargar datos iniciales
 */

// Cargar shims globales antes de cualquier otra dependencia
require('../utils/global-shims');

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { createLogger, format, transports } = require('winston');
const { spawn } = require('child_process');
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
 * Ejecuta un archivo SQL completo
 */
async function executeSqlFile(filePath) {
  console.log(`Ejecutando archivo SQL: ${filePath}`);
  return new Promise((resolve, reject) => {
    // Construir comando
    const mysqlCmd = 'mysql';
    const args = [
      '-h', process.env.DB_HOST || 'localhost',
      '-u', process.env.DB_USER || 'root'
    ];
    
    // Agregar password si existe
    if (process.env.DB_PASSWORD) {
      args.push('-p' + process.env.DB_PASSWORD);
    }
    
    // Iniciar proceso
    const mysql = spawn(mysqlCmd, args);
    
    // Ejecutar archivo SQL
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(mysql.stdin);
    
    // Manejar salida
    mysql.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    
    mysql.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    
    mysql.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Archivo SQL ejecutado correctamente: ${filePath}`);
        resolve(true);
      } else {
        console.error(`❌ Error al ejecutar archivo SQL: ${filePath} (código ${code})`);
        reject(new Error(`Error al ejecutar archivo SQL: código ${code}`));
      }
    });
  });
}

/**
 * Inicializa la base de datos completa
 */
async function initializeDatabase() {
  console.log('=== INICIALIZACIÓN DE BASE DE DATOS OFICRI ===\n');
  
  try {
    // 1. Verificar conexión básica
    console.log('-- VERIFICANDO CONEXIÓN --');
    const connected = await dbConnector.testConnection();
    if (!connected) {
      console.log('❌ No se puede conectar a la base de datos. Verifique las credenciales en el archivo .env');
      return false;
    }
    console.log('✅ Conexión a la base de datos establecida correctamente\n');
    
    // 2. Ejecutar archivo principal de la base de datos
    console.log('-- CREANDO ESTRUCTURA DE TABLAS --');
    const dbSqlPath = path.resolve(__dirname, '../../db/db.sql');
    
    if (!fs.existsSync(dbSqlPath)) {
      console.error(`❌ Archivo no encontrado: ${dbSqlPath}`);
      return false;
    }
    
    await executeSqlFile(dbSqlPath);
    console.log('✅ Estructura de base de datos creada correctamente\n');
    
    // 3. Ejecutar archivo de triggers
    console.log('-- CREANDO TRIGGERS --');
    const triggersSqlPath = path.resolve(__dirname, '../../db/trigger-control.sql');
    
    if (!fs.existsSync(triggersSqlPath)) {
      console.error(`❌ Archivo no encontrado: ${triggersSqlPath}`);
      return false;
    }
    
    await executeSqlFile(triggersSqlPath);
    console.log('✅ Triggers creados correctamente\n');
    
    // 4. Crear usuario administrador
    console.log('-- CREANDO USUARIO ADMINISTRADOR --');
    const crearAdminPath = path.resolve(__dirname, './crear-admin.js');
    
    if (!fs.existsSync(crearAdminPath)) {
      console.error(`❌ Script no encontrado: ${crearAdminPath}`);
      return false;
    }
    
    await new Promise((resolve, reject) => {
      const crearAdmin = spawn('node', [crearAdminPath]);
      
      crearAdmin.stdout.on('data', (data) => {
        console.log(`${data}`);
      });
      
      crearAdmin.stderr.on('data', (data) => {
        console.error(`${data}`);
      });
      
      crearAdmin.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Usuario administrador creado correctamente\n');
          resolve();
        } else {
          console.error(`❌ Error al crear usuario administrador (código ${code})\n`);
          reject(new Error(`Error al crear administrador: código ${code}`));
        }
      });
    });
    
    return true;
  } catch (error) {
    console.error(`Error al inicializar la base de datos: ${error}`);
    return false;
  }
}

// Ejecutar inicialización
initializeDatabase()
  .then(success => {
    if (success) {
      console.log('\n✅ Base de datos inicializada correctamente');
    } else {
      console.log('\n❌ Error al inicializar la base de datos');
      console.log('Revise los mensajes anteriores para más detalles');
    }
  })
  .catch(error => {
    console.error('Error crítico:', error);
    process.exit(1);
  }); 