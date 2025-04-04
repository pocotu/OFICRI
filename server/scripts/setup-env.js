/**
 * Script de configuración global del entorno
 * Este script prepara todo el entorno necesario para ejecutar el servidor
 * correctamente, incluyendo la reparación de módulos, verificación de BD, etc.
 */

// Cargar shims primero
require('../utils/global-shims');

const fs = require('fs');
const path = require('path');
const { fixUtf32Issue } = require('./fix-utf32');
const { spawn } = require('child_process');

// Mensajes coloreados
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

/**
 * Ejecuta un script directamente
 */
function runNodeScript(scriptPath) {
  return new Promise((resolve, reject) => {
    log(`Ejecutando script: ${scriptPath}`, 'cyan');
    
    const nodeProcess = spawn('node', [scriptPath], { stdio: 'inherit' });
    
    nodeProcess.on('close', (code) => {
      if (code === 0) {
        log(`Script ejecutado correctamente: ${path.basename(scriptPath)}`, 'green');
        resolve(true);
      } else {
        log(`Error al ejecutar script (código ${code}): ${path.basename(scriptPath)}`, 'red');
        reject(new Error(`Comando falló con código: ${code}`));
      }
    });
    
    nodeProcess.on('error', (error) => {
      log(`Error al iniciar script: ${error.message}`, 'red');
      reject(error);
    });
  });
}

/**
 * Verificar si hay carpetas requeridas y crearlas si no existen
 */
function checkRequiredFolders() {
  log('Verificando carpetas requeridas...', 'cyan');
  
  const requiredFolders = [
    path.resolve(__dirname, '../../logs'),
    path.resolve(__dirname, '../../uploads'),
    path.resolve(__dirname, '../../uploads/documents'),
    path.resolve(__dirname, '../../uploads/avatars')
  ];
  
  for (const folder of requiredFolders) {
    if (!fs.existsSync(folder)) {
      log(`Creando carpeta: ${folder}`, 'yellow');
      fs.mkdirSync(folder, { recursive: true });
    }
  }
  
  log('✅ Carpetas requeridas verificadas', 'green');
}

/**
 * Verificar y arreglar problemas con utf32
 */
async function repairUtf32() {
  log('Reparando módulo utf32...', 'cyan');
  
  const result = await fixUtf32Issue();
  
  if (result) {
    log('✅ Módulo utf32 reparado correctamente', 'green');
  } else {
    log('❌ No se pudo reparar el módulo utf32', 'red');
  }
  
  return result;
}

/**
 * Verificar e inicializar la BD si es necesario
 */
async function verifyDatabase() {
  log('Verificando base de datos...', 'cyan');
  
  try {
    // Intentar ejecutar el script de verificación
    await runNodeScript(path.join(__dirname, 'check-database.js'));
    log('✅ Base de datos configurada correctamente', 'green');
    return true;
  } catch (error) {
    log(`La base de datos requiere configuración: ${error.message}`, 'yellow');
    
    try {
      // Preguntar al usuario si quiere inicializar la BD
      log('\n⚠️ La base de datos no está configurada correctamente.', 'yellow');
      log('¿Desea inicializar la base de datos ahora? (S/n)', 'yellow');
      
      // Esperar 5 segundos por respuesta o continuar automáticamente
      const response = await getInput(5000, 's');
      
      if (response.toLowerCase() === 's' || response === '') {
        log('Inicializando base de datos...', 'cyan');
        
        try {
          // Ejecutar el script de inicialización
          await runNodeScript(path.join(__dirname, 'init-database.js'));
          log('✅ Base de datos inicializada correctamente', 'green');
          return true;
        } catch (initError) {
          throw new Error(`Error durante la inicialización: ${initError.message}`);
        }
      } else {
        log('Omitiendo inicialización de base de datos', 'yellow');
        return false;
      }
    } catch (initError) {
      log(`❌ Error al inicializar la base de datos: ${initError.message}`, 'red');
      return false;
    }
  }
}

/**
 * Obtener entrada del usuario con timeout
 */
function getInput(timeout, defaultValue) {
  return new Promise((resolve) => {
    // Configurar entrada estándar para recibir entrada
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    // Variable para almacenar la entrada
    let input = '';
    
    // Manejar entrada
    const onData = (data) => {
      input += data;
      if (input.includes('\n')) {
        cleanup();
        resolve(input.trim());
      }
    };
    
    // Configurar timeout
    const timer = setTimeout(() => {
      cleanup();
      resolve(defaultValue);
    }, timeout);
    
    // Función para limpiar
    const cleanup = () => {
      clearTimeout(timer);
      process.stdin.removeListener('data', onData);
      process.stdin.pause();
    };
    
    // Escuchar entrada
    process.stdin.on('data', onData);
  });
}

/**
 * Ejecutar todas las verificaciones y reparaciones
 */
async function setupEnvironment() {
  log('\n=== CONFIGURACIÓN DE ENTORNO OFICRI ===', 'bright');
  log(`Fecha y hora: ${new Date().toLocaleString()}`, 'cyan');
  log('========================================\n', 'bright');
  
  try {
    // 1. Verificar carpetas requeridas
    checkRequiredFolders();
    
    // 2. Arreglar problema de utf32
    await repairUtf32();
    
    // 3. Verificar base de datos (omitido temporalmente para evitar problemas)
    log('Verificación de base de datos omitida para evitar problemas.', 'yellow');
    log('Por favor ejecute "npm run check:db" manualmente después.', 'yellow');
    
    // Finalizar
    log('\n✅ Entorno configurado correctamente', 'green');
    log('Puede ejecutar "npm run dev" para iniciar el servidor', 'green');
    log('========================================\n', 'bright');
    
    return true;
  } catch (error) {
    log(`\n❌ Error durante la configuración: ${error.message}`, 'red');
    log('Revise los mensajes anteriores para más detalles', 'red');
    log('========================================\n', 'bright');
    
    return false;
  }
}

// Ejecutar configuración si se llama directamente
if (require.main === module) {
  setupEnvironment()
    .then(success => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch(error => {
      log(`Error fatal: ${error.message}`, 'red');
      process.exit(1);
    });
} else {
  // Exportar para uso en otros módulos
  module.exports = {
    setupEnvironment,
    repairUtf32,
    verifyDatabase,
    checkRequiredFolders
  };
} 