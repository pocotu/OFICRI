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
        const { pool } = require('../config/database');
        let usuariosActivos = 0;
        let documentosPendientes = 0;
        let areasActivas = 0;
        
        try {
            // Consulta para contar usuarios activos
            const [usuariosResult] = await pool.query(
                'SELECT COUNT(*) as count FROM usuarios WHERE activo = 1'
            );
            usuariosActivos = usuariosResult[0].count || 0;
        } catch (userError) {
            console.log('Nota: La tabla usuarios no existe o está vacía');
            // Continúa con las siguientes consultas
        }
        
        try {
            // Consulta para contar documentos pendientes
            const [documentosResult] = await pool.query(
                'SELECT COUNT(*) as count FROM documentos WHERE estado = "PENDIENTE"'
            );
            documentosPendientes = documentosResult[0].count || 0;
        } catch (docError) {
            console.log('Nota: La tabla documentos no existe o está vacía');
            // Continúa con las siguientes consultas
        }
        
        try {
            // Consulta para contar áreas activas
            const [areasResult] = await pool.query(
                'SELECT COUNT(*) as count FROM areas WHERE activo = 1'
            );
            areasActivas = areasResult[0].count || 0;
        } catch (areaError) {
            console.log('Nota: La tabla areas no existe o está vacía');
        }
        
        // Devuelve los resultados, usando 0 como valor predeterminado si alguna consulta falló
        res.json({
            usuariosActivos,
            documentosPendientes,
            areasActivas
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        // Devuelve valores predeterminados en caso de error general
        res.json({
            usuariosActivos: 0,
            documentosPendientes: 0,
            areasActivas: 0
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