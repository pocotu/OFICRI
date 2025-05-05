const express = require('express');
const router = express.Router();
const documentoService = require('../services/documentoService');
const { getUserFromToken } = require('../services/userService');

// Middleware para validar permisos (bit 0 = crear)
function requireCrearDocumento(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  getUserFromToken(token).then(user => {
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if ((user.Permisos & 1) !== 1) return res.status(403).json({ message: 'No autorizado' });
    req.user = user;
    next();
  });
}

// GET /api/documentos
router.get('/', async (req, res) => {
  const docs = await documentoService.getAllDocumentos();
  res.json(docs);
});

// POST /api/documentos
router.post('/', requireCrearDocumento, async (req, res) => {
  const data = req.body;
  // Validar campos obligatorios
  const required = ['IDMesaPartes', 'IDAreaActual', 'IDUsuarioCreador', 'NroRegistro', 'NumeroOficioDocumento', 'OrigenDocumento', 'Contenido', 'Estado', 'FechaDocumento', 'Procedencia'];
  for (const field of required) {
    if (!data[field]) return res.status(400).json({ message: `Falta el campo ${field}` });
  }
  const doc = await documentoService.createDocumento(data);
  res.status(201).json(doc);
});

module.exports = router; 