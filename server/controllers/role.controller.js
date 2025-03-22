/**
 * Role Controller
 * Implementación de manejo de roles según ISO/IEC 27001
 */

const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * Obtener todos los roles con paginación
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAllRoles = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const query = `
      SELECT id, nombre, descripcion, permisos, fechaCreacion, fechaActualizacion
      FROM roles
      ORDER BY nombre ASC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM roles
    `;
    
    const [roles, countResult] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(countQuery)
    ]);
    
    return res.status(200).json({
      success: true,
      data: roles.rows,
      count: parseInt(countResult.rows[0].total),
      message: 'Roles obtenidos correctamente'
    });
  } catch (error) {
    logger.error('Error al obtener roles', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener roles',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Obtener rol por ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de rol inválido'
      });
    }
    
    const query = `
      SELECT id, nombre, descripcion, permisos, fechaCreacion, fechaActualizacion
      FROM roles
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Rol obtenido correctamente'
    });
  } catch (error) {
    logger.error('Error al obtener rol por ID', { id: req.params.id, error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener rol',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Crear nuevo rol
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createRole = async (req, res) => {
  try {
    const { nombre, descripcion, permisos } = req.body;
    
    // Validación básica
    if (!nombre || !permisos) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios (nombre, permisos)'
      });
    }
    
    // Verificar si el rol ya existe
    const existsQuery = 'SELECT id FROM roles WHERE LOWER(nombre) = LOWER($1)';
    const existsResult = await pool.query(existsQuery, [nombre]);
    
    if (existsResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un rol con ese nombre'
      });
    }
    
    // Crear el rol
    const insertQuery = `
      INSERT INTO roles 
        (nombre, descripcion, permisos)
      VALUES 
        ($1, $2, $3)
      RETURNING id, nombre, descripcion, permisos, fechaCreacion
    `;
    
    const result = await pool.query(insertQuery, [
      nombre, descripcion || '', permisos
    ]);
    
    logger.info('Rol creado', { id: result.rows[0].id, nombre });
    
    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Rol creado correctamente'
    });
  } catch (error) {
    logger.error('Error al crear rol', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al crear rol',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Actualizar rol por ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, permisos } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de rol inválido'
      });
    }
    
    // Verificar si el rol existe
    const existsQuery = 'SELECT id FROM roles WHERE id = $1';
    const existsResult = await pool.query(existsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }
    
    // Verificar nombre único
    if (nombre) {
      const nameQuery = 'SELECT id FROM roles WHERE LOWER(nombre) = LOWER($1) AND id != $2';
      const nameResult = await pool.query(nameQuery, [nombre, id]);
      
      if (nameResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe otro rol con ese nombre'
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
    
    if (permisos !== undefined) {
      updates.push(`permisos = $${paramCounter++}`);
      values.push(permisos);
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
      UPDATE roles 
      SET ${updates.join(', ')}, fechaActualizacion = NOW()
      WHERE id = $${paramCounter}
      RETURNING id, nombre, descripcion, permisos, fechaActualizacion
    `;
    
    const result = await pool.query(updateQuery, values);
    
    logger.info('Rol actualizado', { id, datosActualizados: req.body });
    
    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Rol actualizado correctamente'
    });
  } catch (error) {
    logger.error('Error al actualizar rol', { id: req.params.id, error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar rol',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Eliminar rol por ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de rol inválido'
      });
    }
    
    // Verificar si el rol existe
    const existsQuery = 'SELECT id FROM roles WHERE id = $1';
    const existsResult = await pool.query(existsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }
    
    // Verificar si hay usuarios asociados a este rol
    const usersQuery = 'SELECT COUNT(*) as total FROM usuarios WHERE idRol = $1';
    const usersResult = await pool.query(usersQuery, [id]);
    
    if (parseInt(usersResult.rows[0].total) > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar el rol porque hay usuarios asociados',
        extra: { usuariosAsociados: parseInt(usersResult.rows[0].total) }
      });
    }
    
    // Eliminar el rol
    const deleteQuery = 'DELETE FROM roles WHERE id = $1 RETURNING id';
    await pool.query(deleteQuery, [id]);
    
    logger.info('Rol eliminado', { id });
    
    return res.status(200).json({
      success: true,
      message: 'Rol eliminado correctamente'
    });
  } catch (error) {
    logger.error('Error al eliminar rol', { id: req.params.id, error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar rol',
      error: 'Error en el servidor'
    });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
}; 