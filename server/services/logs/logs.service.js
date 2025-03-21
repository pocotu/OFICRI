/**
 * Servicio de gestión de logs
 * Proporciona funciones para obtener y exportar logs de la aplicación
 * Implementado según ISO/IEC 27001 sección A.12.4
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { createGzip } = require('zlib');
const { logger } = require('../../utils/logger');
const db = require('../../config/database');

// Convertir pipeline a una versión que utilice Promesas
const pipelineAsync = promisify(pipeline);

// Directorio donde se almacenan los logs
const logDir = path.join(process.cwd(), 'logs');

/**
 * Obtiene logs del sistema según los parámetros de filtrado
 * @param {Object} filters - Filtros para los logs
 * @param {string} filters.tipo - Tipo de log (application, security, error, etc.)
 * @param {Date} filters.fechaInicio - Fecha de inicio para filtrar logs
 * @param {Date} filters.fechaFin - Fecha de fin para filtrar logs
 * @param {number} filters.limit - Límite de registros a retornar
 * @param {number} filters.offset - Desplazamiento para paginación
 * @returns {Promise<Array>} - Logs que cumplen con los criterios de filtrado
 */
async function getLogs(filters = {}) {
  try {
    const { tipo, fechaInicio, fechaFin, limit = 100, offset = 0 } = filters;
    
    // Seleccionar la tabla según el tipo de log
    let tableName;
    switch (tipo?.toLowerCase()) {
      case 'usuario':
        tableName = 'UsuarioLog';
        break;
      case 'documento':
        tableName = 'DocumentoLog';
        break;
      case 'area':
        tableName = 'AreaLog';
        break;
      case 'rol':
        tableName = 'RolLog';
        break;
      case 'permiso':
        tableName = 'PermisoLog';
        break;
      case 'mesapartes':
        tableName = 'MesaPartesLog';
        break;
      case 'derivacion':
        tableName = 'DerivacionLog';
        break;
      case 'request':
        tableName = 'RequestLog';
        break;
      case 'intrusion':
        tableName = 'IntrusionDetectionLog';
        break;
      case 'exportacion':
        tableName = 'ExportacionLog';
        break;
      case 'backup':
        tableName = 'BackupLog';
        break;
      default:
        // Si no se especifica un tipo, usar los logs de usuarios por defecto
        tableName = 'UsuarioLog';
    }
    
    // Construir consulta base
    let query = `SELECT * FROM ${tableName}`;
    const queryParams = [];
    
    // Agregar filtros de fecha si se proporcionan
    if (fechaInicio || fechaFin) {
      const condiciones = [];
      
      if (fechaInicio) {
        condiciones.push('FechaEvento >= ?');
        queryParams.push(new Date(fechaInicio));
      }
      
      if (fechaFin) {
        condiciones.push('FechaEvento <= ?');
        queryParams.push(new Date(fechaFin));
      }
      
      if (condiciones.length > 0) {
        query += ' WHERE ' + condiciones.join(' AND ');
      }
    }
    
    // Ordenar por fecha descendente (más recientes primero)
    query += ' ORDER BY FechaEvento DESC';
    
    // Agregar paginación
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit, 10));
    queryParams.push(parseInt(offset, 10));
    
    // Ejecutar consulta
    const logs = await db.executeQuery(query, queryParams);
    
    // Obtener el total de registros para la paginación
    let countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
    const countParams = [];
    
    // Agregar los mismos filtros de fecha a la consulta de conteo
    if (fechaInicio || fechaFin) {
      const condiciones = [];
      
      if (fechaInicio) {
        condiciones.push('FechaEvento >= ?');
        countParams.push(new Date(fechaInicio));
      }
      
      if (fechaFin) {
        condiciones.push('FechaEvento <= ?');
        countParams.push(new Date(fechaFin));
      }
      
      if (condiciones.length > 0) {
        countQuery += ' WHERE ' + condiciones.join(' AND ');
      }
    }
    
    const [countResult] = await db.executeQuery(countQuery, countParams);
    const total = countResult?.total || 0;
    
    return {
      logs,
      pagination: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error al obtener logs:', { error: error.message, stack: error.stack });
    throw new Error(`Error al obtener logs: ${error.message}`);
  }
}

