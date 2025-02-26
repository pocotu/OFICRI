const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Obtener logs filtrados por fecha
router.get('/', requireAuth, async (req, res) => {
    try {
        console.log('=== INICIANDO CONSULTA DE LOGS ===');
        const { startDate, endDate } = req.query;
        console.log('Parámetros recibidos:', { startDate, endDate, path: req.path });

        // Construir la consulta para UsuarioLog
        let query = `
            SELECT 
                'Usuario' as TipoLog,
                ul.FechaEvento,
                u.Username,
                ul.TipoEvento,
                CONCAT('IP: ', COALESCE(ul.IPOrigen, 'N/A'), ', Dispositivo: ', COALESCE(ul.DispositivoInfo, 'N/A')) as Detalles,
                ul.Exitoso as Estado
            FROM UsuarioLog ul
            LEFT JOIN Usuario u ON ul.IDUsuario = u.IDUsuario
        `;

        // Agregar filtros de fecha si se proporcionan
        const whereConditions = [];
        if (startDate) {
            whereConditions.push(`ul.FechaEvento >= '${startDate} 00:00:00'`);
        }
        if (endDate) {
            whereConditions.push(`ul.FechaEvento <= '${endDate} 23:59:59'`);
        }

        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        // Agregar ordenamiento
        query += ' ORDER BY ul.FechaEvento DESC';

        console.log('Ejecutando consulta:', query);
        const [logs] = await pool.query(query);
        console.log('Resultados obtenidos:', {
            cantidad: logs.length,
            primerLog: logs[0],
            ultimoLog: logs[logs.length - 1]
        });

        res.json(logs);
        console.log('=== CONSULTA DE LOGS COMPLETADA ===');
    } catch (error) {
        console.error('Error detallado al obtener logs:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ message: 'Error al obtener logs', error: error.message });
    }
});

// Obtener todos los logs (sin límite)
router.get('/all', requireAuth, async (req, res) => {
    try {
        console.log('=== INICIANDO CONSULTA DE TODOS LOS LOGS ===');
        // Reutilizar la misma ruta pero sin límite
        req.query = {}; // Limpiar los query params
        console.log('Redirigiendo a la ruta principal sin filtros');
        return await router.handle(req, res);
    } catch (error) {
        console.error('Error detallado al obtener todos los logs:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ message: 'Error al obtener todos los logs', error: error.message });
    }
});

module.exports = router;
