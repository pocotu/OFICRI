const pool = require('../db');

async function getAllDocumentos(filtros = {}, user = null) {
  let sql = `SELECT d.*, d.Estado AS EstadoNombre FROM Documento d WHERE 1=1`;
  const params = [];
  // Filtros básicos
  if (filtros.IDAreaActual) {
    sql += ' AND d.IDAreaActual = ?';
    params.push(filtros.IDAreaActual);
  }
  if (filtros.Estado) {
    sql += ' AND d.Estado = ?';
    params.push(filtros.Estado);
  }
  if (filtros.FechaInicio) {
    sql += ' AND d.FechaDocumento >= ?';
    params.push(filtros.FechaInicio);
  }
  if (filtros.FechaFin) {
    sql += ' AND d.FechaDocumento <= ?';
    params.push(filtros.FechaFin);
  }
  // Permiso contextual: si no es admin ni tiene bit de exportar, solo su área
  if (user && user.Permisos && (user.Permisos & 64) !== 64 && (user.Permisos & 128) !== 128) {
    sql += ' AND d.IDAreaActual = ?';
    params.push(user.IDArea);
  }
  sql += ' ORDER BY d.FechaDocumento DESC';
  const [rows] = await pool.query(sql, params);
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

async function addDocumentoArchivo(IDDocumento, file) {
  const { originalname, filename, mimetype, size } = file;
  await pool.query(
    `INSERT INTO DocumentoArchivo (IDDocumento, NombreArchivo, RutaArchivo, MimeType, Tamano) VALUES (?, ?, ?, ?, ?)`,
    [IDDocumento, originalname, filename, mimetype, size]
  );
}

module.exports = {
  getAllDocumentos,
  createDocumento,
  getTrazabilidadById,
  addDocumentoArchivo,
}; 