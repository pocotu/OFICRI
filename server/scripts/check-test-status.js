/**
 * Script para verificar el estado de las pruebas
 * Ejecuta Jest y analiza el resultado para mostrar el status general
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const outputFile = path.join(__dirname, '..', '..', 'test-results.json');

console.log('Ejecutando pruebas para verificar su estado...');

try {
  // Ejecutar pruebas y guardar resultados en un archivo JSON
  execSync(`npm test -- --json > ${outputFile}`, { 
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf-8'
  });
  
  console.log(`Pruebas ejecutadas. Analizando resultados...`);
  
  // Leer el archivo de resultados
  const testResults = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
  
  // Analizar resultados
  const testSuites = testResults.testResults;
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let pendingTests = 0;
  
  const failedTestFiles = [];
  
  // Procesar cada archivo de prueba
  testSuites.forEach(suite => {
    const relativePath = suite.name.replace(process.cwd(), '').replace(/\\/g, '/');
    const status = suite.status;
    const numFailingTests = suite.numFailingTests;
    const numPassingTests = suite.numPassingTests;
    const numPendingTests = suite.numPendingTests;
    
    totalTests += numFailingTests + numPassingTests + numPendingTests;
    passedTests += numPassingTests;
    failedTests += numFailingTests;
    pendingTests += numPendingTests;
    
    if (numFailingTests > 0) {
      failedTestFiles.push({
        path: relativePath,
        numFailingTests,
        numPassingTests,
        numPendingTests,
        message: suite.message,
        failureMessages: suite.failureMessage
      });
    }
  });
  
  // Imprimir un resumen general
  console.log('=== RESUMEN DE PRUEBAS ===');
  console.log(`Total de pruebas: ${totalTests}`);
  console.log(`Pasaron: ${passedTests}`);
  console.log(`Fallaron: ${failedTests}`);
  console.log(`Pendientes: ${pendingTests}`);
  console.log('=========================');
  
  // Imprimir los archivos con pruebas fallidas
  if (failedTestFiles.length > 0) {
    console.log('\n=== ARCHIVOS CON PRUEBAS FALLIDAS ===');
    failedTestFiles.forEach(file => {
      console.log(`\n${file.path}`);
      console.log(`  Fallidas: ${file.numFailingTests}, Pasaron: ${file.numPassingTests}, Pendientes: ${file.numPendingTests}`);
      
      // Intentar buscar mensajes de error específicos
      if (file.failureMessages) {
        console.log('  Mensajes de error:');
        console.log(`  ${file.failureMessages}`);
      }
    });
  } else {
    console.log('\n¡TODAS LAS PRUEBAS PASARON CORRECTAMENTE!');
  }
  
  // Limpiar archivo temporal
  fs.unlinkSync(outputFile);
  
} catch (error) {
  console.error(`Error al ejecutar las pruebas: ${error.message}`);
  
  // Intentar leer el archivo si existe
  if (fs.existsSync(outputFile)) {
    console.log('Contenido parcial del archivo de resultados:');
    try {
      const content = fs.readFileSync(outputFile, 'utf-8');
      console.log(content.substring(0, 1000) + '...');
      fs.unlinkSync(outputFile);
    } catch (readError) {
      console.error(`Error al leer el archivo de resultados: ${readError.message}`);
    }
  }
} 