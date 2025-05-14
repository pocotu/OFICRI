const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const jwt = require('jsonwebtoken');
const auditService = require('../services/auditService');
const axios = require('axios');
const ClientIpExtractor = require('../utils/ClientIpExtractor');

async function getIpInfo(ip) {
  try {
    const response = await axios.get(`https://ipinfo.io/${ip}?token=fefd3059c78c94`);
    const data = response.data;
    const mapped = {
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
    console.log('IPINFO DATA:', data);
    console.log('IPINFO MAPPED:', mapped);
    return mapped;
  } catch (e) {
    console.error('Error obteniendo info de IP:', e);
    return {};
  }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { cip, password } = req.body;
  const result = await userService.loginUser(cip, password);
  let user = null;
  if (!result.error) user = result.user;
  
  // Obtener info enriquecida de IP
  let ipInfo = {};
  const clientIp = ClientIpExtractor.getClientIp(req);
  if (clientIp) {
    ipInfo = await getIpInfo(clientIp);
  } else {
    ipInfo = {
      IPCountry: 'Local/Desconocido',
      IPCountryCode: 'XX',
      IPRegion: 'Local',
      IPRegionName: 'Local',
      IPCity: 'Local',
      IPZip: null,
      IPLat: null,
      IPLon: null,
      IPTimezone: null,
      IPISP: null,
      IPOrg: null,
      IPAs: null,
      IPHostname: null,
      IPIsProxy: null,
      IPIsVPN: null,
      IPIsTor: null,
      DispositivoInfo: null
    };
  }
  // Solo registrar log si el login fue exitoso
  if (!result.error && user) {
    try {
      await auditService.logUsuario({
        IDUsuario: user.IDUsuario,
        TipoEvento: 'LOGIN',
        IPOrigen: clientIp || 'localhost',
        Exitoso: true,
        ipInfo
      });
    } catch (error) {
      console.error('Error al registrar log de login:', error);
      // No interrumpir el flujo por un error en el log
    }
  }

  if (result.error) {
    return res.status(401).json({ message: result.error });
  }
  res.json(result);
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  try {
    const user = await userService.getUserFromToken(token);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
});

// GET /api/usuarios
router.get('/usuarios', async (req, res) => {
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

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  try {
    const user = await userService.getUserFromToken(token);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    let ipInfo = {};
    const clientIp = ClientIpExtractor.getClientIp(req);
    if (clientIp) {
      ipInfo = await getIpInfo(clientIp);
    } else {
      ipInfo = {
        IPCountry: 'Local/Desconocido',
        IPCountryCode: 'XX',
        IPRegion: 'Local',
        IPRegionName: 'Local',
        IPCity: 'Local',
        IPZip: null,
        IPLat: null,
        IPLon: null,
        IPTimezone: null,
        IPISP: null,
        IPOrg: null,
        IPAs: null,
        IPHostname: null,
        IPIsProxy: null,
        IPIsVPN: null,
        IPIsTor: null,
        DispositivoInfo: null
      };
    }
    await auditService.logUsuario({
      IDUsuario: user.IDUsuario,
      TipoEvento: 'LOGOUT',
      IPOrigen: clientIp || 'localhost',
      Exitoso: true,
      ipInfo
    });
    res.json({ message: 'Logout registrado' });
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
});

module.exports = router; 