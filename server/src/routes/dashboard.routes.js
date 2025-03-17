/**
 * Rutas del dashboard
 * Proporciona endpoints para obtener estadísticas y datos del dashboard
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/middlewareExport');

// Endpoint público para obtener estadísticas básicas (SIN autenticación)
// NOTA: Este endpoint es temporal y debe ser reemplazado por la versión segura
// cuando se solucione el problema de autenticación
router.get('/public-stats', async (req, res) => {
    try {
        console.log('Accediendo a estadísticas públicas');
        const { pool } = require('../config/database');
        
        // Valores iniciales
        let estadisticasDB = {
            usuariosActivos: 0,
            documentosPendientes: 0,
            areasActivas: 0,
            estadisticasDetalladas: {}
        };
        
        try {
            // Consulta mejorada para obtener estadísticas de usuarios activos
            const [usuariosResult] = await pool.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Bloqueado = 0 THEN 1 ELSE 0 END) as activos,
                    SUM(CASE WHEN Bloqueado = 1 THEN 1 ELSE 0 END) as bloqueados,
                    COUNT(DISTINCT IDArea) as areas_con_usuarios
                FROM 
                    Usuario
            `);
            
            estadisticasDB.usuariosActivos = usuariosResult[0].activos || 0;
            estadisticasDB.estadisticasDetalladas.usuarios = {
                total: usuariosResult[0].total || 0,
                activos: usuariosResult[0].activos || 0,
                bloqueados: usuariosResult[0].bloqueados || 0,
                areasConUsuarios: usuariosResult[0].areas_con_usuarios || 0
            };
            
            console.log('Estadísticas de usuarios obtenidas:', estadisticasDB.estadisticasDetalladas.usuarios);
            
            // Obtener también los usuarios por rol
            const [usuariosPorRol] = await pool.query(`
                SELECT 
                    r.NombreRol, 
                    COUNT(u.IDUsuario) as cantidad
                FROM 
                    Usuario u
                JOIN 
                    Rol r ON u.IDRol = r.IDRol
                GROUP BY 
                    r.NombreRol
                ORDER BY 
                    cantidad DESC
            `);
            
            estadisticasDB.estadisticasDetalladas.usuariosPorRol = usuariosPorRol;
            console.log('Usuarios por rol obtenidos:', usuariosPorRol.length);
        } catch (userError) {
            console.log('Error al obtener estadísticas de usuarios:', userError.message);
            console.error(userError);
        }
        
        try {
            // Consulta mejorada para obtener estadísticas de documentos
            const [documentosResult] = await pool.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN Estado = 'PROCESADO' THEN 1 ELSE 0 END) as procesados,
                    SUM(CASE WHEN Estado = 'FINALIZADO' THEN 1 ELSE 0 END) as finalizados,
                    SUM(CASE WHEN Estado = 'RECHAZADO' THEN 1 ELSE 0 END) as rechazados,
                    COUNT(DISTINCT IDUsuarioCreador) as usuarios_creadores
                FROM 
                    Documento
            `);
            
            estadisticasDB.documentosPendientes = documentosResult[0].pendientes || 0;
            estadisticasDB.estadisticasDetalladas.documentos = {
                total: documentosResult[0].total || 0,
                pendientes: documentosResult[0].pendientes || 0,
                procesados: documentosResult[0].procesados || 0,
                finalizados: documentosResult[0].finalizados || 0,
                rechazados: documentosResult[0].rechazados || 0,
                usuariosCreadores: documentosResult[0].usuarios_creadores || 0
            };
            
            console.log('Estadísticas de documentos obtenidas:', estadisticasDB.estadisticasDetalladas.documentos);
            
            // Documentos por área
            const [documentosPorArea] = await pool.query(`
                SELECT 
                    a.NombreArea, 
                    COUNT(d.IDDocumento) as cantidad
                FROM 
                    Documento d
                JOIN 
                    AreaEspecializada a ON d.IDAreaDestino = a.IDArea
                GROUP BY 
                    a.NombreArea
                ORDER BY 
                    cantidad DESC
                LIMIT 5
            `);
            
            estadisticasDB.estadisticasDetalladas.documentosPorArea = documentosPorArea;
            console.log('Documentos por área obtenidos:', documentosPorArea.length);
        } catch (docError) {
            console.log('Error al obtener estadísticas de documentos:', docError.message);
            console.error(docError);
        }
        
        try {
            // Consulta mejorada para obtener estadísticas de áreas
            const [areasResult] = await pool.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as activas,
                    SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as inactivas
                FROM 
                    AreaEspecializada
            `);
            
            estadisticasDB.areasActivas = areasResult[0].activas || 0;
            estadisticasDB.estadisticasDetalladas.areas = {
                total: areasResult[0].total || 0,
                activas: areasResult[0].activas || 0,
                inactivas: areasResult[0].inactivas || 0
            };
            
            console.log('Estadísticas de áreas obtenidas:', estadisticasDB.estadisticasDetalladas.areas);
            
            // Obtener las áreas más activas (con más documentos)
            const [areasActividad] = await pool.query(`
                SELECT 
                    a.NombreArea, 
                    a.CodigoIdentificacion,
                    a.TipoArea,
                    COUNT(DISTINCT d.IDDocumento) as documentos,
                    COUNT(DISTINCT u.IDUsuario) as usuarios
                FROM 
                    AreaEspecializada a
                LEFT JOIN 
                    Documento d ON a.IDArea = d.IDAreaDestino
                LEFT JOIN 
                    Usuario u ON a.IDArea = u.IDArea
                WHERE 
                    a.IsActive = 1
                GROUP BY 
                    a.IDArea
                ORDER BY 
                    documentos DESC, usuarios DESC
                LIMIT 5
            `);
            
            estadisticasDB.estadisticasDetalladas.areasActividad = areasActividad;
            console.log('Áreas más activas obtenidas:', areasActividad.length);
        } catch (areaError) {
            console.log('Error al obtener estadísticas de áreas:', areaError.message);
            console.error(areaError);
        }
        
        try {
            // Estadísticas de actividad reciente
            const [actividadReciente] = await pool.query(`
                SELECT 
                    'login' as tipo,
                    u.Nombres, 
                    u.Apellidos,
                    ul.FechaEvento as fecha,
                    ul.IPOrigen as ip,
                    ul.DispositivoInfo as info,
                    ul.Exitoso as exitoso
                FROM 
                    UsuarioLog ul
                JOIN 
                    Usuario u ON ul.IDUsuario = u.IDUsuario
                WHERE 
                    ul.TipoEvento = 'LOGIN'
                ORDER BY 
                    ul.FechaEvento DESC
                LIMIT 5
            `);
            
            estadisticasDB.estadisticasDetalladas.actividadReciente = actividadReciente;
            console.log('Actividad reciente obtenida:', actividadReciente.length);
        } catch (actividadError) {
            console.log('Error al obtener actividad reciente:', actividadError.message);
        }
        
        // Devuelve solo los resultados de la base de datos
        res.json({
            ...estadisticasDB,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error al obtener estadísticas públicas:', error);
        
        // Devuelve error sin datos de respaldo
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas',
            message: error.message
        });
    }
});

// Endpoint original para obtener estadísticas básicas (con autenticación)
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
                'SELECT COUNT(*) as count FROM AreaEspecializada WHERE IsActive = 1'
            );
            areasActivas = areasResult[0].count || 0;
        } catch (areaError) {
            console.log('Nota: La tabla AreaEspecializada no existe o está vacía');
            console.error('Error al contar áreas activas:', areaError);
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