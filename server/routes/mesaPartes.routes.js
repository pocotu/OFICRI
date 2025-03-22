/**
 * Mesa de Partes Routes
 * Implementa endpoints para la gestión de documentos en la Mesa de Partes
 * API conforme a ISO/IEC 27001
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configuración de multer para manejar archivos
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Máximo 5 archivos
  }
});

// Import controller
const mesaPartesController = require('../controllers/mesaPartes.controller');

// Import middleware
const { verifyToken, validatePermissions } = require('../middleware/auth');
const { validateMultipartRequest } = require('../middleware/validation');

/**
 * @route GET /api/mesa-partes
 * @desc Get all mesas de partes
 * @access Admin, Mesa Partes
 */
router.get('/', 
  verifyToken, 
  validatePermissions(32), // bit 5 (Ver)
  mesaPartesController.getAllMesaPartes
);

/**
 * @route GET /api/mesa-partes/:id
 * @desc Get mesa de partes by ID
 * @access Any authenticated user
 */
router.get('/:id', 
  verifyToken, 
  validatePermissions(32), // bit 5 (Ver)
  mesaPartesController.getMesaPartesById
);

/**
 * @route POST /api/mesa-partes
 * @desc Create new mesa de partes
 * @access Admin, Mesa Partes
 */
router.post('/', 
  verifyToken, 
  validatePermissions(1), // bit 0 (Crear)
  mesaPartesController.createMesaPartes
);

/**
 * @route PUT /api/mesa-partes/:id
 * @desc Update mesa de partes
 * @access Admin, Mesa Partes
 */
router.put('/:id', 
  verifyToken, 
  validatePermissions(2), // bit 1 (Editar)
  mesaPartesController.updateMesaPartes
);

/**
 * @route DELETE /api/mesa-partes/:id
 * @desc Delete mesa de partes
 * @access Admin
 */
router.delete('/:id', 
  verifyToken, 
  validatePermissions(16), // bit 4 (Eliminar)
  mesaPartesController.deleteMesaPartes
);

/**
 * @route GET /api/mesa-partes/pending/documents
 * @desc Get pending documents in mesa de partes
 * @access Admin, Mesa Partes
 */
router.get('/pending/documents', 
  verifyToken, 
  validatePermissions(32), // bit 5 (Ver)
  mesaPartesController.getPendingDocuments
);

/**
 * @route GET /api/mesa-partes/statistics
 * @desc Get mesa de partes statistics
 * @access Any authenticated user
 */
router.get('/statistics', 
  verifyToken, 
  validatePermissions(32), // bit 5 (Ver)
  mesaPartesController.getStatistics
);

/**
 * @swagger
 * /api/mesa-partes/documentos/recibidos:
 *   get:
 *     summary: Listar documentos recibidos por Mesa de Partes
 *     tags: [Mesa de Partes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de documentos por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de documentos a omitir (para paginación)
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial para filtrar documentos
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final para filtrar documentos
 *     responses:
 *       200:
 *         description: Lista paginada de documentos recibidos
 *       403:
 *         description: No tiene permisos para ver documentos
 *       500:
 *         description: Error del servidor
 */
router.get('/documentos/recibidos', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  mesaPartesController.getDocumentosRecibidos
);

/**
 * @swagger
 * /api/mesa-partes/documentos/en-proceso:
 *   get:
 *     summary: Listar documentos en proceso en Mesa de Partes
 *     tags: [Mesa de Partes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de documentos por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de documentos a omitir (para paginación)
 *     responses:
 *       200:
 *         description: Lista paginada de documentos en proceso
 *       403:
 *         description: No tiene permisos para ver documentos
 *       500:
 *         description: Error del servidor
 */
router.get('/documentos/en-proceso', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  mesaPartesController.getDocumentosEnProceso
);

/**
 * @swagger
 * /api/mesa-partes/documentos/completados:
 *   get:
 *     summary: Listar documentos completados en Mesa de Partes
 *     tags: [Mesa de Partes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de documentos por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de documentos a omitir (para paginación)
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial para filtrar documentos
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final para filtrar documentos
 *     responses:
 *       200:
 *         description: Lista paginada de documentos completados
 *       403:
 *         description: No tiene permisos para ver documentos
 *       500:
 *         description: Error del servidor
 */
router.get('/documentos/completados', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  mesaPartesController.getDocumentosCompletados
);

