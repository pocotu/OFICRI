/**
 * Script para construir (build) todos los módulos del cliente OFICRI para producción
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Directorios que contienen package.json, en orden de dependencias
// Primero construir shared, luego los demás componentes, y finalmente el shell
const buildOrder = [
  './shared',
  './auth',
  './documents',
  './mesa-partes',
  './users',
  './dashboard',
  './areas',
  './security',
  './main',
  './shell'
];

console.log(chalk.blue('🔨 OFICRI - Construcción para producción'));
console.log(chalk.yellow('⏳ Iniciando build en todos los módulos...'));

// Contador para estadísticas
let successCount = 0;
let errorCount = 0;

// Construir en cada directorio según el orden
buildOrder.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  const packagePath = path.join(fullPath, 'package.json');
  
  if (fs.existsSync(packagePath)) {
    try {
      // Verificar que tenga script build
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      if (!packageJson.scripts || !packageJson.scripts.build) {
        console.log(chalk.yellow(`⚠️ No existe script 'build' en ${dir}, omitiendo...`));
        return;
      }
      
      console.log(chalk.cyan(`\n➡️ Construyendo ${dir}...`));
      execSync('npm run build', { cwd: fullPath, stdio: 'inherit' });
      console.log(chalk.green(`✅ Build completado en ${dir}`));
      successCount++;
    } catch (error) {
      console.error(chalk.red(`❌ Error al construir ${dir}:`));
      console.error(chalk.red(error.message));
      errorCount++;
    }
  } else {
    console.log(chalk.yellow(`⚠️ No existe package.json en ${dir}, omitiendo...`));
  }
});

// Mostrar resumen
console.log('\n' + chalk.blue('📊 Resumen de build:'));
console.log(chalk.green(`✅ Módulos construidos correctamente: ${successCount}`));

if (errorCount > 0) {
  console.log(chalk.red(`❌ Módulos con errores: ${errorCount}`));
  console.log(chalk.yellow('⚠️ Revise los mensajes de error y vuelva a intentarlo en los módulos fallidos'));
  process.exit(1);
} else {
  console.log(chalk.green('\n🎉 Todos los módulos construidos correctamente!'));
  console.log(chalk.blue('📁 Los archivos de producción están listos para ser desplegados'));
} 