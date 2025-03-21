/**
 * Controlador para gestión de logs
 * Implementa endpoints para obtener y exportar logs del sistema
 */

const path = require('path');
const { logger } = require('../utils/logger');
const logsService = require('../services/logs/logs.service');

/**
 * Obtiene logs del sistema según los parámetros de filtrado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
async function getLogs(req, res) {
  try {
    const { tipo, fechaInicio, fechaFin, limit, offset } = req.query;
    
    const result = await logsService.getLogs({
      tipo,
      fechaInicio,
      fechaFin,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0
    });
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error en endpoint getLogs:', { error: error.message, stack: error.stack });
    return res.status(500).json({ 
      error: 'Error al obtener logs', 
      message: error.message 
    });
  }
}

/**
 * Obtiene logs desde archivos del sistema según los parámetros de filtrado
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
async function getFileSystemLogs(req, res) {
  try {
    const { tipo, limit, offset } = req.query;
    
    const result = await logsService.getFileSystemLogs({
      tipo,
      limit: limit ? parseInt(limit, 10) : 1000,
      offset: offset ? parseInt(offset, 10) : 0
    });
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error en endpoint getFileSystemLogs:', { error: error.message, stack: error.stack });
    return res.status(500).json({ 
      error: 'Error al obtener logs del sistema de archivos', 
      message: error.message 
    });
  }
}

/**
 * Exporta logs a un archivo para descarga
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
async function exportLogs(req, res) {
  try {
    const { tipo, fechaInicio, fechaFin, formato } = req.body;
    
    // Verificar que el usuario está autenticado
    if (!req.user || !req.user.IDUsuario) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    const exportInfo = await logsService.exportLogs({
      tipo,
      fechaInicio,
      fechaFin,
      formato,
      idUsuario: req.user.IDUsuario
    });
    
    return res.status(200).json({
      message: 'Logs exportados exitosamente',
      exportInfo
    });
  } catch (error) {
    logger.error('Error en endpoint exportLogs:', { error: error.message, stack: error.stack });
    return res.status(500).json({ 
      error: 'Error al exportar logs', 
      message: error.message 
    });
  }
}

/**
 * Descarga un archivo de logs exportado previamente
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
async function downloadExportedLog(req, res) {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({ error: 'Nombre de archivo requerido' });
    }
    
    const fileInfo = await logsService.downloadExportedLog(fileName);
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', fileInfo.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.fileName}"`);
    res.setHeader('Content-Length', fileInfo.fileSize);
    
    // Enviar el archivo
    return res.sendFile(path.resolve(fileInfo.filePath));
  } catch (error) {
    logger.error('Error en endpoint downloadExportedLog:', { error: error.message, stack: error.stack });
    return res.status(500).json({ 
      error: 'Error al descargar archivo de logs', 
      message: error.message 
    });
  }
}

/**
 * Obtiene estadísticas de eventos de seguridad
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
async function getSecurityStats(req, res) {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    const stats = await logsService.getSecurityStats({
      fechaInicio,
      fechaFin
    });
    
    return res.status(200).json(stats);
  } catch (error) {
    logger.error('Error en endpoint getSecurityStats:', { error: error.message, stack: error.stack });
    return res.status(500).json({ 
      error: 'Error al obtener estadísticas de seguridad', 
      message: error.message 
    });
  }
}

// Exportar funciones del controlador
module.exports = {
  getLogs,
  getFileSystemLogs,
  exportLogs,
  downloadExportedLog,
  getSecurityStats
}; 