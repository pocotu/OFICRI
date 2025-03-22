/**
 * Document Routes
 * Implementa endpoints para la gestión de documentos
 * API conforme a ISO/IEC 27001
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configuración de multer para carga de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/documents');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Límites para la carga de archivos
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 5 // máximo 5 archivos por solicitud
  },
  fileFilter: function (req, file, cb) {
    // Filtrar tipos de archivo permitidos
    if (file.mimetype.startsWith('application/pdf') || 
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('application/msword') ||
        file.mimetype.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
        file.mimetype.startsWith('application/vnd.ms-excel') ||
        file.mimetype.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  }
});

// Import controllers
const documentController = require('../controllers/document.controller');

// Import middleware
const { verifyToken, validatePermissions } = require('../middleware/auth');
const { validateSchema } = require('../middleware/validation');
const { documentoSchema, derivacionSchema } = require('../middleware/validation/documento.validator');

/**
 * @swagger
 * /api/documentos:
 *   get:
 *     summary: Listar todos los documentos
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página de resultados
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de resultados por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por título o contenido
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [RECIBIDO, EN_PROCESO, COMPLETADO]
 *         description: Filtrar por estado del documento
 *     responses:
 *       200:
 *         description: Lista paginada de documentos
 *       403:
 *         description: No tiene permisos para ver documentos
 *       500:
 *         description: Error del servidor
 */
router.get('/', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  documentController.listarDocumentos
);

/**
 * @swagger
 * /api/documentos/{id}:
 *   get:
 *     summary: Obtener un documento por ID
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento
 *     responses:
 *       200:
 *         description: Datos del documento
 *       403:
 *         description: No tiene permisos para ver este documento
 *       404:
 *         description: Documento no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  documentController.obtenerDocumento
);

/**
 * @swagger
 * /api/documentos:
 *   post:
 *     summary: Crear un nuevo documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - idTipoDocumento
 *               - contenido
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título del documento
 *               idTipoDocumento:
 *                 type: integer
 *                 description: ID del tipo de documento
 *               contenido:
 *                 type: string
 *                 description: Contenido o descripción del documento
 *               idArea:
 *                 type: integer
 *                 description: ID del área destinataria (opcional)
 *               prioridad:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *                 description: Prioridad (1=Alta, 2=Media, 3=Baja)
 *               fechaVencimiento:
 *                 type: string
 *                 format: date
 *                 description: Fecha de vencimiento (opcional)
 *               archivos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Archivos adjuntos (máximo 5)
 *     responses:
 *       201:
 *         description: Documento creado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para crear documentos
 *       500:
 *         description: Error del servidor
 */
router.post('/', 
  verifyToken, 
  validatePermissions(1), // bit 0 (Crear)
  upload.array('archivos', 5),
  validateSchema(documentoSchema),
  documentController.crearDocumento
);

