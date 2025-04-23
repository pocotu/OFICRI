/**
 * Script para iniciar un módulo específico sin depender de workspaces
 * Uso: node scripts/start-individual.js [nombre-modulo]
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Obtener el módulo del argumento de línea de comandos
const moduleName = process.argv[2];

if (!moduleName) {
  console.log(chalk.red('❌ Error: Debe especificar un nombre de módulo'));
  console.log(chalk.yellow('Uso: node scripts/start-individual.js [nombre-modulo]'));
  console.log(chalk.yellow('Módulos disponibles:'));
  
  // Listar módulos disponibles
  const modulesDir = path.join(__dirname, '..');
  fs.readdirSync(modulesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .filter(dirent => fs.existsSync(path.join(modulesDir, dirent.name, 'package.json')))
    .forEach(dirent => {
      console.log(chalk.yellow(`  - ${dirent.name}`));
    });
    
  process.exit(1);
}

// Verificar que el módulo existe
const modulePath = path.join(__dirname, '..', moduleName);

if (!fs.existsSync(modulePath)) {
  console.log(chalk.red(`❌ Error: El módulo "${moduleName}" no existe`));
  process.exit(1);
}

// Verificar que tiene package.json
const packagePath = path.join(modulePath, 'package.json');

if (!fs.existsSync(packagePath)) {
  console.log(chalk.red(`❌ Error: El módulo "${moduleName}" no tiene un package.json`));
  process.exit(1);
}

// Verificar que tiene script dev
let packageData;
try {
  packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (!packageData.scripts || !packageData.scripts.dev) {
    console.log(chalk.red(`❌ Error: El módulo "${moduleName}" no tiene un script "dev" definido`));
    process.exit(1);
  }
} catch (error) {
  console.log(chalk.red(`❌ Error leyendo package.json de "${moduleName}": ${error.message}`));
  process.exit(1);
}

// Iniciar el módulo
console.log(chalk.blue(`🚀 OFICRI - Iniciando módulo "${moduleName}"`));
console.log(chalk.yellow('⏳ Ejecutando npm run dev...'));

try {
  execSync('npm run dev', { 
    cwd: modulePath, 
    stdio: 'inherit',
    env: {
      ...process.env,
      // Asegurar que las dependencias de tipo workspace se resuelvan desde node_modules
      NODE_PATH: path.join(__dirname, '..', 'node_modules')
    }
  });
} catch (error) {
  console.log(chalk.red(`\n❌ Error iniciando el módulo "${moduleName}": ${error.message}`));
  process.exit(1);
} 