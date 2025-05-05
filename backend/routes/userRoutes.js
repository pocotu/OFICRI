const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const auditService = require('../services/auditService');
const axios = require('axios');

async function getIpInfo(ip) {
  try {
    const response = await axios.get(`https://ipinfo.io/${ip}?token=fefd3059c78c94`);
    const data = response.data;
    return {
      IPCountry: data.country || null,
      IPCountryCode: data.country || null,
      IPRegion: data.region || null,
      IPRegionName: data.region || null,
      IPCity: data.city || null,
      IPZip: data.postal || null,
      IPLat: data.loc ? data.loc.split(',')[0] : null,
      IPLon: data.loc ? data.loc.split(',')[1] : null,
      IPTimezone: data.timezone || null,
      IPISP: data.org || null,
      IPOrg: data.org || null,
      IPAs: null,
      IPHostname: data.hostname || null,
      IPIsProxy: null,
      IPIsVPN: null,
      IPIsTor: null,
      DispositivoInfo: null
    };
  } catch {
    return {};
  }
}

function getClientIp(req) {
  const ip = req.ip || req.connection?.remoteAddress || '';
  if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
    // IP pública de ejemplo para desarrollo
    return '8.8.8.8';
  }
  // Quitar prefijo IPv6 si existe
  return ip.replace('::ffff:', '');
}

// GET /api/usuarios
router.get('/', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  try {
    const user = await userService.getUserFromToken(token);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if ((user.Permisos & 128) !== 128) return res.status(403).json({ message: 'No autorizado' });
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
});

// POST /api/usuarios
router.post('/', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  try {
    const user = await userService.getUserFromToken(token);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if ((user.Permisos & 128) !== 128) return res.status(403).json({ message: 'No autorizado' });
    const { cip, nombres, apellidos, grado, idArea, idRol, password } = req.body;
    if (!cip || !nombres || !apellidos || !grado || !idArea || !idRol || !password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    const newUserId = await userService.createUser({ cip, nombres, apellidos, grado, password, idArea, idRol });
    // Log de auditoría enriquecido
    let ipInfo = {};
    const clientIp = getClientIp(req);
    ipInfo = await getIpInfo(clientIp);
    await auditService.logUsuario({
      IDUsuario: user.IDUsuario,
      TipoEvento: 'CREAR_USUARIO',
      IPOrigen: clientIp,
      Exitoso: true,
      ipInfo
    });
    res.status(201).json({ message: 'Usuario creado', id: newUserId });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear usuario', error: err.message });
  }
});

// POST /api/usuarios/:id/reset-password
router.post('/:id/reset-password', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  try {
    const user = await userService.getUserFromToken(token);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if ((user.Permisos & 128) !== 128) return res.status(403).json({ message: 'No autorizado' });

    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña es obligatoria y debe tener al menos 6 caracteres.' });
    }
    await userService.setPassword(id, newPassword);
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al resetear contraseña', error: err.message });
  }
});

// PATCH /api/usuarios/:id/bloqueo
router.patch('/:id/bloqueo', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  try {
    const user = await userService.getUserFromToken(token);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if ((user.Permisos & 128) !== 128) return res.status(403).json({ message: 'No autorizado' });
    const id = req.params.id;
    const { bloquear } = req.body;
    if (user.IDUsuario == id) return res.status(400).json({ message: 'No puedes bloquearte a ti mismo.' });
    await userService.setBloqueoUsuario(id, bloquear);
    // Log de auditoría enriquecido
    let ipInfo = {};
    const clientIp = getClientIp(req);
    ipInfo = await getIpInfo(clientIp);
    await auditService.logUsuario({
      IDUsuario: user.IDUsuario,
      TipoEvento: bloquear ? 'BLOQUEAR_USUARIO' : 'DESBLOQUEAR_USUARIO',
      IPOrigen: clientIp,
      Exitoso: true,
      ipInfo
    });
    res.json({ message: bloquear ? 'Usuario bloqueado' : 'Usuario habilitado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al cambiar el estado de bloqueo', error: err.message });
  }
});

// DELETE /api/usuarios/:id
router.delete('/:id', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  try {
    const user = await userService.getUserFromToken(token);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if ((user.Permisos & 128) !== 128) return res.status(403).json({ message: 'No autorizado' });
    const id = req.params.id;
    if (user.IDUsuario == id) return res.status(400).json({ message: 'No puedes eliminarte a ti mismo.' });
    await userService.deleteUser(id);
    // Log de auditoría enriquecido
    let ipInfo = {};
    const clientIp = getClientIp(req);
    ipInfo = await getIpInfo(clientIp);
    await auditService.logUsuario({
      IDUsuario: user.IDUsuario,
      TipoEvento: 'ELIMINAR_USUARIO',
      IPOrigen: clientIp,
      Exitoso: true,
      ipInfo
    });
    res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: err.message });
  }
});

module.exports = router; 