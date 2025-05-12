const express = require('express');
const router = express.Router();
const pool = require('../db');

// Servicio de métricas (SRP, DIP)
class DashboardMetricsService {
  constructor(pool) {
    this.pool = pool;
  }

  async getTotalDocs() {
    const [[{ totalDocs }]] = await this.pool.query('SELECT COUNT(*) AS totalDocs FROM Documento');
    return totalDocs;
  }

  async getPendientes() {
    const [[{ pendientes }]] = await this.pool.query(
      `SELECT COUNT(*) AS pendientes FROM Documento WHERE Estado = 'En trámite'`
    );
    return pendientes;
  }

  async getDerivados() {
    const [[{ derivados }]] = await this.pool.query(
      `SELECT COUNT(*) AS derivados FROM Documento WHERE Estado = 'Derivado'`
    );
    return derivados;
  }

  async getUsuariosActivos() {
    const [[{ usuariosActivos }]] = await this.pool.query(
      `SELECT COUNT(*) AS usuariosActivos FROM Usuario WHERE Bloqueado = 0`
    );
    return usuariosActivos;
  }

  async getAreasActivas() {
    const [[{ areasActivas }]] = await this.pool.query(
      `SELECT COUNT(*) AS areasActivas FROM AreaEspecializada WHERE IsActive = 1`
    );
    return areasActivas;
  }
}

const metricsService = new DashboardMetricsService(pool);

// GET /api/dashboard/metrics
router.get('/metrics', async (req, res) => {
  try {
    const [totalDocs, pendientes, derivados, usuariosActivos, areasActivas] = await Promise.all([
      metricsService.getTotalDocs(),
      metricsService.getPendientes(),
      metricsService.getDerivados(),
      metricsService.getUsuariosActivos(),
      metricsService.getAreasActivas()
    ]);
    res.json({
      totalDocs,
      pendientes,
      derivados,
      usuariosActivos,
      areasActivas
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener métricas', error: err.message });
  }
});

module.exports = router; 