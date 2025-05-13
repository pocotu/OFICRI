const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');
const permisoAuditoria = require('../middleware/permisoAuditoria');

// GET /api/auditoria/usuario-log
router.get('/usuario-log', permisoAuditoria, async (req, res) => {
  try {
    const { usuarioId, tipoEvento, fechaInicio, fechaFin, page, pageSize } = req.query;
    const logs = await auditService.getUsuarioLogs({
      usuarioId,
      tipoEvento,
      fechaInicio,
      fechaFin,
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener logs de usuario', error: err.message });
  }
});

module.exports = router; 