/**
 * Script para comprobar la conexión a la base de datos
 */

require('dotenv').config();
const { executeQuery } = require('./config/database');

async function main() {
  try {
    console.log('Comprobando la conexión a la base de datos...');
    
    // Comprobar las tablas existentes
    const tables = await executeQuery('SHOW TABLES');
    console.log('Tablas en la base de datos:');
    tables.forEach(table => {
      console.log(`- ${Object.values(table)[0]}`);
    });
    
    // Comprobar si existe el usuario administrador
    const user = await executeQuery('SELECT * FROM Usuario WHERE CodigoCIP = ?', ['12345678']);
    if (user.length > 0) {
      console.log('Usuario administrador encontrado:');
      console.log(`ID: ${user[0].IDUsuario}`);
      console.log(`CIP: ${user[0].CodigoCIP}`);
      console.log(`Nombre: ${user[0].Nombres} ${user[0].Apellidos}`);
      console.log(`Rol: ${user[0].IDRol}`);
    } else {
      console.log('Usuario administrador no encontrado');
    }
    
    // Comprobar la estructura de la tabla Usuario
    const userStructure = await executeQuery('DESCRIBE Usuario');
    console.log('\nEstructura de la tabla Usuario:');
    userStructure.forEach(field => {
      console.log(`- ${field.Field}: ${field.Type} ${field.Null === 'NO' ? 'NOT NULL' : ''} ${field.Key}`);
    });
    
    console.log('\nComprobación completa.');
  } catch (error) {
    console.error('Error al comprobar la base de datos:', error);
  }
}

main(); 