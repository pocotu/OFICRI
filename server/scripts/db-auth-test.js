/**
 * Script para probar la conexión a la base de datos y endpoints de autenticación
 * Ayuda a diagnosticar problemas en la comunicación entre componentes
 */

// Cargar shims globales primero
require('../utils/global-shims');

require('dotenv').config();
const mysql = require('mysql2/promise');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const dbConnector = require('../utils/db-connector');
const express = require('express');
const http = require('http');

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Log con color
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Servidor de prueba
const app = express();
const PORT = process.env.TEST_PORT || 3999;
let server = null;

// -----------------------------------------------------
// PRUEBA DE CONEXIÓN A BASE DE DATOS
// -----------------------------------------------------

/**
 * Prueba la conexión a la base de datos usando la configuración de .env
 */
async function testDatabaseConnection() {
  log('\n▶️ PRUEBA DE CONEXIÓN A BASE DE DATOS', 'bright');
  log('---------------------------------------', 'bright');
  
  try {
    // Obtener configuración
    const dbConfig = dbConnector.getDbConfig();
    log(`Configuración de conexión:`, 'cyan');
    log(`Host: ${dbConfig.host}`, 'cyan');
    log(`Puerto: ${dbConfig.port}`, 'cyan');
    log(`Usuario: ${dbConfig.user}`, 'cyan');
    log(`Base de datos: ${dbConfig.database}`, 'cyan');
    
    // Probar conexión directa
    log('\nIntentando conectar a MySQL...', 'yellow');
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database
    });
    
    log('✅ Conexión establecida correctamente', 'green');
    
    // Ejecutar consulta simple
    log('\nEjecutando consulta de prueba...', 'yellow');
    const [results] = await connection.query('SELECT 1 as test');
    log(`✅ Consulta exitosa: ${JSON.stringify(results[0])}`, 'green');
    
    // Probar consulta a tabla Usuario
    try {
      log('\nConsultando tabla Usuario...', 'yellow');
      const [usuarios] = await connection.query('SELECT COUNT(*) as total FROM Usuario');
      log(`✅ La tabla Usuario tiene ${usuarios[0].total} registros`, 'green');
    } catch (userError) {
      log(`❌ Error al consultar tabla Usuario: ${userError.message}`, 'red');
    }
    
    // Cerrar conexión
    await connection.end();
    log('Conexión cerrada correctamente', 'blue');
    
    return true;
  } catch (error) {
    log(`❌ ERROR DE CONEXIÓN: ${error.message}`, 'red');
    log(`Stack: ${error.stack}`, 'red');
    return false;
  }
}

// -----------------------------------------------------
// PRUEBA DE ENDPOINTS DE AUTENTICACIÓN
// -----------------------------------------------------

/**
 * Levanta un mini servidor de prueba para verificar los endpoints de autenticación
 */
async function startTestServer() {
  log('\n▶️ INICIANDO SERVIDOR DE PRUEBA', 'bright');
  log('---------------------------------------', 'bright');
  
  // Configurar rutas de prueba
  app.get('/test', (req, res) => {
    res.json({ message: 'Servidor de prueba funcionando' });
  });
  
  // Iniciar el servidor
  return new Promise((resolve) => {
    server = http.createServer(app).listen(PORT, () => {
      log(`✅ Servidor de prueba iniciado en puerto ${PORT}`, 'green');
      resolve(true);
    });
  });
}

/**
 * Prueba los endpoints de autenticación para verificar si están respondiendo
 */
