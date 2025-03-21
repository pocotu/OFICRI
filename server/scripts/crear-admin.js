/**
 * Script para crear usuario administrador
 * Versión optimizada que utiliza funciones compartidas
 * ISO/IEC 27001 compliant implementation
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');

// Importar funciones de ayuda para base de datos
const {
  loadEnv,
  executeQuery,
  disableConstraints,
  enableConstraints,
  hashPassword,
  getDefaultRoles,
  getDefaultAreas
} = require('../utils/database-helpers');

// Cargar variables de entorno
loadEnv(path.resolve(__dirname, '../../.env'));

// Configurar logger
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
  defaultMeta: { service: 'crear-admin' },
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

/**
 * Crea el rol de administrador si no existe
 * @returns {Promise<number>} ID del rol administrador
 */
async function crearRolAdministrador() {
  try {
    logger.info('Verificando rol de administrador...');
    
    // Verificar si ya existe
    const existingRol = await executeQuery(
      'SELECT IDRol FROM Rol WHERE NombreRol = ?',
      ['Administrador']
    );
    
    if (existingRol.length > 0) {
      logger.info('Rol administrador ya existe');
      return existingRol[0].IDRol;
    }
    
    // Crear rol administrador
    const roles = getDefaultRoles();
    const adminRol = roles.find(r => r.nombreRol === 'Administrador');
    
    const result = await executeQuery(
      'INSERT INTO Rol (NombreRol, Descripcion, NivelAcceso, Permisos) VALUES (?, ?, ?, ?)',
      [adminRol.nombreRol, adminRol.descripcion, adminRol.nivelAcceso, adminRol.permisos]
    );
    
    logger.info('Rol administrador creado exitosamente');
    return result.insertId;
  } catch (error) {
    logger.error(`Error al crear rol administrador: ${error.message}`);
    throw error;
  }
}

/**
 * Crea el área administrativa si no existe
 * @returns {Promise<number>} ID del área administrativa
 */
async function crearAreaAdministrativa() {
  try {
    logger.info('Verificando área administrativa...');
    
    // Verificar si ya existe
    const existingArea = await executeQuery(
      'SELECT IDArea FROM AreaEspecializada WHERE TipoArea = ?',
      ['ADMIN']
    );
    
    if (existingArea.length > 0) {
      logger.info('Área administrativa ya existe');
      return existingArea[0].IDArea;
    }
    
    // Crear área administrativa
    const areas = getDefaultAreas();
    const adminArea = areas.find(a => a.tipoArea === 'ADMIN');
    
    const result = await executeQuery(
      `INSERT INTO AreaEspecializada (
        NombreArea, CodigoIdentificacion, TipoArea, Descripcion, IsActive
      ) VALUES (?, ?, ?, ?, TRUE)`,
      [adminArea.nombreArea, adminArea.codigoIdentificacion, adminArea.tipoArea, adminArea.descripcion]
    );
    
    logger.info('Área administrativa creada exitosamente');
    return result.insertId;
  } catch (error) {
    logger.error(`Error al crear área administrativa: ${error.message}`);
    throw error;
  }
}

/**
 * Crea el usuario administrador
 * @param {number} idRol - ID del rol administrador
 * @param {number} idArea - ID del área administrativa
 * @returns {Promise<number>} ID del usuario creado
 */
async function crearAdmin(idRol, idArea) {
  try {
    logger.info('Verificando usuario administrador...');
    
    // Verificar si ya existe
    const existingAdmin = await executeQuery(
      'SELECT IDUsuario FROM Usuario WHERE CodigoCIP = ?',
      ['12345678']
    );
    
    if (existingAdmin.length > 0) {
      logger.info('Usuario administrador ya existe');
      return existingAdmin[0].IDUsuario;
    }
    
    // Crear contraseña segura
    const { hash: passwordHash, salt } = await hashPassword('Admin123!');
    
    // Insertar usuario
    const result = await executeQuery(
      `INSERT INTO Usuario (
        CodigoCIP, Nombres, Apellidos, Grado,
        PasswordHash, Salt, IDArea, IDRol,
        UltimoAcceso, IntentosFallidos, Bloqueado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0, FALSE)`,
      [
        '12345678',
        'Administrador',
        'Sistema',
        'SuperAdmin',
        passwordHash,
        salt,
        idArea,
        idRol
      ]
    );
    
    logger.info('Usuario administrador creado exitosamente');
    logger.info('Credenciales de acceso:');
    logger.info('CIP: 12345678');
    logger.info('Contraseña: Admin123!');
    
    return result.insertId;
  } catch (error) {
    logger.error(`Error al crear usuario administrador: ${error.message}`);
    throw error;
  }
}

/**
 * Función principal que ejecuta el proceso completo
 */
async function main() {
  try {
    logger.info('Iniciando creación de usuario administrador...');
    
    // Desactivar restricciones de claves foráneas
    await disableConstraints();
    
    try {
      // Crear rol y área primero
      const idRol = await crearRolAdministrador();
      const idArea = await crearAreaAdministrativa();
      
      // Crear usuario administrador
      const idUsuario = await crearAdmin(idRol, idArea);
      
      logger.info(`Proceso completado. ID de usuario administrador: ${idUsuario}`);
    } finally {
      // Reactivar restricciones
      await enableConstraints();
    }
  } catch (error) {
    logger.error(`Error en el proceso: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar script directamente
if (require.main === module) {
  main().then(() => {
    logger.info('Script finalizado correctamente');
    process.exit(0);
  });
}

// Exportar funciones para uso en otros scripts
module.exports = {
  crearRolAdministrador,
  crearAreaAdministrativa,
  crearAdmin
}; 