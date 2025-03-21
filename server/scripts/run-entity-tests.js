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
    
    if (!fs.existsSync(testPath)) {
      console.error(`No se encontró el archivo de prueba para la entidad "${entity}"`);
      console.log('Entidades disponibles:');
      availableTests.forEach(test => console.log(`- ${test}`));
      process.exit(1);
    }
    
    console.log(`\nEjecutando pruebas para la entidad: ${entity}`);
    console.log('----------------------------------------');
    
    try {
      execSync(`npx jest ${testPath} --forceExit`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Error al ejecutar las pruebas para ${entity}:`, error.message);
      process.exit(1);
    }
  } else {
    // Ejecutar todas las pruebas de entidades
    console.log('\nEjecutando pruebas para todas las entidades:');
    console.log('----------------------------------------');
    availableTests.forEach(test => console.log(`- ${test}`));
    console.log('----------------------------------------\n');
    
    try {
      execSync(`npx jest ${ENTITY_TEST_DIR} --forceExit`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Error al ejecutar todas las pruebas:', error.message);
      process.exit(1);
    }
  }
}

// Mostrar mensaje informativo si es necesario
if (!entityArg) {
  console.log('No se especificó una entidad, se ejecutarán todas las pruebas de entidades.');
}

// Ejecutar las pruebas
runTests(entityArg); 