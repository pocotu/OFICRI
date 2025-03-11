/**
 * Rutas de roles
 * Define las rutas relacionadas con la gestión de roles
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authMiddleware } = require('../middleware/middlewareExport');

// Obtener todos los roles
router.get('/', authMiddleware, async (req, res) => {
    try {
        console.log('[ROL-DEBUG] Obteniendo todos los roles');
        const [roles] = await pool.query('SELECT * FROM Rol');
        
        res.json({
            success: true,
            roles
        });
    } catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener rol por ID
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    
    console.log(`[ROL-DEBUG] Solicitando rol con ID: ${id}`);
    console.log(`[ROL-DEBUG] Token de autorización: ${req.headers.authorization ? 'PRESENTE' : 'AUSENTE'}`);
    
    try {
        console.log(`[ROL-DEBUG] Ejecutando consulta SQL para obtener rol con ID: ${id}`);
        const [roles] = await pool.query(
            'SELECT * FROM Rol WHERE IDRol = ?',
            [id]
        );
        
        console.log(`[ROL-DEBUG] Resultados obtenidos: ${roles.length}`);
        
        if (roles.length === 0) {
            console.log(`[ROL-DEBUG] No se encontró rol con ID: ${id}`);
            return res.status(404).json({
                success: false,
                message: 'Rol no encontrado'
            });
        }
        
        console.log(`[ROL-DEBUG] Rol encontrado: ${JSON.stringify(roles[0])}`);
        res.json(roles[0]);
    } catch (error) {
        console.error(`[ROL-DEBUG] Error al obtener rol con ID ${id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Crear rol
router.post('/', authMiddleware, async (req, res) => {
    const { nombreRol, descripcion, permisos } = req.body;

    try {
        // Verificar si el rol ya existe
        const [existingRoles] = await pool.query(
            'SELECT IDRol FROM Rol WHERE NombreRol = ?',
            [nombreRol]
        );

        if (existingRoles.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un rol con ese nombre'
            });
        }

        // Insertar el nuevo rol
        const [result] = await pool.query(
            'INSERT INTO Rol (NombreRol, Descripcion, Permisos) VALUES (?, ?, ?)',
            [nombreRol, descripcion, permisos]
        );

        res.status(201).json({
            success: true,
            message: 'Rol creado exitosamente',
            rolId: result.insertId
        });
    } catch (error) {
        console.error('Error al crear rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar rol
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { nombreRol, descripcion, permisos } = req.body;

    try {
        // Verificar si el rol existe
        const [existingRoles] = await pool.query(
            'SELECT IDRol FROM Rol WHERE IDRol = ?',
            [id]
        );

        if (existingRoles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rol no encontrado'
            });
        }

        // Actualizar el rol
        await pool.query(
            'UPDATE Rol SET NombreRol = ?, Descripcion = ?, Permisos = ? WHERE IDRol = ?',
            [nombreRol, descripcion, permisos, id]
        );

        res.json({
            success: true,
            message: 'Rol actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Eliminar rol
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar si el rol existe
        const [existingRoles] = await pool.query(
            'SELECT IDRol FROM Rol WHERE IDRol = ?',
            [id]
        );

        if (existingRoles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rol no encontrado'
            });
        }

        // Eliminar el rol
        await pool.query(
            'DELETE FROM Rol WHERE IDRol = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Rol eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router; 