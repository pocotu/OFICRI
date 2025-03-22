/**
 * Script para ejecutar pruebas de entidades de la base de datos
 * 
 * Uso: node server/scripts/run-entity-tests.js [entidad]
 * Ejemplo: node server/scripts/run-entity-tests.js usuario
 * 
 * Si no se especifica una entidad, se ejecutarán todas las pruebas
 */
process.env.NODE_ENV = 'test';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Directorio donde están las pruebas de entidades
const ENTITY_TEST_DIR = path.join(__dirname, '../tests/entity');

// Obtener la entidad a probar desde los argumentos
const entityArg = process.argv[2];

// Función para listar todas las pruebas de entidades disponibles
function getEntityTests() {
  if (!fs.existsSync(ENTITY_TEST_DIR)) {
    console.error(`El directorio de pruebas no existe: ${ENTITY_TEST_DIR}`);
    process.exit(1);
  }
  
  // Obtener todos los archivos de prueba en el directorio
  return fs.readdirSync(ENTITY_TEST_DIR)
    .filter(file => file.endsWith('.test.js'))
    .map(file => path.basename(file, '.test.js'));
}

// Ejecutar las pruebas
function runTests(entity) {
  const availableTests = getEntityTests();
  
  if (entity) {
    // Verificar que la entidad existe
    const testFile = `${entity}.test.js`;
    const testPath = path.join(ENTITY_TEST_DIR, testFile);
    
    // Imprimir información sobre la ruta del test
    console.log(`Ruta completa del test: ${testPath}`);
    console.log(`¿El archivo existe? ${fs.existsSync(testPath) ? 'Sí' : 'No'}`);
    
    if (!fs.existsSync(testPath)) {
      console.error(`No se encontró el archivo de prueba para la entidad "${entity}"`);
      console.log('Entidades disponibles:');
      availableTests.forEach(test => console.log(`- ${test}`));
      process.exit(1);
    }
    
    console.log(`\nEjecutando pruebas para la entidad: ${entity}`);
    console.log('----------------------------------------');
    
    try {
      // Usar el patrón de prueba en lugar de la ruta completa
      const testPattern = `server/tests/entity/${testFile}`;
      const command = `npx jest ${testPattern} --forceExit`;
      console.log(`Ejecutando comando: ${command}`);
      execSync(command, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Error al ejecutar las pruebas para ${entity}:`, error.message);
      console.error(`Código de salida: ${error.status}`);
      if (error.stderr) {
        console.error(`Error estándar: ${error.stderr.toString()}`);
      }
      process.exit(1);
    }
  } else {
    // Ejecutar todas las pruebas de entidades
    console.log('\nEjecutando pruebas para todas las entidades:');
    console.log('----------------------------------------');
    availableTests.forEach(test => console.log(`- ${test}`));
    console.log('----------------------------------------\n');
    
    try {
      // Ejecutar cada prueba individualmente para garantizar que todas se ejecuten
      let allPassed = true;
      
      for (const test of availableTests) {
        console.log(`\nEjecutando pruebas para: ${test}`);
        console.log('----------------------------------------');
        
        try {
          const testPattern = `server/tests/entity/${test}.test.js`;
          const command = `npx jest ${testPattern} --forceExit`;
          console.log(`Ejecutando comando: ${command}`);
          execSync(command, { stdio: 'inherit' });
        } catch (error) {
          console.error(`Error al ejecutar las pruebas para ${test}:`, error.message);
          allPassed = false;
          // Continuar con la siguiente prueba en lugar de salir inmediatamente
        }
      }
      
      if (!allPassed) {
        console.error('\nAlgunas pruebas fallaron. Revisar los mensajes de error anteriores.');
        process.exit(1);
      }
    } catch (error) {
      console.error('Error al ejecutar todas las pruebas:', error.message);
      process.exit(1);
    }
  }
}

// Mostrar mensaje informativo si es necesario
if (!entityArg) {
  console.log('No se especificó una entidad, se ejecutarán todas las pruebas de entidades.');
} else {
  console.log(`Entidad a probar: ${entityArg}`);
}

// Ejecutar las pruebas
runTests(entityArg); 