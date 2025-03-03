const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obtener todas las áreas
router.get('/', async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const [areas] = await db.query(`
            SELECT 
                a.*,
                COUNT(DISTINCT u.IDUsuario) as UsuariosAsignados,
                COUNT(DISTINCT d.IDDocumento) as DocumentosAsignados
            FROM AreaEspecializada a
            LEFT JOIN Usuario u ON a.IDArea = u.IDArea AND u.Bloqueado = 0
            LEFT JOIN Documento d ON a.IDArea = d.IDAreaActual
            WHERE ${includeInactive ? '1=1' : 'a.IsActive = true'}
            GROUP BY a.IDArea, a.NombreArea, a.CodigoIdentificacion, a.TipoArea, a.IsActive
            ORDER BY a.NombreArea
        `);

        res.json(areas);
    } catch (error) {
        console.error('Error al obtener áreas:', error);
        res.status(500).json({ message: 'Error al obtener áreas' });
    }
});

// Obtener área específica
router.get('/:id', async (req, res) => {
    try {
        const [areas] = await db.query(`
            SELECT 
                a.*,
                COUNT(DISTINCT u.IDUsuario) as UsuariosAsignados,
                COUNT(DISTINCT d.IDDocumento) as DocumentosAsignados
            FROM AreaEspecializada a
            LEFT JOIN Usuario u ON a.IDArea = u.IDArea AND u.Bloqueado = 0
            LEFT JOIN Documento d ON a.IDArea = d.IDAreaActual
            WHERE a.IDArea = ?
            GROUP BY a.IDArea, a.NombreArea, a.CodigoIdentificacion, a.TipoArea, a.IsActive
        `, [req.params.id]);

        if (areas.length === 0) {
            return res.status(404).json({ message: 'Área no encontrada' });
        }
        res.json(areas[0]);
    } catch (error) {
        console.error('Error al obtener área:', error);
        res.status(500).json({ message: 'Error al obtener área' });
    }
});

// Crear nueva área
router.post('/', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { nombreArea, codigoArea, tipoArea } = req.body;
        const [result] = await connection.query(
            'INSERT INTO AreaEspecializada (NombreArea, CodigoIdentificacion, TipoArea, IsActive) VALUES (?, ?, ?, true)',
            [nombreArea, codigoArea, tipoArea]
        );

        // Registrar la creación del área en el log
        await connection.query(
            'INSERT INTO AreaLog (IDArea, IDUsuario, TipoEvento, Detalles) VALUES (?, ?, ?, ?)',
            [result.insertId, req.session.user.id, 'CREACION_AREA', `Área creada: ${nombreArea} (${codigoArea})`]
        );

        await connection.commit();
        res.status(201).json({ 
            IDArea: result.insertId,
            NombreArea: nombreArea,
            CodigoIdentificacion: codigoArea,
            TipoArea: tipoArea,
            IsActive: true
        });
    } catch (error) {
        console.error('Error al crear área:', error);
        res.status(500).json({ message: 'Error al crear área' });
    }
});

// Actualizar área
router.put('/:id', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { nombreArea, codigoArea, tipoArea } = req.body;
        const [result] = await connection.query(
            'UPDATE AreaEspecializada SET NombreArea = ?, CodigoIdentificacion = ?, TipoArea = ? WHERE IDArea = ?',
            [nombreArea, codigoArea, tipoArea, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Área no encontrada' });
        }

        // Registrar la actualización del área en el log
        await connection.query(
            'INSERT INTO AreaLog (IDArea, IDUsuario, TipoEvento, Detalles) VALUES (?, ?, ?, ?)',
            [req.params.id, req.session.user.id, 'ACTUALIZACION_AREA', `Área actualizada: ${nombreArea} (${codigoArea})`]
        );

        await connection.commit();
        res.json({ 
            IDArea: parseInt(req.params.id),
            NombreArea: nombreArea,
            CodigoIdentificacion: codigoArea,
            TipoArea: tipoArea
        });
    } catch (error) {
        console.error('Error al actualizar área:', error);
        res.status(500).json({ message: 'Error al actualizar área' });
    }
});

// Eliminar área
router.delete('/:id', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query(
            'UPDATE AreaEspecializada SET IsActive = false WHERE IDArea = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Área no encontrada' });
        }

        // Registrar la eliminación del área en el log
        await connection.query(
            'INSERT INTO AreaLog (IDArea, IDUsuario, TipoEvento, Detalles) VALUES (?, ?, ?, ?)',
            [req.params.id, req.session.user.id, 'ELIMINACION_AREA', `Área desactivada: ID ${req.params.id}`]
        );

        await connection.commit();
        res.json({ message: 'Área eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar área:', error);
        res.status(500).json({ message: 'Error al eliminar área' });
    }
});

module.exports = router;