/**
 * Obtiene logs de los archivos del sistema
 * @param {Object} filters - Filtros para los logs
 * @param {string} filters.tipo - Tipo de archivo de log (app, error, security, etc.)
 * @param {number} filters.limit - Número máximo de líneas a leer
 * @param {number} filters.offset - Número de líneas a omitir desde el inicio
 * @returns {Promise<Array>} - Contenido de los logs
 */
async function getFileSystemLogs(filters = {}) {
  try {
    const { tipo = 'app', limit = 1000, offset = 0 } = filters;
    
    // Mapear tipo a nombre de archivo
    let fileName;
    switch (tipo.toLowerCase()) {
      case 'error':
        fileName = 'error.log';
        break;
      case 'security':
        fileName = 'security.log';
        break;
      case 'exceptions':
        fileName = 'exceptions.log';
        break;
      case 'rejections':
        fileName = 'rejections.log';
        break;
      default:
        fileName = 'app.log';
    }
    
    const filePath = path.join(logDir, fileName);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      return { 
        logs: [],
        pagination: {
          total: 0,
          limit: parseInt(limit, 10),
          offset: parseInt(offset, 10),
          pages: 0
        }
      };
    }
    
    // Leer y parsear el archivo de log
    const fileContent = await fs.promises.readFile(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // Calcular total, offset y limit para paginación
    const total = lines.length;
    const safeOffset = Math.min(offset, total);
    const safeLimit = Math.min(limit, 1000); // Limitar a máximo 1000 líneas
    
    // Obtener solo las líneas solicitadas
    const selectedLines = lines
      .slice(safeOffset, safeOffset + safeLimit)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { raw: line };
        }
      });
    
    return {
      logs: selectedLines,
      pagination: {
        total,
        limit: safeLimit,
        offset: safeOffset,
        pages: Math.ceil(total / safeLimit)
      }
    };
  } catch (error) {
    logger.error('Error al obtener logs del sistema de archivos:', { error: error.message, stack: error.stack });
    throw new Error(`Error al obtener logs del sistema de archivos: ${error.message}`);
  }
}

/**
 * Exporta logs a un archivo para descarga
 * @param {Object} options - Opciones para la exportación
 * @param {string} options.tipo - Tipo de log a exportar
 * @param {Date} options.fechaInicio - Fecha de inicio para filtrar logs
 * @param {Date} options.fechaFin - Fecha de fin para filtrar logs
 * @param {string} options.formato - Formato de exportación (json, csv)
 * @param {number} options.idUsuario - ID del usuario que realiza la exportación
 * @returns {Promise<Object>} - Información del archivo exportado
 */
