/**
 * Esquemas Swagger para documentos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       properties:
 *         IDDocumento:
 *           type: integer
 *           description: ID del documento
 *         IDMesaPartes:
 *           type: integer
 *           description: ID de la mesa de partes donde se registró
 *         IDAreaActual:
 *           type: integer
 *           description: ID del área actual donde se encuentra el documento
 *         IDUsuarioCreador:
 *           type: integer
 *           description: ID del usuario que creó el documento
 *         IDUsuarioAsignado:
 *           type: integer
 *           description: ID del usuario asignado actualmente
 *         IDDocumentoPadre:
 *           type: integer
 *           nullable: true
 *           description: ID del documento padre (si existe)
 *         NroRegistro:
 *           type: string
 *           description: Número de registro único del documento
 *         NumeroOficioDocumento:
 *           type: string
 *           description: Número de oficio del documento
 *         FechaDocumento:
 *           type: string
 *           format: date
 *           description: Fecha del documento
 *         FechaRegistro:
 *           type: string
 *           format: date-time
 *           description: Fecha de registro del documento
 *         OrigenDocumento:
 *           type: string
 *           enum: [INTERNO, EXTERNO]
 *           description: Origen del documento
 *         Estado:
 *           type: string
 *           enum: [RECIBIDO, EN_PROCESO, COMPLETADO, ARCHIVADO]
 *           description: Estado actual del documento
 *         Observaciones:
 *           type: string
 *           description: Observaciones adicionales
 *         Procedencia:
 *           type: string
 *           description: Procedencia o fuente del documento
 *         Contenido:
 *           type: string
 *           description: Contenido o descripción del documento
 *       required:
 *         - NroRegistro
 *         - NumeroOficioDocumento
 *         - FechaDocumento
 *         - OrigenDocumento
 *         - Estado
 *         - Procedencia
 *         - Contenido
 * 
 *     CreateDocumentRequest:
 *       type: object
 *       required:
 *         - NroRegistro
 *         - NumeroOficioDocumento
 *         - Contenido
 *         - Procedencia
 *       properties:
 *         NroRegistro:
 *           type: string
 *           example: "REG-2023-001"
 *           description: Número de registro único del documento
 *         NumeroOficioDocumento:
 *           type: string
 *           example: "OF-2023-001"
 *           description: Número de oficio del documento
 *         Contenido:
 *           type: string
 *           example: "Solicitud de análisis forense"
 *           description: Contenido o descripción del documento
 *         Procedencia:
 *           type: string
 *           example: "Fiscalía Provincial"
 *           description: Procedencia o fuente del documento
 *         FechaDocumento:
 *           type: string
 *           format: date
 *           example: "2023-05-15"
 *           description: Fecha del documento
 *         OrigenDocumento:
 *           type: string
 *           enum: [INTERNO, EXTERNO]
 *           default: "EXTERNO"
 *           description: Origen del documento
 *         Observaciones:
 *           type: string
 *           example: "Documento recibido en mesa de partes"
 *           description: Observaciones adicionales
 *         IDMesaPartes:
 *           type: integer
 *           example: 1
 *           description: ID de la mesa de partes donde se registra
 *         IDAreaActual:
 *           type: integer
 *           example: 3
 *           description: ID del área actual donde se encuentra el documento
 *         IDDocumentoPadre:
 *           type: integer
 *           nullable: true
 *           description: ID del documento padre (si existe)
 *         Archivos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo adjunto
 * 
 *     UpdateDocumentRequest:
 *       type: object
 *       properties:
 *         NumeroOficioDocumento:
 *           type: string
 *           example: "OF-2023-001"
 *           description: Número de oficio del documento
 *         NroRegistro:
 *           type: string
 *           example: "REG-2023-001"
 *           description: Número de registro único del documento
 *         FechaDocumento:
 *           type: string
 *           format: date
 *           example: "2023-05-15"
 *           description: Fecha del documento
 *         OrigenDocumento:
 *           type: string
 *           enum: [INTERNO, EXTERNO]
 *           example: "EXTERNO"
 *           description: Origen del documento
 *         Estado:
 *           type: string
 *           enum: [RECIBIDO, EN_PROCESO, COMPLETADO, ARCHIVADO]
 *           example: "EN_PROCESO"
 *           description: Estado actual del documento
 *         Observaciones:
 *           type: string
 *           example: "Documento en proceso de análisis"
 *           description: Observaciones adicionales
 *         Procedencia:
 *           type: string
 *           example: "Fiscalía Provincial"
 *           description: Procedencia o fuente del documento
 *         Contenido:
 *           type: string
 *           example: "Solicitud de análisis forense actualizada"
 *           description: Contenido o descripción del documento
 *         IDAreaActual:
 *           type: integer
 *           example: 3
 *           description: ID del área actual donde se encuentra el documento
 *         IDUsuarioAsignado:
 *           type: integer
 *           example: 5
 *           description: ID del usuario asignado actualmente
 *         Archivos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Nuevo archivo adjunto
 * 
 *     DocumentListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             documents:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 *             pagination:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 perPage:
 *                   type: integer
 *                   example: 10
 * 
 *     DocumentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Document'
 */

module.exports = {}; 