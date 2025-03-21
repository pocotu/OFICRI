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

// Cargar variables de entorno con opción para especificar ubicación
function loadEnv(envPath = null) {
  const configPath = envPath || path.resolve(__dirname, '../../.env');
  dotenv.config({ path: configPath });
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
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: options.multipleStatements || false
  };

  const connection = await mysql.createConnection(connectionConfig);
  
  try {
    const [results] = await connection.query(sql, params);
    return results;
  } finally {
    await connection.end();
  }
}

/**
 * Desactiva restricciones de integridad referencial 
 * @returns {Promise<void>}
 */
async function disableConstraints() {
  try {
    await executeQuery("SET foreign_key_checks=0;", [], { multipleStatements: true });
    await executeQuery("SET @DISABLE_TRIGGERS = 1;", [], { multipleStatements: true });
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
    await executeQuery("SET foreign_key_checks=1;", [], { multipleStatements: true });
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
 * Genera un hash seguro para la contraseña
 * @param {string} password - Contraseña a hashear
 * @returns {Promise<Object>} - Hash y salt
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
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

module.exports = {
  loadEnv,
  executeQuery,
  disableConstraints,
  enableConstraints,
  getDefaultRoles,
  getDefaultAreas,
  getDefaultPermissions,
  hashPassword
}; 