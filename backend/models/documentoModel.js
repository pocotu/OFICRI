const pool = require('../db');

async function getAllDocumentos() {
  const [rows] = await pool.query('SELECT * FROM Documento');
  return rows;
}

async function createDocumento(data) {
  const {
    IDMesaPartes, IDAreaActual, IDUsuarioCreador, NroRegistro, NumeroOficioDocumento,
    OrigenDocumento, Contenido, Estado, FechaDocumento, Procedencia,
    TipoDocumentoSalida, FechaDocumentoSalida, Observaciones
  } = data;
  const [result] = await pool.query(
    `INSERT INTO Documento (
      IDMesaPartes, IDAreaActual, IDUsuarioCreador, NroRegistro, NumeroOficioDocumento,
      OrigenDocumento, Contenido, Estado, FechaDocumento, Procedencia,
      TipoDocumentoSalida, FechaDocumentoSalida, Observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [IDMesaPartes, IDAreaActual, IDUsuarioCreador, NroRegistro, NumeroOficioDocumento,
      OrigenDocumento, Contenido, Estado, FechaDocumento, Procedencia,
      TipoDocumentoSalida, FechaDocumentoSalida, Observaciones]
  );
  return { IDDocumento: result.insertId, ...data };
}

module.exports = {
  getAllDocumentos,
  createDocumento,
}; 