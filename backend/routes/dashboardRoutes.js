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

  // Actividad reciente: últimos 10 logs de usuario
  async getActividadReciente() {
    const [rows] = await this.pool.query(
      `SELECT l.IDLog, l.TipoEvento, l.FechaEvento, u.Nombres AS Usuario, l.IPOrigen
       FROM UsuarioLog l
       JOIN Usuario u ON l.IDUsuario = u.IDUsuario
       ORDER BY l.FechaEvento DESC
       LIMIT 10`
    );
    return rows;
  }

  // Documentos pendientes: últimos 10 documentos en trámite
  async getDocumentosPendientes() {
    const [rows] = await this.pool.query(
      `SELECT d.IDDocumento, d.NroRegistro, d.FechaDocumento, d.Contenido, a.NombreArea, u.Nombres AS Usuario
       FROM Documento d
       JOIN AreaEspecializada a ON d.IDAreaActual = a.IDArea
       JOIN Usuario u ON d.IDUsuarioCreador = u.IDUsuario
       WHERE d.Estado = 'En trámite'
       ORDER BY d.FechaDocumento DESC
       LIMIT 10`
    );
    return rows;
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

// GET /api/dashboard/actividad-reciente
router.get('/actividad-reciente', async (req, res) => {
  try {
    const actividad = await metricsService.getActividadReciente();
    res.json(actividad);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener actividad reciente', error: err.message });
  }
});

// GET /api/dashboard/documentos-pendientes
router.get('/documentos-pendientes', async (req, res) => {
  try {
    const docs = await metricsService.getDocumentosPendientes();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener documentos pendientes', error: err.message });
  }
});

module.exports = router; 