/**
 * @swagger
 * /api/documentos/{id}:
 *   put:
 *     summary: Actualizar un documento
 *     tags: [Documentos]
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
 *               titulo:
 *                 type: string
 *                 description: Título del documento
 *               idTipoDocumento:
 *                 type: integer
 *                 description: ID del tipo de documento
 *               contenido:
 *                 type: string
 *                 description: Contenido o descripción del documento
 *               prioridad:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *                 description: Prioridad (1=Alta, 2=Media, 3=Baja)
 *               fechaVencimiento:
 *                 type: string
 *                 format: date
 *                 description: Fecha de vencimiento (opcional)
 *               archivos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Nuevos archivos adjuntos (máximo 5)
 *     responses:
 *       200:
 *         description: Documento actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para editar este documento
 *       404:
 *         description: Documento no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', 
  verifyToken, 
  validatePermissions(2), // bit 1 (Editar)
  upload.array('archivos', 5),
  validateSchema(documentoSchema),
  documentController.actualizarDocumento
);

/**
 * @swagger
 * /api/documentos/{id}:
 *   delete:
 *     summary: Eliminar un documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento
 *     responses:
 *       200:
 *         description: Documento eliminado correctamente
 *       403:
 *         description: No tiene permisos para eliminar este documento
 *       404:
 *         description: Documento no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', 
  verifyToken, 
  validatePermissions(4), // bit 2 (Eliminar)
  documentController.eliminarDocumento
);

/**
 * @swagger
 * /api/documentos/{id}/derivar:
 *   post:
 *     summary: Derivar un documento a otra área
 *     tags: [Documentos]
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idAreaDestino
 *               - observaciones
 *             properties:
 *               idAreaDestino:
 *                 type: integer
 *                 description: ID del área de destino
 *               observaciones:
 *                 type: string
 *                 description: Observaciones de la derivación
 *     responses:
 *       200:
 *         description: Documento derivado correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos para derivar documentos
 *       404:
 *         description: Documento no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/:id/derivar', 
  verifyToken, 
  validatePermissions(16), // bit 4 (Derivar)
  validateSchema(derivacionSchema),
  documentController.derivarDocumento
);

/**
 * @swagger
 * /api/documentos/{id}/archivos/{archivoId}:
 *   get:
 *     summary: Descargar un archivo de un documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento
 *       - in: path
 *         name: archivoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del archivo
 *     responses:
 *       200:
 *         description: Archivo descargado correctamente
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: No tiene permisos para descargar este archivo
 *       404:
 *         description: Archivo no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id/archivos/:archivoId', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  documentController.descargarArchivo
);

/**
 * @swagger
 * /api/documentos/{id}/archivos/{archivoId}:
 *   delete:
 *     summary: Eliminar un archivo de un documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento
 *       - in: path
 *         name: archivoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del archivo
 *     responses:
 *       200:
 *         description: Archivo eliminado correctamente
 *       403:
 *         description: No tiene permisos para eliminar este archivo
 *       404:
 *         description: Archivo no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id/archivos/:archivoId', 
  verifyToken, 
  validatePermissions(4), // bit 2 (Eliminar)
  documentController.eliminarArchivo
);

/**
 * @swagger
 * /api/documentos/{id}/historial:
 *   get:
 *     summary: Obtener el historial de un documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento
 *     responses:
 *       200:
 *         description: Historial del documento
 *       403:
 *         description: No tiene permisos para ver el historial
 *       404:
 *         description: Documento no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id/historial', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  documentController.obtenerHistorialDocumento
);

/**
 * @swagger
 * /api/documentos/exportar:
 *   get:
 *     summary: Exportar documentos en formato Excel o PDF
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: formato
 *         required: true
 *         schema:
 *           type: string
 *           enum: [excel, pdf]
 *         description: Formato de exportación
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [RECIBIDO, EN_PROCESO, COMPLETADO]
 *         description: Filtrar por estado del documento
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio para filtrar
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin para filtrar
 *     responses:
 *       200:
 *         description: Archivo exportado correctamente
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
 *       500:
 *         description: Error del servidor
 */
router.get('/exportar', 
  verifyToken, 
  validatePermissions(64), // bit 6 (Exportar)
  documentController.exportarDocumentos
);

/**
 * @swagger
 * /api/documentos/papelera:
 *   get:
 *     summary: Listar documentos en papelera
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página de resultados
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de resultados por página
 *     responses:
 *       200:
 *         description: Lista paginada de documentos en papelera
 *       403:
 *         description: No tiene permisos para ver papelera
 *       500:
 *         description: Error del servidor
 */
router.get('/papelera', 
  verifyToken, 
  validatePermissions(8), // bit 3 (Ver)
  documentController.listarDocumentosPapelera
);

/**
 * @swagger
 * /api/documentos/{id}/restaurar:
 *   post:
 *     summary: Restaurar documento desde papelera
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento
 *     responses:
 *       200:
 *         description: Documento restaurado correctamente
 *       403:
 *         description: No tiene permisos para restaurar documentos
 *       404:
 *         description: Documento no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/:id/restaurar', 
  verifyToken, 
  validatePermissions(2), // bit 1 (Editar)
  documentController.restaurarDocumento
);

/**
 * @swagger
 * /api/documentos/{id}/eliminar-permanente:
 *   delete:
 *     summary: Eliminar permanentemente un documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento
 *     responses:
 *       200:
 *         description: Documento eliminado permanentemente
 *       403:
 *         description: No tiene permisos para eliminar permanentemente
 *       404:
 *         description: Documento no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id/eliminar-permanente', 
  verifyToken, 
  validatePermissions(4), // bit 2 (Eliminar)
  documentController.eliminarDocumentoPermanente
);

module.exports = router; 