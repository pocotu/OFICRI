/**
 * Script para iniciar todos los servidores de desarrollo del cliente OFICRI
 * Maneja correctamente los micro frontends incluso con referencias workspace
 */

const concurrently = require('concurrently');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Configuración de los módulos a iniciar con puertos específicos - shell al final
const modules = [
  // Nivel 1: Módulos base
  { path: './shared', name: 'SHARED', color: 'cyan', port: 5001, level: 1 },  
  
  // Nivel 2: Módulos funcionales
  { path: './areas', name: 'AREAS', color: 'green', port: 5006, level: 2 },
  { path: './auth', name: 'AUTH', color: 'magenta', port: 5002, level: 2 },
  { path: './documents', name: 'DOCS', color: 'yellow', port: 5003, level: 2 },
  { path: './mesa-partes', name: 'MESA', color: 'red', port: 5004, level: 2 },
  { path: './users', name: 'USERS', color: 'white', port: 5005, level: 2 },
  { path: './dashboard', name: 'DASHBOARD', color: 'gray', port: 5007, level: 2 },
  { path: './security', name: 'SECURITY', color: 'blue', port: 5008, level: 2 },
  
  // Nivel 3: Shell (último para que los demás módulos estén disponibles)
  { path: './shell', name: 'SHELL', color: 'blue', port: 5000, level: 3 }
];

console.log(chalk.blue('🚀 OFICRI - Iniciando servidores de desarrollo'));

// Filtrar los módulos que tienen script dev en su package.json
const validModules = modules.filter(module => {
  const packagePath = path.join(__dirname, '..', module.path, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log(chalk.yellow(`⚠️ No existe package.json en ${module.path}, omitiendo...`));
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (!packageJson.scripts || !packageJson.scripts.dev) {
      console.log(chalk.yellow(`⚠️ No existe script 'dev' en ${module.path}, omitiendo...`));
      return false;
    }
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ Error leyendo package.json en ${module.path}, omitiendo...`));
    return false;
  }
});

if (validModules.length === 0) {
  console.log(chalk.red('❌ No se encontraron módulos válidos para iniciar.'));
  process.exit(1);
}

console.log(chalk.green(`✅ Se iniciarán ${validModules.length} módulos en puertos separados.`));

// Preguntar al usuario si desea iniciar todos los módulos o solo algunos específicos
console.log(chalk.yellow('📋 ¿Qué módulos deseas iniciar?'));
console.log(chalk.yellow('   1. Solo el módulo de áreas (recomendado para desarrollo de áreas)'));
console.log(chalk.yellow('   2. Módulos independientes (sin Shell)'));
console.log(chalk.yellow('   3. Todos los módulos (puede causar errores iniciales)'));

// Por defecto, iniciar solo el módulo de áreas (opción 1)
const option = 1;

// Filtrar módulos según la opción elegida
let modulesToStart = [];
if (option === 1) {
  // Solo el módulo de áreas
  modulesToStart = validModules.filter(module => module.name === 'AREAS');
  console.log(chalk.green(`✅ Iniciando solo el módulo de AREAS en puerto ${modulesToStart[0].port}`));
} else if (option === 2) {
  // Todos los módulos excepto Shell
  modulesToStart = validModules.filter(module => module.level !== 3);
  console.log(chalk.green(`✅ Iniciando módulos independientes (sin Shell)`));
} else {
  // Todos los módulos
  modulesToStart = validModules;
  console.log(chalk.green(`✅ Iniciando todos los módulos (incluido Shell)`));
}

// Comandos para cada módulo con su puerto específico
const commands = modulesToStart.map(module => {
  // Determinar el comando correcto según el tipo de proyecto (Vite, Vue CLI, React, etc.)
  let command = '';
  
  try {
    const packagePath = path.join(__dirname, '..', module.path, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Comprobar si es un proyecto Vite (común en proyectos Vue 3)
    const hasVite = packageJson.devDependencies && 
                   (packageJson.devDependencies.vite || 
                    packageJson.dependencies && packageJson.dependencies.vite);
    
    if (hasVite) {
      command = `cd ${module.path} && vite --port ${module.port}`;
    } else {
      // Si no es Vite, usar el script dev estándar con variable de entorno PORT
      command = `cd ${module.path} && cross-env PORT=${module.port} npm run dev`;
    }
  } catch (error) {
    // Si hay error, usar el script dev estándar
    command = `cd ${module.path} && npm run dev`;
  }
  
  return {
    command,
    name: module.name,
    prefixColor: module.color
  };
});

// Iniciar todos los servidores concurrentemente
console.log(chalk.yellow('⏳ Iniciando servidores...'));
console.log(chalk.yellow('📋 Lista de módulos y puertos:'));

modulesToStart.forEach(module => {
  console.log(chalk.yellow(`   → ${module.name}: http://localhost:${module.port}`));
});

// Mensaje con instrucciones para desarrollo
console.log(chalk.blue('\n💡 Instrucciones para desarrollo:'));
console.log(chalk.cyan('   1. Para trabajar solo con el módulo de áreas: npm run dev:areas'));
console.log(chalk.cyan('   2. Para iniciar el shell independientemente: npm run dev:shell'));
console.log(chalk.cyan('   3. Para restaurar los package.json: npm run dev:reset'));

try {
  concurrently(commands, {
    prefix: '{name} |',
    timestampFormat: 'HH:mm:ss',
    prefixColors: 'auto',
    killOthers: ['failure'],
    restartTries: 3
  }).result.then(
    () => {
      console.log(chalk.green('\n✅ Todos los servidores finalizaron correctamente.'));
    },
    error => {
      console.log(chalk.red('\n❌ Uno o más servidores terminaron con error:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  );
} catch (error) {
  console.error(chalk.red('\n❌ Error al iniciar servidores:'));
  console.error(chalk.red(error.message));
  process.exit(1);
} 