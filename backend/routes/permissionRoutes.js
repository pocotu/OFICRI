const express = require('express');
const router = express.Router();
const permissionService = require('../services/permissionService');
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../db');

// Verificar permiso contextual
router.post('/verificar', authMiddleware, async (req, res) => {
  try {
    const { tipoRecurso, idRecurso, accion } = req.body;
    
    // Validar parámetros
    if (!tipoRecurso || !idRecurso || !accion) {
      return res.status(400).json({ 
        message: 'Parámetros incorrectos',
        details: 'Debe proporcionar tipoRecurso, idRecurso y accion'
      });
    }
    
    // Obtener ID del usuario desde el token
    const idUsuario = req.user.IDUsuario;
    
    // Verificar permiso contextual
    const tienePermiso = await permissionService.hasContextualPermission(
      idUsuario,
      tipoRecurso,
      idRecurso,
      accion
    );
    
    res.json({ tienePermiso });
  } catch (error) {
    console.error('Error verificando permiso contextual:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Verificar permisos contextuales por lotes (para cargar listas de recursos)
router.post('/verificar-lote', authMiddleware, async (req, res) => {
  try {
    const { tipoRecurso, idsRecursos, accion } = req.body;
    
    // Validar parámetros
    if (!tipoRecurso || !Array.isArray(idsRecursos) || !accion) {
      return res.status(400).json({ 
        message: 'Parámetros incorrectos',
        details: 'Debe proporcionar tipoRecurso, idsRecursos (array) y accion'
      });
    }
    
    // Obtener ID del usuario desde el token
    const idUsuario = req.user.IDUsuario;
    
    // Para cada ID, verificar permiso
    const resultado = {};
    
    for (const idRecurso of idsRecursos) {
      resultado[idRecurso] = await permissionService.hasContextualPermission(
        idUsuario,
        tipoRecurso,
        idRecurso,
        accion
      );
    }
    
    res.json(resultado);
  } catch (error) {
    console.error('Error verificando permisos contextuales por lote:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener roles y permisos para visualización
router.get('/roles', authMiddleware, async (req, res) => {
  try {
    // Verificar si es administrador
    const isAdmin = await permissionService.hasPermission(
      req.user.IDUsuario, 
      permissionService.PERMISSION_BITS.ADMIN
    );
    
    if (!isAdmin) {
      return res.status(403).json({ 
        message: 'No tiene permiso para ver roles y permisos',
        details: 'Esta acción está reservada para administradores'
      });
    }
    
    const [rows] = await pool.query(`
      SELECT 
        IDRol,
        NombreRol,
        Descripcion,
        NivelAcceso,
        Permisos,
        (Permisos & 1) AS PuedeCrear,
        (Permisos & 2) AS PuedeEditar,
        (Permisos & 4) AS PuedeEliminar,
        (Permisos & 8) AS PuedeVer,
        (Permisos & 16) AS PuedeDerivar,
        (Permisos & 32) AS PuedeAuditar,
        (Permisos & 64) AS PuedeExportar,
        (Permisos & 128) AS PuedeAdministrar
      FROM Rol
      ORDER BY NivelAcceso
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo roles y permisos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener permisos contextuales
router.get('/contextuales', authMiddleware, async (req, res) => {
  try {
    // Verificar si es administrador
    const isAdmin = await permissionService.hasPermission(
      req.user.IDUsuario, 
      permissionService.PERMISSION_BITS.ADMIN
    );
    
    if (!isAdmin) {
      return res.status(403).json({ 
        message: 'No tiene permiso para ver permisos contextuales',
        details: 'Esta acción está reservada para administradores'
      });
    }
    
    const [rows] = await pool.query(`
      SELECT 
        pc.IDPermisoContextual,
        pc.IDRol,
        r.NombreRol,
        pc.IDArea,
        a.NombreArea,
        pc.TipoRecurso,
        pc.ReglaContexto,
        pc.Activo,
        pc.FechaCreacion
      FROM PermisoContextual pc
      JOIN Rol r ON pc.IDRol = r.IDRol
      JOIN AreaEspecializada a ON pc.IDArea = a.IDArea
      ORDER BY pc.TipoRecurso, r.NombreRol
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo permisos contextuales:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear permiso contextual (solo administradores)
router.post('/contextuales', authMiddleware, async (req, res) => {
  try {
    // Verificar si es administrador
    const isAdmin = await permissionService.hasPermission(
      req.user.IDUsuario, 
      permissionService.PERMISSION_BITS.ADMIN
    );
    
    if (!isAdmin) {
      return res.status(403).json({ 
        message: 'No tiene permiso para crear permisos contextuales',
        details: 'Esta acción está reservada para administradores'
      });
    }
    
    const { 
      IDRol, 
      IDArea, 
      TipoRecurso, 
      ReglaContexto 
    } = req.body;
    
    // Validar campos obligatorios
    if (!IDRol || !IDArea || !TipoRecurso || !ReglaContexto) {
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios',
        details: 'IDRol, IDArea, TipoRecurso y ReglaContexto son requeridos'
      });
    }
    
    // Validar que ReglaContexto sea un objeto JSON válido
    let reglaObj;
    try {
      if (typeof ReglaContexto === 'string') {
        reglaObj = JSON.parse(ReglaContexto);
      } else {
        reglaObj = ReglaContexto;
      }
      
      // Verificar estructura mínima
      if (!reglaObj.tipo || !reglaObj.accion || !reglaObj.condicion) {
        return res.status(400).json({ 
          message: 'ReglaContexto inválida',
          details: 'La regla debe incluir tipo, accion y condicion'
        });
      }
    } catch (e) {
      return res.status(400).json({ 
        message: 'ReglaContexto no es un JSON válido',
        details: e.message
      });
    }
    
    // Convertir a string si es objeto
    const reglaStr = typeof ReglaContexto === 'string' 
      ? ReglaContexto 
      : JSON.stringify(ReglaContexto);
    
    // Crear el permiso contextual
    const [result] = await pool.query(
      `INSERT INTO PermisoContextual (
        IDRol, 
        IDArea, 
        TipoRecurso, 
        ReglaContexto, 
        Activo,
        FechaCreacion
      ) VALUES (?, ?, ?, ?, TRUE, NOW())`,
      [
        IDRol,
        IDArea,
        TipoRecurso,
        reglaStr
      ]
    );
    
    // Registrar en el log de permisos contextuales
    await pool.query(
      `INSERT INTO PermisoContextualLog (
        IDPermisoContextual, 
        IDUsuario, 
        TipoEvento, 
        FechaEvento, 
        Detalles
      ) VALUES (?, ?, 'CREAR', NOW(), ?)`,
      [
        result.insertId,
        req.user.IDUsuario,
        `Permiso contextual creado para Rol ID: ${IDRol}, Área ID: ${IDArea}, Tipo: ${TipoRecurso}`
      ]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Permiso contextual creado con éxito' 
    });
  } catch (error) {
    console.error('Error creando permiso contextual:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar permiso contextual (solo administradores)
router.delete('/contextuales/:id', authMiddleware, async (req, res) => {
  try {
    const permisoId = parseInt(req.params.id);
    
    // Verificar si es administrador
    const isAdmin = await permissionService.hasPermission(
      req.user.IDUsuario, 
      permissionService.PERMISSION_BITS.ADMIN
    );
    
    if (!isAdmin) {
      return res.status(403).json({ 
        message: 'No tiene permiso para eliminar permisos contextuales',
        details: 'Esta acción está reservada para administradores'
      });
    }
    
    // Verificar que exista el permiso contextual
    const [permisoExists] = await pool.query(
      'SELECT 1 FROM PermisoContextual WHERE IDPermisoContextual = ?',
      [permisoId]
    );
    
    if (permisoExists.length === 0) {
      return res.status(404).json({ message: 'Permiso contextual no encontrado' });
    }
    
    // Registrar en el log antes de eliminar
    await pool.query(
      `INSERT INTO PermisoContextualLog (
        IDPermisoContextual,
        IDUsuario,
        TipoEvento,
        FechaEvento,
        Detalles
      ) VALUES (?, ?, 'ELIMINAR', NOW(), ?)`,
      [
        permisoId,
        req.user.IDUsuario,
        `Permiso contextual eliminado ID: ${permisoId}`
      ]
    );
    
    // Eliminar el permiso contextual
    await pool.query(
      'DELETE FROM PermisoContextual WHERE IDPermisoContextual = ?',
      [permisoId]
    );
    
    res.json({ message: 'Permiso contextual eliminado con éxito' });
  } catch (error) {
    console.error('Error eliminando permiso contextual:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;