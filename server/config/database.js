/**
 * Database Configuration
 * Implements secure connection pooling for MySQL database
 * ISO/IEC 27001 compliant with security measures
 */

const mysql = require('mysql2/promise');
const { logger } = require('../utils/logger');

// Asegurarse de que se usa la contraseña correcta (kali)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'kali', // Usar kali como contraseña por defecto
  database: process.env.DB_NAME || 'Oficri_sistema',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Loguear la configuración (sin la contraseña) para depuración
logger.debug(`Configuración de base de datos: host=${dbConfig.host}, port=${dbConfig.port}, user=${dbConfig.user}, database=${dbConfig.database}`);

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Probar conexión
pool.getConnection()
  .then(connection => {
    logger.info('Conexión a la base de datos establecida');
    connection.release();
  })
  .catch(error => {
    logger.error('Error al conectar a la base de datos:', error);
  });

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
  let connection;
  try {
    // Get connection from pool
    connection = await pool.getConnection();
    
    // Execute a simple query
    const [result] = await connection.query('SELECT 1 as test');
    
    // Check if query returned expected result
    if (result[0].test !== 1) {
      throw new Error('Unexpected query result');
    }
    
    return true;
  } catch (error) {
    logger.error('Database connection test failed', {
      error: error.message,
      stack: error.stack
    });
    
    // Throw a more descriptive error
    throw new Error(`Failed to connect to database: ${error.message}`);
  } finally {
    // Release connection back to pool
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Execute a query with proper error handling and logging
 * @param {string} sql - SQL query with placeholders
 * @param {Array} params - Query parameters
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} - Query results
 */
async function executeQuery(sql, params = [], options = {}) {
  const startTime = Date.now();
  const queryId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  try {
    // Log query for debugging in development (not in production for security)
    if (process.env.NODE_ENV !== 'production' && process.env.DB_DEBUG === 'true') {
      logger.debug(`Executing query [${queryId}]: ${sql}`, {
        params: JSON.stringify(params)
      });
    }
    
    const [results] = await pool.query(sql, params);
    
    // Calculate execution time for performance monitoring
    const executionTime = Date.now() - startTime;
    
    // Log slow queries for performance optimization
    if (executionTime > 1000) { // Queries taking more than 1 second
      logger.warn(`Slow query detected [${queryId}] - ${executionTime}ms`, {
        executionTime,
        query: sql
      });
    }
    
    return results;
  } catch (error) {
    // Log database errors with query info
    logger.error(`Database query error [${queryId}]`, {
      error: error.message,
      query: sql,
      params: JSON.stringify(params),
      code: error.code
    });
    
    // Enhance error with additional info
    error.queryId = queryId;
    throw error;
  }
}

/**
 * Close the connection pool (for graceful shutdown)
 * @returns {Promise<void>}
 */
async function closePool() {
  try {
    await pool.end();
    logger.info('Database connection pool closed successfully');
  } catch (error) {
    logger.error('Error closing database connection pool', { error: error.message });
    throw error;
  }
}

module.exports = {
  dbConfig,
  pool,
  testConnection,
  executeQuery,
  closePool
}; 