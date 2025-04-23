/**
 * Controlador de Integraciones
 * Implementa endpoints para gestión de integraciones del sistema
 * ISO/IEC 27001 compliant integration management
 */

const { pool } = require('../utils/db');
const { logSystemEvent } = require('../utils/logger/index');
const { executeQuery } = require('../utils/db/queryHelpers');
const { checkPermissions } = require('../middleware/permissions');

/**
 * Obtiene todas las integraciones del sistema
 */
exports.getIntegrations = async (req, res) => {
  try {
    // Verificar permisos de administración
    if (!checkPermissions(req.user.permisos, 128)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver integraciones del sistema'
      });
    }

    const query = `
      SELECT 
        IDIntegracion,
        Nombre,
        Tipo,
        Configuracion,
        Descripcion,
        IsActive,
        FechaCreacion,
        FechaActualizacion
      FROM Integracion
      WHERE IsActive = true
      ORDER BY Tipo, Nombre
    `;

    const integrations = await executeQuery(query);

    return res.status(200).json({
      success: true,
      data: integrations,
      message: 'Integraciones obtenidas correctamente'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al obtener integraciones', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener integraciones',
      error: error.message
    });
  }
};

/**
 * Crea una nueva integración
 */
exports.createIntegration = async (req, res) => {
  try {
    // Verificar permisos de administración
    if (!checkPermissions(req.user.permisos, 128)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para crear integraciones'
      });
    }

    const { nombre, tipo, configuracion, descripcion } = req.body;

    const query = `
      INSERT INTO Integracion (
        Nombre, Tipo, Configuracion, Descripcion,
        IsActive, FechaCreacion, FechaActualizacion
      ) VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())
    `;

    const result = await executeQuery(query, [nombre, tipo, configuracion, descripcion]);

    // Registrar evento
    logSystemEvent('INTEGRATION_CREATE', `Integración creada por ${req.user.codigoCIP}`, {
      integracion: nombre,
      tipo: tipo
    });

    return res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: 'Integración creada correctamente'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al crear integración', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear integración',
      error: error.message
    });
  }
};

/**
 * Actualiza una integración existente
 */
exports.updateIntegration = async (req, res) => {
  try {
    // Verificar permisos de administración
    if (!checkPermissions(req.user.permisos, 128)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para actualizar integraciones'
      });
    }

    const { id } = req.params;
    const { nombre, tipo, configuracion, descripcion } = req.body;

    const query = `
      UPDATE Integracion
      SET 
        Nombre = ?,
        Tipo = ?,
        Configuracion = ?,
        Descripcion = ?,
        FechaActualizacion = NOW()
      WHERE IDIntegracion = ?
    `;

    await executeQuery(query, [nombre, tipo, configuracion, descripcion, id]);

    // Registrar evento
    logSystemEvent('INTEGRATION_UPDATE', `Integración actualizada por ${req.user.codigoCIP}`, {
      integracion: nombre,
      tipo: tipo
    });

    return res.status(200).json({
      success: true,
      message: 'Integración actualizada correctamente'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al actualizar integración', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar integración',
      error: error.message
    });
  }
};

/**
 * Elimina una integración (soft delete)
 */
exports.deleteIntegration = async (req, res) => {
  try {
    // Verificar permisos de administración
    if (!checkPermissions(req.user.permisos, 128)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para eliminar integraciones'
      });
    }

    const { id } = req.params;

    const query = `
      UPDATE Integracion
      SET IsActive = FALSE,
          FechaActualizacion = NOW()
      WHERE IDIntegracion = ?
    `;

    await executeQuery(query, [id]);

    // Registrar evento
    logSystemEvent('INTEGRATION_DELETE', `Integración eliminada por ${req.user.codigoCIP}`, {
      idIntegracion: id
    });

    return res.status(200).json({
      success: true,
      message: 'Integración eliminada correctamente'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al eliminar integración', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar integración',
      error: error.message
    });
  }
}; 