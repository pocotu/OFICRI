const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const auditService = require('../services/auditService');
const axios = require('axios');
const ClientIpExtractor = require('../utils/ClientIpExtractor');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
const permissionService = require('../services/permissionService');

async function getIpInfo(ip) {
  try {
    const response = await axios.get(`https://ipinfo.io/${ip}?token=fefd3059c78c94`);
    const data = response.data;
    return {
      IPCountry: data.country || null,
      IPCountryCode: data.country || null,
      IPRegion: data.region || null,
      IPRegionName: data.region || null,
      IPCity: data.city || null,
      IPZip: data.postal || null,
      IPLat: data.loc ? data.loc.split(',')[0] : null,
      IPLon: data.loc ? data.loc.split(',')[1] : null,
      IPTimezone: data.timezone || null,
      IPISP: data.org || null,
      IPOrg: data.org || null,
      IPAs: null,
      IPHostname: data.hostname || null,
      IPIsProxy: null,
      IPIsVPN: null,
      IPIsTor: null,
      DispositivoInfo: null
    };
  } catch {
    return {};
  }
}

// GET /api/usuarios
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Verificar si tiene permiso para ver usuarios
    const hasPermission = await permissionService.hasPermission(
      req.user.IDUsuario, 
      permissionService.PERMISSION_BITS.VER
    );
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'No tiene permiso para ver usuarios' });
    }
    
    const [rows] = await pool.query(
      `SELECT u.IDUsuario, u.CodigoCIP, u.Nombres, u.Apellidos, u.Grado, 
              u.IDArea, u.IDRol, u.UltimoAcceso, u.Bloqueado,
              a.NombreArea, r.NombreRol, r.Permisos
       FROM Usuario u
       JOIN AreaEspecializada a ON u.IDArea = a.IDArea
       JOIN Rol r ON u.IDRol = r.IDRol`
    );
    
    // Eliminar campos sensibles
    const usuarios = rows.map(u => {
      const { PasswordHash, ...rest } = u;
      return rest;
    });
    
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/usuarios/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // Verificar si tiene permiso para ver usuarios
    const hasPermission = await permissionService.hasPermission(
      req.user.IDUsuario, 
      permissionService.PERMISSION_BITS.VER
    );
    
    // El usuario siempre puede ver su propio perfil
    const isSelf = parseInt(req.params.id) === req.user.IDUsuario;
    
    if (!hasPermission && !isSelf) {
      return res.status(403).json({ message: 'No tiene permiso para ver este usuario' });
    }
    
    const [rows] = await pool.query(
      `SELECT u.IDUsuario, u.CodigoCIP, u.Nombres, u.Apellidos, u.Grado, 
              u.IDArea, u.IDRol, u.UltimoAcceso, u.Bloqueado,
              a.NombreArea, r.NombreRol
       FROM Usuario u
       JOIN AreaEspecializada a ON u.IDArea = a.IDArea
       JOIN Rol r ON u.IDRol = r.IDRol
       WHERE u.IDUsuario = ?`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Eliminar campos sensibles
    const { PasswordHash, ...usuario } = rows[0];
    
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/usuarios
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Verificar si es administrador (bit 7)
    const isAdmin = await permissionService.hasPermission(
      req.user.IDUsuario, 
      permissionService.PERMISSION_BITS.ADMIN
    );
    
    if (!isAdmin) {
      // Registrar intento no autorizado
      await permissionService.logUnauthorizedAccess(
        req.user.IDUsuario,
        'USUARIO',
        0,
        'CREAR',
        req.ip
      );
      
      return res.status(403).json({ 
        message: 'No tiene permiso para crear usuarios',
        details: 'Esta acción está reservada para administradores' 
      });
    }
    
    const { 
      CodigoCIP, 
      Nombres, 
      Apellidos, 
      Grado, 
      Password, 
      IDArea, 
      IDRol 
    } = req.body;
    
    // Validar campos obligatorios
    if (!CodigoCIP || !Nombres || !Apellidos || !Grado || !Password || !IDArea || !IDRol) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }
    
    // Verificar si el CIP ya existe
    const [existingUser] = await pool.query(
      'SELECT 1 FROM Usuario WHERE CodigoCIP = ?',
      [CodigoCIP]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'El CIP ya está registrado' });
    }
    
    // Generar hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(Password, salt);
    
    // Crear el usuario
    const [result] = await pool.query(
      `INSERT INTO Usuario (
        CodigoCIP, 
        Nombres, 
        Apellidos, 
        Grado, 
        PasswordHash, 
        IDArea, 
        IDRol
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        CodigoCIP, 
        Nombres, 
        Apellidos, 
        Grado, 
        passwordHash, 
        IDArea, 
        IDRol
      ]
    );
    
    // Registrar en el log de usuarios
    await pool.query(
      `INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, Exitoso)
       VALUES (?, 'CREAR_USUARIO', ?, ?, TRUE)`,
      [
        req.user.IDUsuario,
        req.ip,
        req.headers['user-agent'] || 'Unknown'
      ]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Usuario creado con éxito' 
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /api/usuarios/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const isSelf = userId === req.user.IDUsuario;
    
    // Verificar si tiene permiso para editar usuarios
    const hasEditPermission = await permissionService.hasPermission(
      req.user.IDUsuario, 
      permissionService.PERMISSION_BITS.EDITAR
    );
    
    const isAdmin = await permissionService.hasPermission(
      req.user.IDUsuario, 
      permissionService.PERMISSION_BITS.ADMIN
    );
    
    // Solo el propio usuario o alguien con permiso de editar puede actualizar
    if (!hasEditPermission && !isSelf) {
      // Registrar intento no autorizado
      await permissionService.logUnauthorizedAccess(
        req.user.IDUsuario,
        'USUARIO',
        userId,
        'EDITAR',
        req.ip
      );
      
      return res.status(403).json({ message: 'No tiene permiso para editar este usuario' });
    }
    
    // Campos que solo el administrador puede actualizar
    const adminOnlyFields = ['IDRol', 'Bloqueado'];
    
    // Verificar que no esté tratando de actualizar campos administrativos si no es admin
    if (!isAdmin) {
      for (const field of adminOnlyFields) {
        if (req.body[field] !== undefined) {
          return res.status(403).json({ 
            message: `No tiene permiso para actualizar el campo ${field}`,
            details: 'Este campo solo puede ser actualizado por administradores'
          });
        }
      }
    }
    
    const { 
      Nombres, 
      Apellidos, 
      Grado, 
      Password, 
      IDArea, 
      IDRol, 
      Bloqueado 
    } = req.body;
    
    // Construir conjuntos de actualización y parámetros
    let updateSets = [];
    let params = [];
    
    if (Nombres) {
      updateSets.push('Nombres = ?');
      params.push(Nombres);
    }
    
    if (Apellidos) {
      updateSets.push('Apellidos = ?');
      params.push(Apellidos);
    }
    
    if (Grado) {
      updateSets.push('Grado = ?');
      params.push(Grado);
    }
    
    if (Password) {
      // Solo administradores pueden cambiar contraseñas ajenas
      if (!isSelf && !isAdmin) {
        return res.status(403).json({ 
          message: 'No tiene permiso para cambiar la contraseña de otro usuario',
          details: 'Esta acción está reservada para administradores o el propio usuario'
        });
      }
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(Password, salt);
      
      updateSets.push('PasswordHash = ?');
      params.push(passwordHash);
    }
    
    if (IDArea && isAdmin) {
      updateSets.push('IDArea = ?');
      params.push(IDArea);
    }
    
    if (IDRol && isAdmin) {
      updateSets.push('IDRol = ?');
      params.push(IDRol);
    }
    
    if (Bloqueado !== undefined && isAdmin) {
      updateSets.push('Bloqueado = ?');
      params.push(Bloqueado);
      
      if (Bloqueado) {
        updateSets.push('UltimoBloqueo = NOW()');
      }
    }
    
    if (updateSets.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }
    
    // Añadir ID al final de los parámetros
    params.push(userId);
    
    // Ejecutar la actualización
    await pool.query(
      `UPDATE Usuario SET ${updateSets.join(', ')} WHERE IDUsuario = ?`,
      params
    );
    
    // Registrar en el log de usuarios
    await pool.query(
      `INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, Exitoso)
       VALUES (?, 'ACTUALIZAR_USUARIO', ?, ?, TRUE)`,
      [
        req.user.IDUsuario,
        req.ip,
        req.headers['user-agent'] || 'Unknown'
      ]
    );
    
    res.json({ message: 'Usuario actualizado con éxito' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /api/usuarios/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Verificar si puede eliminar usuarios (solo administradores)
    const canDelete = await permissionService.canDeleteUser(req.user.IDUsuario);
    
    if (!canDelete) {
      // Registrar intento no autorizado
      await permissionService.logUnauthorizedAccess(
        req.user.IDUsuario,
        'USUARIO',
        userId,
        'ELIMINAR',
        req.ip
      );
      
      return res.status(403).json({ 
        message: 'No tiene permiso para eliminar usuarios',
        details: 'Esta acción está reservada para administradores' 
      });
    }
    
    // Verificar que no esté tratando de eliminarse a sí mismo
    if (userId === req.user.IDUsuario) {
      return res.status(400).json({ 
        message: 'No puede eliminar su propio usuario',
        details: 'Contacte a otro administrador para esta operación'
      });
    }
    
    // Verificar que el usuario exista
    const [userExists] = await pool.query(
      'SELECT 1 FROM Usuario WHERE IDUsuario = ?',
      [userId]
    );
    
    if (userExists.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Registrar en el log de usuarios antes de eliminar
    await pool.query(
      `INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, Exitoso)
       VALUES (?, 'ELIMINAR_USUARIO', ?, ?, TRUE)`,
      [
        req.user.IDUsuario,
        req.ip,
        req.headers['user-agent'] || 'Unknown'
      ]
    );
    
    // Eliminar el usuario
    await pool.query('DELETE FROM Usuario WHERE IDUsuario = ?', [userId]);
    
    res.json({ message: 'Usuario eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/usuarios/:id/reset-password
router.post('/:id/reset-password', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Verificar si es administrador
    const isAdmin = await permissionService.hasPermission(
      req.user.IDUsuario, 
      permissionService.PERMISSION_BITS.ADMIN
    );
    
    if (!isAdmin) {
      // Registrar intento no autorizado
      await permissionService.logUnauthorizedAccess(
        req.user.IDUsuario,
        'USUARIO',
        userId,
        'RESET_PASSWORD',
        req.ip
      );
      
      return res.status(403).json({ 
        message: 'No tiene permiso para restablecer contraseñas',
        details: 'Esta acción está reservada para administradores' 
      });
    }
    
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ message: 'La nueva contraseña es requerida' });
    }
    
    // Generar hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Actualizar la contraseña
    await pool.query(
      'UPDATE Usuario SET PasswordHash = ?, IntentosFallidos = 0, Bloqueado = FALSE WHERE IDUsuario = ?',
      [passwordHash, userId]
    );
    
    // Registrar en el log de usuarios
    await pool.query(
      `INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, Exitoso)
       VALUES (?, 'RESET_PASSWORD', ?, ?, TRUE)`,
      [
        req.user.IDUsuario,
        req.ip,
        req.headers['user-agent'] || 'Unknown'
      ]
    );
    
    res.json({ message: 'Contraseña restablecida con éxito' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PATCH /api/usuarios/:id/bloqueo
router.patch('/:id/bloqueo', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { bloquear } = req.body;
    // Validación de entrada
    if (typeof bloquear !== 'boolean') {
      return res.status(400).json({ message: 'El campo "bloquear" debe ser booleano.' });
    }
    // Solo administradores pueden bloquear/desbloquear usuarios
    const isAdmin = await permissionService.hasPermission(
      req.user.IDUsuario,
      permissionService.PERMISSION_BITS.ADMIN
    );
    if (!isAdmin) {
      await permissionService.logUnauthorizedAccess(
        req.user.IDUsuario,
        'USUARIO',
        userId,
        'BLOQUEAR',
        req.ip
      );
      return res.status(403).json({ message: 'No tiene permiso para bloquear o desbloquear usuarios.' });
    }
    // No permitir que un usuario se bloquee a sí mismo
    if (userId === req.user.IDUsuario) {
      return res.status(400).json({ message: 'No puede bloquearse a sí mismo.' });
    }
    await userService.setBloqueoUsuario(userId, bloquear);
    // Registrar en el log de usuarios
    await pool.query(
      `INSERT INTO UsuarioLog (IDUsuario, TipoEvento, IPOrigen, DispositivoInfo, Exitoso)
       VALUES (?, ?, ?, ?, TRUE)`,
      [
        req.user.IDUsuario,
        bloquear ? 'BLOQUEAR_USUARIO' : 'DESBLOQUEAR_USUARIO',
        req.ip,
        req.headers['user-agent'] || 'Unknown'
      ]
    );
    res.json({ message: bloquear ? 'Usuario bloqueado correctamente.' : 'Usuario desbloqueado correctamente.' });
  } catch (error) {
    console.error('Error al cambiar el estado de bloqueo:', error);
    res.status(500).json({ message: 'Error al cambiar el estado de bloqueo.' });
  }
});

module.exports = router; 