/**
 * Script para ejecutar las pruebas con diferentes opciones
 * Facilita la ejecución de pruebas específicas y configuraciones
 */

const { spawn } = require('child_process');
const path = require('path');

// Obtener argumentos de la línea de comandos
const args = process.argv.slice(2);
let testType = 'all';
let testPattern = '';
let watch = false;
let coverage = true;

// Procesar argumentos
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--type':
    case '-t':
      testType = args[++i] || 'all';
      break;
    case '--pattern':
    case '-p':
      testPattern = args[++i] || '';
      break;
    case '--watch':
    case '-w':
      watch = true;
      break;
    case '--no-coverage':
    case '-nc':
      coverage = false;
      break;
    case '--help':
    case '-h':
      showHelp();
      process.exit(0);
      break;
  }
}

// Mostrar ayuda
function showHelp() {
  console.log(`
Uso: node run-tests.js [opciones]

Opciones:
  --type, -t       Tipo de prueba a ejecutar (all, unit, integration, api, auth, database, logger)
  --pattern, -p    Patrón de nombre de prueba a ejecutar
  --watch, -w      Ejecutar pruebas en modo watch
  --no-coverage, -nc  No generar reporte de cobertura
  --help, -h       Mostrar esta ayuda
  
Ejemplos:
  node run-tests.js                        Ejecutar todas las pruebas
  node run-tests.js -t auth                Ejecutar pruebas de autenticación
  node run-tests.js -p "Debería rechazar"  Ejecutar pruebas que contengan ese texto
  node run-tests.js -w                     Ejecutar en modo watch (reejecutar cuando hay cambios)
  `);
}

// Configurar comando de prueba
let testCommand = 'jest';
const testArgs = [];

// Configurar tipo de prueba
if (testType !== 'all') {
  const testFileMap = {
    'integration': 'integration.test.js',
    'api': 'api.test.js',
    'auth': 'auth.test.js',
    'database': 'database.test.js',
    'logger': 'logger.test.js'
  };
  
  const testFile = testFileMap[testType];
  
  if (testFile) {
    testArgs.push(testFile);
  } else {
    console.error(`Tipo de prueba no reconocido: ${testType}`);
    process.exit(1);
  }
}

// Configurar patrón de prueba
if (testPattern) {
  testArgs.push('-t', testPattern);
}

// Configurar modo watch
if (watch) {
  testArgs.push('--watch');
}

// Configurar cobertura
if (coverage) {
  testArgs.push('--coverage');
}

// Agregar --runInBand para ejecutar secuencialmente
testArgs.push('--runInBand');

// Configurar entorno de prueba
const env = {
  ...process.env,
  NODE_ENV: 'test'
};

// Ejecutar pruebas
console.log(`Ejecutando: ${testCommand} ${testArgs.join(' ')}`);
const testProcess = spawn('npx', [testCommand, ...testArgs], {
  env,
  stdio: 'inherit',
  shell: true
});

// Manejar finalización
testProcess.on('close', (code) => {
  console.log(`Proceso de pruebas terminado con código: ${code}`);
  process.exit(code);
});

// Manejar errores
testProcess.on('error', (err) => {
  console.error('Error al ejecutar las pruebas:', err);
  process.exit(1);
}); 