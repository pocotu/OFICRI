const pool = require('../db');

class ExportacionLogService {
  static async logExportacion({ IDUsuario, TipoDatoExportado, NombreArchivo, FechaInicio, FechaFin }) {
    await pool.query(
      `INSERT INTO ExportacionLog (IDUsuario, TipoDatoExportado, NombreArchivo, FechaInicio, FechaFin)
       VALUES (?, ?, ?, ?, ?)`,
      [IDUsuario, TipoDatoExportado, NombreArchivo, FechaInicio, FechaFin]
    );
  }
}

module.exports = ExportacionLogService; 