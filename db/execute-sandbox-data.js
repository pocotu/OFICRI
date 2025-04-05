const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
// Cargar variables de entorno desde el archivo .env en la raíz
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  console.log('Ejecutando script de datos de sandbox...');
  
  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'sandbox-data.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Establecer conexión con la base de datos usando variables de entorno
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'Oficri_sistema',
      multipleStatements: true // Importante para ejecutar múltiples consultas
    });
    
    console.log('Conexión establecida con MySQL');
    console.log(`Host: ${process.env.DB_HOST}, Base de datos: ${process.env.DB_NAME}`);
    
    // Ejecutar el script SQL completo
    console.log('Ejecutando script SQL...');
    await connection.query(sqlContent);
    
    console.log('Script ejecutado correctamente');
    
    // Cerrar la conexión
    await connection.end();
    
  } catch (error) {
    console.error('Error al ejecutar el script:', error);
    process.exit(1);
  }
}

main(); 