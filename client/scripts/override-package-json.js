/**
 * Script para modificar temporalmente los package.json de los módulos
 * y evitar errores de dependencias workspace:* durante el desarrollo
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Directorios de los módulos
const modules = [
  'shell',
  'auth',
  'documents',
  'mesa-partes',
  'users',
  'dashboard',
  'areas',
  'security',
  'shared',
  'main'
];

// Copia de seguridad del package.json original
const backupDir = path.join(__dirname, 'package-backups');

// Crear directorio de backup si no existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Variable para saber si estamos aplicando o revirtiendo cambios
const isRevert = process.argv.includes('--revert');

console.log(chalk.blue(`🔧 OFICRI - ${isRevert ? 'Revirtiendo' : 'Aplicando'} modificaciones a package.json`));

// Patrón para encontrar referencias workspace:*
const workspaceRegex = /"workspace:\*/g;

// Función para modificar un package.json
function processPackageJson(modulePath, moduleBackupPath, isRevert) {
  try {
    if (isRevert) {
      // Si estamos revirtiendo, copiar el backup si existe
      if (fs.existsSync(moduleBackupPath)) {
        fs.copyFileSync(moduleBackupPath, modulePath);
        console.log(chalk.green(`✅ Restaurado ${modulePath} desde backup`));
        return true;
      } else {
        console.log(chalk.yellow(`⚠️ No existe backup para ${modulePath}, omitiendo...`));
        return false;
      }
    } else {
      // Si estamos aplicando cambios, crear backup y modificar
      const packageData = fs.readFileSync(modulePath, 'utf8');
      
      // Crear backup
      fs.writeFileSync(moduleBackupPath, packageData);
      
      // Verificar si hay referencias workspace:*
      if (workspaceRegex.test(packageData)) {
        // Reemplazar referencias workspace:* con *
        const modifiedData = packageData.replace(workspaceRegex, '"*');
        fs.writeFileSync(modulePath, modifiedData);
        console.log(chalk.green(`✅ Modificado ${modulePath} (referencias workspace:* → *)`));
        return true;
      } else {
        console.log(chalk.yellow(`⚠️ No se encontraron referencias workspace:* en ${modulePath}`));
        return false;
      }
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error procesando ${modulePath}: ${error.message}`));
    return false;
  }
}

// Contador para estadísticas
let processedCount = 0;
let skippedCount = 0;

// Procesar cada módulo
modules.forEach(moduleName => {
  const modulePath = path.join(__dirname, '..', moduleName, 'package.json');
  const moduleBackupPath = path.join(backupDir, `${moduleName}-package.json.bak`);
  
  if (fs.existsSync(modulePath)) {
    const wasProcessed = processPackageJson(modulePath, moduleBackupPath, isRevert);
    if (wasProcessed) {
      processedCount++;
    } else {
      skippedCount++;
    }
  } else {
    console.log(chalk.yellow(`⚠️ No existe ${modulePath}, omitiendo...`));
    skippedCount++;
  }
});

// Mostrar resumen
console.log('\n' + chalk.blue('📊 Resumen:'));
console.log(chalk.green(`✅ Módulos ${isRevert ? 'restaurados' : 'modificados'}: ${processedCount}`));
console.log(chalk.yellow(`⚠️ Módulos omitidos: ${skippedCount}`));

if (!isRevert) {
  console.log(chalk.blue('\n💡 Ahora puedes ejecutar "npm run dev" para iniciar todos los módulos.'));
  console.log(chalk.yellow('   Para revertir estos cambios, ejecuta "node scripts/override-package-json.js --revert"'));
} else {
  console.log(chalk.blue('\n💡 Los package.json han sido restaurados a su estado original.'));
} 