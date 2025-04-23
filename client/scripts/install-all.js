/**
 * Script para instalar dependencias en todos los módulos del cliente OFICRI
 * Soporta proyectos con workspaces (npm, yarn, pnpm)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Directorios que contienen package.json
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

// Dependencias adicionales específicas para ciertos módulos
const additionalDependencies = {
  './shell': ['vue-toastification']
};

console.log(chalk.blue('📦 OFICRI - Instalación de dependencias'));
console.log(chalk.yellow('⏳ Iniciando instalación en todos los módulos...'));

// Detectar qué gestor de paquetes se está usando en el proyecto
function detectPackageManager(directory) {
  const rootPath = path.join(__dirname, '..');
  
  // Verificar archivos de lock para determinar el gestor
  if (fs.existsSync(path.join(rootPath, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  } else if (fs.existsSync(path.join(rootPath, 'yarn.lock'))) {
    return 'yarn';
  } else {
    return 'npm';
  }
}

// Verificar si un package.json usa referencias workspace
function usesWorkspaces(packageJsonPath) {
  try {
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Verificar en dependencias y devDependencies
    const allDeps = {
      ...(packageData.dependencies || {}),
      ...(packageData.devDependencies || {})
    };
    
    // Buscar cualquier dependencia que use workspace:
    return Object.values(allDeps).some(dep => 
      typeof dep === 'string' && dep.startsWith('workspace:')
    );
  } catch (error) {
    return false;
  }
}

// Verificar si el proyecto root tiene configuración de workspaces
function hasWorkspacesConfig() {
  const rootPackagePath = path.join(__dirname, '..', 'package.json');
  
  try {
    const packageData = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
    return !!packageData.workspaces;
  } catch (error) {
    return false;
  }
}

// Determinar la mejor estrategia de instalación
const packageManager = detectPackageManager();
const hasWorkspaces = hasWorkspacesConfig();

console.log(chalk.blue(`📋 Gestor de paquetes detectado: ${packageManager}`));
if (hasWorkspaces) {
  console.log(chalk.blue('📋 Configuración de workspaces detectada'));
}

// Instalar en el directorio raíz primero si tiene workspaces
if (hasWorkspaces) {
  const rootPath = path.join(__dirname, '..');
  console.log(chalk.cyan(`\n➡️ Instalando dependencias en el proyecto raíz con workspaces...`));
  
  try {
    if (packageManager === 'pnpm') {
      execSync('pnpm install', { cwd: rootPath, stdio: 'inherit' });
    } else if (packageManager === 'yarn') {
      execSync('yarn install', { cwd: rootPath, stdio: 'inherit' });
    } else {
      execSync('npm install', { cwd: rootPath, stdio: 'inherit' });
    }
    console.log(chalk.green(`✅ Instalación en raíz completada`));
  } catch (error) {
    console.error(chalk.red(`❌ Error instalando en raíz:`));
    console.error(chalk.red(error.message));
  }
  
  console.log(chalk.green('\n✅ Workspaces instalados. Los submódulos se instalaron automáticamente.'));
  process.exit(0);
}

// Contador para estadísticas
let successCount = 0;
let errorCount = 0;
let workspaceModules = 0;

// Si no hay workspaces a nivel raíz, instalar en cada directorio
directories.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  const packagePath = path.join(fullPath, 'package.json');
  
  if (fs.existsSync(packagePath)) {
    // Verificar si este módulo usa referencias de workspace
    const hasWorkspaceRefs = usesWorkspaces(packagePath);
    
    if (hasWorkspaceRefs) {
      console.log(chalk.yellow(`\n⚠️ El módulo ${dir} usa referencias workspace. Se instalará con ${packageManager}.`));
      workspaceModules++;
    }
    
    try {
      console.log(chalk.cyan(`\n➡️ Instalando en ${dir}...`));
      
      // Usar el gestor de paquetes apropiado
      if (hasWorkspaceRefs && packageManager === 'pnpm') {
        execSync('pnpm install', { cwd: fullPath, stdio: 'inherit' });
      } else if (hasWorkspaceRefs && packageManager === 'yarn') {
        execSync('yarn install', { cwd: fullPath, stdio: 'inherit' });
      } else {
        execSync('npm install', { cwd: fullPath, stdio: 'inherit' });
      }
      
      // Instalar dependencias adicionales específicas para este módulo
      if (additionalDependencies[dir] && additionalDependencies[dir].length > 0) {
        console.log(chalk.cyan(`\n➡️ Instalando dependencias adicionales en ${dir}...`));
        const deps = additionalDependencies[dir].join(' ');
        
        if (packageManager === 'pnpm') {
          execSync(`pnpm add ${deps}`, { cwd: fullPath, stdio: 'inherit' });
        } else if (packageManager === 'yarn') {
          execSync(`yarn add ${deps}`, { cwd: fullPath, stdio: 'inherit' });
        } else {
          execSync(`npm install ${deps}`, { cwd: fullPath, stdio: 'inherit' });
        }
        console.log(chalk.green(`✅ Dependencias adicionales instaladas en ${dir}`));
      }
      
      console.log(chalk.green(`✅ Instalación completada en ${dir}`));
      successCount++;
    } catch (error) {
      console.error(chalk.red(`❌ Error instalando en ${dir}:`));
      console.error(chalk.red(error.message));
      errorCount++;
    }
  } else {
    console.log(chalk.yellow(`⚠️ No existe package.json en ${dir}, omitiendo...`));
  }
});

// Mostrar resumen
console.log('\n' + chalk.blue('📊 Resumen de instalación:'));
console.log(chalk.green(`✅ Módulos instalados correctamente: ${successCount}`));

if (workspaceModules > 0) {
  console.log(chalk.yellow(`⚠️ Módulos con referencias workspace: ${workspaceModules}`));
  console.log(chalk.yellow(`ℹ️ Si siguen habiendo problemas, considera usar ${packageManager} directamente.`));
}

if (errorCount > 0) {
  console.log(chalk.red(`❌ Módulos con errores: ${errorCount}`));
  console.log(chalk.yellow('⚠️ Revise los mensajes de error y vuelva a intentarlo en los módulos fallidos'));
  process.exit(1);
} else {
  console.log(chalk.green('\n🎉 Todas las dependencias instaladas correctamente!'));
} 