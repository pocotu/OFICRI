/**
 * Script de prueba de conexión
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testConnection() {
  console.log('=== PRUEBA DE CONEXIÓN A BASE DE DATOS ===');
  console.log(`DB_HOST: ${process.env.DB_HOST}`);
  console.log(`DB_USER: ${process.env.DB_USER}`);
  console.log(`DB_NAME: ${process.env.DB_NAME}`);
  console.log('Contraseña: ***********');

  try {
    // Crear conexión
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Conexión establecida exitosamente');

    // Probar consulta simple
    const [rows] = await connection.query('SELECT 1 as test');
    console.log('Consulta de prueba exitosa:', rows);

    // Probar una consulta real
    console.log('\nConsultando tablas existentes:');
    const [tables] = await connection.query('SHOW TABLES');
    tables.forEach(table => {
      console.log(`- ${Object.values(table)[0]}`);
    });

    await connection.end();
    console.log('\nConexión cerrada correctamente');
  } catch (error) {
    console.error('Error en la conexión:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Credenciales de acceso incorrectas. Verifique usuario y contraseña.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('No se pudo conectar al servidor MySQL. Verifique que el servidor esté en ejecución.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('La base de datos no existe. Necesita crearla primero.');
    }
  }
}

testConnection(); 