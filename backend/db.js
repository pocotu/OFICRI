const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Cargar configuración desde el archivo .env en la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Verificar que las variables obligatorias existan
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Variables de entorno requeridas no encontradas: ${missingEnvVars.join(', ')}`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'false' ? false : true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0', 10)
});

module.exports = pool; 