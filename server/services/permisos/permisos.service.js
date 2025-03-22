/**
 * Servicio para la gestión de permisos contextuales
 * Permite administrar los permisos contextuales y verificarlos
 */

const db = require('../../config/database');
const { logger } = require('../../utils/logger');

/**
 * Obtiene todos los permisos contextuales activos
 * @returns {Promise<Array>} Lista de permisos contextuales
 */
async function getPermisosContextuales() {
  try {
    return await db.executeQuery('SELECT * FROM v_permisos_contextuales');
  } catch (error) {
    logger.error(`Error al obtener permisos contextuales: ${error.message}`);
    throw error;
  }
}

/**
 * Obtiene un permiso contextual por su ID
 * @param {number} idPermisoContextual - ID del permiso contextual
 * @returns {Promise<Object>} Permiso contextual
 */
async function getPermisoContextualById(idPermisoContextual) {
  try {
    const permisos = await db.executeQuery(
      'SELECT * FROM v_permisos_contextuales WHERE IDPermisoContextual = ?',
      [idPermisoContextual]
    );
    
    if (permisos.length === 0) {
      throw new Error(`Permiso contextual con ID ${idPermisoContextual} no encontrado`);
    }
    
    return permisos[0];
  } catch (error) {
    logger.error(`Error al obtener permiso contextual: ${error.message}`);
    throw error;
  }
}

/**
 * Obtiene permisos contextuales filtrados por rol, área o tipo de recurso
 * @param {Object} filtros - Filtros a aplicar
 * @param {number} [filtros.idRol] - ID del rol
 * @param {number} [filtros.idArea] - ID del área
 * @param {string} [filtros.tipoRecurso] - Tipo de recurso
 * @returns {Promise<Array>} Lista de permisos contextuales filtrados
 */
async function getPermisosContextualesFiltrados(filtros) {
  try {
    let query = 'SELECT * FROM v_permisos_contextuales WHERE 1=1';
    const params = [];
    
    if (filtros.idRol) {
      query += ' AND IDRol = ?';
      params.push(filtros.idRol);
    }
    
    if (filtros.idArea) {
      query += ' AND IDArea = ?';
      params.push(filtros.idArea);
    }
    
    if (filtros.tipoRecurso) {
      query += ' AND TipoRecurso = ?';
      params.push(filtros.tipoRecurso);
    }
    
    return await db.executeQuery(query, params);
  } catch (error) {
    logger.error(`Error al obtener permisos contextuales filtrados: ${error.message}`);
    throw error;
  }
}

/**
 * Crea un nuevo permiso contextual
 * @param {Object} permisoData - Datos del permiso contextual
 * @param {number} permisoData.idRol - ID del rol
 * @param {number} permisoData.idArea - ID del área
 * @param {string} permisoData.tipoRecurso - Tipo de recurso
 * @param {Object} permisoData.reglaContexto - Regla de contexto
 * @param {boolean} [permisoData.activo=true] - Estado del permiso
 * @returns {Promise<Object>} Permiso contextual creado
 */
async function crearPermisoContextual(permisoData) {
  try {
    // Convertir reglaContexto a string si es un objeto
    const reglaContexto = typeof permisoData.reglaContexto === 'object' 
      ? JSON.stringify(permisoData.reglaContexto) 
      : permisoData.reglaContexto;
    
    const result = await db.executeQuery(
      'INSERT INTO PermisoContextual (IDRol, IDArea, TipoRecurso, ReglaContexto, Activo) VALUES (?, ?, ?, ?, ?)',
      [
        permisoData.idRol,
        permisoData.idArea,
        permisoData.tipoRecurso,
        reglaContexto,
        permisoData.activo !== undefined ? permisoData.activo : true
      ]
    );
    
    return {
      idPermisoContextual: result.insertId,
      ...permisoData
    };
  } catch (error) {
    logger.error(`Error al crear permiso contextual: ${error.message}`);
    throw error;
  }
}

/**
 * Actualiza un permiso contextual existente
 * @param {number} idPermisoContextual - ID del permiso contextual a actualizar
 * @param {Object} permisoData - Datos a actualizar
 * @returns {Promise<Object>} Resultado de la actualización
 */
