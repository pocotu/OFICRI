/**
 * Controlador de Administración
 * Implementa todos los endpoints para gestión administrativa del sistema
 * ISO/IEC 27001 compliant administration
 */

const { pool } = require('../utils/db');
const { logSystemEvent, logSecurityEvent } = require('../utils/logger/index');
const { executeQuery } = require('../utils/db/queryHelpers');
const { checkPermissions } = require('../middleware/permissions');
const path = require('path');
const fs = require('fs');
const os = require('os');
const childProcess = require('child_process');
const util = require('util');
const exec = util.promisify(childProcess.exec);

// ===== Endpoints de configuración =====

/**
 * Obtiene todos los parámetros del sistema
 * Nota: Utiliza permisos contextuales en lugar de una tabla de configuración específica
 */
exports.getSystemParams = async (req, res) => {
  try {
    // Obtener permisos contextuales que pueden usarse como parámetros del sistema
    const query = `
      SELECT pc.IDPermisoContextual as IDConfig, 
             pc.TipoRecurso as Categoria,
             pc.ReglaContexto as Valor,
             r.NombreRol as Descripcion,
             pc.FechaCreacion as FechaCreacion,
             pc.Activo as IsActive
      FROM PermisoContextual pc
      JOIN Rol r ON pc.IDRol = r.IDRol
      WHERE pc.TipoRecurso = 'SISTEMA'
      ORDER BY pc.TipoRecurso, pc.IDPermisoContextual
    `;
    
    const params = await executeQuery(query);
    
    return res.status(200).json({
      success: true,
      data: params,
      message: 'Parámetros del sistema obtenidos correctamente'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al obtener parámetros del sistema', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener parámetros del sistema',
      error: error.message
    });
  }
};

/**
 * Actualiza un parámetro del sistema (a través de permisos contextuales)
 */
exports.updateSystemParam = async (req, res) => {
  const { id } = req.params;
  const { valor, descripcion } = req.body;
  
  try {
    // Verificar si el usuario tiene permiso para editar parámetros
    if (!checkPermissions(req.user.permisos, 2)) { // bit 1 = Editar (2)
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para editar parámetros del sistema'
      });
    }
    
    // Actualizar el permiso contextual que utilizamos como parámetro
    const query = `
      UPDATE PermisoContextual
      SET ReglaContexto = ?, Activo = TRUE
      WHERE IDPermisoContextual = ?
    `;
    
    await executeQuery(query, [valor, id]);
    
    // Registrar evento de configuración
    logSystemEvent('CONFIG_UPDATE', `Parámetro ID:${id} actualizado por ${req.user.codigoCIP}`, {
      parametro: id,
      usuario: req.user.id,
      valorNuevo: valor
    });
    
    return res.status(200).json({
      success: true,
      message: 'Parámetro actualizado correctamente'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al actualizar parámetro del sistema', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar parámetro del sistema',
      error: error.message
    });
  }
};

/**
 * Obtiene las áreas del sistema como reglas de negocio
 */
exports.getBusinessRules = async (req, res) => {
  try {
    // Usamos las áreas especializadas como reglas de negocio
    const query = `
      SELECT 
        IDArea as IDRegla,
        NombreArea as Nombre,
        TipoArea as Categoria,
        Descripcion,
        CodigoIdentificacion as Valor,
        IsActive
      FROM AreaEspecializada
      WHERE IsActive = true
      ORDER BY TipoArea, NombreArea
    `;
    
    const rules = await executeQuery(query);
    
    return res.status(200).json({
      success: true,
      data: rules,
      message: 'Reglas de negocio obtenidas correctamente'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al obtener reglas de negocio', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener reglas de negocio',
      error: error.message
    });
  }
};

// ===== Endpoints de monitoreo =====

/**
 * Obtiene el estado actual del sistema
 */
exports.getSystemStatus = async (req, res) => {
  try {
    // Verificar si hay conexión a la base de datos
    const dbStatus = await checkDatabaseConnection();
    
    // Verificar capacidad de disco
    const diskSpace = await checkDiskSpace();
    
    // Información del sistema
    const systemInfo = {
      uptime: os.uptime(),
      hostname: os.hostname(),
      platform: os.platform(),
      cpus: os.cpus().length,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%'
      },
      loadAverage: os.loadavg()
    };
    
    return res.status(200).json({
      success: true,
      data: {
        systemStatus: 'operational',
        database: dbStatus,
        disk: diskSpace,
        system: systemInfo,
        lastChecked: new Date().toISOString()
      },
      message: 'Estado del sistema obtenido correctamente'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al verificar estado del sistema', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar estado del sistema',
      error: error.message
    });
  }
};