async function exportLogs(options) {
  try {
    const { tipo, fechaInicio, fechaFin, formato = 'json', idUsuario } = options;
    
    // Obtener logs según los filtros
    const { logs } = await getLogs({ tipo, fechaInicio, fechaFin, limit: 10000 });
    
    // Crear nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `logs_${tipo || 'usuario'}_${timestamp}.${formato === 'csv' ? 'csv' : 'json'}`;
    const outputPath = path.join(logDir, 'exports', fileName);
    
    // Asegurar que el directorio existe
    await fs.promises.mkdir(path.join(logDir, 'exports'), { recursive: true });
    
    // Exportar según el formato solicitado
    if (formato === 'csv') {
      if (logs.length === 0) {
        await fs.promises.writeFile(outputPath, 'No hay registros para exportar');
      } else {
        // Obtener encabezados CSV desde las claves del primer objeto
        const headers = Object.keys(logs[0]).join(',');
        // Convertir cada registro a formato CSV
        const rows = logs.map(log => 
          Object.values(log).map(value => 
            typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
          ).join(',')
        );
        
        // Escribir archivo CSV
        await fs.promises.writeFile(outputPath, [headers, ...rows].join('\n'));
      }
    } else {
      // Formato JSON por defecto
      await fs.promises.writeFile(outputPath, JSON.stringify(logs, null, 2));
    }
    
    // Comprimir el archivo para reducir tamaño
    const gzipFileName = `${fileName}.gz`;
    const gzipPath = path.join(logDir, 'exports', gzipFileName);
    
    const source = createReadStream(outputPath);
    const destination = createWriteStream(gzipPath);
    const gzip = createGzip();
    
    await pipelineAsync(source, gzip, destination);
    
    // Eliminar archivo sin comprimir para ahorrar espacio
    await fs.promises.unlink(outputPath);
    
    // Registrar la exportación en la base de datos
    await db.executeQuery(
      `INSERT INTO ExportacionLog 
       (IDUsuario, TipoDatoExportado, FechaInicio, FechaFin, NombreArchivo, FechaExportacion) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        idUsuario,
        `Logs_${tipo || 'Usuario'}`,
        fechaInicio ? new Date(fechaInicio) : null,
        fechaFin ? new Date(fechaFin) : null,
        gzipFileName
      ]
    );
    
    return {
      fileName: gzipFileName,
      filePath: gzipPath,
      fileSize: (await fs.promises.stat(gzipPath)).size,
      recordCount: logs.length
    };
  } catch (error) {
    logger.error('Error al exportar logs:', { error: error.message, stack: error.stack });
    throw new Error(`Error al exportar logs: ${error.message}`);
  }
}

/**
 * Descarga un archivo exportado previamente
 * @param {string} fileName - Nombre del archivo a descargar
 * @returns {Promise<Object>} - Información del archivo
 */
async function downloadExportedLog(fileName) {
  try {
    // Verificar que el nombre de archivo sea seguro y no contenga caracteres especiales
    const safeFileName = path.basename(fileName);
    
    // Verificar que el archivo exista
    const filePath = path.join(logDir, 'exports', safeFileName);
    if (!fs.existsSync(filePath)) {
      throw new Error('El archivo solicitado no existe');
    }
    
    // Obtener información del archivo
    const stats = await fs.promises.stat(filePath);
    
    return {
      fileName: safeFileName,
      filePath,
      fileSize: stats.size,
      contentType: safeFileName.endsWith('.gz') 
        ? 'application/gzip' 
        : safeFileName.endsWith('.json') 
          ? 'application/json' 
          : 'text/csv'
    };
  } catch (error) {
    logger.error('Error al descargar archivo de logs:', { error: error.message, stack: error.stack });
    throw new Error(`Error al descargar archivo de logs: ${error.message}`);
  }
}

/**
 * Obtener estadísticas de eventos de seguridad
 * @param {Object} filters - Filtros para las estadísticas
 * @returns {Promise<Object>} - Estadísticas de seguridad
 */
async function getSecurityStats(filters = {}) {
  try {
    const { fechaInicio, fechaFin } = filters;
    
    let query = `
      SELECT 
        TipoEvento, 
        COUNT(*) as total 
      FROM IntrusionDetectionLog 
      WHERE 1=1
    `;
    const params = [];
    
    if (fechaInicio) {
      query += ' AND FechaEvento >= ?';
      params.push(new Date(fechaInicio));
    }
    
    if (fechaFin) {
      query += ' AND FechaEvento <= ?';
      params.push(new Date(fechaFin));
    }
    
    query += ' GROUP BY TipoEvento ORDER BY total DESC';
    
    const intrusionStats = await db.executeQuery(query, params);
    
    // Obtener totales por tipo de log
    const logTables = [
      'UsuarioLog', 'DocumentoLog', 'AreaLog', 'RolLog', 
      'PermisoLog', 'DerivacionLog', 'RequestLog', 
      'IntrusionDetectionLog', 'ExportacionLog', 'BackupLog'
    ];
    
    // Crear consultas para contar registros en cada tabla
    const logTableCounts = await Promise.all(
      logTables.map(async (table) => {
        let countQuery = `SELECT COUNT(*) as total FROM ${table}`;
        const countParams = [];
        
        if (fechaInicio) {
          countQuery += ' WHERE FechaEvento >= ?';
          countParams.push(new Date(fechaInicio));
        }
        
        if (fechaFin && fechaInicio) {
          countQuery += ' AND FechaEvento <= ?';
          countParams.push(new Date(fechaFin));
        } else if (fechaFin) {
          countQuery += ' WHERE FechaEvento <= ?';
          countParams.push(new Date(fechaFin));
        }
        
        const [result] = await db.executeQuery(countQuery, countParams);
        return {
          table,
          count: result?.total || 0
        };
      })
    );
    
    return {
      intrusionsByType: intrusionStats,
      logTableCounts,
      totalLogs: logTableCounts.reduce((sum, item) => sum + item.count, 0)
    };
  } catch (error) {
    logger.error('Error al obtener estadísticas de seguridad:', { error: error.message, stack: error.stack });
    throw new Error(`Error al obtener estadísticas de seguridad: ${error.message}`);
  }
}

// Exportar funciones del servicio
module.exports = {
  getLogs,
  getFileSystemLogs,
  exportLogs,
  downloadExportedLog,
  getSecurityStats
}; 