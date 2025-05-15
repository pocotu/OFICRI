const express = require('express');
const router = express.Router();
const areaService = require('../services/areaService');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { requireView, requireAdmin } = require('../middleware/permissionMiddleware');
const permissionService = require('../services/permissionService');

// GET /api/areas/activas - Public endpoint, no auth required
router.get('/activas', async (req, res) => {
  const areas = await areaService.getActiveAreas();
  res.json(areas);
});

// GET /api/areas - Requires authentication and VIEW permission
router.get('/', authMiddleware, requireView, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM AreaEspecializada WHERE IsActive = TRUE'
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener áreas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/areas/:id - Requires authentication and VIEW permission
router.get('/:id', authMiddleware, requireView, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM AreaEspecializada WHERE IDArea = ? AND IsActive = TRUE',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Área no encontrada' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener área:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/areas - Requires authentication and ADMIN permission
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { 
      NombreArea,
      CodigoIdentificacion,
      TipoArea,
      Descripcion
    } = req.body;
    
    // Validar campos obligatorios
    if (!NombreArea) {
      return res.status(400).json({ message: 'El nombre del área es obligatorio' });
    }
    
    // Verificar si el área ya existe
    const [existingArea] = await pool.query(
      'SELECT 1 FROM AreaEspecializada WHERE NombreArea = ?',
      [NombreArea]
    );
    
    if (existingArea.length > 0) {
      return res.status(400).json({ message: 'Ya existe un área con ese nombre' });
}

    // Crear el área
    const [result] = await pool.query(
      `INSERT INTO AreaEspecializada (
        NombreArea,
        CodigoIdentificacion,
        TipoArea,
        Descripcion,
        IsActive
      ) VALUES (?, ?, ?, ?, TRUE)`,
      [
        NombreArea,
        CodigoIdentificacion,
        TipoArea,
        Descripcion
      ]
    );
    
    // Registrar en el log de áreas
    await pool.query(
      `INSERT INTO AreaLog (IDArea, IDUsuario, TipoEvento, FechaEvento, Detalles)
       VALUES (?, ?, 'CREAR', NOW(), ?)`,
      [
        result.insertId,
        req.user.IDUsuario,
        `Área creada: ${NombreArea}`
      ]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Área creada con éxito' 
    });
  } catch (error) {
    console.error('Error al crear área:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /api/areas/:id
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const areaId = parseInt(req.params.id);
    
    const { 
      NombreArea,
      CodigoIdentificacion,
      TipoArea,
      Descripcion,
      IsActive
    } = req.body;
    
    // Validar campos obligatorios
    if (!NombreArea) {
      return res.status(400).json({ message: 'El nombre del área es obligatorio' });
    }
    
    // Verificar que el área exista
    const [areaExists] = await pool.query(
      'SELECT 1 FROM AreaEspecializada WHERE IDArea = ?',
      [areaId]
    );
    
    if (areaExists.length === 0) {
      return res.status(404).json({ message: 'Área no encontrada' });
    }
    
    // Actualizar el área
    await pool.query(
      `UPDATE AreaEspecializada SET 
        NombreArea = ?,
        CodigoIdentificacion = ?,
        TipoArea = ?,
        Descripcion = ?,
        IsActive = ?
       WHERE IDArea = ?`,
      [
        NombreArea,
        CodigoIdentificacion,
        TipoArea,
        Descripcion,
        IsActive !== undefined ? IsActive : true,
        areaId
      ]
    );
    
    // Registrar en el log de áreas
    await pool.query(
      `INSERT INTO AreaLog (IDArea, IDUsuario, TipoEvento, FechaEvento, Detalles)
       VALUES (?, ?, 'EDITAR', NOW(), ?)`,
      [
        areaId,
        req.user.IDUsuario,
        `Área actualizada: ${NombreArea}`
      ]
    );
    
    res.json({ message: 'Área actualizada con éxito' });
  } catch (error) {
    console.error('Error al actualizar área:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /api/areas/:id
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const areaId = parseInt(req.params.id);
    
    // Verificar que el área exista
    const [rows] = await pool.query(
      'SELECT NombreArea FROM AreaEspecializada WHERE IDArea = ?',
      [areaId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Área no encontrada' });
    }
    
    const nombreArea = rows[0].NombreArea;
    
    // Verificar si hay usuarios asignados a esta área
    const [usersInArea] = await pool.query(
      'SELECT COUNT(*) as count FROM Usuario WHERE IDArea = ?',
      [areaId]
    );
    
    if (usersInArea[0].count > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el área porque tiene usuarios asignados',
        details: 'Reasigne los usuarios a otra área antes de eliminar'
      });
    }
    
    // Verificar si hay documentos en esta área
    const [docsInArea] = await pool.query(
      'SELECT COUNT(*) as count FROM Documento WHERE IDAreaActual = ?',
      [areaId]
    );
    
    if (docsInArea[0].count > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el área porque tiene documentos asignados',
        details: 'Derive los documentos a otra área antes de eliminar'
      });
    }
    
    // Registrar en el log de áreas antes de eliminar
    await pool.query(
      `INSERT INTO AreaLog (IDArea, IDUsuario, TipoEvento, FechaEvento, Detalles)
       VALUES (?, ?, 'ELIMINAR', NOW(), ?)`,
      [
        areaId,
        req.user.IDUsuario,
        `Área eliminada: ${nombreArea}`
      ]
    );
    
    // Eliminar o desactivar el área (preferimos desactivar para mantener la integridad)
    await pool.query(
      'UPDATE AreaEspecializada SET IsActive = FALSE WHERE IDArea = ?',
      [areaId]
    );
    
    res.json({ message: 'Área eliminada con éxito' });
  } catch (error) {
    console.error('Error al eliminar área:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router; 