/**
 * Verifica conexión a base de datos
 */
async function checkDatabaseConnection() {
  try {
    const result = await executeQuery('SELECT 1 as check_connection');
    return {
      status: 'connected',
      responseTime: result.responseTime || 'N/A'
    };
  } catch (error) {
    logSystemEvent('ERROR', 'Error en conexión a base de datos', error);
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Verifica espacio en disco
 */
async function checkDiskSpace() {
  try {
    // Esta implementación varía según el sistema operativo
    // Para Windows y Linux hay que implementar diferentes comandos
    const platform = os.platform();
    let diskInfo;
    
    if (platform === 'win32') {
      const { stdout } = await exec('wmic logicaldisk get size,freespace,caption');
      // Procesar salida de Windows
      diskInfo = {
        status: 'checked',
        details: stdout.trim()
      };
    } else {
      // Asumir Linux/Unix
      const { stdout } = await exec('df -h /');
      diskInfo = {
        status: 'checked',
        details: stdout.trim()
      };
    }
    
    return diskInfo;
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Obtiene métricas de rendimiento del sistema basado en logs de usuarios
 */
exports.getPerformanceMetrics = async (req, res) => {
  try {
    // Consultar métricas de rendimiento basadas en logs de usuario
    const queryPerformance = `
      SELECT 
        COUNT(*) as totalRequests,
        COUNT(CASE WHEN Exitoso = TRUE THEN 1 END) as successfulRequests,
        COUNT(CASE WHEN Exitoso = FALSE THEN 1 END) as failedRequests,
        COUNT(DISTINCT IDUsuario) as activeUsers,
        MIN(FechaEvento) as oldestLog,
        MAX(FechaEvento) as newestLog
      FROM UsuarioLog
      WHERE FechaEvento >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    
    const dbPerformance = await executeQuery(queryPerformance);
    
    // Memoria y CPU
    const memory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
    };
    
    const cpuUsage = os.loadavg()[0].toFixed(2); // Carga promedio de 1 minuto
    
    return res.status(200).json({
      success: true,
      data: {
        database: dbPerformance[0] || {},
        system: {
          memory,
          cpu: {
            usage: cpuUsage,
            cores: os.cpus().length
          }
        },
        timestamp: new Date().toISOString()
      },
      message: 'Métricas de rendimiento obtenidas correctamente'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al obtener métricas de rendimiento', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de rendimiento',
      error: error.message
    });
  }
};

/**
 * Obtiene errores recientes del sistema
 */
exports.getSystemErrors = async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    // Obtener errores del sistema de la tabla UsuarioLog
    const query = `
      SELECT *
      FROM UsuarioLog
      WHERE TipoEvento LIKE 'ERROR%' OR Exitoso = FALSE
      ORDER BY FechaEvento DESC
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM UsuarioLog
      WHERE TipoEvento LIKE 'ERROR%' OR Exitoso = FALSE
    `;
    
    const errors = await executeQuery(query, [parseInt(limit), parseInt(offset)]);
    const totalCount = await executeQuery(countQuery);
    const total = totalCount[0].total;
    
    return res.status(200).json({
      success: true,
      data: errors,
      message: 'Errores del sistema obtenidos correctamente',
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al obtener errores del sistema', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener errores del sistema',
      error: error.message
    });
  }
};

/**
 * Obtiene estadísticas de uso del sistema
 */
exports.getSystemUsage = async (req, res) => {
  try {
    // Obtener estadísticas de usuarios activos
    const userQuery = `
      SELECT COUNT(DISTINCT IDUsuario) as activeUsers
      FROM UsuarioLog
      WHERE FechaEvento >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    
    // Obtener estadísticas de usuarios por área
    const areaUsersQuery = `
      SELECT 
        a.NombreArea, 
        COUNT(u.IDUsuario) as userCount
      FROM AreaEspecializada a
      LEFT JOIN Usuario u ON a.IDArea = u.IDArea
      GROUP BY a.IDArea, a.NombreArea
      ORDER BY userCount DESC
    `;
    
    // Obtener estadísticas de roles
    const roleQuery = `
      SELECT 
        r.NombreRol, 
        COUNT(u.IDUsuario) as userCount
      FROM Rol r
      LEFT JOIN Usuario u ON r.IDRol = u.IDRol
      GROUP BY r.IDRol, r.NombreRol
      ORDER BY userCount DESC
    `;
    
    const [usersStats, areaStats, roleStats] = await Promise.all([
      executeQuery(userQuery),
      executeQuery(areaUsersQuery),
      executeQuery(roleQuery)
    ]);
    
    return res.status(200).json({
      success: true,
      data: {
        activeUsers: usersStats[0] || { activeUsers: 0 },
        usersByArea: areaStats,
        usersByRole: roleStats,
        timestamp: new Date().toISOString()
      },
      message: 'Estadísticas de uso obtenidas correctamente'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al obtener estadísticas de uso', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de uso',
      error: error.message
    });
  }
};

// ===== Endpoints de mantenimiento =====

/**
 * Limpia registros antiguos
 */
exports.cleanupOldRecords = async (req, res) => {
  try {
    // Verificar permisos de administrador
    if (!checkPermissions(req.user.permisos, 128)) { // bit 7 = Administrar (128)
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para limpiar registros antiguos'
      });
    }
    
    const { days = 90 } = req.body;
    
    // Eliminar logs antiguos
    const query = `
      DELETE FROM UsuarioLog 
      WHERE FechaEvento < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    const result = await executeQuery(query, [days]);
    
    logSystemEvent('RECORDS_CLEANUP', `Registros antiguos limpiados por ${req.user.codigoCIP}`, {
      days,
      affectedRows: result.affectedRows
    });
    
    return res.status(200).json({
      success: true,
      data: {
        deletedRecords: result.affectedRows,
        timestamp: new Date().toISOString()
      },
      message: 'Limpieza de registros antiguos completada'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al limpiar registros antiguos', error);
    return res.status(500).json({
      success: false,
      message: 'Error al limpiar registros antiguos',
      error: error.message
    });
  }
};

// ===== Endpoints de auditoría =====

/**
 * Obtiene logs del sistema
 */
exports.getSystemLogs = async (req, res) => {
  try {
    // Verificar permisos de auditoría
    if (!checkPermissions(req.user.permisos, 32)) { // bit 5 = Auditar (32)
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver logs del sistema'
      });
    }
    
    const { page = 1, limit = 50, tipo, fechaDesde, fechaHasta } = req.query;
    const offset = (page - 1) * limit;
    
    // Construir condiciones de filtro
    let conditions = '1=1';
    const params = [];
    
    if (tipo) {
      conditions += ' AND TipoEvento = ?';
      params.push(tipo);
    }
    
    if (fechaDesde) {
      conditions += ' AND FechaEvento >= ?';
      params.push(fechaDesde);
    }
    
    if (fechaHasta) {
      conditions += ' AND FechaEvento <= ?';
      params.push(fechaHasta);
    }
    
    // Query para obtener logs
    const query = `
      SELECT * FROM UsuarioLog
      WHERE ${conditions}
      ORDER BY FechaEvento DESC
      LIMIT ? OFFSET ?
    `;
    
    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total FROM UsuarioLog
      WHERE ${conditions}
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    
    const logs = await executeQuery(query, params);
    const totalCount = await executeQuery(countQuery, params.slice(0, params.length - 2));
    const total = totalCount[0].total;
    
    return res.status(200).json({
      success: true,
      data: logs,
      message: 'Logs del sistema obtenidos correctamente',
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al obtener logs del sistema', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener logs del sistema',
      error: error.message
    });
  }
};

/**
 * Obtiene logs de acciones de usuarios
 */
exports.getUserActions = async (req, res) => {
  try {
    // Verificar permisos de auditoría
    if (!checkPermissions(req.user.permisos, 32)) { // bit 5 = Auditar (32)
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver acciones de usuarios'
      });
    }
    
    const { page = 1, limit = 50, usuario, accion, fechaDesde, fechaHasta } = req.query;
    const offset = (page - 1) * limit;
    
    // Construir condiciones de filtro
    let conditions = "TipoEvento LIKE 'USER_%'";
    const params = [];
    
    if (usuario) {
      conditions += ' AND IDUsuario = ?';
      params.push(usuario);
    }
    
    if (accion) {
      conditions += ' AND TipoEvento = ?';
      params.push(accion);
    }
    
    if (fechaDesde) {
      conditions += ' AND FechaEvento >= ?';
      params.push(fechaDesde);
    }
    
    if (fechaHasta) {
      conditions += ' AND FechaEvento <= ?';
      params.push(fechaHasta);
    }
    
    // Query para obtener logs
    const query = `
      SELECT ul.*, u.CodigoCIP, u.Nombres, u.Apellidos
      FROM UsuarioLog ul
      JOIN Usuario u ON ul.IDUsuario = u.IDUsuario
      WHERE ${conditions}
      ORDER BY FechaEvento DESC
      LIMIT ? OFFSET ?
    `;
    
    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM UsuarioLog
      WHERE ${conditions}
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    
    const logs = await executeQuery(query, params);
    const totalCount = await executeQuery(countQuery, params.slice(0, params.length - 2));
    const total = totalCount[0].total;
    
    return res.status(200).json({
      success: true,
      data: logs,
      message: 'Acciones de usuarios obtenidas correctamente',
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al obtener acciones de usuarios', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener acciones de usuarios',
      error: error.message
    });
  }
};

/**
 * Obtiene logs de cambios de configuración
 */
exports.getConfigChanges = async (req, res) => {
  try {
    // Verificar permisos de auditoría
    if (!checkPermissions(req.user.permisos, 32)) { // bit 5 = Auditar (32)
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver cambios de configuración'
      });
    }
    
    const { page = 1, limit = 50, usuario, fechaDesde, fechaHasta } = req.query;
    const offset = (page - 1) * limit;
    
    // Construir condiciones de filtro
    let conditions = "TipoEvento LIKE 'CONFIG_%'";
    const params = [];
    
    if (usuario) {
      conditions += ' AND IDUsuario = ?';
      params.push(usuario);
    }
    
    if (fechaDesde) {
      conditions += ' AND FechaEvento >= ?';
      params.push(fechaDesde);
    }
    
    if (fechaHasta) {
      conditions += ' AND FechaEvento <= ?';
      params.push(fechaHasta);
    }
    
    // Query para obtener logs
    const query = `
      SELECT ul.*, u.CodigoCIP, u.Nombres, u.Apellidos
      FROM UsuarioLog ul
      JOIN Usuario u ON ul.IDUsuario = u.IDUsuario
      WHERE ${conditions}
      ORDER BY FechaEvento DESC
      LIMIT ? OFFSET ?
    `;
    
    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM UsuarioLog
      WHERE ${conditions}
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    
    const logs = await executeQuery(query, params);
    const totalCount = await executeQuery(countQuery, params.slice(0, params.length - 2));
    const total = totalCount[0].total;
    
    return res.status(200).json({
      success: true,
      data: logs,
      message: 'Cambios de configuración obtenidos correctamente',
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al obtener cambios de configuración', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener cambios de configuración',
      error: error.message
    });
  }
};

/**
 * Obtiene logs de eventos de seguridad
 */
exports.getSecurityEvents = async (req, res) => {
  try {
    // Verificar permisos de auditoría
    if (!checkPermissions(req.user.permisos, 32)) { // bit 5 = Auditar (32)
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver eventos de seguridad'
      });
    }
    
    const { page = 1, limit = 50, tipo, fechaDesde, fechaHasta } = req.query;
    const offset = (page - 1) * limit;
    
    // Construir condiciones de filtro
    let conditions = "TipoEvento LIKE 'SECURITY_%'";
    const params = [];
    
    if (tipo) {
      conditions += ' AND TipoEvento = ?';
      params.push(tipo);
    }
    
    if (fechaDesde) {
      conditions += ' AND FechaEvento >= ?';
      params.push(fechaDesde);
    }
    
    if (fechaHasta) {
      conditions += ' AND FechaEvento <= ?';
      params.push(fechaHasta);
    }
    
    // Query para obtener logs
    const query = `
      SELECT ul.*, u.CodigoCIP, u.Nombres, u.Apellidos
      FROM UsuarioLog ul
      LEFT JOIN Usuario u ON ul.IDUsuario = u.IDUsuario
      WHERE ${conditions}
      ORDER BY FechaEvento DESC
      LIMIT ? OFFSET ?
    `;
    
    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM UsuarioLog
      WHERE ${conditions}
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    
    const logs = await executeQuery(query, params);
    const totalCount = await executeQuery(countQuery, params.slice(0, params.length - 2));
    const total = totalCount[0].total;
    
    return res.status(200).json({
      success: true,
      data: logs,
      message: 'Eventos de seguridad obtenidos correctamente',
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al obtener eventos de seguridad', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener eventos de seguridad',
      error: error.message
    });
  }
}; 