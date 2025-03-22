/**
 * Archivo de inicio del servidor que proporciona una alternativa al módulo punycode obsoleto
 * y ejecuta la creación del admin automáticamente
 */

// Redirigir las importaciones de 'punycode' al módulo punycode2
require('module').Module._cache['punycode'] = require('./punycode-shim');

// Importar y ejecutar el script de creación de admin
const { createLogger, format, transports } = require('winston');
const path = require('path');
const { exec } = require('child_process');

// Configurar logger para este script
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'start-script' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    })
  ]
});

// Función para mostrar la información detallada del servidor
function mostrarInformacionServidor() {
  const PORT = process.env.PORT || 3000;
  
  // Usar console.log directamente para asegurar que se muestre
  console.log('\n\n');
  console.log('======================================================================');
  console.log('                      OFICRI API SERVER INICIADO                      ');
  console.log('======================================================================');
  console.log('\n');
  console.log('📌 ENLACES PRINCIPALES:');
  console.log('------------------------');
  console.log(`🌐 Servidor:             http://localhost:${PORT}`);
  console.log(`🔍 Estado:               http://localhost:${PORT}/health`);
  console.log(`🚀 API Base:             http://localhost:${PORT}/api`);
  console.log(`📚 Documentación API:    http://localhost:${PORT}/api-docs`);
  console.log('\n');
  
  console.log('📑 ENDPOINTS PRINCIPALES:');
  console.log('------------------------');
  console.log(`🔐 Autenticación:        http://localhost:${PORT}/api/auth/login`);
  console.log(`📄 Documentos:           http://localhost:${PORT}/api/documents`);
  console.log(`👤 Usuarios:             http://localhost:${PORT}/api/users`);
  console.log(`🏢 Áreas:                http://localhost:${PORT}/api/areas`);
  console.log(`🔑 Permisos:             http://localhost:${PORT}/api/permisos`);
  console.log(`📨 Mesa de Partes:       http://localhost:${PORT}/api/mesapartes`);
  console.log('\n');
  
  console.log('🧪 COMANDOS DE PRUEBA:');
  console.log('------------------------');
  console.log('▶️ Tests de autenticación:      npm run test:auth');
  console.log('▶️ Tests de entidades:          npm run test:entity');
  console.log('▶️ Test específico (documento): npm run test:entity:documento');
  console.log('\n');
  
  console.log('📋 SWAGGER Y DOCUMENTACIÓN:');
  console.log('------------------------');
  console.log('1. Documentación principal:');
  console.log(`   📚 http://localhost:${PORT}/api-docs`);
  console.log('2. Documentación alternativa:');
  console.log('   📚 http://localhost:3002/api-docs  (ejecutar: npm run swagger)');
  console.log('\n');
  
  console.log('======================================================================');
  console.log('                SERVIDOR LISTO PARA RECIBIR SOLICITUDES               ');
  console.log('======================================================================');
  console.log('\n');
}

// Ejecutar la creación del admin utilizando child_process
logger.info('Verificando usuario administrador...');
const scriptPath = path.join(__dirname, 'server', 'scripts', 'crear-admin.js');

exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
  if (error) {
    logger.error(`Error al ejecutar script de admin: ${error.message}`);
  }
  
  if (stdout) {
    logger.info(`Salida del script: ${stdout.trim()}`);
  }
  
  if (stderr) {
    logger.warn(`Errores del script: ${stderr.trim()}`);
  }
  
  logger.info('Iniciando servidor...');
  
  // Importar y ejecutar el servidor
  require('./server/server');
  
  // Mostrar información después de iniciar el servidor (con un pequeño retraso)
  setTimeout(mostrarInformacionServidor, 1000);
}); 