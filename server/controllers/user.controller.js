/**
 * User Controller
 * Implementación de manejo de usuarios según ISO/IEC 27001
 */

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');
const { validateUserData } = require('../middleware/validation/user.validator');

/**
 * Obtener todos los usuarios con paginación y filtros
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAllUsers = async (req, res) => {
  try {
    const { limit = 10, offset = 0, search = '', sort = 'nombre', order = 'asc' } = req.query;
    
    let query = `
      SELECT u.id, u.nombre, u.apellido, u.codigoCIP, u.email, u.activo, 
             u.bloqueado, u.idRol, r.nombre as rolNombre, u.idArea, 
             a.nombre as areaNombre, u.permisos, u.fechaCreacion
      FROM usuarios u
      LEFT JOIN roles r ON u.idRol = r.id
      LEFT JOIN areas a ON u.idArea = a.id
      WHERE (u.nombre ILIKE $1 OR u.apellido ILIKE $1 OR u.codigoCIP ILIKE $1 OR u.email ILIKE $1)
      ORDER BY ${sort} ${order === 'desc' ? 'DESC' : 'ASC'}
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM usuarios u
      WHERE (u.nombre ILIKE $1 OR u.apellido ILIKE $1 OR u.codigoCIP ILIKE $1 OR u.email ILIKE $1)
    `;

    const searchParam = `%${search}%`;
    
    const [users, countResult] = await Promise.all([
      pool.query(query, [searchParam, limit, offset]),
      pool.query(countQuery, [searchParam])
    ]);
    
    // Eliminar datos sensibles como contraseñas antes de enviar
    const safeUsers = users.rows.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    return res.status(200).json({
      success: true,
      data: safeUsers,
      count: parseInt(countResult.rows[0].total),
      message: 'Usuarios obtenidos correctamente'
    });
  } catch (error) {
    logger.error('Error al obtener usuarios', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Obtener usuario por ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }
    
    const query = `
      SELECT u.id, u.nombre, u.apellido, u.codigoCIP, u.email, u.activo, 
             u.bloqueado, u.idRol, r.nombre as rolNombre, u.idArea, 
             a.nombre as areaNombre, u.permisos, u.fechaCreacion
      FROM usuarios u
      LEFT JOIN roles r ON u.idRol = r.id
      LEFT JOIN areas a ON u.idArea = a.id
      WHERE u.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Eliminar datos sensibles como contraseñas antes de enviar
    const { password, ...safeUser } = result.rows[0];
    
    return res.status(200).json({
      success: true,
      data: safeUser,
      message: 'Usuario obtenido correctamente'
    });
  } catch (error) {
    logger.error('Error al obtener usuario por ID', { id: req.params.id, error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Crear nuevo usuario
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createUser = async (req, res) => {
  try {
    const { nombre, apellido, codigoCIP, email, password, idRol, idArea, permisos } = req.body;
    
    // Validación básica
    if (!nombre || !apellido || !codigoCIP || !email || !password || !idRol) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios'
      });
    }
    
    // Verificar si el usuario ya existe
    const existsQuery = 'SELECT id FROM usuarios WHERE codigoCIP = $1 OR email = $2';
    const existsResult = await pool.query(existsQuery, [codigoCIP, email]);
    
    if (existsResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El código CIP o email ya está registrado'
      });
    }
    
    // Cifrar la contraseña conforme a ISO/IEC 27001
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Crear el usuario
    const insertQuery = `
      INSERT INTO usuarios 
        (nombre, apellido, codigoCIP, email, password, idRol, idArea, permisos, activo)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING id, nombre, apellido, codigoCIP, email, idRol, idArea, permisos, fechaCreacion
    `;
    
    const result = await pool.query(insertQuery, [
      nombre, apellido, codigoCIP, email, hashedPassword, idRol, idArea || null, permisos || 0
    ]);
    
    logger.info('Usuario creado', { id: result.rows[0].id, nombre, codigoCIP });
    
    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Usuario creado correctamente'
    });
  } catch (error) {
    logger.error('Error al crear usuario', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Actualizar usuario por ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, idRol, idArea, permisos, activo } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }
    
    // Verificar si el usuario existe
    const existsQuery = 'SELECT id FROM usuarios WHERE id = $1';
    const existsResult = await pool.query(existsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Construir la consulta de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCounter = 1;
    
    if (nombre !== undefined) {
      updates.push(`nombre = $${paramCounter++}`);
      values.push(nombre);
    }
    
    if (apellido !== undefined) {
      updates.push(`apellido = $${paramCounter++}`);
      values.push(apellido);
    }
    
    if (email !== undefined) {
      updates.push(`email = $${paramCounter++}`);
      values.push(email);
    }
    
    if (idRol !== undefined) {
      updates.push(`idRol = $${paramCounter++}`);
      values.push(idRol);
    }
    
    if (idArea !== undefined) {
      updates.push(`idArea = $${paramCounter++}`);
      values.push(idArea);
    }
    
    if (permisos !== undefined) {
      updates.push(`permisos = $${paramCounter++}`);
      values.push(permisos);
    }
    
    if (activo !== undefined) {
      updates.push(`activo = $${paramCounter++}`);
      values.push(activo);
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
      UPDATE usuarios 
      SET ${updates.join(', ')}, fechaActualizacion = NOW()
      WHERE id = $${paramCounter}
      RETURNING id, nombre, apellido, codigoCIP, email, idRol, idArea, permisos, activo, fechaActualizacion
    `;
    
    const result = await pool.query(updateQuery, values);
    
    logger.info('Usuario actualizado', { id, datosActualizados: req.body });
    
    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Usuario actualizado correctamente'
    });
  } catch (error) {
    logger.error('Error al actualizar usuario', { id: req.params.id, error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Eliminar usuario por ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }
    
    // Verificar si el usuario existe
    const existsQuery = 'SELECT id FROM usuarios WHERE id = $1';
    const existsResult = await pool.query(existsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Por seguridad, en lugar de eliminar físicamente, desactivamos el usuario
    const updateQuery = `
      UPDATE usuarios 
      SET activo = false, fechaBaja = NOW()
      WHERE id = $1
      RETURNING id
    `;
    
    await pool.query(updateQuery, [id]);
    
    logger.info('Usuario eliminado', { id });
    
    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    logger.error('Error al eliminar usuario', { id: req.params.id, error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Bloquear/Desbloquear usuario
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { blocked } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }
    
    if (blocked === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere indicar el estado de bloqueo'
      });
    }
    
    // Verificar si el usuario existe
    const existsQuery = 'SELECT id FROM usuarios WHERE id = $1';
    const existsResult = await pool.query(existsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Actualizar el estado de bloqueo
    const updateQuery = `
      UPDATE usuarios 
      SET bloqueado = $1, fechaActualizacion = NOW()
      WHERE id = $2
      RETURNING id, nombre, apellido, codigoCIP, email, bloqueado, fechaActualizacion
    `;
    
    const result = await pool.query(updateQuery, [blocked, id]);
    
    const action = blocked ? 'bloqueado' : 'desbloqueado';
    logger.info(`Usuario ${action}`, { id, bloqueado: blocked });
    
    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: `Usuario ${action} correctamente`
    });
  } catch (error) {
    logger.error('Error al cambiar estado de bloqueo del usuario', { 
      id: req.params.id, 
      error: error.message, 
      stack: error.stack 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de bloqueo del usuario',
      error: 'Error en el servidor'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  blockUser
}; 