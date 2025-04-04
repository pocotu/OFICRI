/**
 * Módulo para gestionar conexiones a la base de datos MySQL
 * Proporciona funciones para crear conexiones y pools de conexiones
 * con manejo de errores adecuado
 */

const mysql = require('mysql2/promise');
const { createLogger, format, transports } = require('winston');

// Crear un logger específico para este módulo
const dbLogger = createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// Configuración de base de datos desde variables de entorno
const getDbConfig = () => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'oficri_sistema',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  };

  // Registrar la configuración en modo debug
  if (process.env.DB_DEBUG === 'true') {
    dbLogger.debug(`Configuración DB: host=${config.host}, user=${config.user}, database=${config.database}`);
  }

  return config;
};

/**
 * Crea una nueva conexión a la base de datos
 * @returns {Promise<Connection>} Conexión a la base de datos
 */
const createConnection = async () => {
  try {
    const config = getDbConfig();
    
    if (process.env.DB_DEBUG === 'true') {
      dbLogger.debug(`Conexión a: ${config.host}@${config.database} como ${config.user}`);
    }
    
    return await mysql.createConnection(config);
  } catch (error) {
    dbLogger.error(`Error al crear conexión a la base de datos: ${error.message}`);
    throw error;
  }
};

/**
 * Crea un pool de conexiones a la base de datos
 * @returns {Pool} Pool de conexiones
 */
const createConnectionPool = () => {
  try {
    const config = getDbConfig();
    
    if (process.env.DB_DEBUG === 'true') {
      dbLogger.debug(`Creando pool de conexiones: ${config.connectionLimit} conexiones máximas`);
    }
    
    return mysql.createPool(config);
  } catch (error) {
    dbLogger.error(`Error al crear pool de conexiones: ${error.message}`);
    throw error;
  }
};

/**
 * Función para verificar la conexión a la base de datos
 * @returns {Promise<boolean>} true si la conexión es exitosa, false en caso contrario
 */
const testConnection = async () => {
  let connection;
  try {
    connection = await createConnection();
    const [result] = await connection.query('SELECT 1 as test');
    return true;
  } catch (error) {
    dbLogger.error(`Error de conexión a la base de datos: ${error.message}`);
    return false;
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (error) {
        dbLogger.error(`Error al cerrar conexión de prueba: ${error.message}`);
      }
    }
  }
};

// Exportar todas las funciones
module.exports = {
  getDbConfig,
  createConnection,
  createConnectionPool,
  testConnection
}; 