async function actualizarPermisoContextual(idPermisoContextual, permisoData) {
  try {
    // Preparar los campos a actualizar
    const updates = [];
    const params = [];
    
    if (permisoData.idRol !== undefined) {
      updates.push('IDRol = ?');
      params.push(permisoData.idRol);
    }
    
    if (permisoData.idArea !== undefined) {
      updates.push('IDArea = ?');
      params.push(permisoData.idArea);
    }
    
    if (permisoData.tipoRecurso !== undefined) {
      updates.push('TipoRecurso = ?');
      params.push(permisoData.tipoRecurso);
    }
    
    if (permisoData.reglaContexto !== undefined) {
      const reglaContexto = typeof permisoData.reglaContexto === 'object' 
        ? JSON.stringify(permisoData.reglaContexto) 
        : permisoData.reglaContexto;
      
      updates.push('ReglaContexto = ?');
      params.push(reglaContexto);
    }
    
    if (permisoData.activo !== undefined) {
      updates.push('Activo = ?');
      params.push(permisoData.activo);
    }
    
    if (updates.length === 0) {
      throw new Error('No se proporcionaron datos para actualizar');
    }
    
    // Añadir el ID al final de los parámetros
    params.push(idPermisoContextual);
    
    const result = await db.executeQuery(
      `UPDATE PermisoContextual SET ${updates.join(', ')} WHERE IDPermisoContextual = ?`,
      params
    );
    
    if (result.affectedRows === 0) {
      throw new Error(`Permiso contextual con ID ${idPermisoContextual} no encontrado`);
    }
    
    return {
      idPermisoContextual,
      actualizado: true,
      ...permisoData
    };
  } catch (error) {
    logger.error(`Error al actualizar permiso contextual: ${error.message}`);
    throw error;
  }
}

/**
 * Elimina un permiso contextual
 * @param {number} idPermisoContextual - ID del permiso contextual a eliminar
 * @returns {Promise<Object>} Resultado de la eliminación
 */
async function eliminarPermisoContextual(idPermisoContextual) {
  try {
    const result = await db.executeQuery(
      'DELETE FROM PermisoContextual WHERE IDPermisoContextual = ?',
      [idPermisoContextual]
    );
    
    if (result.affectedRows === 0) {
      throw new Error(`Permiso contextual con ID ${idPermisoContextual} no encontrado`);
    }
    
    return {
      idPermisoContextual,
      eliminado: true
    };
  } catch (error) {
    logger.error(`Error al eliminar permiso contextual: ${error.message}`);
    throw error;
  }
}

/**
 * Verifica si un usuario tiene un permiso contextual para un recurso específico
 * @param {number} idUsuario - ID del usuario
 * @param {string} tipoRecurso - Tipo de recurso
 * @param {number} idRecurso - ID del recurso
 * @param {string} accion - Acción a verificar
 * @returns {Promise<boolean>} Resultado de la verificación
 */
async function verificarPermisoContextual(idUsuario, tipoRecurso, idRecurso, accion) {
  try {
    const result = await db.executeQuery(
      'SELECT fn_verificar_permiso_contextual(?, ?, ?, ?) AS tienePermiso',
      [idUsuario, tipoRecurso, idRecurso, accion]
    );
    
    return result[0].tienePermiso === 1;
  } catch (error) {
    logger.error(`Error al verificar permiso contextual: ${error.message}`);
    return false;
  }
}

/**
 * Gestiona la papelera de reciclaje para documentos
 * @param {number} idDocumento - ID del documento
 * @param {number} idUsuario - ID del usuario que realiza la acción
 * @param {string} accion - Acción a realizar: 'MOVER_PAPELERA', 'RESTAURAR', 'ELIMINAR_PERMANENTE'
 * @returns {Promise<Object>} Resultado de la operación
 */
async function gestionarPapelera(idDocumento, idUsuario, accion) {
  try {
    await db.executeQuery(
      'CALL sp_papelera_reciclaje(?, ?, ?)',
      [idDocumento, idUsuario, accion]
    );
    
    return {
      idDocumento,
      idUsuario,
      accion,
      exitoso: true
    };
  } catch (error) {
    logger.error(`Error al gestionar papelera (${accion}): ${error.message}`);
    throw error;
  }
}

/**
 * Obtiene información del usuario, incluyendo su rol y área
 * @param {number} idUsuario - ID del usuario
 * @returns {Promise<Object>} Información del usuario
 */
async function getUsuarioInfo(idUsuario) {
  try {
    const result = await db.executeQuery(
      `SELECT 
        u.IDUsuario, 
        u.IDRol,
        r.NombreRol,
        u.IDArea,
        a.NombreArea
      FROM 
        Usuario u
        JOIN Rol r ON u.IDRol = r.IDRol
        JOIN AreaEspecializada a ON u.IDArea = a.IDArea
      WHERE 
        u.IDUsuario = ?`,
      [idUsuario]
    );
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    logger.error(`Error al obtener información del usuario: ${error.message}`);
    throw error;
  }
}