/**
 * @swagger
 * /api/mesa-partes/documentos/registro:
 *   post:
 *     summary: Registrar nuevo expediente
 *     tags: [Mesa de Partes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - asunto
 *               - tipoDocumento
 *               - idAreaDestino
 *             properties:
 *               asunto:
 *                 type: string
 *                 description: Asunto del documento
 *               tipoDocumento:
 *                 type: string
 *                 enum: [oficio, memo, informe, solicitud, otros]
 *                 description: Tipo de documento
 *               idRemitente:
 *                 type: integer
 *                 description: ID del remitente (si es un usuario del sistema)
 *               nombreRemitente:
 *                 type: string
 *                 description: Nombre del remitente (si es externo)
 *               idAreaDestino:
 *                 type: integer
 *                 description: ID del área de destino
 *               observaciones:
 *                 type: string
 *                 description: Observaciones del documento
 *               prioridad:
 *                 type: string
 *                 enum: [alta, media, baja]
 *                 default: media
 *                 description: Prioridad del documento
 *               archivos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Archivos adjuntos (máx. 5 archivos, 10MB c/u)
 *     responses:
 *       201:
 *         description: Expediente registrado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para crear documentos
 *       500:
 *         description: Error del servidor
 */
router.post('/documentos/registro', 
  verifyToken, 
  validatePermissions(1), // bit 0 (Crear)
  upload.array('archivos', 5),
  validateMultipartRequest,
  mesaPartesController.registrarExpediente
);

/**
 * @swagger
 * /api/mesa-partes/documentos/{id}/actualizar:
 *   put:
 *     summary: Actualizar expediente
 *     tags: [Mesa de Partes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               asunto:
 *                 type: string
 *                 description: Asunto del documento
 *               observaciones:
 *                 type: string
 *                 description: Observaciones del documento
 *               prioridad:
 *                 type: string
 *                 enum: [alta, media, baja]
 *                 description: Prioridad del documento
 *               estado:
 *                 type: string
 *                 enum: [recibido, en_proceso, completado]
 *                 description: Estado del documento
 *               archivos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Archivos adjuntos (máx. 5 archivos, 10MB c/u)
 *     responses:
 *       200:
 *         description: Expediente actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para editar documentos
 *       404:
 *         description: Documento no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/documentos/:id/actualizar', 
  verifyToken, 
  validatePermissions(2), // bit 1 (Editar)
  upload.array('archivos', 5),
  validateMultipartRequest,
  mesaPartesController.actualizarExpediente
);

/**
 * @swagger
 * /api/mesa-partes/documentos/{id}/derivar:
 *   post:
 *     summary: Derivar expediente
 *     tags: [Mesa de Partes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - idAreaDestino
 *             properties:
 *               idAreaDestino:
 *                 type: integer
 *                 description: ID del área de destino
 *               observaciones:
 *                 type: string
 *                 description: Observaciones de la derivación
 *               prioridad:
 *                 type: string
 *                 enum: [alta, media, baja]
 *                 description: Prioridad del documento
 *               archivos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Archivos adjuntos (máx. 5 archivos, 10MB c/u)
 *     responses:
 *       200:
 *         description: Expediente derivado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para derivar documentos
 *       404:
 *         description: Documento no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/documentos/:id/derivar', 
  verifyToken, 
  validatePermissions(16), // bit 4 (Derivar)
  upload.array('archivos', 5),
  validateMultipartRequest,
  mesaPartesController.derivarExpediente
);

/**
 * @swagger
 * /api/mesa-partes/documentos/exportar:
 *   get:
 *     summary: Exportar listado de documentos
 *     tags: [Mesa de Partes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: formato
 *         schema:
 *           type: string
 *           enum: [excel, pdf]
 *           default: excel
 *         description: Formato de exportación
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial para filtrar documentos
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final para filtrar documentos
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [recibido, en_proceso, completado, archivado]
 *         description: Estado de los documentos a exportar
 *     responses:
 *       200:
 *         description: Archivo de exportación
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: No tiene permisos para exportar documentos
 *       404:
 *         description: No se encontraron documentos para exportar
 *       500:
 *         description: Error del servidor
 */
router.get('/documentos/exportar', 
  verifyToken, 
  validatePermissions(64), // bit 6 (Exportar)
  mesaPartesController.exportarDocumentos
);

module.exports = router; 