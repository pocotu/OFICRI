const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/dashboard/metrics
router.get('/metrics', async (req, res) => {
  try {
    const [[{ totalDocs }]] = await pool.query('SELECT COUNT(*) AS totalDocs FROM Documento');
    const [[{ pendientes }]] = await pool.query(
      `SELECT COUNT(*) AS pendientes FROM Documento d
       JOIN EstadoDocumento e ON d.IDEstado = e.IDEstado
       WHERE e.NombreEstado = 'En trámite'`
    );
    // Puedes agregar más métricas aquí según lo que necesites
    res.json({
      totalDocs,
      pendientes
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener métricas', error: err.message });
  }
});

module.exports = router; 