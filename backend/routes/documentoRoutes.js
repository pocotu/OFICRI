const express = require('express');
const router = express.Router();
const documentoService = require('../services/documentoService');
const { getUserFromToken } = require('../services/userService');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const permissionService = require('../services/permissionService');
const multer = require('multer');
const path = require('path');

// Middleware para validar permisos (bit 0 = crear)
function requireCrearDocumento(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  getUserFromToken(token).then(user => {
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if ((user.Permisos & 1) !== 1) return res.status(403).json({ message: 'No autorizado' });
    req.user = user;
    next();
  });
}

// Configuración de almacenamiento para archivos adjuntos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// GET /api/documentos (con filtros avanzados y compatibilidad total)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { area, estado, texto, tipo, fechaInicio, fechaFin, page, pageSize } = req.query;
    let sql = 'SELECT * FROM Documento WHERE Estado != "PAPELERA"';
    const params = [];
    if (area) { sql += ' AND IDAreaActual = ?'; params.push(area); }
    if (estado) { sql += ' AND Estado = ?'; params.push(estado); }
    if (tipo) { sql += ' AND OrigenDocumento = ?'; params.push(tipo); }
    if (fechaInicio) { sql += ' AND FechaDocumento >= ?'; params.push(fechaInicio); }
    if (fechaFin) { sql += ' AND FechaDocumento <= ?'; params.push(fechaFin); }
    if (texto) {
      sql += ' AND (' +
        'NroRegistro LIKE ? OR ' +
        'NumeroOficioDocumento LIKE ? OR ' +
        'Procedencia LIKE ? OR ' +
        'Contenido LIKE ?' +
      ')';
      const like = `%${texto}%`;
      params.push(like, like, like, like);
    }
    // Si se envía paginación, aplicar paginación y devolver total
    if (page && pageSize) {
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      sql += ' ORDER BY FechaDocumento DESC LIMIT ? OFFSET ?';
      params.push(parseInt(pageSize), offset);
      const [rows] = await pool.query(sql, params);
      // Total para paginación
      let countSql = 'SELECT COUNT(*) as total FROM Documento WHERE Estado != "PAPELERA"';
      const countParams = [];
      if (area) { countSql += ' AND IDAreaActual = ?'; countParams.push(area); }
      if (estado) { countSql += ' AND Estado = ?'; countParams.push(estado); }
      if (tipo) { countSql += ' AND OrigenDocumento = ?'; countParams.push(tipo); }
      if (fechaInicio) { countSql += ' AND FechaDocumento >= ?'; countParams.push(fechaInicio); }
      if (fechaFin) { countSql += ' AND FechaDocumento <= ?'; countParams.push(fechaFin); }
      if (texto) {
        countSql += ' AND (' +
          'NroRegistro LIKE ? OR ' +
          'NumeroOficioDocumento LIKE ? OR ' +
          'Procedencia LIKE ? OR ' +
          'Contenido LIKE ?' +
        ')';
        const like = `%${texto}%`;
        countParams.push(like, like, like, like);
      }
      const [[{ total }]] = await pool.query(countSql, countParams);
      res.json({ data: rows, total });
    } else {
      // Sin paginación: devolver todos los documentos activos
      sql += ' ORDER BY FechaDocumento DESC';
      const [rows] = await pool.query(sql, params);
      res.json(rows);
    }
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/documentos
router.post('/', authMiddleware, upload.array('archivos'), async (req, res) => {
  try {
    // Verificar si tiene permiso para crear documentos
    const hasPermission = await permissionService.hasPermission(
      req.user.IDUsuario, 
      permissionService.PERMISSION_BITS.CREAR
    );
    if (!hasPermission) {
      await permissionService.logUnauthorizedAccess(
        req.user.IDUsuario,
        'DOCUMENTO',
        0,
        'CREAR',
        req.ip
      );
      return res.status(403).json({ message: 'No tiene permiso para crear documentos' });
    }
    // Extraer campos del formulario (FormData)
    const {
      IDMesaPartes,
      IDAreaActual,
      NroRegistro,
      NumeroOficioDocumento,
      OrigenDocumento,
      Contenido,
      Estado,
      Procedencia,
      Observaciones,
      TipoDocumentoSalida,
      FechaDocumentoSalida
    } = req.body;
    // Validación básica
    if (!IDMesaPartes || !IDAreaActual || !NroRegistro || !NumeroOficioDocumento || !OrigenDocumento || !Contenido) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    // Insertar documento
    const [result] = await pool.query(
      `INSERT INTO Documento (
        IDMesaPartes, 
        IDAreaActual, 
        IDUsuarioCreador, 
        NroRegistro, 
        NumeroOficioDocumento, 
        FechaDocumento, 
        OrigenDocumento, 
        Estado, 
        Contenido,
        Procedencia,
        Observaciones,
        TipoDocumentoSalida,
        FechaDocumentoSalida
      ) VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?)`,
      [
        IDMesaPartes, 
        IDAreaActual, 
        req.user.IDUsuario, 
        NroRegistro, 
        NumeroOficioDocumento, 
        OrigenDocumento, 
        Estado || 'RECIBIDO',
        Contenido,
        Procedencia || '',
        Observaciones || '',
        TipoDocumentoSalida || '',
        FechaDocumentoSalida || null
      ]
    );
    // Guardar archivos adjuntos si existen
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await pool.query(
          `INSERT INTO DocumentoArchivo (IDDocumento, NombreArchivo, RutaArchivo, MimeType, Tamano) VALUES (?, ?, ?, ?, ?)`,
          [result.insertId, file.originalname, file.filename, file.mimetype, file.size]
        );
      }
    }
    // Registrar en el log de documentos
    await pool.query(
      `INSERT INTO DocumentoLog (IDDocumento, IDUsuario, TipoAccion, DetallesAccion, IPOrigen)
       VALUES (?, ?, 'CREAR', 'Documento creado', ?)`,
      [result.insertId, req.user.IDUsuario, req.ip]
    );
    res.status(201).json({ 
      id: result.insertId,
      message: 'Documento creado con éxito' 
    });
  } catch (error) {
    console.error('Error al crear documento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/documentos/:id/trazabilidad
router.get('/:id/trazabilidad', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  const user = await getUserFromToken(token);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  // Aquí podrías agregar lógica de permisos si es necesario
  try {
    const eventos = await documentoService.getTrazabilidadById(req.params.id);
    res.json(eventos);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener trazabilidad', error: err.message });
  }
});

// Actualizar un documento
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const documentoId = req.params.id;
    
    // Verificar si tiene permiso para editar documentos
    const hasPermission = await permissionService.hasPermission(
      req.user.IDUsuario, 
      permissionService.PERMISSION_BITS.EDITAR
    );
    
    if (!hasPermission) {
      // Comprobar permiso contextual
      const hasContextualPermission = await permissionService.hasContextualPermission(
        req.user.IDUsuario,
        'DOCUMENTO',
        documentoId,
        'EDITAR'
      );
      
      if (!hasContextualPermission) {
        // Registrar intento no autorizado
        await permissionService.logUnauthorizedAccess(
          req.user.IDUsuario,
          'DOCUMENTO',
          documentoId,
          'EDITAR',
          req.ip
        );
        
        return res.status(403).json({ message: 'No tiene permiso para editar este documento' });
      }
    }
    
    const { 
      IDAreaActual, 
      NumeroOficioDocumento, 
      Estado, 
      Observaciones,
      Contenido,
      TipoDocumentoSalida,
      FechaDocumentoSalida
    } = req.body;
    
    // Ejecutar la actualización
    await pool.query(
      `UPDATE Documento SET 
        IDAreaActual = ?, 
        NumeroOficioDocumento = ?, 
        Estado = ?, 
        Observaciones = ?,
        Contenido = ?,
        TipoDocumentoSalida = ?,
        FechaDocumentoSalida = ?
       WHERE IDDocumento = ?`,
      [
        IDAreaActual, 
        NumeroOficioDocumento, 
        Estado, 
        Observaciones,
        Contenido,
        TipoDocumentoSalida,
        FechaDocumentoSalida,
        documentoId
      ]
    );
    
    // Registrar en el log de documentos
    await pool.query(
      `INSERT INTO DocumentoLog (IDDocumento, IDUsuario, TipoAccion, DetallesAccion, IPOrigen)
       VALUES (?, ?, 'EDITAR', 'Documento actualizado', ?)`,
      [documentoId, req.user.IDUsuario, req.ip]
    );
    
    res.json({ message: 'Documento actualizado con éxito' });
  } catch (error) {
    console.error('Error al actualizar documento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar un documento (mover a papelera)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const documentoId = req.params.id;
    const userId = req.user.IDUsuario;
    
    // Verificar si el usuario puede eliminar este documento
    const canDelete = await permissionService.canDeleteDocument(userId, documentoId);
    
    if (!canDelete) {
      // Registrar intento no autorizado
      await permissionService.logUnauthorizedAccess(
        userId,
        'DOCUMENTO',
        documentoId,
        'ELIMINAR',
        req.ip
      );
      
      return res.status(403).json({ 
        message: 'No tiene permiso para eliminar este documento',
        details: 'Solo puede eliminar documentos de su autoría o área según su rol' 
      });
    }
    
    // Mover a papelera en lugar de eliminar definitivamente
    await pool.query(
      `UPDATE Documento SET 
        Estado = 'PAPELERA',
        Observaciones = CONCAT(IFNULL(Observaciones, ''), ' | Movido a papelera por usuario ID: ', ?, ' en ', NOW())
       WHERE IDDocumento = ?`,
      [userId, documentoId]
    );
    
    // Registrar en el log de documentos
    await pool.query(
      `INSERT INTO DocumentoLog (IDDocumento, IDUsuario, TipoAccion, DetallesAccion, IPOrigen)
       VALUES (?, ?, 'MOVER_PAPELERA', 'Documento movido a papelera', ?)`,
      [documentoId, userId, req.ip]
    );
    
    res.json({ message: 'Documento movido a papelera con éxito' });
  } catch (error) {
    console.error('Error al mover documento a papelera:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Papelera de documentos
router.get('/papelera/listar', authMiddleware, async (req, res) => {
  try {
    // Verificar si tiene permiso para ver documentos
    const hasPermission = await permissionService.hasPermission(
      req.user.IDUsuario, 
      permissionService.PERMISSION_BITS.VER
    );
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'No tiene permiso para ver la papelera' });
    }
    
    const [rows] = await pool.query('SELECT * FROM Documento WHERE Estado = "PAPELERA"');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener papelera:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Restaurar documento de papelera
router.post('/papelera/restaurar/:id', authMiddleware, async (req, res) => {
  try {
    const documentoId = req.params.id;
    const userId = req.user.IDUsuario;
    
    // Verificar si tiene permiso para editar documentos
    const hasPermission = await permissionService.hasPermission(
      userId, 
      permissionService.PERMISSION_BITS.EDITAR
    );
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'No tiene permiso para restaurar documentos' });
    }
    
    await pool.query(
      `UPDATE Documento SET 
        Estado = 'ACTIVO',
        Observaciones = CONCAT(IFNULL(Observaciones, ''), ' | Restaurado de papelera por usuario ID: ', ?, ' en ', NOW())
       WHERE IDDocumento = ? AND Estado = 'PAPELERA'`,
      [userId, documentoId]
    );
    
    // Registrar en el log de documentos
    await pool.query(
      `INSERT INTO DocumentoLog (IDDocumento, IDUsuario, TipoAccion, DetallesAccion, IPOrigen)
       VALUES (?, ?, 'RESTAURAR_PAPELERA', 'Documento restaurado de papelera', ?)`,
      [documentoId, userId, req.ip]
    );
    
    res.json({ message: 'Documento restaurado con éxito' });
  } catch (error) {
    console.error('Error al restaurar documento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar documento permanentemente (solo administradores)
router.delete('/papelera/eliminar/:id', authMiddleware, async (req, res) => {
  try {
    const documentoId = req.params.id;
    const userId = req.user.IDUsuario;
    
    // Verificar si es administrador
    const isAdmin = await permissionService.hasPermission(
      userId, 
      permissionService.PERMISSION_BITS.ADMIN
    );
    
    if (!isAdmin) {
      // Registrar intento no autorizado
      await permissionService.logUnauthorizedAccess(
        userId,
        'DOCUMENTO',
        documentoId,
        'ELIMINAR_PERMANENTE',
        req.ip
      );
      
      return res.status(403).json({ 
        message: 'No tiene permiso para eliminar permanentemente documentos',
        details: 'Esta acción está reservada para administradores' 
      });
    }
    
    // Verificar que el documento esté en papelera
    const [documentoRows] = await pool.query(
      'SELECT Estado FROM Documento WHERE IDDocumento = ?',
      [documentoId]
    );
    
    if (documentoRows.length === 0) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }
    
    if (documentoRows[0].Estado !== 'PAPELERA') {
      return res.status(400).json({ 
        message: 'El documento debe estar en papelera para eliminarlo permanentemente',
        details: 'Primero mueva el documento a la papelera'
      });
    }
    
    // Eliminar los logs del documento excepto el de eliminación permanente
    await pool.query(
      `INSERT INTO DocumentoLog (IDDocumento, IDUsuario, TipoAccion, DetallesAccion, IPOrigen)
       VALUES (?, ?, 'ELIMINAR_PERMANENTE', 'Documento eliminado permanentemente', ?)`,
      [documentoId, userId, req.ip]
    );
    
    // Eliminar el documento
    await pool.query('DELETE FROM Documento WHERE IDDocumento = ?', [documentoId]);
    
    res.json({ message: 'Documento eliminado permanentemente' });
  } catch (error) {
    console.error('Error al eliminar permanentemente documento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DERIVAR DOCUMENTO
router.post('/:id/derivar', authMiddleware, async (req, res) => {
  try {
    const documentoId = parseInt(req.params.id)
    const userId = req.user.IDUsuario
    const { IDAreaDestino, Observacion } = req.body
    if (!IDAreaDestino) return res.status(400).json({ message: 'Área destino requerida' })
    // Verificar permisos (bitwise DERIVAR o contextual)
    const canDerivar = await permissionService.hasPermission(userId, permissionService.PERMISSION_BITS.DERIVAR)
    let canDerivarContextual = false
    if (!canDerivar) {
      canDerivarContextual = await permissionService.hasContextualPermission(userId, 'DOCUMENTO', documentoId, 'DERIVAR')
      if (!canDerivarContextual) {
        await permissionService.logUnauthorizedAccess(userId, 'DOCUMENTO', documentoId, 'DERIVAR', req.ip)
        return res.status(403).json({ message: 'No tiene permiso para derivar este documento' })
      }
    }
    // Obtener datos actuales del documento
    const [[doc]] = await pool.query('SELECT * FROM Documento WHERE IDDocumento = ?', [documentoId])
    if (!doc) return res.status(404).json({ message: 'Documento no encontrado' })
    // Insertar en Derivacion
    await pool.query(
      `INSERT INTO Derivacion (IDDocumento, IDMesaPartes, IDAreaOrigen, IDAreaDestino, IDUsuarioDeriva, EstadoDerivacion, Observacion)
       VALUES (?, ?, ?, ?, ?, 'PENDIENTE', ?)`,
      [documentoId, doc.IDMesaPartes, doc.IDAreaActual, IDAreaDestino, userId, Observacion || '']
    )
    // Actualizar Documento (área actual y estado)
    await pool.query(
      `UPDATE Documento SET IDAreaActual = ?, Estado = 'DERIVADO' WHERE IDDocumento = ?`,
      [IDAreaDestino, documentoId]
    )
    // Registrar en DocumentoLog
    await pool.query(
      `INSERT INTO DocumentoLog (IDDocumento, IDUsuario, TipoAccion, DetallesAccion, IPOrigen)
       VALUES (?, ?, 'DERIVAR', ?, ?)`,
      [documentoId, userId, `Derivado a área ID ${IDAreaDestino}. ${Observacion || ''}`, req.ip]
    )
    // Registrar en DerivacionLog
    const [[{ IDDerivacion }]] = await pool.query('SELECT MAX(IDDerivacion) AS IDDerivacion FROM Derivacion WHERE IDDocumento = ?', [documentoId])
    await pool.query(
      `INSERT INTO DerivacionLog (IDDerivacion, IDUsuario, TipoEvento, Detalles, FechaEvento)
       VALUES (?, ?, 'DERIVAR', ?, NOW())`,
      [IDDerivacion, userId, Observacion || '']
    )
    res.json({ message: 'Documento derivado con éxito' })
  } catch (error) {
    console.error('Error al derivar documento:', error)
    res.status(500).json({ message: 'Error interno al derivar documento' })
  }
})

module.exports = router; 