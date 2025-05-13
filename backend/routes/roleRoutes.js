const express = require('express');
const router = express.Router();
const roleService = require('../services/roleService');

// GET /api/roles
router.get('/', async (req, res) => {
  const roles = await roleService.getAllRoles();
  res.json(roles);
});

// GET /api/roles/:id
router.get('/:id', async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);
  if (!role) return res.status(404).json({ message: 'Rol no encontrado' });
  res.json(role);
});

// GET /api/roles/permisos/all
router.get('/permisos/all', async (req, res) => {
  const permisos = await roleService.getAllPermisos();
  res.json(permisos);
});

module.exports = router; 