const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Ejecutando script de datos de sandbox...');
  
  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'sandbox-data.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Establecer conexión con la base de datos
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'kali',
      multipleStatements: true // Importante para ejecutar múltiples consultas
    });
    
    console.log('Conexión establecida con MySQL');
    
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