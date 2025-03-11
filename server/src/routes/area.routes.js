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

// Endpoint de diagnóstico para verificar si la tabla existe
router.get('/diagnostico', authMiddleware, async (req, res) => {
    console.log('[AREA-DEBUG] Ejecutando diagnóstico de la tabla AreaEspecializada');
    
    try {
        // Verificar si la tabla existe
        const [tables] = await pool.query(
            "SHOW TABLES LIKE 'AreaEspecializada'"
        );
        
        const tablaExiste = tables.length > 0;
        console.log(`[AREA-DEBUG] ¿La tabla AreaEspecializada existe?: ${tablaExiste}`);
        
        let totalRegistros = 0;
        let registrosActivos = 0;
        let primerRegistro = null;
        
        if (tablaExiste) {
            // Contar total de registros
            const [total] = await pool.query('SELECT COUNT(*) as count FROM AreaEspecializada');
            totalRegistros = total[0].count;
            
            // Contar registros activos
            const [activos] = await pool.query('SELECT COUNT(*) as count FROM AreaEspecializada WHERE IsActive = TRUE');
            registrosActivos = activos[0].count;
            
            // Obtener el primer registro
            if (totalRegistros > 0) {
                const [primero] = await pool.query('SELECT * FROM AreaEspecializada LIMIT 1');
                primerRegistro = primero[0];
            }
        }
        
        console.log(`[AREA-DEBUG] Total registros: ${totalRegistros}, Activos: ${registrosActivos}`);
        if (primerRegistro) {
            console.log(`[AREA-DEBUG] Ejemplo de registro: ${JSON.stringify(primerRegistro)}`);
        }
        
        res.json({
            success: true,
            diagnostico: {
                tablaExiste,
                totalRegistros,
                registrosActivos,
                primerRegistro
            }
        });
    } catch (error) {
        console.error('[AREA-DEBUG] Error al realizar diagnóstico:', error);
        res.status(500).json({
            success: false,
            message: 'Error al realizar diagnóstico',
            error: error.message
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

// Obtener área por ID
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    
    console.log(`[AREA-DEBUG] Solicitando área con ID: ${id}`);
    console.log(`[AREA-DEBUG] Token de autorización: ${req.headers.authorization ? 'PRESENTE' : 'AUSENTE'}`);
    
    try {
        console.log(`[AREA-DEBUG] Ejecutando consulta SQL para obtener área con ID: ${id}`);
        const [areas] = await pool.query(
            'SELECT * FROM AreaEspecializada WHERE IDArea = ?',
            [id]
        );
        
        console.log(`[AREA-DEBUG] Resultados obtenidos: ${areas.length}`);
        
        if (areas.length === 0) {
            console.log(`[AREA-DEBUG] No se encontró área con ID: ${id}`);
            return res.status(404).json({
                success: false,
                message: 'Área no encontrada'
            });
        }
        
        console.log(`[AREA-DEBUG] Área encontrada: ${JSON.stringify(areas[0])}`);
        res.json(areas[0]);
    } catch (error) {
        console.error(`[AREA-DEBUG] Error al obtener área con ID ${id}:`, error);
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

module.exports = router; 