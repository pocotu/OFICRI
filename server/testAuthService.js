/**
 * Script para probar directamente el servicio de autenticación
 */

require('dotenv').config();
const authService = require('./services/auth/auth.service');
const { logger } = require('./utils/logger');

// Reemplazar logSecurityEvent temporalmente para la prueba
const originalLogSecurityEvent = require('./utils/logger').logSecurityEvent;
require('./utils/logger').logSecurityEvent = function mockLogSecurityEvent(eventType, data = {}) {
  console.log(`[SECURITY EVENT] ${eventType}`, data);
  return { eventType, ...data };
};

async function testLogin() {
  try {
    console.log('Intentando login con usuario administrador...');
    console.log('Credenciales: CIP=12345678, Password=Admin123!');
    
    const result = await authService.login('12345678', 'Admin123!');
    
    console.log('\nResultado del login:');
    console.log('Success:', result.success);
    console.log('User ID:', result.user.IDUsuario);
    console.log('CIP:', result.user.CodigoCIP);
    console.log('Nombre:', result.user.Nombres, result.user.Apellidos);
    console.log('Rol:', result.user.IDRol, result.user.NombreRol);
    
    // No mostrar tokens completos por seguridad
    console.log('Token JWT recibido:', result.token ? result.token.substring(0, 20) + '...' : 'None');
    console.log('Refresh Token recibido:', result.refreshToken ? result.refreshToken.substring(0, 20) + '...' : 'None');
    
    console.log('\nLogin exitoso!');
  } catch (error) {
    console.error('\nError en el login:');
    console.error('Mensaje:', error.message);
    console.error('Código de estado:', error.statusCode || 'No definido');
    console.error('Stack:', error.stack);
  }
}

// Ejecutar el test
testLogin()
  .then(() => {
    console.log('\nTest completado.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error inesperado:', error);
    process.exit(1);
  }); 