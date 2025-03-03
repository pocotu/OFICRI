const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

// Obtener todos los roles
router.get('/', requireAuth, async (req, res) => {
    try {
        const [roles] = await pool.query('SELECT * FROM Rol ORDER BY NivelAcceso ASC');
        res.json(roles);
    } catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({ message: 'Error al obtener roles' });
    }
});

// Obtener un rol específico
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const [roles] = await pool.query('SELECT * FROM Rol WHERE IDRol = ?', [req.params.id]);
        
        if (roles.length === 0) {
            return res.status(404).json({ message: 'Rol no encontrado' });
        }
        
        res.json(roles[0]);
    } catch (error) {
        console.error('Error al obtener rol:', error);
        res.status(500).json({ message: 'Error al obtener rol' });
    }
});

// Crear un nuevo rol (solo admin)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { nombreRol, descripcion, nivelAcceso, puedeCrear, puedeEditar, puedeDerivar, puedeAuditar } = req.body;
        
        // Validar datos
        if (!nombreRol || !nivelAcceso) {
            return res.status(400).json({ message: 'Nombre y nivel de acceso son requeridos' });
        }
        
        const [result] = await pool.query(`
            INSERT INTO Rol (
                NombreRol, 
                Descripcion, 
                NivelAcceso, 
                PuedeCrear, 
                PuedeEditar, 
                PuedeDerivar, 
                PuedeAuditar
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            nombreRol, 
            descripcion || '', 
            nivelAcceso, 
            puedeCrear ? 1 : 0, 
            puedeEditar ? 1 : 0, 
            puedeDerivar ? 1 : 0, 
            puedeAuditar ? 1 : 0
        ]);
        
        // Registrar la creación en el log
        await pool.query(
            'INSERT INTO RolLog (IDRol, IDUsuario, TipoEvento, Detalles) VALUES (?, ?, ?, ?)',
            [result.insertId, req.session.user.id, 'CREACION', `Rol creado por ${req.session.user.username}`]
        );
        
        res.status(201).json({ 
            message: 'Rol creado exitosamente',
            rolId: result.insertId
        });
    } catch (error) {
        console.error('Error al crear rol:', error);
        res.status(500).json({ message: 'Error al crear rol' });
    }
});

// Lista de roles del sistema que no pueden ser modificados
const CORE_SYSTEM_ROLES = ['Administrador', 'Operador Mesa de Partes', 'Responsable de Área', 'Visualizador'];

// Actualizar un rol existente (solo admin)
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { nombreRol, descripcion, nivelAcceso, puedeCrear, puedeEditar, puedeDerivar, puedeAuditar } = req.body;
        const rolId = req.params.id;
        
        // Validar datos
        if (!nombreRol || !nivelAcceso) {
            return res.status(400).json({ message: 'Nombre y nivel de acceso son requeridos' });
        }

        // Verificar si es un rol del sistema
        const [currentRole] = await pool.query('SELECT NombreRol FROM Rol WHERE IDRol = ?', [rolId]);
        if (currentRole.length > 0 && CORE_SYSTEM_ROLES.includes(currentRole[0].NombreRol)) {
            return res.status(403).json({ message: 'No se pueden modificar los roles básicos del sistema' });
        }
        
        await pool.query(`
            UPDATE Rol SET 
                NombreRol = ?, 
                Descripcion = ?, 
                NivelAcceso = ?, 
                PuedeCrear = ?, 
                PuedeEditar = ?, 
                PuedeDerivar = ?, 
                PuedeAuditar = ?
            WHERE IDRol = ?
        `, [
            nombreRol, 
            descripcion || '', 
            nivelAcceso, 
            puedeCrear ? 1 : 0, 
            puedeEditar ? 1 : 0, 
            puedeDerivar ? 1 : 0, 
            puedeAuditar ? 1 : 0,
            rolId
        ]);
        
        // Registrar la actualización en el log
        await pool.query(
            'INSERT INTO RolLog (IDRol, IDUsuario, TipoEvento, Detalles) VALUES (?, ?, ?, ?)',
            [rolId, req.session.user.id, 'ACTUALIZACION', `Rol actualizado por ${req.session.user.username}`]
        );
        
        res.json({ message: 'Rol actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar rol:', error);
        res.status(500).json({ message: 'Error al actualizar rol' });
    }
});

// Eliminar un rol (solo admin)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const rolId = req.params.id;
        
        // Verificar si hay usuarios usando este rol
        const [usuarios] = await pool.query('SELECT COUNT(*) as count FROM Usuario WHERE IDRol = ?', [rolId]);
        
        if (usuarios[0].count > 0) {
            return res.status(400).json({ 
                message: 'No se puede eliminar el rol porque hay usuarios asignados a él' 
            });
        }
        
        // Registrar la eliminación en el log antes de eliminar el rol
        await pool.query(
            'INSERT INTO RolLog (IDRol, IDUsuario, TipoEvento, Detalles) VALUES (?, ?, ?, ?)',
            [rolId, req.session.user.id, 'ELIMINACION', `Rol eliminado por ${req.session.user.username}`]
        );
        
        await pool.query('DELETE FROM Rol WHERE IDRol = ?', [rolId]);
        
        res.json({ message: 'Rol eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar rol:', error);
        res.status(500).json({ message: 'Error al eliminar rol' });
    }
});

module.exports = router;
