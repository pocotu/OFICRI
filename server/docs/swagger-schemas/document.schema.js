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
 *         id:
 *           type: integer
 *           description: ID del documento
 *         code:
 *           type: string
 *           description: Código único del documento
 *         title:
 *           type: string
 *           description: Título del documento
 *         description:
 *           type: string
 *           description: Descripción del documento
 *         status:
 *           type: string
 *           enum: [PENDING, IN_PROCESS, COMPLETED, REJECTED]
 *           description: Estado del documento
 *         type:
 *           type: string
 *           description: Tipo de documento
 *         area:
 *           type: string
 *           description: Área responsable
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       required:
 *         - code
 *         - title
 *         - status
 *         - type
 *         - area
 * 
 *     CreateDocumentRequest:
 *       type: object
 *       required:
 *         - title
 *         - type
 *         - sender
 *         - receiver
 *         - area
 *       properties:
 *         title:
 *           type: string
 *           example: "Solicitud de Certificado"
 *         description:
 *           type: string
 *           example: "Solicitud de certificado de estudios"
 *         type:
 *           type: string
 *           example: "SOLICITUD"
 *         priority:
 *           type: string
 *           example: "NORMAL"
 *         sender:
 *           type: object
 *           required:
 *             - name
 *             - documentType
 *             - documentNumber
 *           properties:
 *             name:
 *               type: string
 *               example: "Juan Pérez"
 *             documentType:
 *               type: string
 *               example: "DNI"
 *             documentNumber:
 *               type: string
 *               example: "12345678"
 *         receiver:
 *           type: object
 *           required:
 *             - name
 *             - documentType
 *             - documentNumber
 *           properties:
 *             name:
 *               type: string
 *               example: "María García"
 *             documentType:
 *               type: string
 *               example: "DNI"
 *             documentNumber:
 *               type: string
 *               example: "87654321"
 *         area:
 *           type: string
 *           example: "MESA DE PARTES"
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo adjunto
 * 
 *     UpdateDocumentRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "Solicitud de Certificado"
 *         description:
 *           type: string
 *           example: "Solicitud de certificado de estudios"
 *         type:
 *           type: string
 *           example: "SOLICITUD"
 *         priority:
 *           type: string
 *           example: "NORMAL"
 *         status:
 *           type: string
 *           example: "EN PROCESO"
 *         assignedTo:
 *           type: integer
 *           example: 3
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo adjunto
 * 
 *     DocumentListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Document'
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