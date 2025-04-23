/**
 * Script para instalar dependencias en todos los módulos del cliente OFICRI usando Yarn
 * Específicamente diseñado para manejar referencias workspace:*
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Verificar que Yarn está instalado
try {
  execSync('yarn --version', { stdio: 'pipe' });
  console.log(chalk.green('✅ Yarn detectado correctamente'));
} catch (error) {
  console.log(chalk.red('❌ Yarn no está instalado. Instalando Yarn globalmente...'));
  try {
    execSync('npm install -g yarn', { stdio: 'inherit' });
    console.log(chalk.green('✅ Yarn instalado correctamente'));
  } catch (error) {
    console.error(chalk.red('❌ Error instalando Yarn:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

console.log(chalk.blue('📦 OFICRI - Instalación de dependencias con Yarn'));
console.log(chalk.yellow('⏳ Iniciando instalación en el proyecto principal...'));

try {
  // Instalar dependencias en la raíz del proyecto (nivel client)
  const rootPath = path.join(__dirname, '..');
  
  // Asegurarse de que se detecten los workspaces en package.json
  const packageJsonPath = path.join(rootPath, 'package.json');
  let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.workspaces || packageJson.workspaces.length === 0) {
    console.log(chalk.yellow('⚠️ No se detectaron workspaces en package.json. Añadiendo configuración...'));
    
    // Añadir configuración de workspaces si no existe
    packageJson.workspaces = [
      "shell",
      "auth",
      "documents",
      "mesa-partes",
      "users",
      "dashboard",
      "areas",
      "security",
      "shared",
      "main"
    ];
    
    // Guardar actualización
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(chalk.green('✅ Configuración de workspaces añadida'));
  }
  
  // Si existe package-lock.json, eliminarlo (puede causar conflictos con Yarn)
  const packageLockPath = path.join(rootPath, 'package-lock.json');
  if (fs.existsSync(packageLockPath)) {
    console.log(chalk.yellow('⚠️ Eliminando package-lock.json para evitar conflictos...'));
    fs.unlinkSync(packageLockPath);
  }
  
  // Ejecutar yarn install (maneja automáticamente workspaces)
  console.log(chalk.cyan('\n➡️ Ejecutando yarn install...'));
  execSync('yarn install', { 
    cwd: rootPath, 
    stdio: 'inherit',
    env: { 
      ...process.env,
      // Configurar para que acepte node-gyp y otras dependencias nativas
      ADBLOCK: '0',
      DISABLE_NOTIFIER: 'true'
    }
  });
  
  console.log(chalk.green('\n✅ Instalación completada exitosamente!'));
  console.log(chalk.blue('📋 Los módulos ahora deberían poder resolverse entre sí.'));
  console.log(chalk.yellow('💡 Usa "npm run dev:areas" para iniciar el módulo de áreas, o "npm run dev" para iniciar todos los módulos.'));
  
} catch (error) {
  console.error(chalk.red('\n❌ Error durante la instalación:'));
  console.error(chalk.red(error.message));
  
  // Proporcionar sugerencias de solución
  console.log(chalk.yellow('\n💡 Sugerencias para resolver el problema:'));
  console.log(chalk.yellow('1. Intenta ejecutar "yarn" manualmente en la carpeta client'));
  console.log(chalk.yellow('2. Si hay errores específicos con algún módulo, revisa su package.json'));
  console.log(chalk.yellow('3. Para iniciar solo el módulo de áreas sin depender de otros módulos, usa "npm run dev:areas"'));
  
  process.exit(1);
} 