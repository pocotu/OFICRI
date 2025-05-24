const express = require('express');
const router = express.Router();
const dosajeModel = require('../models/dosajeModel');

// GET /api/dosaje - listar todos los dosajes
router.get('/', async (req, res) => {
  try {
    const dosajes = await dosajeModel.getAllDosajes();
    res.json(dosajes);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener dosajes', error: err.message });
  }
});

// POST /api/dosaje - crear un nuevo dosaje
router.post('/', async (req, res) => {
  try {
    const nuevo = await dosajeModel.createDosaje(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear dosaje', error: err.message });
  }
});

// GET /api/dosaje/pendientes?area=ID - listar dosajes pendientes de procesamiento por área
router.get('/pendientes', async (req, res) => {
  try {
    const areaId = req.query.area;
    if (!areaId) return res.status(400).json({ message: 'Falta parámetro area' });
    const dosajes = await dosajeModel.getDosajesPendientesByArea(areaId);
    res.json(dosajes);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener dosajes pendientes', error: err.message });
  }
});

module.exports = router; 