/**
 * Rutas de mesa de partes
 * Define las rutas relacionadas con la gestión de mesas de partes
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authMiddleware } = require('../middleware/middlewareExport');

// Obtener todas las mesas de partes
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [mesasPartes] = await pool.query(
            'SELECT * FROM MesaPartes WHERE IsActive = TRUE'
        );

        res.json({
            success: true,
            mesasPartes
        });
    } catch (error) {
        console.error('Error al obtener mesas de partes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Crear mesa de partes
router.post('/', authMiddleware, async (req, res) => {
    const { descripcion, codigoIdentificacion } = req.body;

    try {
        // Verificar si el código ya existe
        const [existing] = await pool.query(
            'SELECT IDMesaPartes FROM MesaPartes WHERE CodigoIdentificacion = ?',
            [codigoIdentificacion]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El código de identificación ya está registrado'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO MesaPartes (Descripcion, CodigoIdentificacion) VALUES (?, ?)',
            [descripcion, codigoIdentificacion]
        );

        res.json({
            success: true,
            mesaPartesId: result.insertId,
            message: 'Mesa de partes creada exitosamente'
        });
    } catch (error) {
        console.error('Error al crear mesa de partes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar mesa de partes
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { descripcion } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE MesaPartes SET Descripcion = ? WHERE IDMesaPartes = ?',
            [descripcion, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mesa de partes no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Mesa de partes actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar mesa de partes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Eliminar mesa de partes
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query(
            'UPDATE MesaPartes SET IsActive = FALSE WHERE IDMesaPartes = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mesa de partes no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Mesa de partes eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar mesa de partes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener conteo de documentos pendientes
router.get('/pending/count', authMiddleware, async (req, res) => {
    try {
        const [result] = await pool.query(
            'SELECT COUNT(*) as count FROM Documento WHERE Estado = "PENDIENTE"'
        );
        
        res.json({
            success: true,
            count: result[0].count
        });
    } catch (error) {
        console.error('Error al obtener conteo de documentos pendientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router; 