/**
 * Script para inicializar datos básicos para las pruebas
 * Este script deshabilita temporalmente las restricciones de clave foránea
 * para poder insertar datos de prueba
 */

// Cargar variables de entorno desde .env.test
require('dotenv').config({ path: '.env.test' });

const db = require('../config/database');
const { logger } = require('../utils/logger');

async function setupTestData() {
  try {
    // Conectar a la base de datos
    await db.testConnection();
    logger.info('Conectado a la base de datos');
    
    // Desactivar temporalmente las restricciones de clave foránea
    logger.info('Desactivando verificadores de clave foránea...');
    await db.executeQuery('SET FOREIGN_KEY_CHECKS = 0');
    
    // Crear área de prueba
    logger.info('Creando área de prueba...');
    await db.executeQuery(
      'INSERT IGNORE INTO AreaEspecializada (IDArea, NombreArea, CodigoIdentificacion, TipoArea, IsActive, Descripcion) VALUES (?, ?, ?, ?, ?, ?)',
      [999, 'Área de Prueba', 'TEST-AREA', 'PRUEBA', 1, 'Área creada para pruebas automatizadas']
    );
    logger.info(`Área creada con ID: 999`);
    
    // Crear rol de prueba
    logger.info('Creando rol de prueba...');
    await db.executeQuery(
      'INSERT IGNORE INTO Rol (IDRol, NombreRol, Descripcion, NivelAcceso, Permisos) VALUES (?, ?, ?, ?, ?)',
      [999, 'Rol de Prueba', 'Rol creado para pruebas automatizadas', 1, 255]
    );
    logger.info(`Rol creado con ID: 999`);
    
    // Crear mesa de partes de prueba
    logger.info('Creando mesa de partes de prueba...');
    await db.executeQuery(
      'INSERT IGNORE INTO MesaPartes (IDMesaPartes, Descripcion, IsActive, CodigoIdentificacion) VALUES (?, ?, ?, ?)',
      [999, 'Mesa de Partes de Prueba', 1, 'TEST-MESA']
    );
    logger.info(`Mesa de partes creada con ID: 999`);
    
    // Crear usuarios de prueba
    logger.info('Creando usuarios de prueba...');
    await db.executeQuery(
      'INSERT IGNORE INTO Usuario (IDUsuario, CodigoCIP, Nombres, Apellidos, Rango, PasswordHash, Salt, IDArea, IDRol) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [998, 'TEST-USER-1', 'Usuario', 'De Prueba 1', 'General', '$2a$10$mBpQoMfPGGjYV2NzvL.YHeTw0znNqptBsYKrn.zxr5Hd2zQvmCv9q', 'testSalt123', 999, 999]
    );
    await db.executeQuery(
      'INSERT IGNORE INTO Usuario (IDUsuario, CodigoCIP, Nombres, Apellidos, Rango, PasswordHash, Salt, IDArea, IDRol) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [999, 'TEST-USER-2', 'Usuario', 'De Prueba 2', 'General', '$2a$10$mBpQoMfPGGjYV2NzvL.YHeTw0znNqptBsYKrn.zxr5Hd2zQvmCv9q', 'testSalt123', 999, 999]
    );
    logger.info(`Usuarios creados con IDs: 998, 999`);
    
    // Crear un documento de prueba
    logger.info('Creando documento de prueba...');
    await db.executeQuery(
      `INSERT IGNORE INTO Documento (
        IDDocumento, IDMesaPartes, IDAreaActual, IDUsuarioCreador, 
        NroRegistro, NumeroOficioDocumento, FechaDocumento, 
        OrigenDocumento, Estado, Observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        999,
        999,
        999,
        998,
        'TEST-REG-999',
        'TEST-OFI-999',
        new Date().toISOString().split('T')[0],
        'EXTERNO',
        'REGISTRADO',
        'Documento para pruebas automatizadas'
      ]
    );
    logger.info(`Documento creado con ID: 999`);
    
    // Activar nuevamente las restricciones de clave foránea
    logger.info('Reactivando verificadores de clave foránea...');
    await db.executeQuery('SET FOREIGN_KEY_CHECKS = 1');
    
    logger.info('Datos de prueba creados exitosamente');
    
  } catch (error) {
    logger.error('Error al crear datos de prueba:', error);
  } finally {
    // Cerrar la conexión
    await db.closePool();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupTestData()
    .then(() => {
      logger.info('Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = setupTestData; 