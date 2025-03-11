const mysql = require('mysql2/promise');
const { logger } = require('../utils/utilsExport');

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
    waitForConnections: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    debug: process.env.NODE_ENV !== 'production',
    timezone: '+00:00'
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para verificar la conexión
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        logger.info('Conexión a la base de datos establecida correctamente');
        connection.release();
        return true;
    } catch (error) {
        logger.error('Error al conectar con la base de datos:', error);
        throw new Error('No se pudo establecer conexión con la base de datos');
    }
}

// Función para cerrar el pool
async function closePool() {
    try {
        await pool.end();
        logger.info('Pool de conexiones cerrado correctamente');
    } catch (error) {
        logger.error('Error al cerrar el pool de conexiones:', error);
        throw error;
    }
}

module.exports = {
    dbConfig,
    pool,
    testConnection,
    closePool
}; 