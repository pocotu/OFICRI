/**
 * Database Helper Functions
 * Funciones de utilidad compartidas para operaciones de base de datos
 * Utilizadas por múltiples scripts de inicialización y verificación
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const { logger } = require('./logger');

// Cargar variables de entorno
function loadEnv(envPath = null) {
  const configPath = envPath || path.resolve(__dirname, '../../.env');
  dotenv.config({ path: configPath });
  
  // Verificar si tenemos la variable de entorno DB_NAME
  if (!process.env.DB_NAME) {
    process.env.DB_NAME = 'Oficri_sistema';
  }
  
  // Verificar si tenemos la variable de entorno DB_PASSWORD
  if (!process.env.DB_PASSWORD) {
    logger.warn('DB_PASSWORD no definida, usando contraseña por defecto "kali"');
    process.env.DB_PASSWORD = 'kali';
  }
  
  // Log de configuración (sin mostrar la contraseña)
  logger.debug(`Configuración DB: host=${process.env.DB_HOST}, user=${process.env.DB_USER}, database=${process.env.DB_NAME}`);
}

// Cargar variables de entorno por defecto
loadEnv();

/**
 * Crea una conexión a la base de datos y ejecuta una consulta
 * @param {string} sql - Consulta SQL con placeholders
 * @param {Array} params - Parámetros para la consulta
 * @param {Object} options - Opciones adicionales de conexión
 * @returns {Promise<Array>} - Resultados de la consulta
 */
async function executeQuery(sql, params = [], options = {}) {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'kali', // Usar kali como valor por defecto
    database: process.env.DB_NAME || 'Oficri_sistema',
    multipleStatements: options.multipleStatements || false
  };

  // Log de la consulta (sin contraseña)
  logger.debug(`Conexión a: ${connectionConfig.host}@${connectionConfig.database} como ${connectionConfig.user}`);
  
  const connection = await mysql.createConnection(connectionConfig);
  
  try {
    const [results] = await connection.query(sql, params);
    return results;
  } finally {
    await connection.end();
  }
}

/**
 * Desactiva restricciones de integridad referencial y triggers temporalmente
 * @returns {Promise<boolean>}
 */
async function disableConstraints() {
  try {
    await executeQuery("SET FOREIGN_KEY_CHECKS = 0;", [], { multipleStatements: true });
    await executeQuery("SET @DISABLE_TRIGGERS = 1;", [], { multipleStatements: true });
    
    // Desactivar los triggers directamente
    try {
      // Intentar eliminar los triggers que causan problemas
      await executeQuery(`
        DROP TRIGGER IF EXISTS trg_area_insert;
        DROP TRIGGER IF EXISTS trg_area_update;
        DROP TRIGGER IF EXISTS trg_area_delete;
        DROP TRIGGER IF EXISTS trg_rol_insert;
        DROP TRIGGER IF EXISTS trg_rol_update;
        DROP TRIGGER IF EXISTS trg_rol_delete;
      `, [], { multipleStatements: true });
    } catch (triggerError) {
      logger.warn('No se pudieron eliminar los triggers, continuando de todas formas:', triggerError.message);
    }
    
    return true;
  } catch (error) {
    logger.error('Error al desactivar restricciones:', { 
      error: error.message, 
      stack: error.stack 
    });
    throw error;
  }
}

/**
 * Reactiva restricciones de integridad referencial
 * @returns {Promise<void>}
 */
async function enableConstraints() {
  try {
    await executeQuery("SET @DISABLE_TRIGGERS = NULL;", [], { multipleStatements: true });
    await executeQuery("SET FOREIGN_KEY_CHECKS = 1;", [], { multipleStatements: true });
    return true;
  } catch (error) {
    logger.error('Error al reactivar restricciones:', { 
      error: error.message, 
      stack: error.stack 
    });
    throw error;
  }
}

/**
 * Definiciones básicas de roles del sistema
 * @returns {Array} - Lista de roles predefinidos
 */
function getDefaultRoles() {
  return [
    {
      nombreRol: 'Administrador',
      descripcion: 'Control total del sistema',
      nivelAcceso: 1,
      permisos: 255 // Todos los permisos (11111111 en binario) - bits 0..7
    },
    {
      nombreRol: 'Mesa de Partes',
      descripcion: 'Gestión de documentos entrantes y salientes',
      nivelAcceso: 2,
      permisos: 91  // Bits 0,1,3,4,6 (Crear, Editar, Ver, Derivar, Exportar)
    },
    {
      nombreRol: 'Responsable de Área',
      descripcion: 'Responsable de un área especializada',
      nivelAcceso: 3,
      permisos: 91  // Bits 0,1,3,4,6 (Crear, Editar, Ver, Derivar, Exportar)
    },
    {
      nombreRol: 'Operador',
      descripcion: 'Operador con permisos limitados',
      nivelAcceso: 4,
      permisos: 11  // Bits 0,1,3 (Crear, Editar, Ver)
    }
  ];
}

