/**
 * Configuración de pruebas
 * Establece el entorno de pruebas
 */

const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno de prueba
// Primero cargamos las variables de entorno normales
dotenv.config({
  path: path.join(__dirname, '../../.env')
});

// Luego cargamos las específicas de prueba, que pueden sobrescribir las anteriores
dotenv.config({
  path: path.join(__dirname, '../../.env.test')
});

// Configurar variables de entorno por defecto para pruebas
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
// Aseguramos que se use la contraseña correcta (kali)
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'Oficri_sistema';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'kali';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_PASSWORD = '';
process.env.JWT_SECRET = 'test-secret-key';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.TEST_USER_EMAIL = 'test@example.com';
process.env.TEST_USER_PASSWORD = 'test123';

// Configurar timeouts de Jest
jest.setTimeout(10000);

// Configurar console.error para no mostrar errores esperados en las pruebas
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Limpiar mocks después de cada prueba
afterEach(() => {
  jest.clearAllMocks();
}); 