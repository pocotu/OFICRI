/**
 * Rutas del dashboard
 * Proporciona endpoints para obtener estadísticas y datos del dashboard
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/middlewareExport');

// Endpoint para obtener estadísticas básicas
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        // TODO: Implementar lógica real de estadísticas
        // Por ahora retornamos datos de prueba
        res.json({
            usuariosActivos: Math.floor(Math.random() * 100),
            documentosPendientes: Math.floor(Math.random() * 50),
            areasActivas: Math.floor(Math.random() * 20)
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            error: 'Error al obtener estadísticas',
            message: error.message
        });
    }
});

// Endpoint para obtener actividad reciente
router.get('/activity', authMiddleware, async (req, res) => {
    try {
        // TODO: Implementar lógica real de actividad
        res.json({
            activities: [
                {
                    id: 1,
                    type: 'document',
                    action: 'created',
                    description: 'Nuevo documento registrado',
                    timestamp: new Date()
                }
            ]
        });
    } catch (error) {
        console.error('Error al obtener actividad reciente:', error);
        res.status(500).json({
            error: 'Error al obtener actividad reciente',
            message: error.message
        });
    }
});

module.exports = router; 