const pool = require('../db');

// Constantes de permisos por bits
const PERMISSION_BITS = {
  CREAR: 1,      // bit 0
  EDITAR: 2,     // bit 1
  ELIMINAR: 4,   // bit 2
  VER: 8,        // bit 3
  DERIVAR: 16,   // bit 4
  AUDITAR: 32,   // bit 5
  EXPORTAR: 64,  // bit 6
  ADMIN: 128     // bit 7
};

/**
 * Verifica si un usuario tiene un permiso basado en bits
 * @param {number} idUsuario - ID del usuario
 * @param {number} permissionBit - Bit de permiso a verificar
 * @returns {Promise<boolean>} - True si tiene permiso, false si no
 */
async function hasPermission(idUsuario, permissionBit) {
  try {
    const [rows] = await pool.query(
      `SELECT r.Permisos 
       FROM Usuario u 
       JOIN Rol r ON u.IDRol = r.IDRol 
       WHERE u.IDUsuario = ?`,
      [idUsuario]
    );

    if (rows.length === 0) return false;
    
    // Verificamos si el bit específico está activado
    return (rows[0].Permisos & permissionBit) === permissionBit;
  } catch (error) {
    console.error('Error verificando permiso por bit:', error);
    return false;
  }
}

/**
 * Verifica si un usuario tiene un permiso contextual
 * @param {number} idUsuario - ID del usuario
 * @param {string} tipoRecurso - Tipo de recurso (DOCUMENTO, USUARIO, AREA, etc)
 * @param {number} idRecurso - ID del recurso sobre el que se verifica el permiso
 * @param {string} accion - Acción a verificar (CREAR, EDITAR, ELIMINAR, VER, etc)
 * @returns {Promise<boolean>} - True si tiene permiso, false si no
 */
async function hasContextualPermission(idUsuario, tipoRecurso, idRecurso, accion) {
  try {
    // 1. Verificar si tiene el permiso por bits (prevalece sobre contextual)
    let bitPermission;
    switch (accion) {
      case 'CREAR': bitPermission = PERMISSION_BITS.CREAR; break;
      case 'EDITAR': bitPermission = PERMISSION_BITS.EDITAR; break;
      case 'ELIMINAR': bitPermission = PERMISSION_BITS.ELIMINAR; break;
      case 'VER': bitPermission = PERMISSION_BITS.VER; break;
      case 'DERIVAR': bitPermission = PERMISSION_BITS.DERIVAR; break;
      case 'AUDITAR': bitPermission = PERMISSION_BITS.AUDITAR; break;
      case 'EXPORTAR': bitPermission = PERMISSION_BITS.EXPORTAR; break;
      case 'ADMIN': bitPermission = PERMISSION_BITS.ADMIN; break;
      default: bitPermission = 0;
    }
    const hasBitPermission = await hasPermission(idUsuario, bitPermission);
    if (hasBitPermission) return true;

    // 2. Verificar si es administrador (siempre tiene todos los permisos)
    const [adminRows] = await pool.query(
      `SELECT r.NombreRol 
       FROM Usuario u 
       JOIN Rol r ON u.IDRol = r.IDRol 
       WHERE u.IDUsuario = ? AND (r.Permisos & ?) = ?`,
      [idUsuario, PERMISSION_BITS.ADMIN, PERMISSION_BITS.ADMIN]
    );
    if (adminRows.length > 0) return true;

    // 3. Lógica contextual extendida para Mesa de Partes
    if (tipoRecurso === 'DOCUMENTO' && accion === 'ELIMINAR') {
      // Obtener área y rol del usuario
      const [userRows] = await pool.query(
        'SELECT IDArea, IDRol FROM Usuario WHERE IDUsuario = ?',
        [idUsuario]
      );
      if (userRows.length === 0) return false;
      const idAreaUsuario = userRows[0].IDArea;
      const idRolUsuario = userRows[0].IDRol;

      // Obtener área actual y creador del documento
      const [docRows] = await pool.query(
        'SELECT IDAreaActual, IDUsuarioCreador FROM Documento WHERE IDDocumento = ?',
        [idRecurso]
      );
      if (docRows.length === 0) return false;
      const idAreaDoc = docRows[0].IDAreaActual;
      const idCreadorDoc = docRows[0].IDUsuarioCreador;

      // Permitir si es el creador (propiedad contextual)
      if (idCreadorDoc === idUsuario) return true;

      // Permitir si es de la misma área Y su rol es Mesa de Partes o Responsable de Área
      const [rolRows] = await pool.query(
        'SELECT NombreRol FROM Rol WHERE IDRol = ?',
        [idRolUsuario]
      );
      if (rolRows.length > 0) {
        const nombreRol = rolRows[0].NombreRol.toLowerCase();
        if ((nombreRol.includes('mesa de partes') || nombreRol.includes('responsable de área') || nombreRol.includes('responsable de area')) && idAreaUsuario === idAreaDoc) {
          return true;
        }
      }
      // ...aquí puedes dejar la lógica para otros contextos o reglas explícitas en PermisoContextual si lo deseas...
    }

    // ...lógica existente para otros recursos/contextos...
    // 4. Reglas explícitas en PermisoContextual (mantener para otros casos)
    if (tipoRecurso === 'DOCUMENTO') {
      // Obtener área del usuario
      const [userRows] = await pool.query(
        'SELECT IDArea, IDRol FROM Usuario WHERE IDUsuario = ?',
        [idUsuario]
      );
      if (userRows.length === 0) return false;
      const idAreaUsuario = userRows[0].IDArea;
      const idRolUsuario = userRows[0].IDRol;

      // Verificar si es el creador del documento (PROPIEDAD)
      if (accion === 'ELIMINAR') {
        const [creadorRows] = await pool.query(
          `SELECT 1 FROM Documento 
           WHERE IDDocumento = ? AND IDUsuarioCreador = ?`,
          [idRecurso, idUsuario]
        );
        if (creadorRows.length > 0) {
          const [reglasRows] = await pool.query(
            `SELECT 1 FROM PermisoContextual 
             WHERE IDRol = ? AND TipoRecurso = 'DOCUMENTO' 
             AND Activo = TRUE 
             AND ReglaContexto LIKE '%"tipo":"PROPIEDAD"%' 
             AND ReglaContexto LIKE '%"accion":"ELIMINAR"%' 
             AND ReglaContexto LIKE '%"condicion":"ES_CREADOR"%'`,
            [idRolUsuario]
          );
          if (reglasRows.length > 0) return true;
        }
        // Verificar si es del mismo área que el documento (AREA)
        const [areaRows] = await pool.query(
          `SELECT 1 FROM Documento 
           WHERE IDDocumento = ? AND IDAreaActual = ?`,
          [idRecurso, idAreaUsuario]
        );
        if (areaRows.length > 0) {
          const [reglasRows] = await pool.query(
            `SELECT 1 FROM PermisoContextual 
             WHERE IDRol = ? AND TipoRecurso = 'DOCUMENTO' 
             AND Activo = TRUE 
             AND ReglaContexto LIKE '%"tipo":"AREA"%' 
             AND ReglaContexto LIKE '%"accion":"ELIMINAR"%' 
             AND ReglaContexto LIKE '%"condicion":"MISMA_AREA"%'`,
            [idRolUsuario]
          );
          if (reglasRows.length > 0) return true;
        }
      }
    } else if (tipoRecurso === 'USUARIO' || tipoRecurso === 'AREA') {
      // Para usuarios y áreas, SOLO los administradores pueden eliminar
      // Ya verificamos si es admin más arriba, así que retornamos false
      return false;
    }
    return false;
  } catch (error) {
    console.error('Error verificando permiso contextual:', error);
    return false;
  }
}

