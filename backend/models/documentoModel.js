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
  // 1. Evento de creación
  const [docRows] = await pool.query(
    `SELECT d.FechaDocumento, d.NroRegistro, d.IDUsuarioCreador, u.Nombres AS UsuarioCreador, a.NombreArea AS AreaCreador
     FROM Documento d
     JOIN Usuario u ON d.IDUsuarioCreador = u.IDUsuario
     JOIN AreaEspecializada a ON d.IDAreaActual = a.IDArea
     WHERE d.IDDocumento = ?`, [id]
  );
  const eventos = [];
  if (docRows.length) {
    eventos.push({
      tipo: 'creacion',
      titulo: 'Documento creado',
      detalle: `Documento registrado con Nro ${docRows[0].NroRegistro}.`,
      fecha: docRows[0].FechaDocumento,
      area: docRows[0].AreaCreador,
      usuario: docRows[0].UsuarioCreador
    });
  }

  // 2. Derivaciones
  const [derivaciones] = await pool.query(
    `SELECT d.FechaDerivacion AS fecha, ao.NombreArea AS areaOrigen, ad.NombreArea AS areaDestino, u.Nombres AS usuario
     FROM Derivacion d
     JOIN AreaEspecializada ao ON d.IDAreaOrigen = ao.IDArea
     JOIN AreaEspecializada ad ON d.IDAreaDestino = ad.IDArea
     JOIN Usuario u ON d.IDUsuarioDeriva = u.IDUsuario
     WHERE d.IDDocumento = ?
     ORDER BY d.FechaDerivacion ASC`, [id]
  );
  derivaciones.forEach(der => {
    eventos.push({
      tipo: 'derivacion',
      titulo: 'Derivación',
      detalle: `Derivado de ${der.areaOrigen} a ${der.areaDestino}.`,
      fecha: der.fecha,
      area: der.areaDestino,
      usuario: der.usuario
    });
  });

  // 3. Cambios de estado
  const [estados] = await pool.query(
    `SELECT FechaCambio AS fecha, EstadoAnterior, EstadoNuevo, u.Nombres AS usuario, a.NombreArea AS area
     FROM DocumentoEstado de
     JOIN Usuario u ON de.IDUsuario = u.IDUsuario
     JOIN Documento d ON de.IDDocumento = d.IDDocumento
     JOIN AreaEspecializada a ON d.IDAreaActual = a.IDArea
     WHERE de.IDDocumento = ?
     ORDER BY FechaCambio ASC`, [id]
  );
  estados.forEach(est => {
    eventos.push({
      tipo: 'estado',
      titulo: 'Cambio de Estado',
      detalle: `De "${est.EstadoAnterior}" a "${est.EstadoNuevo}".`,
      fecha: est.fecha,
      area: est.area,
      usuario: est.usuario
    });
  });

  // 4. Logs
  const [logs] = await pool.query(
    `SELECT FechaEvento AS fecha, TipoAccion, DetallesAccion, u.Nombres AS usuario, a.NombreArea AS area
     FROM DocumentoLog l
     JOIN Usuario u ON l.IDUsuario = u.IDUsuario
     JOIN Documento d ON l.IDDocumento = d.IDDocumento
     JOIN AreaEspecializada a ON d.IDAreaActual = a.IDArea
     WHERE l.IDDocumento = ?
     ORDER BY FechaEvento ASC`, [id]
  );
  logs.forEach(log => {
    eventos.push({
      tipo: 'log',
      titulo: log.TipoAccion,
      detalle: log.DetallesAccion,
      fecha: log.fecha,
      area: log.area,
      usuario: log.usuario
    });
  });

  // Ordenar todos los eventos por fecha ascendente
  eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  return eventos;
}

module.exports = {
  getAllDocumentos,
  createDocumento,
  getTrazabilidadById,
}; 