async function testAuthEndpoints() {
  log('\n▶️ PRUEBA DE ENDPOINTS DE AUTENTICACIÓN', 'bright');
  log('---------------------------------------', 'bright');
  
  const API_URL = process.env.API_URL || 'http://localhost:3000';
  
  // Probar endpoint de verificación de token
  async function testVerifyTokenEndpoint() {
    log('\nProbando endpoint: /auth/verificar-token', 'cyan');
    
    // Crear un token falso de prueba
    const fakeToken = jwt.sign(
      { id: 999, username: 'test_user' },
      process.env.JWT_SECRET || 'oficri-jwt-secret-2024-secure',
      { expiresIn: '1m' }
    );
    
    try {
      const response = await axios.get(`${API_URL}/auth/verificar-token`, {
        headers: { Authorization: `Bearer ${fakeToken}` }
      });
      
      log(`✅ Endpoint responde correctamente (${response.status})`, 'green');
      log(`Respuesta: ${JSON.stringify(response.data)}`, 'blue');
      return true;
    } catch (error) {
      if (error.response) {
        // El servidor respondió con un código de error
        log(`⚠️ El endpoint devolvió error: ${error.response.status}`, 'yellow');
        log(`Mensaje: ${JSON.stringify(error.response.data)}`, 'yellow');
        return false;
      } else if (error.request) {
        // La petición se hizo pero no se recibió respuesta
        log(`❌ Error: No hay respuesta del servidor`, 'red');
        log('Esto puede indicar que el servidor no está corriendo o hay un problema de red', 'red');
        return false;
      } else {
        // Error en la configuración de la petición
        log(`❌ Error: ${error.message}`, 'red');
        return false;
      }
    }
  }
  
  // Probar con diferentes prefijos de URL
  async function testWithDifferentPrefixes() {
    const prefixes = [
      '/auth/verificar-token',
      '/api/auth/verificar-token',
      '/v1/auth/verificar-token'
    ];
    
    let anySuccess = false;
    
    for (const prefix of prefixes) {
      log(`\nProbando ruta: ${prefix}`, 'yellow');
      
      try {
        // Crear un token falso de prueba
        const fakeToken = jwt.sign(
          { id: 999, username: 'test_user' },
          process.env.JWT_SECRET || 'oficri-jwt-secret-2024-secure',
          { expiresIn: '1m' }
        );
        
        const response = await axios.get(`${API_URL}${prefix}`, {
          headers: { Authorization: `Bearer ${fakeToken}` },
          validateStatus: false  // Aceptar cualquier código de respuesta
        });
        
        // Si recibimos 401/403 es que el endpoint existe pero rechazó el token (esperado)
        if (response.status === 401 || response.status === 403) {
          log(`✅ Encontrado endpoint válido: ${prefix} (status: ${response.status})`, 'green');
          log(`Este es el endpoint correcto a usar en el cliente`, 'bright');
          anySuccess = true;
        } else if (response.status === 404) {
          log(`❌ Endpoint no encontrado: ${prefix}`, 'red');
        } else {
          log(`⚠️ Respuesta inesperada: ${prefix} (status: ${response.status})`, 'yellow');
          log(`Respuesta: ${JSON.stringify(response.data)}`, 'blue');
          anySuccess = true;
        }
      } catch (error) {
        log(`❌ Error al probar ${prefix}: ${error.message}`, 'red');
      }
    }
    
    return anySuccess;
  }
  
  const endpointTest = await testVerifyTokenEndpoint();
  
  if (!endpointTest) {
    log('\nProbando endpoints alternativos...', 'yellow');
    await testWithDifferentPrefixes();
  }
  
  return endpointTest;
}

/**
 * Detiene el servidor de prueba
 */
function stopTestServer() {
  if (server) {
    server.close();
    log('Servidor de prueba detenido', 'blue');
  }
}

// -----------------------------------------------------
// FUNCIÓN PRINCIPAL
// -----------------------------------------------------

/**
 * Ejecuta todas las pruebas
 */
async function runAllTests() {
  log('\n===== DIAGNÓSTICO DE CONEXIÓN Y AUTENTICACIÓN =====', 'bright');
  log(`Fecha y hora: ${new Date().toLocaleString()}`, 'cyan');
  log('======================================================\n', 'bright');
  
  try {
    // 1. Probar conexión a base de datos
    const dbResult = await testDatabaseConnection();
    
    // 2. Iniciar servidor de prueba
    await startTestServer();
    
    // 3. Probar endpoints de autenticación
    const authResult = await testAuthEndpoints();
    
    // 4. Detener servidor de prueba
    stopTestServer();
    
    // 5. Mostrar resumen
    log('\n======== RESUMEN DE DIAGNÓSTICO ========', 'bright');
    log(`Conexión a base de datos: ${dbResult ? '✅ OK' : '❌ ERROR'}`, dbResult ? 'green' : 'red');
    log(`Endpoints de autenticación: ${authResult ? '✅ OK' : '⚠️ PROBLEMAS'}`, authResult ? 'green' : 'yellow');
    
    // 6. Recomendaciones según resultados
    log('\n======== RECOMENDACIONES ========', 'bright');
    if (!dbResult) {
      log('1. Verifica la configuración de la base de datos en el archivo .env', 'yellow');
      log('2. Asegúrate de que el servidor MySQL esté activo y acepte conexiones', 'yellow');
      log('3. Verifica que exista la base de datos y el usuario tenga permisos', 'yellow');
    }
    
    if (!authResult) {
      log('1. Verifica que el servidor API esté funcionando en el puerto correcto', 'yellow');
      log('2. Corrige el cliente para usar el endpoint correcto: /api/auth/verificar-token', 'yellow');
      log('3. Verifica que el middleware de autenticación esté configurado correctamente', 'yellow');
    }
    
    if (dbResult && authResult) {
      log('¡Todo funciona correctamente! 🎉', 'green');
    }
    
    log('\n======================================', 'bright');
    
  } catch (error) {
    log(`\n❌ ERROR FATAL EN PRUEBAS: ${error.message}`, 'red');
    stopTestServer();
  }
}

// Ejecutar todas las pruebas si se llama directamente
if (require.main === module) {
  runAllTests()
    .then(() => {
      log('\nDiagnóstico completado', 'green');
    })
    .catch(error => {
      log(`Error durante el diagnóstico: ${error.message}`, 'red');
      process.exit(1);
    });
}

// Exportar funciones para uso desde otros módulos
module.exports = {
  testDatabaseConnection,
  testAuthEndpoints,
  runAllTests
}; 