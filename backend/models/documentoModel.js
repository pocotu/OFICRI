const pool = require('../db');

async function getAllDocumentos() {
  const [rows] = await pool.query(`
    SELECT d.*, e.NombreEstado AS EstadoNombre
    FROM Documento d
    LEFT JOIN EstadoDocumento e ON d.IDEstado = e.IDEstado
  `);
  return rows;
}

async function createDocumento(data) {
  const {
    IDMesaPartes, IDAreaActual, IDUsuarioCreador, NroRegistro, NumeroOficioDocumento,
    OrigenDocumento, Contenido, Estado, FechaDocumento, Procedencia,
    TipoDocumentoSalida, FechaDocumentoSalida, Observaciones
  } = data;

  // Buscar el IDEstado correspondiente al nombre recibido
  const [estadoRow] = await pool.query(
    'SELECT IDEstado FROM EstadoDocumento WHERE NombreEstado = ?',
    [Estado]
  );
  if (!estadoRow.length) throw new Error('Estado no válido');
  const IDEstado = estadoRow[0].IDEstado;

  const [result] = await pool.query(
    `INSERT INTO Documento (
      IDMesaPartes, IDAreaActual, IDUsuarioCreador, NroRegistro, NumeroOficioDocumento,
      OrigenDocumento, Contenido, IDEstado, FechaDocumento, Procedencia,
      TipoDocumentoSalida, FechaDocumentoSalida, Observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [IDMesaPartes, IDAreaActual, IDUsuarioCreador, NroRegistro, NumeroOficioDocumento,
      OrigenDocumento, Contenido, IDEstado, FechaDocumento, Procedencia,
      TipoDocumentoSalida, FechaDocumentoSalida, Observaciones]
  );
  return { IDDocumento: result.insertId, ...data, IDEstado };
}

module.exports = {
  getAllDocumentos,
  createDocumento,
}; 