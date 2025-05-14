class ClientIpExtractor {
  static getClientIp(req) {
    // Express maneja X-Forwarded-For si trust proxy está activo
    let ip = req.ip || req.connection?.remoteAddress || '';
    ip = ip.replace('::ffff:', '');
    // Si es localhost, devolver null para distinguir en auditoría
    if (!ip || ip === '::1' || ip === '127.0.0.1') {
      return null;
    }
    return ip;
  }
}

module.exports = ClientIpExtractor; 