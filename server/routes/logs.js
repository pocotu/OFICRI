const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middlewares/auth');

// Obtener logs filtrados por fecha
router.get('/', requireAuth, async (req, res) => {
    try {
        console.log('=== INICIANDO CONSULTA DE LOGS ===');
        const { startDate, endDate, tipo } = req.query;
        console.log('Parámetros recibidos:', { startDate, endDate, tipo, path: req.path });

        // Construir consultas para diferentes tipos de logs
        let queries = [];
        
        // Consulta para UsuarioLog
        let userLogQuery = `
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
        
        // Consulta para AreaLog
        let areaLogQuery = `
            SELECT 
                'Area' as TipoLog,
                al.FechaEvento,
                u.Username,
                al.TipoEvento,
                CONCAT('Área: ', a.NombreArea, ', ', COALESCE(al.Detalles, 'N/A')) as Detalles,
                1 as Estado
            FROM AreaLog al
            LEFT JOIN Usuario u ON al.IDUsuario = u.IDUsuario
            LEFT JOIN AreaEspecializada a ON al.IDArea = a.IDArea
        `;
        
        // Consulta para DocumentoLog
        let docLogQuery = `
            SELECT 
                'Documento' as TipoLog,
                dl.FechaEvento,
                u.Username,
                dl.TipoAccion as TipoEvento,
                CONCAT('Doc: ', d.NumeroOficioDocumento, ', ', COALESCE(dl.DetallesAccion, 'N/A')) as Detalles,
                1 as Estado
            FROM DocumentoLog dl
            LEFT JOIN Usuario u ON dl.IDUsuario = u.IDUsuario
            LEFT JOIN Documento d ON dl.IDDocumento = d.IDDocumento
        `;
        
        // Agregar filtros de fecha si se proporcionan
        const whereConditions = [];
        const queryParams = [];
        
        if (startDate) {
            whereConditions.push(`FechaEvento >= ?`);
            queryParams.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            whereConditions.push(`FechaEvento <= ?`);
            queryParams.push(`${endDate} 23:59:59`);
        }
        
        const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';
        
        
        // Agregar filtros según el tipo solicitado
        if (!tipo || tipo === 'usuario') {
            queries.push(userLogQuery + whereClause);
        }
        if (!tipo || tipo === 'area') {
            queries.push(areaLogQuery + whereClause);
        }
        if (!tipo || tipo === 'documento') {
            queries.push(docLogQuery + whereClause);
        }
        
        // Combinar todas las consultas con UNION
        const finalQuery = queries.join(' UNION ') + ' ORDER BY FechaEvento DESC';
        
        console.log('Ejecutando consulta:', finalQuery);
        console.log('Parámetros:', queryParams);
        
        // Duplicar los parámetros por cada consulta en la unión
        const allParams = [];
        for (let i = 0; i < queries.length; i++) {
            allParams.push(...queryParams);
        }
        
        const [logs] = await pool.query(finalQuery, allParams);
        console.log('Resultados obtenidos:', {
            cantidad: logs.length,
            primerLog: logs.length > 0 ? logs[0] : null,
            ultimoLog: logs.length > 0 ? logs[logs.length - 1] : null
        });


        res.json(logs);
        console.log('=== CONSULTA DE LOGS COMPLETADA ===');
    } catch (error) {
        console.error('Error detallado al obtener logs:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ message: 'Error al obtener logs', error: error.message });
    }
});

// Obtener logs por tipo específico
router.get('/tipo/:tipo', requireAuth, async (req, res) => {
    try {
        const { tipo } = req.params;
        const { startDate, endDate } = req.query;
        
        req.query.tipo = tipo;
        return await router.handle(req, res);
    } catch (error) {
        console.error(`Error al obtener logs de tipo ${req.params.tipo}:`, error);
        res.status(500).json({ message: `Error al obtener logs de tipo ${req.params.tipo}`, error: error.message });
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
