const userService = require('../services/userService');

module.exports = async function permisoAuditoria(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  try {
    const user = await userService.getUserFromToken(token);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    const permisos = user.Permisos || 0;
    if ((permisos & 32) === 32 || (permisos & 128) === 128) {
      req.user = user;
      return next();
    }
    return res.status(403).json({ message: 'No autorizado para auditoría' });
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}; 