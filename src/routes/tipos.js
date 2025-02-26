const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obtener todos los tipos de área
router.get('/', async (req, res) => {
    try {
        const [tipos] = await db.query('SELECT DISTINCT TipoArea FROM AreaEspecializada WHERE TipoArea IS NOT NULL');
        res.json(tipos.map(t => ({ id: t.TipoArea, nombre: t.TipoArea })));
    } catch (error) {
        console.error('Error al obtener tipos de área:', error);
        res.status(500).json({ message: 'Error al obtener tipos de área' });
    }
});

module.exports = router;