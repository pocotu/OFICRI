/**
 * Script para limpiar node_modules y archivos de build de todos los módulos del cliente OFICRI
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const rimraf = require('rimraf');

// Directorios que pueden contener node_modules
const directories = [
  '.',
  './shell',
  './auth',
  './documents',
  './mesa-partes',
  './users',
  './dashboard',
  './areas',
  './security',
  './shared',
  './main'
];

// Directorios de build para buscar y eliminar
const buildDirs = ['dist', 'build', '.cache', '.temp'];

console.log(chalk.blue('🧹 OFICRI - Limpieza de módulos'));
console.log(chalk.yellow('⏳ Iniciando limpieza en todos los módulos...'));

// Contador para estadísticas
let cleanedModules = 0;
let cleanedBuilds = 0;

// Limpiar en cada directorio
directories.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  const moduleDir = path.join(fullPath, 'node_modules');
  
  if (fs.existsSync(fullPath)) {
    console.log(chalk.cyan(`\n➡️ Procesando ${dir}...`));
    
    // Eliminar node_modules
    if (fs.existsSync(moduleDir)) {
      try {
        console.log(chalk.yellow(`   Eliminando node_modules en ${dir}...`));
        rimraf.sync(moduleDir);
        console.log(chalk.green(`   ✅ node_modules eliminado en ${dir}`));
        cleanedModules++;
      } catch (error) {
        console.error(chalk.red(`   ❌ Error eliminando node_modules en ${dir}:`));
        console.error(chalk.red(`   ${error.message}`));
      }
    }
    
    // Eliminar directorios de build
    buildDirs.forEach(buildDir => {
      const buildPath = path.join(fullPath, buildDir);
      if (fs.existsSync(buildPath)) {
        try {
          console.log(chalk.yellow(`   Eliminando ${buildDir} en ${dir}...`));
          rimraf.sync(buildPath);
          console.log(chalk.green(`   ✅ ${buildDir} eliminado en ${dir}`));
          cleanedBuilds++;
        } catch (error) {
          console.error(chalk.red(`   ❌ Error eliminando ${buildDir} en ${dir}:`));
          console.error(chalk.red(`   ${error.message}`));
        }
      }
    });
    
    // Limpiar archivos de lock si existen
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    lockFiles.forEach(lockFile => {
      const lockPath = path.join(fullPath, lockFile);
      if (fs.existsSync(lockPath)) {
        try {
          console.log(chalk.yellow(`   Eliminando ${lockFile} en ${dir}...`));
          fs.unlinkSync(lockPath);
          console.log(chalk.green(`   ✅ ${lockFile} eliminado en ${dir}`));
        } catch (error) {
          console.error(chalk.red(`   ❌ Error eliminando ${lockFile} en ${dir}:`));
          console.error(chalk.red(`   ${error.message}`));
        }
      }
    });
  }
});

// Mostrar resumen
console.log('\n' + chalk.blue('📊 Resumen de limpieza:'));
console.log(chalk.green(`✅ ${cleanedModules} directorios node_modules eliminados`));
console.log(chalk.green(`✅ ${cleanedBuilds} directorios de build eliminados`));
console.log(chalk.green('\n🎉 Limpieza completada! El proyecto está listo para una instalación limpia.'));
console.log(chalk.blue('💡 Ejecute "npm run install-all" para reinstalar todas las dependencias.')); 