/**
 * Area Controller
 * Implementación de manejo de áreas según ISO/IEC 27001
 */

const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * Obtener todas las áreas con paginación
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAllAreas = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const query = `
      SELECT a.id, a.nombre, a.descripcion, a.idResponsable, 
             u.nombre as responsableNombre, u.apellido as responsableApellido,
             a.fechaCreacion, a.fechaActualizacion
      FROM areas a
      LEFT JOIN usuarios u ON a.idResponsable = u.id
      ORDER BY a.nombre ASC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM areas
    `;
    
    const [areas, countResult] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(countQuery)
    ]);
    
    return res.status(200).json({
      success: true,
      data: areas.rows,
      count: parseInt(countResult.rows[0].total),
      message: 'Áreas obtenidas correctamente'
    });
  } catch (error) {
    logger.error('Error al obtener áreas', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener áreas',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Obtener área por ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAreaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de área inválido'
      });
    }
    
    const query = `
      SELECT a.id, a.nombre, a.descripcion, a.idResponsable, 
             u.nombre as responsableNombre, u.apellido as responsableApellido,
             a.fechaCreacion, a.fechaActualizacion
      FROM areas a
      LEFT JOIN usuarios u ON a.idResponsable = u.id
      WHERE a.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Área obtenida correctamente'
    });
  } catch (error) {
    logger.error('Error al obtener área por ID', { id: req.params.id, error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener área',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Crear nueva área
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createArea = async (req, res) => {
  try {
    const { nombre, descripcion, idResponsable } = req.body;
    
    // Validación básica
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del área es obligatorio'
      });
    }
    
    // Verificar si el área ya existe
    const existsQuery = 'SELECT id FROM areas WHERE LOWER(nombre) = LOWER($1)';
    const existsResult = await pool.query(existsQuery, [nombre]);
    
    if (existsResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un área con ese nombre'
      });
    }
    
    // Verificar si el responsable existe (si se proporciona)
    if (idResponsable) {
      const responsableQuery = 'SELECT id FROM usuarios WHERE id = $1';
      const responsableResult = await pool.query(responsableQuery, [idResponsable]);
      
      if (responsableResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El responsable especificado no existe'
        });
      }
    }
    
    // Crear el área
    const insertQuery = `
      INSERT INTO areas 
        (nombre, descripcion, idResponsable)
      VALUES 
        ($1, $2, $3)
      RETURNING id, nombre, descripcion, idResponsable, fechaCreacion
    `;
    
    const result = await pool.query(insertQuery, [
      nombre, descripcion || '', idResponsable || null
    ]);
    
    logger.info('Área creada', { id: result.rows[0].id, nombre });
    
    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Área creada correctamente'
    });
  } catch (error) {
    logger.error('Error al crear área', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al crear área',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Actualizar área por ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, idResponsable } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de área inválido'
      });
    }
    
    // Verificar si el área existe
    const existsQuery = 'SELECT id FROM areas WHERE id = $1';
    const existsResult = await pool.query(existsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
    }
    
    // Verificar nombre único
    if (nombre) {
      const nameQuery = 'SELECT id FROM areas WHERE LOWER(nombre) = LOWER($1) AND id != $2';
      const nameResult = await pool.query(nameQuery, [nombre, id]);
      
      if (nameResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe otra área con ese nombre'
        });
      }
    }
    
    // Verificar si el responsable existe (si se proporciona)
    if (idResponsable) {
      const responsableQuery = 'SELECT id FROM usuarios WHERE id = $1';
      const responsableResult = await pool.query(responsableQuery, [idResponsable]);
      
      if (responsableResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El responsable especificado no existe'
        });
      }
    }
    
    // Construir la consulta de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCounter = 1;
    
    if (nombre !== undefined) {
      updates.push(`nombre = $${paramCounter++}`);
      values.push(nombre);
    }
    
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramCounter++}`);
      values.push(descripcion);
    }
    
    if (idResponsable !== undefined) {
      updates.push(`idResponsable = $${paramCounter++}`);
      values.push(idResponsable || null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }
    
    // Agregar el ID al final de los valores
    values.push(id);
    
    const updateQuery = `
      UPDATE areas 
      SET ${updates.join(', ')}, fechaActualizacion = NOW()
      WHERE id = $${paramCounter}
      RETURNING id, nombre, descripcion, idResponsable, fechaActualizacion
    `;
    
    const result = await pool.query(updateQuery, values);
    
    logger.info('Área actualizada', { id, datosActualizados: req.body });
    
    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Área actualizada correctamente'
    });
  } catch (error) {
    logger.error('Error al actualizar área', { id: req.params.id, error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar área',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Eliminar área por ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteArea = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de área inválido'
      });
    }
    
    // Verificar si el área existe
    const existsQuery = 'SELECT id FROM areas WHERE id = $1';
    const existsResult = await pool.query(existsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
    }
    
    // Verificar si hay usuarios asociados a esta área
    const usersQuery = 'SELECT COUNT(*) as total FROM usuarios WHERE idArea = $1';
    const usersResult = await pool.query(usersQuery, [id]);
    
    if (parseInt(usersResult.rows[0].total) > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar el área porque hay usuarios asociados',
        extra: { usuariosAsociados: parseInt(usersResult.rows[0].total) }
      });
    }
    
    // Verificar si hay documentos asociados a esta área
    const docsQuery = 'SELECT COUNT(*) as total FROM documentos WHERE idArea = $1 OR idAreaDestino = $1';
    const docsResult = await pool.query(docsQuery, [id]);
    
    if (parseInt(docsResult.rows[0].total) > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar el área porque hay documentos asociados',
        extra: { documentosAsociados: parseInt(docsResult.rows[0].total) }
      });
    }
    
    // Eliminar el área
    const deleteQuery = 'DELETE FROM areas WHERE id = $1 RETURNING id';
    await pool.query(deleteQuery, [id]);
    
    logger.info('Área eliminada', { id });
    
    return res.status(200).json({
      success: true,
      message: 'Área eliminada correctamente'
    });
  } catch (error) {
    logger.error('Error al eliminar área', { id: req.params.id, error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar área',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Obtener documentos de un área
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAreaDocumentos = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin, estado } = req.query;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de área inválido'
      });
    }
    
    // Verificar si el área existe
    const existsQuery = 'SELECT id FROM areas WHERE id = $1';
    const existsResult = await pool.query(existsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
    }
    
    // Construir la consulta para obtener documentos
    let query = `
      SELECT d.id, d.codigo, d.asunto, d.fechaRegistro, d.estado,
             d.prioridad, d.observaciones, d.idAreaDestino, a.nombre as areaDestinoNombre,
             d.fechaActualizacion
      FROM documentos d
      LEFT JOIN areas a ON d.idAreaDestino = a.id
      WHERE (d.idArea = $1 OR d.idAreaDestino = $1)
    `;
    
    const queryParams = [id];
    let paramCounter = 2;
    
    if (fechaInicio) {
      query += ` AND d.fechaRegistro >= $${paramCounter++}`;
      queryParams.push(fechaInicio);
    }
    
    if (fechaFin) {
      query += ` AND d.fechaRegistro <= $${paramCounter++}`;
      queryParams.push(fechaFin);
    }
    
    if (estado) {
      query += ` AND d.estado = $${paramCounter++}`;
      queryParams.push(estado);
    }
    
    query += ` ORDER BY d.fechaRegistro DESC`;
    
    const result = await pool.query(query, queryParams);
    
    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      message: 'Documentos del área obtenidos correctamente'
    });
  } catch (error) {
    logger.error('Error al obtener documentos del área', { 
      id: req.params.id, 
      error: error.message, 
      stack: error.stack 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener documentos del área',
      error: 'Error en el servidor'
    });
  }
};

module.exports = {
  getAllAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
  getAreaDocumentos
}; 