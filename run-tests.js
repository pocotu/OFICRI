const { execSync } = require('child_process');

try {
  console.log('Ejecutando pruebas de validación...');
  const output = execSync('npx jest --runInBand server/tests/middleware/validation.comprehensive.test.js', { 
    encoding: 'utf8',
    stdio: 'inherit'
  });
  console.log(output);
} catch (error) {
  console.error('Error al ejecutar las pruebas:', error.message);
  process.exit(1);
} 