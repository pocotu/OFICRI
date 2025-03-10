require('dotenv').config();
const { initializeDatabase } = require('../src/scripts/init-database');

console.log('Iniciando configuración inicial del sistema...');

initializeDatabase()
    .then(() => {
        console.log('Configuración inicial completada exitosamente');
        console.log('\nPuede iniciar sesión con las siguientes credenciales:');
        console.log('CIP: 12345678');
        console.log('Contraseña: admin123');
        process.exit(0);
    })
    .catch(error => {
        console.error('Error durante la configuración inicial:', error);
        process.exit(1);
    }); 