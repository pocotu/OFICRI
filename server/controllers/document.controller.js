/**
 * Document Controller
 * Handles document-related operations
 * ISO/IEC 27001 compliant implementation
 */

const db = require('../config/database');
const { logger, logSecurityEvent } = require('../utils/logger');

/**
 * Get all documents with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllDocuments = async (req, res) => {
  try {
    // Extract query parameters
    const { 
      page = 1, 
      limit = 10, 
      estado, 
      origen, 
      area,
      fechaInicio,
      fechaFin,
      searchTerm 
    } = req.query;
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build base query
    let query = `
      SELECT 
        d.IDDocumento, 
        d.NroRegistro, 
        d.NumeroOficioDocumento,
        d.FechaDocumento, 
        d.FechaRegistro,
        d.OrigenDocumento, 
        d.Estado, 
        d.Procedencia,
        a.NombreArea AS AreaActual,
        CONCAT(u.Nombres, ' ', u.Apellidos) AS UsuarioCreador
      FROM Documento d
      LEFT JOIN AreaEspecializada a ON d.IDAreaActual = a.IDArea
      LEFT JOIN Usuario u ON d.IDUsuarioCreador = u.IDUsuario
      WHERE 1=1
    `;
    
    // Build count query
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM Documento d
      WHERE 1=1
    `;
    
    // Array to hold query parameters
    const queryParams = [];
    
    // Add filters if provided
    if (estado) {
      query += ` AND d.Estado = ?`;
      countQuery += ` AND d.Estado = ?`;
      queryParams.push(estado);
    }
    
    if (origen) {
      query += ` AND d.OrigenDocumento = ?`;
      countQuery += ` AND d.OrigenDocumento = ?`;
      queryParams.push(origen);
    }
    
    if (area) {
      query += ` AND d.IDAreaActual = ?`;
      countQuery += ` AND d.IDAreaActual = ?`;
      queryParams.push(area);
    }
    
    if (fechaInicio) {
      query += ` AND d.FechaDocumento >= ?`;
      countQuery += ` AND d.FechaDocumento >= ?`;
      queryParams.push(fechaInicio);
    }
    
    if (fechaFin) {
      query += ` AND d.FechaDocumento <= ?`;
      countQuery += ` AND d.FechaDocumento <= ?`;
      queryParams.push(fechaFin);
    }
    
    if (searchTerm) {
      query += ` AND (
        d.NroRegistro LIKE ? OR 
        d.NumeroOficioDocumento LIKE ? OR 
        d.Procedencia LIKE ? OR
        d.Contenido LIKE ?
      )`;
      countQuery += ` AND (
        d.NroRegistro LIKE ? OR 
        d.NumeroOficioDocumento LIKE ? OR 
        d.Procedencia LIKE ? OR
        d.Contenido LIKE ?
      )`;
      const searchPattern = `%${searchTerm}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    // Add pagination
    query += ` ORDER BY d.FechaRegistro DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), offset);
    
    // Execute queries (main query and count query)
    const [documents, countResults] = await Promise.all([
      db.executeQuery(query, queryParams),
      db.executeQuery(countQuery, queryParams.slice(0, -2)) // Remove limit and offset params
    ]);
    
    // Get total count
    const totalDocuments = countResults[0].total;
    const totalPages = Math.ceil(totalDocuments / limit);
    
    // Return response
    return res.status(200).json({
      success: true,
      data: {
        documents,
        pagination: {
          total: totalDocuments,
          totalPages,
          currentPage: parseInt(page),
          perPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error al obtener documentos', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener documentos'
    });
  }
};

/**
 * Get document by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de documento no válido'
      });
    }
    
    // Get document with related information
    const query = `
      SELECT 
        d.*, 
        CONCAT(uc.Nombres, ' ', uc.Apellidos) AS NombreCreador,
        a.NombreArea AS AreaActual,
        m.Descripcion AS MesaPartes
      FROM Documento d
      LEFT JOIN Usuario uc ON d.IDUsuarioCreador = uc.IDUsuario
      LEFT JOIN AreaEspecializada a ON d.IDAreaActual = a.IDArea
      LEFT JOIN MesaPartes m ON d.IDMesaPartes = m.IDMesaPartes
      WHERE d.IDDocumento = ?
    `;
    
    const document = await db.executeQuery(query, [id]);
    
    if (document.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    // Get document attachments
    const attachments = await db.executeQuery(
      'SELECT IDArchivo, NombreArchivo, TipoArchivo, FechaSubida FROM DocumentoArchivo WHERE IDDocumento = ?',
      [id]
    );
    
    // Get document history (derivaciones)
    const derivations = await db.executeQuery(`
      SELECT 
        d.IDDerivacion, 
        d.FechaDerivacion,
        d.Estado,
        ao.NombreArea AS AreaOrigen,
        ad.NombreArea AS AreaDestino,
        CONCAT(u.Nombres, ' ', u.Apellidos) AS UsuarioDerivador,
        d.Observaciones
      FROM Derivacion d
      LEFT JOIN AreaEspecializada ao ON d.IDAreaOrigen = ao.IDArea
      LEFT JOIN AreaEspecializada ad ON d.IDAreaDestino = ad.IDArea
      LEFT JOIN Usuario u ON d.IDUsuarioDerivador = u.IDUsuario
      WHERE d.IDDocumento = ?
      ORDER BY d.FechaDerivacion DESC
    `, [id]);
    
    // Add attachments and derivations to document
    document[0].attachments = attachments;
    document[0].derivations = derivations;
    
    // Log document access
    logSecurityEvent('DOCUMENT_ACCESS', {
      documentId: id,
      userId: req.user.id,
      action: 'VIEW'
    });
    
    return res.status(200).json({
      success: true,
      data: document[0]
    });
  } catch (error) {
    logger.error('Error al obtener documento', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener documento'
    });
  }
};

/**
 * Create new document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createDocument = async (req, res) => {
  try {
    const {
      mesaPartesId,
      areaActualId,
      nroRegistro,
      numeroOficioDocumento,
      fechaDocumento,
      origenDocumento,
      procedencia,
      contenido,
      observaciones,
      prioridad
    } = req.body;
    
    // Validate required fields
    if (!mesaPartesId || !areaActualId || !nroRegistro || !numeroOficioDocumento || !fechaDocumento || !origenDocumento) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos. Todos los campos obligatorios deben ser completados'
      });
    }
    
    // Check if document with same registration number already exists
    const existingDoc = await db.executeQuery(
      'SELECT IDDocumento FROM Documento WHERE NroRegistro = ?',
      [nroRegistro]
    );
    
    if (existingDoc.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un documento con el mismo número de registro'
      });
    }
    
    // Get user from request (set by auth middleware)
    const usuarioCreadorId = req.user.id;
    
    // Insert document
    const result = await db.executeQuery(
      `INSERT INTO Documento (
        IDMesaPartes, IDAreaActual, IDUsuarioCreador,
        NroRegistro, NumeroOficioDocumento, FechaDocumento,
        OrigenDocumento, Estado, Observaciones,
        Procedencia, Contenido, Prioridad
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mesaPartesId,
        areaActualId,
        usuarioCreadorId,
        nroRegistro,
        numeroOficioDocumento,
        fechaDocumento,
        origenDocumento,
        'REGISTRADO', // Estado inicial
        observaciones || '',
        procedencia || '',
        contenido || '',
        prioridad || 'NORMAL'
      ]
    );
    
    if (!result.insertId) {
      throw new Error('Error al insertar documento');
    }
    
    // Log document creation
    logSecurityEvent('DOCUMENT_CREATED', {
      documentId: result.insertId,
      userId: usuarioCreadorId,
      nroRegistro
    });
    
    return res.status(201).json({
      success: true,
      message: 'Documento creado exitosamente',
      data: {
        id: result.insertId,
        nroRegistro
      }
    });
  } catch (error) {
    logger.error('Error al crear documento', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al crear documento'
    });
  }
};

/**
 * Update document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      numeroOficioDocumento,
      fechaDocumento,
      origenDocumento,
      procedencia,
      contenido,
      observaciones,
      prioridad
    } = req.body;
    
    // Get document to check if it exists
    const document = await db.executeQuery(
      'SELECT Estado FROM Documento WHERE IDDocumento = ?',
      [id]
    );
    
    if (document.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    // Verify if document can be updated (only in certain states)
    const allowedStates = ['REGISTRADO', 'EN_PROCESO', 'OBSERVADO'];
    if (!allowedStates.includes(document[0].Estado)) {
      return res.status(403).json({
        success: false,
        message: `No se puede actualizar un documento en estado ${document[0].Estado}`
      });
    }
    
    // Update document
    const result = await db.executeQuery(
      `UPDATE Documento SET
        NumeroOficioDocumento = ?,
        FechaDocumento = ?,
        OrigenDocumento = ?,
        Procedencia = ?,
        Contenido = ?,
        Observaciones = ?,
        Prioridad = ?,
        FechaActualizacion = CURRENT_TIMESTAMP
      WHERE IDDocumento = ?`,
      [
        numeroOficioDocumento,
        fechaDocumento,
        origenDocumento,
        procedencia || '',
        contenido || '',
        observaciones || '',
        prioridad || 'NORMAL',
        id
      ]
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Error al actualizar documento');
    }
    
    // Log document update
    logSecurityEvent('DOCUMENT_UPDATED', {
      documentId: id,
      userId: req.user.id
    });
    
    return res.status(200).json({
      success: true,
      message: 'Documento actualizado exitosamente'
    });
  } catch (error) {
    logger.error('Error al actualizar documento', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar documento'
    });
  }
};

/**
 * Update document status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones, idUsuarioAsignado } = req.body;
    
    // Valid states for a document
    const validStates = ['REGISTRADO', 'EN_PROCESO', 'OBSERVADO', 'FINALIZADO', 'ARCHIVADO', 'CANCELADO'];
    
    if (!estado || !validStates.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }
    
    // Get document to check if it exists
    const document = await db.executeQuery(
      'SELECT Estado FROM Documento WHERE IDDocumento = ?',
      [id]
    );
    
    if (document.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    // Update document status
    const updateQuery = `
      UPDATE Documento SET
        Estado = ?,
        Observaciones = ?,
        ${idUsuarioAsignado ? 'IDUsuarioAsignado = ?,' : ''}
        FechaActualizacion = CURRENT_TIMESTAMP
      WHERE IDDocumento = ?
    `;
    
    const updateParams = [estado, observaciones || ''];
    if (idUsuarioAsignado) {
      updateParams.push(idUsuarioAsignado);
    }
    updateParams.push(id);
    
    const result = await db.executeQuery(updateQuery, updateParams);
    
    if (result.affectedRows === 0) {
      throw new Error('Error al actualizar estado del documento');
    }
    
    // Insert into DocumentoEstado for history tracking
    await db.executeQuery(
      `INSERT INTO DocumentoEstado (
        IDDocumento, EstadoAnterior, EstadoNuevo, 
        Observaciones, IDUsuarioRegistro, FechaRegistro
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        id,
        document[0].Estado,
        estado,
        observaciones || '',
        req.user.id
      ]
    );
    
    // Log status change
    logSecurityEvent('DOCUMENT_STATUS_CHANGE', {
      documentId: id,
      userId: req.user.id,
      newStatus: estado,
      oldStatus: document[0].Estado
    });
    
    return res.status(200).json({
      success: true,
      message: 'Estado del documento actualizado exitosamente'
    });
  } catch (error) {
    logger.error('Error al actualizar estado del documento', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del documento'
    });
  }
};

/**
 * Delete document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Start transaction
    await db.executeQuery('START TRANSACTION');
    
    // Check for document dependencies
    const derivacionesQuery = await db.executeQuery(
      'SELECT COUNT(*) as count FROM Derivacion WHERE IDDocumento = ?',
      [id]
    );
    
    const archivosQuery = await db.executeQuery(
      'SELECT COUNT(*) as count FROM DocumentoArchivo WHERE IDDocumento = ?',
      [id]
    );
    
    // If there are relations, we can't delete the document
    if (derivacionesQuery[0].count > 0) {
      await db.executeQuery('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar el documento porque tiene derivaciones asociadas'
      });
    }
    
    // Delete document files first if they exist
    if (archivosQuery[0].count > 0) {
      await db.executeQuery('DELETE FROM DocumentoArchivo WHERE IDDocumento = ?', [id]);
    }
    
    // Delete document status history
    await db.executeQuery('DELETE FROM DocumentoEstado WHERE IDDocumento = ?', [id]);
    
    // Delete the document
    const result = await db.executeQuery('DELETE FROM Documento WHERE IDDocumento = ?', [id]);
    
    if (result.affectedRows === 0) {
      await db.executeQuery('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    // Commit transaction
    await db.executeQuery('COMMIT');
    
    // Log document deletion
    logSecurityEvent('DOCUMENT_DELETED', {
      documentId: id,
      userId: req.user.id
    });
    
    return res.status(200).json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });
  } catch (error) {
    // Rollback transaction on error
    await db.executeQuery('ROLLBACK');
    
    logger.error('Error al eliminar documento', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar documento'
    });
  }
};

/**
 * Derive document to another area
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deriveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { areaDestinoId, observaciones, urgente, motivo } = req.body;
    
    if (!areaDestinoId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un área de destino'
      });
    }
    
    // Start transaction
    await db.executeQuery('START TRANSACTION');
    
    // Get document info
    const documentQuery = await db.executeQuery(
      'SELECT IDAreaActual, Estado FROM Documento WHERE IDDocumento = ?',
      [id]
    );
    
    if (documentQuery.length === 0) {
      await db.executeQuery('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    const document = documentQuery[0];
    
    // Current area becomes origin area
    const areaOrigenId = document.IDAreaActual;
    
    // Validate areas are different
    if (areaOrigenId === parseInt(areaDestinoId)) {
      await db.executeQuery('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'El área de destino debe ser diferente al área actual'
      });
    }
    
    // Create derivation record
    const derivationResult = await db.executeQuery(
      `INSERT INTO Derivacion (
        IDDocumento, IDAreaOrigen, IDAreaDestino, 
        IDUsuarioDerivador, FechaDerivacion, 
        Estado, Observaciones, Urgente, Motivo
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)`,
      [
        id,
        areaOrigenId,
        areaDestinoId,
        req.user.id,
        'PENDIENTE', // Estado inicial de la derivación
        observaciones || '',
        urgente || false,
        motivo || ''
      ]
    );
    
    // Update document area and status
    await db.executeQuery(
      `UPDATE Documento SET 
        IDAreaActual = ?, 
        Estado = ?,
        Observaciones = ?,
        FechaActualizacion = CURRENT_TIMESTAMP 
      WHERE IDDocumento = ?`,
      [
        areaDestinoId,
        'EN_PROCESO', // New status for derived document
        `Derivado a nueva área: ${observaciones || ''}`,
        id
      ]
    );
    
    // Record status change
    await db.executeQuery(
      `INSERT INTO DocumentoEstado (
        IDDocumento, EstadoAnterior, EstadoNuevo, 
        Observaciones, IDUsuarioRegistro, FechaRegistro
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        id,
        document.Estado,
        'EN_PROCESO',
        `Derivado a nueva área: ${observaciones || ''}`,
        req.user.id
      ]
    );
    
    // Commit transaction
    await db.executeQuery('COMMIT');
    
    // Log derivation
    logSecurityEvent('DOCUMENT_DERIVED', {
      documentId: id,
      userId: req.user.id,
      fromAreaId: areaOrigenId,
      toAreaId: areaDestinoId
    });
    
    return res.status(200).json({
      success: true,
      message: 'Documento derivado exitosamente',
      data: {
        documentoId: id,
        derivacionId: derivationResult.insertId
      }
    });
  } catch (error) {
    // Rollback transaction on error
    await db.executeQuery('ROLLBACK');
    
    logger.error('Error al derivar documento', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al derivar documento'
    });
  }
};

/**
 * Get document history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDocumentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if document exists
    const document = await db.executeQuery(
      'SELECT IDDocumento FROM Documento WHERE IDDocumento = ?',
      [id]
    );
    
    if (document.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    // Get derivations history
    const derivaciones = await db.executeQuery(`
      SELECT 
        d.IDDerivacion, 
        d.FechaDerivacion,
        d.Estado,
        ao.NombreArea AS AreaOrigen,
        ad.NombreArea AS AreaDestino,
        CONCAT(u.Nombres, ' ', u.Apellidos) AS UsuarioDerivador,
        d.Observaciones,
        d.Motivo,
        d.Urgente
      FROM Derivacion d
      LEFT JOIN AreaEspecializada ao ON d.IDAreaOrigen = ao.IDArea
      LEFT JOIN AreaEspecializada ad ON d.IDAreaDestino = ad.IDArea
      LEFT JOIN Usuario u ON d.IDUsuarioDerivador = u.IDUsuario
      WHERE d.IDDocumento = ?
      ORDER BY d.FechaDerivacion DESC
    `, [id]);
    
    // Get status history
    const estados = await db.executeQuery(`
      SELECT 
        de.IDEstado,
        de.EstadoAnterior,
        de.EstadoNuevo,
        de.FechaRegistro,
        de.Observaciones,
        CONCAT(u.Nombres, ' ', u.Apellidos) AS UsuarioRegistro
      FROM DocumentoEstado de
      LEFT JOIN Usuario u ON de.IDUsuarioRegistro = u.IDUsuario
      WHERE de.IDDocumento = ?
      ORDER BY de.FechaRegistro DESC
    `, [id]);
    
    return res.status(200).json({
      success: true,
      data: {
        documentoId: id,
        derivaciones,
        estados
      }
    });
  } catch (error) {
    logger.error('Error al obtener historial del documento', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener historial del documento'
    });
  }
};

/**
 * Upload attachment to a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.uploadAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if document exists
    const document = await db.executeQuery(
      'SELECT IDDocumento FROM Documento WHERE IDDocumento = ?',
      [id]
    );
    
    if (document.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió ningún archivo'
      });
    }
    
    // Get file info
    const { filename, originalname, mimetype, path: filePath, size } = req.file;
    
    // Insert file info into database
    const result = await db.executeQuery(
      `INSERT INTO DocumentoArchivo (
        IDDocumento, NombreArchivo, NombreOriginal, 
        RutaArchivo, TipoArchivo, TamanoArchivo, 
        IDUsuarioSubida, FechaSubida
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        id,
        filename,
        originalname,
        filePath,
        mimetype,
        size,
        req.user.id
      ]
    );
    
    if (!result.insertId) {
      throw new Error('Error al registrar archivo en la base de datos');
    }
    
    // Log file upload
    logSecurityEvent('DOCUMENT_FILE_UPLOADED', {
      documentId: id,
      userId: req.user.id,
      fileId: result.insertId,
      fileName: originalname,
      fileSize: size
    });
    
    return res.status(201).json({
      success: true,
      message: 'Archivo adjunto subido exitosamente',
      data: {
        id: result.insertId,
        filename: originalname,
        type: mimetype,
        size
      }
    });
  } catch (error) {
    logger.error('Error al subir archivo adjunto', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al subir archivo adjunto'
    });
  }
};

/**
 * Download attachment from a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.downloadAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    
    // Get attachment info from database
    const attachments = await db.executeQuery(
      `SELECT da.*, d.Estado
       FROM DocumentoArchivo da
       JOIN Documento d ON da.IDDocumento = d.IDDocumento
       WHERE da.IDArchivo = ? AND da.IDDocumento = ?`,
      [attachmentId, id]
    );
    
    if (attachments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Archivo adjunto no encontrado'
      });
    }
    
    const attachment = attachments[0];
    
    // Check file exists on disk
    const fs = require('fs');
    if (!fs.existsSync(attachment.RutaArchivo)) {
      logger.error('Archivo físico no encontrado', {
        path: attachment.RutaArchivo,
        attachmentId
      });
      
      return res.status(404).json({
        success: false,
        message: 'Archivo físico no encontrado'
      });
    }
    
    // Log download attempt
    logSecurityEvent('DOCUMENT_FILE_DOWNLOAD', {
      documentId: id,
      userId: req.user.id,
      fileId: attachmentId
    });
    
    // Send file to client
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.NombreOriginal)}"`);
    res.setHeader('Content-Type', attachment.TipoArchivo);
    
    return res.sendFile(attachment.RutaArchivo);
  } catch (error) {
    logger.error('Error al descargar archivo adjunto', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al descargar archivo adjunto'
    });
  }
};

module.exports = exports; 