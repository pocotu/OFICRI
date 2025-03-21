/**
 * Esquemas Swagger para el dashboard
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Dashboard:
 *       type: object
 *       properties:
 *         totalDocuments:
 *           type: integer
 *           description: Total de documentos en el sistema
 *         pendingDocuments:
 *           type: integer
 *           description: Documentos pendientes de revisión
 *         processedDocuments:
 *           type: integer
 *           description: Documentos procesados
 *         recentDocuments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Document'
 *         statistics:
 *           type: object
 *           properties:
 *             byStatus:
 *               type: object
 *               description: Documentos por estado
 *             byArea:
 *               type: object
 *               description: Documentos por área
 *             byUser:
 *               type: object
 *               description: Documentos por usuario
 *       required:
 *         - totalDocuments
 *         - pendingDocuments
 *         - processedDocuments
 *         - recentDocuments
 *         - statistics
 */

module.exports = {}; 