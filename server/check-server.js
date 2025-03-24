/**
 * Script de diagnóstico completo para verificar la configuración del servidor OFICRI
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { forceReconnect } = require('./utils/database-helpers');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Configura la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'Oficri_sistema',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

/**
 * Verifica si un puerto está en uso
 * @param {number} port - Puerto a verificar
 * @returns {Promise<boolean>} - true si está en uso, false si está disponible
 */
async function checkPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Puerto en uso
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false); // Puerto libre
    });
    
    server.listen(port);
  });
}

/**
 * Verifica la conexión a la base de datos
 * @returns {Promise<Object>} - Resultado de la verificación
 */
async function checkDatabaseConnection() {
  console.log(`${colors.bright}${colors.blue}Verificando conexión a la base de datos...${colors.reset}`);
  console.log(`${colors.dim}Host: ${dbConfig.host}${colors.reset}`);
  console.log(`${colors.dim}Puerto: ${dbConfig.port}${colors.reset}`);
  console.log(`${colors.dim}Usuario: ${dbConfig.user}${colors.reset}`);
  console.log(`${colors.dim}Base de datos: ${dbConfig.database}${colors.reset}`);
  
  try {
    // Intentar crear una conexión directa
    const connection = await mysql.createConnection(dbConfig);
    console.log(`${colors.green}✓ Conexión establecida${colors.reset}`);
    
    // Verificar si la base de datos existe
    const [databases] = await connection.query('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === dbConfig.database);
    
    if (dbExists) {
      console.log(`${colors.green}✓ Base de datos "${dbConfig.database}" existe${colors.reset}`);
      
      // Verificar tablas
      const [tables] = await connection.query('SHOW TABLES');
      const tableCount = tables.length;
      
      if (tableCount > 0) {
        console.log(`${colors.green}✓ La base de datos contiene ${tableCount} tablas${colors.reset}`);
        
        // Verificar si existe usuario administrador
        const [users] = await connection.query('SELECT * FROM usuario WHERE CodigoCIP = ?', ['12345678']);
        
        if (users.length > 0) {
          console.log(`${colors.green}✓ El usuario administrador existe${colors.reset}`);
          console.log(`${colors.dim}  ID: ${users[0].IDUsuario}${colors.reset}`);
          console.log(`${colors.dim}  CIP: ${users[0].CodigoCIP}${colors.reset}`);
          console.log(`${colors.dim}  Nombre: ${users[0].Nombres} ${users[0].Apellidos}${colors.reset}`);
        } else {
          console.log(`${colors.red}× No se encontró el usuario administrador${colors.reset}`);
        }
      } else {
        console.log(`${colors.red}× La base de datos no contiene tablas${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}× La base de datos "${dbConfig.database}" no existe${colors.reset}`);
    }
    
    // Cerrar la conexión
    await connection.end();
    return { success: true, dbExists, tables: tables?.length || 0 };
  } catch (error) {
    console.log(`${colors.red}× Error al conectar a la base de datos:${colors.reset}`);
    console.log(`${colors.red}${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

/**
 * Verifica la configuración del entorno
 */
async function checkEnvironment() {
  console.log(`${colors.bright}${colors.blue}Verificando variables de entorno...${colors.reset}`);
  
  // Verificar archivo .env
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    console.log(`${colors.green}✓ Archivo .env encontrado${colors.reset}`);
  } else {
    console.log(`${colors.red}× Archivo .env no encontrado${colors.reset}`);
  }
  
  // Verificar variables críticas
  const criticalVars = ['NODE_ENV', 'PORT', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
  
  criticalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`${colors.green}✓ ${varName} está definido${colors.reset}`);
    } else {
      console.log(`${colors.red}× ${varName} no está definido${colors.reset}`);
    }
  });
}

/**
 * Verifica los puertos necesarios para la aplicación
 */
async function checkPorts() {
  console.log(`${colors.bright}${colors.blue}Verificando puertos...${colors.reset}`);
  
  const portsToCheck = [3000, 3001, 3002, 3306];
  
  for (const port of portsToCheck) {
    const inUse = await checkPortInUse(port);
    
    if (port === 3306) {
      if (inUse) {
        console.log(`${colors.green}✓ Puerto ${port} (MySQL) está en uso${colors.reset}`);
      } else {
        console.log(`${colors.red}× Puerto ${port} (MySQL) no está en uso - MySQL no está ejecutándose${colors.reset}`);
      }
    } else {
      if (inUse) {
        console.log(`${colors.yellow}! Puerto ${port} está en uso${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ Puerto ${port} está disponible${colors.reset}`);
      }
    }
  }
}

/**
 * Verifica los archivos críticos del servidor
 */
function checkCriticalFiles() {
  console.log(`${colors.bright}${colors.blue}Verificando archivos críticos...${colors.reset}`);
  
  const criticalFiles = [
    '../server.js',
    '../config/database.js',
    '../scripts/init-database.js',
    '../routes/index.js',
    '../middleware/auth.middleware.js',
    '../controllers/auth.controller.js',
    '../utils/database-helpers.js',
  ];
  
  criticalFiles.forEach(filePath => {
    const fullPath = path.resolve(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`${colors.green}✓ Archivo ${path.basename(filePath)} encontrado${colors.reset}`);
    } else {
      console.log(`${colors.red}× Archivo ${path.basename(filePath)} no encontrado${colors.reset}`);
    }
  });
}

/**
 * Intenta probar un inicio de sesión básico
 */
async function testLogin() {
  console.log(`${colors.bright}${colors.blue}Probando autenticación básica...${colors.reset}`);
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.query('SELECT * FROM usuario WHERE CodigoCIP = ?', ['12345678']);
    
    if (users.length > 0) {
      console.log(`${colors.green}✓ Credenciales de prueba disponibles:${colors.reset}`);
      console.log(`${colors.cyan}  CIP: ${users[0].CodigoCIP}${colors.reset}`);
      console.log(`${colors.cyan}  Contraseña: admin123${colors.reset}`);
    } else {
      console.log(`${colors.red}× No se encontraron credenciales de prueba${colors.reset}`);
    }
    
    await connection.end();
  } catch (error) {
    console.log(`${colors.red}× Error al probar credenciales:${colors.reset}`);
    console.log(`${colors.red}${error.message}${colors.reset}`);
  }
}

/**
 * Función principal que ejecuta todos los diagnósticos
 */
async function main() {
  console.log('\n');
  console.log(`${colors.bright}${colors.magenta}========================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}      DIAGNÓSTICO COMPLETO DEL SERVIDOR OFICRI${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}========================================================${colors.reset}`);
  console.log('\n');
  
  // Forzar reconexión a la base de datos
  await forceReconnect();
  
  // Verificar entorno
  await checkEnvironment();
  console.log('\n');
  
  // Verificar puertos
  await checkPorts();
  console.log('\n');
  
  // Verificar archivos
  checkCriticalFiles();
  console.log('\n');
  
  // Verificar base de datos
  const dbResult = await checkDatabaseConnection();
  console.log('\n');
  
  // Verificar login
  if (dbResult.success && dbResult.dbExists && dbResult.tables > 0) {
    await testLogin();
  }
  
  console.log('\n');
  console.log(`${colors.bright}${colors.magenta}========================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}               DIAGNÓSTICO FINALIZADO${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}========================================================${colors.reset}`);
  console.log('\n');
  
  // Sugerencias basadas en resultados
  console.log(`${colors.bright}${colors.yellow}SUGERENCIAS:${colors.reset}`);
  
  if (!dbResult.success) {
    console.log(`${colors.yellow}1. Verifica que MySQL esté en ejecución: 'net start MySQL80'${colors.reset}`);
    console.log(`${colors.yellow}2. Confirma las credenciales de la base de datos en el archivo .env${colors.reset}`);
  } else if (!(await checkPortInUse(3000)) && !(await checkPortInUse(3001)) && !(await checkPortInUse(3002))) {
    console.log(`${colors.yellow}1. Ejecuta el servidor con: 'node server/server.js'${colors.reset}`);
    console.log(`${colors.yellow}2. O el servidor de pruebas con: 'node server/test-server.js'${colors.reset}`);
  } else {
    console.log(`${colors.yellow}1. Si hay un servidor en ejecución pero no responde, reinicia el proceso${colors.reset}`);
    console.log(`${colors.yellow}2. Usa 'taskkill /F /IM node.exe' para finalizar todos los procesos de Node.js${colors.reset}`);
  }
  
  console.log(`${colors.yellow}3. Usa Postman para probar la API con estas URL:${colors.reset}`);
  console.log(`${colors.yellow}   - http://localhost:3000/api/auth/login (servidor principal)${colors.reset}`);
  console.log(`${colors.yellow}   - http://localhost:3002/api/auth/login (servidor de pruebas)${colors.reset}`);
  
  console.log('\n');
}

// Ejecutar diagnóstico
main().catch(error => {
  console.error('Error en el diagnóstico:', error);
  process.exit(1);
}); 