// Script temporal para inicializar la base de datos
require('dotenv').config({ path: '../.env' }); // Carga variables de entorno desde el archivo raíz

const { initializeDatabase } = require('./scripts/init-database');

console.log('Variables de entorno cargadas:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[EXISTE]' : '[NO EXISTE]');

initializeDatabase()
    .then(() => {
        console.log('Base de datos inicializada correctamente');
        console.log('Usuario administrador creado:');
        console.log('- CIP: 12345678');
        console.log('- Contraseña: admin123');
        process.exit(0);
    })
    .catch(error => {
        console.error('Error al inicializar la base de datos:', error);
        process.exit(1);
    }); 