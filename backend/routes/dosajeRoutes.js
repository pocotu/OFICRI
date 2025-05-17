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

module.exports = router; 