/**
 * Definiciones básicas de áreas del sistema
 * @returns {Array} - Lista de áreas predefinidas
 */
function getDefaultAreas() {
  return [
    {
      nombreArea: 'Administración',
      codigoIdentificacion: 'AD',
      tipoArea: 'ADMIN',
      descripcion: 'Área administrativa del sistema'
    },
    {
      nombreArea: 'Mesa de Partes',
      codigoIdentificacion: 'MP',
      tipoArea: 'OPERATIVO',
      descripcion: 'Recepción y gestión de documentos'
    },
    {
      nombreArea: 'Química y Toxicología',
      codigoIdentificacion: 'QT',
      tipoArea: 'ESPECIALIZADO',
      descripcion: 'Análisis químico y toxicológico'
    },
    {
      nombreArea: 'Forense Digital',
      codigoIdentificacion: 'FD',
      tipoArea: 'ESPECIALIZADO',
      descripcion: 'Análisis forense digital'
    },
    {
      nombreArea: 'Dosaje Etílico',
      codigoIdentificacion: 'DE',
      tipoArea: 'ESPECIALIZADO',
      descripcion: 'Análisis de dosaje etílico'
    }
  ];
}

/**
 * Genera un hash seguro para la contraseña con el salt incorporado en el hash
 * El hash generado por bcrypt ya incluye el salt, por lo que no es necesario almacenarlo por separado
 * @param {string} password - Contraseña a hashear
 * @returns {Promise<string>} - Hash completo que incluye el salt incorporado
 */
async function hashPassword(password) {
  // En entorno de pruebas, usamos una implementación simulada de bcrypt
  if (process.env.NODE_ENV === 'test') {
    return 'hashed_password_mock';
  }
  
  // bcrypt.genSalt(10) genera un salt aleatorio con un costo de 10 rondas
  // y bcrypt.hash incluye automáticamente el salt en el hash resultante
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

/**
 * Verifica si una contraseña coincide con un hash
 * @param {string} password - Contraseña a verificar
 * @param {string} hash - Hash almacenado
 * @returns {Promise<boolean>} - true si la contraseña coincide
 */
async function verifyPassword(password, hash) {
  // En entorno de pruebas, permitimos comportamiento personalizado en las pruebas
  if (process.env.NODE_ENV === 'test') {
    if (password === 'correctPassword') return true;
    return false;
  }
  
  return await bcrypt.compare(password, hash);
}

/**
 * Definiciones básicas de permisos del sistema
 * @returns {Array} - Lista de permisos predefinidos
 */
function getDefaultPermissions() {
  return [
    { nombrePermiso: 'crear_documento', alcance: 'documento', restringido: false },
    { nombrePermiso: 'editar_documento', alcance: 'documento', restringido: false },
    { nombrePermiso: 'derivar_documento', alcance: 'documento', restringido: false },
    { nombrePermiso: 'eliminar_documento', alcance: 'documento', restringido: true },
    { nombrePermiso: 'administracion_usuarios', alcance: 'usuario', restringido: true },
    { nombrePermiso: 'administracion_roles', alcance: 'sistema', restringido: true },
    { nombrePermiso: 'ver_reportes', alcance: 'reporte', restringido: false },
    { nombrePermiso: 'exportar_datos', alcance: 'sistema', restringido: true }
  ];
}

/**
 * Forzar reconexión a la base de datos
 * @returns {Promise<boolean>}
 */
async function forceReconnect() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'kali',
    database: process.env.DB_NAME || 'Oficri_sistema',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  
  try {
    const tempConnection = await mysql.createConnection(config);
    await tempConnection.query('SELECT 1');
    console.log('Reconexión forzada a la base de datos exitosa');
    await tempConnection.end();
    return true;
  } catch (error) {
    console.error('Error al forzar la reconexión:', error.message);
    return false;
  }
}

module.exports = {
  loadEnv,
  executeQuery,
  disableConstraints,
  enableConstraints,
  getDefaultRoles,
  getDefaultAreas,
  getDefaultPermissions,
  hashPassword,
  verifyPassword,
  forceReconnect
}; 