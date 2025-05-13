const express = require('express');
const router = express.Router();
const areaService = require('../services/areaService');
const { getUserFromToken } = require('../services/userService');

// GET /api/areas/activas
router.get('/activas', async (req, res) => {
  const areas = await areaService.getActiveAreas();
  res.json(areas);
});

// GET /api/areas
router.get('/', async (req, res) => {
  const areas = await areaService.getAllAreas();
  res.json(areas);
});

// GET /api/areas/:id
router.get('/:id', async (req, res) => {
  const area = await areaService.getAreaById(req.params.id);
  if (!area) return res.status(404).json({ message: 'Área no encontrada' });
  res.json(area);
});

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  getUserFromToken(token).then(user => {
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if ((user.Permisos & 128) !== 128) return res.status(403).json({ message: 'No autorizado' });
    req.user = user;
    next();
  });
}

// POST /api/areas
router.post('/', requireAdmin, async (req, res) => {
  const { NombreArea, CodigoIdentificacion, TipoArea, Descripcion } = req.body;
  if (!NombreArea || !CodigoIdentificacion || !TipoArea) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }
  const area = await areaService.createArea({ NombreArea, CodigoIdentificacion, TipoArea, Descripcion });
  res.status(201).json(area);
});

// PUT /api/areas/:id
router.put('/:id', requireAdmin, async (req, res) => {
  const { NombreArea, CodigoIdentificacion, TipoArea, Descripcion, IsActive } = req.body;
  const area = await areaService.updateArea(req.params.id, { NombreArea, CodigoIdentificacion, TipoArea, Descripcion, IsActive });
  res.json(area);
});

// DELETE /api/areas/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  await areaService.deleteArea(req.params.id);
  res.json({ message: 'Área eliminada correctamente.' });
});

module.exports = router; 