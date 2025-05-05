const pool = require('../db');

class UsuarioLogModel {
  static async getLogs({ usuarioId, tipoEvento, fechaInicio, fechaFin, page = 1, pageSize = 20 }) {
    let query = 'SELECT * FROM UsuarioLog WHERE 1=1';
    const params = [];
    if (usuarioId) {
      query += ' AND IDUsuario = ?';
      params.push(usuarioId);
    }
    if (tipoEvento) {
      query += ' AND TipoEvento = ?';
      params.push(tipoEvento);
    }
    if (fechaInicio) {
      query += ' AND FechaEvento >= ?';
      params.push(fechaInicio);
    }
    if (fechaFin) {
      query += ' AND FechaEvento <= ?';
      params.push(fechaFin);
    }
    query += ' ORDER BY FechaEvento DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async insertLog({ IDUsuario, TipoEvento, IPOrigen, Exitoso = true, ipInfo = {} }) {
    // Desestructurar los campos de ipInfo
    const {
      IPCountry = null, IPCountryCode = null, IPRegion = null, IPRegionName = null, IPCity = null, IPZip = null, IPLat = null, IPLon = null, IPTimezone = null, IPISP = null, IPOrg = null, IPAs = null, IPHostname = null, IPIsProxy = null, IPIsVPN = null, IPIsTor = null, DispositivoInfo = null
    } = ipInfo;
    const params = [
      IDUsuario, TipoEvento, IPOrigen, IPCountry, IPCountryCode, IPRegion, IPRegionName, IPCity, IPZip, IPLat, IPLon, IPTimezone, IPISP, IPOrg, IPAs, IPHostname, IPIsProxy, IPIsVPN, IPIsTor, DispositivoInfo, Exitoso
    ];
    console.log('INSERTANDO LOG USUARIO:', params);
    const query = `INSERT INTO UsuarioLog (
      IDUsuario, TipoEvento, IPOrigen, IPCountry, IPCountryCode, IPRegion, IPRegionName, IPCity, IPZip, IPLat, IPLon, IPTimezone, IPISP, IPOrg, IPAs, IPHostname, IPIsProxy, IPIsVPN, IPIsTor, DispositivoInfo, FechaEvento, Exitoso
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`;
    await pool.query(query, params);
  }
}

module.exports = UsuarioLogModel; 