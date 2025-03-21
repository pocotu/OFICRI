/**
 * Database Initialization Script
 * Sets up initial database records required for application functionality
 * ISO/IEC 27001 compliant implementation
 */

const bcrypt = require('bcryptjs');
const { createLogger, format, transports } = require('winston');
const path = require('path');

// Importar funciones de ayuda para base de datos
const {
  loadEnv,
  executeQuery,
  disableConstraints,
  enableConstraints,
  getDefaultRoles,
  getDefaultAreas,
  getDefaultPermissions,
  hashPassword
} = require('../utils/database-helpers');

// Cargar variables de entorno desde la raíz del proyecto
loadEnv(path.resolve(__dirname, '../../.env'));

// Configurar logger con salida a consola más detallada
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.colorize(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`)
  ),
  transports: [
    new transports.Console({
      stderrLevels: ['error'],
      consoleWarnLevels: ['warn'],
      format: format.combine(
        format.colorize(),
        format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
        )
      ),
    })
  ]
});

/**
 * Initialize basic areas needed for the system
 */
async function initializeAreas() {
  try {
    logger.info('Verificando y creando áreas básicas...');
    
    const areas = getDefaultAreas();

    for (const area of areas) {
      const existing = await executeQuery(
        'SELECT IDArea FROM AreaEspecializada WHERE CodigoIdentificacion = ?',
        [area.codigoIdentificacion]
      );

      if (existing.length === 0) {
        await executeQuery(
          `INSERT INTO AreaEspecializada (
            NombreArea, CodigoIdentificacion, TipoArea, Descripcion, IsActive
          ) VALUES (?, ?, ?, ?, TRUE)`,
          [area.nombreArea, area.codigoIdentificacion, area.tipoArea, area.descripcion]
        );
        logger.info(`Área ${area.nombreArea} creada exitosamente`);
      } else {
        logger.info(`Área ${area.nombreArea} ya existe`);
      }
    }
  } catch (error) {
    logger.error('Error al inicializar áreas:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Initialize basic roles with appropriate permissions
 */
async function initializeRoles() {
  try {
    logger.info('Verificando y creando roles básicos...');
    
    const roles = getDefaultRoles();

    for (const rol of roles) {
      const existing = await executeQuery(
        'SELECT IDRol FROM Rol WHERE NombreRol = ?',
        [rol.nombreRol]
      );

      if (existing.length === 0) {
        await executeQuery(
          'INSERT INTO Rol (NombreRol, Descripcion, NivelAcceso, Permisos) VALUES (?, ?, ?, ?)',
          [rol.nombreRol, rol.descripcion, rol.nivelAcceso, rol.permisos]
        );
        logger.info(`Rol ${rol.nombreRol} creado exitosamente`);
      } else {
        // Actualizar los permisos del rol existente
        await executeQuery(
          'UPDATE Rol SET Descripcion = ?, NivelAcceso = ?, Permisos = ? WHERE NombreRol = ?',
          [rol.descripcion, rol.nivelAcceso, rol.permisos, rol.nombreRol]
        );
        logger.info(`Rol ${rol.nombreRol} actualizado exitosamente`);
      }
    }
  } catch (error) {
    logger.error('Error al inicializar roles:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Create the main Mesa de Partes entry
 */
async function initializeMesaPartes() {
  try {
    logger.info('Verificando y creando Mesa de Partes principal...');
    
    const existing = await executeQuery(
      'SELECT IDMesaPartes FROM MesaPartes WHERE CodigoIdentificacion = ?',
      ['MP-PRIN']
    );

    if (existing.length === 0) {
      await executeQuery(
        'INSERT INTO MesaPartes (Descripcion, IsActive, CodigoIdentificacion) VALUES (?, TRUE, ?)',
        ['Mesa de Partes Principal', 'MP-PRIN']
      );
      logger.info('Mesa de Partes principal creada exitosamente');
    } else {
      logger.info('Mesa de Partes principal ya existe');
    }
  } catch (error) {
    logger.error('Error al inicializar Mesa de Partes:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Create default admin user if not exists
 */
async function createDefaultAdmin() {
  try {
    logger.info('Creando usuario administrador predeterminado...');
    
    // Verificar si ya existe
    const existingAdmin = await executeQuery(
      'SELECT IDUsuario FROM Usuario WHERE CodigoCIP = ?',
      ['12345678']
    );
    
    if (existingAdmin.length > 0) {
      logger.info('Usuario administrador ya existe');
      
      // Actualizar datos del administrador existente
      await executeQuery(
        `UPDATE Usuario 
         SET Nombres = ?, Apellidos = ?, Grado = ?, PasswordHash = ? 
         WHERE IDUsuario = ?`,
        [
          'Jan',
          'Perez',
          'Teniente',
          await hashPassword('admin123'),
          existingAdmin[0].IDUsuario
        ]
      );
      logger.info(`Usuario administrador actualizado con ID: ${existingAdmin[0].IDUsuario}`);
      
      return true;
    }
    
    // Obtener IDs de rol y área administrativos
    const rolResult = await executeQuery(
      'SELECT IDRol FROM Rol WHERE NombreRol = ?',
      ['Administrador']
    );
    
    const areaResult = await executeQuery(
      'SELECT IDArea FROM Area WHERE NombreArea = ?',
      ['Administración']
    );
    
    if (rolResult.length === 0 || areaResult.length === 0) {
      throw new Error('No se encontró el rol o área de administrador');
    }
    
    const rolId = rolResult[0].IDRol;
    const areaId = areaResult[0].IDArea;
    
    // Crear hash de contraseña utilizando bcrypt
    const passwordHash = await hashPassword('admin123');
    
    // Insertar usuario administrador
    const result = await executeQuery(`
      INSERT INTO Usuario (
        CodigoCIP, Nombres, Apellidos, Grado,
        PasswordHash, IDArea, IDRol,
        UltimoAcceso, IntentosFallidos, Bloqueado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 0, 0)
    `, [
      '12345678', 'Jan', 'Perez', 'Teniente',
      passwordHash, areaId, rolId
    ]);
    
    logger.info(`Usuario administrador creado con ID: ${result.insertId}`);
    logger.info('Credenciales de acceso:');
    logger.info('CIP: 12345678');
    logger.info('Contraseña: admin123');
    
    return true;
  } catch (error) {
    logger.error('Error al crear usuario administrador:', error.message);
    throw error;
  }
}

/**
 * Initialize base security-related records and permissions
 */
async function initializeSecurity() {
  try {
    logger.info('Inicializando permisos de seguridad básicos...');
    
    // Crear permisos básicos si no existen
    const permisos = getDefaultPermissions();

    for (const permiso of permisos) {
      const existing = await executeQuery(
        'SELECT IDPermiso FROM Permiso WHERE NombrePermiso = ?',
        [permiso.nombrePermiso]
      );

      if (existing.length === 0) {
        await executeQuery(
          'INSERT INTO Permiso (NombrePermiso, Alcance, Restringido) VALUES (?, ?, ?)',
          [permiso.nombrePermiso, permiso.alcance, permiso.restringido]
        );
        logger.info(`Permiso ${permiso.nombrePermiso} creado exitosamente`);
      }
    }

    // Asignar permisos al rol administrador
    const adminRol = await executeQuery(
      'SELECT IDRol FROM Rol WHERE NombreRol = ?',
      ['Administrador']
    );

    if (adminRol[0]) {
      const permisoIds = await executeQuery('SELECT IDPermiso FROM Permiso');
      
      for (const permiso of permisoIds) {
        // Verificar si ya existe la asignación
        const existing = await executeQuery(
          'SELECT 1 FROM RolPermiso WHERE IDRol = ? AND IDPermiso = ?',
          [adminRol[0].IDRol, permiso.IDPermiso]
        );

        if (existing.length === 0) {
          await executeQuery(
            'INSERT INTO RolPermiso (IDRol, IDPermiso) VALUES (?, ?)',
            [adminRol[0].IDRol, permiso.IDPermiso]
          );
        }
      }
      
      logger.info('Permisos asignados al rol Administrador');
    }
  } catch (error) {
    logger.error('Error al inicializar seguridad:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Main function to initialize the database
 */
async function initializeDatabase() {
  try {
    logger.info('Iniciando configuración de la base de datos OFICRI...');
    
    // Deshabilitar temporalmente las verificaciones de clave foránea
    // Esto permite crear registros en cualquier orden sin problemas
    logger.info('Desactivando verificadores de clave foránea y triggers...');
    await disableConstraints();
    
    try {
      // Crear usuario administrador primero
      // Este usuario es necesario para los registros de auditoría
      await initializeRoles();
      await initializeAreas();
      await createDefaultAdmin();
      await initializeMesaPartes();
      await initializeSecurity();
      
      logger.info('Base de datos inicializada exitosamente');
      return true;
    } finally {
      // Reactivar las restricciones de clave foránea al finalizar
      logger.info('Reactivando verificadores de clave foránea y triggers...');
      await enableConstraints();
    }
  } catch (error) {
    logger.error('Error en la inicialización de la base de datos:', { error: error.message, stack: error.stack });
    throw error;
  }
}

// Si este archivo se ejecuta directamente, inicializar la base de datos
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      logger.info('Inicialización completada con éxito');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Error durante la inicialización:', error);
      process.exit(1);
    });
} else {
  // Exportar funciones para uso en otros módulos
  module.exports = {
    initializeDatabase,
    initializeAreas,
    initializeRoles,
    initializeMesaPartes,
    createDefaultAdmin,
    initializeSecurity
  };
} 