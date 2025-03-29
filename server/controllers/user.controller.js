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
    const { limit = 10, offset = 0, search = '', sort = 'Nombres', order = 'asc' } = req.query;
    
    let query = `
      SELECT u.IDUsuario, u.CodigoCIP, u.Nombres, u.Apellidos, u.Grado,
             u.IDArea, a.NombreArea as AreaNombre, u.IDRol, 
             r.NombreRol, r.Permisos, u.UltimoAcceso, 
             u.Bloqueado, u.IntentosFallidos
      FROM Usuario u
      LEFT JOIN Rol r ON u.IDRol = r.IDRol
      LEFT JOIN AreaEspecializada a ON u.IDArea = a.IDArea
      WHERE (u.Nombres LIKE $1 OR u.Apellidos LIKE $1 OR u.CodigoCIP LIKE $1)
      ORDER BY ${sort} ${order === 'desc' ? 'DESC' : 'ASC'}
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM Usuario u
      WHERE (u.Nombres LIKE $1 OR u.Apellidos LIKE $1 OR u.CodigoCIP LIKE $1)
    `;

    const searchParam = `%${search}%`;
    
    const [users, countResult] = await Promise.all([
      pool.query(query, [searchParam, limit, offset]),
      pool.query(countQuery, [searchParam])
    ]);
    
    // Eliminar datos sensibles como contraseñas antes de enviar
    const safeUsers = users.rows.map(user => {
      const { PasswordHash, ...safeUser } = user;
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
      SELECT u.IDUsuario, u.CodigoCIP, u.Nombres, u.Apellidos, u.Grado,
             u.IDArea, a.NombreArea as AreaNombre, u.IDRol, 
             r.NombreRol, r.Permisos, u.UltimoAcceso, 
             u.Bloqueado, u.IntentosFallidos
      FROM Usuario u
      LEFT JOIN Rol r ON u.IDRol = r.IDRol
      LEFT JOIN AreaEspecializada a ON u.IDArea = a.IDArea
      WHERE u.IDUsuario = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Eliminar datos sensibles como contraseñas antes de enviar
    const { PasswordHash, ...safeUser } = result.rows[0];
    
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
 * Obtener usuario por CodigoCIP
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getUserByCIP = async (req, res) => {
  try {
    const { codigoCIP } = req.params;
    
    if (!codigoCIP) {
      return res.status(400).json({
        success: false,
        message: 'Código CIP inválido'
      });
    }
    
    const query = `
      SELECT u.IDUsuario, u.CodigoCIP, u.Nombres, u.Apellidos, u.Grado,
             u.IDArea, a.NombreArea as AreaNombre, u.IDRol, 
             r.NombreRol, r.Permisos, u.UltimoAcceso, 
             u.Bloqueado, u.IntentosFallidos
      FROM Usuario u
      LEFT JOIN Rol r ON u.IDRol = r.IDRol
      LEFT JOIN AreaEspecializada a ON u.IDArea = a.IDArea
      WHERE u.CodigoCIP = $1
    `;
    
    const result = await pool.query(query, [codigoCIP]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Eliminar datos sensibles como contraseñas antes de enviar
    const { PasswordHash, ...safeUser } = result.rows[0];
    
    return res.status(200).json({
      success: true,
      data: safeUser,
      message: 'Usuario obtenido correctamente'
    });
  } catch (error) {
    logger.error('Error al obtener usuario por CIP', { codigoCIP: req.params.codigoCIP, error: error.message, stack: error.stack });
    
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
    const { Nombres, Apellidos, CodigoCIP, Grado, password, IDRol, IDArea } = req.body;
    
    // Validación básica
    if (!Nombres || !Apellidos || !CodigoCIP || !Grado || !password || !IDRol || !IDArea) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios'
      });
    }
    
    // Verificar si el usuario ya existe
    const existsQuery = 'SELECT IDUsuario FROM Usuario WHERE CodigoCIP = $1';
    const existsResult = await pool.query(existsQuery, [CodigoCIP]);
    
    if (existsResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El código CIP ya está registrado'
      });
    }
    
    // Cifrar la contraseña conforme a ISO/IEC 27001
    const salt = await bcrypt.genSalt(12);
    const PasswordHash = await bcrypt.hash(password, salt);
    
    // Crear el usuario
    const insertQuery = `
      INSERT INTO Usuario 
        (CodigoCIP, Nombres, Apellidos, Grado, PasswordHash, IDRol, IDArea, Bloqueado)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, FALSE)
      RETURNING IDUsuario, CodigoCIP, Nombres, Apellidos, Grado, IDRol, IDArea
    `;
    
    const result = await pool.query(insertQuery, [
      CodigoCIP, Nombres, Apellidos, Grado, PasswordHash, IDRol, IDArea
    ]);
    
    logger.info('Usuario creado', { id: result.rows[0].IDUsuario, CodigoCIP, Nombres });
    
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
    const { Nombres, Apellidos, Grado, IDRol, IDArea } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }
    
    // Verificar si el usuario existe
    const existsQuery = 'SELECT IDUsuario FROM Usuario WHERE IDUsuario = $1';
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
    
    if (Nombres !== undefined) {
      updates.push(`Nombres = $${paramCounter++}`);
      values.push(Nombres);
    }
    
    if (Apellidos !== undefined) {
      updates.push(`Apellidos = $${paramCounter++}`);
      values.push(Apellidos);
    }
    
    if (Grado !== undefined) {
      updates.push(`Grado = $${paramCounter++}`);
      values.push(Grado);
    }
    
    if (IDRol !== undefined) {
      updates.push(`IDRol = $${paramCounter++}`);
      values.push(IDRol);
    }
    
    if (IDArea !== undefined) {
      updates.push(`IDArea = $${paramCounter++}`);
      values.push(IDArea);
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
      UPDATE Usuario 
      SET ${updates.join(', ')}
      WHERE IDUsuario = $${paramCounter}
      RETURNING IDUsuario, CodigoCIP, Nombres, Apellidos, Grado, IDRol, IDArea
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
 * Cambiar contraseña de usuario
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren las contraseñas actual y nueva'
      });
    }
    
    // Verificar si el usuario existe y obtener su contraseña actual
    const userQuery = 'SELECT IDUsuario, PasswordHash FROM Usuario WHERE IDUsuario = $1';
    const userResult = await pool.query(userQuery, [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const user = userResult.rows[0];
    
    // Verificar la contraseña actual
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.PasswordHash);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }
    
    // Generar y almacenar la nueva contraseña
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);
    
    const updateQuery = `
      UPDATE Usuario 
      SET PasswordHash = $1
      WHERE IDUsuario = $2
    `;
    
    await pool.query(updateQuery, [newPasswordHash, id]);
    
    logger.info('Contraseña actualizada', { id });
    
    return res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    logger.error('Error al cambiar contraseña', { id: req.params.id, error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Desactivar/Activar usuario (soft delete)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }
    
    if (active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere indicar el estado del usuario'
      });
    }
    
    // Verificar si el usuario existe
    const existsQuery = 'SELECT IDUsuario FROM Usuario WHERE IDUsuario = $1';
    const existsResult = await pool.query(existsQuery, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Actualizar campo Bloqueado (usado para soft delete)
    const updateQuery = `
      UPDATE Usuario 
      SET Bloqueado = NOT($1)
      WHERE IDUsuario = $2
      RETURNING IDUsuario, CodigoCIP, Nombres, Apellidos, Bloqueado
    `;
    
    const result = await pool.query(updateQuery, [active, id]);
    
    const action = active ? 'activado' : 'desactivado';
    logger.info(`Usuario ${action}`, { id, active });
    
    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: `Usuario ${action} correctamente`
    });
  } catch (error) {
    logger.error('Error al cambiar estado del usuario', { 
      id: req.params.id, 
      error: error.message, 
      stack: error.stack 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario',
      error: 'Error en el servidor'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserByCIP,
  createUser,
  updateUser,
  changePassword,
  toggleUserStatus
}; 