/**
 * Verifica si un usuario puede eliminar un documento específico
 * @param {number} idUsuario - ID del usuario
 * @param {number} idDocumento - ID del documento
 * @returns {Promise<boolean>} - True si puede eliminar, false si no
 */
async function canDeleteDocument(idUsuario, idDocumento) {
  return hasContextualPermission(idUsuario, 'DOCUMENTO', idDocumento, 'ELIMINAR');
}

/**
 * Verifica si un usuario puede eliminar un usuario (solo admins)
 * @param {number} idUsuario - ID del usuario que quiere eliminar
 * @returns {Promise<boolean>} - True si puede eliminar usuarios, false si no
 */
async function canDeleteUser(idUsuario) {
  return hasPermission(idUsuario, PERMISSION_BITS.ADMIN);
}

/**
 * Verifica si un usuario puede eliminar un área (solo admins)
 * @param {number} idUsuario - ID del usuario que quiere eliminar
 * @returns {Promise<boolean>} - True si puede eliminar áreas, false si no
 */
async function canDeleteArea(idUsuario) {
  return hasPermission(idUsuario, PERMISSION_BITS.ADMIN);
}

/**
 * Registra un intento de acceso sin autorización
 * @param {number} idUsuario - ID del usuario
 * @param {string} tipoRecurso - Tipo de recurso
 * @param {number} idRecurso - ID del recurso
 * @param {string} accion - Acción intentada
 * @param {string} ipOrigen - IP de origen
 * @returns {Promise<void>}
 */
async function logUnauthorizedAccess(idUsuario, tipoRecurso, idRecurso, accion, ipOrigen) {
  try {
    await pool.query(
      `INSERT INTO IntrusionDetectionLog (IDUsuario, TipoEvento, Descripcion, IPOrigen)
       VALUES (?, 'ACCESO_NO_AUTORIZADO', ?, ?)`,
      [
        idUsuario,
        `Intento no autorizado: ${accion} ${tipoRecurso} ID=${idRecurso}`,
        ipOrigen
      ]
    );
  } catch (error) {
    console.error('Error registrando acceso no autorizado:', error);
  }
}

module.exports = {
  PERMISSION_BITS,
  hasPermission,
  hasContextualPermission,
  canDeleteDocument,
  canDeleteUser,
  canDeleteArea,
  logUnauthorizedAccess
}; 