/**
 * Obtiene los permisos basados en bits para un rol específico
 * @param {number} idRol - ID del rol
 * @returns {Promise<Object>} Permisos basados en bits
 */
async function getPermisosBits(idRol) {
  try {
    const result = await db.executeQuery(
      'SELECT IDRol, NombreRol, Permisos FROM Rol WHERE IDRol = ?',
      [idRol]
    );
    
    if (result.length === 0) {
      throw new Error(`Rol con ID ${idRol} no encontrado`);
    }
    
    return {
      idRol: result[0].IDRol,
      nombreRol: result[0].NombreRol,
      valorBits: result[0].Permisos
    };
  } catch (error) {
    logger.error(`Error al obtener permisos por bits: ${error.message}`);
    throw error;
  }
}

/**
 * Obtiene los permisos contextuales para un usuario específico
 * @param {number} idUsuario - ID del usuario
 * @param {number} idRol - ID del rol del usuario
 * @param {number} idArea - ID del área del usuario
 * @returns {Promise<Array>} Lista de permisos contextuales
 */
async function getPermisosContextualesUsuario(idUsuario, idRol, idArea) {
  try {
    // Obtener permisos contextuales basados en el rol y área del usuario
    return await db.executeQuery(
      `SELECT 
        pc.IDPermisoContextual,
        pc.IDRol,
        pc.IDArea,
        pc.TipoRecurso,
        pc.ReglaContexto,
        pc.Activo
      FROM 
        PermisoContextual pc
      WHERE 
        pc.IDRol = ? 
        AND pc.IDArea = ?
        AND pc.Activo = true`,
      [idRol, idArea]
    );
  } catch (error) {
    logger.error(`Error al obtener permisos contextuales del usuario: ${error.message}`);
    return [];
  }
}

/**
 * Obtiene los bits de permisos y su descripción
 * @returns {Object} Descripción de los bits de permisos
 */
function getPermissionBits(req, res) {
  const permissionBits = {
    crear: { bit: 0, valor: 1, descripcion: 'Crear' },
    editar: { bit: 1, valor: 2, descripcion: 'Editar' },
    eliminar: { bit: 2, valor: 4, descripcion: 'Eliminar' },
    ver: { bit: 3, valor: 8, descripcion: 'Ver' },
    derivar: { bit: 4, valor: 16, descripcion: 'Derivar' },
    auditar: { bit: 5, valor: 32, descripcion: 'Auditar' },
    exportar: { bit: 6, valor: 64, descripcion: 'Exportar' },
    bloquear: { bit: 7, valor: 128, descripcion: 'Bloquear' }
  };

  res.status(200).json({
    success: true,
    data: permissionBits
  });
}

/**
 * Verifica si un usuario tiene un permiso específico basado en su rol
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
async function verifyPermission(req, res) {
  try {
    const { idUsuario, permisoBit } = req.body;
    
    if (!idUsuario || permisoBit === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere idUsuario y permisoBit' 
      });
    }

    // Obtener rol del usuario
    const usuario = await db.executeQuery(
      'SELECT IDRol FROM Usuario WHERE IDUsuario = ?', 
      [idUsuario]
    );
    
    if (usuario.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    // Obtener permisos del rol
    const rol = await db.executeQuery(
      'SELECT Permisos FROM Rol WHERE IDRol = ?', 
      [usuario[0].IDRol]
    );
    
    if (rol.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rol no encontrado' 
      });
    }

    // Verificar si el bit de permiso está activado
    const tienePermiso = (rol[0].Permisos & (1 << permisoBit)) !== 0;

    res.status(200).json({
      success: true,
      tienePermiso
    });
    
  } catch (error) {
    logger.error(`Error al verificar permiso: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al verificar permiso',
      error: error.message
    });
  }
}

module.exports = {
  getPermisosContextuales,
  getPermisoContextualById,
  getPermisosContextualesFiltrados,
  crearPermisoContextual,
  actualizarPermisoContextual,
  eliminarPermisoContextual,
  verificarPermisoContextual,
  gestionarPapelera,
  getUsuarioInfo,
  getPermisosBits,
  getPermisosContextualesUsuario,
  getPermissionBits,
  verifyPermission
}; 