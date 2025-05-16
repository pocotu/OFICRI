const pool = require('../db');

async function getAllDocumentos() {
  const [rows] = await pool.query(`
    SELECT d.*, d.Estado AS EstadoNombre
    FROM Documento d
  `);
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

async function getTrazabilidadById(id) {
  const [rows] = await pool.query(
    `SELECT 
        t.Fecha, 
        t.Accion, 
        t.Observacion, 
        ao.NombreArea AS AreaOrigen, 
        ad.NombreArea AS AreaDestino, 
        u.Nombres AS Usuario
     FROM TrazabilidadDocumento t
     LEFT JOIN AreaEspecializada ao ON t.IDAreaOrigen = ao.IDArea
     LEFT JOIN AreaEspecializada ad ON t.IDAreaDestino = ad.IDArea
     JOIN Usuario u ON t.IDUsuario = u.IDUsuario
     WHERE t.IDDocumento = ?
     ORDER BY t.Fecha ASC`,
    [id]
  );
  return rows;
}

module.exports = {
  getAllDocumentos,
  createDocumento,
  getTrazabilidadById,
}; 