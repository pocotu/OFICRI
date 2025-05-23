const express = require('express');
const router = express.Router();
const forenseDigitalModel = require('../models/forenseDigitalModel');

// GET /api/forensedigital - listar todos los registros de Forense Digital
router.get('/', async (req, res) => {
  try {
    const forenseDigitalRecords = await forenseDigitalModel.getAllForenseDigital();
    res.json(forenseDigitalRecords);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener registros de Forense Digital', error: err.message });
  }
});

// TODO: Add other Forense Digital related routes (POST, PUT, DELETE, etc.)

module.exports = router; 