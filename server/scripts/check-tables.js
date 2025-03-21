/**
 * Script para verificar la estructura de las tablas
 */

const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2/promise');

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Definir función para ejecutar consultas
async function executeQuery(sql, params = []) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    const [results] = await connection.query(sql, params);
    return results;
  } finally {
    await connection.end();
  }
}

async function checkTables() {
  console.log('=== VERIFICACIÓN DE ESTRUCTURA DE TABLAS ===');
  
  try {
    // Listar todas las tablas
    const tables = await executeQuery('SHOW TABLES');
    
    for (const tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      console.log(`\n-- ESTRUCTURA DE TABLA: ${tableName} --`);
      
      const columns = await executeQuery(`DESCRIBE ${tableName}`);
      
      // Mostrar columnas
      console.log('Columnas:');
      columns.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''} ${col.Key === 'PRI' ? '(PRIMARY KEY)' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
      });
    }

  } catch (error) {
    console.error('Error al verificar estructura de tablas:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar la verificación
checkTables(); 