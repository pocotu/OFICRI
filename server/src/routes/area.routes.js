/**
 * Rutas de áreas
 * Define las rutas relacionadas con la gestión de áreas especializadas
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authMiddleware } = require('../middleware/middlewareExport');

// Obtener todas las áreas
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [areas] = await pool.query(
            'SELECT * FROM AreaEspecializada WHERE IsActive = TRUE'
        );

        res.json({
            success: true,
            areas
        });
    } catch (error) {
        console.error('Error al obtener áreas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Crear área
router.post('/', authMiddleware, async (req, res) => {
    const { nombreArea, codigoIdentificacion, tipoArea, descripcion } = req.body;

    try {
        // Verificar si el código ya existe
        const [existingAreas] = await pool.query(
            'SELECT IDArea FROM AreaEspecializada WHERE CodigoIdentificacion = ?',
            [codigoIdentificacion]
        );

        if (existingAreas.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El código de identificación ya está registrado'
            });
        }

        const [result] = await pool.query(
            `INSERT INTO AreaEspecializada (
                NombreArea, CodigoIdentificacion, TipoArea, Descripcion
            ) VALUES (?, ?, ?, ?)`,
            [nombreArea, codigoIdentificacion, tipoArea, descripcion]
        );

        res.json({
            success: true,
            areaId: result.insertId,
            message: 'Área creada exitosamente'
        });
    } catch (error) {
        console.error('Error al crear área:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar área
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { nombreArea, tipoArea, descripcion } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE AreaEspecializada SET NombreArea = ?, TipoArea = ?, Descripcion = ? WHERE IDArea = ?',
            [nombreArea, tipoArea, descripcion, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Área no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Área actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar área:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Eliminar área
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar si hay usuarios asignados al área
        const [users] = await pool.query(
            'SELECT COUNT(*) as count FROM Usuario WHERE IDArea = ? AND IsActive = TRUE',
            [id]
        );

        if (users[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el área porque tiene usuarios asignados'
            });
        }

        const [result] = await pool.query(
            'UPDATE AreaEspecializada SET IsActive = FALSE WHERE IDArea = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Área no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Área eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar área:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener conteo de áreas activas
router.get('/count', authMiddleware, async (req, res) => {
    try {
        const [result] = await pool.query(
            'SELECT COUNT(*) as count FROM AreaEspecializada WHERE IsActive = TRUE'
        );
        
        res.json({
            success: true,
            count: result[0].count
        });
    } catch (error) {
        console.error('Error al obtener conteo de áreas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router; 