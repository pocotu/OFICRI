/**
 * Document Routes
 * Implements document management endpoints
 * ISO/IEC 27001 compliant API
 */

const express = require('express');
const router = express.Router();

// Import controllers
const documentController = require('../controllers/document.controller');

// Import middleware
const { verifyToken, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { uploadMiddleware } = require('../middleware/file-handler');

// Import validators
const { 
  createDocumentValidator,
  updateDocumentValidator,
  updateStatusValidator,
  deriveDocumentValidator
} = require('../middleware/validation/document.validator');

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Obtener listado de documentos
 *     tags: [Documentos]
 *     description: Retorna una lista paginada de documentos con opciones de filtrado
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de documentos por página
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado de documento
 *       - in: query
 *         name: area
 *         schema:
 *           type: integer
 *         description: Filtrar por área actual
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de documentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     documents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Documento'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', 
  verifyToken, 
  documentController.getAllDocuments
);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Obtener documento por ID
 *     tags: [Documentos]
 *     description: Obtener información detallada de un documento por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DocumentoDetalle'
 *       404:
 *         description: Documento no encontrado
 */
router.get('/:id', 
  verifyToken, 
  documentController.getDocumentById
);

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Crear nuevo documento
 *     tags: [Documentos]
 *     description: Registrar un nuevo documento en el sistema
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentoCreacion'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Documento creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Documento creado exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 123
 *                     nroRegistro:
 *                       type: string
 *                       example: REG-2023-001
 */
router.post('/', 
  verifyToken, 
  validate(createDocumentValidator),
  documentController.createDocument
);

/**
 * @swagger
 * /api/documents/{id}:
 *   put:
 *     summary: Actualizar documento
 *     tags: [Documentos]
 *     description: Actualizar la información de un documento existente
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentoActualizacion'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documento actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Documento actualizado exitosamente
 */
router.put('/:id', 
  verifyToken, 
  validate(updateDocumentValidator),
  documentController.updateDocument
);

/**
 * @swagger
 * /api/documents/{id}/status:
 *   patch:
 *     summary: Actualizar estado de documento
 *     tags: [Documentos]
 *     description: Actualizar el estado de un documento
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [REGISTRADO, EN_PROCESO, OBSERVADO, FINALIZADO, ARCHIVADO, CANCELADO]
 *               observaciones:
 *                 type: string
 *               idUsuarioAsignado:
 *                 type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del documento actualizado exitosamente
 */
router.patch('/:id/status', 
  verifyToken, 
  validate(updateStatusValidator),
  documentController.updateDocumentStatus
);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Eliminar documento
 *     tags: [Documentos]
 *     description: Eliminar un documento del sistema
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documento eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Documento eliminado exitosamente
 *       409:
 *         description: No se puede eliminar el documento porque tiene derivaciones
 */
router.delete('/:id', 
  verifyToken, 
  checkRole(['admin']),
  documentController.deleteDocument
);

/**
 * @swagger
 * /api/documents/{id}/derive:
 *   post:
 *     summary: Derivar documento a otra área
 *     tags: [Documentos]
 *     description: Derivar un documento a otra área especializada
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               areaDestinoId:
 *                 type: integer
 *                 required: true
 *               observaciones:
 *                 type: string
 *               urgente:
 *                 type: boolean
 *                 default: false
 *               motivo:
 *                 type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documento derivado exitosamente
 */
router.post('/:id/derive', 
  verifyToken, 
  validate(deriveDocumentValidator),
  documentController.deriveDocument
);

/**
 * @swagger
 * /api/documents/{id}/history:
 *   get:
 *     summary: Obtener historial de documento
 *     tags: [Documentos]
 *     description: Obtener el historial completo de un documento (derivaciones y cambios de estado)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial del documento
 */
router.get('/:id/history', 
  verifyToken, 
  documentController.getDocumentHistory
);

/**
 * @swagger
 * /api/documents/{id}/attachments:
 *   post:
 *     summary: Subir adjunto a documento
 *     tags: [Documentos]
 *     description: Subir un archivo adjunto al documento
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
 *               file:
 *                 type: string
 *                 format: binary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Archivo adjunto subido exitosamente
 */
router.post('/:id/attachments', 
  verifyToken, 
  uploadMiddleware.single('file'),
  documentController.uploadAttachment
);

/**
 * @swagger
 * /api/documents/{id}/attachments/{attachmentId}:
 *   get:
 *     summary: Descargar adjunto de documento
 *     tags: [Documentos]
 *     description: Descargar un archivo adjunto del documento
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del archivo adjunto
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archivo adjunto
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/attachments/:attachmentId', 
  verifyToken, 
  documentController.downloadAttachment
);

module.exports = router; 