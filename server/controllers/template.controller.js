/**
 * Controlador de Plantillas
 * Implementa endpoints para gestión de plantillas del sistema
 * ISO/IEC 27001 compliant template management
 */

const { pool } = require('../utils/db');
const { logSystemEvent } = require('../utils/logger/index');
const { executeQuery } = require('../utils/db/queryHelpers');
const { checkPermissions } = require('../middleware/permissions');

/**
 * Obtiene todas las plantillas del sistema
 */
exports.getTemplates = async (req, res) => {
  try {
    // Verificar permisos de administración
    if (!checkPermissions(req.user.permisos, 128)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver plantillas del sistema'
      });
    }

    const query = `
      SELECT 
        IDPlantilla,
        Nombre,
        Tipo,
        Contenido,
        Descripcion,
        IsActive,
        FechaCreacion,
        FechaActualizacion
      FROM Plantilla
      WHERE IsActive = true
      ORDER BY Tipo, Nombre
    `;

    const templates = await executeQuery(query);

    return res.status(200).json({
      success: true,
      data: templates,
      message: 'Plantillas obtenidas correctamente'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al obtener plantillas', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener plantillas',
      error: error.message
    });
  }
};

/**
 * Crea una nueva plantilla
 */
exports.createTemplate = async (req, res) => {
  try {
    // Verificar permisos de administración
    if (!checkPermissions(req.user.permisos, 128)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para crear plantillas'
      });
    }

    const { nombre, tipo, contenido, descripcion } = req.body;

    const query = `
      INSERT INTO Plantilla (
        Nombre, Tipo, Contenido, Descripcion,
        IsActive, FechaCreacion, FechaActualizacion
      ) VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())
    `;

    const result = await executeQuery(query, [nombre, tipo, contenido, descripcion]);

    // Registrar evento
    logSystemEvent('TEMPLATE_CREATE', `Plantilla creada por ${req.user.codigoCIP}`, {
      plantilla: nombre,
      tipo: tipo
    });

    return res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: 'Plantilla creada correctamente'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al crear plantilla', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear plantilla',
      error: error.message
    });
  }
};

/**
 * Actualiza una plantilla existente
 */
exports.updateTemplate = async (req, res) => {
  try {
    // Verificar permisos de administración
    if (!checkPermissions(req.user.permisos, 128)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para actualizar plantillas'
      });
    }

    const { id } = req.params;
    const { nombre, tipo, contenido, descripcion } = req.body;

    const query = `
      UPDATE Plantilla
      SET 
        Nombre = ?,
        Tipo = ?,
        Contenido = ?,
        Descripcion = ?,
        FechaActualizacion = NOW()
      WHERE IDPlantilla = ?
    `;

    await executeQuery(query, [nombre, tipo, contenido, descripcion, id]);

    // Registrar evento
    logSystemEvent('TEMPLATE_UPDATE', `Plantilla actualizada por ${req.user.codigoCIP}`, {
      plantilla: nombre,
      tipo: tipo
    });

    return res.status(200).json({
      success: true,
      message: 'Plantilla actualizada correctamente'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al actualizar plantilla', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar plantilla',
      error: error.message
    });
  }
};

/**
 * Elimina una plantilla (soft delete)
 */
exports.deleteTemplate = async (req, res) => {
  try {
    // Verificar permisos de administración
    if (!checkPermissions(req.user.permisos, 128)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para eliminar plantillas'
      });
    }

    const { id } = req.params;

    const query = `
      UPDATE Plantilla
      SET IsActive = FALSE,
          FechaActualizacion = NOW()
      WHERE IDPlantilla = ?
    `;

    await executeQuery(query, [id]);

    // Registrar evento
    logSystemEvent('TEMPLATE_DELETE', `Plantilla eliminada por ${req.user.codigoCIP}`, {
      idPlantilla: id
    });

    return res.status(200).json({
      success: true,
      message: 'Plantilla eliminada correctamente'
    });
  } catch (error) {
    logSystemEvent('ERROR', 'Error al eliminar plantilla', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar plantilla',
      error: error.message
    });
  }
}; 