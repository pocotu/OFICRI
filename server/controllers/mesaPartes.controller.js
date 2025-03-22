/**
 * Mesa de Partes Controller
 * Implementación de manejo de documentos en Mesa de Partes según ISO/IEC 27001
 */

const { pool } = require('../config/database');
const { logger } = require('../utils/logger');
const { generarCodigoExpediente } = require('../utils/document-helpers');
const { storeFile, generateLocalPath } = require('../middleware/file-handler');
const { exportToPdf, exportToExcel } = require('../utils/export-helpers');

/**
 * Listar documentos recibidos por Mesa de Partes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getDocumentosRecibidos = async (req, res) => {
  try {
    const { limit = 10, offset = 0, fechaInicio, fechaFin } = req.query;
    const idAreaMesaPartes = process.env.ID_AREA_MESA_PARTES || 1; // ID del área de Mesa de Partes
    
    let query = `
      SELECT d.id, d.codigo, d.asunto, d.fechaRegistro, d.estado,
             d.prioridad, d.observaciones, d.idAreaDestino, a.nombre as areaDestinoNombre,
             d.fechaActualizacion, d.tipoDocumento
      FROM documentos d
      LEFT JOIN areas a ON d.idAreaDestino = a.id
      WHERE d.idArea = $1 AND d.estado = 'recibido'
    `;
    
    const queryParams = [idAreaMesaPartes];
    let paramCounter = 2;
    
    if (fechaInicio) {
      query += ` AND d.fechaRegistro >= $${paramCounter++}`;
      queryParams.push(fechaInicio);
    }
    
    if (fechaFin) {
      query += ` AND d.fechaRegistro <= $${paramCounter++}`;
      queryParams.push(fechaFin);
    }
    
    query += ` ORDER BY d.fechaRegistro DESC LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
    queryParams.push(limit, offset);
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM documentos d
      WHERE d.idArea = $1 AND d.estado = 'recibido'
      ${fechaInicio ? ` AND d.fechaRegistro >= $2` : ''}
      ${fechaFin ? ` AND d.fechaRegistro <= $${fechaInicio ? 3 : 2}` : ''}
    `;
    
    const countParams = [idAreaMesaPartes];
    if (fechaInicio) countParams.push(fechaInicio);
    if (fechaFin) countParams.push(fechaFin);
    
    const [documents, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams)
    ]);
    
    return res.status(200).json({
      success: true,
      data: documents.rows,
      count: parseInt(countResult.rows[0].total),
      message: 'Documentos recibidos obtenidos correctamente'
    });
  } catch (error) {
    logger.error('Error al obtener documentos recibidos', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener documentos recibidos',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Listar documentos en proceso en Mesa de Partes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getDocumentosEnProceso = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const idAreaMesaPartes = process.env.ID_AREA_MESA_PARTES || 1; // ID del área de Mesa de Partes
    
    const query = `
      SELECT d.id, d.codigo, d.asunto, d.fechaRegistro, d.estado,
             d.prioridad, d.observaciones, d.idAreaDestino, a.nombre as areaDestinoNombre,
             d.fechaActualizacion, d.tipoDocumento
      FROM documentos d
      LEFT JOIN areas a ON d.idAreaDestino = a.id
      WHERE d.idArea = $1 AND d.estado = 'en_proceso'
      ORDER BY 
        CASE 
          WHEN d.prioridad = 'alta' THEN 1
          WHEN d.prioridad = 'media' THEN 2
          WHEN d.prioridad = 'baja' THEN 3
          ELSE 4
        END,
        d.fechaRegistro ASC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM documentos d
      WHERE d.idArea = $1 AND d.estado = 'en_proceso'
    `;
    
    const [documents, countResult] = await Promise.all([
      pool.query(query, [idAreaMesaPartes, limit, offset]),
      pool.query(countQuery, [idAreaMesaPartes])
    ]);
    
    return res.status(200).json({
      success: true,
      data: documents.rows,
      count: parseInt(countResult.rows[0].total),
      message: 'Documentos en proceso obtenidos correctamente'
    });
  } catch (error) {
    logger.error('Error al obtener documentos en proceso', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener documentos en proceso',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Listar documentos completados en Mesa de Partes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getDocumentosCompletados = async (req, res) => {
  try {
    const { limit = 10, offset = 0, fechaInicio, fechaFin } = req.query;
    const idAreaMesaPartes = process.env.ID_AREA_MESA_PARTES || 1; // ID del área de Mesa de Partes
    
    let query = `
      SELECT d.id, d.codigo, d.asunto, d.fechaRegistro, d.estado,
             d.prioridad, d.observaciones, d.idAreaDestino, a.nombre as areaDestinoNombre,
             d.fechaActualizacion, d.tipoDocumento, d.fechaFinalizacion
      FROM documentos d
      LEFT JOIN areas a ON d.idAreaDestino = a.id
      WHERE d.idArea = $1 AND d.estado = 'completado'
    `;
    
    const queryParams = [idAreaMesaPartes];
    let paramCounter = 2;
    
    if (fechaInicio) {
      query += ` AND d.fechaFinalizacion >= $${paramCounter++}`;
      queryParams.push(fechaInicio);
    }
    
    if (fechaFin) {
      query += ` AND d.fechaFinalizacion <= $${paramCounter++}`;
      queryParams.push(fechaFin);
    }
    
    query += ` ORDER BY d.fechaFinalizacion DESC LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
    queryParams.push(limit, offset);
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM documentos d
      WHERE d.idArea = $1 AND d.estado = 'completado'
      ${fechaInicio ? ` AND d.fechaFinalizacion >= $2` : ''}
      ${fechaFin ? ` AND d.fechaFinalizacion <= $${fechaInicio ? 3 : 2}` : ''}
    `;
    
    const countParams = [idAreaMesaPartes];
    if (fechaInicio) countParams.push(fechaInicio);
    if (fechaFin) countParams.push(fechaFin);
    
    const [documents, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams)
    ]);
    
    return res.status(200).json({
      success: true,
      data: documents.rows,
      count: parseInt(countResult.rows[0].total),
      message: 'Documentos completados obtenidos correctamente'
    });
  } catch (error) {
    logger.error('Error al obtener documentos completados', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al obtener documentos completados',
      error: 'Error en el servidor'
    });
  }
};

/**
 * Registrar nuevo expediente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const registrarExpediente = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      asunto, 
      tipoDocumento, 
      idRemitente, 
      nombreRemitente, 
      idAreaDestino, 
      observaciones, 
      prioridad = 'media'
    } = req.body;
    
    // Validación básica
    if (!asunto || !tipoDocumento || !idAreaDestino) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios (asunto, tipoDocumento, idAreaDestino)'
      });
    }
    
    // Verificar que el área de destino existe
    const areaQuery = 'SELECT id FROM areas WHERE id = $1';
    const areaResult = await client.query(areaQuery, [idAreaDestino]);
    
    if (areaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'El área de destino especificada no existe'
      });
    }
    
    const idAreaMesaPartes = process.env.ID_AREA_MESA_PARTES || 1; // ID del área de Mesa de Partes
    
    // Generar código único para el expediente
    const codigo = await generarCodigoExpediente(client);
    
    // Insertar el documento
    const insertQuery = `
      INSERT INTO documentos 
        (codigo, asunto, tipoDocumento, idRemitente, nombreRemitente, idArea, 
         idAreaDestino, observaciones, prioridad, estado, fechaRegistro, creadoPor)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
      RETURNING id, codigo, asunto, tipoDocumento, fechaRegistro, estado, prioridad
    `;
    
    const insertResult = await client.query(insertQuery, [
      codigo,
      asunto,
      tipoDocumento,
      idRemitente || null,
      nombreRemitente || null,
      idAreaMesaPartes,
      idAreaDestino,
      observaciones || '',
      prioridad,
      'recibido',
      req.user.id
    ]);
    
    const documentoId = insertResult.rows[0].id;
    
    // Procesar archivos adjuntos si existen
    if (req.files && req.files.length > 0) {
      const archivosQuery = `
        INSERT INTO documentos_archivos
          (idDocumento, nombreArchivo, rutaArchivo, tipoArchivo, tamanio, creadoPor)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING id, nombreArchivo
      `;
      
      const archivosPromises = req.files.map(async (file) => {
        // Generar ruta para guardar el archivo
        const rutaArchivo = generateLocalPath(documentoId, file.originalname);
        
        // Guardar archivo físicamente
        await storeFile(file, rutaArchivo);
        
        // Guardar registro en la base de datos
        return client.query(archivosQuery, [
          documentoId,
          file.originalname,
          rutaArchivo,
          file.mimetype,
          file.size,
          req.user.id
        ]);
      });
      
      await Promise.all(archivosPromises);
    }
    
    // Registrar en la trazabilidad
    const trazabilidadQuery = `
      INSERT INTO documentos_trazabilidad
        (idDocumento, idAreaOrigen, idAreaDestino, accion, observaciones, creadoPor)
      VALUES
        ($1, $2, $3, $4, $5, $6)
    `;
    
    await client.query(trazabilidadQuery, [
      documentoId,
      idAreaMesaPartes,
      idAreaDestino,
      'registro',
      `Expediente registrado en Mesa de Partes con código ${codigo}`,
      req.user.id
    ]);
    
    await client.query('COMMIT');
    
    logger.info('Expediente registrado', { 
      id: documentoId, 
      codigo, 
      asunto,
      usuario: req.user.id 
    });
    
    return res.status(201).json({
      success: true,
      data: insertResult.rows[0],
      message: 'Expediente registrado correctamente'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    
    logger.error('Error al registrar expediente', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al registrar expediente',
      error: 'Error en el servidor'
    });
  } finally {
    client.release();
  }
};

/**
 * Actualizar expediente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const actualizarExpediente = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { 
      asunto, 
      observaciones,
      prioridad,
      estado
    } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de documento inválido'
      });
    }
    
    // Verificar que el documento existe y pertenece a Mesa de Partes
    const idAreaMesaPartes = process.env.ID_AREA_MESA_PARTES || 1;
    
    const docQuery = `
      SELECT id, estado FROM documentos 
      WHERE id = $1 AND idArea = $2
    `;
    
    const docResult = await client.query(docQuery, [id, idAreaMesaPartes]);
    
    if (docResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado o no pertenece a Mesa de Partes'
      });
    }
    
    // Verificar estado actual
    const estadoActual = docResult.rows[0].estado;
    if (estadoActual === 'completado' || estadoActual === 'archivado') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `No se puede actualizar un documento en estado ${estadoActual}`
      });
    }
    
    // Construir la consulta de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCounter = 1;
    
    if (asunto !== undefined) {
      updates.push(`asunto = $${paramCounter++}`);
      values.push(asunto);
    }
    
    if (observaciones !== undefined) {
      updates.push(`observaciones = $${paramCounter++}`);
      values.push(observaciones);
    }
    
    if (prioridad !== undefined) {
      updates.push(`prioridad = $${paramCounter++}`);
      values.push(prioridad);
    }
    
    if (estado !== undefined && ['recibido', 'en_proceso', 'completado'].includes(estado)) {
      updates.push(`estado = $${paramCounter++}`);
      values.push(estado);
      
      // Si se está completando, registrar fecha de finalización
      if (estado === 'completado' && estadoActual !== 'completado') {
        updates.push(`fechaFinalizacion = NOW()`);
      }
    }
    
    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }
    
    // Agregar el ID al final de los valores
    values.push(id);
    
    const updateQuery = `
      UPDATE documentos 
      SET ${updates.join(', ')}, fechaActualizacion = NOW()
      WHERE id = $${paramCounter}
      RETURNING id, codigo, asunto, estado, prioridad, observaciones, fechaActualizacion
    `;
    
    const updateResult = await client.query(updateQuery, values);
    
    // Registrar en la trazabilidad
    const trazabilidadQuery = `
      INSERT INTO documentos_trazabilidad
        (idDocumento, idAreaOrigen, accion, observaciones, creadoPor)
      VALUES
        ($1, $2, $3, $4, $5)
    `;
    
    await client.query(trazabilidadQuery, [
      id,
      idAreaMesaPartes,
      'actualizacion',
      `Expediente actualizado en Mesa de Partes: ${updates.join(', ')}`,
      req.user.id
    ]);
    
    // Procesar archivos adjuntos si existen
    if (req.files && req.files.length > 0) {
      const archivosQuery = `
        INSERT INTO documentos_archivos
          (idDocumento, nombreArchivo, rutaArchivo, tipoArchivo, tamanio, creadoPor)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING id, nombreArchivo
      `;
      
      const archivosPromises = req.files.map(async (file) => {
        // Generar ruta para guardar el archivo
        const rutaArchivo = generateLocalPath(id, file.originalname);
        
        // Guardar archivo físicamente
        await storeFile(file, rutaArchivo);
        
        // Guardar registro en la base de datos
        return client.query(archivosQuery, [
          id,
          file.originalname,
          rutaArchivo,
          file.mimetype,
          file.size,
          req.user.id
        ]);
      });
      
      await Promise.all(archivosPromises);
    }
    
    await client.query('COMMIT');
    
    logger.info('Expediente actualizado', { 
      id, 
      datosActualizados: updates.join(', '),
      usuario: req.user.id 
    });
    
    return res.status(200).json({
      success: true,
      data: updateResult.rows[0],
      message: 'Expediente actualizado correctamente'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    
    logger.error('Error al actualizar expediente', { 
      id: req.params.id, 
      error: error.message, 
      stack: error.stack 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar expediente',
      error: 'Error en el servidor'
    });
  } finally {
    client.release();
  }
};

/**
 * Derivar expediente a otra área
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const derivarExpediente = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { 
      idAreaDestino, 
      observaciones, 
      prioridad
    } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de documento inválido'
      });
    }
    
    if (!idAreaDestino) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere especificar el área de destino'
      });
    }
    
    // Verificar que el área de destino existe
    const areaQuery = 'SELECT id FROM areas WHERE id = $1';
    const areaResult = await client.query(areaQuery, [idAreaDestino]);
    
    if (areaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'El área de destino especificada no existe'
      });
    }
    
    // Verificar que el documento existe y pertenece a Mesa de Partes
    const idAreaMesaPartes = process.env.ID_AREA_MESA_PARTES || 1;
    
    const docQuery = `
      SELECT id, estado, idAreaDestino FROM documentos 
      WHERE id = $1 AND idArea = $2
    `;
    
    const docResult = await client.query(docQuery, [id, idAreaMesaPartes]);
    
    if (docResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado o no pertenece a Mesa de Partes'
      });
    }
    
    // Verificar estado actual
    const estadoActual = docResult.rows[0].estado;
    if (estadoActual === 'completado' || estadoActual === 'archivado') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `No se puede derivar un documento en estado ${estadoActual}`
      });
    }
    
    // Verificar que no se esté derivando al mismo área que ya es destino
    const idAreaDestinoActual = docResult.rows[0].idAreaDestino;
    if (idAreaDestinoActual === idAreaDestino) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'El documento ya está asignado a esta área'
      });
    }
    
    // Actualizar el documento
    const updateQuery = `
      UPDATE documentos 
      SET idAreaDestino = $1, 
          prioridad = COALESCE($2, prioridad),
          observaciones = COALESCE($3, observaciones),
          estado = 'en_proceso',
          fechaActualizacion = NOW()
      WHERE id = $4
      RETURNING id, codigo, asunto, estado, prioridad, idAreaDestino, fechaActualizacion
    `;
    
    const updateResult = await client.query(updateQuery, [
      idAreaDestino,
      prioridad,
      observaciones,
      id
    ]);
    
    // Registrar en la trazabilidad
    const trazabilidadQuery = `
      INSERT INTO documentos_trazabilidad
        (idDocumento, idAreaOrigen, idAreaDestino, accion, observaciones, creadoPor)
      VALUES
        ($1, $2, $3, $4, $5, $6)
    `;
    
    await client.query(trazabilidadQuery, [
      id,
      idAreaMesaPartes,
      idAreaDestino,
      'derivacion',
      observaciones || 'Expediente derivado',
      req.user.id
    ]);
    
    // Procesar archivos adjuntos si existen
    if (req.files && req.files.length > 0) {
      const archivosQuery = `
        INSERT INTO documentos_archivos
          (idDocumento, nombreArchivo, rutaArchivo, tipoArchivo, tamanio, creadoPor)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING id, nombreArchivo
      `;
      
      const archivosPromises = req.files.map(async (file) => {
        // Generar ruta para guardar el archivo
        const rutaArchivo = generateLocalPath(id, file.originalname);
        
        // Guardar archivo físicamente
        await storeFile(file, rutaArchivo);
        
        // Guardar registro en la base de datos
        return client.query(archivosQuery, [
          id,
          file.originalname,
          rutaArchivo,
          file.mimetype,
          file.size,
          req.user.id
        ]);
      });
      
      await Promise.all(archivosPromises);
    }
    
    await client.query('COMMIT');
    
    logger.info('Expediente derivado', { 
      id, 
      idAreaDestino,
      prioridad,
      usuario: req.user.id 
    });
    
    return res.status(200).json({
      success: true,
      data: updateResult.rows[0],
      message: 'Expediente derivado correctamente'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    
    logger.error('Error al derivar expediente', { 
      id: req.params.id, 
      error: error.message, 
      stack: error.stack 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Error al derivar expediente',
      error: 'Error en el servidor'
    });
  } finally {
    client.release();
  }
};

/**
 * Exportar listado de documentos
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const exportarDocumentos = async (req, res) => {
  try {
    const { formato = 'excel', fechaInicio, fechaFin, estado } = req.query;
    const idAreaMesaPartes = process.env.ID_AREA_MESA_PARTES || 1; // ID del área de Mesa de Partes
    
    if (!['excel', 'pdf'].includes(formato)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de exportación inválido. Debe ser "excel" o "pdf"'
      });
    }
    
    let query = `
      SELECT d.id, d.codigo, d.asunto, d.tipoDocumento, d.fechaRegistro, 
             d.estado, d.prioridad, a.nombre as areaDestino,
             d.fechaActualizacion, COALESCE(d.fechaFinalizacion, NULL) as fechaFinalizacion
      FROM documentos d
      LEFT JOIN areas a ON d.idAreaDestino = a.id
      WHERE d.idArea = $1
    `;
    
    const queryParams = [idAreaMesaPartes];
    let paramCounter = 2;
    
    if (estado) {
      query += ` AND d.estado = $${paramCounter++}`;
      queryParams.push(estado);
    }
    
    if (fechaInicio) {
      query += ` AND d.fechaRegistro >= $${paramCounter++}`;
      queryParams.push(fechaInicio);
    }
    
    if (fechaFin) {
      query += ` AND d.fechaRegistro <= $${paramCounter++}`;
      queryParams.push(fechaFin);
    }
    
    query += ` ORDER BY d.fechaRegistro DESC`;
    
    const result = await pool.query(query, queryParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron documentos para exportar'
      });
    }
    
    const documentos = result.rows;
    const nombreArchivo = `mesa_partes_documentos_${new Date().toISOString().split('T')[0]}`;
    const columnas = [
      { header: 'Código', key: 'codigo', width: 15 },
      { header: 'Asunto', key: 'asunto', width: 40 },
      { header: 'Tipo', key: 'tipoDocumento', width: 15 },
      { header: 'Fecha Registro', key: 'fechaRegistro', width: 20 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: 'Prioridad', key: 'prioridad', width: 10 },
      { header: 'Área Destino', key: 'areaDestino', width: 30 },
      { header: 'Fecha Finalización', key: 'fechaFinalizacion', width: 20 }
    ];
    
    let archivoBuffer;
    let tipoContenido;
    
    if (formato === 'excel') {
      archivoBuffer = await exportToExcel(documentos, columnas, 'Documentos Mesa de Partes');
      tipoContenido = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else { // pdf
      archivoBuffer = await exportToPdf(documentos, columnas, 'Documentos Mesa de Partes');
      tipoContenido = 'application/pdf';
    }
    
    res.setHeader('Content-Type', tipoContenido);
    res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}.${formato === 'excel' ? 'xlsx' : 'pdf'}`);
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    logger.info('Exportación de documentos de Mesa de Partes', {
      formato,
      cantidad: documentos.length,
      usuario: req.user.id
    });
    
    return res.send(archivoBuffer);
  } catch (error) {
    logger.error('Error al exportar documentos', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Error al exportar documentos',
      error: 'Error en el servidor'
    });
  }
};

module.exports = {
  getDocumentosRecibidos,
  getDocumentosEnProceso,
  getDocumentosCompletados,
  registrarExpediente,
  actualizarExpediente,
  derivarExpediente,
  exportarDocumentos
}; 