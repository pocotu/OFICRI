const pool = require('../db');

async function createDosaje(data) {
  const [result] = await pool.query(
    `INSERT INTO Dosaje (
      IDArea, NumeroRegistro, FechaIngreso, OficioDoc, NumeroOficio, TipoDosaje,
      Nombres, Apellidos, DocumentoIdentidad, Procedencia,
      ResultadoCualitativo, ResultadoCuantitativo, UnidadMedida, MetodoAnalisis,
      DocSalidaNroInforme, DocSalidaFecha, Responsable, Observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.IDArea, data.NumeroRegistro, data.FechaIngreso, data.OficioDoc, data.NumeroOficio, data.TipoDosaje,
      data.Nombres, data.Apellidos, data.DocumentoIdentidad, data.Procedencia,
      data.ResultadoCualitativo, data.ResultadoCuantitativo, data.UnidadMedida, data.MetodoAnalisis,
      data.DocSalidaNroInforme, data.DocSalidaFecha, data.Responsable, data.Observaciones
    ]
  );
  return { IDDosaje: result.insertId, ...data };
}

async function getAllDosajes() {
  const [rows] = await pool.query('SELECT * FROM Dosaje');
  return rows;
}

module.exports = {
  createDosaje,
  getAllDosajes,
}; 