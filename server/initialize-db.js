/**
 * Script para inicializar completamente la base de datos
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'kali'
};

/**
 * Hashea una contraseña con bcrypt
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} - Hash de la contraseña
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Inicializa la base de datos y crea todas las tablas necesarias
 */
async function initializeDatabase() {
  let connection;
  
  try {
    console.log('Conectando a MySQL...');
    connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password
    });
    
    // Crear la base de datos si no existe
    console.log('Creando base de datos oficri_sistema si no existe...');
    await connection.query('CREATE DATABASE IF NOT EXISTS oficri_sistema');
    await connection.query('USE oficri_sistema');
    
    // Crear tablas básicas
    console.log('Creando tablas básicas...');
    
    // Tabla Rol
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rol (
        IDRol INT AUTO_INCREMENT PRIMARY KEY,
        NombreRol VARCHAR(50) NOT NULL,
        Descripcion VARCHAR(255),
        NivelAcceso INT NOT NULL,
        Permisos INT NOT NULL
      )
    `);
    
    // Tabla Area
    await connection.query(`
      CREATE TABLE IF NOT EXISTS areaespecializada (
        IDArea INT AUTO_INCREMENT PRIMARY KEY,
        NombreArea VARCHAR(100) NOT NULL,
        CodigoIdentificacion VARCHAR(20) NOT NULL,
        TipoArea VARCHAR(50) NOT NULL,
        Descripcion VARCHAR(255),
        IsActive BOOLEAN DEFAULT TRUE
      )
    `);
    
    // Tabla Usuario
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuario (
        IDUsuario INT AUTO_INCREMENT PRIMARY KEY,
        CodigoCIP VARCHAR(8) NOT NULL UNIQUE,
        Nombres VARCHAR(100) NOT NULL,
        Apellidos VARCHAR(100) NOT NULL,
        Grado VARCHAR(50) NOT NULL,
        PasswordHash VARCHAR(255) NOT NULL,
        IDArea INT NOT NULL,
        IDRol INT NOT NULL,
        UltimoAcceso DATETIME,
        IntentosFallidos INT DEFAULT 0,
        Bloqueado BOOLEAN DEFAULT FALSE,
        UltimoBloqueo DATETIME,
        FOREIGN KEY (IDArea) REFERENCES areaespecializada(IDArea),
        FOREIGN KEY (IDRol) REFERENCES rol(IDRol)
      )
    `);
    
    // Verificar roles
    console.log('Verificando roles existentes...');
    const [roles] = await connection.query('SELECT COUNT(*) AS count FROM rol');
    
    if (roles[0].count === 0) {
      console.log('Creando roles predeterminados...');
      await connection.query(`
        INSERT INTO rol (NombreRol, Descripcion, NivelAcceso, Permisos)
        VALUES
          ('Administrador', 'Control total del sistema', 1, 255),
          ('Supervisor', 'Supervisión de áreas y documentos', 2, 127),
          ('Operador', 'Acceso básico a documentos', 3, 63),
          ('Consulta', 'Solo consultas', 4, 3)
      `);
    }
    
    // Verificar áreas
    console.log('Verificando áreas existentes...');
    const [areas] = await connection.query('SELECT COUNT(*) AS count FROM areaespecializada');
    
    if (areas[0].count === 0) {
      console.log('Creando áreas predeterminadas...');
      await connection.query(`
        INSERT INTO areaespecializada (NombreArea, CodigoIdentificacion, TipoArea, Descripcion)
        VALUES
          ('Administración', 'ADM-001', 'Administrativa', 'Área de administración del sistema'),
          ('Mesa de Partes', 'MP-001', 'Operativa', 'Mesa de partes principal'),
          ('Laboratorio Forense', 'LAB-001', 'Técnica', 'Laboratorio de análisis forense')
      `);
    }
    
    // Verificar usuario administrador
    console.log('Verificando usuario administrador...');
    const [users] = await connection.query('SELECT COUNT(*) AS count FROM usuario WHERE CodigoCIP = ?', ['12345678']);
    
    if (users[0].count === 0) {
      console.log('Creando usuario administrador...');
      const passwordHash = await hashPassword('admin123');
      
      await connection.query(`
        INSERT INTO usuario (CodigoCIP, Nombres, Apellidos, Grado, PasswordHash, IDArea, IDRol, UltimoAcceso)
        VALUES ('12345678', 'Jan', 'Perez', 'Teniente', ?, 1, 1, NOW())
      `, [passwordHash]);
      
      console.log('Usuario administrador creado con éxito:');
      console.log('- CIP: 12345678');
      console.log('- Contraseña: admin123');
    }
    
    console.log('¡Base de datos inicializada correctamente!');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar inicialización
initializeDatabase()
  .then(() => {
    console.log('Proceso de inicialización completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error en la inicialización:', error);
    process.exit(1);
  }); 