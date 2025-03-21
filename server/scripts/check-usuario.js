/**
 * Script para verificar la estructura de la tabla Usuario
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

async function checkUsuarioTable() {
  console.log('=== VERIFICACIÓN DE TABLA USUARIO ===');
  
  try {
    // Verificar si la tabla existe
    const tables = await executeQuery("SHOW TABLES LIKE 'Usuario'");
    
    if (tables.length === 0) {
      console.log('La tabla Usuario no existe en la base de datos');
      return;
    }
    
    // Obtener estructura de la tabla
    console.log('\n-- ESTRUCTURA DE TABLA: Usuario --');
    const columns = await executeQuery('DESCRIBE Usuario');
    
    console.log('Columnas:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''} ${col.Key === 'PRI' ? '(PRIMARY KEY)' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // Verificar contenido de la tabla
    console.log('\n-- CONTENIDO DE TABLA: Usuario --');
    const users = await executeQuery('SELECT * FROM Usuario LIMIT 10');
    
    if (users.length === 0) {
      console.log('La tabla Usuario no contiene registros');
    } else {
      console.log(`Total de usuarios: ${users.length}`);
      users.forEach((user, index) => {
        console.log(`\nUsuario #${index + 1}:`);
        Object.entries(user).forEach(([key, value]) => {
          // Ocultar contraseñas por seguridad
          if (key.includes('Password') || key.includes('Salt')) {
            console.log(`  ${key}: ******`);
          } else {
            console.log(`  ${key}: ${value}`);
          }
        });
      });
    }

  } catch (error) {
    console.error('Error al verificar tabla Usuario:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar la verificación
checkUsuarioTable(); 