const pool = require('../db');

/**
 * Servicio de trazabilidad de documentos
 * SRP: Solo gestiona la trazabilidad (registro y consulta de movimientos)
 */
class TraceService {
  /**
   * Registra un movimiento de documento
   * @param {Object} data
   * @param {number} data.documentoId
   * @param {number|null} data.areaOrigenId
   * @param {number|null} data.areaDestinoId
   * @param {number} data.usuarioId
   * @param {string} data.accion
   * @param {string} [data.observacion]
   */
  async registrarMovimiento({ documentoId, areaOrigenId, areaDestinoId, usuarioId, accion, observacion }) {
    await pool.query(
      `INSERT INTO TrazabilidadDocumento (IDDocumento, IDAreaOrigen, IDAreaDestino, IDUsuario, Accion, Observacion, Fecha)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [documentoId, areaOrigenId, areaDestinoId, usuarioId, accion, observacion || null]
    );
  }

  /**
   * Obtiene el historial de movimientos de un documento
   * @param {number} documentoId
   */
  async obtenerHistorial(documentoId) {
    const [rows] = await pool.query(
      `SELECT t.*, ao.NombreArea AS AreaOrigen, ad.NombreArea AS AreaDestino, u.Nombres AS Usuario
       FROM TrazabilidadDocumento t
       LEFT JOIN AreaEspecializada ao ON t.IDAreaOrigen = ao.IDArea
       LEFT JOIN AreaEspecializada ad ON t.IDAreaDestino = ad.IDArea
       JOIN Usuario u ON t.IDUsuario = u.IDUsuario
       WHERE t.IDDocumento = ?
       ORDER BY t.Fecha ASC`,
      [documentoId]
    );
    return rows;
  }
}

module.exports = new TraceService(); 